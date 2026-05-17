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
      ocrAll: raw.ocrAll === true,
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

  async getAllPublic() {
    const cloudProvider = await this.getCloudProviderPublic();
    const cloudProviders = await this.getCloudProvidersPublic();
    const theme = await this.getTheme();
    const retrieval = await this.getRetrievalPublic();
    const systemPrompt = await this.getSystemPrompt();
    return { cloudProvider, cloudProviders, theme, retrieval, systemPrompt };
  }
}

export const SETTINGS_MASK_MARKER = MASK_MARKER;
export { maskApiKey, isMaskOrEmpty };
