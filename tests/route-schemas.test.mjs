import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

import { askRoutes } from "../apps/kb-api/src/routes/ask.js";
import { searchRoutes } from "../apps/kb-api/src/routes/search.js";

// Fastify лежит в apps/kb-api/node_modules — резолвим оттуда, а не из корня.
const requireFromApi = createRequire(
  new URL("../apps/kb-api/src/index.js", import.meta.url)
);
const { default: Fastify } = await import(
  pathToFileURL(requireFromApi.resolve("fastify")).href
);

// Идея теста: поднять реальный Fastify с настоящими маршрутами /ask и /search
// (со схемами) и прогнать через app.inject() ровно те payload'ы, что шлют
// реальные клиенты (buildPayload/buildPagePayload в ui.js, smoke-тест).
// Схема НЕ должна отклонить ни один валидный запрос. Отдельно проверяем, что
// единый error-handler приводит ошибки валидации к { ok:false, error }.

const FAKE_UUID = "11111111-1111-1111-1111-111111111111";

async function buildApp() {
  // allowUnionTypes — те же ajv-опции, что в src/index.js.
  const app = Fastify({
    logger: false,
    ajv: { customOptions: { allowUnionTypes: true } },
  });

  // Тот же error-handler, что в src/index.js (там он inline и не экспортируется,
  // т.к. index.js стартует сервер при импорте). Тест фиксирует ожидаемое
  // поведение: ошибка валидации → 400 { ok:false, error }.
  app.setErrorHandler((error, request, reply) => {
    if (error.validation) {
      reply.code(400).send({ ok: false, error: error.message });
      return;
    }
    reply.send(error);
  });

  // Сервисы-заглушки: маршрут должен ДОЙТИ до них на валидном запросе.
  app.decorate("answerService", {
    async answerQuestion() {
      return { answer: "ok", sources: [], mode: "ok" };
    },
  });
  app.decorate("searchService", {
    async hybridSearch() {
      return { items: [] };
    },
  });

  await app.register(askRoutes);
  await app.register(searchRoutes);
  await app.ready();
  return app;
}

// Реальные payload'ы клиентов (см. ui.js buildPayload/buildPagePayload и smoke).
const ASK_PAYLOADS = [
  // consult buildPayload(): documentId/nodeId могут быть null
  {
    question: "что делает блок",
    limit: 4,
    scope: "all",
    assetClass: "all",
    engineeringTopic: "all",
    signalTag: "all",
    documentId: null,
    documentIds: [],
    selectedTags: [],
    nodeId: null,
    includeChildren: false,
  },
  // тот же, но с выбранным документом/разделом
  {
    question: "что делает блок",
    limit: 4,
    scope: "all",
    assetClass: "all",
    engineeringTopic: "all",
    signalTag: "all",
    documentId: FAKE_UUID,
    documentIds: [FAKE_UUID],
    selectedTags: ["тег1", "тег2"],
    nodeId: FAKE_UUID,
    includeChildren: true,
  },
  // smoke /ask
  { question: "ZZZ_NO_SOURCE", nodeId: FAKE_UUID, includeChildren: true, limit: 3 },
  // минимальный
  { question: "привет" },
];

const SEARCH_PAYLOADS = [
  // consult /search через buildPayload + query
  {
    query: "насос",
    limit: 4,
    scope: "all",
    assetClass: "all",
    engineeringTopic: "all",
    signalTag: "all",
    documentId: null,
    documentIds: [],
    selectedTags: [],
    nodeId: null,
    includeChildren: false,
  },
  // smoke /search
  { query: "что-то", limit: 12, nodeId: FAKE_UUID, includeChildren: true },
  // pages buildPagePayload: алиасы и строковые числа тоже должны проходить
  {
    query: "схема",
    limit: "3",
    documentId: FAKE_UUID,
    assetClass: "scheme",
    engineeringTopic: "all",
    signalTag: "all",
    nodeId: null,
    includeChildren: true,
  },
  // алиасы тегов и documentIds строкой (parseDocumentIds принимает запятую)
  { query: "x", tags: "a,b", categories: ["c"], documentIds: "id1,id2" },
];

// Алиас q вместо query понимает только /search/visual (см. runVisualSearch),
// поэтому проверяем его отдельно — на /search/pages он законно дал бы 400.
const VISUAL_ONLY_PAYLOADS = [{ q: "визуальный", limit: 6 }];

test("askBodySchema: все реальные payload'ы /ask проходят и доходят до хендлера", async () => {
  const app = await buildApp();
  try {
    for (const payload of ASK_PAYLOADS) {
      for (const url of ["/ask", "/ask/pages"]) {
        const res = await app.inject({ method: "POST", url, payload });
        assert.equal(
          res.statusCode,
          200,
          `${url} отклонил валидный payload ${JSON.stringify(payload)}: ${res.statusCode} ${res.body}`
        );
        assert.equal(JSON.parse(res.body).ok, true);
      }
    }
  } finally {
    await app.close();
  }
});

test("searchBodySchema: все реальные payload'ы /search* проходят", async () => {
  const app = await buildApp();
  try {
    for (const payload of SEARCH_PAYLOADS) {
      for (const url of ["/search", "/search/pages", "/search/visual"]) {
        const res = await app.inject({ method: "POST", url, payload });
        assert.equal(
          res.statusCode,
          200,
          `${url} отклонил валидный payload ${JSON.stringify(payload)}: ${res.statusCode} ${res.body}`
        );
        assert.equal(JSON.parse(res.body).ok, true);
      }
    }
    for (const payload of VISUAL_ONLY_PAYLOADS) {
      const res = await app.inject({ method: "POST", url: "/search/visual", payload });
      assert.equal(
        res.statusCode,
        200,
        `/search/visual отклонил валидный payload ${JSON.stringify(payload)}: ${res.statusCode} ${res.body}`
      );
      assert.equal(JSON.parse(res.body).ok, true);
    }
  } finally {
    await app.close();
  }
});

test("пустой question/query доходит до хендлера и даёт русское 400 (схема не перехватывает)", async () => {
  const app = await buildApp();
  try {
    const ask = await app.inject({ method: "POST", url: "/ask", payload: {} });
    assert.equal(ask.statusCode, 400);
    assert.equal(JSON.parse(ask.body).error, "Нужно передать вопрос");

    const search = await app.inject({ method: "POST", url: "/search", payload: {} });
    assert.equal(search.statusCode, 400);
    assert.equal(JSON.parse(search.body).error, "Нужно передать поисковый запрос");
  } finally {
    await app.close();
  }
});

test("грубо некорректный тип отклоняется схемой в формате { ok:false, error }", async () => {
  const app = await buildApp();
  try {
    // question как объект — не string/null
    const res = await app.inject({
      method: "POST",
      url: "/ask",
      payload: { question: { nested: true } },
    });
    assert.equal(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.equal(body.ok, false);
    assert.ok(typeof body.error === "string" && body.error.length > 0, "ожидал текст ошибки в .error");
  } finally {
    await app.close();
  }
});
