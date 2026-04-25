export class OllamaChatProvider {
  constructor({ baseUrl, model }) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.model = model;
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
