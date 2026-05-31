export const DEFAULT_SYSTEM_PROMPT = `Ты технический ассистент-консультант по рабочим документам АСУ ТП.
Отвечай ТОЛЬКО на основе предоставленных источников. Если в источниках нет ответа — скажи об этом честно, не выдумывай.
Добавляй ссылки на источники в формате [N], где N — номер фрагмента в списке ниже.
Отвечай по-русски, кратко и по делу.

Источники для ответа:
{sources}

Структурные факты из графа знаний:
{graph_facts}
Если по идентификатору (тегу, адресу сигнала, шкафу, плате) есть точный факт в графе знаний — отдавай приоритет этому факту перед похожим текстом из источников. Граф — источник истины для структурных данных.

Последние сообщения чата (для контекста):
{history}

Вопрос пользователя: {question}`;

export function formatSourcesBlock(sources, { limit = 6, snippetMaxLen = 1200 } = {}) {
  if (!Array.isArray(sources) || sources.length === 0) {
    return "Источники не найдены.";
  }
  return sources
    .slice(0, limit)
    .map((source, index) => {
      const lines = [`Источник ${index + 1}:`];
      if (source.title) lines.push(`Заголовок: ${source.title}`);
      if (source.source_path) lines.push(`Путь: ${source.source_path}`);
      if (Array.isArray(source.node_paths) && source.node_paths.length) {
        lines.push(`Разделы: ${source.node_paths.join("; ")}`);
      }
      if (typeof source.page_number === "number") {
        lines.push(`Страница: ${source.page_number}`);
      }
      if (typeof source.text === "string" && source.text.trim()) {
        lines.push(source.text.slice(0, snippetMaxLen));
      }
      return lines.join("\n");
    })
    .join("\n\n---\n\n");
}

// Форматтер блока структурных фактов графа знаний (#8.3). Факты НЕ участвуют
// в RRF-фьюжне (у узлов нет vector/lexical-скоров) и подаются отдельным
// блоком через плейсхолдер {graph_facts}.
export function formatGraphFactsBlock(facts) {
  if (!Array.isArray(facts) || facts.length === 0) {
    return "Структурные факты из графа не найдены.";
  }
  return facts
    .map((fact, index) => {
      const type = fact?.type || "узел";
      const name = fact?.name || "";
      const lines = [`Факт ${index + 1} (граф): ${type} «${name}»`];
      const attrs =
        fact?.attributes && typeof fact.attributes === "object" ? fact.attributes : {};
      const attrPairs = Object.entries(attrs)
        .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
        .map(([k, v]) => `${k}=${String(v).slice(0, 200)}`);
      if (attrPairs.length) {
        lines.push(`Атрибуты: ${attrPairs.join("; ")}`);
      }
      const relations = Array.isArray(fact?.relations) ? fact.relations : [];
      if (relations.length) {
        lines.push("Связи:");
        for (const rel of relations) {
          const target = rel?.targetName ? `«${rel.targetName}»` : "";
          const line = `  - ${rel?.relation || ""} ${rel?.targetType || ""} ${target}`
            .replace(/\s+/g, " ")
            .trimEnd();
          lines.push(line);
        }
      }
      return lines.join("\n");
    })
    .join("\n\n");
}

export function formatHistoryBlock(history) {
  if (!Array.isArray(history) || history.length === 0) {
    return "(нет предыдущих сообщений)";
  }
  return history
    .map((m) => {
      const role = m.role === "assistant" ? "Ассистент" : "Пользователь";
      const content = typeof m.content === "string" ? m.content.slice(0, 1500) : "";
      return `${role}: ${content}`;
    })
    .join("\n\n");
}

export function renderSystemPrompt(template, { sources, question, history, graphFacts } = {}) {
  const tpl = typeof template === "string" && template.length > 0 ? template : DEFAULT_SYSTEM_PROMPT;
  // Плейсхолдер {graph_facts} может отсутствовать в кастомном шаблоне
  // пользователя — тогда граф просто не подмешивается в промпт (но остаётся
  // в sources и metadata). См. предупреждение в UI настроек промпта.
  return tpl
    .replace(/\{sources\}/g, formatSourcesBlock(sources))
    .replace(/\{graph_facts\}/g, formatGraphFactsBlock(graphFacts))
    .replace(/\{history\}/g, formatHistoryBlock(history))
    .replace(/\{question\}/g, typeof question === "string" ? question : "");
}
