// Роуты Этапа 3: LLM-извлечение случаев из документов + очередь ревью.
//
// Извлечение НЕ пишет в граф — только в очередь кандидатов
// (graph_extraction_candidates). В graph_nodes/graph_edges случай попадает
// исключительно через подтверждение кандидата пользователем (approve →
// graphService.recordCase с author='agent:llm-extraction').
//
// Все ответы и ошибки — на русском. Вход валидируется схемами Fastify/AJV
// (attachValidation + ручная проверка, как в settingsApi.js); nullable
// всегда сопровождается type.

const ERROR_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    ok: { type: "boolean" },
    error: { type: "string" },
  },
  additionalProperties: true,
};

const CANDIDATE_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    id: { type: "string" },
    sourceDocumentId: { type: ["string", "null"] },
    extractionJobId: { type: "string" },
    casePayload: { type: "object", additionalProperties: true },
    confidence: { type: ["number", "null"] },
    status: { type: "string" },
    createdAt: { type: ["string", "null"] },
    reviewedAt: { type: ["string", "null"] },
  },
  additionalProperties: true,
};

const PARAMS_DOC_SCHEMA = {
  type: "object",
  required: ["documentId"],
  properties: { documentId: { type: "string", format: "uuid" } },
};

const PARAMS_ID_SCHEMA = {
  type: "object",
  required: ["id"],
  properties: { id: { type: "string", format: "uuid" } },
};

const PARAMS_JOB_SCHEMA = {
  type: "object",
  required: ["jobId"],
  properties: { jobId: { type: "string", format: "uuid" } },
};

const BATCH_BODY_SCHEMA = {
  type: "object",
  required: ["ids"],
  properties: {
    ids: {
      type: "array",
      minItems: 1,
      maxItems: 500,
      items: { type: "string", format: "uuid" },
    },
  },
  additionalProperties: false,
};

function respondError(reply, statusCode, message) {
  reply.code(statusCode);
  return { ok: false, error: message };
}

function parseIntOr(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.trunc(num);
}

