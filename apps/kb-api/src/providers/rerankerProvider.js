/**
 * HTTP-клиент к reranker-сервисам.
 *
 * Поддерживает два бэкенда с одинаковым форматом запроса/ответа,
 * совместимым с Jina /v1/rerank:
 *   POST  { query, documents: [<string>...], top_n? }
 *   <-    { results: [{ index, relevance_score }, ...] }
 *
 * - "jina"  → облачный Jina API (требует apiKey, шлёт фрагменты в облако).
 * - "local" → локальный сервис `apps/reranker-service` (privacy-friendly,
 *             медленнее на CPU).
 *
 * Любая сетевая/HTTP-ошибка пробрасывается наверх с типом RerankerError —
 * вызывающий код в searchService делает fallback на эвристику.
 */

export class RerankerError extends Error {
  constructor(message, { code = "reranker_error", cause = null, status = null } = {}) {
    super(message);
    this.name = "RerankerError";
    this.code = code;
    this.status = status;
    if (cause) this.cause = cause;
  }
}

function ensureDocuments(documents) {
  if (!Array.isArray(documents)) return [];
  return documents.map((doc) => (doc === null || doc === undefined ? "" : String(doc)));
}

async function postJson(url, { headers = {}, body, timeoutMs = 45000, signal } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(500, Number(timeoutMs) || 45000));
  const cleanup = () => clearTimeout(timer);

  if (signal) {
    if (signal.aborted) {
      cleanup();
      throw new RerankerError("Запрос reranker'а был отменён", { code: "aborted" });
    }
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    cleanup();
    if (error?.name === "AbortError") {
      throw new RerankerError("Reranker не ответил вовремя", {
        code: "timeout",
        cause: error,
      });
    }
    throw new RerankerError(`Сеть до reranker'а недоступна: ${error?.message || error}`, {
      code: "network",
      cause: error,
    });
  }
  cleanup();

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new RerankerError(
      `Reranker вернул HTTP ${response.status}${text ? `: ${text.slice(0, 200)}` : ""}`,
      { code: response.status === 401 || response.status === 403 ? "auth" : "http", status: response.status }
    );
  }

  try {
    return await response.json();
  } catch (error) {
    throw new RerankerError("Reranker вернул не-JSON ответ", {
      code: "bad_response",
      cause: error,
    });
  }
}

function parseResults(data, documentsLength) {
  const list = Array.isArray(data?.results) ? data.results : [];
  return list
    .map((item) => ({
      index: Number(item?.index),
      score: Number(item?.relevance_score ?? item?.score ?? 0),
    }))
    .filter(
      (item) =>
        Number.isInteger(item.index) &&
        item.index >= 0 &&
        item.index < documentsLength &&
        Number.isFinite(item.score)
    );
}

export class RerankerProvider {
  constructor({ defaultLocalUrl = "http://localrag-reranker:8090", defaultJinaUrl = "https://api.jina.ai/v1/rerank", defaultJinaModel = "jina-reranker-v2-base-multilingual", defaultTimeoutMs = 45000 } = {}) {
    this.defaultLocalUrl = defaultLocalUrl;
    this.defaultJinaUrl = defaultJinaUrl;
    this.defaultJinaModel = defaultJinaModel;
    this.defaultTimeoutMs = defaultTimeoutMs;
  }

  async rerankLocal({ query, documents, topN, url, timeoutMs, signal } = {}) {
    const docs = ensureDocuments(documents);
    if (!docs.length) return [];
    const baseUrl = String(url || this.defaultLocalUrl || "").trim().replace(/\/+$/, "");
    if (!baseUrl) {
      throw new RerankerError("URL локального reranker'а не задан", { code: "no_url" });
    }
    const endpoint = `${baseUrl}/rerank`;
    const data = await postJson(endpoint, {
      timeoutMs: timeoutMs ?? this.defaultTimeoutMs,
      signal,
      body: {
        query: String(query ?? ""),
        documents: docs,
        top_n: Number.isFinite(topN) ? topN : undefined,
      },
    });
    return parseResults(data, docs.length);
  }

  async rerankJina({ query, documents, topN, apiKey, model, url, timeoutMs, signal } = {}) {
    const docs = ensureDocuments(documents);
    if (!docs.length) return [];
    const key = String(apiKey || "").trim();
    if (!key) {
      throw new RerankerError("Не задан API-ключ Jina", { code: "no_key" });
    }
    const endpoint = String(url || this.defaultJinaUrl || "").trim();
    if (!endpoint) {
      throw new RerankerError("URL Jina API не задан", { code: "no_url" });
    }
    const data = await postJson(endpoint, {
      timeoutMs: timeoutMs ?? this.defaultTimeoutMs,
      signal,
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
      body: {
        model: String(model || this.defaultJinaModel),
        query: String(query ?? ""),
        documents: docs,
        top_n: Number.isFinite(topN) ? topN : docs.length,
      },
    });
    return parseResults(data, docs.length);
  }

  async pingLocal(url, timeoutMs = 3000) {
    const baseUrl = String(url || this.defaultLocalUrl || "").trim().replace(/\/+$/, "");
    if (!baseUrl) return { ok: false, error: "URL не задан" };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${baseUrl}/health`, { signal: controller.signal });
      clearTimeout(timer);
      if (!response.ok) {
        return { ok: false, status: response.status };
      }
      const body = await response.json().catch(() => ({}));
      return {
        ok: body?.ok === true,
        status: response.status,
        details: {
          model: body?.model || null,
          device: body?.device || null,
          modelLoaded: body?.model_loaded === true,
          modelLoadError: body?.model_load_error || null,
        },
      };
    } catch (error) {
      clearTimeout(timer);
      return { ok: false, error: error?.message || "недоступен" };
    }
  }

  async pingJina({ apiKey, url, model, timeoutMs = 5000 } = {}) {
    if (!apiKey || !String(apiKey).trim()) {
      return { ok: false, error: "ключ не задан" };
    }
    try {
      // Лёгкий запрос с одним документом — реальная проверка ключа и сети.
      await this.rerankJina({
        query: "ping",
        documents: ["ping"],
        topN: 1,
        apiKey,
        url,
        model,
        timeoutMs,
      });
      return { ok: true };
    } catch (error) {
      const code = error instanceof RerankerError ? error.code : "unknown";
      return { ok: false, code, error: error?.message || String(error) };
    }
  }
}
