import fs from "node:fs/promises";
import path from "node:path";

const SUPPORTED_EXTENSIONS = new Set([".xlsx", ".xls", ".xlsm"]);

function respondError(reply, statusCode, message) {
  reply.code(statusCode);
  return { ok: false, error: message };
}

export async function graphReparseRoutes(app) {
  app.setErrorHandler((error, request, reply) => {
    if (error.validation && Array.isArray(error.validation) && error.validation.length > 0) {
      const first = error.validation[0];
      const field = first.params?.missingProperty
        ? `/${first.params.missingProperty}`
        : first.instancePath || "";
      const suffix = field ? ` (${field})` : "";
      request.log.warn({ err: error }, "Ошибка валидации reparse");
      reply.code(400).send({
        ok: false,
        error: `Некорректный формат поля${suffix}`,
      });
      return;
    }
    request.log.error({ err: error }, "Ошибка reparse");
    const statusCode = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
    reply.code(statusCode).send({
      ok: false,
      error: error.message || "Внутренняя ошибка сервера",
    });
  });

  app.post(
    "/api/v2/graph/reparse/:documentId",
    {
      schema: {
        params: {
          type: "object",
          required: ["documentId"],
          properties: {
            documentId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              report: { type: "object", additionalProperties: true },
            },
          },
          400: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              error: { type: "string" },
            },
          },
          404: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              error: { type: "string" },
            },
          },
          500: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { documentId } = request.params;
      const document = await app.postgresProvider.getDocumentById(documentId);
      if (!document) {
        return respondError(reply, 404, "Документ не найден");
      }

      const relativePath = document.original_file_path;
      if (!relativePath) {
        return respondError(reply, 400, "У документа не указан исходный путь");
      }

      const ext = path.extname(relativePath).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.has(ext)) {
        return respondError(
          reply,
          400,
          `Парсер графа работает только с .xlsx/.xls/.xlsm; у документа расширение ${ext || "не задано"}`
        );
      }

      const rawRoot = app.config?.rawRoot;
      if (!rawRoot) {
        return respondError(reply, 500, "rawRoot не сконфигурирован");
      }
      const fullPath = path.join(rawRoot, relativePath);
      try {
        await fs.access(fullPath);
      } catch {
        return respondError(reply, 500, `Исходный файл не найден на диске: ${relativePath}`);
      }

      try {
        const report = await app.graphIngestionService.parseAndIngest({
          documentId,
          filePath: fullPath,
          jobId: null,
        });
        return { ok: true, report };
      } catch (err) {
        request.log.error({ err, documentId }, "Перезапуск парсера графа упал");
        return respondError(reply, 500, err.message || "Не удалось перезапустить парсер графа");
      }
    }
  );
}

export default graphReparseRoutes;
