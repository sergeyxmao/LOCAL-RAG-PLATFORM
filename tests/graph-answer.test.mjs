import test from "node:test";
import assert from "node:assert/strict";

import { GraphAnswerService } from "../apps/kb-api/src/services/graphAnswerService.js";
import {
  formatGraphFactsBlock,
  renderSystemPrompt,
  DEFAULT_SYSTEM_PROMPT,
} from "../apps/kb-api/src/services/systemPromptService.js";

// ---- helpers ----

function fakeGraphSearch(rows) {
  return {
    calls: [],
    async search(query, opts) {
      this.calls.push({ query, opts });
      return rows;
    },
  };
}

function fakeGraphService(relatedByNode = {}) {
  return {
    calls: [],
    async getRelatedNodes(nodeId, opts) {
      this.calls.push({ nodeId, opts });
      return relatedByNode[nodeId] || [];
    },
  };
}

// ---- lookup: триггер по идентификатору ----

test("lookup: нет идентификатора → used:false, граф не трогаем", async () => {
  const search = fakeGraphSearch([]);
  const svc = new GraphAnswerService({
    graphSearchService: search,
    graphService: fakeGraphService(),
  });
  const res = await svc.lookup("как обслуживать манометр");
  assert.equal(res.used, false);
  assert.equal(res.reason, "no_identifier");
  assert.deepEqual(res.facts, []);
  assert.equal(search.calls.length, 0, "search не должен вызываться без идентификатора");
});

test("lookup: есть идентификатор, но нет структурного матча → no_match", async () => {
  // matchedField=type не входит в допустимые поля → шум игнорируется.
  const search = fakeGraphSearch([
    { node: { id: "11111111-1111-1111-1111-111111111111", type: "signal", name: "x" }, matchedField: "type" },
  ]);
  const svc = new GraphAnswerService({
    graphSearchService: search,
    graphService: fakeGraphService(),
  });
  const res = await svc.lookup("что такое KS_T2B1");
  assert.equal(res.used, false);
  assert.equal(res.reason, "no_match");
  assert.equal(search.calls.length, 1);
});

test("lookup: структурный матч + связи → used:true с фактами", async () => {
  const nodeId = "22222222-2222-2222-2222-222222222222";
  const search = fakeGraphSearch([
    {
      node: {
        id: nodeId,
        type: "signal",
        name: "KS_T2B1",
        attributes: { signal_address: "DI 03.2", loop_tag: "L-12" },
      },
      matchedField: "name",
    },
  ]);
  const graph = fakeGraphService({
    [nodeId]: [
      {
        direction: "outgoing",
        edge: { relation: "installed_in" },
        node: { id: "33333333-3333-3333-3333-333333333333", type: "cabinet", name: "IO-03" },
      },
    ],
  });
  const svc = new GraphAnswerService({ graphSearchService: search, graphService: graph });
  const res = await svc.lookup("какой адрес у сигнала KS_T2B1");
  assert.equal(res.used, true);
  assert.equal(res.count, 1);
  const fact = res.facts[0];
  assert.equal(fact.name, "KS_T2B1");
  assert.equal(fact.origin, "graph");
  assert.equal(fact.relations.length, 1);
  assert.equal(fact.relations[0].relation, "Установлен в"); // русификация
  assert.equal(fact.relations[0].targetName, "IO-03");
});

test("lookup: максимум 3 узла и 8 связей на узел", async () => {
  const rows = [];
  const relatedByNode = {};
  for (let i = 0; i < 5; i++) {
    const id = `0000000${i}-0000-0000-0000-000000000000`;
    rows.push({ node: { id, type: "board", name: "DII8P24-" + i }, matchedField: "name" });
    relatedByNode[id] = Array.from({ length: 12 }, (_, j) => ({
      direction: "outgoing",
      edge: { relation: "connected_to" },
      node: { id: `t${i}-${j}`, type: "x", name: "n" + j },
    }));
  }
  const svc = new GraphAnswerService({
    graphSearchService: fakeGraphSearch(rows),
    graphService: fakeGraphService(relatedByNode),
  });
  const res = await svc.lookup("где плата DII8P24-1");
  assert.equal(res.facts.length, 3, "не более 3 узлов");
  assert.equal(res.facts[0].relations.length, 8, "не более 8 связей на узел");
});

