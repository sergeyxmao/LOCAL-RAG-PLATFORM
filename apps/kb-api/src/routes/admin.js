import fs from "node:fs/promises";
import path from "node:path";

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

function runDetached(task) {
  setTimeout(() => {
    task().catch((error) => {
      console.error("[detached-admin-route]", error);
    });
  }, 0);
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

const REQUIRED_QDRANT_PAYLOAD_INDEXES = [
  "asset_class",
  "categories",
  "document_id",
  "engineering_topics",
  "node_ids",
  "node_paths",
  "node_scope_ids",
  "payload_version",
  "primary_node_id",
  "resource_type",
  "signal_tags",
];

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function readinessCheck(id, label, ok, details, level = "ok") {
  return {
    id,
    label,
    ok: ok === true,
    level: ok === true ? "ok" : level,
    details,
  };
}

function buildKnowledgeNodesStatus({ stats, qdrant, postgresIndexed, syncStatus, config }) {
  const indexedTotal = numberValue(postgresIndexed?.totalCount);
  const qdrantPointCount = numberValue(qdrant?.pointsCount);
  const payloadIndexedFields = Array.isArray(qdrant?.payloadIndexedFields)
    ? qdrant.payloadIndexedFields
    : [];
  const payloadFieldSet = new Set(payloadIndexedFields);
  const missingPayloadIndexes = REQUIRED_QDRANT_PAYLOAD_INDEXES.filter(
    (field) => !payloadFieldSet.has(field)
  );
  const sync = mapSyncStatus(syncStatus);

  const checks = [
    readinessCheck(
      "system-unsorted-node",
      "Системный раздел Без раздела",
      numberValue(stats.active_unsorted_count) === 1,
      `активных системных разделов: ${numberValue(stats.active_unsorted_count)}`,
      "bad"
    ),
    readinessCheck(
      "nodes-present",
      "Дерево разделов создано",
      numberValue(stats.active_node_count) > 0,
      `активных разделов: ${numberValue(stats.active_node_count)}`,
      "bad"
    ),
    readinessCheck(
      "closure-self-refs",
      "Closure-таблица согласована",
      numberValue(stats.closure_missing_self_count) === 0 &&
        numberValue(stats.closure_self_count) >= numberValue(stats.node_count),
      `узлов: ${numberValue(stats.node_count)}, self-ссылок: ${numberValue(
        stats.closure_self_count
      )}, пропущено: ${numberValue(stats.closure_missing_self_count)}`,
      "bad"
    ),
    readinessCheck(
      "node-counters-cache",
      "Кэш счётчиков разделов обновлён",
      numberValue(stats.node_counters_missing_rows) === 0 &&
        numberValue(stats.node_counters_rows) >= numberValue(stats.node_count),
      `строк: ${numberValue(stats.node_counters_rows)}, без кэша: ${numberValue(
        stats.node_counters_missing_rows
      )}`,
      "warn"
    ),
    readinessCheck(
      "primary-links",
      "Primary-разделы документов корректны",
      numberValue(stats.linked_documents_without_primary) === 0 &&
        numberValue(stats.documents_with_multiple_primary) === 0,
      `без primary: ${numberValue(
        stats.linked_documents_without_primary
      )}, несколько primary: ${numberValue(stats.documents_with_multiple_primary)}`,
      "bad"
    ),
    readinessCheck(
      "qdrant-green",
      "Qdrant доступен",
      qdrant?.ok === true && qdrant?.exists === true && qdrant?.status === "green",
      qdrant?.ok === false
        ? qdrant.error || "Qdrant не отвечает"
        : `status: ${qdrant?.status || "unknown"}`,
      "bad"
    ),
    readinessCheck(
      "qdrant-counts",
      "Qdrant совпадает с indexed PostgreSQL",
      qdrant?.ok === true && qdrantPointCount === indexedTotal,
      `Qdrant: ${qdrantPointCount}, PostgreSQL indexed: ${indexedTotal}`,
      "warn"
    ),
    readinessCheck(
      "qdrant-payload-indexes",
      "Payload indexes Qdrant созданы",
      missingPayloadIndexes.length === 0,
      missingPayloadIndexes.length
        ? `не хватает: ${missingPayloadIndexes.join(", ")}`
        : `полей: ${payloadIndexedFields.length}`,
      "warn"
    ),
    readinessCheck(
      "ui-state",
      "Состояние UI сохраняется",
      numberValue(stats.ui_state_rows) > 0,
      `строк ui_state: ${numberValue(stats.ui_state_rows)}`,
      "warn"
    ),
    readinessCheck(
      "no-active-jobs",
      "Нет активных фоновых задач",
      numberValue(stats.active_jobs_count) === 0,
      `активных задач: ${numberValue(stats.active_jobs_count)}`,
      "warn"
    ),
    readinessCheck(
      "sync-error-empty",
      "Последняя синхронизация без ошибки",
      !sync?.lastError,
      sync?.lastError || "ошибок нет",
      "warn"
    ),
    readinessCheck(
      "node-tree-cache-etag",
      "Дерево разделов отдаётся с ETag",
      numberValue(config?.nodeTreeCacheMaxEntries) > 0,
      `размер кэша дерева: ${numberValue(config?.nodeTreeCacheMaxEntries)}`,
      "warn"
    ),
    readinessCheck(
      "local-open-helper-contract",
      "Локальное открытие файлов отдаёт helper-контракт",
      Boolean(config?.localOpenHelperUrl) && Boolean(config?.localOpenTokenTtlSeconds),
      `helper: ${config?.localOpenHelperUrl || "не задан"}`,
      "warn"
    ),
    readinessCheck(
      "import-node-guard-config",
      "Контроль раздела при импорте настроен",
      config?.requireNodeIdsForImport === true || config?.requireNodeIdsForImport === false,
      config?.requireNodeIdsForImport
        ? "production guard включён"
        : "dev-режим: импорт без раздела уходит в Без раздела",
      "warn"
    ),
    readinessCheck(
      "background-reconciliation",
      "Фоновая сверка payload включена",
      numberValue(config?.reconciliationIntervalMs) > 0,
      `интервал: ${numberValue(config?.reconciliationIntervalMs)} мс, sample: ${numberValue(
        config?.reconciliationSampleLimit
      )}`,
      "warn"
    ),
  ];

  const passed = checks.filter((check) => check.ok).length;
  const progressPercent = Math.round((passed / checks.length) * 100);
  const blockingFailed = checks.some((check) => !check.ok && check.level === "bad");
  const status = blockingFailed ? "problem" : progressPercent === 100 ? "ready" : "attention";

  return {
    status,
    progressPercent,
    passed,
    total: checks.length,
    checks,
    stats: {
      nodeCount: numberValue(stats.node_count),
      activeNodeCount: numberValue(stats.active_node_count),
      totalDocuments: numberValue(stats.total_documents),
      linkedDocuments: numberValue(stats.linked_documents),
      unlinkedDocuments: numberValue(stats.unlinked_documents),
      activeJobs: numberValue(stats.active_jobs_count),
      nodeCountersRows: numberValue(stats.node_counters_rows),
      nodeCountersMissingRows: numberValue(stats.node_counters_missing_rows),
    },
    qdrant: {
      ok: qdrant?.ok === true,
      exists: qdrant?.exists === true,
      status: qdrant?.status ?? null,
      pointsCount: qdrantPointCount,
      payloadIndexedFields,
      missingPayloadIndexes,
    },
    postgresIndexed,
    sync,
    config: {
      requireNodeIdsForImport: config?.requireNodeIdsForImport === true,
      nodeTreeCacheMaxEntries: numberValue(config?.nodeTreeCacheMaxEntries),
      reconciliationIntervalMs: numberValue(config?.reconciliationIntervalMs),
      reconciliationSampleLimit: numberValue(config?.reconciliationSampleLimit),
      localOpenHelperUrl: config?.localOpenHelperUrl || null,
    },
  };
}

function parsePositiveInt(value, defaultValue, { min = 1, max = 500 } = {}) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return defaultValue;
  }

  return Math.max(min, Math.min(max, Math.trunc(parsed)));
}

