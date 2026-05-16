export class CloudProviderError extends Error {
  constructor(code, userMessage, details = {}) {
    super(userMessage);
    this.name = "CloudProviderError";
    this.code = code;
    this.userMessage = userMessage;
    this.details = details;
  }
}

function classifyHttpError(status, bodyText) {
  if (status === 401 || status === 403) {
    return new CloudProviderError(
      "unauthorized",
      "Неверный или просроченный API-ключ облачного провайдера.",
      { status }
    );
  }
  if (status === 429) {
    return new CloudProviderError(
      "rate_limit",
      "Облачный провайдер сейчас ограничивает запросы. Попробуйте позже.",
      { status }
    );
  }
  if (status >= 500) {
    return new CloudProviderError(
      "server_error",
      "Облачный провайдер ответил ошибкой сервера. Попробуйте позже.",
      { status }
    );
  }
  if (status === 404) {
    return new CloudProviderError(
      "server_error",
      "Облачный провайдер не нашёл указанную модель или путь. Проверьте Base URL и название модели.",
      { status }
    );
  }
  return new CloudProviderError(
    "server_error",
    `Облачный провайдер ответил с ошибкой HTTP ${status}.`,
    { status, body: bodyText ? bodyText.slice(0, 200) : null }
  );
}

function classifyNetworkError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  if (error?.name === "AbortError" || message.includes("aborted")) {
    return new CloudProviderError(
      "timeout",
      "Облачный провайдер не успел ответить за отведённое время."
    );
  }
  if (
    message.includes("enotfound") ||
    message.includes("getaddrinfo") ||
    message.includes("econnrefused") ||
    message.includes("network")
  ) {
    return new CloudProviderError(
      "network",
      "Нет связи с облачным провайдером. Проверьте интернет и Base URL."
    );
  }
  return new CloudProviderError(
    "network",
    `Сбой сети при обращении к облаку: ${error?.message || "неизвестно"}`
  );
}

function normalizeBaseUrl(rawUrl) {
  if (!rawUrl) {
    throw new CloudProviderError(
      "no_credentials",
      "Не задан Base URL облачного провайдера."
    );
  }
  return String(rawUrl).trim().replace(/\/+$/, "");
}

function buildEndpoint(baseUrl) {
  const normalized = normalizeBaseUrl(baseUrl);
  if (/\/chat\/completions$/.test(normalized)) {
    return normalized;
  }
  if (/\/v\d+$/.test(normalized)) {
    return `${normalized}/chat/completions`;
  }
  return `${normalized}/v1/chat/completions`;
}

function extractContent(payload) {
  const choice = Array.isArray(payload?.choices) ? payload.choices[0] : null;
  if (!choice) return "";
  const message = choice.message || choice.delta || {};
  if (typeof message.content === "string") {
    return message.content;
  }
  if (Array.isArray(message.content)) {
    return message.content
      .filter((part) => part && typeof part === "object" && typeof part.text === "string")
      .map((part) => part.text)
      .join("");
  }
  if (typeof choice.text === "string") {
    return choice.text;
  }
  return "";
}

function extractUsage(payload) {
  const usage = payload?.usage || {};
  return {
    promptTokens: Number(usage.prompt_tokens ?? usage.input_tokens ?? 0) || 0,
    completionTokens:
      Number(usage.completion_tokens ?? usage.output_tokens ?? 0) || 0,
    totalTokens:
      Number(usage.total_tokens ?? usage.totalTokens ?? 0) ||
      Number(usage.prompt_tokens ?? 0) + Number(usage.completion_tokens ?? 0),
  };
}

export class CloudChatProvider {
  constructor({ defaultTimeoutMs = 60000 } = {}) {
    this.defaultTimeoutMs = defaultTimeoutMs;
  }

  validateCredentials({ baseUrl, apiKey }) {
    if (!baseUrl || !String(baseUrl).trim()) {
      throw new CloudProviderError(
        "no_credentials",
        "Облако не настроено: укажите Base URL в разделе «Настройки»."
      );
    }
    if (!apiKey || !String(apiKey).trim()) {
      throw new CloudProviderError(
        "no_credentials",
        "Облако не настроено: введите API-ключ в разделе «Настройки»."
      );
    }
  }

  async generate({
    messages,
    model,
    baseUrl,
    apiKey,
    maxTokens = 1024,
    temperature = 0.2,
    abortSignal,
    timeoutMs,
  }) {
    this.validateCredentials({ baseUrl, apiKey });

    if (!model || !String(model).trim()) {
      throw new CloudProviderError(
        "no_credentials",
        "Облако не настроено: выберите модель в разделе «Настройки»."
      );
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new CloudProviderError(
        "server_error",
        "Не задан список сообщений для облачной модели."
      );
    }

    const endpoint = buildEndpoint(baseUrl);
    const controller = new AbortController();
    const timeout = Math.max(1000, Number(timeoutMs) || this.defaultTimeoutMs);
    const timer = setTimeout(() => controller.abort(), timeout);

    if (abortSignal) {
      if (abortSignal.aborted) {
        clearTimeout(timer);
        throw new CloudProviderError(
          "timeout",
          "Запрос к облаку был отменён до отправки."
        );
      }
      abortSignal.addEventListener(
        "abort",
        () => {
          controller.abort();
        },
        { once: true }
      );
    }

    let response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${String(apiKey).trim()}`,
        },
        body: JSON.stringify({
          model: String(model).trim(),
          messages,
          temperature,
          max_tokens: Math.max(1, Math.min(4096, Number(maxTokens) || 1024)),
          stream: false,
        }),
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timer);
      throw classifyNetworkError(error);
    }
    clearTimeout(timer);

    let bodyText = "";
    let payload = null;
    try {
      bodyText = await response.text();
      payload = bodyText ? JSON.parse(bodyText) : null;
    } catch (error) {
      if (response.ok) {
        throw new CloudProviderError(
          "server_error",
          "Облако вернуло ответ, который не удалось распарсить как JSON."
        );
      }
    }

    if (!response.ok) {
      throw classifyHttpError(response.status, bodyText);
    }

    const content = extractContent(payload);
    if (!content || !content.trim()) {
      throw new CloudProviderError(
        "server_error",
        "Облако вернуло пустой ответ. Возможно, исчерпан лимит токенов."
      );
    }

    return {
      content,
      usage: extractUsage(payload),
      model: payload?.model || model,
    };
  }

  async testConnection({ baseUrl, apiKey, model }) {
    const startedAt = Date.now();
    const result = await this.generate({
      baseUrl,
      apiKey,
      model,
      messages: [
        {
          role: "user",
          content: "Скажи слово ОК.",
        },
      ],
      maxTokens: 10,
      temperature: 0,
      timeoutMs: 20000,
    });
    return {
      response: result.content,
      model: result.model,
      tokensUsed: result.usage.totalTokens,
      latencyMs: Date.now() - startedAt,
    };
  }
}
