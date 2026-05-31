// Граф знаний в answer-pipeline (#8.3).
//
// Обёртка над graphSearchService.search() и graphService.getRelatedNodes().
// Решает, релевантен ли граф структурному вопросу, и форматирует найденные
// факты (узел + его прямые связи) для подмешивания в промпт и в sources.
//
// Граф НЕ модифицируется — только переиспользуются методы чтения.
// Никаких внешних/LLM-вызовов: это локальный SQL (ILIKE + до 3 запросов
// связей). При недоступности Postgres lookup ловит ошибку и возвращает
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
const MAX_NODES = 3;
const MAX_RELATIONS_PER_NODE = 8;
const DEFAULT_SEARCH_LIMIT = 5;

// Правило идентификатор-подобного термина дублирует
// SearchService.identifierTerms() (см.
// apps/kb-api/src/services/searchService.js → normalizeQueryTerms()/
// identifierTerms()): термин считается идентификатором, если содержит
// цифру или дефис. Дублируем здесь намеренно, чтобы не тянуть весь
// SearchService ради одной эвристики.
function extractIdentifierTerms(query) {
  return String(query ?? "")
    .toLowerCase()
    .split(/[^a-z0-9а-яё-]+/i)
    .map((term) => term.trim())
    .filter(Boolean)
    .filter((term) => /\d/.test(term) || term.includes("-"));
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
      const matches = await this.graphSearchService.search(q, { limit });
      const accepted = (Array.isArray(matches) ? matches : []).filter(
        (m) => m && m.node && ACCEPTED_MATCH_FIELDS.has(m.matchedField)
      );

      if (accepted.length === 0) {
        this.logger?.info?.(
          { query: q, identifiers: identifiers.length, matched: 0 },
          "Граф: lookup — точных матчей нет"
        );
        return { used: false, reason: "no_match", facts: [], count: 0 };
      }

      const facts = [];
      for (const match of accepted.slice(0, MAX_NODES)) {
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
        { query: q, matched: accepted.length, accepted: facts.length },
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
