// Граф знаний в answer-pipeline (#8.3).
//
// Обёртка над graphSearchService.search() и graphService.getRelatedNodes().
// Решает, релевантен ли граф структурному вопросу, и форматирует найденные
// факты (узел + его прямые связи) для подмешивания в промпт и в sources.
//
// Граф НЕ модифицируется — только переиспользуются методы чтения.
// Никаких внешних/LLM-вызовов: это локальный SQL (ILIKE + до MAX_NODES
// запросов связей). При недоступности Postgres lookup ловит ошибку и возвращает
// used:false — RAG-ответ при этом не падает.

// Допустимые поля матча — только точные структурные поля узлов.
// Прочие attribute-матчи (описания, комментарии и т.п.) игнорируются как
// шумные: они не дают «точного факта по идентификатору».
const ACCEPTED_MATCH_FIELDS = new Set([
  "name",
  "tag",
  "loop_tag",
  "signal_address",
  "address",
  "cabinet_id",
]);

// Приоритет типов узлов при адресном кластере (#8.3 — фикс потери сигналов).
// graphSearchService отдаёт матчи в порядке приоритета поля (name → type →
// attributes), поэтому при адресном вопросе card/channel (матч по name) идут
// выше сигнала (матч по address-атрибуту) и вытесняют его из лимита. Этот
// массив переупорядочивает принятые матчи ПО ЦЕННОСТИ ТИПА для структурных
// вопросов: «что физически подключено» (signal/device) важнее носителя
// (card/channel) и места (station/cabinet/object). Чем меньше индекс — тем
// выше приоритет; типы вне списка получают наименьший приоритет (идут в хвост).
const NODE_TYPE_PRIORITY = [
  "signal",
  "device",
  "card",
  "channel",
  "station",
  "cabinet",
  "object",
];

// Русификация типов связей. Зеркало EDGE_TYPE_LABELS из
// routes/uiV2Graph.js (там словарь живёт внутри клиентского кода и для
// серверного форматтера недоступен). Если связь не в словаре — показываем
// сырой relation.
const RELATION_LABELS_RU = {
  installed_in: "Установлен в",
  has_channel: "Содержит канал",
  connected_to: "Подключён к",
  measures: "Измеряет",
  described_in: "Описан в",
  relates_to: "Относится к",
  resolves: "Устраняет",
  located_at: "Находится на",
};

// Не раздуваем промпт: максимум узлов в ответе и связей на узел.
// MAX_NODES = 6: один адрес даёт кластер card+channel+signal (3 узла), а
// запрос может содержать несколько идентификаторов — 6 покрывают полный
// кластер одного адреса с запасом, не раздувая промпт (узлы компактны, связи
// лимитированы MAX_RELATIONS_PER_NODE).
const MAX_NODES = 6;
const MAX_RELATIONS_PER_NODE = 8;
const DEFAULT_SEARCH_LIMIT = 5;

// Составной адрес — последовательность из 2+ числовых групп через двоеточие
// ИЛИ точку: «3:0:0:3», «2.0.4.6», «2:0:2:6», «3:0:3:0». Распознаётся ДО
// общего split, иначе двоеточие/точка (они не входят в класс
// [a-z0-9а-яё_-]) раздробили бы адрес на одиночные цифры «3»,«0»,«0»,«3» —
// и в graph-search ушли бы осколки, цепляющие случайные узлы из чужих
// адресов вместо точного матча по полю address (#8.3.4).
const ADDRESS_PATTERN = /\d+(?:[:.]\d+)+/g;

