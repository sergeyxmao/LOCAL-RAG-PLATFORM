export const DEFAULT_SYSTEM_PROMPT = `Ты технический ассистент-консультант по рабочим документам АСУ ТП.
Отвечай ТОЛЬКО на основе предоставленных источников. Если в источниках нет ответа — скажи об этом честно, не выдумывай.
Добавляй ссылки на источники в формате [N], где N — номер фрагмента в списке ниже.
Отвечай по-русски, кратко и по делу.

Источники для ответа:
{sources}

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

export function renderSystemPrompt(template, { sources, question, history } = {}) {
  const tpl = typeof template === "string" && template.length > 0 ? template : DEFAULT_SYSTEM_PROMPT;
  return tpl
    .replace(/\{sources\}/g, formatSourcesBlock(sources))
    .replace(/\{history\}/g, formatHistoryBlock(history))
    .replace(/\{question\}/g, typeof question === "string" ? question : "");
}
