const TYPE_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    code: { type: "string" },
    label_ru: { type: "string" },
    description: { type: "string", nullable: true },
    icon: { type: "string", nullable: true },
    sort_order: { type: "integer" },
    is_builtin: { type: "boolean" },
    is_archived: { type: "boolean" },
    usage_count: { type: "integer" },
    created_at: { type: "string", nullable: true },
    updated_at: { type: "string", nullable: true },
  },
  additionalProperties: true,
};

const ERROR_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    ok: { type: "boolean" },
    error: { type: "string" },
  },
  additionalProperties: true,
};

const PARAMS_CODE_SCHEMA = {
  type: "object",
  required: ["code"],
  properties: {
    code: { type: "string", minLength: 1, maxLength: 64 },
  },
};

function respondError(reply, statusCode, message) {
  reply.code(statusCode);
  return { ok: false, error: message };
}

function translateValidationError(error) {
  if (!error || typeof error !== "object") return null;
  if (error.validation && Array.isArray(error.validation) && error.validation.length > 0) {
    const first = error.validation[0];
    const field = first.instancePath || first.params?.missingProperty
      ? (first.params?.missingProperty
          ? `/${first.params.missingProperty}`
          : first.instancePath)
      : "";
    const fieldSuffix = field ? ` (${field})` : "";
    switch (first.keyword) {
      case "required":
        return `Отсутствует обязательное поле${fieldSuffix}`;
      case "minLength":
        return `Значение поля${fieldSuffix} слишком короткое`;
      case "maxLength":
        return `Значение поля${fieldSuffix} слишком длинное`;
      case "pattern":
        return `Значение поля${fieldSuffix} не соответствует формату`;
      case "format":
        return `Некорректный формат поля${fieldSuffix}`;
      case "type":
        return `Некорректный тип поля${fieldSuffix}`;
      case "minimum":
      case "maximum":
        return `Значение поля${fieldSuffix} вне допустимого диапазона`;
      case "additionalProperties":
        return `Передано неизвестное поле${fieldSuffix}`;
      default:
        return `Ошибка валидации поля${fieldSuffix}`;
    }
  }
  return null;
}

