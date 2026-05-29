const NODE_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    id: { type: "string" },
    type: { type: "string" },
    name: { type: "string" },
    description: { type: ["string", "null"] },
    attributes: { type: "object", additionalProperties: true },
    sourceDocumentId: { type: ["string", "null"] },
    sourcePageNumber: { type: ["integer", "null"] },
    sourceXlsxSheet: { type: ["string", "null"] },
    sourceXlsxRow: { type: ["integer", "null"] },
    confidence: { type: "number" },
    author: { type: "string" },
    isArchived: { type: "boolean" },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
  },
  additionalProperties: true,
};

const EDGE_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    id: { type: "string" },
    sourceNodeId: { type: "string" },
    targetNodeId: { type: "string" },
    relation: { type: "string" },
    attributes: { type: "object", additionalProperties: true },
    confidence: { type: "number" },
    author: { type: "string" },
    createdAt: { type: "string" },
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

const NODE_BODY_BASE_PROPS = {
  type: { type: "string", minLength: 1, maxLength: 64 },
  name: { type: "string", minLength: 1, maxLength: 512 },
  description: { type: "string", nullable: true },
  attributes: { type: "object", additionalProperties: true },
  sourceDocumentId: { type: "string", format: "uuid", nullable: true },
  sourcePageNumber: { type: "integer", minimum: 1, nullable: true },
  sourceXlsxSheet: { type: "string", nullable: true },
  sourceXlsxRow: { type: "integer", minimum: 1, nullable: true },
  confidence: { type: "number", minimum: 0, maximum: 1 },
  author: { type: "string", maxLength: 128 },
};

const PARAMS_ID_SCHEMA = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string", format: "uuid" },
  },
};

function respondError(reply, statusCode, message) {
  reply.code(statusCode);
  return { ok: false, error: message };
}

function parseTriBool(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const text = String(value).toLowerCase();
  if (["true", "1", "yes", "on"].includes(text)) return true;
  if (["false", "0", "no", "off"].includes(text)) return false;
  return undefined;
}

function parseIntOr(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.trunc(num);
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
      case "format":
        return `Некорректный формат поля${fieldSuffix}`;
      case "type":
        return `Некорректный тип поля${fieldSuffix}`;
      case "minimum":
      case "maximum":
        return `Значение поля${fieldSuffix} вне допустимого диапазона`;
      case "enum":
        return `Недопустимое значение поля${fieldSuffix}`;
      case "additionalProperties":
        return `Передано неизвестное поле${fieldSuffix}`;
      default:
        return `Ошибка валидации поля${fieldSuffix}`;
    }
  }
  return null;
}

