const MAX_PREVIEW_BYTES = 5 * 1024 * 1024;
const MAX_RAW_YAML_BYTES = 256 * 1024;

function mapErrorToStatus(err) {
  if (err?.code === "VALIDATION") return 400;
  if (err?.code === "YAML_PARSE") return 400;
  if (err?.code === "YAML_STRUCTURE") return 400;
  if (err?.code === "NOT_FOUND") return 404;
  if (err?.code === "CONFLICT") return 409;
  if (err?.code === "XLSX_OPEN") return 400;
  if (err?.code === "PARSE") return 422;
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
    app.log.warn({ err }, "Не удалось перечитать конфиги парсера графа после изменения");
  }
}

async function readMultipartFile(request, { maxBytes }) {
  if (!request.isMultipart()) {
    const e = new Error("Ожидается multipart/form-data");
    e.statusCode = 400;
    throw e;
  }
  let fileBuffer = null;
  let filename = null;
  const fields = {};
  for await (const part of request.parts()) {
    if (part.type === "file") {
      if (fileBuffer) continue;
      const chunks = [];
      let total = 0;
      for await (const chunk of part.file) {
        total += chunk.length;
        if (total > maxBytes) {
          const e = new Error(`Файл больше лимита ${Math.round(maxBytes / 1024 / 1024)} МБ`);
          e.statusCode = 413;
          throw e;
        }
        chunks.push(chunk);
      }
      fileBuffer = Buffer.concat(chunks);
      filename = part.filename;
    } else if (part.type === "field") {
      fields[part.fieldname] = part.value;
    }
  }
  return { fileBuffer, filename, fields };
}

