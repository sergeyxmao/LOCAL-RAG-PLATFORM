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

export async function jobRoutes(app) {
  app.get("/jobs", async (request, reply) => {
    const query = request.query ?? {};
    const items = await app.postgresProvider.listJobs({
      statusMode: query.statusMode,
      search: query.search,
      limit: query.limit,
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

    if (query.nodeId) {
      return {
        ok: true,
        nodeId: query.nodeId,
        includeChildren: parseBoolean(query.includeChildren, true),
        items,
      };
    }

    return {
      items,
    };
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
        createVisualAssets: false,
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
