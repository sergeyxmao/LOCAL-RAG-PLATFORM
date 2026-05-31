import { randomUUID } from "node:crypto";

import { DEFAULT_SYSTEM_PROMPT } from "./systemPromptService.js";

const DEFAULT_CLOUD_PROVIDER = {
  name: "",
  baseUrl: "",
  apiKey: "",
  model: "",
  useByDefault: false,
};

const DEFAULT_CLOUD_PROVIDERS = {
  providers: [],
  defaultProviderId: null,
};

const DEFAULT_THEME = {
  defaultTheme: "dark",
};

const RERANKING_PROVIDERS = new Set(["heuristic", "jina", "local"]);
const DEFAULT_RERANKING = {
  provider: "heuristic",
  jinaApiKey: "",
  localUrl: "",
};

const DEFAULT_HYDE_PROMPT = `Ты помогаешь поисковой системе по технической документации.
Получив вопрос пользователя, сгенерируй ОДИН развёрнутый абзац (200-400 слов) в стиле документации того предмета, о котором задан вопрос — как если бы это был фрагмент реального документа, где даётся ответ на этот вопрос.
Используй терминологию и стиль, характерные для соответствующей области (если вопрос про оборудование — технические параметры и обозначения; если про процессы — этапы и роли; если про правила — формулировки нормативного типа; и т.д.). Старайся имитировать, как мог бы быть написан ответ в реальном документе.
Не отвечай пользователю напрямую и не давай советов — просто напиши гипотетический параграф документа. Без преамбулы, без оговорок, без markdown — только сам параграф сплошным текстом.`;

const DEFAULT_HYDE = {
  enabled: false,
  providerId: "",
  model: "",
  maxTokens: 400,
  timeoutMs: 15000,
  prompt: DEFAULT_HYDE_PROMPT,
};

// --- Контекстное обогащение чанков (Слой 2). Промпты доменно-агностичны. ---
const DEFAULT_ENRICHMENT_CONTEXT_PROMPT = `Ты помогаешь поисковой системе индексировать документы.
Дай краткий контекст (1–2 предложения): где в документе находится приведённый фрагмент и о чём он.
Если во фрагменте есть точные обозначения, коды, идентификаторы, номера, даты, серийные номера, адреса — приведи их в контексте ДОСЛОВНО, не искажая и не сокращая.
Не пересказывай весь документ и не выдумывай деталей, которых нет во фрагменте или общем содержании.
Пиши на языке документа. Это значение пойдёт в поле "context".`;

const DEFAULT_ENRICHMENT_META_PROMPT = `Дополнительно сгенерируй для этого же фрагмента метаданные:
"tags" — массив коротких тегов по ключевым понятиям фрагмента, каждый с символом «#», не более 10 штук;
"summary" — краткое описание фрагмента не длиннее 300 символов, на языке документа, без вымысла.
Эти значения пойдут в поля "tags" и "summary" и НЕ участвуют в поиске — только для отображения и фильтров.`;

const DEFAULT_CONTEXTUAL_ENRICHMENT = {
  enabled: false,
  providerId: "",
  model: "",
  maxTokens: 1500,
  timeoutMs: 30000,
  contextPrompt: DEFAULT_ENRICHMENT_CONTEXT_PROMPT,
  metaPrompt: DEFAULT_ENRICHMENT_META_PROMPT,
};

function sanitizeContextualEnrichmentSettings(raw) {
  const safe = raw && typeof raw === "object" ? raw : {};
  const maxTokensRaw = Number(safe.maxTokens);
  const timeoutRaw = Number(safe.timeoutMs);
  const contextPrompt =
    typeof safe.contextPrompt === "string" && safe.contextPrompt.trim()
      ? safe.contextPrompt
      : DEFAULT_ENRICHMENT_CONTEXT_PROMPT;
  const metaPrompt =
    typeof safe.metaPrompt === "string" && safe.metaPrompt.trim()
      ? safe.metaPrompt
      : DEFAULT_ENRICHMENT_META_PROMPT;
  return {
    enabled: safe.enabled === true,
    providerId: typeof safe.providerId === "string" ? safe.providerId.trim() : "",
    model: typeof safe.model === "string" ? safe.model.trim() : "",
    maxTokens: Number.isFinite(maxTokensRaw)
      ? Math.max(200, Math.min(4000, Math.trunc(maxTokensRaw)))
      : DEFAULT_CONTEXTUAL_ENRICHMENT.maxTokens,
    timeoutMs: Number.isFinite(timeoutRaw)
      ? Math.max(5000, Math.min(120000, Math.trunc(timeoutRaw)))
      : DEFAULT_CONTEXTUAL_ENRICHMENT.timeoutMs,
    contextPrompt,
    metaPrompt,
  };
}