export async function graphProfilesRoutes(app) {
  app.setErrorHandler((error, request, reply) => {
    if (error.validation && Array.isArray(error.validation) && error.validation.length > 0) {
      const first = error.validation[0];
      const field = first.params?.missingProperty
        ? `/${first.params.missingProperty}`
        : first.instancePath || "";
      const suffix = field ? ` (${field})` : "";
      request.log.warn({ err: error }, "Ошибка валидации graph profiles");
      reply.code(400).send({ ok: false, error: `Некорректный формат поля${suffix}` });
      return;
    }
    request.log.error({ err: error }, "Ошибка graph profiles route");
    reply.code(error.statusCode && error.statusCode >= 400 ? error.statusCode : 500).send({
      ok: false,
      error: error.message || "Внутренняя ошибка сервера",
    });
  });

  // GET list
  app.get("/api/v2/graph/profiles", async (request, reply) => {
    try {
      const profiles = await app.graphConfigService.listProfiles();
      return { ok: true, profiles };
    } catch (err) {
      return sendError(reply, err);
    }
  });

  // GET raw YAML — registered BEFORE :id to avoid route conflict
  app.get("/api/v2/graph/profiles/raw", async (request, reply) => {
    try {
      const content = await app.graphConfigService.readProfilesRaw();
      return { ok: true, content };
    } catch (err) {
      return sendError(reply, err);
    }
  });

  // PUT raw YAML
  app.put(
    "/api/v2/graph/profiles/raw",
    {
      schema: {
        body: {
          type: "object",
          required: ["content"],
          properties: {
            content: { type: "string", maxLength: MAX_RAW_YAML_BYTES },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        await app.graphConfigService.writeProfilesRawText(request.body.content);
        await reloadParserConfigs(app);
        return { ok: true, message: "Файл graph-parsers.yaml сохранён и применён." };
      } catch (err) {
        return sendError(reply, err);
      }
    }
  );

  // POST validate raw YAML without saving
  app.post(
    "/api/v2/graph/profiles/raw/validate",
    {
      schema: {
        body: {
          type: "object",
          required: ["content"],
          properties: {
            content: { type: "string", maxLength: MAX_RAW_YAML_BYTES },
          },
        },
      },
    },
    async (request, reply) => {
      const res = await app.graphConfigService.validateProfilesYamlText(request.body.content);
      if (!res.ok) {
        reply.code(400);
        return { ok: false, error: res.error };
      }
      return { ok: true, profiles_count: res.profilesCount };
    }
  );

  // POST autodetect style on uploaded file
  app.post("/api/v2/graph/profiles/detect-style", async (request, reply) => {
    try {
      const { fileBuffer, filename } = await readMultipartFile(request, { maxBytes: MAX_PREVIEW_BYTES });
      if (!fileBuffer) {
        reply.code(400);
        return { ok: false, error: "Файл не приложен" };
      }
      const result = await app.graphPreviewService.detectStyle({ buffer: fileBuffer, filename });
      return result;
    } catch (err) {
      return sendError(reply, err);
    }
  });

  // POST test profile (dry-run preview)
  app.post("/api/v2/graph/profiles/test", async (request, reply) => {
    try {
      const { fileBuffer, filename, fields } = await readMultipartFile(request, { maxBytes: MAX_PREVIEW_BYTES });
      if (!fileBuffer) {
        reply.code(400);
        return { ok: false, error: "Файл не приложен" };
      }
      const profileRaw = fields.profile;
      if (!profileRaw || typeof profileRaw !== "string") {
        reply.code(400);
        return { ok: false, error: "Поле profile (JSON-строка) обязательно" };
      }
      let profile;
      try {
        profile = JSON.parse(profileRaw);
      } catch (err) {
        reply.code(400);
        return { ok: false, error: `Не удалось распарсить JSON профиля: ${err.message}` };
      }
      const result = await app.graphPreviewService.preview({ buffer: fileBuffer, filename, profile });
      return result;
    } catch (err) {
      return sendError(reply, err);
    }
  });

  // GET one profile
  app.get(
    "/api/v2/graph/profiles/:id",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", minLength: 1, maxLength: 96 } },
        },
      },
    },
    async (request, reply) => {
      try {
        const profile = await app.graphConfigService.getProfile(request.params.id);
        if (!profile) {
          reply.code(404);
          return { ok: false, error: `Профиль с id "${request.params.id}" не найден` };
        }
        return { ok: true, profile };
      } catch (err) {
        return sendError(reply, err);
      }
    }
  );

  // POST create profile (structured)
  app.post(
    "/api/v2/graph/profiles",
    {
      schema: {
        body: {
          type: "object",
          required: ["id"],
          additionalProperties: true,
          properties: {
            id: { type: "string", minLength: 1, maxLength: 96 },
            description: { type: "string", maxLength: 512 },
            match: { type: "object", additionalProperties: true },
            layout: { type: "object", additionalProperties: true },
            columns: { type: "object", additionalProperties: true },
            builds: { type: "array", items: { type: "string" } },
            cabinet: { type: "object", additionalProperties: true },
            per_sheet: { type: "object", additionalProperties: true },
            station_default: { type: "object", additionalProperties: true },
            skip_rows: { type: "array", items: { type: "object", additionalProperties: true } },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const profile = await app.graphConfigService.upsertProfile(request.body, { isCreate: true });
        await reloadParserConfigs(app);
        return { ok: true, profile, message: "Профиль создан и активирован." };
      } catch (err) {
        return sendError(reply, err);
      }
    }
  );

  // PUT replace profile (structured)
  app.put(
    "/api/v2/graph/profiles/:id",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", minLength: 1, maxLength: 96 } },
        },
        body: {
          type: "object",
          additionalProperties: true,
        },
      },
    },
    async (request, reply) => {
      try {
        const payload = Object.assign({}, request.body, { id: request.params.id });
        const profile = await app.graphConfigService.upsertProfile(payload, { isCreate: false });
        await reloadParserConfigs(app);
        return { ok: true, profile, message: "Профиль обновлён и применён." };
      } catch (err) {
        return sendError(reply, err);
      }
    }
  );

  // DELETE
  app.delete(
    "/api/v2/graph/profiles/:id",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", minLength: 1, maxLength: 96 } },
        },
      },
    },
    async (request, reply) => {
      try {
        const res = await app.graphConfigService.deleteProfile(request.params.id);
        await reloadParserConfigs(app);
        return { ok: true, id: res.id, message: `Профиль "${res.id}" удалён.` };
      } catch (err) {
        return sendError(reply, err);
      }
    }
  );
}

export default graphProfilesRoutes;
