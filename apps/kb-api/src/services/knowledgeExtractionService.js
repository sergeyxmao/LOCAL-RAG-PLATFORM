// LLM-извлечение случаев из текста документа (Память инженера — Этап 3).
//
// По ручной команде «Извлечь знания» сервис читает текст текстового
// документа (docx/txt/md), при большом размере — по сегментам, и просит
// облачный LLM вернуть СТРОГИЙ JSON с массивом случаев вида
// «оборудование / что произошло / что сделали».
//
// ВАЖНО:
//   • Извлечённое НЕ пишется в граф. Оно складывается в очередь кандидатов
//     (graph_extraction_candidates) со status='pending'. В граф случай
//     попадает только после подтверждения пользователем на экране ревью.
//   • Факты не переписываются: серийники, теги, адреса, даты переносятся
//     дословно — это явно в промпте.
//   • Промпт не вшит в код — хранится в app_settings.knowledge_extraction
//     и редактируется через UI (по образцу HyDE / обогащения).
//   • Graceful fallback: ошибка / таймаут / нет провайдера → задача
//     завершается с понятным русским статусом, ничего не создаётся,
//     импорт и граф не затронуты.
//
// Паттерны переиспользованы из contextualEnrichmentService / hydeService:
// gate-проверка, JSON-ремонт ответа модели (parseEnrichmentJson), вызов
// cloudChatProvider.generate.

import { randomUUID } from "node:crypto";

import { parseEnrichmentJson } from "./contextualEnrichmentService.js";

// Бюджет одного сегмента (символы) и предельное число сегментов —
// чтобы крупные документы извлекались по частям и стоимость/время были
// ограничены. Не выносим в настройки (минимальный набор настроек).
const MAX_SEGMENT_CHARS = 12000;
const MAX_SEGMENTS = 30;

function cleanStr(value) {
  if (value === undefined || value === null) return "";
  return String(value).replace(/\s+/g, " ").trim();
}