function sanitizeHydeSettings(raw) {
  const safe = raw && typeof raw === "object" ? raw : {};
  const maxTokensRaw = Number(safe.maxTokens);
  const timeoutRaw = Number(safe.timeoutMs);
  const prompt = typeof safe.prompt === "string" && safe.prompt.trim()
    ? safe.prompt
    : DEFAULT_HYDE_PROMPT;
  return {
    enabled: safe.enabled === true,
    providerId: typeof safe.providerId === "string" ? safe.providerId.trim() : "",
    model: typeof safe.model === "string" ? safe.model.trim() : "",
    maxTokens: Number.isFinite(maxTokensRaw)
      ? Math.max(50, Math.min(2000, Math.trunc(maxTokensRaw)))
      : DEFAULT_HYDE.maxTokens,
    timeoutMs: Number.isFinite(timeoutRaw)
      ? Math.max(2000, Math.min(60000, Math.trunc(timeoutRaw)))
      : DEFAULT_HYDE.timeoutMs,
    prompt,
  };
}

// --- Извлечение знаний из документов (Память инженера — Этап 3). ---
// Промпт доменно-агностичен: не предполагает АСУ ТП. Просит модель извлечь
// случаи «оборудование / что произошло / что сделали», переносить точные
// обозначения дословно и вернуть строгий JSON по контракту {cases:[...]}.
const DEFAULT_KNOWLEDGE_EXTRACTION_PROMPT = `Ты извлекаешь из текста производственные случаи опыта эксплуатации. Каждый случай — это связка: какое ОБОРУДОВАНИЕ фигурирует, ЧТО С НИМ ПРОИЗОШЛО (неисправность, отказ, событие) и ЧТО СДЕЛАЛИ (решение, действие).
Правила:
- Переноси точные обозначения, модели, серийные номера, теги, коды, адреса и даты ДОСЛОВНО, как в тексте. Ничего не исправляй, не дополняй и не выдумывай.
- Если какого-то поля в тексте нет — оставь его пустым (null). Не придумывай значения.
- Не объединяй разные случаи в один и не дроби один случай на несколько.
- Для каждого случая приведи source_quote — короткую дословную цитату из текста, на которой основан случай (для проверки человеком).
- Даты указывай в формате YYYY-MM-DD, только если они однозначно определяются из текста; иначе null.
- confidence — твоя оценка уверенности в случае от 0 до 1.
Извлекай случаи из любой предметной области (оборудование, приборы, узлы, машины, ПО — что угодно). Если в тексте нет ни одного случая — верни пустой список.`;

const DEFAULT_KNOWLEDGE_EXTRACTION = {
  enabled: false,
  providerId: "",
  model: "",
  maxTokens: 2000,
  timeoutMs: 60000,
  prompt: DEFAULT_KNOWLEDGE_EXTRACTION_PROMPT,
};

function sanitizeKnowledgeExtractionSettings(raw) {
  const safe = raw && typeof raw === "object" ? raw : {};
  const maxTokensRaw = Number(safe.maxTokens);
  const timeoutRaw = Number(safe.timeoutMs);
  const prompt =
    typeof safe.prompt === "string" && safe.prompt.trim()
      ? safe.prompt
      : DEFAULT_KNOWLEDGE_EXTRACTION_PROMPT;
  return {
    enabled: safe.enabled === true,
    providerId: typeof safe.providerId === "string" ? safe.providerId.trim() : "",
    model: typeof safe.model === "string" ? safe.model.trim() : "",
    maxTokens: Number.isFinite(maxTokensRaw)
      ? Math.max(500, Math.min(8000, Math.trunc(maxTokensRaw)))
      : DEFAULT_KNOWLEDGE_EXTRACTION.maxTokens,
    timeoutMs: Number.isFinite(timeoutRaw)
      ? Math.max(5000, Math.min(180000, Math.trunc(timeoutRaw)))
      : DEFAULT_KNOWLEDGE_EXTRACTION.timeoutMs,
    prompt,
  };
}

function sanitizeRerankingSettings(raw) {
  const safe = raw && typeof raw === "object" ? raw : {};
  const provider = String(safe.provider || DEFAULT_RERANKING.provider).toLowerCase();
  return {
    provider: RERANKING_PROVIDERS.has(provider) ? provider : DEFAULT_RERANKING.provider,
    jinaApiKey: typeof safe.jinaApiKey === "string" ? safe.jinaApiKey : "",
    localUrl: String(safe.localUrl || "").trim().replace(/\/+$/, ""),
  };
}

const MASK_MARKER = "•••••";

function maskApiKey(rawKey) {
  if (!rawKey || typeof rawKey !== "string") return "";
  const trimmed = rawKey.trim();
  if (trimmed.length === 0) return "";
  const tail = trimmed.length >= 4 ? trimmed.slice(-4) : trimmed;
  const prefix = trimmed.length > 8 ? trimmed.slice(0, 3) : "";
  return `${prefix}${prefix ? "-" : ""}${MASK_MARKER}${tail}`;
}

