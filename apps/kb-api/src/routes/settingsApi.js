import { CloudProviderError } from "../providers/cloudChatProvider.js";
import { isMaskOrEmpty } from "../services/appSettingsService.js";

function respondError(reply, statusCode, message, extras = {}) {
  reply.code(statusCode);
  return { ok: false, error: message, ...extras };
}

async function checkOllama(baseUrl) {
  if (!baseUrl) return { ok: false, error: "Не задан Base URL Ollama" };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/api/tags`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!response.ok) return { ok: false, status: response.status };
    return { ok: true };
  } catch (error) {
    clearTimeout(timer);
    return { ok: false, error: error?.message || "Ollama недоступна" };
  }
}

async function checkPostgres(postgresProvider) {
  try {
    await postgresProvider.pool.query("SELECT 1");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error?.message || "Postgres недоступен" };
  }
}

async function checkQdrant(qdrantProvider) {
  try {
    const url = qdrantProvider?.url || qdrantProvider?.config?.url || null;
    if (qdrantProvider?.client?.getCollections) {
      await qdrantProvider.client.getCollections();
      return { ok: true };
    }
    if (url) {
      const response = await fetch(`${url.replace(/\/+$/, "")}/collections`, {
        method: "GET",
        signal: AbortSignal.timeout(4000),
      });
      return { ok: response.ok, status: response.status };
    }
    return { ok: false, error: "Qdrant провайдер не настроен" };
  } catch (error) {
    return { ok: false, error: error?.message || "Qdrant недоступен" };
  }
}

export async function settingsApiRoutes(app) {
  app.get("/api/v2/settings", async (request, reply) => {
    try {
      const settings = await app.appSettingsService.getAllPublic();
      const models = {
        chat: {
          provider: app.config.models.chat.provider,
          model: app.config.models.chat.model,
          baseUrl: app.config.models.chat.base_url,
        },
        embedding: {
          provider: app.config.models.embedding.provider,
          model: app.config.models.embedding.model,
          baseUrl: app.config.models.embedding.base_url,
        },
      };
      const retrieval = {
        semantic: app.config.retrieval?.semantic || null,
        lexical: app.config.retrieval?.lexical || null,
        fusion: app.config.retrieval?.fusion || null,
      };
      return { ok: true, settings, models, retrieval };
    } catch (error) {
      request.log.error({ err: error }, "Не удалось получить настройки");
      return respondError(reply, 500, error.message || "Не удалось получить настройки");
    }
  });

  app.get("/api/v2/settings/cloudProvider", async (request, reply) => {
    try {
      const cloudProvider = await app.appSettingsService.getCloudProviderPublic();
      return { ok: true, cloudProvider };
    } catch (error) {
      request.log.error({ err: error }, "Не удалось получить настройки облака");
      return respondError(reply, 500, error.message || "Не удалось получить настройки облака");
    }
  });

  app.patch("/api/v2/settings/cloudProvider", async (request, reply) => {
    try {
      const body = request.body ?? {};
      const payload = {};
      if (body.name !== undefined) payload.name = body.name;
      if (body.baseUrl !== undefined) payload.baseUrl = body.baseUrl;
      if (body.model !== undefined) payload.model = body.model;
      if (body.useByDefault !== undefined) payload.useByDefault = body.useByDefault === true;
      if (body.apiKey !== undefined) payload.apiKey = body.apiKey;
      const cloudProvider = await app.appSettingsService.updateCloudProvider(payload);
      return { ok: true, cloudProvider };
    } catch (error) {
      request.log.error({ err: error }, "Не удалось сохранить настройки облака");
      return respondError(reply, 500, error.message || "Не удалось сохранить настройки облака");
    }
  });

  app.post("/api/v2/settings/cloudProvider/test", async (request, reply) => {
    try {
      const body = request.body ?? {};
      const stored = await app.appSettingsService.getCloudProvider();

      const baseUrl =
        body.baseUrl !== undefined && String(body.baseUrl || "").trim()
          ? String(body.baseUrl).trim()
          : stored.baseUrl;
      const model =
        body.model !== undefined && String(body.model || "").trim()
          ? String(body.model).trim()
          : stored.model;
      const apiKey =
        body.apiKey !== undefined && !isMaskOrEmpty(body.apiKey)
          ? String(body.apiKey)
          : stored.apiKey;

      if (!baseUrl || !apiKey || !model) {
        reply.code(400);
        return {
          ok: false,
          code: "no_credentials",
          message: "Укажите Base URL, API-ключ и модель.",
        };
      }

      const result = await app.cloudChatProvider.testConnection({
        baseUrl,
        apiKey,
        model,
      });
      request.log.info(
        { model, latencyMs: result.latencyMs, tokensUsed: result.tokensUsed },
        "Cloud provider connectivity test succeeded"
      );
      return { ok: true, ...result };
    } catch (error) {
      const isCloudErr = error instanceof CloudProviderError;
      request.log.warn(
        { code: isCloudErr ? error.code : "unknown", message: isCloudErr ? error.userMessage : error.message },
        "Cloud provider connectivity test failed"
      );
      reply.code(200);
      return {
        ok: false,
        code: isCloudErr ? error.code : "server_error",
        message: isCloudErr ? error.userMessage : `Сбой: ${error.message || error}`,
      };
    }
  });

  app.get("/api/v2/settings/cloudProviders", async (request, reply) => {
    try {
      const data = await app.appSettingsService.getCloudProvidersPublic();
      return { ok: true, ...data };
    } catch (error) {
      request.log.error({ err: error }, "Не удалось получить список облачных провайдеров");
      return respondError(reply, 500, error.message || "Не удалось получить список провайдеров");
    }
  });

  app.post("/api/v2/settings/cloudProviders", async (request, reply) => {
    try {
      const body = request.body ?? {};
      const result = await app.appSettingsService.addCloudProvider({
        name: body.name,
        baseUrl: body.baseUrl,
        apiKey: body.apiKey,
        model: body.model,
      });
      reply.code(201);
      return { ok: true, provider: result.provider, defaultProviderId: result.defaultProviderId };
    } catch (error) {
      const code = error.statusCode || 500;
      if (code !== 500) {
        return respondError(reply, code, error.message);
      }
      request.log.error({ err: error }, "Не удалось добавить облачного провайдера");
      return respondError(reply, 500, error.message || "Не удалось добавить провайдера");
    }
  });

  app.patch("/api/v2/settings/cloudProviders/default", async (request, reply) => {
    try {
      const body = request.body ?? {};
      if (!body.providerId || typeof body.providerId !== "string") {
        return respondError(reply, 400, "Не передан providerId");
      }
      const data = await app.appSettingsService.setDefaultCloudProvider(body.providerId);
      return { ok: true, ...data };
    } catch (error) {
      const code = error.statusCode || 500;
      if (code !== 500) {
        return respondError(reply, code, error.message);
      }
      request.log.error({ err: error }, "Не удалось сменить провайдера по умолчанию");
      return respondError(reply, 500, error.message || "Не удалось сменить провайдера");
    }
  });

  app.patch("/api/v2/settings/cloudProviders/:id", async (request, reply) => {
    try {
      const body = request.body ?? {};
      const provider = await app.appSettingsService.updateCloudProviderById(request.params.id, {
        name: body.name,
        baseUrl: body.baseUrl,
        apiKey: body.apiKey,
        model: body.model,
      });
      return { ok: true, provider };
    } catch (error) {
      const code = error.statusCode || 500;
      if (code !== 500) {
        return respondError(reply, code, error.message);
      }
      request.log.error({ err: error, providerId: request.params.id }, "Не удалось обновить провайдера");
      return respondError(reply, 500, error.message || "Не удалось обновить провайдера");
    }
  });

  app.delete("/api/v2/settings/cloudProviders/:id", async (request, reply) => {
    try {
      const data = await app.appSettingsService.deleteCloudProvider(request.params.id);
      return { ok: true, ...data };
    } catch (error) {
      const code = error.statusCode || 500;
      if (code !== 500) {
        const payload = { ok: false, error: error.message };
        if (error.code) payload.code = error.code;
        reply.code(code);
        return payload;
      }
      request.log.error({ err: error, providerId: request.params.id }, "Не удалось удалить провайдера");
      return respondError(reply, 500, error.message || "Не удалось удалить провайдера");
    }
  });

  app.post("/api/v2/settings/cloudProviders/:id/test", async (request, reply) => {
    try {
      const body = request.body ?? {};
      const stored = await app.appSettingsService.getCloudProviderById(request.params.id);
      if (!stored) {
        return respondError(reply, 404, "Провайдер не найден");
      }
      const baseUrl =
        body.baseUrl !== undefined && String(body.baseUrl || "").trim()
          ? String(body.baseUrl).trim()
          : stored.baseUrl;
      const model =
        body.model !== undefined && String(body.model || "").trim()
          ? String(body.model).trim()
          : stored.model;
      const apiKey =
        body.apiKey !== undefined && !isMaskOrEmpty(body.apiKey)
          ? String(body.apiKey)
          : stored.apiKey;
      if (!baseUrl || !apiKey || !model) {
        reply.code(400);
        return {
          ok: false,
          code: "no_credentials",
          message: "У провайдера не заполнены Base URL, ключ или модель.",
        };
      }
      const result = await app.cloudChatProvider.testConnection({ baseUrl, apiKey, model });
      request.log.info(
        { providerId: stored.id, model, latencyMs: result.latencyMs },
        "Provider connectivity test succeeded"
      );
      return { ok: true, ...result };
    } catch (error) {
      const isCloudErr = error instanceof CloudProviderError;
      request.log.warn(
        {
          providerId: request.params.id,
          code: isCloudErr ? error.code : "unknown",
          message: isCloudErr ? error.userMessage : error.message,
        },
        "Provider connectivity test failed"
      );
      reply.code(200);
      return {
        ok: false,
        code: isCloudErr ? error.code : "server_error",
        message: isCloudErr ? error.userMessage : `Сбой: ${error.message || error}`,
      };
    }
  });

  app.patch("/api/v2/settings/theme", async (request, reply) => {
    try {
      const body = request.body ?? {};
      const theme = await app.appSettingsService.updateTheme({
        defaultTheme: body.defaultTheme,
      });
      return { ok: true, theme };
    } catch (error) {
      request.log.error({ err: error }, "Не удалось сохранить тему");
      return respondError(reply, 500, error.message || "Не удалось сохранить тему");
    }
  });

  app.get("/api/v2/settings/ocr", async (request, reply) => {
    try {
      const ocr = await app.appSettingsService.getOcrSettings();
      const available = app.ocrService ? await app.ocrService.isAvailable() : false;
      return { ok: true, ocr, available };
    } catch (error) {
      request.log.error({ err: error }, "Не удалось получить настройки OCR");
      return respondError(reply, 500, error.message || "Не удалось получить настройки OCR");
    }
  });

  app.get("/api/v2/settings/indexing", async (request, reply) => {
    try {
      const indexing = await app.appSettingsService.getIndexingSettings();
      const semaphore = app.indexingSemaphore ? app.indexingSemaphore.size() : null;
      return { ok: true, indexing, semaphore };
    } catch (error) {
      request.log.error({ err: error }, "Не удалось получить настройки индексации");
      return respondError(reply, 500, error.message || "Не удалось получить настройки индексации");
    }
  });

  app.patch("/api/v2/settings/indexing", async (request, reply) => {
    try {
      const body = request.body ?? {};
      const indexing = await app.appSettingsService.updateIndexingSettings({
        concurrency: body.concurrency,
      });
      if (app.indexingSemaphore) {
        app.indexingSemaphore.setMax(indexing.concurrency);
      }
      return { ok: true, indexing };
    } catch (error) {
      const code = error.statusCode || 500;
      if (code !== 500) {
        return respondError(reply, code, error.message);
      }
      request.log.error({ err: error }, "Не удалось сохранить настройки индексации");
      return respondError(reply, 500, error.message || "Не удалось сохранить настройки индексации");
    }
  });

  app.get(
    "/api/v2/settings/generation",
    {
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              generation: {
                type: "object",
                properties: {
                  maxTokens: { type: "integer" },
                },
                required: ["maxTokens"],
                additionalProperties: false,
              },
            },
            required: ["ok", "generation"],
          },
          500: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              error: { type: "string" },
            },
            required: ["ok", "error"],
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const generation = await app.appSettingsService.getGenerationSettings();
        return { ok: true, generation };
      } catch (error) {
        request.log.error({ err: error }, "Не удалось получить настройки генерации");
        return respondError(reply, 500, error.message || "Не удалось получить настройки генерации");
      }
    }
  );

  app.patch(
    "/api/v2/settings/generation",
    {
      attachValidation: true,
      schema: {
        body: {
          type: "object",
          properties: {
            maxTokens: { type: "integer", minimum: 256, maximum: 8192 },
          },
          additionalProperties: false,
        },
        response: {
          200: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              generation: {
                type: "object",
                properties: {
                  maxTokens: { type: "integer" },
                },
                required: ["maxTokens"],
                additionalProperties: false,
              },
            },
            required: ["ok", "generation"],
          },
          400: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              error: { type: "string" },
            },
            required: ["ok", "error"],
          },
          500: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              error: { type: "string" },
            },
            required: ["ok", "error"],
          },
        },
      },
    },
    async (request, reply) => {
      if (request.validationError) {
        return respondError(reply, 400, "maxTokens должен быть целым числом от 256 до 8192");
      }
      try {
        const body = request.body ?? {};
        const generation = await app.appSettingsService.updateGenerationSettings({
          maxTokens: body.maxTokens,
        });
        return { ok: true, generation };
      } catch (error) {
        const code = error.statusCode || 500;
        if (code !== 500) {
          return respondError(reply, code, error.message);
        }
        request.log.error({ err: error }, "Не удалось сохранить настройки генерации");
        return respondError(reply, 500, error.message || "Не удалось сохранить настройки генерации");
      }
    }
  );

  app.patch("/api/v2/settings/ocr", async (request, reply) => {
    try {
      const body = request.body ?? {};
      const ocr = await app.appSettingsService.updateOcrSettings({
        autoOcrEmptyPages: body.autoOcrEmptyPages,
        ocrAll: body.ocrAll,
      });
      return { ok: true, ocr };
    } catch (error) {
      request.log.error({ err: error }, "Не удалось сохранить настройки OCR");
      return respondError(reply, 500, error.message || "Не удалось сохранить настройки OCR");
    }
  });

  app.get("/api/v2/settings/retrieval", async (request, reply) => {
    try {
      const retrieval = await app.appSettingsService.getRetrievalPublic();
      return { ok: true, retrieval };
    } catch (error) {
      request.log.error({ err: error }, "Не удалось получить параметры retrieval");
      return respondError(reply, 500, error.message || "Не удалось получить параметры retrieval");
    }
  });

  app.patch("/api/v2/settings/retrieval", async (request, reply) => {
    try {
      const body = request.body ?? {};
      const retrieval = await app.appSettingsService.updateRetrieval(body);
      return { ok: true, retrieval };
    } catch (error) {
      request.log.error({ err: error }, "Не удалось сохранить параметры retrieval");
      return respondError(reply, 500, error.message || "Не удалось сохранить параметры retrieval");
    }
  });

  app.delete("/api/v2/settings/retrieval", async (request, reply) => {
    try {
      const retrieval = await app.appSettingsService.resetRetrieval();
      return { ok: true, retrieval };
    } catch (error) {
      request.log.error({ err: error }, "Не удалось сбросить параметры retrieval");
      return respondError(reply, 500, error.message || "Не удалось сбросить параметры retrieval");
    }
  });

  app.get("/api/v2/settings/system-prompt", async (request, reply) => {
    try {
      const systemPrompt = await app.appSettingsService.getSystemPrompt();
      return { ok: true, systemPrompt };
    } catch (error) {
      request.log.error({ err: error }, "Не удалось получить системный промпт");
      return respondError(reply, 500, error.message || "Не удалось получить системный промпт");
    }
  });

  app.patch("/api/v2/settings/system-prompt", async (request, reply) => {
    try {
      const body = request.body ?? {};
      const template = typeof body.template === "string" ? body.template : "";
      const systemPrompt = await app.appSettingsService.updateSystemPrompt(template);
      return { ok: true, systemPrompt };
    } catch (error) {
      request.log.error({ err: error }, "Не удалось сохранить системный промпт");
      return respondError(reply, 500, error.message || "Не удалось сохранить системный промпт");
    }
  });

  app.delete("/api/v2/settings/system-prompt", async (request, reply) => {
    try {
      const systemPrompt = await app.appSettingsService.resetSystemPrompt();
      return { ok: true, systemPrompt };
    } catch (error) {
      request.log.error({ err: error }, "Не удалось сбросить системный промпт");
      return respondError(reply, 500, error.message || "Не удалось сбросить системный промпт");
    }
  });

  app.get("/api/v2/settings/reranking", async (request, reply) => {
    try {
      const reranking = await app.appSettingsService.getRerankingPublic();
      const defaults = {
        localUrl: app.config.reranker?.localUrl || "",
        jinaModel: app.config.reranker?.jinaModel || "",
      };
      return { ok: true, reranking, defaults };
    } catch (error) {
      request.log.error({ err: error }, "Не удалось получить настройки reranking");
      return respondError(reply, 500, error.message || "Не удалось получить настройки reranking");
    }
  });

  app.patch(
    "/api/v2/settings/reranking",
    {
      attachValidation: true,
      schema: {
        body: {
          type: "object",
          properties: {
            provider: { type: "string", enum: ["heuristic", "jina", "local"] },
            jinaApiKey: { type: "string", maxLength: 512 },
            localUrl: { type: "string", maxLength: 512 },
            clearJinaApiKey: { type: "boolean" },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      if (request.validationError) {
        return respondError(reply, 400, "Некорректные параметры reranking: укажите provider=jina|local|heuristic.");
      }
      try {
        const body = request.body ?? {};
        const reranking = await app.appSettingsService.updateRerankingSettings(body);
        return { ok: true, reranking };
      } catch (error) {
        const code = error.statusCode || 500;
        if (code !== 500) {
          return respondError(reply, code, error.message);
        }
        request.log.error({ err: error }, "Не удалось сохранить настройки reranking");
        return respondError(reply, 500, error.message || "Не удалось сохранить настройки reranking");
      }
    }
  );

  app.get("/api/v2/settings/reranking/status", async (request, reply) => {
    try {
      const settings = await app.appSettingsService.getRerankingSettings();
      const provider = app.rerankerProvider;
      const localUrl = settings.localUrl || app.config.reranker?.localUrl || "";
      const local = provider
        ? await provider.pingLocal(localUrl, 3500)
        : { ok: false, error: "Reranker provider не инициализирован" };
      const jinaConfigured = Boolean(settings.jinaApiKey && settings.jinaApiKey.trim());
      let jina;
      if (!jinaConfigured) {
        jina = { ok: false, configured: false, error: "ключ не задан" };
      } else if (provider) {
        const result = await provider.pingJina({
          apiKey: settings.jinaApiKey,
          url: app.config.reranker?.jinaUrl,
          model: app.config.reranker?.jinaModel,
          timeoutMs: 5000,
        });
        jina = { configured: true, ...result };
      } else {
        jina = { ok: false, configured: true, error: "Reranker provider не инициализирован" };
      }
      return {
        ok: true,
        provider: settings.provider,
        localUrl,
        services: { local, jina },
      };
    } catch (error) {
      request.log.error({ err: error }, "Не удалось проверить статус reranking");
      return respondError(reply, 500, error.message || "Не удалось проверить статус reranking");
    }
  });

  app.get("/api/v2/settings/hyde", async (request, reply) => {
    try {
      const hyde = await app.appSettingsService.getHydePublic();
      return { ok: true, hyde };
    } catch (error) {
      request.log.error({ err: error }, "Не удалось получить настройки HyDE");
      return respondError(reply, 500, error.message || "Не удалось получить настройки HyDE");
    }
  });

  app.patch(
    "/api/v2/settings/hyde",
    {
      attachValidation: true,
      schema: {
        body: {
          type: "object",
          properties: {
            enabled: { type: "boolean" },
            providerId: { type: "string", maxLength: 128 },
            model: { type: "string", maxLength: 256 },
            maxTokens: { type: "integer", minimum: 50, maximum: 2000 },
            timeoutMs: { type: "integer", minimum: 2000, maximum: 60000 },
            prompt: { type: "string", maxLength: 8000 },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      if (request.validationError) {
        return respondError(
          reply,
          400,
          "Некорректные параметры HyDE: проверьте границы maxTokens (50-2000), timeoutMs (2000-60000)."
        );
      }
      try {
        const body = request.body ?? {};
        const hyde = await app.appSettingsService.updateHydeSettings(body);
        return { ok: true, hyde };
      } catch (error) {
        const code = error.statusCode || 500;
        if (code !== 500) {
          return respondError(reply, code, error.message);
        }
        request.log.error({ err: error }, "Не удалось сохранить настройки HyDE");
        return respondError(reply, 500, error.message || "Не удалось сохранить настройки HyDE");
      }
    }
  );

  app.delete("/api/v2/settings/hyde/prompt", async (request, reply) => {
    try {
      const hyde = await app.appSettingsService.resetHydePrompt();
      return { ok: true, hyde };
    } catch (error) {
      request.log.error({ err: error }, "Не удалось сбросить промпт HyDE");
      return respondError(reply, 500, error.message || "Не удалось сбросить промпт HyDE");
    }
  });

  // --- Контекстное обогащение чанков (Слой 2) ---
  app.get("/api/v2/settings/contextual-enrichment", async (request, reply) => {
    try {
      const contextualEnrichment = await app.appSettingsService.getContextualEnrichmentPublic();
      return { ok: true, contextualEnrichment };
    } catch (error) {
      request.log.error({ err: error }, "Не удалось получить настройки контекстного обогащения");
      return respondError(
        reply,
        500,
        error.message || "Не удалось получить настройки контекстного обогащения"
      );
    }
  });

  app.patch(
    "/api/v2/settings/contextual-enrichment",
    {
      attachValidation: true,
      schema: {
        body: {
          type: "object",
          properties: {
            enabled: { type: "boolean" },
            providerId: { type: "string", maxLength: 128 },
            model: { type: "string", maxLength: 256 },
            maxTokens: { type: "integer", minimum: 200, maximum: 4000 },
            timeoutMs: { type: "integer", minimum: 5000, maximum: 120000 },
            contextPrompt: { type: "string", maxLength: 8000 },
            metaPrompt: { type: "string", maxLength: 8000 },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      if (request.validationError) {
        return respondError(
          reply,
          400,
          "Некорректные параметры обогащения: проверьте границы maxTokens (200-4000), timeoutMs (5000-120000)."
        );
      }
      try {
        const body = request.body ?? {};
        const contextualEnrichment =
          await app.appSettingsService.updateContextualEnrichmentSettings(body);
        return { ok: true, contextualEnrichment };
      } catch (error) {
        const code = error.statusCode || 500;
        if (code !== 500) {
          return respondError(reply, code, error.message);
        }
        request.log.error({ err: error }, "Не удалось сохранить настройки контекстного обогащения");
        return respondError(
          reply,
          500,
          error.message || "Не удалось сохранить настройки контекстного обогащения"
        );
      }
    }
  );

  app.delete(
    "/api/v2/settings/contextual-enrichment/prompt/:which",
    {
      attachValidation: true,
      schema: {
        params: {
          type: "object",
          properties: {
            which: { type: "string", enum: ["context", "meta"] },
          },
          required: ["which"],
        },
      },
    },
    async (request, reply) => {
      if (request.validationError) {
        return respondError(reply, 400, "Укажите промпт для сброса: context | meta.");
      }
      try {
        const which = request.params.which;
        const contextualEnrichment =
          await app.appSettingsService.resetContextualEnrichmentPrompt(which);
        return { ok: true, contextualEnrichment };
      } catch (error) {
        const code = error.statusCode || 500;
        if (code !== 500) {
          return respondError(reply, code, error.message);
        }
        request.log.error({ err: error }, "Не удалось сбросить промпт обогащения");
        return respondError(reply, 500, error.message || "Не удалось сбросить промпт обогащения");
      }
    }
  );

  // --- Извлечение знаний из документов (Память инженера — Этап 3) ---
  app.get("/api/v2/settings/knowledge-extraction", async (request, reply) => {
    try {
      const knowledgeExtraction =
        await app.appSettingsService.getKnowledgeExtractionPublic();
      return { ok: true, knowledgeExtraction };
    } catch (error) {
      request.log.error({ err: error }, "Не удалось получить настройки извлечения знаний");
      return respondError(
        reply,
        500,
        error.message || "Не удалось получить настройки извлечения знаний"
      );
    }
  });

  app.patch(
    "/api/v2/settings/knowledge-extraction",
    {
      attachValidation: true,
      schema: {
        body: {
          type: "object",
          properties: {
            enabled: { type: "boolean" },
            providerId: { type: "string", maxLength: 128 },
            model: { type: "string", maxLength: 256 },
            maxTokens: { type: "integer", minimum: 500, maximum: 8000 },
            timeoutMs: { type: "integer", minimum: 5000, maximum: 180000 },
            prompt: { type: "string", maxLength: 16000 },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      if (request.validationError) {
        return respondError(
          reply,
          400,
          "Некорректные параметры извлечения: проверьте границы maxTokens (500-8000), timeoutMs (5000-180000)."
        );
      }
      try {
        const body = request.body ?? {};
        const knowledgeExtraction =
          await app.appSettingsService.updateKnowledgeExtractionSettings(body);
        return { ok: true, knowledgeExtraction };
      } catch (error) {
        const code = error.statusCode || 500;
        if (code !== 500) {
          return respondError(reply, code, error.message);
        }
        request.log.error({ err: error }, "Не удалось сохранить настройки извлечения знаний");
        return respondError(
          reply,
          500,
          error.message || "Не удалось сохранить настройки извлечения знаний"
        );
      }
    }
  );

  app.delete("/api/v2/settings/knowledge-extraction/prompt", async (request, reply) => {
    try {
      const knowledgeExtraction =
        await app.appSettingsService.resetKnowledgeExtractionPrompt();
      return { ok: true, knowledgeExtraction };
    } catch (error) {
      request.log.error({ err: error }, "Не удалось сбросить промпт извлечения знаний");
      return respondError(
        reply,
        500,
        error.message || "Не удалось сбросить промпт извлечения знаний"
      );
    }
  });

  app.get("/api/v2/settings/services", async (request, reply) => {
    const ollamaBase = app.config.models.chat.base_url;
    const rerankingSettings = await app.appSettingsService
      .getRerankingSettings()
      .catch(() => ({ provider: "heuristic", localUrl: "", jinaApiKey: "" }));
    const localRerankerUrl = rerankingSettings.localUrl || app.config.reranker?.localUrl || "";
    const [postgres, qdrant, ollama, reranker] = await Promise.all([
      checkPostgres(app.postgresProvider),
      checkQdrant(app.qdrantProvider),
      checkOllama(ollamaBase),
      app.rerankerProvider
        ? app.rerankerProvider.pingLocal(localRerankerUrl, 3500)
        : Promise.resolve({ ok: false, error: "Reranker provider не инициализирован" }),
    ]);
    return {
      ok: true,
      services: {
        kbApi: { ok: true, message: "kb-api запущен" },
        postgres: postgres,
        qdrant: qdrant,
        ollama: { ...ollama, baseUrl: ollamaBase },
        reranker: { ...reranker, baseUrl: localRerankerUrl, provider: rerankingSettings.provider },
      },
    };
  });
}