export async function graphRoutes(app) {
  app.setErrorHandler((error, request, reply) => {
    const translated = translateValidationError(error);
    if (translated) {
      request.log.warn({ err: error }, "Ошибка валидации запроса графа");
      reply.code(400).send({ ok: false, error: translated });
      return;
    }
    request.log.error({ err: error }, "Ошибка обработки запроса графа");
    const statusCode = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
    reply.code(statusCode).send({
      ok: false,
      error: error.message || "Внутренняя ошибка сервера",
    });
  });

  app.post(
    "/api/v2/graph/nodes",
    {
      schema: {
        body: {
          type: "object",
          required: ["type", "name"],
          properties: { ...NODE_BODY_BASE_PROPS },
          additionalProperties: false,
        },
        response: {
          200: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              node: NODE_RESPONSE_SCHEMA,
            },
          },
          400: ERROR_RESPONSE_SCHEMA,
          500: ERROR_RESPONSE_SCHEMA,
        },
      },
    },
    async (request, reply) => {
      try {
        const node = await app.graphService.createNode(request.body);
        return reply.send({ ok: true, node });
      } catch (err) {
        request.log.error({ err }, "Не удалось создать узел графа");
        const code = err.statusCode || 400;
        return respondError(reply, code, err.message || "Не удалось создать узел графа");
      }
    }
  );

  app.get(
    "/api/v2/graph/nodes/:id",
    {
      schema: {
        params: PARAMS_ID_SCHEMA,
        response: {
          200: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              node: NODE_RESPONSE_SCHEMA,
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
        const node = await app.graphService.getNodeById(request.params.id);
        if (!node) {
          return respondError(reply, 404, "Узел графа не найден");
        }
        return { ok: true, node };
      } catch (err) {
        request.log.error({ err }, "Не удалось получить узел графа");
        const code = err.statusCode || 500;
        return respondError(reply, code, err.message || "Не удалось получить узел графа");
      }
    }
  );

  app.get(
    "/api/v2/graph/nodes",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            type: { type: "string", maxLength: 64 },
            author: { type: "string", maxLength: 128 },
            isArchived: { type: "string" },
            sourceDocumentId: { type: "string", format: "uuid" },
            nameSearch: { type: "string", maxLength: 512 },
            limit: { type: "integer", minimum: 1, maximum: 500 },
            offset: { type: "integer", minimum: 0 },
          },
          additionalProperties: true,
        },
        response: {
          200: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              items: { type: "array", items: NODE_RESPONSE_SCHEMA },
              total: { type: "integer" },
              limit: { type: "integer" },
              offset: { type: "integer" },
            },
          },
          400: ERROR_RESPONSE_SCHEMA,
          500: ERROR_RESPONSE_SCHEMA,
        },
      },
    },
    async (request, reply) => {
      try {
        const q = request.query ?? {};
        const result = await app.graphService.listNodes({
          type: q.type,
          author: q.author,
          isArchived: parseTriBool(q.isArchived),
          sourceDocumentId: q.sourceDocumentId,
          nameSearch: q.nameSearch,
          limit: parseIntOr(q.limit, 50),
          offset: parseIntOr(q.offset, 0),
        });
        return { ok: true, ...result };
      } catch (err) {
        request.log.error({ err }, "Не удалось получить список узлов графа");
        const code = err.statusCode || 500;
        return respondError(reply, code, err.message || "Не удалось получить список узлов");
      }
    }
  );

  app.patch(
    "/api/v2/graph/nodes/:id",
    {
      schema: {
        params: PARAMS_ID_SCHEMA,
        body: {
          type: "object",
          properties: {
            ...NODE_BODY_BASE_PROPS,
            isArchived: { type: "boolean" },
          },
          additionalProperties: false,
        },
        response: {
          200: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              node: NODE_RESPONSE_SCHEMA,
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
        const node = await app.graphService.updateNode(request.params.id, request.body ?? {});
        if (!node) {
          return respondError(reply, 404, "Узел графа не найден");
        }
        return { ok: true, node };
      } catch (err) {
        request.log.error({ err }, "Не удалось обновить узел графа");
        const code = err.statusCode || 400;
        return respondError(reply, code, err.message || "Не удалось обновить узел графа");
      }
    }
  );

  app.delete(
    "/api/v2/graph/nodes/:id",
    {
      schema: {
        params: PARAMS_ID_SCHEMA,
        response: {
          200: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              node: NODE_RESPONSE_SCHEMA,
              archived: { type: "boolean" },
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
        const node = await app.graphService.archiveNode(request.params.id);
        if (!node) {
          return respondError(reply, 404, "Узел графа не найден");
        }
        return { ok: true, node, archived: true };
      } catch (err) {
        request.log.error({ err }, "Не удалось архивировать узел графа");
        const code = err.statusCode || 400;
        return respondError(reply, code, err.message || "Не удалось архивировать узел графа");
      }
    }
  );

  app.post(
    "/api/v2/graph/nodes/:id/unarchive",
    {
      schema: {
        params: PARAMS_ID_SCHEMA,
        response: {
          200: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              node: NODE_RESPONSE_SCHEMA,
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
        const node = await app.graphService.unarchiveNode(request.params.id);
        if (!node) {
          return respondError(reply, 404, "Узел графа не найден");
        }
        return { ok: true, node };
      } catch (err) {
        request.log.error({ err }, "Не удалось разархивировать узел графа");
        const code = err.statusCode || 400;
        return respondError(reply, code, err.message || "Не удалось разархивировать узел графа");
      }
    }
  );

  app.post(
    "/api/v2/graph/edges",
    {
      schema: {
        body: {
          type: "object",
          required: ["sourceNodeId", "targetNodeId", "relation"],
          properties: {
            sourceNodeId: { type: "string", format: "uuid" },
            targetNodeId: { type: "string", format: "uuid" },
            relation: { type: "string", minLength: 1, maxLength: 64 },
            attributes: { type: "object", additionalProperties: true },
            confidence: { type: "number", minimum: 0, maximum: 1 },
            author: { type: "string", maxLength: 128 },
          },
          additionalProperties: false,
        },
        response: {
          200: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              edge: EDGE_RESPONSE_SCHEMA,
              created: { type: "boolean" },
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
        const result = await app.graphService.createEdge(request.body);
        return reply.send({ ok: true, edge: result.edge, created: result.created });
      } catch (err) {
        request.log.error({ err }, "Не удалось создать связь графа");
        const code = err.statusCode || 400;
        return respondError(reply, code, err.message || "Не удалось создать связь графа");
      }
    }
  );

  app.get(
    "/api/v2/graph/edges",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            sourceNodeId: { type: "string", format: "uuid" },
            targetNodeId: { type: "string", format: "uuid" },
            relation: { type: "string", maxLength: 64 },
            limit: { type: "integer", minimum: 1, maximum: 500 },
            offset: { type: "integer", minimum: 0 },
          },
          additionalProperties: true,
        },
        response: {
          200: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              items: { type: "array", items: EDGE_RESPONSE_SCHEMA },
              total: { type: "integer" },
              limit: { type: "integer" },
              offset: { type: "integer" },
            },
          },
          400: ERROR_RESPONSE_SCHEMA,
          500: ERROR_RESPONSE_SCHEMA,
        },
      },
    },
    async (request, reply) => {
      try {
        const q = request.query ?? {};
        const result = await app.graphService.listEdges({
          sourceNodeId: q.sourceNodeId,
          targetNodeId: q.targetNodeId,
          relation: q.relation,
          limit: parseIntOr(q.limit, 100),
          offset: parseIntOr(q.offset, 0),
        });
        return { ok: true, ...result };
      } catch (err) {
        request.log.error({ err }, "Не удалось получить список связей графа");
        const code = err.statusCode || 500;
        return respondError(reply, code, err.message || "Не удалось получить список связей");
      }
    }
  );

  app.get(
    "/api/v2/graph/nodes/:id/related",
    {
      schema: {
        params: PARAMS_ID_SCHEMA,
        querystring: {
          type: "object",
          properties: {
            relation: { type: "string", maxLength: 64 },
            direction: { type: "string", enum: ["outgoing", "incoming", "both"] },
          },
          additionalProperties: true,
        },
        response: {
          200: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    direction: { type: "string" },
                    edge: EDGE_RESPONSE_SCHEMA,
                    node: NODE_RESPONSE_SCHEMA,
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
        const q = request.query ?? {};
        const items = await app.graphService.getRelatedNodes(request.params.id, {
          relation: q.relation,
          direction: q.direction,
        });
        return { ok: true, items };
      } catch (err) {
        request.log.error({ err }, "Не удалось получить связанные узлы");
        const code = err.statusCode || 400;
        return respondError(reply, code, err.message || "Не удалось получить связанные узлы");
      }
    }
  );

  app.delete(
    "/api/v2/graph/edges/:id",
    {
      schema: {
        params: PARAMS_ID_SCHEMA,
        response: {
          200: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              deleted: { type: "boolean" },
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
        const deleted = await app.graphService.deleteEdge(request.params.id);
        if (!deleted) {
          return respondError(reply, 404, "Связь графа не найдена");
        }
        return { ok: true, deleted: true };
      } catch (err) {
        request.log.error({ err }, "Не удалось удалить связь графа");
        const code = err.statusCode || 400;
        return respondError(reply, code, err.message || "Не удалось удалить связь графа");
      }
    }
  );

  app.post(
    "/api/v2/graph/case",
    {
      schema: {
        body: {
          type: "object",
          required: ["faultText"],
          properties: {
            equipmentId: { type: "string", format: "uuid", nullable: true },
            equipmentName: { type: "string", maxLength: 512, nullable: true },
            equipmentModel: { type: "string", maxLength: 512, nullable: true },
            equipmentLocation: { type: "string", maxLength: 512, nullable: true },
            objectId: { type: "string", format: "uuid", nullable: true },
            objectName: { type: "string", maxLength: 512, nullable: true },
            faultText: { type: "string", minLength: 1, maxLength: 8192 },
            solutionText: { type: "string", maxLength: 8192, nullable: true },
            date: { type: "string", maxLength: 32, nullable: true },
            documentId: { type: "string", format: "uuid", nullable: true },
          },
          additionalProperties: false,
        },
        response: {
          200: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              nodes: {
                type: "object",
                properties: {
                  equipment: NODE_RESPONSE_SCHEMA,
                  object: NODE_RESPONSE_SCHEMA,
                  fault: NODE_RESPONSE_SCHEMA,
                  solution: NODE_RESPONSE_SCHEMA,
                },
                additionalProperties: true,
              },
              edges: { type: "array", items: EDGE_RESPONSE_SCHEMA },
              created: {
                type: "object",
                properties: {
                  equipment: { type: "boolean" },
                  object: { type: "boolean" },
                  fault: { type: "boolean" },
                  solution: { type: "boolean" },
                },
                additionalProperties: true,
              },
            },
            additionalProperties: true,
          },
          400: ERROR_RESPONSE_SCHEMA,
          500: ERROR_RESPONSE_SCHEMA,
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await app.graphService.recordCase(request.body ?? {});
        return reply.send({ ok: true, ...result });
      } catch (err) {
        request.log.error({ err }, "Не удалось записать случай в память инженера");
        const code = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
        return respondError(
          reply,
          code,
          err.message || "Не удалось записать случай"
        );
      }
    }
  );

  app.get(
    "/api/v2/graph/stats",
    {
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              nodesByType: { type: "object", additionalProperties: { type: "integer" } },
              edgesByRelation: { type: "object", additionalProperties: { type: "integer" } },
              totalActiveNodes: { type: "integer" },
              totalArchivedNodes: { type: "integer" },
              totalEdges: { type: "integer" },
              nodeTypeLabels: {
                type: "object",
                additionalProperties: {
                  type: "object",
                  properties: {
                    label_ru: { type: "string" },
                    icon: { type: "string", nullable: true },
                  },
                  additionalProperties: true,
                },
              },
            },
          },
          500: ERROR_RESPONSE_SCHEMA,
        },
      },
    },
    async (request, reply) => {
      try {
        const stats = await app.graphService.getStats();
        return { ok: true, ...stats };
      } catch (err) {
        request.log.error({ err }, "Не удалось получить статистику графа");
        return respondError(reply, 500, err.message || "Не удалось получить статистику графа");
      }
    }
  );
}

export default graphRoutes;