function isMaskOrEmpty(value) {
  if (value === undefined || value === null) return true;
  const text = String(value);
  if (!text.trim()) return true;
  return text.includes(MASK_MARKER);
}

function sanitizeCloudProvider(raw) {
  const safe = { ...DEFAULT_CLOUD_PROVIDER, ...(raw || {}) };
  return {
    name: String(safe.name || "").trim(),
    baseUrl: String(safe.baseUrl || "").trim().replace(/\/+$/, ""),
    apiKey: String(safe.apiKey || ""),
    model: String(safe.model || "").trim(),
    useByDefault: safe.useByDefault === true,
  };
}

function sanitizeProviderEntry(raw, { fallbackId } = {}) {
  const safe = raw && typeof raw === "object" ? raw : {};
  const id =
    typeof safe.id === "string" && safe.id.trim() ? safe.id.trim() : fallbackId || randomUUID();
  return {
    id,
    name: String(safe.name || "").trim(),
    baseUrl: String(safe.baseUrl || "").trim().replace(/\/+$/, ""),
    apiKey: String(safe.apiKey || ""),
    model: String(safe.model || "").trim(),
  };
}

function sanitizeCloudProviders(raw) {
  if (!raw || typeof raw !== "object") {
    return { providers: [], defaultProviderId: null };
  }
  const rawList = Array.isArray(raw.providers) ? raw.providers : [];
  const providers = [];
  const seenIds = new Set();
  for (const entry of rawList) {
    const cleaned = sanitizeProviderEntry(entry);
    if (seenIds.has(cleaned.id)) {
      cleaned.id = randomUUID();
    }
    seenIds.add(cleaned.id);
    providers.push(cleaned);
  }
  let defaultProviderId =
    typeof raw.defaultProviderId === "string" && raw.defaultProviderId.trim()
      ? raw.defaultProviderId.trim()
      : null;
  if (defaultProviderId && !providers.some((p) => p.id === defaultProviderId)) {
    defaultProviderId = null;
  }
  if (!defaultProviderId && providers.length > 0) {
    defaultProviderId = providers[0].id;
  }
  return { providers, defaultProviderId };
}

function maskProviderPublic(provider) {
  return {
    id: provider.id,
    name: provider.name,
    baseUrl: provider.baseUrl,
    model: provider.model,
    apiKey: provider.apiKey ? maskApiKey(provider.apiKey) : "",
    configured: Boolean(provider.baseUrl && provider.apiKey && provider.model),
  };
}

function sanitizeTheme(raw) {
  const merged = { ...DEFAULT_THEME, ...(raw || {}) };
  const value = String(merged.defaultTheme || "dark").toLowerCase();
  return {
    defaultTheme: ["dark", "light", "system"].includes(value) ? value : "dark",
  };
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(target, source) {
  if (!isPlainObject(source)) return target;
  const out = isPlainObject(target) ? { ...target } : {};
  for (const key of Object.keys(source)) {
    const sv = source[key];
    if (isPlainObject(sv)) {
      out[key] = deepMerge(out[key], sv);
    } else if (sv !== undefined) {
      out[key] = sv;
    }
  }
  return out;
}

const RETRIEVAL_BOOL_KEYS = new Set(["reranking.enabled"]);
const RETRIEVAL_NUM_KEYS = new Set([
  "semantic.top_k",
  "bm25.top_k",
  "fusion.top_k_final",
  "reranking.candidate_pool",
]);

function sanitizeRetrievalOverride(raw) {
  if (!isPlainObject(raw)) return {};
  const allowedRoots = ["semantic", "bm25", "fusion", "reranking"];
  const result = {};
  for (const root of allowedRoots) {
    if (!isPlainObject(raw[root])) continue;
    const section = {};
    for (const [k, v] of Object.entries(raw[root])) {
      const flat = `${root}.${k}`;
      if (RETRIEVAL_NUM_KEYS.has(flat)) {
        const n = Number(v);
        if (Number.isFinite(n)) section[k] = Math.max(0, Math.trunc(n));
      } else if (RETRIEVAL_BOOL_KEYS.has(flat)) {
        section[k] = v === true || v === "true" || v === 1;
      } else if (typeof v === "string") {
        section[k] = v;
      } else if (Number.isFinite(v) || typeof v === "boolean") {
        section[k] = v;
      }
    }
    if (Object.keys(section).length > 0) result[root] = section;
  }
  return result;
}

function sanitizeSystemPrompt(raw) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "string") return raw;
  if (isPlainObject(raw) && typeof raw.template === "string") return raw.template;
  return null;
}

export class AppSettingsService {
  constructor({ postgresProvider, retrievalDefaults = {} } = {}) {
    this.postgresProvider = postgresProvider;
    this.cache = new Map();
    this.retrievalDefaults = retrievalDefaults || {};
    this.retrievalEffective = retrievalDefaults || {};
  }

  get pool() {
    return this.postgresProvider.pool;
  }

