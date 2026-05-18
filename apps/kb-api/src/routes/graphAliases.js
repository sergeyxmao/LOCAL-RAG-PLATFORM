const MAX_RAW_YAML_BYTES = 128 * 1024;

function mapErrorToStatus(err) {
  if (err?.code === "VALIDATION") return 400;
  if (err?.code === "YAML_PARSE") return 400;
  if (err?.code === "YAML_STRUCTURE") return 400;
  if (err?.code === "NOT_FOUND") return 404;
  if (err?.code === "CONFLICT") return 409;
  return 500;
}

function sendError(reply, err, fallbackStatus = 500) {
  const status = err?.statusCode ?? mapErrorToStatus(err) ?? fallbackStatus;
  reply.code(status);
  return {
    ok: false,
    error: err?.message || "Внутренняя ошибка сервера",
    ...(Array.isArray(err?.fieldErrors) && err.fieldErrors.length > 0 ? { details: err.fieldErrors } : {}),
  };
}

async function reloadParserConfigs(app) {
  try {
    if (typeof app.graphIngestionService?.reloadConfigs === "function") {
      await app.graphIngestionService.reloadConfigs();
    }
  } catch (err) {
    app.log.warn({ err }, "Не удалось перечитать алиасы после изменения");
  }
}

export async function graphAliasesRoutes(app) {
  app.setErrorHandler((error, request, reply) => {
    if (error.validation && Array.isArray(error.validation) && error.validation.length > 0) {
      const first = error.validation[0];
      const field = first.params?.missingProperty
        ? `/${first.params.missingProperty}`
        : first.instancePath || "";
      const suffix = field ? ` (${field})` : "";
      request.log.warn({ err: error }, "Ошибка валидации graph aliases");
      reply.code(400).send({ ok: false, error: `Некорректный формат поля${suffix}` });
      return;
    }
    request.log.error({ err: error }, "Ошибка graph aliases route");
    reply.code(error.statusCode && error.statusCode >= 400 ? error.statusCode : 500).send({
      ok: false,
      error: error.message || "Внутренняя ошибка сервера",
    });
  });

  // GET list
  app.get("/api/v2/graph/aliases", async (request, reply) => {
    try {
      const items = await app.graphConfigService.listAliases();
      return { ok: true, signal_kind: items };
    } catch (err) {
      return sendError(reply, err);
    }
  });

  // GET raw YAML
  app.get("/api/v2/graph/aliases/raw", async (request, reply) => {
    try {
      const content = await app.graphConfigService.readAliasesRaw();
      return { ok: true, content };
    } catch (err) {
      return sendError(reply, err);
    }
  });

  // PUT raw YAML
  app.put(
    "/api/v2/graph/aliases/raw",
    {
      schema: {
        body: {
          type: "object",
          required: ["content"],
          properties: { content: { type: "string", maxLength: MAX_RAW_YAML_BYTES } },
        },
      },
    },
    async (request, reply) => {
      try {
        await app.graphConfigService.writeAliasesRawText(request.body.content);
        await reloadParserConfigs(app);
        return { ok: true, message: "Файл graph-aliases.yaml сохранён и применён." };
      } catch (err) {
        return sendError(reply, err);
      }
    }
  );

  // POST validate raw YAML
  app.post(
    "/api/v2/graph/aliases/raw/validate",
    {
      schema: {
        body: {
          type: "object",
          required: ["content"],
          properties: { content: { type: "string", maxLength: MAX_RAW_YAML_BYTES } },
        },
      },
    },
    async (request, reply) => {
      const res = await app.graphConfigService.validateAliasesYamlText(request.body.content);
      if (!res.ok) {
        reply.code(400);
        return { ok: false, error: res.error };
      }
      return { ok: true, canonicals_count: res.count };
    }
  );

  // GET one canonical
  app.get(
    "/api/v2/graph/aliases/:canonical",
    {
      schema: {
        params: {
          type: "object",
          required: ["canonical"],
          properties: { canonical: { type: "string", minLength: 1, maxLength: 64 } },
        },
      },
    },
    async (request, reply) => {
      try {
        const all = await app.graphConfigService.listAliases();
        const entry = all[request.params.canonical];
        if (!entry) {
          reply.code(404);
          return { ok: false, error: `Каноническое значение "${request.params.canonical}" не найдено` };
        }
        return { ok: true, canonical: request.params.canonical, ...entry };
      } catch (err) {
        return sendError(reply, err);
      }
    }
  );

  // POST create
  app.post(
    "/api/v2/graph/aliases",
    {
      schema: {
        body: {
          type: "object",
          required: ["canonical"],
          additionalProperties: false,
          properties: {
            canonical: { type: "string", minLength: 1, maxLength: 64 },
            description: { type: "string", maxLength: 256 },
            aliases: { type: "array", items: { type: "string", minLength: 1, maxLength: 128 } },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const out = await app.graphConfigService.upsertAlias(request.body, { isCreate: true });
        await reloadParserConfigs(app);
        return { ok: true, ...out, message: `Каноническое значение "${out.canonical}" создано.` };
      } catch (err) {
        return sendError(reply, err);
      }
    }
  );

  // PUT replace
  app.put(
    "/api/v2/graph/aliases/:canonical",
    {
      schema: {
        params: {
          type: "object",
          required: ["canonical"],
          properties: { canonical: { type: "string", minLength: 1, maxLength: 64 } },
        },
        body: {
          type: "object",
          additionalProperties: false,
          properties: {
            description: { type: "string", maxLength: 256 },
            aliases: { type: "array", items: { type: "string", minLength: 1, maxLength: 128 } },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const out = await app.graphConfigService.upsertAlias(
          { canonical: request.params.canonical, ...request.body },
          { isCreate: false }
        );
        await reloadParserConfigs(app);
        return { ok: true, ...out, message: `Каноническое значение "${out.canonical}" обновлено.` };
      } catch (err) {
        return sendError(reply, err);
      }
    }
  );

  // DELETE
  app.delete(
    "/api/v2/graph/aliases/:canonical",
    {
      schema: {
        params: {
          type: "object",
          required: ["canonical"],
          properties: { canonical: { type: "string", minLength: 1, maxLength: 64 } },
        },
      },
    },
    async (request, reply) => {
      try {
        const out = await app.graphConfigService.deleteAlias(request.params.canonical);
        await reloadParserConfigs(app);
        return { ok: true, canonical: out.canonical, message: `Каноническое значение "${out.canonical}" удалено.` };
      } catch (err) {
        return sendError(reply, err);
      }
    }
  );
}

export default graphAliasesRoutes;