// Правило идентификатор-подобного термина дублирует
// SearchService.identifierTerms() (см.
// apps/kb-api/src/services/searchService.js → normalizeQueryTerms()/
// identifierTerms()): термин считается идентификатором, если содержит
// цифру или дефис. Дублируем здесь намеренно, чтобы не тянуть весь
// SearchService ради одной эвристики.
//
// Порядок: сначала вытаскиваем составные адреса целиком, затем из остатка
// строки извлекаем обычные термины прежним правилом split по
// [^a-z0-9а-яё_-]+. Подчёркивание добавлено в класс, чтобы составные теги
// вроде «K1_APK100» / «K1_DP5PP103» не дробились на «k1» + хвост. Результаты
// объединяются с дедупом и сохранением порядка (адреса — первыми, как самые
// специфичные).
function extractIdentifierTerms(query) {
  const raw = String(query ?? "").toLowerCase();
  const addresses = raw.match(ADDRESS_PATTERN) || [];
  // Убираем распознанные адреса из строки, чтобы split не дробил их по
  // двоеточию/точке на одиночные цифры.
  const rest = raw.replace(ADDRESS_PATTERN, " ");
  const restTerms = rest
    .split(/[^a-z0-9а-яё_-]+/i)
    .map((term) => term.trim())
    .filter(Boolean)
    .filter((term) => /\d/.test(term) || term.includes("-"));

  const out = [];
  const seen = new Set();
  for (const term of [...addresses, ...restTerms]) {
    if (seen.has(term)) continue;
    seen.add(term);
    out.push(term);
  }
  return out;
}

export class GraphAnswerService {
  constructor({ graphSearchService, graphService, logger } = {}) {
    this.graphSearchService = graphSearchService ?? null;
    this.graphService = graphService ?? null;
    this.logger = logger ?? null;
  }

  relationLabel(relation) {
    const code = String(relation ?? "").trim();
    if (!code) return "";
    return RELATION_LABELS_RU[code] || code;
  }

  // Главный вход: по вопросу решает, нужен ли граф, и возвращает факты.
  // Контракт:
  //   { used:false, reason:"no_identifier", facts:[], count:0 } — нет идентификаторов;
  //   { used:false, reason:"no_match",      facts:[], count:0 } — нет точных матчей;
  //   { used:false, reason:"error",         facts:[], count:0 } — сбой графа (мягкий);
  //   { used:true,  reason:"ok", facts:[...], count:N }         — факты найдены.
  async lookup(query, { limit = DEFAULT_SEARCH_LIMIT } = {}) {
    const q = String(query ?? "").trim();
    if (!q) {
      return { used: false, reason: "no_identifier", facts: [], count: 0 };
    }

    const identifiers = extractIdentifierTerms(q);
    if (identifiers.length === 0) {
      // RAG-only вопросы графом не зашумляются.
      return { used: false, reason: "no_identifier", facts: [], count: 0 };
    }

    if (!this.graphSearchService || !this.graphService) {
      return { used: false, reason: "no_match", facts: [], count: 0 };
    }

    try {
      // Ищем по каждому ОЧИЩЕННОМУ идентификатор-термину, а не по сырому
      // запросу. extractIdentifierTerms() уже срезал пунктуацию тем же
      // правилом, что searchService.normalizeQueryTerms() (split по
      // [^a-z0-9а-яё-]+), поэтому «TT-133?» → «tt-133». Поиск по сырому
      // запросу с прилипшим знаком препинания не матчил ILIKE (#8.3-fix).
      // Собираем заметно больше MAX_NODES (до MAX_NODES * 4), чтобы матч из
      // «хвоста» выдачи graph-search (например, сигнал по address-атрибуту,
      // идущий после card/channel по name) успел попасть в пул ДО сортировки
      // по приоритету типа. Ранний break по MAX_NODES обрезал бы сигнал
      // раньше, чем сортировка подняла бы его наверх (#8.3).
      const COLLECT_LIMIT = MAX_NODES * 4;
      const seen = new Set();
      const accepted = [];
      let totalMatches = 0;
      for (const term of identifiers) {
        const matches = await this.graphSearchService.search(term, { limit });
        const list = Array.isArray(matches) ? matches : [];
        totalMatches += list.length;
        for (const m of list) {
          if (!m || !m.node || !ACCEPTED_MATCH_FIELDS.has(m.matchedField)) continue;
          if (seen.has(m.node.id)) continue;
          seen.add(m.node.id);
          accepted.push(m);
        }
        // Достаточно кандидатов для сортировки — лишние термины не ищем.
        if (accepted.length >= COLLECT_LIMIT) break;
      }

      if (accepted.length === 0) {
        this.logger?.info?.(
          { query: q, identifiers: identifiers.length, matched: totalMatches },
          "Граф: lookup — точных матчей нет"
        );
        return { used: false, reason: "no_match", facts: [], count: 0 };
      }

      // Приоритизация по типу узла ДО применения лимита: signal/device выше
      // card/channel и т.д. Сортировка стабильная (Array.prototype.sort в Node
      // стабилен), поэтому внутри одного типа сохраняется исходный порядок
      // выдачи graph-search. Без этого адресный кластер терял бы сигнал в
      // обрезке по MAX_NODES (#8.3).
      const typeRank = (type) => {
        const idx = NODE_TYPE_PRIORITY.indexOf(String(type ?? ""));
        return idx === -1 ? NODE_TYPE_PRIORITY.length : idx;
      };
      const prioritized = accepted
        .slice()
        .sort((a, b) => typeRank(a.node?.type) - typeRank(b.node?.type));

      const facts = [];
      for (const match of prioritized.slice(0, MAX_NODES)) {
        const node = match.node;
        const relations = await this._loadRelations(node.id);
        facts.push({
          nodeId: node.id,
          type: node.type,
          name: node.name,
          attributes: node.attributes ?? {},
          relations,
          matchedField: match.matchedField,
          origin: "graph",
        });
      }

      this.logger?.info?.(
        { query: q, identifiers: identifiers.length, matched: accepted.length, accepted: facts.length },
        "Граф: lookup принял структурные матчи"
      );

      return { used: true, reason: "ok", facts, count: facts.length };
    } catch (err) {
      // Недоступность Postgres-графа не должна ронять RAG-ответ.
      this.logger?.warn?.(
        { err: err?.message || String(err) },
        "Граф: lookup завершился ошибкой — продолжаем без графа"
      );
      return {
        used: false,
        reason: "error",
        facts: [],
        count: 0,
        error: err?.message || String(err),
      };
    }
  }

