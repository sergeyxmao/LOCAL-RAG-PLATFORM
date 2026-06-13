// Fastify-схемы валидации для retrieval-маршрутов (/ask, /search и обёрток).
//
// Принципы (намеренно консервативные — схема не должна отклонить ни один
// запрос, который проходит сегодня):
//   1. НЕТ required. Хендлеры сами возвращают русское 400
//      («Нужно передать вопрос» / «Нужно передать поисковый запрос») на пустой
//      question/query — схема не должна перехватывать это менее понятным
//      сообщением AJV.
//   2. additionalProperties открыт (по умолчанию). Клиенты шлют алиасы
//      (tags/categories вместо selectedTags, q вместо query) и служебные поля —
//      их нельзя ронять.
//   3. Широкие union-типы. parseNumber/parseTagList/parseDocumentIds принимают
//      и строки, и числа, и массивы; documentId/nodeId реально приходят как
//      string ИЛИ null (см. buildPayload в ui.js). type:'string' отклонил бы
//      null — поэтому всюду явный union с "null".
//
// Польза схемы: типизирует известные поля (ловит грубо некорректные структуры
// вроде question-объекта или limit-массива) и документирует контракт, не
// меняя поведение для валидных запросов.

const stringOrNull = { type: ["string", "null"] };
const numberLike = { type: ["number", "string", "null"] };
const listLike = { type: ["array", "string", "null"] };
const boolLike = { type: ["boolean", "string", "null"] };

// Общие поля фильтрации/скоупа, одинаковые у /ask и /search.
const commonRetrievalProps = {
  limit: numberLike,
  scope: stringOrNull,
  assetClass: stringOrNull,
  engineeringTopic: stringOrNull,
  signalTag: stringOrNull,
  documentId: stringOrNull,
  documentIds: listLike,
  selectedTags: listLike,
  tags: listLike,
  categories: listLike,
  nodeId: stringOrNull,
  includeChildren: boolLike,
};

export const askBodySchema = {
  type: "object",
  properties: {
    question: stringOrNull,
    ...commonRetrievalProps,
  },
};

export const searchBodySchema = {
  type: "object",
  properties: {
    query: stringOrNull,
    q: stringOrNull,
    semanticSearch: numberLike,
    lexicalSearch: numberLike,
    ...commonRetrievalProps,
  },
};
