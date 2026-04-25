export class OllamaEmbeddingProvider {
  constructor({
    baseUrl,
    model,
    unloadModels = [],
    batchSize = 2,
    requestTimeoutMs = 180000,
    maxInputChars = 2500,
    keepAlive = "30m",
    prepareCooldownMs = 120000,
  }) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.model = model;
    this.unloadModels = unloadModels;
    this.batchSize = batchSize;
    this.requestTimeoutMs = requestTimeoutMs;
    this.maxInputChars = maxInputChars;
    this.keepAlive = keepAlive;
    this.prepareCooldownMs = prepareCooldownMs;
    this.lastPrepareAt = 0;
  }

  normalizeInput(value) {
    const text = String(value ?? "").replace(/\s+/g, " ").trim();
    if (text.length <= this.maxInputChars) {
      return text;
    }

    return text.slice(0, this.maxInputChars);
  }

  async unloadModel(modelName) {
    if (!modelName || modelName === this.model) {
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      try {
        await fetch(`${this.baseUrl}/api/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: modelName,
            prompt: "",
            stream: false,
            keep_alive: 0,
          }),
        });
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      // Best-effort unload for weak machines; ignore if model is not currently loaded.
    }
  }

  buildReachabilityError(error) {
    const reason =
      error?.name === "AbortError"
        ? `таймаут ${this.requestTimeoutMs} мс`
        : error?.cause?.message ?? error?.message ?? "неизвестная ошибка";

    return new Error(
      `Ollama недоступен по ${this.baseUrl}. Проверьте, что на хосте запущен 'ollama serve' и отвечает порт 11434. Техническая причина: ${reason}`
    );
  }

  async prepareForEmbedding({ force = false } = {}) {
    if (this.unloadModels.length === 0) {
      return;
    }

    const now = Date.now();
    if (!force && now - this.lastPrepareAt < this.prepareCooldownMs) {
      return;
    }

    for (const modelName of this.unloadModels) {
      await this.unloadModel(modelName);
    }

    this.lastPrepareAt = now;
  }

  async embed(input) {
    const values = (Array.isArray(input) ? input : [input]).map((value) =>
      this.normalizeInput(value)
    );
    if (values.length === 0) {
      return [];
    }

    await this.prepareForEmbedding();

    const allEmbeddings = [];
    for (let start = 0; start < values.length; start += this.batchSize) {
      const batchValues = values.slice(start, start + this.batchSize);
      const batchEmbeddings = await this.embedBatchWithFallback(batchValues);
      allEmbeddings.push(...batchEmbeddings);
    }

    return allEmbeddings;
  }

  async requestEmbeddings(values) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    try {
      let response;

      try {
        response = await fetch(`${this.baseUrl}/api/embed`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: this.model,
            input: values,
            truncate: true,
            keep_alive: this.keepAlive,
          }),
        });
      } catch (error) {
        throw this.buildReachabilityError(error);
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama embedding request failed: ${response.status} ${errorText}`);
      }

      const payload = await response.json();
      const embeddings = payload.embeddings ?? [];
      if (embeddings.length !== values.length) {
        throw new Error(
          `Ollama embedding response size mismatch: expected ${values.length}, got ${embeddings.length}`
        );
      }

      return embeddings;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async embedBatchWithFallback(values) {
    let lastError = null;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await this.requestEmbeddings(values);
      } catch (error) {
        lastError = error;
        if (attempt < 3) {
          await this.prepareForEmbedding({ force: true });
          await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
        }
      }
    }

    if (values.length > 1) {
      const midpoint = Math.ceil(values.length / 2);
      const left = await this.embedBatchWithFallback(values.slice(0, midpoint));
      const right = await this.embedBatchWithFallback(values.slice(midpoint));
      return [...left, ...right];
    }

    throw lastError ?? new Error("Ollama embedding request failed");
  }
}
