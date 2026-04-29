import crypto from "node:crypto";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value) {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function normalizeOptionalUuid(value) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === "") {
    return null;
  }
  if (!isUuid(String(value))) {
    throw Object.assign(new Error("Некорректный UUID раздела"), { statusCode: 400 });
  }
  return String(value);
}

function normalizeNodePayload(body = {}, { partial = false } = {}) {
  const payload = {};

  if (Object.prototype.hasOwnProperty.call(body, "parentId")) {
    payload.parentId = normalizeOptionalUuid(body.parentId);
  } else if (Object.prototype.hasOwnProperty.call(body, "parent_id")) {
    payload.parentId = normalizeOptionalUuid(body.parent_id);
  }

  if (Object.prototype.hasOwnProperty.call(body, "name")) {
    const name = String(body.name ?? "").trim();
    if (!name) {
      throw Object.assign(new Error("Введите название раздела"), { statusCode: 400 });
    }
    payload.name = name;
  } else if (!partial) {
    throw Object.assign(new Error("Введите название раздела"), { statusCode: 400 });
  }

  if (Object.prototype.hasOwnProperty.call(body, "typeLabel")) {
    payload.typeLabel = String(body.typeLabel ?? "").trim() || null;
  } else if (Object.prototype.hasOwnProperty.call(body, "type_label")) {
    payload.typeLabel = String(body.type_label ?? "").trim() || null;
  }

  if (Object.prototype.hasOwnProperty.call(body, "color")) {
    payload.color = String(body.color ?? "").trim() || null;
  }

  if (Object.prototype.hasOwnProperty.call(body, "sortOrder")) {
    payload.sortOrder = Number(body.sortOrder);
  } else if (Object.prototype.hasOwnProperty.call(body, "sort_order")) {
    payload.sortOrder = Number(body.sort_order);
  }
  if (
    Object.prototype.hasOwnProperty.call(payload, "sortOrder") &&
    !Number.isInteger(payload.sortOrder)
  ) {
    throw Object.assign(new Error("sortOrder должен быть целым числом"), { statusCode: 400 });
  }

  if (Object.prototype.hasOwnProperty.call(body, "isActive")) {
    payload.isActive = parseBoolean(body.isActive, false);
  } else if (Object.prototype.hasOwnProperty.call(body, "is_active")) {
    payload.isActive = parseBoolean(body.is_active, false);
  }

  if (Object.prototype.hasOwnProperty.call(body, "description")) {
    payload.description = String(body.description ?? "").trim() || null;
  }

  return payload;
}

function mapNodeRow(row, counts = null) {
  return {
    id: row.id,
    parentId: row.parent_id,
    name: row.name,
    typeLabel: row.type_label,
    color: row.color,
    sortOrder: Number(row.sort_order ?? 0),
    isActive: row.is_active,
    isSystem: row.is_system,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    depth: row.depth === undefined ? undefined : Number(row.depth),
    counts: counts
      ? {
          directDocuments: Number(counts.direct_documents ?? 0),
          scopeDocuments: Number(counts.scope_documents ?? 0),
          scopePages: Number(counts.scope_pages ?? 0),
        }
      : undefined,
  };
}

function mapDocumentRow(row) {
  return {
    id: row.id,
    title: row.title,
    sourceType: row.source_type,
    originalFileName: row.original_file_name,
    originalFilePath: row.original_file_path,
    categories: row.categories,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    chunkCount: Number(row.chunk_count || 0),
    pageCount: Number(row.page_count || 0),
    nodeLinks: Array.isArray(row.node_links)
      ? row.node_links.map((link) => ({
          nodeId: link.node_id,
          name: link.name,
          typeLabel: link.type_label,
          color: link.color,
          isPrimary: link.is_primary === true,
          isSystem: link.is_system === true,
        }))
      : [],
  };
}

function buildTree(items) {
  const byId = new Map(items.map((item) => [item.id, { ...item, children: [] }]));
  const roots = [];

  for (const item of byId.values()) {
    if (item.parentId && byId.has(item.parentId)) {
      byId.get(item.parentId).children.push(item);
    } else {
      roots.push(item);
    }
  }

  return roots;
}

function buildEtag(payload) {
  const hash = crypto
    .createHash("sha1")
    .update(JSON.stringify(payload))
    .digest("base64url");
  return `"nodes-${hash}"`;
}

