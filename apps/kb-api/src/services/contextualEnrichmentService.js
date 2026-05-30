// Контекстное обогащение чанков (Contextual Retrieval) — Слой 2.
//
// Для каждого чанка делается ОДИН вызов облачного LLM, который возвращает
// JSON-контракт {"context": "...", "tags": [...], "summary": "..."}:
//   • context — 1–2 предложения: где фрагмент в документе и о чём он;
//   • tags    — короткие теги (≤10, каждый с «#»);
//   • summary — краткое описание (≤300 символов).
//
// ВАЖНО:
//   • Текст чанка НЕ переписывается — обогащаются только поля-обёртки.
//   • В индексацию (эмбеддинг + BM25) идёт ТОЛЬКО context + текст через
//     text_with_context. Теги и summary — метаданные для отображения/фильтров,
//     в вектор и BM25 НЕ попадают (опыт FOHOW: размывают вектор, шумят в BM25).
//   • Промпты не вшиты в код — хранятся в app_settings.contextual_enrichment
//     и редактируются через UI (по образцу HyDE).
//   • Graceful fallback: при ошибке/таймауте/отсутствии провайдера чанк
//     индексируется без обогащения, импорт НЕ падает.

// --- Парсинг JSON с авто-ремонтом (паттерн FOHOW) ---
function stripCodeFences(raw) {
  let text = String(raw || "").trim();
  // ```json ... ``` или ``` ... ```
  text = text.replace(/^```[a-zA-Z]*\s*/m, "").replace(/```\s*$/m, "").trim();
  return text;
}

function extractFirstObject(text) {
  const start = text.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }
  // Незакрытая скобка — берём остаток и пробуем дочинить.
  return text.slice(start);
}

function repairJsonCandidate(candidate) {
  let s = candidate.trim();
  // Убрать хвостовые запятые перед } или ]
  s = s.replace(/,\s*([}\]])/g, "$1");
  // Дозакрыть скобки, если их не хватает
  const openBraces = (s.match(/\{/g) || []).length;
  const closeBraces = (s.match(/\}/g) || []).length;
  if (openBraces > closeBraces) {
    s += "}".repeat(openBraces - closeBraces);
  }
  const openBrackets = (s.match(/\[/g) || []).length;
  const closeBrackets = (s.match(/\]/g) || []).length;
  if (openBrackets > closeBrackets) {
    // вставить закрывающие ] перед финальными }
    const tail = "]".repeat(openBrackets - closeBrackets);
    const lastBrace = s.lastIndexOf("}");
    if (lastBrace >= 0) {
      s = s.slice(0, lastBrace) + tail + s.slice(lastBrace);
    } else {
      s += tail;
    }
  }
  return s;
}

// Возвращает объект или null. Никогда не бросает.
export function parseEnrichmentJson(raw) {
  if (!raw) return null;
  const cleaned = stripCodeFences(raw);

  // Попытка 1 — как есть.
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === "object") return parsed;
  } catch (_e) {
    /* идём дальше */
  }

  // Попытка 2 — выдрать первый {...}.
  const candidate = extractFirstObject(cleaned);
  if (!candidate) return null;
  try {
    const parsed = JSON.parse(candidate);
    if (parsed && typeof parsed === "object") return parsed;
  } catch (_e) {
    /* идём дальше */
  }

  // Попытка 3 — авто-ремонт типовых косяков.
  try {
    const repaired = repairJsonCandidate(candidate);
    const parsed = JSON.parse(repaired);
    if (parsed && typeof parsed === "object") return parsed;
  } catch (_e) {
    /* не удалось */
  }

  return null;
}

function normalizeTags(rawTags) {
  if (!Array.isArray(rawTags)) {
    if (typeof rawTags === "string" && rawTags.trim()) {
      rawTags = rawTags.split(/[,;]/);
    } else {
      return [];
    }
  }
  const seen = new Set();
  const tags = [];
  for (const item of rawTags) {
    let tag = String(item || "").trim();
    if (!tag) continue;
    tag = tag.replace(/\s+/g, " ");
    if (!tag.startsWith("#")) tag = `#${tag.replace(/^#+/, "")}`;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
    if (tags.length >= 10) break;
  }
  return tags;
}

function normalizeSummary(rawSummary) {
  const summary = String(rawSummary || "").replace(/\s+/g, " ").trim();
  if (!summary) return "";
  return summary.length > 300 ? `${summary.slice(0, 297).trimEnd()}…` : summary;
}

