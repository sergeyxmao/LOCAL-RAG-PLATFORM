import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { Agent, fetch as undiciFetch } from "undici";

// Облачный провайдер эмбеддингов GigaChat (Sber).
// Аутентификация: Basic <Authorization Key> -> POST /api/v2/oauth -> access_token.
// Эмбеддинги:    Bearer <token>             -> POST /api/v1/embeddings.
// TLS: API Sber подписан CA «Минцифры», которого нет в trust store Node.js.
//      Пути решения:
//        - GIGACHAT_CA_BUNDLE=/path/to/russian_trusted_root_ca.pem (правильно)
//        - GIGACHAT_VERIFY_SSL=false (быстро, для локальной разработки)
export class GigachatEmbeddingProvider {
  constructor({
    authKey,
    scope = "GIGACHAT_API_PERS",
    model = "Embeddings",
    oauthUrl = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth",
    apiUrl = "https://gigachat.devices.sberbank.ru/api/v1/embeddings",
    verifySsl = true,
    caBundlePath = "",
    batchSize = 32,
    maxInputChars = 2500,
    requestTimeoutMs = 60000,
  }) {
    if (!authKey) {
      throw new Error(
        "GigaChat: не задан Authorization Key. Установите GIGACHAT_AUTH_KEY (base64 от client_id:client_secret) в infra/.env."
      );
    }

    this.authKey = authKey;
    this.scope = scope;
    this.model = model;
    this.oauthUrl = oauthUrl;
    this.apiUrl = apiUrl;
    this.batchSize = Math.max(1, Number(batchSize) || 32);
    this.maxInputChars = Math.max(1, Number(maxInputChars) || 2500);
    this.requestTimeoutMs = Math.max(1000, Number(requestTimeoutMs) || 60000);

    this._token = null;
    this._tokenExpiresAt = 0;

    const connectOptions = { rejectUnauthorized: verifySsl !== false };
    if (caBundlePath && fs.existsSync(caBundlePath)) {
      connectOptions.ca = fs.readFileSync(caBundlePath);
    }
    this.dispatcher = new Agent({ connect: connectOptions });
  }

  normalizeInput(value) {
    const text = String(value ?? "").replace(/\s+/g, " ").trim();
    return text.length <= this.maxInputChars ? text : text.slice(0, this.maxInputChars);
  }

  async ensureToken() {
    const now = Date.now();
    if (this._token && now < this._tokenExpiresAt - 60_000) {
      return this._token;
    }

    const body = new URLSearchParams({ scope: this.scope }).toString();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    try {
      const res = await undiciFetch(this.oauthUrl, {
        method: "POST",
        dispatcher: this.dispatcher,
        signal: controller.signal,
        headers: {
          Authorization: `Basic ${this.authKey}`,
          RqUID: randomUUID(),
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`GigaChat OAuth failed: ${res.status} ${text}`);
      }

      const json = await res.json();
      this._token = json.access_token;
      let exp = Number(json.expires_at);
      if (!Number.isFinite(exp) || exp <= 0) {
        exp = Date.now() + 25 * 60 * 1000;
      } else if (exp < 1e12) {
        exp *= 1000; // секунды -> миллисекунды
      }
      this._tokenExpiresAt = exp;
      return this._token;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async embed(input) {
    const values = (Array.isArray(input) ? input : [input])
      .map((value) => this.normalizeInput(value))
      .filter((value) => value.length > 0);
    if (values.length === 0) {
      return [];
    }

    const out = [];
    for (let i = 0; i < values.length; i += this.batchSize) {
      const batch = values.slice(i, i + this.batchSize);
      const vectors = await this.requestEmbeddings(batch);
      out.push(...vectors);
    }
    return out;
  }

  async requestEmbeddings(values, attempt = 1) {
    const token = await this.ensureToken();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    try {
      const res = await undiciFetch(this.apiUrl, {
        method: "POST",
        dispatcher: this.dispatcher,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ model: this.model, input: values }),
      });

      if (res.status === 401 && attempt === 1) {
        this._token = null;
        return this.requestEmbeddings(values, attempt + 1);
      }

      if (res.status === 413) {
        // GigaChat кап на вход ~514 токенов. Если кто-то из чанков плотнее
        // нашего символьного лимита — режем все значения батча пополам и
        // повторяем. До 5 уровней рекурсии (1400 -> 700 -> 350 -> 175 -> 87 -> 43).
        if (attempt <= 5) {
          const trimmed = values.map((v) =>
            v.length > 1 ? v.slice(0, Math.max(1, Math.floor(v.length / 2))) : v
          );
          return this.requestEmbeddings(trimmed, attempt + 1);
        }
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`GigaChat embeddings failed: ${res.status} ${text}`);
      }

      const json = await res.json();
      const data = Array.isArray(json.data) ? json.data : [];
      if (data.length !== values.length) {
        throw new Error(
          `GigaChat embeddings size mismatch: expected ${values.length}, got ${data.length}`
        );
      }
      return data.map((d) => d.embedding);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async prepareForEmbedding() {
    // Облачному провайдеру не нужно выгружать чат-модель из памяти, как Ollama.
  }
}
