const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value) {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function parseBoolean(value, defaultValue = true) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  return ["1", "true", "yes", "on", "да"].includes(String(value).toLowerCase());
}

function mapUiState(row) {
  if (!row) {
    return {
      currentNodeId: null,
      includeChildren: true,
      node: null,
      updatedAt: null,
    };
  }

  return {
    currentNodeId: row.current_node_id ?? null,
    includeChildren: row.include_children !== false,
    node: row.current_node_id
      ? {
          id: row.current_node_id,
          name: row.node_name ?? null,
          isSystem: row.node_is_system === true,
        }
      : null,
    updatedAt: row.updated_at,
  };
}

function normalizeNodeId(value) {
  const nodeId = String(value ?? "").trim();
  if (!nodeId) {
    return null;
  }
  if (!isUuid(nodeId)) {
    throw Object.assign(new Error("Некорректный UUID раздела"), { statusCode: 400 });
  }
  return nodeId;
}

export async function uiStateRoutes(app) {
  app.get("/ui/state", async () => {
    const state = await app.postgresProvider.getUiState();

    return {
      ok: true,
      state: mapUiState(state),
    };
  });

  app.post("/ui/state", async (request, reply) => {
    try {
      const body = request.body ?? {};
      const currentNodeId = normalizeNodeId(body.currentNodeId ?? body.nodeId);
      const includeChildren = parseBoolean(body.includeChildren, true);
      await app.postgresProvider.saveUiState({
        currentNodeId,
        includeChildren,
      });
      const state = await app.postgresProvider.getUiState();

      return {
        ok: true,
        state: mapUiState(state),
      };
    } catch (error) {
      reply.code(error.statusCode ?? (error.code === "NODE_NOT_FOUND" ? 404 : 500));
      return {
        ok: false,
        error: error.message,
      };
    }
  });
}
