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

function detectThinkingMode(payload) {
  const choice = Array.isArray(payload?.choices) ? payload.choices[0] : null;
  if (!choice) return null;
  const message = choice.message || {};
  const finishReason = choice.finish_reason || choice.finishReason || null;
  const hasReasoning =
    (typeof message.reasoning_content === "string" && message.reasoning_content.trim()) ||
    (typeof message.reasoning === "string" && message.reasoning.trim()) ||
    (Array.isArray(message.tool_calls) && message.tool_calls.length > 0);
  if (hasReasoning) return "reasoning";
  if (finishReason === "length") return "length-cutoff";
  return null;
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
    const thinkingMode = detectThinkingMode(payload);
    if (!content || !content.trim()) {
      if (thinkingMode) {
        return {
          content: "",
          usage: extractUsage(payload),
          model: payload?.model || model,
          thinkingMode,
        };
      }
      throw new CloudProviderError(
        "server_error",
        "Облако вернуло пустой ответ. Возможно, исчерпан лимит токенов."
      );
    }

    return {
      content,
      usage: extractUsage(payload),
      model: payload?.model || model,
      thinkingMode,
    };
  }

  async generateStream({
    messages,
    model,
    baseUrl,
    apiKey,
    maxTokens = 1024,
    temperature = 0.2,
    onToken,
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
    let userAborted = false;
    const onAbort = () => {
      userAborted = true;
      controller.abort();
    };
    if (abortSignal) {
      if (abortSignal.aborted) onAbort();
      else abortSignal.addEventListener("abort", onAbort, { once: true });
    }

    let response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${String(apiKey).trim()}`,
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          model: String(model).trim(),
          messages,
          temperature,
          max_tokens: Math.max(1, Math.min(4096, Number(maxTokens) || 1024)),
          stream: true,
          stream_options: { include_usage: true },
        }),
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timer);
      if (userAborted) {
        return { content: "", aborted: true, usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 } };
      }
      throw classifyNetworkError(error);
    }

    if (!response.ok) {
      clearTimeout(timer);
      const bodyText = await response.text().catch(() => "");
      throw classifyHttpError(response.status, bodyText);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullContent = "";
    let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    let detectedModel = model;
    let thinkingMode = null;

    function parseSseEvent(rawEvent) {
      const dataLines = [];
      for (const line of rawEvent.split("\n")) {
        if (line.startsWith("data:")) {
          dataLines.push(line.slice(5).replace(/^ /, ""));
        }
      }
      if (dataLines.length === 0) return null;
      const dataStr = dataLines.join("\n");
      if (dataStr === "[DONE]") return { done: true };
      try {
        return { payload: JSON.parse(dataStr) };
      } catch (err) {
        return null;
      }
    }

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let sepIndex;
        while ((sepIndex = buffer.indexOf("\n\n")) >= 0) {
          const rawEvent = buffer.slice(0, sepIndex);
          buffer = buffer.slice(sepIndex + 2);
          const parsed = parseSseEvent(rawEvent);
          if (!parsed) continue;
          if (parsed.done) {
            clearTimeout(timer);
            return { content: fullContent, usage, model: detectedModel, thinkingMode, aborted: false };
          }
          const payload = parsed.payload;
          if (payload?.model) detectedModel = payload.model;
          const choice = Array.isArray(payload?.choices) ? payload.choices[0] : null;
          const delta = choice?.delta || {};
          const piece = typeof delta.content === "string" ? delta.content : "";
          if (piece) {
            fullContent += piece;
            if (typeof onToken === "function") {
              try { onToken(piece); } catch (err) { /* swallow */ }
            }
          }
          if (delta.reasoning_content || delta.reasoning) {
            thinkingMode = "reasoning";
          }
          if (payload?.usage) {
            const u = payload.usage;
            usage = {
              promptTokens: Number(u.prompt_tokens ?? u.input_tokens ?? usage.promptTokens) || 0,
              completionTokens: Number(u.completion_tokens ?? u.output_tokens ?? usage.completionTokens) || 0,
              totalTokens: Number(u.total_tokens ?? usage.totalTokens) || 0,
            };
          }
        }
      }
    } catch (error) {
      clearTimeout(timer);
      if (userAborted || controller.signal.aborted) {
        return { content: fullContent, usage, model: detectedModel, thinkingMode, aborted: true };
      }
      throw classifyNetworkError(error);
    }

    clearTimeout(timer);
    return { content: fullContent, usage, model: detectedModel, thinkingMode, aborted: userAborted };
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
      maxTokens: 50,
      temperature: 0,
      timeoutMs: 25000,
    });
    let response = result.content;
    if ((!response || !response.trim()) && result.thinkingMode) {
      response =
        result.thinkingMode === "reasoning"
          ? "(модель использует reasoning/thinking mode — соединение работает)"
          : "(модель израсходовала лимит токенов на скрытое размышление — соединение работает)";
    }
    return {
      response,
      model: result.model,
      tokensUsed: result.usage.totalTokens,
      latencyMs: Date.now() - startedAt,
      thinkingMode: result.thinkingMode || null,
    };
  }
}
