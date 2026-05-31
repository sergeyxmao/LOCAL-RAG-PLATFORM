import test from "node:test";
import assert from "node:assert/strict";

import {
  KnowledgeExtractionService,
  extractionReasonMessage,
} from "../apps/kb-api/src/services/knowledgeExtractionService.js";
import { GraphService } from "../apps/kb-api/src/services/graphService.js";

// ---- helpers ----

function fakeAppSettings({ enabled = true, prompt = "Извлеки случаи." } = {}) {
  return {
    async getKnowledgeExtractionSettings() {
      return {
        enabled,
        providerId: "prov-1",
        model: "flash-test",
        maxTokens: 2000,
        timeoutMs: 60000,
        prompt,
      };
    },
    async getCloudProviderById(id) {
      if (id !== "prov-1") return null;
      return { id: "prov-1", baseUrl: "https://x", apiKey: "k", model: "flash-test" };
    },
  };
}

function fakeDocProvider({ created } = {}) {
  return {
    async getDocumentById() {
      return {
        id: "11111111-1111-4111-8111-111111111111",
        title: "Вахта",
        original_file_name: "Вахта.docx",
        source_type: "docx",
      };
    },
    async getDocumentChunks() {
      return [
        {
          chunk_index: 0,
          text:
            "10.05.2026 вышел из строя ИБП Smart UPS RT 1000 (серийный AS1623192088) после грозы. Отправлен в сервис.",
        },
      ];
    },
    async createExtractionCandidates(args) {
      if (created) created.push(args);
      return (args.cases || []).map((c, i) => ({ id: "cand-" + i, ...c }));
    },
  };
}

async function waitForJob(service, jobId, timeoutMs = 2000) {
  const start = Date.now();
  for (;;) {
    const job = service.getJobStatus(jobId);
    if (job && job.status !== "running") return job;
    if (Date.now() - start > timeoutMs) return job;
    await new Promise((r) => setTimeout(r, 10));
  }
}

// ---- extraction pipeline ----

test("извлечение: парсит {cases:[...]} в code fence, переносит серийник дословно", async () => {
  const created = [];
  const llmResponse =
    "```json\n" +
    JSON.stringify({
      cases: [
        {
          equipment: { name: "ИБП Smart UPS RT 1000", model: null, location: null },
          fault: { text: "вышел из строя после грозы", date: "2026-05-10" },
          solution: { text: "отправлен в сервис", date: null },
          object: null,
          confidence: 0.8,
          source_quote: "серийный AS1623192088",
        },
      ],
    }) +
    "\n```";
  const service = new KnowledgeExtractionService({
    cloudChatProvider: { async generate() { return { content: llmResponse }; } },
    appSettingsService: fakeAppSettings(),
    postgresProvider: fakeDocProvider({ created }),
  });

  const res = await service.startExtractionJob({
    documentId: "11111111-1111-4111-8111-111111111111",
  });
  assert.equal(res.ok, true);
  const job = await waitForJob(service, res.jobId);
  assert.equal(job.status, "done");
  assert.equal(job.casesFound, 1);

  assert.equal(created.length, 1);
  const cand = created[0].cases[0];
  assert.equal(cand.casePayload.equipment.name, "ИБП Smart UPS RT 1000");
  assert.equal(cand.casePayload.source_quote, "серийный AS1623192088");
  assert.equal(cand.casePayload.fault.date, "2026-05-10");
  assert.equal(cand.confidence, 0.8);
});

test("извлечение: случай без обязательных полей отбрасывается; дубли схлопываются", async () => {
  const created = [];
  const llmResponse = JSON.stringify({
    cases: [
      { equipment: { name: "" }, fault: { text: "нет оборудования" } }, // отброшен
      { equipment: { name: "Насос Н-1" }, fault: { text: "течь" } },
      { equipment: { name: "насос н-1" }, fault: { text: "ТЕЧЬ" } }, // дубль (регистр)
    ],
  });
  const service = new KnowledgeExtractionService({
    cloudChatProvider: { async generate() { return { content: llmResponse }; } },
    appSettingsService: fakeAppSettings(),
    postgresProvider: fakeDocProvider({ created }),
  });
  const res = await service.startExtractionJob({
    documentId: "11111111-1111-4111-8111-111111111111",
  });
  const job = await waitForJob(service, res.jobId);
  assert.equal(job.status, "done");
  assert.equal(job.casesFound, 1);
  assert.equal(created[0].cases.length, 1);
});

test("graceful fallback: выключено → ok:false с русским сообщением, ничего не создано", async () => {
  const created = [];
  const service = new KnowledgeExtractionService({
    cloudChatProvider: { async generate() { throw new Error("should not be called"); } },
    appSettingsService: fakeAppSettings({ enabled: false }),
    postgresProvider: fakeDocProvider({ created }),
  });
  const res = await service.startExtractionJob({
    documentId: "11111111-1111-4111-8111-111111111111",
  });
  assert.equal(res.ok, false);
  assert.equal(res.reason, "disabled");
  assert.match(res.error, /выключено/i);
  assert.equal(created.length, 0);
});