  async _loadRelations(nodeId) {
    try {
      const related = await this.graphService.getRelatedNodes(nodeId, {
        direction: "both",
      });
      return (Array.isArray(related) ? related : [])
        .slice(0, MAX_RELATIONS_PER_NODE)
        .map((rel) => ({
          relation: this.relationLabel(rel?.edge?.relation),
          rawRelation: rel?.edge?.relation ?? null,
          direction: rel?.direction ?? null,
          targetType: rel?.node?.type ?? null,
          targetName: rel?.node?.name ?? null,
        }));
    } catch (relErr) {
      this.logger?.warn?.(
        { err: relErr?.message || String(relErr), nodeId },
        "Граф: не удалось получить связи узла"
      );
      return [];
    }
  }

  // Преобразует факт в запись sources с origin:"graph" /
  // resource_type:"graph_node". Поле text используется и в инлайн-fallback,
  // и для отображения сниппета в карточке.
  toSource(fact) {
    const attrs =
      fact && fact.attributes && typeof fact.attributes === "object"
        ? fact.attributes
        : {};
    const attrText = Object.entries(attrs)
      .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
      .map(([k, v]) => `${k}: ${String(v).slice(0, 200)}`)
      .join("; ");
    const relations = Array.isArray(fact?.relations) ? fact.relations : [];
    const relText = relations
      .map((r) =>
        `${r.relation} ${r.targetType || ""} «${r.targetName || ""}»`
          .replace(/\s+/g, " ")
          .trim()
      )
      .filter(Boolean)
      .join("; ");

    const textParts = [`${fact?.type || "узел"}: ${fact?.name || ""}`.trim()];
    if (attrText) textParts.push(attrText);
    if (relText) textParts.push("Связи: " + relText);

    return {
      origin: "graph",
      resource_type: "graph_node",
      graph_node_id: fact?.nodeId ?? null,
      title: fact?.name || fact?.type || "Узел графа",
      graph_type: fact?.type || null,
      graph_attributes: attrs,
      graph_relations: relations,
      text: textParts.join(". "),
    };
  }

  toSources(facts) {
    return (Array.isArray(facts) ? facts : []).map((fact) => this.toSource(fact));
  }
}
