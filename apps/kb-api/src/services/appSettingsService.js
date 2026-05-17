import { DEFAULT_SYSTEM_PROMPT } from "./systemPromptService.js";

const DEFAULT_CLOUD_PROVIDER = {
  name: "",
  baseUrl: "",
  apiKey: "",
  model: "",
  useByDefault: false,
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
    return sanitizeCloudProvider(raw);
  }

  async getCloudProviderPublic() {
    const full = await this.getCloudProvider();
    return {
      name: full.name,
      baseUrl: full.baseUrl,
      model: full.model,
      useByDefault: full.useByDefault,
      apiKey: full.apiKey ? maskApiKey(full.apiKey) : "",
      configured: Boolean(full.baseUrl && full.apiKey),
    };
  }

  async updateCloudProvider(patch) {
    const current = await this.getCloudProvider();
    const next = { ...current };

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

  async getAllPublic() {
    const cloudProvider = await this.getCloudProviderPublic();
    const theme = await this.getTheme();
    const retrieval = await this.getRetrievalPublic();
    const systemPrompt = await this.getSystemPrompt();
    return { cloudProvider, theme, retrieval, systemPrompt };
  }
}

export const SETTINGS_MASK_MARKER = MASK_MARKER;
export { maskApiKey, isMaskOrEmpty };