  async refreshRetrievalCache() {
    const override = (await this.getRawValue("retrieval")) || {};
    this.retrievalEffective = deepMerge(this.retrievalDefaults, sanitizeRetrievalOverride(override));
    return this.retrievalEffective;
  }

  async getMigrationFlag(name) {
    const all = (await this.getRawValue("migrations")) || {};
    return all && all[name] === true;
  }

  async setMigrationFlag(name) {
    const all = (await this.getRawValue("migrations")) || {};
    all[name] = true;
    await this.setRawValue("migrations", all);
  }

  getRetrievalConfigSync() {
    return this.retrievalEffective || this.retrievalDefaults || {};
  }

  async getRetrievalPublic() {
    const override = (await this.getRawValue("retrieval")) || {};
    const cleanOverride = sanitizeRetrievalOverride(override);
    const effective = deepMerge(this.retrievalDefaults, cleanOverride);
    return {
      defaults: this.retrievalDefaults,
      override: cleanOverride,
      effective,
    };
  }

  async updateRetrieval(patch) {
    const current = (await this.getRawValue("retrieval")) || {};
    const merged = sanitizeRetrievalOverride(deepMerge(current, patch));
    await this.setRawValue("retrieval", merged);
    await this.refreshRetrievalCache();
    return this.getRetrievalPublic();
  }

  async resetRetrieval() {
    await this.pool.query(`DELETE FROM app_settings WHERE key = $1`, ["retrieval"]);
    this.cache.delete("retrieval");
    await this.refreshRetrievalCache();
    return this.getRetrievalPublic();
  }

  async getSystemPrompt() {
    const raw = await this.getRawValue("systemPrompt");
    const template = sanitizeSystemPrompt(raw);
    return {
      template: template || DEFAULT_SYSTEM_PROMPT,
      isCustom: template !== null && template !== DEFAULT_SYSTEM_PROMPT,
      default: DEFAULT_SYSTEM_PROMPT,
    };
  }

  async updateSystemPrompt(template) {
    if (typeof template !== "string") {
      throw new Error("Шаблон промпта должен быть строкой");
    }
    const value = template.length > 0 ? template : null;
    await this.setRawValue("systemPrompt", value === null ? null : { template: value });
    return this.getSystemPrompt();
  }

  async resetSystemPrompt() {
    await this.pool.query(`DELETE FROM app_settings WHERE key = $1`, ["systemPrompt"]);
    this.cache.delete("systemPrompt");
    return this.getSystemPrompt();
  }

