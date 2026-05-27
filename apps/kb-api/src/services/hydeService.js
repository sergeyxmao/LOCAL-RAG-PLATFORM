// HyDE (Hypothetical Document Embeddings) — генерирует гипотетический
// фрагмент документа по вопросу пользователя для улучшения semantic-поиска.
// Лечит vocabulary mismatch: «активный модуль с питанием» ↔
// «оборудован канальным источником рабочего напряжения».
//
// Промпт хранится в app_settings (ключ "hyde", поле prompt) и редактируется
// через UI «Настройки → HyDE → Промпт». В коде нет зашитого домена — текст
// настраивается под конкретную предметную область пользователем.

export class HydeService {
  constructor({ cloudChatProvider, appSettingsService, logger = null }) {
    this.cloudChatProvider = cloudChatProvider;
    this.appSettingsService = appSettingsService;
    this.logger = logger;
    this._lastCall = null;
  }

  get lastCall() {
    return this._lastCall;
  }

  async getSettings() {
    if (!this.appSettingsService || typeof this.appSettingsService.getHydeSettings !== "function") {
      return { enabled: false, providerId: "", model: "", maxTokens: 400, timeoutMs: 15000, prompt: "" };
    }
    return this.appSettingsService.getHydeSettings();
  }

  async resolveProvider(providerId) {
    if (!providerId) return null;
    if (typeof this.appSettingsService?.getCloudProviderById !== "function") return null;
    const provider = await this.appSettingsService.getCloudProviderById(providerId);
    return provider || null;
  }

  async generate(query) {
    const settings = await this.getSettings();

    if (!settings.enabled) {
      return { used: false, query, reason: "disabled" };
    }

    const provider = await this.resolveProvider(settings.providerId);
    if (!provider || !provider.baseUrl || !provider.apiKey) {
      this.logger?.warn?.("HyDE: облачный провайдер не настроен, fallback на сырой query");
      this._lastCall = {
        at: new Date().toISOString(),
        used: false,
        reason: "no_provider",
      };
      return { used: false, query, reason: "no_provider" };
    }

    const model = settings.model || provider.model;
    if (!model) {
      this.logger?.warn?.("HyDE: модель не задана, fallback на сырой query");
      this._lastCall = {
        at: new Date().toISOString(),
        used: false,
        reason: "no_model",
      };
      return { used: false, query, reason: "no_model" };
    }

    const systemPrompt = (settings.prompt || "").trim();
    if (!systemPrompt) {
      this.logger?.warn?.("HyDE: промпт пуст, fallback на сырой query");
      this._lastCall = {
        at: new Date().toISOString(),
        used: false,
        reason: "no_prompt",
      };
      return { used: false, query, reason: "no_prompt" };
    }

    const startedAt = Date.now();
    try {
      const result = await this.cloudChatProvider.generate({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
        model,
        baseUrl: provider.baseUrl,
        apiKey: provider.apiKey,
        maxTokens: settings.maxTokens || 400,
        temperature: 0.4,
        timeoutMs: settings.timeoutMs || 15000,
      });

      const hypothetical = (result.content || "").trim();
      const latencyMs = Date.now() - startedAt;

      if (!hypothetical || hypothetical.length < 50) {
        this.logger?.warn?.(
          { latencyMs, length: hypothetical.length },
          "HyDE: ответ слишком короткий, fallback на сырой query"
        );
        this._lastCall = {
          at: new Date().toISOString(),
          used: false,
          reason: "short_response",
          latencyMs,
          model,
        };
        return { used: false, query, reason: "short_response", latencyMs, model };
      }

      this.logger?.info?.(
        { latencyMs, length: hypothetical.length, model },
        "HyDE: гипотетический параграф сгенерирован"
      );
      this._lastCall = {
        at: new Date().toISOString(),
        used: true,
        latencyMs,
        model,
        providerId: provider.id || settings.providerId,
        providerName: provider.name || "",
        hypotheticalLength: hypothetical.length,
      };
      return {
        used: true,
        query: hypothetical,
        originalQuery: query,
        latencyMs,
        model,
        providerId: provider.id || settings.providerId,
        providerName: provider.name || "",
      };
    } catch (err) {
      const latencyMs = Date.now() - startedAt;
      this.logger?.warn?.(
        { err: err?.message || err, latencyMs, model },
        "HyDE: ошибка генерации, fallback на сырой query"
      );
      this._lastCall = {
        at: new Date().toISOString(),
        used: false,
        reason: "error",
        error: err?.message || String(err),
        latencyMs,
        model,
      };
      return {
        used: false,
        query,
        reason: "error",
        error: err?.message || String(err),
        latencyMs,
        model,
      };
    }
  }
}