function nodeRowsCacheKey({ includeInactive }) {
  return includeInactive ? "includeInactive=true" : "includeInactive=false";
}

function readNodeRowsCache(cache, key) {
  const item = cache.get(key);
  if (!item) {
    return null;
  }
  cache.delete(key);
  cache.set(key, item);
  return item.rows;
}

function writeNodeRowsCache(cache, key, rows, maxEntries) {
  cache.set(key, {
    rows,
    cachedAt: new Date().toISOString(),
  });
  while (cache.size > Math.max(1, maxEntries)) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
}

function buildCountsMap(rows) {
  return new Map(rows.map((row) => [row.node_id, row]));
}

function normalizeLookupName(value) {
  return String(value ?? "").trim().toLowerCase();
}

function nodeLookupKey(parentId, name) {
  return `${parentId || "root"}::${normalizeLookupName(name)}`;
}

function buildNodeLookup(nodes) {
  const lookup = new Map();
  for (const node of nodes) {
    if (node.is_active === false) {
      continue;
    }
    lookup.set(nodeLookupKey(node.parent_id, node.name), node);
  }
  return lookup;
}

function extractImportItems(body) {
  const items = Array.isArray(body) ? body : body?.items;
  if (!Array.isArray(items)) {
    throw Object.assign(new Error("Передайте JSON экспорта с массивом items"), {
      statusCode: 400,
    });
  }
  return items;
}

function countImportNodes(items) {
  let count = 0;
  for (const item of items || []) {
    count += 1;
    if (Array.isArray(item?.children)) {
      count += countImportNodes(item.children);
    }
  }
  return count;
}

function normalizeImportNode(item) {
  if (!item || typeof item !== "object") {
    throw Object.assign(new Error("Каждый импортируемый раздел должен быть объектом"), {
      statusCode: 400,
    });
  }

  const name = String(item.name ?? "").trim();
  if (!name) {
    throw Object.assign(new Error("В импортируемом дереве есть раздел без названия"), {
      statusCode: 400,
    });
  }
  if (name.length > 160) {
    throw Object.assign(new Error("Название импортируемого раздела слишком длинное"), {
      statusCode: 400,
    });
  }

  const sortOrder = Number(item.sortOrder ?? item.sort_order ?? 0);
  if (!Number.isInteger(sortOrder)) {
    throw Object.assign(new Error("sortOrder импортируемого раздела должен быть целым числом"), {
      statusCode: 400,
    });
  }

  const color = String(item.color ?? "").trim();
  return {
    name,
    typeLabel: String(item.typeLabel ?? item.type_label ?? "").trim().slice(0, 100) || null,
    color: /^#[0-9a-f]{6}$/i.test(color) ? color : null,
    sortOrder,
    isActive: item.isActive !== false && item.is_active !== false,
    isSystem: item.isSystem === true || item.is_system === true,
    description: String(item.description ?? "").trim().slice(0, 2000) || null,
    children: Array.isArray(item.children) ? item.children : [],
  };
}

function mapSyncStatus(row) {
  if (!row) {
    return null;
  }

  return {
    lastReindexAt: row.last_reindex_at,
    lastScope: row.last_scope,
    lastTargetId: row.last_target_id,
    lastDocumentCount: Number(row.last_document_count ?? 0),
    lastPointCount: Number(row.last_point_count ?? 0),
    lastError: row.last_error,
    updatedAt: row.updated_at,
  };
}

async function reindexNodePayloadForDocumentIds(app, documentIds) {
  let updatedPoints = 0;
  let expectedPoints = 0;
  const uniqueDocumentIds = Array.from(new Set((documentIds || []).filter(Boolean)));

  for (const documentId of uniqueDocumentIds) {
    const payload = await app.postgresProvider.buildDocumentNodePayload(documentId);
    const pointIds = await app.postgresProvider.getDocumentPointIds(documentId);
    const qdrantPointCount = await app.qdrantProvider.countDocumentPoints(documentId);
    expectedPoints += pointIds.length;

    if (qdrantPointCount > 0) {
      await app.qdrantProvider.setDocumentPayload(documentId, payload);
      updatedPoints += qdrantPointCount;
    }
  }

  return {
    updatedDocuments: uniqueDocumentIds.length,
    expectedPoints,
    updatedPoints,
    missingPoints: Math.max(0, expectedPoints - updatedPoints),
  };
}

