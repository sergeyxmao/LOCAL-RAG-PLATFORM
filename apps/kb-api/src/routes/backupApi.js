import fs from "node:fs";
import { adminFlagPreHandler } from "./adminFlag.js";

function respondError(reply, statusCode, message, extras = {}) {
  reply.code(statusCode);
  return { ok: false, error: message, ...extras };
}

export async function backupApiRoutes(app) {
  app.addHook("preHandler", adminFlagPreHandler);

  app.get("/api/v2/backups", async (request, reply) => {
    try {
      const limit = Number(request.query?.limit ?? 50);
      const backups = await app.backupService.listBackups({ limit });
      return { ok: true, backups };
    } catch (error) {
      request.log.error({ err: error }, "Не удалось получить список бэкапов");
      return respondError(reply, 500, error.message || "Не удалось получить список бэкапов");
    }
  });

  app.post("/api/v2/backups", async (request, reply) => {
    try {
      const result = await app.backupService.createBackup();
      reply.code(201);
      return { ok: true, ...result };
    } catch (error) {
      request.log.error({ err: error }, "Не удалось создать бэкап");
      return respondError(reply, 500, error.message || "Не удалось создать бэкап");
    }
  });

  app.get("/api/v2/backups/:filename/download", async (request, reply) => {
    try {
      const stat = await app.backupService.getBackupStat(request.params.filename);
      reply.header("Content-Type", "application/gzip");
      reply.header("Content-Disposition", `attachment; filename="${request.params.filename}"`);
      reply.header("Content-Length", String(stat.size));
      return reply.send(fs.createReadStream(stat.fullPath));
    } catch (error) {
      return respondError(reply, error.statusCode || 500, error.message || "Не удалось скачать бэкап");
    }
  });

  app.delete("/api/v2/backups/:filename", async (request, reply) => {
    try {
      await app.backupService.deleteBackup(request.params.filename);
      return { ok: true };
    } catch (error) {
      return respondError(reply, error.statusCode || 500, error.message || "Не удалось удалить бэкап");
    }
  });

  app.post("/api/v2/backups/:filename/restore", async (request, reply) => {
    const body = request.body ?? {};
    if (body.confirm !== "ВОССТАНОВИТЬ") {
      return respondError(reply, 400, "Для восстановления передайте confirm=ВОССТАНОВИТЬ");
    }
    try {
      const result = await app.backupService.restoreFromExistingBackup(request.params.filename);
      await app.postgresProvider.ensureRuntimeSchema();
      if (app.appSettingsService) app.appSettingsService.invalidate();
      return { ok: true, ...result };
    } catch (error) {
      request.log.error({ err: error, filename: request.params.filename }, "Не удалось восстановить бэкап");
      return respondError(reply, error.statusCode || 500, error.message || "Не удалось восстановить бэкап");
    }
  });

  app.post("/api/v2/backups/restore-upload", async (request, reply) => {
    if (!request.isMultipart || !request.isMultipart()) {
      return respondError(reply, 400, "Ожидается multipart/form-data с полем file и confirm");
    }
    try {
      const file = await request.file();
      if (!file) return respondError(reply, 400, "Не передан файл бэкапа");
      const confirm = String(file.fields?.confirm?.value || "").trim();
      if (confirm !== "ВОССТАНОВИТЬ") {
        return respondError(reply, 400, "Передайте confirm=ВОССТАНОВИТЬ");
      }
      const filename = String(file.filename || "");
      const compressed = filename.endsWith(".gz");
      if (!/\.sql(\.gz)?$/i.test(filename)) {
        return respondError(reply, 400, "Поддерживаются только .sql и .sql.gz файлы");
      }
      const buffer = await file.toBuffer();
      const result = await app.backupService.restoreFromBuffer(buffer, { compressed });
      await app.postgresProvider.ensureRuntimeSchema();
      if (app.appSettingsService) app.appSettingsService.invalidate();
      return { ok: true, ...result };
    } catch (error) {
      request.log.error({ err: error }, "Не удалось восстановить из загруженного файла");
      return respondError(reply, error.statusCode || 500, error.message || "Не удалось восстановить");
    }
  });
}