function parseDocumentStatus(value, defaultValue = "indexed") {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["all", "any", "*"].includes(normalized)) {
    return null;
  }

  const allowed = new Set(["indexed", "pending", "processing", "failed", "cancelled"]);
  if (!allowed.has(normalized)) {
    throw Object.assign(
      new Error("documentStatus должен быть indexed, pending, processing, failed, cancelled или all"),
      { statusCode: 400 }
    );
  }

  return normalized;
}

function parseUuidArray(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  const rawValues = Array.isArray(value) ? value : String(value).split(",");
  const ids = Array.from(
    new Set(rawValues.map((item) => String(item ?? "").trim()).filter(Boolean))
  );
  const invalidId = ids.find((id) => !isUuid(id));

  if (invalidId) {
    throw Object.assign(new Error(`${fieldName}: некорректный UUID ${invalidId}`), {
      statusCode: 400,
    });
  }

  return ids;
}

function parseReindexOptions(request) {
  const body = request.body ?? {};
  const query = request.query ?? {};
  const scope = String(body.scope ?? query.scope ?? "all").trim().toLowerCase();
  const id = String(body.id ?? query.id ?? "").trim() || null;
  const includeChildren = parseBoolean(body.includeChildren ?? query.includeChildren, true);

  if (!["all", "document", "node"].includes(scope)) {
    return {
      error: "scope должен быть all, document или node",
      statusCode: 400,
    };
  }

  if (scope !== "all" && !isUuid(id)) {
    return {
      error: "Для scope=document или scope=node нужен корректный UUID в поле id",
      statusCode: 400,
    };
  }

  return {
    scope,
    id,
    includeChildren,
  };
}

