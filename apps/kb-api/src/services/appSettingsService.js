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

export class AppSettingsService {
  constructor({ postgresProvider }) {
    this.postgresProvider = postgresProvider;
    this.cache = new Map();
  }

  get pool() {
    return this.postgresProvider.pool;
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
    return { cloudProvider, theme };
  }
}

export const SETTINGS_MASK_MARKER = MASK_MARKER;
export { maskApiKey, isMaskOrEmpty };