export async function graphExtractionRoutes(app) {
  // ============== Извлечение (асинхронная задача) ==============

  app.post(
    "/api/v2/graph/extract/:documentId",
    {
      attachValidation: true,
      schema: { params: PARAMS_DOC_SCHEMA },
    },
    async (request, reply) => {
      if (request.validationError) {
        return respondError(reply, 400, "Некорректный идентификатор документа.");
      }
      const service = app.knowledgeExtractionService;
      if (!service) {
        return respondError(reply, 503, "Сервис извлечения знаний не инициализирован.");
      }
      try {
        const result = await service.startExtractionJob({
          documentId: request.params.documentId,
        });
        if (!result.ok) {
          // Понятное русское сообщение (выключено / нет провайдера / не тот
          // тип документа). Ничего не создано, граф не затронут.
          return respondError(reply, 409, result.error || "Извлечение недоступно.");
        }
        return reply.send({
          ok: true,
          jobId: result.jobId,
          status: result.status,
          documentTitle: result.documentTitle || "",
        });
      } catch (err) {
        request.log.error({ err }, "Не удалось запустить извлечение знаний");
        const code = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
        return respondError(reply, code, err.message || "Не удалось запустить извлечение.");
      }
    }
  );

  app.get(
    "/api/v2/graph/extract/status/:jobId",
    {
      attachValidation: true,
      schema: { params: PARAMS_JOB_SCHEMA },
    },
    async (request, reply) => {
      if (request.validationError) {
        return respondError(reply, 400, "Некорректный идентификатор задачи.");
      }
      const service = app.knowledgeExtractionService;
      if (!service) {
        return respondError(reply, 503, "Сервис извлечения знаний не инициализирован.");
      }
      const job = service.getJobStatus(request.params.jobId);
      if (!job) {
        return respondError(reply, 404, "Задача извлечения не найдена или устарела.");
      }
      return {
        ok: true,
        job: {
          jobId: job.jobId,
          status: job.status,
          documentId: job.documentId || null,
          documentTitle: job.documentTitle || "",
          casesFound: job.casesFound ?? 0,
          message: job.message || null,
          error: job.error || null,
        },
      };
    }
  );

  // ============== Очередь кандидатов ==============

  app.get(
    "/api/v2/graph/candidates",
    {
      attachValidation: true,
      schema: {
        querystring: {
          type: "object",
          properties: {
            documentId: { type: "string", format: "uuid" },
            extractionJobId: { type: "string", format: "uuid" },
            status: { type: "string", enum: ["pending", "approved", "rejected"] },
            limit: { type: "integer", minimum: 1, maximum: 1000 },
            offset: { type: "integer", minimum: 0 },
          },
          additionalProperties: true,
        },
      },
    },
    async (request, reply) => {
      if (request.validationError) {
        return respondError(reply, 400, "Некорректные параметры запроса кандидатов.");
      }
      try {
        const q = request.query ?? {};
        const result = await app.graphService.listCandidates({
          sourceDocumentId: q.documentId,
          extractionJobId: q.extractionJobId,
          status: q.status,
          limit: parseIntOr(q.limit, 200),
          offset: parseIntOr(q.offset, 0),
        });
        return { ok: true, ...result };
      } catch (err) {
        request.log.error({ err }, "Не удалось получить список кандидатов");
        const code = err.statusCode || 500;
        return respondError(reply, code, err.message || "Не удалось получить кандидатов.");
      }
    }
  );

  app.get(
    "/api/v2/graph/candidates/runs",
    {
      attachValidation: true,
      schema: {
        querystring: {
          type: "object",
          properties: { limit: { type: "integer", minimum: 1, maximum: 500 } },
          additionalProperties: true,
        },
      },
    },
    async (request, reply) => {
      if (request.validationError) {
        return respondError(reply, 400, "Некорректные параметры запроса запусков.");
      }
      try {
        const q = request.query ?? {};
        const items = await app.graphService.listCandidateRuns({
          limit: parseIntOr(q.limit, 100),
        });
        return { ok: true, items };
      } catch (err) {
        request.log.error({ err }, "Не удалось получить список запусков извлечения");
        const code = err.statusCode || 500;
        return respondError(reply, code, err.message || "Не удалось получить запуски.");
      }
    }
  );

  app.patch(
    "/api/v2/graph/candidates/:id",
    {
      attachValidation: true,
      schema: {
        params: PARAMS_ID_SCHEMA,
        body: {
          type: "object",
          properties: {
            casePayload: { type: "object", additionalProperties: true },
            confidence: { type: "number", minimum: 0, maximum: 1, nullable: true },
          },
          additionalProperties: false,
        },
        response: {
          200: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              candidate: CANDIDATE_RESPONSE_SCHEMA,
            },
          },
          400: ERROR_RESPONSE_SCHEMA,
          404: ERROR_RESPONSE_SCHEMA,
          409: ERROR_RESPONSE_SCHEMA,
          500: ERROR_RESPONSE_SCHEMA,
        },
      },
    },
    async (request, reply) => {
      if (request.validationError) {
        return respondError(reply, 400, "Некорректные данные правки кандидата.");
      }
      try {
        const result = await app.graphService.updateCandidate(
          request.params.id,
          request.body ?? {}
        );
        return reply.send({ ok: true, candidate: result.candidate });
      } catch (err) {
        request.log.error({ err }, "Не удалось обновить кандидата");
        const code = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
        return respondError(reply, code, err.message || "Не удалось обновить кандидата.");
      }
    }
  );

  app.post(
    "/api/v2/graph/candidates/:id/approve",
    {
      attachValidation: true,
      schema: {
        params: PARAMS_ID_SCHEMA,
        response: {
          200: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              candidate: CANDIDATE_RESPONSE_SCHEMA,
              nodes: { type: "object", additionalProperties: true },
              edges: { type: "array", items: { type: "object", additionalProperties: true } },
              created: { type: "object", additionalProperties: true },
            },
            additionalProperties: true,
          },
          400: ERROR_RESPONSE_SCHEMA,
          404: ERROR_RESPONSE_SCHEMA,
          409: ERROR_RESPONSE_SCHEMA,
          500: ERROR_RESPONSE_SCHEMA,
        },
      },
    },
    async (request, reply) => {
      if (request.validationError) {
        return respondError(reply, 400, "Некорректный идентификатор кандидата.");
      }
      try {
        const result = await app.graphService.approveCandidate(request.params.id);
        return reply.send({ ok: true, ...result });
      } catch (err) {
        request.log.error({ err }, "Не удалось подтвердить кандидата");
        const code = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
        return respondError(reply, code, err.message || "Не удалось подтвердить кандидата.");
      }
    }
  );

  app.post(
    "/api/v2/graph/candidates/:id/reject",
    {
      attachValidation: true,
      schema: {
        params: PARAMS_ID_SCHEMA,
        response: {
          200: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              candidate: CANDIDATE_RESPONSE_SCHEMA,
            },
          },
          400: ERROR_RESPONSE_SCHEMA,
          404: ERROR_RESPONSE_SCHEMA,
          500: ERROR_RESPONSE_SCHEMA,
        },
      },
    },
    async (request, reply) => {
      if (request.validationError) {
        return respondError(reply, 400, "Некорректный идентификатор кандидата.");
      }
      try {
        const result = await app.graphService.rejectCandidate(request.params.id);
        return reply.send({ ok: true, candidate: result.candidate });
      } catch (err) {
        request.log.error({ err }, "Не удалось отклонить кандидата");
        const code = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
        return respondError(reply, code, err.message || "Не удалось отклонить кандидата.");
      }
    }
  );

  // ============== Пакетные действия ==============

  app.post(
    "/api/v2/graph/candidates/approve",
    {
      attachValidation: true,
      schema: { body: BATCH_BODY_SCHEMA },
    },
    async (request, reply) => {
      if (request.validationError) {
        return respondError(reply, 400, "Передайте непустой список ids (UUID).");
      }
      const ids = request.body.ids;
      const approved = [];
      const failed = [];
      for (const id of ids) {
        try {
          const result = await app.graphService.approveCandidate(id);
          approved.push(result.candidate?.id || id);
        } catch (err) {
          failed.push({ id, error: err.message || "Ошибка подтверждения" });
        }
      }
      return reply.send({ ok: true, approved, failed });
    }
  );

  app.post(
    "/api/v2/graph/candidates/reject",
    {
      attachValidation: true,
      schema: { body: BATCH_BODY_SCHEMA },
    },
    async (request, reply) => {
      if (request.validationError) {
        return respondError(reply, 400, "Передайте непустой список ids (UUID).");
      }
      const ids = request.body.ids;
      const rejected = [];
      const failed = [];
      for (const id of ids) {
        try {
          const result = await app.graphService.rejectCandidate(id);
          rejected.push(result.candidate?.id || id);
        } catch (err) {
          failed.push({ id, error: err.message || "Ошибка отклонения" });
        }
      }
      return reply.send({ ok: true, rejected, failed });
    }
  );
}

export default graphExtractionRoutes;
