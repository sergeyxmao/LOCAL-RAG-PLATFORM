function runDetached(task) {
  setTimeout(() => {
    task().catch((error) => {
      console.error("[detached-job-route]", error);
    });
  }, 0);
}

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  return ["1", "true", "yes", "on", "да"].includes(String(value).toLowerCase());
}

const PILL_TO_STATUSES = {
  running: ["queued", "running", "cancel_requested"],
  completed: ["completed"],
  stopped: ["failed", "cancelled"],
};

function parseStatusPills(raw) {
  if (raw === undefined || raw === null || raw === "") return null;
  const tokens = Array.isArray(raw)
    ? raw
    : String(raw)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
  if (tokens.length === 0) return null;
  const out = new Set();
  for (const tok of tokens) {
    const key = String(tok).toLowerCase();
    if (PILL_TO_STATUSES[key]) {
      PILL_TO_STATUSES[key].forEach((s) => out.add(s));
    } else if (
      ["queued", "running", "cancel_requested", "completed", "failed", "cancelled"].includes(key)
    ) {
      out.add(key);
    }
  }
  return Array.from(out);
}

export async function jobRoutes(app) {
  app.get("/jobs", async (request, reply) => {
    const query = request.query ?? {};
    const statuses = parseStatusPills(query.statuses);
    const items = await app.postgresProvider.listJobs({
      statusMode: query.statusMode,
      search: query.search,
      limit: query.limit,
      offset: query.offset,
      statuses,
      nodeId: query.nodeId,
      includeChildren: parseBoolean(query.includeChildren, true),
    });

    if (!items) {
      reply.code(404);
      return {
        ok: false,
        error: "Раздел не найден",
      };
    }

    const total = typeof items.total === "number" ? items.total : items.length;

    if (query.nodeId) {
      return {
        ok: true,
        nodeId: query.nodeId,
        includeChildren: parseBoolean(query.includeChildren, true),
        items,
        total,
      };
    }

    return {
      items,
      total,
    };
  });

  app.delete("/jobs/:id", async (request, reply) => {
    const job = await app.postgresProvider.getJobById(request.params.id);
    if (!job) {
      reply.code(404);
      return {
        ok: false,
        error: "Задача не найдена",
      };
    }

    const isPreUpload = job.status === "queued" && !job.document_id;
    if (!isPreUpload && ["queued", "running", "cancel_requested"].includes(job.status)) {
      reply.code(409);
      return {
        ok: false,
        error: "Сначала остановите задачу, потом удалите её из истории",
      };
    }

    const deleted = await app.postgresProvider.deleteJobById(request.params.id);
    if (!deleted) {
      reply.code(404);
      return {
        ok: false,
        error: "Задача не найдена",
      };
    }

    return {
      ok: true,
      deleted: true,
    };
  });

  app.post(
    "/jobs/queue",
    {
      schema: {
        body: {
          type: "object",
          required: ["items"],
          properties: {
            items: {
              type: "array",
              minItems: 1,
              maxItems: 1000,
              items: {
                type: "object",
                required: ["filename"],
                properties: {
                  filename: { type: "string", minLength: 1, maxLength: 512 },
                  size: { type: "integer", minimum: 0 },
                  nodeId: { type: ["string", "null"] },
                  primaryNodeId: { type: ["string", "null"] },
                  createVisualAssets: { type: "boolean" },
                  categories: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const items = Array.isArray(request.body?.items) ? request.body.items : [];
      const created = [];
      for (const item of items) {
        const filename = String(item.filename || "").trim();
        if (!filename) continue;
        const nodeIds = [];
        if (item.nodeId && typeof item.nodeId === "string") nodeIds.push(item.nodeId);
        const pendingOptions = {
          size: Number(item.size) || 0,
          createVisualAssets: item.createVisualAssets === true,
          primaryNodeId: item.primaryNodeId || null,
          categories: Array.isArray(item.categories) ? item.categories : [],
        };
        const job = await app.postgresProvider.createJob({
          documentId: null,
          jobType: "ingest-file",
          status: "queued",
          phase: "awaiting_upload",
          totalItems: null,
          processedItems: 0,
          progressMessage: "Ожидает загрузки",
          pendingFilename: filename,
          pendingOptions,
        });
        if (nodeIds.length > 0) {
          await app.postgresProvider.replaceJobNodeLinks(job.id, nodeIds);
        }
        created.push({
          id: job.id,
          filename,
          status: job.status,
          createdAt: job.created_at,
        });
      }
      reply.code(201);
      return { ok: true, jobs: created };
    }
  );

  app.put("/jobs/:id/upload", async (request, reply) => {
    const job = await app.postgresProvider.getJobById(request.params.id);
    if (!job) {
      reply.code(404);
      return { ok: false, error: "Задача не найдена" };
    }
    if (job.status !== "queued" || job.document_id) {
      reply.code(409);
      return { ok: false, error: "Задача уже запущена или завершена" };
    }
    let file;
    try {
      file = await request.file();
    } catch (error) {
      reply.code(400);
      return { ok: false, error: "Не удалось прочитать файл: " + error.message };
    }
    if (!file) {
      reply.code(400);
      return { ok: false, error: "Нужно передать файл в multipart/form-data" };
    }
    try {
      const fsModule = await import("node:fs/promises");
      const pathModule = await import("node:path");
      const originalName = String(file.filename || job.pending_filename || "document").replace(/[\\/]/g, "_");
      const storedRelativePath = `${Date.now()}-${originalName}`;
      const storedFullPath = pathModule.join(app.config.rawRoot, storedRelativePath);
      const buffer = await file.toBuffer();
      await fsModule.mkdir(app.config.rawRoot, { recursive: true });
      await fsModule.writeFile(storedFullPath, buffer);

      const opts = (job.pending_options && typeof job.pending_options === "object") ? job.pending_options : {};
      const nodeIds = [];
      if (opts.primaryNodeId && typeof opts.primaryNodeId === "string") nodeIds.push(opts.primaryNodeId);
      const categories = Array.isArray(opts.categories) ? opts.categories : [];
      const createVisualAssets = opts.createVisualAssets === true;

      runDetached(async () => {
        try {
          await app.ingestionService.ingestFileFromRaw({
            relativePath: storedRelativePath,
            title: originalName,
            categories,
            nodeIds,
            primaryNodeId: opts.primaryNodeId || null,
            createVisualAssets,
            existingJobId: job.id,
          });
        } catch (error) {
          request.log.error({ err: error, jobId: job.id }, "Queued ingest failed");
          await app.postgresProvider.updateJobStatus(job.id, "failed", error.message);
        }
      });

      reply.code(202);
      return {
        ok: true,
        queued: true,
        jobId: job.id,
        storedRelativePath,
      };
    } catch (error) {
      request.log.error({ err: error, jobId: job.id }, "Failed to accept queued upload");
      await app.postgresProvider.updateJobStatus(job.id, "failed", error.message);
      reply.code(500);
      return { ok: false, error: error.message || "Не удалось принять файл" };
    }
  });

  app.post("/jobs/:id/cancel", async (request, reply) => {
    const job = await app.postgresProvider.getJobById(request.params.id);
    if (!job) {
      reply.code(404);
      return {
        ok: false,
        error: "Задача не найдена",
      };
    }

    const cancellableStatuses = new Set(["queued", "running", "cancel_requested"]);
    if (!cancellableStatuses.has(job.status)) {
      return {
        ok: true,
        changed: false,
        job,
        message: "Эту задачу уже нельзя остановить",
      };
    }

    const updatedJob = await app.postgresProvider.requestJobCancellation(job.id);
    return {
      ok: true,
      changed: true,
      job: updatedJob,
      message:
        job.status === "queued"
          ? "Задача отменена."
          : "Запрос на остановку отправлен. Текущий batch завершится и задача остановится.",
    };
  });

  app.post("/jobs/:id/retry", async (request, reply) => {
    const job = await app.postgresProvider.getJobById(request.params.id);
    if (!job) {
      reply.code(404);
      return {
        ok: false,
        error: "Задача не найдена",
      };
    }

    if (job.job_type !== "ingest-file") {
      reply.code(400);
      return {
        ok: false,
        error: "Повтор сейчас поддерживается только для импорта одного файла",
      };
    }

    if (!["failed", "cancelled"].includes(job.status)) {
      return {
        ok: true,
        changed: false,
        message: "Повтор доступен только для задач со статусом ошибка или остановлено",
      };
    }

    if (!job.original_file_path) {
      reply.code(400);
      return {
        ok: false,
        error: "У задачи нет исходного пути к файлу",
      };
    }

    const categories = Array.isArray(job.categories) ? job.categories : [];

    runDetached(async () => {
      const existingDocuments = await app.postgresProvider.listDocumentsByOriginalPath(
        job.original_file_path
      );
      const purgeDocumentIds = existingDocuments
        .filter((item) => item.status !== "indexed")
        .map((item) => item.id);

      const pointIds = [];
      for (const documentId of purgeDocumentIds) {
        const ids = await app.postgresProvider.getDocumentPointIds(documentId);
        pointIds.push(...ids);
      }

      await app.qdrantProvider.deletePoints(pointIds);
      await app.postgresProvider.deleteDocumentsByIds(purgeDocumentIds);

      await app.ingestionService.ingestFileFromRaw({
        relativePath: job.original_file_path,
        categories,
        force: false,
        createVisualAssets: true,
      });
    });

    reply.code(202);
    return {
      ok: true,
      changed: true,
      queued: true,
      relativePath: job.original_file_path,
      message: "Повторный импорт поставлен в очередь. Следите за статусом на странице задач.",
    };
  });
}