function parseRebuildOptions(request) {
  const body = request.body ?? {};
  const query = request.query ?? {};
  let documentIds = [];
  try {
    documentIds = parseUuidArray(body.documentIds ?? query.documentIds, "documentIds");
  } catch (error) {
    return {
      error: error.message,
      statusCode: error.statusCode ?? 400,
    };
  }

  const documentId = String(body.documentId ?? query.documentId ?? "").trim();
  if (documentId) {
    if (!isUuid(documentId)) {
      return {
        error: "documentId должен быть UUID",
        statusCode: 400,
      };
    }
    documentIds.push(documentId);
  }

  const includeChunks = parseBoolean(body.includeChunks ?? query.includeChunks, true);
  const includeAssets = parseBoolean(body.includeAssets ?? query.includeAssets, true);
  if (!includeChunks && !includeAssets) {
    return {
      error: "Нужно включить хотя бы includeChunks или includeAssets",
      statusCode: 400,
    };
  }

  const dryRun = parseBoolean(body.dryRun ?? query.dryRun, true);
  const confirm = String(body.confirm ?? query.confirm ?? "").trim();
  if (!dryRun && confirm !== "REBUILD_QDRANT") {
    return {
      error: "Для запуска пересборки передайте dryRun=false и confirm=REBUILD_QDRANT",
      statusCode: 400,
    };
  }

  let documentStatus = "indexed";
  try {
    documentStatus = parseDocumentStatus(body.documentStatus ?? query.documentStatus, "indexed");
  } catch (error) {
    return {
      error: error.message,
      statusCode: error.statusCode ?? 400,
    };
  }

  return {
    dryRun,
    resetCollection: parseBoolean(body.resetCollection ?? query.resetCollection, false),
    includeChunks,
    includeAssets,
    documentIds: Array.from(new Set(documentIds)),
    documentStatus,
    batchSize: parsePositiveInt(body.batchSize ?? query.batchSize, 25, { min: 1, max: 250 }),
  };
}