export async function graphNodeTypeRoutes(app) {
  app.setErrorHandler((error, request, reply) => {
    const translated = translateValidationError(error);
    if (translated) {
      request.log.warn({ err: error }, "Ошибка валидации типов узлов");
      reply.code(400).send({ ok: false, error: translated });
      return;
    }
    request.log.error({ err: error }, "Ошибка обработки запроса типов узлов");
    const statusCode = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
    reply.code(statusCode).send({
      ok: false,
      error: error.message || "Внутренняя ошибка сервера",
    });
  });

  app.get(
    "/api/v2/graph/node-types",
    {
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              types: { type: "array", items: TYPE_RESPONSE_SCHEMA },
            },
          },
          500: ERROR_RESPONSE_SCHEMA,
        },
      },
    },
    async (request, reply) => {
      try {
        const types = await app.graphNodeTypeService.listTypes();
        return { ok: true, types };
      } catch (err) {
        request.log.error({ err }, "Не удалось получить список типов узлов");
        return respondError(reply, 500, err.message || "Не удалось получить список типов узлов");
      }
    }
  );

  app.get(
    "/api/v2/graph/node-types/:code",
    {
      schema: {
        params: PARAMS_CODE_SCHEMA,
        response: {
          200: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              type: TYPE_RESPONSE_SCHEMA,
            },
          },
          404: ERROR_RESPONSE_SCHEMA,
          400: ERROR_RESPONSE_SCHEMA,
          500: ERROR_RESPONSE_SCHEMA,
        },
      },
    },
    async (request, reply) => {
      try {
        const type = await app.graphNodeTypeService.getTypeByCode(request.params.code);
        if (!type) {
          return respondError(reply, 404, "Тип узла не найден");
        }
        return { ok: true, type };
      } catch (err) {
        request.log.error({ err }, "Не удалось получить тип узла");
        const code = err.statusCode || 500;
        return respondError(reply, code, err.message || "Не удалось получить тип узла");
      }
    }
  );

  app.post(
    "/api/v2/graph/node-types",
    {
      schema: {
        body: {
          type: "object",
          required: ["code", "label_ru"],
          properties: {
            code: {
              type: "string",
              minLength: 1,
              maxLength: 64,
              pattern: "^[a-z][a-z0-9_]*$",
            },
            label_ru: { type: "string", minLength: 1, maxLength: 128 },
            description: { type: "string", maxLength: 2048, nullable: true },
            icon: { type: "string", maxLength: 16, nullable: true },
            sort_order: { type: "integer", minimum: 1, maximum: 9999 },
          },
          additionalProperties: false,
        },
        response: {
          201: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              type: TYPE_RESPONSE_SCHEMA,
              message: { type: "string" },
            },
          },
          400: ERROR_RESPONSE_SCHEMA,
          409: ERROR_RESPONSE_SCHEMA,
          500: ERROR_RESPONSE_SCHEMA,
        },
      },
    },
    async (request, reply) => {
      try {
        const type = await app.graphNodeTypeService.createType(request.body);
        reply.code(201);
        return {
          ok: true,
          type,
          message: `Тип "${type.code}" создан.`,
        };
      } catch (err) {
        request.log.warn({ err }, "Не удалось создать тип узла");
        const code = err.statusCode || 400;
        return respondError(reply, code, err.message || "Не удалось создать тип узла");
      }
    }
  );

  app.put(
    "/api/v2/graph/node-types/:code",
    {
      schema: {
        params: PARAMS_CODE_SCHEMA,
        body: {
          type: "object",
          properties: {
            code: { type: "string", maxLength: 64 },
            label_ru: { type: "string", minLength: 1, maxLength: 128 },
            description: { type: "string", maxLength: 2048, nullable: true },
            icon: { type: "string", maxLength: 16, nullable: true },
            sort_order: { type: "integer", minimum: 1, maximum: 9999 },
            is_archived: { type: "boolean" },
          },
          additionalProperties: false,
        },
        response: {
          200: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              type: TYPE_RESPONSE_SCHEMA,
              message: { type: "string" },
            },
          },
          400: ERROR_RESPONSE_SCHEMA,
          403: ERROR_RESPONSE_SCHEMA,
          404: ERROR_RESPONSE_SCHEMA,
          500: ERROR_RESPONSE_SCHEMA,
        },
      },
    },
    async (request, reply) => {
      try {
        const type = await app.graphNodeTypeService.updateType(
          request.params.code,
          request.body ?? {}
        );
        if (!type) {
          return respondError(reply, 404, "Тип узла не найден");
        }
        return {
          ok: true,
          type,
          message: `Тип "${type.code}" обновлён.`,
        };
      } catch (err) {
        request.log.warn({ err }, "Не удалось обновить тип узла");
        const code = err.statusCode || 400;
        return respondError(reply, code, err.message || "Не удалось обновить тип узла");
      }
    }
  );

  app.delete(
    "/api/v2/graph/node-types/:code",
    {
      schema: {
        params: PARAMS_CODE_SCHEMA,
        response: {
          200: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              message: { type: "string" },
            },
          },
          400: ERROR_RESPONSE_SCHEMA,
          403: ERROR_RESPONSE_SCHEMA,
          404: ERROR_RESPONSE_SCHEMA,
          409: ERROR_RESPONSE_SCHEMA,
          500: ERROR_RESPONSE_SCHEMA,
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await app.graphNodeTypeService.deleteType(request.params.code);
        return {
          ok: true,
          message: `Тип "${result.code}" удалён.`,
        };
      } catch (err) {
        request.log.warn({ err }, "Не удалось удалить тип узла");
        const code = err.statusCode || 400;
        return respondError(reply, code, err.message || "Не удалось удалить тип узла");
      }
    }
  );
}

export default graphNodeTypeRoutes;
