// REST API для дерева графа знаний, карточки узла,
// соседей (для vis-network) и каскадного жёсткого удаления.

const ERROR_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    ok: { type: "boolean" },
    error: { type: "string" },
  },
  additionalProperties: true,
};

const PARAMS_ID_SCHEMA = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string", format: "uuid" },
  },
};

const PARAMS_TYPE_SCHEMA = {
  type: "object",
  required: ["type"],
  properties: {
    type: { type: "string", minLength: 1, maxLength: 64 },
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
    const suffix = field ? ` (${field})` : "";
    switch (first.keyword) {
      case "required":
        return `Отсутствует обязательное поле${suffix}`;
      case "format":
        return `Некорректный формат поля${suffix}`;
      case "type":
        return `Некорректный тип поля${suffix}`;
      case "minLength":
        return `Значение поля${suffix} слишком короткое`;
      case "maxLength":
        return `Значение поля${suffix} слишком длинное`;
      case "minimum":
      case "maximum":
        return `Значение поля${suffix} вне допустимого диапазона`;
      case "enum":
        return `Недопустимое значение поля${suffix}`;
      case "additionalProperties":
        return `Передано неизвестное поле${suffix}`;
      default:
        return `Ошибка валидации поля${suffix}`;
    }
  }
  return null;
}

export async function graphTreeRoutes(app) {
  app.setErrorHandler((error, request, reply) => {
    const translated = translateValidationError(error);
    if (translated) {
      request.log.warn({ err: error }, "Ошибка валидации запроса дерева графа");
      reply.code(400).send({ ok: false, error: translated });
      return;
    }
    request.log.error({ err: error }, "Ошибка обработки запроса дерева графа");
    const statusCode = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
    reply.code(statusCode).send({
      ok: false,
      error: error.message || "Внутренняя ошибка сервера",
    });
  });

  // GET /api/v2/graph/tree/roots — список корневых типов (групп)
  // с количеством узлов в каждом.
  app.get(
    "/api/v2/graph/tree/roots",
    async (request, reply) => {
      try {
        const roots = await app.graphTreeService.listRoots();
        return { ok: true, roots };
      } catch (err) {
        request.log.error({ err }, "Не удалось получить корневые группы дерева графа");
        const code = err.statusCode || 500;
        return respondError(reply, code, err.message || "Не удалось получить корневые группы");
      }
    }
  );

  // GET /api/v2/graph/tree/by-type/:type?limit=50&offset=0
  // — узлы конкретного типа (страница).
  app.get(
    "/api/v2/graph/tree/by-type/:type",
    {
      schema: {
        params: PARAMS_TYPE_SCHEMA,
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1, maximum: 500 },
            offset: { type: "integer", minimum: 0 },
          },
          additionalProperties: true,
        },
      },
    },
    async (request, reply) => {
      try {
        const q = request.query ?? {};
        const result = await app.graphTreeService.listNodesByType(request.params.type, {
          limit: q.limit ?? 50,
          offset: q.offset ?? 0,
        });
        return { ok: true, ...result };
      } catch (err) {
        request.log.error({ err }, "Не удалось получить узлы по типу");
        const code = err.statusCode || 500;
        return respondError(reply, code, err.message || "Не удалось получить узлы по типу");
      }
    }
  );

  // GET /api/v2/graph/tree/children/:id — дочерние узлы согласно HIERARCHY_RULES.
  app.get(
    "/api/v2/graph/tree/children/:id",
    {
      schema: { params: PARAMS_ID_SCHEMA },
    },
    async (request, reply) => {
      try {
        const result = await app.graphTreeService.listChildren(request.params.id);
        return { ok: true, ...result };
      } catch (err) {
        request.log.error({ err }, "Не удалось получить детей узла");
        const code = err.statusCode || 500;
        return respondError(reply, code, err.message || "Не удалось получить детей узла");
      }
    }
  );

  // GET /api/v2/graph/nodes/:id/full — полная карточка узла:
  // сам узел + входящие/исходящие связи + источник + descendantsCount.
  app.get(
    "/api/v2/graph/nodes/:id/full",
    {
      schema: { params: PARAMS_ID_SCHEMA },
    },
    async (request, reply) => {
      try {
        const card = await app.graphTreeService.getNodeFullCard(request.params.id);
        return { ok: true, ...card };
      } catch (err) {
        request.log.error({ err }, "Не удалось получить карточку узла");
        const code = err.statusCode || 500;
        return respondError(reply, code, err.message || "Не удалось получить карточку узла");
      }
    }
  );

  // GET /api/v2/graph/nodes/:id/neighbors?depth=1
  // — узел + соседи (для vis-network).
  app.get(
    "/api/v2/graph/nodes/:id/neighbors",
    {
      schema: {
        params: PARAMS_ID_SCHEMA,
        querystring: {
          type: "object",
          properties: {
            depth: { type: "integer", minimum: 1, maximum: 2 },
          },
          additionalProperties: true,
        },
      },
    },
    async (request, reply) => {
      try {
        const q = request.query ?? {};
        const data = await app.graphTreeService.getNodeNeighbors(request.params.id, {
          depth: q.depth ?? 1,
        });
        return { ok: true, ...data };
      } catch (err) {
        request.log.error({ err }, "Не удалось получить соседей узла");
        const code = err.statusCode || 500;
        return respondError(reply, code, err.message || "Не удалось получить соседей узла");
      }
    }
  );

  // POST /api/v2/graph/nodes/:id/hard-delete?cascade=true|false
  // — жёсткое удаление с опциональным каскадом по дереву.
  // POST используется намеренно (не DELETE), чтобы не ломать
  // существующий DELETE /api/v2/graph/nodes/:id (soft-archive).
  app.post(
    "/api/v2/graph/nodes/:id/hard-delete",
    {
      schema: {
        params: PARAMS_ID_SCHEMA,
        querystring: {
          type: "object",
          properties: {
            cascade: { type: "string" },
          },
          additionalProperties: true,
        },
        response: {
          200: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              deleted: { type: "boolean" },
              deletedCount: { type: "integer" },
              cascade: { type: "boolean" },
            },
          },
          400: ERROR_RESPONSE_SCHEMA,
          404: ERROR_RESPONSE_SCHEMA,
          500: ERROR_RESPONSE_SCHEMA,
        },
      },
    },
    async (request, reply) => {
      try {
        const q = request.query ?? {};
        const cascade = String(q.cascade ?? "false").toLowerCase() === "true";
        const result = await app.graphService.hardDeleteNode(request.params.id, {
          cascade,
          treeService: app.graphTreeService,
        });
        if (!result.deleted) {
          return respondError(reply, 404, "Узел не найден");
        }
        return {
          ok: true,
          deleted: true,
          deletedCount: result.deletedCount,
          cascade,
        };
      } catch (err) {
        request.log.error({ err }, "Не удалось удалить узел графа (hard)");
        const code = err.statusCode || 500;
        return respondError(reply, code, err.message || "Не удалось удалить узел графа");
      }
    }
  );
}

export default graphTreeRoutes;