export class ContextualEnrichmentService {
  constructor({ cloudChatProvider, appSettingsService, globalEnabled = true, logger = null }) {
    this.cloudChatProvider = cloudChatProvider;
    this.appSettingsService = appSettingsService;
    this.globalEnabled = globalEnabled !== false;
    this.logger = logger;
    this._lastCall = null;
  }

  get lastCall() {
    return this._lastCall;
  }

  async getSettings() {
    if (
      !this.appSettingsService ||
      typeof this.appSettingsService.getContextualEnrichmentSettings !== "function"
    ) {
      return {
        enabled: false,
        providerId: "",
        model: "",
        maxTokens: 1500,
        timeoutMs: 30000,
        contextPrompt: "",
        metaPrompt: "",
      };
    }
    return this.appSettingsService.getContextualEnrichmentSettings();
  }

  async resolveProvider(providerId) {
    if (!providerId) return null;
    if (typeof this.appSettingsService?.getCloudProviderById !== "function") return null;
    const provider = await this.appSettingsService.getCloudProviderById(providerId);
    return provider || null;
  }

  // Глобально доступно ли обогащение (мастер-флаг yaml И тумблер в UI И провайдер).
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
    return { ok: true, settings, provider, model };
  }

  buildSystemPrompt(settings) {
    const contextPrompt = (settings.contextPrompt || "").trim();
    const metaPrompt = (settings.metaPrompt || "").trim();
    return [
      contextPrompt,
      metaPrompt,
      'Верни СТРОГО один JSON-объект вида {"context": "...", "tags": ["#тег", ...], "summary": "..."} и больше ничего — без markdown, без пояснений.',
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  buildUserPrompt({ title, documentSummary, chunkText }) {
    const overall = String(documentSummary || "").slice(0, 8000);
    return [
      `Заголовок документа: ${title || "(без названия)"}`,
      "",
      "Общее содержание документа (фрагмент для контекста):",
      overall,
      "",
      "Фрагмент, который нужно описать:",
      "<<<",
      String(chunkText || ""),
      ">>>",
    ].join("\n");
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
      maxTokens: settings.maxTokens || 1500,
      temperature: 0.1,
      timeoutMs: settings.timeoutMs || 30000,
    });
    return result?.content || "";
  }

  // Обогащает один чанк. Возвращает { context, tags, summary } либо null
  // (fallback — чанк индексируется как есть). НИКОГДА не бросает.
  async enrichChunk({ title, documentSummary, chunkText }) {
    const gate = await this.isEnabled();
    if (!gate.ok) {
      this._lastCall = { at: new Date().toISOString(), used: false, reason: gate.reason };
      return null;
    }

    const { settings, provider, model } = gate;
    const systemPrompt = this.buildSystemPrompt(settings);
    if (!systemPrompt) {
      this.logger?.warn?.("Контекстное обогащение: промпт пуст, fallback без обогащения");
      this._lastCall = { at: new Date().toISOString(), used: false, reason: "no_prompt" };
      return null;
    }
    const userPrompt = this.buildUserPrompt({ title, documentSummary, chunkText });

    const delays = [1000, 3000];
    let lastError = null;
    for (let attempt = 0; attempt <= delays.length; attempt += 1) {
      try {
        const content = await this._callOnce({ provider, model, settings, systemPrompt, userPrompt });
        const parsed = parseEnrichmentJson(content);
        if (!parsed) {
          lastError = "json_parse_failed";
          // Повтор может дать валидный JSON.
          if (attempt < delays.length) {
            await new Promise((r) => setTimeout(r, delays[attempt]));
            continue;
          }
          break;
        }
        const context = String(parsed.context || "").replace(/\s+/g, " ").trim();
        const tags = normalizeTags(parsed.tags);
        const summary = normalizeSummary(parsed.summary);
        this._lastCall = {
          at: new Date().toISOString(),
          used: true,
          model,
          providerId: provider.id || settings.providerId,
          hasContext: Boolean(context),
          tagsCount: tags.length,
        };
        return { context, tags, summary };
      } catch (err) {
        lastError = err?.message || String(err);
        if (attempt < delays.length) {
          await new Promise((r) => setTimeout(r, delays[attempt]));
          continue;
        }
      }
    }

    this.logger?.warn?.(
      { reason: lastError, model },
      "Контекстное обогащение: вызов не удался, fallback без обогащения"
    );
    this._lastCall = {
      at: new Date().toISOString(),
      used: false,
      reason: "error",
      error: lastError,
      model,
    };
    return null;
  }
}