function cleanText(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

// Дата → YYYY-MM-DD дословно, если распознаётся, иначе null.
function normalizeDate(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  return text;
}

// Нормализует один случай из ответа модели в канонический case_payload.
// Возвращает null, если нет обязательных полей (equipment.name, fault.text).
function normalizeCase(raw) {
  if (!raw || typeof raw !== "object") return null;
  const equipment = raw.equipment && typeof raw.equipment === "object" ? raw.equipment : {};
  const fault = raw.fault && typeof raw.fault === "object" ? raw.fault : {};
  const solution = raw.solution && typeof raw.solution === "object" ? raw.solution : {};

  const equipName = cleanStr(equipment.name);
  const faultText = cleanText(fault.text);
  if (!equipName || !faultText) return null;

  let confidence = 0.5;
  if (raw.confidence !== undefined && raw.confidence !== null) {
    const n = Number(raw.confidence);
    if (Number.isFinite(n)) confidence = Math.min(1, Math.max(0, n));
  }

  return {
    equipment: {
      name: equipName,
      model: cleanStr(equipment.model) || null,
      location: cleanStr(equipment.location) || null,
    },
    fault: { text: faultText, date: normalizeDate(fault.date) },
    solution: {
      text: cleanText(solution.text) || null,
      date: normalizeDate(solution.date),
    },
    object: cleanStr(raw.object) || null,
    source_quote: cleanText(raw.source_quote) || null,
    confidence,
  };
}

// Делит текст на сегменты по абзацам с бюджетом maxChars символов.
function segmentText(text, maxChars = MAX_SEGMENT_CHARS) {
  const t = String(text || "");
  if (t.length <= maxChars) return t.trim() ? [t] : [];
  const segments = [];
  const paras = t.split(/\n{2,}/);
  let cur = "";
  for (const p of paras) {
    if (cur && cur.length + p.length + 2 > maxChars) {
      segments.push(cur);
      cur = "";
    }
    if (p.length > maxChars) {
      if (cur) {
        segments.push(cur);
        cur = "";
      }
      for (let i = 0; i < p.length; i += maxChars) {
        segments.push(p.slice(i, i + maxChars));
      }
      continue;
    }
    cur = cur ? cur + "\n\n" + p : p;
  }
  if (cur) segments.push(cur);
  return segments.slice(0, MAX_SEGMENTS);
}

function serviceError(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

// Понятные русские сообщения для причин недоступности извлечения.
const REASON_MESSAGES = {
  disabled_global: "Извлечение знаний отключено в конфигурации сервера.",
  disabled:
    "Извлечение знаний выключено. Включите его в «Настройки → Поиск → Извлечение знаний».",
  no_provider:
    "Не выбран облачный провайдер для извлечения знаний — укажите его в настройках.",
  no_model:
    "Не задана модель для извлечения знаний — укажите модель в настройках или у провайдера.",
  no_prompt: "Промпт извлечения знаний пуст — задайте его в настройках.",
};

export function extractionReasonMessage(reason) {
  return REASON_MESSAGES[reason] || "Извлечение знаний недоступно.";
}

export class KnowledgeExtractionService {
  constructor({
    cloudChatProvider,
    appSettingsService,
    postgresProvider,
    globalEnabled = true,
    logger = null,
  }) {
    this.cloudChatProvider = cloudChatProvider;
    this.appSettingsService = appSettingsService;
    this.postgresProvider = postgresProvider;
    this.globalEnabled = globalEnabled !== false;
    this.logger = logger;
    // In-memory реестр запусков (jobId → статус). Кандидаты долговечны в
    // Postgres; статус задачи транзиентный (для опроса прогресса из UI).
    this._jobs = new Map();
  }

  async getSettings() {
    if (
      !this.appSettingsService ||
      typeof this.appSettingsService.getKnowledgeExtractionSettings !== "function"
    ) {
      return {
        enabled: false,
        providerId: "",
        model: "",
        maxTokens: 2000,
        timeoutMs: 60000,
        prompt: "",
      };
    }
    return this.appSettingsService.getKnowledgeExtractionSettings();
  }

  async resolveProvider(providerId) {
    if (!providerId) return null;
    if (typeof this.appSettingsService?.getCloudProviderById !== "function") return null;
    const provider = await this.appSettingsService.getCloudProviderById(providerId);
    return provider || null;
  }

  // Доступно ли извлечение (мастер-флаг конфигурации И тумблер UI И провайдер).
  async isEnabled() {
    if (!this.globalEnabled) return { ok: false, reason: "disabled_global" };
    const settings = await this.getSettings();
    if (!settings.enabled) return { ok: false, reason: "disabled" };
    const provider = await this.resolveProvider(settings.providerId);
    if (!provider || !provider.baseUrl || !provider.apiKey) {
      return { ok: false, reason: "no_provider" };
    }
    const model = settings.model || provider.model;
    if (!model) return { ok: false, reason: "no_model" };
    if (!(settings.prompt || "").trim()) return { ok: false, reason: "no_prompt" };
    return { ok: true, settings, provider, model };
  }

  // Только текстовые документы (docx/txt/md). PDF/XLSX/CSV — вне scope.
  isTextDocument(document) {
    if (!document) return false;
    const name = String(
      document.original_file_name || document.original_file_path || document.title || ""
    ).toLowerCase();
    const sourceType = String(document.source_type || "").toLowerCase();
    if (/\.(pdf|xlsx|xls|xlsm|csv)$/.test(name)) return false;
    if (["pdf", "xlsx", "xls", "csv", "spreadsheet"].includes(sourceType)) return false;
    if (/\.(docx|txt|md|markdown)$/.test(name)) return true;
    if (["docx", "text", "file", "md", "txt"].includes(sourceType)) return true;
    return false;
  }

  // Загружает документ и его текст (склейка чанков). Бросает понятную
  // русскую ошибку, если документ не подходит.
  async loadDocument(documentId) {
    const document = await this.postgresProvider.getDocumentById(documentId);
    if (!document) {
      throw serviceError("Документ не найден.", 404);
    }
    if (!this.isTextDocument(document)) {
      throw serviceError(
        "Извлечение знаний доступно только для текстовых документов (docx, txt, md).",
        400
      );
    }
    const chunks = await this.postgresProvider.getDocumentChunks(documentId);
    const text = (chunks || [])
      .map((c) => (c && c.text ? String(c.text) : ""))
      .filter(Boolean)
      .join("\n\n")
      .trim();
    if (!text) {
      throw serviceError("В документе нет распознанного текста для извлечения.", 400);
    }
    return { document, text };
  }

  buildSystemPrompt(settings) {
    const prompt = (settings.prompt || "").trim();
    return [
      prompt,
      'Верни СТРОГО один JSON-объект вида {"cases": [ {"equipment": {"name": "...", "model": null, "location": null}, "fault": {"text": "...", "date": null}, "solution": {"text": null, "date": null}, "object": null, "confidence": 0.0, "source_quote": "..."} ] } и больше ничего — без markdown, без пояснений. Если случаев в тексте нет — верни {"cases": []}.',
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  buildUserPrompt({ title, segment, index, total }) {
    const head =
      total > 1
        ? `Документ: ${title || "(без названия)"} — фрагмент ${index + 1} из ${total}.`
        : `Документ: ${title || "(без названия)"}.`;
    return [head, "", "Текст для анализа:", "<<<", String(segment || ""), ">>>"].join("\n");
  }

  async _callOnce({ provider, model, settings, systemPrompt, userPrompt }) {
    const result = await this.cloudChatProvider.generate({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      model,
      baseUrl: provider.baseUrl,
      apiKey: provider.apiKey,
      maxTokens: settings.maxTokens || 2000,
      temperature: 0.1,
      timeoutMs: settings.timeoutMs || 60000,
    });
    return result?.content || "";
  }

  // Извлекает случаи из всего текста (по сегментам). Ошибка/таймаут одного
  // сегмента не валит остальные. Возвращает { cases, segments, failedSegments }.
  async _extractCases({ gate, title, text }) {
    const { settings, provider, model } = gate;
    const systemPrompt = this.buildSystemPrompt(settings);
    const segments = segmentText(text);
    const all = [];
    const seen = new Set();
    let failed = 0;

    for (let i = 0; i < segments.length; i += 1) {
      const userPrompt = this.buildUserPrompt({
        title,
        segment: segments[i],
        index: i,
        total: segments.length,
      });
      let content = "";
      try {
        content = await this._callOnce({ provider, model, settings, systemPrompt, userPrompt });
      } catch (err) {
        failed += 1;
        this.logger?.warn?.(
          { err: err?.message || err, segment: i + 1, total: segments.length, model },
          "Извлечение знаний: ошибка вызова на сегменте, пропускаем"
        );
        continue;
      }
      const parsed = parseEnrichmentJson(content);
      const cases = parsed && Array.isArray(parsed.cases) ? parsed.cases : null;
      if (!cases) {
        failed += 1;
        // Диагностика: при неудачном разборе пишем сырой ответ модели
        // усечённо (≤800 символов) и его длину — чтобы видеть, что именно
        // вернул провайдер. Безопасно: усечение, без ключей; только при ошибке.
        this.logger?.warn?.(
          {
            segment: i + 1,
            total: segments.length,
            rawLength: content?.length ?? 0,
            rawHead: String(content ?? "").slice(0, 800),
          },
          "Извлечение знаний: не удалось разобрать JSON ответа, пропускаем сегмент"
        );
        continue;
      }
      for (const c of cases) {
        const norm = normalizeCase(c);
        if (!norm) continue;
        const key =
          norm.equipment.name.toLowerCase() + "||" + norm.fault.text.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        all.push(norm);
      }
    }
    return { cases: all, segments: segments.length, failedSegments: failed };
  }

  // ============== Управление асинхронной задачей ==============

  _setJob(jobId, patch) {
    const prev = this._jobs.get(jobId) || {};
    this._jobs.set(jobId, { ...prev, ...patch });
  }

  getJobStatus(jobId) {
    return this._jobs.get(jobId) || null;
  }

  _cleanupJobs() {
    const now = Date.now();
    const ttlMs = 60 * 60 * 1000; // 1 час
    for (const [jobId, rec] of this._jobs.entries()) {
      const ts = rec.finishedAt || rec.startedAt || 0;
      if (now - ts > ttlMs) this._jobs.delete(jobId);
    }
  }

  // Готовит и запускает асинхронное извлечение. Gate-проверка и валидация
  // документа выполняются синхронно (мгновенный понятный ответ), сам разбор
  // LLM идёт в фоне. Возвращает { ok, jobId, status, ... } либо
  // { ok:false, reason, error } с русским сообщением. НИКОГДА не валит граф.
  async startExtractionJob({ documentId }) {
    const gate = await this.isEnabled();
    if (!gate.ok) {
      return { ok: false, reason: gate.reason, error: extractionReasonMessage(gate.reason) };
    }
    let prepared;
    try {
      prepared = await this.loadDocument(documentId);
    } catch (err) {
      return {
        ok: false,
        reason: "document",
        error: err.message || "Документ недоступен для извлечения.",
      };
    }

    const jobId = randomUUID();
    this._cleanupJobs();
    this._setJob(jobId, {
      jobId,
      status: "running",
      documentId,
      documentTitle: prepared.document.title || prepared.document.original_file_name || "",
      startedAt: Date.now(),
      casesFound: 0,
    });

    // Фоновый запуск — не ждём завершения в обработчике запроса.
    this._runExtraction({
      jobId,
      documentId,
      gate,
      title: prepared.document.title || prepared.document.original_file_name || "",
      text: prepared.text,
    }).catch((err) => {
      this.logger?.error?.(
        { err: err?.message || err, jobId },
        "Извлечение знаний: непредвиденная ошибка фоновой задачи"
      );
      this._setJob(jobId, {
        status: "error",
        error: "Непредвиденная ошибка извлечения.",
        finishedAt: Date.now(),
      });
    });

    return {
      ok: true,
      jobId,
      status: "running",
      documentTitle: prepared.document.title || prepared.document.original_file_name || "",
    };
  }

  async _runExtraction({ jobId, documentId, gate, title, text }) {
    let result;
    try {
      result = await this._extractCases({ gate, title, text });
    } catch (err) {
      this.logger?.warn?.(
        { err: err?.message || err, jobId },
        "Извлечение знаний: разбор не удался, ничего не создано"
      );
      this._setJob(jobId, {
        status: "error",
        error: "Не удалось извлечь случаи: ошибка модели или провайдера.",
        finishedAt: Date.now(),
      });
      return;
    }

    const { cases, segments, failedSegments } = result;

    if (cases.length === 0) {
      const allFailed = segments > 0 && failedSegments >= segments;
      this._setJob(jobId, {
        status: allFailed ? "error" : "empty",
        casesFound: 0,
        segments,
        failedSegments,
        error: allFailed
          ? "Модель не вернула корректный ответ ни по одному фрагменту."
          : null,
        message: allFailed ? null : "Случаи в документе не найдены.",
        finishedAt: Date.now(),
      });
      return;
    }

    try {
      await this.postgresProvider.createExtractionCandidates({
        sourceDocumentId: documentId,
        extractionJobId: jobId,
        cases: cases.map((c) => ({ casePayload: c, confidence: c.confidence })),
      });
    } catch (err) {
      this.logger?.error?.(
        { err: err?.message || err, jobId },
        "Извлечение знаний: не удалось сохранить кандидатов"
      );
      this._setJob(jobId, {
        status: "error",
        error: "Не удалось сохранить кандидатов в очередь.",
        finishedAt: Date.now(),
      });
      return;
    }

    this._setJob(jobId, {
      status: "done",
      casesFound: cases.length,
      segments,
      failedSegments,
      message: `Извлечено случаев: ${cases.length}. Откройте экран «Кандидаты» для проверки.`,
      finishedAt: Date.now(),
    });
  }
}

export default KnowledgeExtractionService;
