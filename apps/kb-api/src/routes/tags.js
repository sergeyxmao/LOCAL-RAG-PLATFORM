const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value) {
  return UUID_PATTERN.test(String(value ?? ""));
}

function parseBoolean(value, defaultValue = true) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  return ["1", "true", "yes", "on", "да"].includes(String(value).toLowerCase());
}

function mapTagRow(row) {
  return {
    tag: row.tag,
    count: Number(row.count ?? 0),
  };
}

function runQdrantSyncForDocs(app, documentIds, payloadFn) {
  if (!Array.isArray(documentIds) || documentIds.length === 0) return;
  setImmediate(async () => {
    for (const docId of documentIds) {
      try {
        const pointIds = await app.postgresProvider.getDocumentPointIds(docId);
        if (!pointIds.length) continue;
        const fresh = await app.postgresProvider.getDocumentById(docId);
        const categories = Array.isArray(fresh?.categories) ? fresh.categories : [];
        const payload = typeof payloadFn === "function" ? payloadFn(categories) : { categories };
        await app.qdrantProvider.setPayload(pointIds, payload);
      } catch (error) {
        app.log.warn({ documentId: docId, err: error.message }, "Qdrant sync after tag mutation failed");
      }
    }
  });
}

export async function tagRoutes(app) {
  app.get("/tags", async (request, reply) => {
    const nodeId = String(request.query?.nodeId ?? "").trim();
    if (nodeId && !isUuid(nodeId)) {
      reply.code(400);
      return {
        ok: false,
        error: "Некорректный UUID раздела",
      };
    }

    const includeChildren = parseBoolean(request.query?.includeChildren, true);
    const items = await app.postgresProvider.listTags({
      nodeId: nodeId || null,
      includeChildren,
      limit: request.query?.limit,
    });
    if (!items) {
      reply.code(404);
      return {
        ok: false,
        error: "Раздел не найден",
      };
    }

    return {
      ok: true,
      nodeId: nodeId || null,
      includeChildren,
      items: items.map((row) => mapTagRow(row)),
    };
  });

  app.patch(
    "/tags/:name",
    {
      schema: {
        body: {
          type: "object",
          required: ["newName"],
          properties: {
            newName: { type: "string", minLength: 1, maxLength: 64 },
          },
        },
      },
    },
    async (request, reply) => {
      const oldName = decodeURIComponent(String(request.params?.name ?? "")).trim();
      const newName = String(request.body?.newName ?? "").trim();
      if (!oldName || !newName) {
        reply.code(400);
        return { ok: false, error: "Старое и новое имя тега должны быть непустыми" };
      }
      if (newName.length > 64) {
        reply.code(400);
        return { ok: false, error: "Имя тега не может быть длиннее 64 символов" };
      }
      try {
        const { updatedIds, count } = await app.postgresProvider.renameTagAcrossDocuments(
          oldName,
          newName
        );
        runQdrantSyncForDocs(app, updatedIds);
        return {
          ok: true,
          oldName,
          newName,
          updatedDocuments: count,
          qdrantSync: { scheduled: count > 0 },
        };
      } catch (error) {
        request.log.error({ err: error, oldName, newName }, "Не удалось переименовать тег");
        const code = error.statusCode || 500;
        reply.code(code);
        return { ok: false, error: error.message || "Не удалось переименовать тег" };
      }
    }
  );

  app.delete("/tags/:name", async (request, reply) => {
    const name = decodeURIComponent(String(request.params?.name ?? "")).trim();
    if (!name) {
      reply.code(400);
      return { ok: false, error: "Имя тега не может быть пустым" };
    }
    try {
      const { updatedIds, count } = await app.postgresProvider.deleteTagAcrossDocuments(name);
      runQdrantSyncForDocs(app, updatedIds);
      return {
        ok: true,
        name,
        updatedDocuments: count,
        qdrantSync: { scheduled: count > 0 },
      };
    } catch (error) {
      request.log.error({ err: error, name }, "Не удалось удалить тег");
      const code = error.statusCode || 500;
      reply.code(code);
      return { ok: false, error: error.message || "Не удалось удалить тег" };
    }
  });
}