function parseResetOptions(request) {
  const body = request.body ?? {};
  const query = request.query ?? {};
  const confirm = String(body.confirm ?? query.confirm ?? "").trim();

  if (confirm !== "RESET_LOCAL_RAG_CONTENT") {
    return {
      error: "Для очистки базы передайте confirm=RESET_LOCAL_RAG_CONTENT",
      statusCode: 400,
    };
  }

  return {
    force: parseBoolean(body.force ?? query.force, false),
    resetUserNodes: parseBoolean(body.resetUserNodes ?? query.resetUserNodes, true),
    deleteRawFiles: parseBoolean(body.deleteRawFiles ?? query.deleteRawFiles, true),
    deleteParsedFiles: parseBoolean(body.deleteParsedFiles ?? query.deleteParsedFiles, true),
    deleteAssetFiles: parseBoolean(body.deleteAssetFiles ?? query.deleteAssetFiles, true),
  };
}

function isInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function emptyDirectoryContents(targetDir, { dataRoot }) {
  const root = path.resolve(dataRoot);
  const target = path.resolve(targetDir);
  if (target === root || !isInside(root, target)) {
    throw new Error(`Небезопасный путь очистки: ${targetDir}`);
  }

  await fs.mkdir(target, { recursive: true });
  const entries = await fs.readdir(target, { withFileTypes: true });
  let removed = 0;

  for (const entry of entries) {
    await fs.rm(path.join(target, entry.name), {
      recursive: true,
      force: true,
    });
    removed += 1;
  }

  return {
    path: target,
    removed,
  };
}

async function resolveDocumentIds(app, { scope, id, includeChildren }) {
  if (scope === "all") {
    return app.postgresProvider.listAllDocumentIds();
  }

  if (scope === "document") {
    const document = await app.postgresProvider.getDocumentById(id);
    return document ? [document.id] : null;
  }

  return app.postgresProvider.listDocumentIdsForKnowledgeNode(id, { includeChildren });
}

async function reindexNodePayload(app, documentIds) {
  let updatedPoints = 0;
  let expectedPoints = 0;

  for (const documentId of documentIds) {
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
    expectedPoints,
    updatedPoints,
    missingPoints: Math.max(0, expectedPoints - updatedPoints),
  };
}

async function runNodeReconciliationSample(app, { limit, scope = "background-sample" } = {}) {
  const documentIds = await app.postgresProvider.listReconciliationDocumentIds({
    limit: limit || app.config.knowledgeNodes.reconciliationSampleLimit,
  });
  const reindex = await reindexNodePayload(app, documentIds);
  const status = await app.postgresProvider.recordNodeSyncStatus({
    scope,
    targetId: null,
    documentCount: documentIds.length,
    pointCount: reindex.updatedPoints,
    errorMessage: null,
  });

  return {
    ok: true,
    scope,
    checkedDocuments: documentIds.length,
    expectedPoints: reindex.expectedPoints,
    updatedPoints: reindex.updatedPoints,
    missingPoints: reindex.missingPoints,
    status: mapSyncStatus(status),
  };
}

function normalizeJsonArray(value) {
  return Array.isArray(value) ? value : [];
}

function buildRebuildPayload(record, nodePayload) {
  const common = {
    document_id: record.document_id,
    title: record.title,
    text: record.text ?? "",
    context: record.context ?? "",
    text_with_context: record.text_with_context ?? "",
    categories: normalizeJsonArray(record.categories),
    source_path: record.source_path,
    source_url: record.source_url,
    file_url: record.file_url,
    ...nodePayload,
  };

  if (record.resource_type === "asset") {
    return {
      ...common,
      asset_id: record.asset_id,
      resource_type: "asset",
      asset_type: record.asset_type,
      page_number: record.page_number,
      chunk_index: record.chunk_index,
      asset_class: record.asset_class,
      asset_confidence: record.asset_confidence,
      engineering_topics: normalizeJsonArray(record.engineering_topics),
      signal_tags: normalizeJsonArray(record.signal_tags),
      file_name: record.file_name,
      relative_path: record.relative_path,
      mime_type: record.mime_type,
    };
  }

  return {
    ...common,
    chunk_id: record.chunk_id,
    chunk_index: record.chunk_index,
    resource_type: "chunk",
  };
}