test("lookup: идентификатор с прилипшей пунктуацией очищается перед search (#8.3-fix)", async () => {
  // Узел в графе называется «Датчик температуры TT-133». search() матчит
  // только чистый идентификатор «tt-133», но НЕ грязный «tt-133?» / полный вопрос.
  const node = { id: "44444444-4444-4444-4444-444444444444", type: "sensor", name: "Датчик температуры TT-133" };
  const search = {
    calls: [],
    async search(query) {
      this.calls.push(query);
      return query === "tt-133" ? [{ node, matchedField: "name" }] : [];
    },
  };
  const svc = new GraphAnswerService({
    graphSearchService: search,
    graphService: fakeGraphService({ [node.id]: [] }),
  });

  for (const q of [
    "Что известно про датчик TT-133?",
    "адрес TT-133.",
    "«TT-133»",
    "проверь TT-133,",
  ]) {
    search.calls = [];
    const res = await svc.lookup(q);
    assert.equal(res.used, true, "должен найтись узел для: " + q);
    assert.equal(res.count, 1);
    assert.equal(res.facts[0].name, "Датчик температуры TT-133");
    // В search() ушёл очищенный термин без пунктуации.
    assert.ok(search.calls.includes("tt-133"), "в search() должен уйти tt-133 для: " + q);
    assert.ok(
      search.calls.every((c) => !/[?.,«»]/.test(c)),
      "ни один аргумент search() не должен содержать пунктуацию"
    );
  }
});

test("lookup: несколько идентификаторов → поиск по каждому, объединение матчей", async () => {
  const n1 = { id: "55555555-5555-5555-5555-555555555555", type: "sensor", name: "TT-133" };
  const n2 = { id: "66666666-6666-6666-6666-666666666666", type: "cabinet", name: "IO-03" };
  const search = {
    calls: [],
    async search(query) {
      this.calls.push(query);
      if (query === "tt-133") return [{ node: n1, matchedField: "name" }];
      if (query === "io-03") return [{ node: n2, matchedField: "name" }];
      return [];
    },
  };
  const svc = new GraphAnswerService({
    graphSearchService: search,
    graphService: fakeGraphService({ [n1.id]: [], [n2.id]: [] }),
  });
  const res = await svc.lookup("связан ли TT-133 со шкафом IO-03?");
  assert.equal(res.used, true);
  assert.equal(res.count, 2);
  const names = res.facts.map((f) => f.name).sort();
  assert.deepEqual(names, ["IO-03", "TT-133"]);
});

test("lookup: ошибка графа (нет Postgres) → used:false reason:error, без throw", async () => {
  const search = {
    async search() {
      throw new Error("connection refused");
    },
  };
  const svc = new GraphAnswerService({ graphSearchService: search, graphService: fakeGraphService() });
  const res = await svc.lookup("сигнал KS-1");
  assert.equal(res.used, false);
  assert.equal(res.reason, "error");
});

// ---- toSource ----

test("toSource: формирует запись origin:graph с текстом", () => {
  const svc = new GraphAnswerService({});
  const src = svc.toSource({
    nodeId: "n1",
    type: "signal",
    name: "KS_T2B1",
    attributes: { signal_address: "DI 03.2" },
    relations: [{ relation: "Установлен в", targetType: "cabinet", targetName: "IO-03" }],
  });
  assert.equal(src.origin, "graph");
  assert.equal(src.resource_type, "graph_node");
  assert.equal(src.graph_node_id, "n1");
  assert.match(src.text, /KS_T2B1/);
  assert.match(src.text, /signal_address/);
  assert.match(src.text, /Установлен в/);
});

// ---- systemPromptService ----

test("formatGraphFactsBlock: пусто → плейсхолдер; есть факты → блок", () => {
  assert.match(formatGraphFactsBlock([]), /не найдены/);
  const block = formatGraphFactsBlock([
    {
      type: "signal",
      name: "KS_T2B1",
      attributes: { signal_address: "DI 03.2" },
      relations: [{ relation: "Установлен в", targetType: "cabinet", targetName: "IO-03" }],
    },
  ]);
  assert.match(block, /Факт 1 \(граф\)/);
  assert.match(block, /signal_address=DI 03.2/);
  assert.match(block, /Установлен в cabinet «IO-03»/);
});

test("renderSystemPrompt: {graph_facts} подставляется в дефолтный шаблон", () => {
  const out = renderSystemPrompt(DEFAULT_SYSTEM_PROMPT, {
    question: "q",
    sources: [],
    history: [],
    graphFacts: [{ type: "signal", name: "KS_T2B1", attributes: {}, relations: [] }],
  });
  assert.match(out, /Факт 1 \(граф\): signal «KS_T2B1»/);
});

test("renderSystemPrompt: кастомный шаблон без {graph_facts} → факты не попадают в промпт", () => {
  const tpl = "Источники: {sources}\nВопрос: {question}";
  const out = renderSystemPrompt(tpl, {
    question: "q",
    sources: [],
    graphFacts: [{ type: "signal", name: "KS_T2B1", attributes: {}, relations: [] }],
  });
  assert.ok(!out.includes("KS_T2B1"), "граф не должен подмешиваться без плейсхолдера");
});