  async getRawValue(key) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    const { rows } = await this.pool.query(
      `SELECT value FROM app_settings WHERE key = $1`,
      [key]
    );
    const value = rows[0]?.value ?? null;
    this.cache.set(key, value);
    return value;
  }

  async setRawValue(key, value) {
    await this.pool.query(
      `INSERT INTO app_settings (key, value, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [key, JSON.stringify(value)]
    );
    this.cache.delete(key);
  }

  invalidate() {
    this.cache.clear();
  }

  async getCloudProvider() {
    const raw = (await this.getRawValue("cloudProvider")) || DEFAULT_CLOUD_PROVIDER;
    const single = sanitizeCloudProvider(raw);
    if (single.baseUrl && single.apiKey && single.model) {
      return single;
    }
    const { providers, defaultProviderId } = await this.getCloudProviders();
    const fallback =
      providers.find((p) => p.id === defaultProviderId) || providers[0] || null;
    if (!fallback) return single;
    return {
      name: fallback.name,
      baseUrl: fallback.baseUrl,
      apiKey: fallback.apiKey,
      model: fallback.model,
      useByDefault: single.useByDefault === true,
    };
  }

  async getCloudProviderPublic() {
    const full = await this.getCloudProvider();
    return {
      name: full.name,
      baseUrl: full.baseUrl,
      model: full.model,
      useByDefault: full.useByDefault,
      apiKey: full.apiKey ? maskApiKey(full.apiKey) : "",
      configured: Boolean(full.baseUrl && full.apiKey && full.model),
    };
  }

  async updateCloudProvider(patch) {
    const legacyRaw = (await this.getRawValue("cloudProvider")) || DEFAULT_CLOUD_PROVIDER;
    const next = sanitizeCloudProvider(legacyRaw);

    if (patch.name !== undefined) next.name = String(patch.name || "").trim();
    if (patch.baseUrl !== undefined) {
      next.baseUrl = String(patch.baseUrl || "").trim().replace(/\/+$/, "");
    }
    if (patch.model !== undefined) next.model = String(patch.model || "").trim();
    if (patch.useByDefault !== undefined) {
      next.useByDefault = patch.useByDefault === true;
    }
    if (patch.apiKey !== undefined && !isMaskOrEmpty(patch.apiKey)) {
      next.apiKey = String(patch.apiKey);
    }

    await this.setRawValue("cloudProvider", sanitizeCloudProvider(next));
    return this.getCloudProviderPublic();
  }

  async getCloudProviders() {
    const stored = await this.getRawValue("cloudProviders");
    if (stored && typeof stored === "object") {
      return sanitizeCloudProviders(stored);
    }
    return this.migrateLegacyCloudProvider();
  }

  async migrateLegacyCloudProvider() {
    const legacyRaw = (await this.getRawValue("cloudProvider")) || DEFAULT_CLOUD_PROVIDER;
    const legacy = sanitizeCloudProvider(legacyRaw);
    if (legacy.baseUrl && legacy.apiKey && legacy.model) {
      const provider = sanitizeProviderEntry({
        id: randomUUID(),
        name: legacy.name || "Облачный провайдер",
        baseUrl: legacy.baseUrl,
        apiKey: legacy.apiKey,
        model: legacy.model,
      });
      const next = { providers: [provider], defaultProviderId: provider.id };
      await this.setRawValue("cloudProviders", next);
      return next;
    }
    const empty = { providers: [], defaultProviderId: null };
    await this.setRawValue("cloudProviders", empty);
    return empty;
  }

  async getCloudProvidersPublic() {
    const { providers, defaultProviderId } = await this.getCloudProviders();
    return {
      providers: providers.map(maskProviderPublic),
      defaultProviderId,
    };
  }

  async getCloudProviderById(id) {
    if (!id || typeof id !== "string") return null;
    const { providers } = await this.getCloudProviders();
    return providers.find((p) => p.id === id) || null;
  }

  async getDefaultCloudProvider() {
    const { providers, defaultProviderId } = await this.getCloudProviders();
    if (!providers.length) return null;
    return providers.find((p) => p.id === defaultProviderId) || providers[0] || null;
  }

  async addCloudProvider({ name, baseUrl, apiKey, model }) {
    if (!name || !String(name).trim()) {
      throw Object.assign(new Error("Укажите название провайдера"), { statusCode: 400 });
    }
    if (!baseUrl || !String(baseUrl).trim()) {
      throw Object.assign(new Error("Укажите Base URL провайдера"), { statusCode: 400 });
    }
    if (!apiKey || !String(apiKey).trim() || isMaskOrEmpty(apiKey)) {
      throw Object.assign(new Error("Укажите API-ключ провайдера"), { statusCode: 400 });
    }
    if (!model || !String(model).trim()) {
      throw Object.assign(new Error("Укажите модель провайдера"), { statusCode: 400 });
    }
    const current = await this.getCloudProviders();
    const provider = sanitizeProviderEntry({
      id: randomUUID(),
      name,
      baseUrl,
      apiKey,
      model,
    });
    const providers = [...current.providers, provider];
    const defaultProviderId = current.defaultProviderId || provider.id;
    await this.setRawValue("cloudProviders", { providers, defaultProviderId });
    return { provider: maskProviderPublic(provider), defaultProviderId };
  }

  async updateCloudProviderById(id, patch) {
    const current = await this.getCloudProviders();
    const idx = current.providers.findIndex((p) => p.id === id);
    if (idx < 0) {
      throw Object.assign(new Error("Провайдер не найден"), { statusCode: 404 });
    }
    const before = current.providers[idx];
    const next = { ...before };
    if (patch.name !== undefined) next.name = String(patch.name || "").trim();
    if (patch.baseUrl !== undefined) {
      next.baseUrl = String(patch.baseUrl || "").trim().replace(/\/+$/, "");
    }
    if (patch.model !== undefined) next.model = String(patch.model || "").trim();
    if (patch.apiKey !== undefined && !isMaskOrEmpty(patch.apiKey)) {
      next.apiKey = String(patch.apiKey);
    }
    const cleaned = sanitizeProviderEntry({ ...next, id });
    const providers = current.providers.slice();
    providers[idx] = cleaned;
    await this.setRawValue("cloudProviders", {
      providers,
      defaultProviderId: current.defaultProviderId || cleaned.id,
    });
    return maskProviderPublic(cleaned);
  }

  async deleteCloudProvider(id) {
    const current = await this.getCloudProviders();
    if (!current.providers.some((p) => p.id === id)) {
      throw Object.assign(new Error("Провайдер не найден"), { statusCode: 404 });
    }
    if (current.defaultProviderId === id && current.providers.length > 1) {
      throw Object.assign(
        new Error("Сначала назначьте другого провайдера по умолчанию — этот используется как default."),
        { statusCode: 409, code: "default_in_use" }
      );
    }
    const providers = current.providers.filter((p) => p.id !== id);
    const defaultProviderId =
      current.defaultProviderId === id ? providers[0]?.id || null : current.defaultProviderId;
    await this.setRawValue("cloudProviders", { providers, defaultProviderId });
    return { providers: providers.map(maskProviderPublic), defaultProviderId };
  }

  async setDefaultCloudProvider(providerId) {
    const current = await this.getCloudProviders();
    if (!current.providers.some((p) => p.id === providerId)) {
      throw Object.assign(new Error("Провайдер не найден"), { statusCode: 404 });
    }
    await this.setRawValue("cloudProviders", {
      providers: current.providers,
      defaultProviderId: providerId,
    });
    return { defaultProviderId: providerId };
  }

  async getTheme() {
    const raw = (await this.getRawValue("theme")) || DEFAULT_THEME;
    return sanitizeTheme(raw);
  }

  async updateTheme(patch) {
    const current = await this.getTheme();
    const next = sanitizeTheme({ ...current, ...(patch || {}) });
    await this.setRawValue("theme", next);
    return next;
  }

  async getOcrSettings() {
    const raw = (await this.getRawValue("ocr")) || {};
    return {
      autoOcrEmptyPages: raw.autoOcrEmptyPages !== false,
      // #8.1.c.fix-2: дефолт переключён с false на true. Владелец работает
      // преимущественно со сканами. Для уже установленных систем — миграция
      // через runOcrAllDefaultTrueMigration() (см. index.js).
      ocrAll: raw.ocrAll !== false,
    };
  }

  async getIndexingSettings() {
    const raw = (await this.getRawValue("indexing")) || {};
    const n = Number(raw.concurrency);
    const concurrency = Number.isFinite(n) ? Math.max(1, Math.min(4, Math.trunc(n))) : 1;
    return { concurrency };
  }

  async updateIndexingSettings(patch) {
    const current = await this.getIndexingSettings();
    let concurrency = current.concurrency;
    if (patch && patch.concurrency !== undefined) {
      const n = Number(patch.concurrency);
      if (!Number.isFinite(n) || n < 1 || n > 4) {
        throw Object.assign(new Error("concurrency должен быть от 1 до 4"), { statusCode: 400 });
      }
      concurrency = Math.trunc(n);
    }
    const next = { concurrency };
    await this.setRawValue("indexing", next);
    return next;
  }

  async getGenerationSettings() {
    const raw = (await this.getRawValue("generation")) || {};
    const n = Number(raw.maxTokens);
    const maxTokens = Number.isFinite(n) ? Math.max(256, Math.min(8192, Math.trunc(n))) : 4096;
    return { maxTokens };
  }

  async updateGenerationSettings(patch) {
    const current = await this.getGenerationSettings();
    let maxTokens = current.maxTokens;
    if (patch && patch.maxTokens !== undefined) {
      const n = Number(patch.maxTokens);
      if (!Number.isFinite(n) || n < 256 || n > 8192) {
        throw Object.assign(new Error("maxTokens должен быть от 256 до 8192"), { statusCode: 400 });
      }
      maxTokens = Math.trunc(n);
    }
    const next = { maxTokens };
    await this.setRawValue("generation", next);
    return next;
  }

  async updateOcrSettings(patch) {
    const current = await this.getOcrSettings();
    const next = {
      autoOcrEmptyPages:
        patch.autoOcrEmptyPages === undefined
          ? current.autoOcrEmptyPages
          : patch.autoOcrEmptyPages === true,
      ocrAll: patch.ocrAll === undefined ? current.ocrAll : patch.ocrAll === true,
    };
    await this.setRawValue("ocr", next);
    return next;
  }

  async getRerankingSettings() {
    const raw = (await this.getRawValue("reranking")) || DEFAULT_RERANKING;
    return sanitizeRerankingSettings(raw);
  }

  async getHydeSettings() {
    const raw = (await this.getRawValue("hyde")) || DEFAULT_HYDE;
    return sanitizeHydeSettings(raw);
  }

  async getHydePublic() {
    const full = await this.getHydeSettings();
    return {
      enabled: full.enabled,
      providerId: full.providerId,
      model: full.model,
      maxTokens: full.maxTokens,
      timeoutMs: full.timeoutMs,
      prompt: full.prompt,
      defaultPrompt: DEFAULT_HYDE_PROMPT,
      isCustomPrompt: full.prompt !== DEFAULT_HYDE_PROMPT,
    };
  }

  async updateHydeSettings(patch) {
    const current = await this.getHydeSettings();
    const next = { ...current };
    if (patch && patch.enabled !== undefined) {
      next.enabled = patch.enabled === true;
    }
    if (patch && patch.providerId !== undefined) {
      next.providerId = String(patch.providerId || "").trim();
    }
    if (patch && patch.model !== undefined) {
      next.model = String(patch.model || "").trim();
    }
    if (patch && patch.maxTokens !== undefined) {
      const n = Number(patch.maxTokens);
      if (!Number.isFinite(n) || n < 50 || n > 2000) {
        throw Object.assign(new Error("maxTokens должен быть от 50 до 2000"), { statusCode: 400 });
      }
      next.maxTokens = Math.trunc(n);
    }
    if (patch && patch.timeoutMs !== undefined) {
      const n = Number(patch.timeoutMs);
      if (!Number.isFinite(n) || n < 2000 || n > 60000) {
        throw Object.assign(new Error("timeoutMs должен быть от 2000 до 60000"), { statusCode: 400 });
      }
      next.timeoutMs = Math.trunc(n);
    }
    if (patch && typeof patch.prompt === "string") {
      const trimmed = patch.prompt.trim();
      next.prompt = trimmed.length > 0 ? patch.prompt : DEFAULT_HYDE_PROMPT;
    }
    const cleaned = sanitizeHydeSettings(next);
    await this.setRawValue("hyde", cleaned);
    return this.getHydePublic();
  }

  async resetHydePrompt() {
    const current = await this.getHydeSettings();
    const next = { ...current, prompt: DEFAULT_HYDE_PROMPT };
    await this.setRawValue("hyde", sanitizeHydeSettings(next));
    return this.getHydePublic();
  }

  async getContextualEnrichmentSettings() {
    const raw = (await this.getRawValue("contextual_enrichment")) || DEFAULT_CONTEXTUAL_ENRICHMENT;
    return sanitizeContextualEnrichmentSettings(raw);
  }

  async getContextualEnrichmentPublic() {
    const full = await this.getContextualEnrichmentSettings();
    return {
      enabled: full.enabled,
      providerId: full.providerId,
      model: full.model,
      maxTokens: full.maxTokens,
      timeoutMs: full.timeoutMs,
      contextPrompt: full.contextPrompt,
      metaPrompt: full.metaPrompt,
      defaultContextPrompt: DEFAULT_ENRICHMENT_CONTEXT_PROMPT,
      defaultMetaPrompt: DEFAULT_ENRICHMENT_META_PROMPT,
      isCustomContextPrompt: full.contextPrompt !== DEFAULT_ENRICHMENT_CONTEXT_PROMPT,
      isCustomMetaPrompt: full.metaPrompt !== DEFAULT_ENRICHMENT_META_PROMPT,
    };
  }

  async updateContextualEnrichmentSettings(patch) {
    const current = await this.getContextualEnrichmentSettings();
    const next = { ...current };
    if (patch && patch.enabled !== undefined) {
      next.enabled = patch.enabled === true;
    }
    if (patch && patch.providerId !== undefined) {
      next.providerId = String(patch.providerId || "").trim();
    }
    if (patch && patch.model !== undefined) {
      next.model = String(patch.model || "").trim();
    }
    if (patch && patch.maxTokens !== undefined) {
      const n = Number(patch.maxTokens);
      if (!Number.isFinite(n) || n < 200 || n > 4000) {
        throw Object.assign(new Error("maxTokens должен быть от 200 до 4000"), { statusCode: 400 });
      }
      next.maxTokens = Math.trunc(n);
    }
    if (patch && patch.timeoutMs !== undefined) {
      const n = Number(patch.timeoutMs);
      if (!Number.isFinite(n) || n < 5000 || n > 120000) {
        throw Object.assign(new Error("timeoutMs должен быть от 5000 до 120000"), { statusCode: 400 });
      }
      next.timeoutMs = Math.trunc(n);
    }
    if (patch && typeof patch.contextPrompt === "string") {
      const trimmed = patch.contextPrompt.trim();
      next.contextPrompt = trimmed.length > 0 ? patch.contextPrompt : DEFAULT_ENRICHMENT_CONTEXT_PROMPT;
    }
    if (patch && typeof patch.metaPrompt === "string") {
      const trimmed = patch.metaPrompt.trim();
      next.metaPrompt = trimmed.length > 0 ? patch.metaPrompt : DEFAULT_ENRICHMENT_META_PROMPT;
    }
    const cleaned = sanitizeContextualEnrichmentSettings(next);
    await this.setRawValue("contextual_enrichment", cleaned);
    return this.getContextualEnrichmentPublic();
  }

  async resetContextualEnrichmentPrompt(which) {
    const current = await this.getContextualEnrichmentSettings();
    const next = { ...current };
    if (which === "context") {
      next.contextPrompt = DEFAULT_ENRICHMENT_CONTEXT_PROMPT;
    } else if (which === "meta") {
      next.metaPrompt = DEFAULT_ENRICHMENT_META_PROMPT;
    } else {
      throw Object.assign(new Error("Неизвестный промпт. Допустимо: context | meta"), {
        statusCode: 400,
      });
    }
    await this.setRawValue("contextual_enrichment", sanitizeContextualEnrichmentSettings(next));
    return this.getContextualEnrichmentPublic();
  }

  // --- Извлечение знаний из документов (Этап 3) ---
  async getKnowledgeExtractionSettings() {
    const raw =
      (await this.getRawValue("knowledge_extraction")) || DEFAULT_KNOWLEDGE_EXTRACTION;
    return sanitizeKnowledgeExtractionSettings(raw);
  }

  async getKnowledgeExtractionPublic() {
    const full = await this.getKnowledgeExtractionSettings();
    return {
      enabled: full.enabled,
      providerId: full.providerId,
      model: full.model,
      maxTokens: full.maxTokens,
      timeoutMs: full.timeoutMs,
      prompt: full.prompt,
      defaultPrompt: DEFAULT_KNOWLEDGE_EXTRACTION_PROMPT,
      isCustomPrompt: full.prompt !== DEFAULT_KNOWLEDGE_EXTRACTION_PROMPT,
    };
  }

  async updateKnowledgeExtractionSettings(patch) {
    const current = await this.getKnowledgeExtractionSettings();
    const next = { ...current };
    if (patch && patch.enabled !== undefined) {
      next.enabled = patch.enabled === true;
    }
    if (patch && patch.providerId !== undefined) {
      next.providerId = String(patch.providerId || "").trim();
    }
    if (patch && patch.model !== undefined) {
      next.model = String(patch.model || "").trim();
    }
    if (patch && patch.maxTokens !== undefined) {
      const n = Number(patch.maxTokens);
      if (!Number.isFinite(n) || n < 500 || n > 8000) {
        throw Object.assign(new Error("maxTokens должен быть от 500 до 8000"), {
          statusCode: 400,
        });
      }
      next.maxTokens = Math.trunc(n);
    }
    if (patch && patch.timeoutMs !== undefined) {
      const n = Number(patch.timeoutMs);
      if (!Number.isFinite(n) || n < 5000 || n > 180000) {
        throw Object.assign(new Error("timeoutMs должен быть от 5000 до 180000"), {
          statusCode: 400,
        });
      }
      next.timeoutMs = Math.trunc(n);
    }
    if (patch && typeof patch.prompt === "string") {
      const trimmed = patch.prompt.trim();
      next.prompt = trimmed.length > 0 ? patch.prompt : DEFAULT_KNOWLEDGE_EXTRACTION_PROMPT;
    }
    const cleaned = sanitizeKnowledgeExtractionSettings(next);
    await this.setRawValue("knowledge_extraction", cleaned);
    return this.getKnowledgeExtractionPublic();
  }

  async resetKnowledgeExtractionPrompt() {
    const current = await this.getKnowledgeExtractionSettings();
    const next = { ...current, prompt: DEFAULT_KNOWLEDGE_EXTRACTION_PROMPT };
    await this.setRawValue("knowledge_extraction", sanitizeKnowledgeExtractionSettings(next));
    return this.getKnowledgeExtractionPublic();
  }

  async getRerankingPublic() {
    const full = await this.getRerankingSettings();
    return {
      provider: full.provider,
      localUrl: full.localUrl,
      jinaApiKey: full.jinaApiKey ? maskApiKey(full.jinaApiKey) : "",
      jinaConfigured: Boolean(full.jinaApiKey && full.jinaApiKey.trim()),
    };
  }

  async updateRerankingSettings(patch) {
    const current = await this.getRerankingSettings();
    const next = { ...current };
    if (patch && patch.provider !== undefined) {
      const provider = String(patch.provider || "").toLowerCase();
      if (!RERANKING_PROVIDERS.has(provider)) {
        throw Object.assign(
          new Error("Неизвестный провайдер reranking. Допустимо: jina, local, heuristic."),
          { statusCode: 400 }
        );
      }
      next.provider = provider;
    }
    if (patch && patch.localUrl !== undefined) {
      next.localUrl = String(patch.localUrl || "").trim().replace(/\/+$/, "");
    }
    if (patch && patch.jinaApiKey !== undefined && !isMaskOrEmpty(patch.jinaApiKey)) {
      next.jinaApiKey = String(patch.jinaApiKey);
    }
    if (patch && patch.clearJinaApiKey === true) {
      next.jinaApiKey = "";
    }
    const cleaned = sanitizeRerankingSettings(next);
    await this.setRawValue("reranking", cleaned);
    return this.getRerankingPublic();
  }

  async getAllPublic() {
    const cloudProvider = await this.getCloudProviderPublic();
    const cloudProviders = await this.getCloudProvidersPublic();
    const theme = await this.getTheme();
    const retrieval = await this.getRetrievalPublic();
    const systemPrompt = await this.getSystemPrompt();
    const generation = await this.getGenerationSettings();
    const reranking = await this.getRerankingPublic();
    const hyde = await this.getHydePublic();
    const contextualEnrichment = await this.getContextualEnrichmentPublic();
    const knowledgeExtraction = await this.getKnowledgeExtractionPublic();
    return {
      cloudProvider,
      cloudProviders,
      theme,
      retrieval,
      systemPrompt,
      generation,
      reranking,
      hyde,
      contextualEnrichment,
      knowledgeExtraction,
    };
  }
}

export const SETTINGS_MASK_MARKER = MASK_MARKER;
export { maskApiKey, isMaskOrEmpty };