async function runQdrantRebuild(app, job, options, counts) {
  let processedItems = 0;
  let collectionPrepared = false;
  const nodePayloadCache = new Map();

  const getNodePayload = async (documentId) => {
    if (!nodePayloadCache.has(documentId)) {
      nodePayloadCache.set(documentId, await app.postgresProvider.buildDocumentNodePayload(documentId));
    }
    return nodePayloadCache.get(documentId);
  };

  try {
    await app.postgresProvider.updateJobProgress(job.id, {
      processedItems: 0,
      totalItems: counts.totalCount,
      progressMessage: "Подготовка пересборки Qdrant",
    });

    for (let offset = 0; offset < counts.totalCount; offset += options.batchSize) {
      await app.ingestionService.ensureJobActive(job.id);

      const records = await app.postgresProvider.listQdrantRebuildRecords({
        documentIds: options.documentIds,
        includeChunks: options.includeChunks,
        includeAssets: options.includeAssets,
        documentStatus: options.documentStatus,
        limit: options.batchSize,
        offset,
      });

      if (records.length === 0) {
        break;
      }

      await app.postgresProvider.updateJobProgress(job.id, {
        processedItems,
        totalItems: counts.totalCount,
        progressMessage: `Считаю embeddings: ${processedItems + 1}-${processedItems + records.length}/${counts.totalCount}`,
      });
      const vectors = await app.embeddingProvider.embed(records.map((record) => record.embed_text));
      if (!collectionPrepared) {
        if (options.resetCollection) {
          await app.qdrantProvider.recreateCollection(vectors[0].length);
        } else {
          await app.qdrantProvider.ensureCollection(vectors[0].length);
        }
        collectionPrepared = true;
      }

      const points = [];
      for (let index = 0; index < records.length; index += 1) {
        const record = records[index];
        const nodePayload = await getNodePayload(record.document_id);
        points.push({
          id: record.point_id,
          vector: vectors[index],
          payload: buildRebuildPayload(record, nodePayload),
        });
      }

      await app.qdrantProvider.upsertChunks(points);
      processedItems += records.length;

      await app.ingestionService.ensureJobActive(job.id);
      await app.postgresProvider.updateJobProgress(job.id, {
        processedItems,
        totalItems: counts.totalCount,
        progressMessage: `Пересборка Qdrant: ${processedItems}/${counts.totalCount}`,
      });
    }

    await app.postgresProvider.recordNodeSyncStatus({
      scope: "qdrant-rebuild",
      targetId: options.documentIds.length === 1 ? options.documentIds[0] : null,
      documentCount: options.documentIds.length,
      pointCount: processedItems,
      errorMessage: null,
    });
    await app.postgresProvider.updateJobStatus(job.id, "completed");
  } catch (error) {
    const isCancelled = error?.name === "JobCancelledError";
    await app.postgresProvider.recordNodeSyncStatus({
      scope: "qdrant-rebuild",
      targetId: options.documentIds.length === 1 ? options.documentIds[0] : null,
      documentCount: options.documentIds.length,
      pointCount: processedItems,
      errorMessage: error.message,
    });
    await app.postgresProvider.updateJobStatus(
      job.id,
      isCancelled ? "cancelled" : "failed",
      error.message
    );
  }
}

