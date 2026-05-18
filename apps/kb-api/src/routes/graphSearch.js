// REST API для поиска узлов графа.

const ERROR_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    ok: { type: "boolean" },
    error: { type: "string" },
  },
  additionalProperties: true,
};

function respondError(reply, statusCode, message) {
  reply.code(statusCode);
  return { ok: false, error: message };
}

export async function graphSearchRoutes(app) {
  app.setErrorHandler((error, request, reply) => {
    if (error.validation && Array.isArray(error.validation) && error.validation.length > 0) {
      request.log.warn({ err: error }, "Ошибка валидации запроса поиска по графу");
      reply.code(400).send({
        ok: false,
        error: "Некорректные параметры поиска",
      });
      return;
    }
    request.log.error({ err: error }, "Ошибка обработки запроса поиска по графу");
    const statusCode = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
    reply.code(statusCode).send({
      ok: false,
      error: error.message || "Внутренняя ошибка сервера",
    });
  });

  // GET /api/v2/graph/search?q=KS_T2&type=signal&limit=50
  app.get(
    "/api/v2/graph/search",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            q: { type: "string", minLength: 1, maxLength: 512 },
            type: { type: "string", maxLength: 64 },
            limit: { type: "integer", minimum: 1, maximum: 200 },
          },
          required: ["q"],
          additionalProperties: true,
        },
        response: {
          200: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              query: { type: "string" },
              results: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    node: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        type: { type: "string" },
                        name: { type: "string" },
                        attributes: { type: "object", additionalProperties: true },
                        isArchived: { type: "boolean" },
                      },
                      additionalProperties: true,
                    },
                    matchedField: { type: "string" },
                    matchedValue: { type: "string", nullable: true },
                  },
                },
              },
            },
          },
          400: ERROR_RESPONSE_SCHEMA,
          500: ERROR_RESPONSE_SCHEMA,
        },
      },
    },
    async (request, reply) => {
      try {
        const q = request.query?.q;
        const type = request.query?.type;
        const limit = request.query?.limit ?? 50;
        const results = await app.graphSearchService.search(q, { type, limit });
        return { ok: true, query: String(q), results };
      } catch (err) {
        request.log.error({ err }, "Не удалось выполнить поиск по графу");
        const code = err.statusCode || 500;
        return respondError(reply, code, err.message || "Не удалось выполнить поиск");
      }
    }
  );
}

export default graphSearchRoutes;
