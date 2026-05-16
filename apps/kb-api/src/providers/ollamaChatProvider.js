export class OllamaChatProvider {
  constructor({ baseUrl, model }) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.model = model;
  }

  async generateStream({
    messages,
    onToken,
    abortSignal,
    timeoutMs = 180000,
    numPredict = 512,
  }) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    let userAborted = false;
    const onAbort = () => {
      userAborted = true;
      controller.abort();
    };
    if (abortSignal) {
      if (abortSignal.aborted) {
        onAbort();
      } else {
        abortSignal.addEventListener("abort", onAbort, { once: true });
      }
    }

    let response;
    try {
      response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          stream: true,
          think: false,
          keep_alive: 0,
          options: {
            temperature: 0.1,
            num_predict: numPredict,
          },
          messages,
        }),
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (userAborted) {
        return { content: "", aborted: true, usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 } };
      }
      throw error;
    }

    if (!response.ok) {
      clearTimeout(timeoutId);
      const errorText = await response.text().catch(() => "");
      throw new Error(`Ollama chat stream failed: ${response.status} ${errorText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullContent = "";
    let evalCount = 0;
    let promptEvalCount = 0;

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);
          if (!line) continue;
          let payload;
          try {
            payload = JSON.parse(line);
          } catch (err) {
            continue;
          }
          const piece = payload?.message?.content ?? "";
          if (piece) {
            fullContent += piece;
            if (typeof onToken === "function") {
              try { onToken(piece); } catch (err) { /* swallow */ }
            }
          }
          if (typeof payload?.eval_count === "number") evalCount = payload.eval_count;
          if (typeof payload?.prompt_eval_count === "number") promptEvalCount = payload.prompt_eval_count;
          if (payload?.done === true) {
            clearTimeout(timeoutId);
            return {
              content: fullContent,
              usage: {
                promptTokens: promptEvalCount,
                completionTokens: evalCount,
                totalTokens: promptEvalCount + evalCount,
              },
              aborted: false,
            };
          }
        }
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (userAborted || controller.signal.aborted) {
        return {
          content: fullContent,
          usage: {
            promptTokens: promptEvalCount,
            completionTokens: evalCount,
            totalTokens: promptEvalCount + evalCount,
          },
          aborted: true,
        };
      }
      throw error;
    }

    clearTimeout(timeoutId);
    return {
      content: fullContent,
      usage: {
        promptTokens: promptEvalCount,
        completionTokens: evalCount,
        totalTokens: promptEvalCount + evalCount,
      },
      aborted: userAborted,
    };
  }

  async generate(messages) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    let response;

    try {
      response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          stream: false,
          think: false,
          keep_alive: 0,
          options: {
            temperature: 0.1,
            num_predict: 96,
          },
          messages,
        }),
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama chat request failed: ${response.status} ${errorText}`);
    }

    const payload = await response.json();
    return payload.message?.content ?? "";
  }
}