export async function adminRoutes(app) {
  const reconciliationIntervalMs = Number(app.config.knowledgeNodes.reconciliationIntervalMs || 0);
  if (reconciliationIntervalMs > 0) {
    const timer = setInterval(() => {
      runNodeReconciliationSample(app, {
        limit: app.config.knowledgeNodes.reconciliationSampleLimit,
      }).catch((error) => {
        app.log.warn({ error }, "background knowledge node reconciliation failed");
      });
    }, reconciliationIntervalMs);
    if (typeof timer.unref === "function") {
      timer.unref();
    }
    app.addHook("onClose", async () => {
      clearInterval(timer);
    });
  }

  app.get("/admin/qdrant-status", async () => {
    const [postgresCounts, indexedPostgresCounts] = await Promise.all([
      app.postgresProvider.countQdrantRebuildRecords({ documentStatus: null }),
      app.postgresProvider.countQdrantRebuildRecords({ documentStatus: "indexed" }),
    ]);
    let qdrant = null;

    try {
      qdrant = {
        ok: true,
        ...(await app.qdrantProvider.getCollectionStatus()),
      };
    } catch (error) {
      qdrant = {
        ok: false,
        error: error.message,
      };
    }

    return {
      ok: true,
      collection: app.config.qdrantCollection,
      qdrant,
      postgres: postgresCounts,
      postgresIndexed: indexedPostgresCounts,
    };
  });

  app.get("/admin/knowledge-nodes-status", async () => {
    await app.postgresProvider.refreshNodeCounters();
    const [stats, indexedPostgresCounts, syncStatus] = await Promise.all([
      app.postgresProvider.getKnowledgeNodeReadinessStats(),
      app.postgresProvider.countQdrantRebuildRecords({ documentStatus: "indexed" }),
      app.postgresProvider.getNodeSyncStatus(),
    ]);
    let qdrant = null;

    try {
      qdrant = {
        ok: true,
        ...(await app.qdrantProvider.getCollectionStatus()),
      };
    } catch (error) {
      qdrant = {
        ok: false,
        error: error.message,
      };
    }

    return {
      ok: true,
      updatedAt: new Date().toISOString(),
      ...buildKnowledgeNodesStatus({
        stats,
        qdrant,
        postgresIndexed: indexedPostgresCounts,
        syncStatus,
        config: {
          requireNodeIdsForImport: app.config.knowledgeNodes.requireNodeIdsForImport,
          nodeTreeCacheMaxEntries: app.config.knowledgeNodes.nodeTreeCacheMaxEntries,
          reconciliationIntervalMs: app.config.knowledgeNodes.reconciliationIntervalMs,
          reconciliationSampleLimit: app.config.knowledgeNodes.reconciliationSampleLimit,
          localOpenHelperUrl: app.config.localOpen.helperUrl,
          localOpenTokenTtlSeconds: app.config.localOpen.tokenTtlSeconds,
        },
      }),
    };
  });

  app.get("/admin/sync-status", async () => {
    const status = await app.postgresProvider.getNodeSyncStatus();

    return {
      ok: true,
      status: mapSyncStatus(status),
    };
  });

  app.post("/admin/reconcile-nodes-sample", async (request, reply) => {
    const limit = parsePositiveInt(
      request.body?.limit ?? request.query?.limit,
      app.config.knowledgeNodes.reconciliationSampleLimit,
      { min: 1, max: 200 }
    );

    try {
      return await runNodeReconciliationSample(app, {
        limit,
        scope: "manual-sample",
      });
    } catch (error) {
      const status = await app.postgresProvider.recordNodeSyncStatus({
        scope: "manual-sample",
        targetId: null,
        documentCount: 0,
        pointCount: 0,
        errorMessage: error.message,
      });
      reply.code(500);
      return {
        ok: false,
        error: "Не удалось выполнить выборочную сверку payload",
        details: error.message,
        status: mapSyncStatus(status),
      };
    }
  });

  app.post("/admin/reindex-nodes", async (request, reply) => {
    const options = parseReindexOptions(request);
    if (options.error) {
      reply.code(options.statusCode);
      return {
        ok: false,
        error: options.error,
      };
    }

    const documentIds = await resolveDocumentIds(app, options);
    if (!documentIds) {
      reply.code(404);
      return {
        ok: false,
        error: options.scope === "document" ? "Документ не найден" : "Раздел не найден",
      };
    }

    try {
      const reindex = await reindexNodePayload(app, documentIds);
      const status = await app.postgresProvider.recordNodeSyncStatus({
        scope: options.scope,
        targetId: options.id,
        documentCount: documentIds.length,
        pointCount: reindex.updatedPoints,
        errorMessage: null,
      });

      return {
        ok: true,
        scope: options.scope,
        targetId: options.id,
        includeChildren: options.includeChildren,
        updatedDocuments: documentIds.length,
        expectedPoints: reindex.expectedPoints,
        updatedPoints: reindex.updatedPoints,
        missingPoints: reindex.missingPoints,
        status: mapSyncStatus(status),
      };
    } catch (error) {
      const status = await app.postgresProvider.recordNodeSyncStatus({
        scope: options.scope,
        targetId: options.id,
        documentCount: documentIds.length,
        pointCount: 0,
        errorMessage: error.message,
      });

      reply.code(500);
      return {
        ok: false,
        error: "Не удалось обновить payload разделов в Qdrant",
        details: error.message,
        status: mapSyncStatus(status),
      };
    }
  });

  app.post("/admin/rebuild-qdrant", async (request, reply) => {
    const options = parseRebuildOptions(request);
    if (options.error) {
      reply.code(options.statusCode);
      return {
        ok: false,
        error: options.error,
      };
    }

    const counts = await app.postgresProvider.countQdrantRebuildRecords(options);
    if (options.dryRun) {
      return {
        ok: true,
        dryRun: true,
        collection: app.config.qdrantCollection,
        options: {
          resetCollection: options.resetCollection,
          includeChunks: options.includeChunks,
          includeAssets: options.includeAssets,
          documentIds: options.documentIds,
          documentStatus: options.documentStatus || "all",
          batchSize: options.batchSize,
        },
        counts,
        message:
          "Dry-run выполнен. Для запуска передайте dryRun=false и confirm=REBUILD_QDRANT.",
      };
    }

    if (counts.totalCount === 0) {
      return {
        ok: true,
        queued: false,
        counts,
        message: "В PostgreSQL нет chunk/page records для пересборки Qdrant.",
      };
    }

    const job = await app.postgresProvider.createJob({
      documentId: options.documentIds.length === 1 ? options.documentIds[0] : null,
      jobType: "rebuild-qdrant",
      status: "running",
      totalItems: counts.totalCount,
      processedItems: 0,
      progressMessage: "Пересборка Qdrant поставлена в очередь",
      startedAt: new Date(),
    });

    runDetached(() => runQdrantRebuild(app, job, options, counts));
    reply.code(202);
    return {
      ok: true,
      queued: true,
      jobId: job.id,
      counts,
      message: "Пересборка Qdrant запущена в фоне. Статус смотрите на /ui/jobs.",
    };
  });

  app.post("/admin/reset-content", async (request, reply) => {
    const options = parseResetOptions(request);
    if (options.error) {
      reply.code(options.statusCode);
      return {
        ok: false,
        error: options.error,
      };
    }

    try {
      const db = await app.postgresProvider.resetRagContent({
        force: options.force,
        resetUserNodes: options.resetUserNodes,
      });
      const qdrant = await app.qdrantProvider.clearCollection();
      const files = {};

      if (options.deleteRawFiles) {
        files.raw = await emptyDirectoryContents(app.config.rawRoot, {
          dataRoot: app.config.dataRoot,
        });
      }
      if (options.deleteParsedFiles) {
        files.parsed = await emptyDirectoryContents(app.config.parsedRoot, {
          dataRoot: app.config.dataRoot,
        });
      }
      if (options.deleteAssetFiles) {
        files.assets = await emptyDirectoryContents(app.config.assetRoot, {
          dataRoot: app.config.dataRoot,
        });
      }

      return {
        ok: true,
        message: "Локальная база очищена. Схема, настройки и системный раздел сохранены.",
        db,
        qdrant,
        files,
      };
    } catch (error) {
      reply.code(error.code === "ACTIVE_JOBS_PRESENT" ? 409 : 500);
      return {
        ok: false,
        error: error.message,
        code: error.code,
        details: error.details,
      };
    }
  });
}