async function autoSyncNodePayload(app, documentIds, { scope, targetId, reason }) {
  const uniqueDocumentIds = Array.from(new Set((documentIds || []).filter(Boolean)));

  try {
    const reindex = await reindexNodePayloadForDocumentIds(app, uniqueDocumentIds);
    const status = await app.postgresProvider.recordNodeSyncStatus({
      scope,
      targetId,
      documentCount: reindex.updatedDocuments,
      pointCount: reindex.updatedPoints,
      errorMessage: null,
    });

    return {
      ok: true,
      reason,
      ...reindex,
      status: mapSyncStatus(status),
    };
  } catch (error) {
    const status = await app.postgresProvider.recordNodeSyncStatus({
      scope,
      targetId,
      documentCount: uniqueDocumentIds.length,
      pointCount: 0,
      errorMessage: error.message,
    });

    return {
      ok: false,
      reason,
      updatedDocuments: uniqueDocumentIds.length,
      expectedPoints: 0,
      updatedPoints: 0,
      missingPoints: 0,
      error: error.message,
      status: mapSyncStatus(status),
    };
  }
}

async function pointIdsForDocuments(app, documentIds) {
  const pointIds = [];
  for (const documentId of documentIds || []) {
    pointIds.push(...(await app.postgresProvider.getDocumentPointIds(documentId)));
  }
  return pointIds;
}

async function deleteNodeCascadeDocuments(app, nodeId, { confirm, confirmName } = {}) {
  if (confirm !== "DELETE_DOCUMENTS_AND_NODE") {
    throw Object.assign(
      new Error("Для cascade_documents передайте confirm=DELETE_DOCUMENTS_AND_NODE"),
      { statusCode: 400 }
    );
  }

  const node = await app.postgresProvider.getKnowledgeNodeById(nodeId);
  if (!node) {
    throw Object.assign(new Error("Раздел не найден"), { statusCode: 404 });
  }
  if (node.is_system) {
    throw Object.assign(new Error("Системный раздел нельзя удалить"), { statusCode: 403 });
  }
  if (String(confirmName || "").trim() !== node.name) {
    throw Object.assign(new Error("Для удаления введите точное название раздела"), {
      statusCode: 400,
    });
  }

  const descendants = await app.postgresProvider.listKnowledgeNodeDescendants(nodeId, {
    includeSelf: true,
  });
  const documentIds = await app.postgresProvider.listDocumentIdsForKnowledgeNode(nodeId, {
    includeChildren: true,
  });
  const pointIds = await pointIdsForDocuments(app, documentIds || []);

  await app.qdrantProvider.deletePoints(pointIds);
  await app.postgresProvider.deleteDocumentsByIds(documentIds || []);

  const sortedNodes = descendants
    .filter((item) => item.is_system !== true)
    .sort((a, b) => Number(b.depth || 0) - Number(a.depth || 0));

  for (const item of sortedNodes) {
    await app.postgresProvider.deleteKnowledgeNode(item.id, { strategy: "block" });
  }

  return {
    deleted: true,
    strategy: "cascade_documents",
    deletedDocuments: (documentIds || []).length,
    removedVectors: pointIds.length,
    deletedNodes: sortedNodes.length,
  };
}

function handleNodeError(reply, error) {
  const knownStatusCodes = {
    NODE_NOT_FOUND: 404,
    PARENT_NOT_FOUND: 400,
    NODE_CYCLE: 409,
    SYSTEM_NODE_LOCKED: 403,
    NODE_HAS_DESCENDANTS: 409,
    NODE_HAS_DOCUMENTS: 409,
    TARGET_NODE_NOT_FOUND: 400,
    UNSUPPORTED_DELETE_STRATEGY: 400,
  };

  if (error.statusCode) {
    reply.code(error.statusCode);
    return {
      ok: false,
      error: error.message,
    };
  }

  if (error.code === "23505") {
    reply.code(409);
    return {
      ok: false,
      error: "Раздел с таким названием уже есть на этом уровне",
    };
  }

  if (error.code === "23503") {
    reply.code(400);
    return {
      ok: false,
      error: "Родительский раздел не найден",
    };
  }

  if (error.code === "22P02") {
    reply.code(400);
    return {
      ok: false,
      error: "Некорректный UUID раздела",
    };
  }

  if (knownStatusCodes[error.code]) {
    reply.code(knownStatusCodes[error.code]);
    return {
      ok: false,
      error: error.message,
      details: error.details ?? undefined,
    };
  }

  throw error;
}

