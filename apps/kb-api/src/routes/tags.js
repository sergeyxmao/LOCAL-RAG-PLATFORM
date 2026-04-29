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
}
