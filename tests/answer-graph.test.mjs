import test from "node:test";
import assert from "node:assert/strict";

import { AnswerService } from "../apps/kb-api/src/services/answerService.js";
import { GraphAnswerService } from "../apps/kb-api/src/services/graphAnswerService.js";

function fakeSearch(items) {
  return {
    async hybridSearch() {
      return { items, reranking: null, hyde: null, debug: {} };
    },
  };
}

function fakeChat(answer = "ответ модели") {
  return {
    calls: [],
    async generate(messages) {
      this.calls.push(messages);
      return answer;
    },
  };
}

const fakePg = { async logQuery() {} };
const modelsConfig = { chat: { model: "qwen3:4b" }, embedding: { model: "emb" } };

function graphSvcWith(facts) {
  // graphAnswerService с замоканным lookup-результатом.
  const svc = new GraphAnswerService({});
  svc.lookup = async () => ({
    used: facts.length > 0,
    reason: facts.length > 0 ? "ok" : "no_match",
    facts,
    count: facts.length,
  });
  return svc;
}

const FACT = {
  nodeId: "n1",
  type: "signal",
  name: "KS_T2B1",
  attributes: { signal_address: "DI 03.2" },
  relations: [{ relation: "Установлен в", targetType: "cabinet", targetName: "IO-03" }],
  origin: "graph",
};

test("answerQuestion: RAG пуст + граф дал факт → mode graph-only, графовый источник", async () => {
  const chat = fakeChat();
  const svc = new AnswerService({
    chatProvider: chat,
    searchService: fakeSearch([]),
    postgresProvider: fakePg,
    modelsConfig,
    graphAnswerService: graphSvcWith([FACT]),
  });
  const res = await svc.answerQuestion("какой адрес у сигнала KS_T2B1");
  assert.equal(res.mode, "graph-only");
  assert.equal(res.graph.used, true);
  assert.equal(res.graph.count, 1);
  assert.equal(res.sources.length, 1);
  assert.equal(res.sources[0].origin, "graph");
  // В промпт ушёл блок графовых фактов.
  const userMsg = chat.calls[0].find((m) => m.role === "user");
  assert.match(userMsg.content, /Структурные факты из графа знаний/);
  assert.match(userMsg.content, /KS_T2B1/);
});

test("answerQuestion: RAG пуст + граф пуст → честный fallback-empty", async () => {
  const svc = new AnswerService({
    chatProvider: fakeChat(),
    searchService: fakeSearch([]),
    postgresProvider: fakePg,
    modelsConfig,
    graphAnswerService: graphSvcWith([]),
  });
  const res = await svc.answerQuestion("вопрос без идентификатора");
  assert.equal(res.mode, "fallback-empty");
  assert.equal(res.graph.used, false);
  assert.equal(res.sources.length, 0);
});

test("answerQuestion: есть RAG + граф → источники объединены (RAG, затем граф)", async () => {
  const ragItem = { text: "текст чанка", title: "Документ", chunk_index: 0, resource_type: "chunk" };
  const svc = new AnswerService({
    chatProvider: fakeChat(),
    searchService: fakeSearch([ragItem]),
    postgresProvider: fakePg,
    modelsConfig,
    graphAnswerService: graphSvcWith([FACT]),
  });
  const res = await svc.answerQuestion("какой адрес у сигнала KS_T2B1");
  assert.equal(res.mode, "llm");
  assert.equal(res.sources.length, 2);
  assert.equal(res.sources[0].origin ?? "rag", "rag"); // RAG идёт первым
  assert.equal(res.sources[1].origin, "graph"); // граф — после
  assert.equal(res.graph.used, true);
});

test("answerQuestion: без graphAnswerService → ведёт себя как чистый RAG", async () => {
  const ragItem = { text: "текст", title: "Док", chunk_index: 0, resource_type: "chunk" };
  const svc = new AnswerService({
    chatProvider: fakeChat(),
    searchService: fakeSearch([ragItem]),
    postgresProvider: fakePg,
    modelsConfig,
  });
  const res = await svc.answerQuestion("какой-то вопрос с тегом FA-1");
  assert.equal(res.mode, "llm");
  assert.equal(res.graph.used, false);
  assert.equal(res.sources.length, 1);
});