export async function nodeRoutes(app) {
  const nodeRowsCache = new Map();
  const clearNodeRowsCache = () => nodeRowsCache.clear();

  async function listCachedNodeRows(includeInactive) {
    const key = nodeRowsCacheKey({ includeInactive });
    const cached = readNodeRowsCache(nodeRowsCache, key);
    if (cached) {
      return cached;
    }

    const rows = await app.postgresProvider.listKnowledgeNodes({ includeInactive });
    writeNodeRowsCache(
      nodeRowsCache,
      key,
      rows,
      Number(app.config.knowledgeNodes.nodeTreeCacheMaxEntries || 8)
    );
    return rows;
  }

  app.get("/nodes", async (request, reply) => {
    const format = String(request.query?.format ?? "flat");
    const includeInactive = parseBoolean(request.query?.includeInactive, false);
    const [nodes, counts] = await Promise.all([
      listCachedNodeRows(includeInactive),
      app.postgresProvider.listKnowledgeNodeCounts(),
    ]);
    const countsMap = buildCountsMap(counts);
    const items = nodes.map((row) => mapNodeRow(row, countsMap.get(row.id)));
    const payload = {
      ok: true,
      format: format === "tree" ? "tree" : "flat",
      items: format === "tree" ? buildTree(items) : items,
    };
    const etag = buildEtag(payload);
    reply.header("ETag", etag);
    reply.header("Cache-Control", "private, max-age=15");

    if (request.headers["if-none-match"] === etag) {
      reply.code(304);
      return reply.send();
    }

    return payload;
  });

  app.get("/nodes/counts", async () => {
    const counts = await app.postgresProvider.listKnowledgeNodeCounts();
    const byNodeId = Object.fromEntries(
      counts.map((row) => [
        row.node_id,
        {
          directDocuments: Number(row.direct_documents ?? 0),
          scopeDocuments: Number(row.scope_documents ?? 0),
          scopePages: Number(row.scope_pages ?? 0),
        },
      ])
    );

    return {
      ok: true,
      items: counts,
      byNodeId,
    };
  });

  app.get("/nodes/export", async () => {
    const [nodes, counts] = await Promise.all([
      app.postgresProvider.listKnowledgeNodes({ includeInactive: true }),
      app.postgresProvider.listKnowledgeNodeCounts(),
    ]);
    const countsMap = buildCountsMap(counts);
    const items = nodes.map((row) => mapNodeRow(row, countsMap.get(row.id)));

    return {
      ok: true,
      exportedAt: new Date().toISOString(),
      items: buildTree(items),
    };
  });

  app.post("/nodes/import", async (request, reply) => {
    try {
      const dryRun = parseBoolean(request.query?.dryRun ?? request.body?.dryRun, false);
      const items = extractImportItems(request.body ?? {});
      const totalNodes = countImportNodes(items);
      if (totalNodes > 200) {
        reply.code(400);
        return {
          ok: false,
          error: "За один импорт безопасно загружать не больше 200 разделов",
        };
      }

      const existingNodes = await app.postgresProvider.listKnowledgeNodes({
        includeInactive: false,
      });
      const lookup = buildNodeLookup(existingNodes);
      const summary = {
        totalNodes,
        created: 0,
        existing: 0,
        skippedSystem: 0,
        skippedInactive: 0,
      };
      const createdNodes = [];
      let virtualId = 0;

      async function importChildren(children, parentId, pathParts) {
        for (const rawItem of children || []) {
          const item = normalizeImportNode(rawItem);
          if (item.isSystem) {
            summary.skippedSystem += 1 + countImportNodes(item.children);
            continue;
          }
          if (!item.isActive) {
            summary.skippedInactive += 1 + countImportNodes(item.children);
            continue;
          }

          const key = nodeLookupKey(parentId, item.name);
          const path = pathParts.concat(item.name);
          let node = lookup.get(key);
          let nextParentId = node?.id ?? null;

          if (node) {
            summary.existing += 1;
          } else {
            summary.created += 1;
            if (dryRun) {
              nextParentId = `dry-run-${virtualId++}`;
              node = {
                id: nextParentId,
                parent_id: parentId,
                name: item.name,
                type_label: item.typeLabel,
                color: item.color,
                sort_order: item.sortOrder,
                is_active: true,
                is_system: false,
                description: item.description,
              };
            } else {
              node = await app.postgresProvider.createKnowledgeNode({
                parentId,
                name: item.name,
                typeLabel: item.typeLabel,
                color: item.color,
                sortOrder: item.sortOrder,
                description: item.description,
              });
              nextParentId = node.id;
            }
            lookup.set(key, node);
            createdNodes.push({
              ...mapNodeRow(node),
              path: path.join(" / "),
            });
          }

          await importChildren(item.children, nextParentId, path);
        }
      }

      await importChildren(items, null, []);
      if (!dryRun) {
        clearNodeRowsCache();
      }

      return {
        ok: true,
        dryRun,
        summary,
        createdNodes,
      };
    } catch (error) {
      return handleNodeError(reply, error);
    }
  });

  app.post("/nodes", async (request, reply) => {
    try {
      const payload = normalizeNodePayload(request.body ?? {});
      const node = await app.postgresProvider.createKnowledgeNode(payload);
      clearNodeRowsCache();

      reply.code(201);
      return {
        ok: true,
        node: mapNodeRow(node),
      };
    } catch (error) {
      return handleNodeError(reply, error);
    }
  });

  app.get("/nodes/:id", async (request, reply) => {
    if (!isUuid(request.params.id)) {
      reply.code(400);
      return {
        ok: false,
        error: "Некорректный UUID раздела",
      };
    }

    const [node, counts] = await Promise.all([
      app.postgresProvider.getKnowledgeNodeById(request.params.id),
      app.postgresProvider.listKnowledgeNodeCounts(),
    ]);
    if (!node) {
      reply.code(404);
      return {
        ok: false,
        error: "Раздел не найден",
      };
    }

    const countsMap = buildCountsMap(counts);
    return {
      ok: true,
      node: mapNodeRow(node, countsMap.get(node.id)),
    };
  });

  app.patch("/nodes/:id", async (request, reply) => {
    try {
      if (!isUuid(request.params.id)) {
        reply.code(400);
        return {
          ok: false,
          error: "Некорректный UUID раздела",
        };
      }

      const existing = await app.postgresProvider.getKnowledgeNodeById(request.params.id);
      if (!existing) {
        reply.code(404);
        return {
          ok: false,
          error: "Раздел не найден",
        };
      }
      if (existing.is_system) {
        reply.code(403);
        return {
          ok: false,
          error: "Системный раздел нельзя изменять",
        };
      }

      const payload = normalizeNodePayload(request.body ?? {}, { partial: true });
      const documentIds = await app.postgresProvider.listDocumentIdsForKnowledgeNode(existing.id, {
        includeChildren: true,
      });
      const node = await app.postgresProvider.updateKnowledgeNode(existing.id, payload);
      clearNodeRowsCache();
      const sync = await autoSyncNodePayload(app, documentIds || [], {
        scope: "node",
        targetId: node.id,
        reason: "node-updated",
      });

      return {
        ok: true,
        node: mapNodeRow(node),
        sync,
      };
    } catch (error) {
      return handleNodeError(reply, error);
    }
  });

  app.post("/nodes/:id/move", async (request, reply) => {
    try {
      if (!isUuid(request.params.id)) {
        reply.code(400);
        return {
          ok: false,
          error: "Некорректный UUID раздела",
        };
      }

      const hasNewParentId = Object.prototype.hasOwnProperty.call(
        request.body ?? {},
        "newParentId"
      );
      const hasNewParentIdSnake = Object.prototype.hasOwnProperty.call(
        request.body ?? {},
        "new_parent_id"
      );
      if (!hasNewParentId && !hasNewParentIdSnake) {
        reply.code(400);
        return {
          ok: false,
          error: "Передайте newParentId или null для перемещения в корень",
        };
      }

      const rawParentId = hasNewParentId ? request.body.newParentId : request.body.new_parent_id;
      const newParentId = normalizeOptionalUuid(rawParentId);
      const documentIds = await app.postgresProvider.listDocumentIdsForKnowledgeNode(
        request.params.id,
        { includeChildren: true }
      );
      const node = await app.postgresProvider.moveKnowledgeNode(request.params.id, newParentId);
      clearNodeRowsCache();
      const sync = await autoSyncNodePayload(app, documentIds || [], {
        scope: "node",
        targetId: node.id,
        reason: "node-moved",
      });

      return {
        ok: true,
        node: mapNodeRow(node),
        sync,
      };
    } catch (error) {
      return handleNodeError(reply, error);
    }
  });

  app.delete("/nodes/:id", async (request, reply) => {
    try {
      if (!isUuid(request.params.id)) {
        reply.code(400);
        return {
          ok: false,
          error: "Некорректный UUID раздела",
        };
      }

      const strategy = String(request.query?.strategy ?? "block");
      if (strategy === "cascade_documents") {
        const result = await deleteNodeCascadeDocuments(app, request.params.id, {
          confirm: request.body?.confirm ?? request.query?.confirm,
          confirmName: request.body?.confirmName ?? request.query?.confirmName,
        });
        clearNodeRowsCache();
        return {
          ok: true,
          ...result,
        };
      }

      const documentIds = await app.postgresProvider.listDocumentIdsForKnowledgeNode(
        request.params.id,
        { includeChildren: true }
      );
      const result = await app.postgresProvider.deleteKnowledgeNode(request.params.id, {
        strategy,
      });
      clearNodeRowsCache();
      const sync = await autoSyncNodePayload(app, documentIds || [], {
        scope: "node",
        targetId: request.params.id,
        reason: "node-deleted",
      });

      return {
        ok: true,
        ...result,
        sync,
      };
    } catch (error) {
      return handleNodeError(reply, error);
    }
  });

  app.get("/nodes/:id/descendants", async (request, reply) => {
    if (!isUuid(request.params.id)) {
      reply.code(400);
      return {
        ok: false,
        error: "Некорректный UUID раздела",
      };
    }

    const node = await app.postgresProvider.getKnowledgeNodeById(request.params.id);
    if (!node) {
      reply.code(404);
      return {
        ok: false,
        error: "Раздел не найден",
      };
    }

    const includeSelf = parseBoolean(request.query?.includeSelf, false);
    const items = await app.postgresProvider.listKnowledgeNodeDescendants(node.id, {
      includeSelf,
    });

    return {
      ok: true,
      node: mapNodeRow(node),
      includeSelf,
      items: items.map((row) => mapNodeRow(row)),
    };
  });

  app.get("/nodes/:id/ancestors", async (request, reply) => {
    if (!isUuid(request.params.id)) {
      reply.code(400);
      return {
        ok: false,
        error: "Некорректный UUID раздела",
      };
    }

    const node = await app.postgresProvider.getKnowledgeNodeById(request.params.id);
    if (!node) {
      reply.code(404);
      return {
        ok: false,
        error: "Раздел не найден",
      };
    }

    const includeSelf = parseBoolean(request.query?.includeSelf, false);
    const items = await app.postgresProvider.listKnowledgeNodeAncestors(node.id, {
      includeSelf,
    });

    return {
      ok: true,
      node: mapNodeRow(node),
      includeSelf,
      items: items.map((row) => mapNodeRow(row)),
    };
  });

  app.get("/nodes/:id/documents", async (request, reply) => {
    if (!isUuid(request.params.id)) {
      reply.code(400);
      return {
        ok: false,
        error: "Некорректный UUID раздела",
      };
    }

    const includeChildren = parseBoolean(request.query?.includeChildren, true);
    const documents = await app.postgresProvider.listDocumentsForKnowledgeNode(request.params.id, {
      includeChildren,
      limit: request.query?.limit,
    });
    if (!documents) {
      reply.code(404);
      return {
        ok: false,
        error: "Раздел не найден",
      };
    }

    return {
      ok: true,
      includeChildren,
      items: documents.map((row) => mapDocumentRow(row)),
    };
  });

  app.get("/nodes/:id/delete-info", async (request, reply) => {
    if (!isUuid(request.params.id)) {
      reply.code(400);
      return {
        ok: false,
        error: "Некорректный UUID раздела",
      };
    }

    const info = await app.postgresProvider.getKnowledgeNodeDeleteInfo(request.params.id);
    if (!info) {
      reply.code(404);
      return {
        ok: false,
        error: "Раздел не найден",
      };
    }

    return {
      ok: true,
      node: {
        id: info.id,
        parentId: info.parent_id,
        name: info.name,
        isSystem: info.is_system,
      },
      descendantCount: Number(info.descendant_count ?? 0),
      directDocuments: Number(info.direct_documents ?? 0),
      scopeDocuments: Number(info.scope_documents ?? 0),
      scopePages: Number(info.scope_pages ?? 0),
    };
  });
}