test("graceful fallback: ошибка провайдера → статус задачи error, кандидаты не созданы", async () => {
  const created = [];
  const service = new KnowledgeExtractionService({
    cloudChatProvider: { async generate() { throw new Error("timeout"); } },
    appSettingsService: fakeAppSettings(),
    postgresProvider: fakeDocProvider({ created }),
  });
  const res = await service.startExtractionJob({
    documentId: "11111111-1111-4111-8111-111111111111",
  });
  assert.equal(res.ok, true);
  const job = await waitForJob(service, res.jobId);
  assert.equal(job.status, "error");
  assert.equal(created.length, 0);
});

test("извлечение только для текста: pdf отклоняется понятным сообщением", async () => {
  const service = new KnowledgeExtractionService({
    cloudChatProvider: { async generate() { return { content: "{}" }; } },
    appSettingsService: fakeAppSettings(),
    postgresProvider: {
      async getDocumentById() {
        return { id: "x", title: "Скан", original_file_name: "scan.pdf", source_type: "pdf" };
      },
      async getDocumentChunks() { return []; },
      async createExtractionCandidates() { return []; },
    },
  });
  const res = await service.startExtractionJob({ documentId: "22222222-2222-4222-8222-222222222222" });
  assert.equal(res.ok, false);
  assert.match(res.error, /текстовых документов/i);
});

test("extractionReasonMessage возвращает русские сообщения", () => {
  assert.match(extractionReasonMessage("no_provider"), /провайдер/i);
  assert.match(extractionReasonMessage("disabled"), /выключено/i);
});

// ---- approve flow (GraphService) ----

function fakeGraphProvider({ captured } = {}) {
  return {
    async getExtractionCandidateById(id) {
      return {
        id,
        source_document_id: "33333333-3333-4333-8333-333333333333",
        extraction_job_id: "44444444-4444-4444-8444-444444444444",
        status: "pending",
        confidence: 0.8,
        case_payload: {
          equipment: { name: "ИБП Smart UPS RT 1000", model: "RT1000", location: "щитовая" },
          fault: { text: "отказ после грозы", date: "2026-05-10" },
          solution: { text: "отправлен в сервис", date: null },
          object: "Котельная №3",
          source_quote: "AS1623192088",
        },
      };
    },
    async recordCaseTx(payload) {
      if (captured) captured.payload = payload;
      return {
        nodes: {
          equipment: { id: "eq-1", type: "equipment", name: payload.equipmentName },
          fault: { id: "f-1", type: "fault", name: payload.faultName },
        },
        edges: [],
        created: { equipment: true, fault: true, solution: false, object: false },
      };
    },
    async updateExtractionCandidateStatus(id, status) {
      if (captured) captured.status = { id, status };
      return { id, status, reviewed_at: new Date().toISOString(), case_payload: {} };
    },
  };
}

test("approveCandidate: разворачивает payload, recordCase с author=agent:llm-extraction и confidence", async () => {
  const captured = {};
  const service = new GraphService({ postgresProvider: fakeGraphProvider({ captured }) });
  const result = await service.approveCandidate("55555555-5555-4555-8555-555555555555");

  const p = captured.payload;
  // плоские поля переданы из вложенного payload
  assert.equal(p.equipmentName, "ИБП Smart UPS RT 1000");
  assert.equal(p.equipmentModel, "RT1000");
  assert.equal(p.equipmentLocation, "щитовая");
  assert.equal(p.objectName, "Котельная №3");
  assert.equal(p.faultText, "отказ после грозы");
  assert.equal(p.solutionText, "отправлен в сервис");
  assert.equal(p.date, "2026-05-10");
  // дедупликация: имя оборудования, НЕ id
  assert.equal(p.equipmentId, null);
  // автор и уверенность
  assert.equal(p.author, "agent:llm-extraction");
  assert.equal(p.confidence, 0.8);
  // документ-источник проброшен
  assert.equal(p.documentId, "33333333-3333-4333-8333-333333333333");
  // статус кандидата → approved
  assert.equal(captured.status.status, "approved");
  assert.equal(result.candidate.status, "approved");
});

test("recordCase: обратная совместимость — без author/confidence → user:manual / 1.0", async () => {
  const captured = {};
  const provider = {
    async recordCaseTx(payload) {
      captured.payload = payload;
      return { nodes: { fault: { id: "f", type: "fault", name: "x" } }, edges: [], created: { fault: true } };
    },
  };
  const service = new GraphService({ postgresProvider: provider });
  await service.recordCase({ equipmentName: "Метран-150", faultText: "дрейф нуля" });
  assert.equal(captured.payload.author, "user:manual");
  assert.equal(captured.payload.confidence, 1.0);
});
