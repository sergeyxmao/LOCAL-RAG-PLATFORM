import { createReadStream } from "node:fs";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { analyzePdfPageAsset } from "../services/pageClassifierService.js";
import { parseTagList } from "../utils/tags.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value) {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  return ["1", "true", "yes", "on", "да"].includes(String(value).toLowerCase());
}

function parsePositiveInt(value, fallback, { min = 1, max = 100 } = {}) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.trunc(parsed)));
}

function parseOcrMode(value) {
  const normalized = String(value ?? "off").trim().toLowerCase();
  return ["off", "try", "require"].includes(normalized) ? normalized : "off";
}

function parsePageSelection(value, totalPages, { maxPages = 20 } = {}) {
  const safeTotal = Math.max(0, Number(totalPages || 0));
  const safeMax = Math.max(1, Math.min(100, Number(maxPages || 20)));
  const addPage = (set, page) => {
    if (Number.isInteger(page) && page >= 1 && (safeTotal === 0 || page <= safeTotal)) {
      set.add(page);
    }
  };

  if (Array.isArray(value)) {
    const set = new Set();
    value.forEach((item) => addPage(set, Number(item)));
    return Array.from(set).sort((a, b) => a - b).slice(0, safeMax);
  }

  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) {
    return Array.from({ length: Math.min(safeTotal || 5, Math.min(5, safeMax)) }, (_, index) => index + 1);
  }
  if (["all", "все", "*"].includes(raw)) {
    return Array.from({ length: Math.min(safeTotal, safeMax) }, (_, index) => index + 1);
  }

  const set = new Set();
  for (const part of raw.split(",")) {
    const chunk = part.trim();
    if (!chunk) {
      continue;
    }

    const range = chunk.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      const min = Math.min(start, end);
      const max = Math.max(start, end);
      for (let page = min; page <= max && set.size < safeMax; page += 1) {
        addPage(set, page);
      }
      continue;
    }

    addPage(set, Number(chunk));
  }

  return Array.from(set).sort((a, b) => a - b).slice(0, safeMax);
}

function mimeTypeForAsset(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".png") {
    return "image/png";
  }
  if (ext === ".jpg" || ext === ".jpeg") {
    return "image/jpeg";
  }
  return "application/octet-stream";
}

function mimeTypeForDocument(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".pdf") {
    return "application/pdf";
  }
  if (ext === ".txt" || ext === ".md") {
    return "text/plain; charset=utf-8";
  }
  if (ext === ".csv") {
    return "text/csv; charset=utf-8";
  }
  if (ext === ".docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (ext === ".xlsx") {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  if (ext === ".xls") {
    return "application/vnd.ms-excel";
  }
  if (ext === ".png") {
    return "image/png";
  }
  if (ext === ".jpg" || ext === ".jpeg") {
    return "image/jpeg";
  }
  return "application/octet-stream";
}

function sanitizeFileName(name) {
  return (name || "upload.bin")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

function contentDispositionFileName(name) {
  const fallback = sanitizeFileName(name || "document") || "document";
  const asciiFallback = fallback.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "");
  return `inline; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(name || fallback)}`;
}

async function resolveOriginalDocumentFile(app, document) {
  const originalPath = String(document.original_file_path || "");
  if (!originalPath || path.isAbsolute(originalPath)) {
    throw new Error("Исходный файл документа недоступен");
  }

  const normalized = path.normalize(originalPath);
  if (normalized.startsWith("..") || normalized.includes(`..${path.sep}`)) {
    throw new Error("Недопустимый путь к исходному файлу");
  }

  const rawRoot = path.resolve(app.config.rawRoot);
  const fullPath = path.resolve(rawRoot, normalized);
  const [rootRealPath, fileRealPath] = await Promise.all([
    fs.realpath(rawRoot),
    fs.realpath(fullPath),
  ]);

  const relativeToRoot = path.relative(rootRealPath, fileRealPath);
  if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
    throw new Error("Файл находится вне рабочей папки data/raw");
  }

  const stat = await fs.stat(fileRealPath);
  if (!stat.isFile()) {
    throw new Error("Исходный файл документа не найден");
  }

  return fileRealPath;
}

function joinHostRawPath(hostRawRoot, relativePath) {
  const cleanParts = String(relativePath || "")
    .split(/[\\/]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (!hostRawRoot || cleanParts.length === 0) {
    return null;
  }

  const usesWindowsPath = /^[a-zA-Z]:[\\/]/.test(hostRawRoot) || hostRawRoot.includes("\\");
  return usesWindowsPath
    ? path.win32.join(hostRawRoot, ...cleanParts)
    : path.join(hostRawRoot, ...cleanParts);
}

function signLocalOpenToken(app, payload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = crypto
    .createHmac("sha256", app.config.localOpen.tokenSecret)
    .update(encodedPayload)
    .digest("base64url");
  return `${encodedPayload}.${signature}`;
}

function buildLocalOpenContract(app, document, containerFilePath) {
  const relativePath = String(document.original_file_path || "");
  const hostPath = joinHostRawPath(app.config.hostRawRoot, relativePath) || containerFilePath;
  const expiresAt = new Date(
    Date.now() + Math.max(5, Number(app.config.localOpen.tokenTtlSeconds || 30)) * 1000
  ).toISOString();
  const token = signLocalOpenToken(app, {
    documentId: document.id,
    path: hostPath,
    exp: expiresAt,
  });

  return {
    helperUrl: app.config.localOpen.helperUrl,
    helper_url: app.config.localOpen.helperUrl,
    token,
    path: hostPath,
    expiresAt,
  };
}

function parseCategories(rawValue) {
  if (!rawValue) {
    return [];
  }

  if (Array.isArray(rawValue)) {
    return parseTagList(rawValue);
  }

  try {
    const normalized = String(rawValue).replace(/\\"/g, '"');
    const parsed = JSON.parse(normalized);
    if (Array.isArray(parsed)) {
      return parseTagList(parsed);
    }
  } catch (error) {
    // Ignore and fall back to comma-separated parsing.
  }

  return parseTagList(rawValue);
}

function parseUuidArray(rawValue, fieldName, label) {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return [];
  }

  let values = rawValue;
  if (typeof rawValue === "string") {
    try {
      values = JSON.parse(rawValue);
    } catch (error) {
      values = rawValue.split(",");
    }
  }

  if (!Array.isArray(values)) {
    throw Object.assign(new Error(`${fieldName} должен быть массивом UUID`), {
      statusCode: 400,
    });
  }

  const ids = Array.from(
    new Set(values.map((item) => String(item ?? "").trim()).filter(Boolean))
  );
  const invalidId = ids.find((id) => !isUuid(id));
  if (invalidId) {
    throw Object.assign(new Error(`Некорректный UUID ${label}: ${invalidId}`), {
      statusCode: 400,
    });
  }

  return ids;
}

function parseNodeIds(rawValue) {
  return parseUuidArray(rawValue, "nodeIds", "раздела");
}

function parseDocumentIds(rawValue) {
  return parseUuidArray(rawValue, "documentIds", "документа");
}

function parsePrimaryNodeId(body = {}) {
  const rawValue = Object.prototype.hasOwnProperty.call(body, "primaryNodeId")
    ? body.primaryNodeId
    : body.primary;

  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return null;
  }

  const primaryNodeId = String(rawValue).trim();
  if (!isUuid(primaryNodeId)) {
    throw Object.assign(new Error("primaryNodeId должен быть UUID раздела"), {
      statusCode: 400,
    });
  }

  return primaryNodeId;
}

function assertImportNodeIdsAllowed(app, nodeIds) {
  if (
    app.config.knowledgeNodes.requireNodeIdsForImport === true &&
    (!Array.isArray(nodeIds) || nodeIds.length === 0)
  ) {
    throw Object.assign(new Error("Выберите раздел базы перед импортом документа"), {
      statusCode: 400,
    });
  }
}

function normalizeImportPayload(app, body = {}) {
  const nodeIds = parseNodeIds(body.nodeIds);
  assertImportNodeIdsAllowed(app, nodeIds);
  return {
    ...body,
    nodeIds,
    primaryNodeId: parsePrimaryNodeId(body),
  };
}

function localizePageTitle(value) {
  return String(value ?? "")
    .replace(/ - Page (\d+)$/i, " - Страница $1")
    .replace(/^PDF Page (\d+)$/i, "Страница $1");
}

function buildAssetItems(documentId, assetRows, sidecarMetadata) {
  return assetRows.length
    ? assetRows.map((item) => ({
        id: item.id,
        type: item.asset_type,
        assetClass: item.metadata_json?.assetClass ?? null,
        page: item.page_number,
        title: localizePageTitle(item.title),
        textExcerpt: item.text_excerpt,
        text: item.text_content,
        fileName: item.file_name,
        relativePath: item.relative_path,
        mimeType: item.mime_type,
        sizeBytes: item.size_bytes,
        metadata: item.metadata_json,
        confidence: item.metadata_json?.confidence ?? null,
        engineeringTopics: item.metadata_json?.engineeringTopics ?? [],
        signalTags: item.metadata_json?.signalTags ?? [],
        url: item.file_name
          ? `/documents/${documentId}/assets/${encodeURIComponent(item.file_name)}`
          : null,
      }))
    : (sidecarMetadata.items ?? []).map((item) => ({
        ...item,
        title: localizePageTitle(item.title),
        url: item.fileName
          ? `/documents/${documentId}/assets/${encodeURIComponent(item.fileName)}`
          : null,
      }));
}

function summarizeAssetClasses(items) {
  const counts = new Map();

  for (const item of items) {
    const key = item.assetClass ?? "unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([assetClass, count]) => ({ assetClass, count }))
    .sort((a, b) => a.assetClass.localeCompare(b.assetClass));
}

function summarizeEngineeringTopics(items) {
  const counts = new Map();

  for (const item of items) {
    const topics = Array.isArray(item.metadata?.engineeringTopics)
      ? item.metadata.engineeringTopics
      : [];

    for (const topic of topics) {
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic, "ru"));
}

function summarizeSignalTags(items, limit = 20) {
  const counts = new Map();

  for (const item of items) {
    const tags = Array.isArray(item.signalTags)
      ? item.signalTags
      : Array.isArray(item.metadata?.signalTags)
        ? item.metadata.signalTags
        : [];

    for (const tag of tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, limit);
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
  };
}

function mapNodeLinkRow(row) {
  return {
    documentId: row.document_id,
    nodeId: row.node_id,
    isPrimary: row.is_primary,
    linkedAt: row.linked_at,
    node: {
      id: row.node_id,
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
    },
  };
}

function handleDocumentNodeError(reply, error) {
  if (error.statusCode) {
    reply.code(error.statusCode);
    return {
      ok: false,
      error: error.message,
    };
  }

  if (error.code === "DOCUMENT_NOT_FOUND") {
    reply.code(404);
    return {
      ok: false,
      error: error.message,
    };
  }

  if (error.code === "NODE_NOT_FOUND") {
    reply.code(400);
    return {
      ok: false,
      error: error.message,
      details: error.details ?? undefined,
    };
  }

  if (error.code === "TARGET_NODE_NOT_FOUND") {
    reply.code(500);
    return {
      ok: false,
      error: error.message,
    };
  }

  if (error.code === "22P02") {
    reply.code(400);
    return {
      ok: false,
      error: "Некорректный UUID",
    };
  }

  throw error;
}

async function updateDocumentNodePayload(app, documentId) {
  const payload = await app.postgresProvider.buildDocumentNodePayload(documentId);
  const pointIds = await app.postgresProvider.getDocumentPointIds(documentId);
  await app.qdrantProvider.setPayload(pointIds, payload);

  return {
    payload,
    updatedPoints: pointIds.length,
  };
}

// Лимит параллельных документов в bulk-link/bulk-unlink. Per-document логика
// (транзакции, fallback на «Без раздела», выбор primary) остаётся нетронутой —
// параллелим только независимые документы. Пул pg = 10 соединений, каждый
// работник держит максимум одно, 4 — безопасно и для слабого ноутбука.
const BULK_NODE_CONCURRENCY = 4;

// Прогоняет worker по items с ограниченной конкурентностью, сохраняя порядок
// результатов. Первая ошибка отклоняет общий Promise (как и раньше прерывался
// последовательный цикл): часть документов может быть уже обработана — это
// прежняя семантика bulk-операций.
async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const lanes = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(lanes);
  return results;
}

function groupDuplicateRows(rows) {
  const groups = new Map();

  for (const row of rows) {
    const key = `${row.duplicate_key}:${row.source_type}`;
    if (!groups.has(key)) {
      groups.set(key, {
        fileName: row.original_file_name,
        sourceType: row.source_type,
        duplicateCount: Number(row.duplicate_count || 0),
        items: [],
      });
    }

    groups.get(key).items.push({
      id: row.id,
      title: row.title,
      originalFilePath: row.original_file_path,
      categories: row.categories,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      chunkCount: Number(row.chunk_count || 0),
      keep: Number(row.keep_rank || 0) === 1,
      keepRank: Number(row.keep_rank || 0),
    });
  }

  return Array.from(groups.values()).map((group) => ({
    ...group,
    keepDocumentId: group.items.find((item) => item.keep)?.id ?? null,
  }));
}

function runDetached(task) {
  setTimeout(() => {
    task().catch((error) => {
      console.error("[detached-ingestion]", error);
    });
  }, 0);
}

export async function documentRoutes(app) {
  app.get("/documents", async (request, reply) => {
    const nodeId = String(request.query?.nodeId ?? "").trim();
    if (nodeId) {
      if (!isUuid(nodeId)) {
        reply.code(400);
        return {
          ok: false,
          error: "Некорректный UUID раздела",
        };
      }

      const includeChildren = parseBoolean(request.query?.includeChildren, true);
      const documents = await app.postgresProvider.listDocumentsForKnowledgeNode(nodeId, {
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
        nodeId,
        includeChildren,
        items: documents,
      };
    }

    return {
      items: await app.postgresProvider.listDocuments({
        limit: request.query?.limit,
      }),
    };
  });

  app.get("/documents/duplicates", async (request) => {
    const pathPrefix = String(request.query?.pathPrefix ?? "").trim();
    const rows = await app.postgresProvider.listDuplicateDocuments({ pathPrefix });
    const groups = groupDuplicateRows(rows);

    return {
      ok: true,
      pathPrefix,
      totalGroups: groups.length,
      totalDocuments: rows.length,
      groups,
    };
  });

  app.post("/documents/bulk-link", async (request, reply) => {
    try {
      const body = request.body ?? {};
      const documentIds = parseDocumentIds(body.documentIds);
      const nodeIds = parseNodeIds(body.nodeIds);
      const mode = String(body.mode ?? "add");

      if (documentIds.length === 0) {
        reply.code(400);
        return {
          ok: false,
          error: "Выберите документы для привязки",
        };
      }
      if (nodeIds.length === 0) {
        reply.code(400);
        return {
          ok: false,
          error: "Выберите разделы для привязки",
        };
      }
      if (!["add", "replace"].includes(mode)) {
        reply.code(400);
        return {
          ok: false,
          error: "mode должен быть add или replace",
        };
      }

      const primaryNodeId = parsePrimaryNodeId(body);
      const results = await mapWithConcurrency(
        documentIds,
        BULK_NODE_CONCURRENCY,
        async (documentId) => {
          const links =
            mode === "replace"
              ? await app.postgresProvider.replaceDocumentNodeLinks(documentId, {
                  nodeIds,
                  primaryNodeId,
                })
              : await app.postgresProvider.addDocumentNodeLinks(documentId, {
                  nodeIds,
                  primaryNodeId,
                });
          const reindex = await updateDocumentNodePayload(app, documentId);
          return {
            documentId,
            links: links.map((row) => mapNodeLinkRow(row)),
            updatedPoints: reindex.updatedPoints,
            payload: reindex.payload,
          };
        }
      );

      return {
        ok: true,
        mode,
        updatedDocuments: results.length,
        items: results,
      };
    } catch (error) {
      return handleDocumentNodeError(reply, error);
    }
  });

  app.post("/documents/bulk-unlink", async (request, reply) => {
    try {
      const body = request.body ?? {};
      const documentIds = parseDocumentIds(body.documentIds);
      const nodeIds = parseNodeIds(body.nodeIds);

      if (documentIds.length === 0) {
        reply.code(400);
        return {
          ok: false,
          error: "Выберите документы для отвязки",
        };
      }
      if (nodeIds.length === 0) {
        reply.code(400);
        return {
          ok: false,
          error: "Выберите разделы для отвязки",
        };
      }

      const results = await mapWithConcurrency(
        documentIds,
        BULK_NODE_CONCURRENCY,
        async (documentId) => {
          // Разделы одного документа отвязываются последовательно: unlink
          // содержит fallback на «Без раздела» и пересчёт primary.
          let links = [];
          for (const nodeId of nodeIds) {
            links = await app.postgresProvider.unlinkDocumentNode(documentId, nodeId);
          }
          const reindex = await updateDocumentNodePayload(app, documentId);
          return {
            documentId,
            links: links.map((row) => mapNodeLinkRow(row)),
            updatedPoints: reindex.updatedPoints,
            payload: reindex.payload,
          };
        }
      );

      return {
        ok: true,
        updatedDocuments: results.length,
        items: results,
      };
    } catch (error) {
      return handleDocumentNodeError(reply, error);
    }
  });

  app.patch("/documents/:id", async (request, reply) => {
    const document = await app.postgresProvider.getDocumentById(request.params.id);
    if (!document) {
      reply.code(404);
      return {
        ok: false,
        error: "Документ не найден",
      };
    }

    const hasTitle = Object.prototype.hasOwnProperty.call(request.body ?? {}, "title");
    const hasCategories = Object.prototype.hasOwnProperty.call(request.body ?? {}, "categories");
    const title = String(request.body?.title ?? "").trim();
    if (hasTitle && !title) {
      reply.code(400);
      return {
        ok: false,
        error: "Введите новое название документа",
      };
    }

    let updatedDocument = document;
    if (hasTitle) {
      updatedDocument = await app.postgresProvider.updateDocumentTitle(document.id, title);
    }
    if (hasCategories) {
      const categories = parseCategories(request.body?.categories);
      updatedDocument = await app.postgresProvider.updateDocumentCategories(
        document.id,
        categories
      );
      const pointIds = await app.postgresProvider.getDocumentPointIds(document.id);
      try {
        await app.qdrantProvider.setPayload(pointIds, { categories });
      } catch (error) {
        request.log.warn(
          { documentId: document.id, error: error.message },
          "Document categories saved in PostgreSQL, but Qdrant payload update failed"
        );
        return {
          ok: true,
          document: mapDocumentRow(updatedDocument),
          qdrantSync: {
            ok: false,
            expectedPoints: pointIds.length,
            error:
              "Теги сохранены в PostgreSQL, но Qdrant сейчас недоступен. Payload обновится после восстановления Qdrant.",
            details: error.message,
          },
        };
      }
    }

    return {
      ok: true,
      document: mapDocumentRow(updatedDocument),
      qdrantSync: hasCategories
        ? {
            ok: true,
            message: "Payload Qdrant обновлён.",
          }
        : null,
    };
  });

  app.delete("/documents/:id", async (request, reply) => {
    const document = await app.postgresProvider.getDocumentById(request.params.id);
    if (!document) {
      reply.code(404);
      return {
        ok: false,
        error: "Документ не найден",
      };
    }

    const pointIds = await app.postgresProvider.getDocumentPointIds(document.id);
    let qdrantError = null;
    try {
      await app.qdrantProvider.deletePoints(pointIds);
    } catch (error) {
      qdrantError = error?.message || "Qdrant недоступен";
      app.log.warn(
        { err: error, documentId: document.id },
        "Qdrant недоступен при удалении документа; продолжаю удаление в Postgres"
      );
    }
    const { removedDocuments, removedGraphNodes } =
      await app.postgresProvider.deleteDocumentsByIds([document.id]);
    if (removedGraphNodes > 0) {
      request.log.info(
        { documentId: document.id, removedGraphNodes },
        "Удалены импортные узлы графа при удалении документа"
      );
    }
    let removedStoredFile = false;
    const shouldRemoveStoredFile = String(request.query?.removeStoredFile ?? "") === "true";
    const storedRelativePath = String(document.original_file_path || "");
    if (shouldRemoveStoredFile && /^\d+-[^/\\]+$/.test(storedRelativePath)) {
      try {
        await fs.rm(path.join(app.config.rawRoot, storedRelativePath), { force: true });
        removedStoredFile = true;
      } catch (error) {
        app.log.warn({ error, documentId: document.id }, "failed to remove uploaded raw file");
      }
    }

    const message = qdrantError
      ? "Документ удалён из базы. Qdrant был недоступен — точки удалятся при следующем «Пересобрать Qdrant»."
      : "Документ удалён.";

    return {
      ok: true,
      document: mapDocumentRow(document),
      removedDocuments,
      removedGraphNodes,
      removedVectors: qdrantError ? 0 : pointIds.length,
      removedStoredFile,
      qdrantError,
      message,
    };
  });

  app.get("/documents/:id/nodes", async (request, reply) => {
    const document = await app.postgresProvider.getDocumentById(request.params.id);
    if (!document) {
      reply.code(404);
      return {
        ok: false,
        error: "Документ не найден",
      };
    }

    const links = await app.postgresProvider.listDocumentNodeLinks(document.id);
    const payload = await app.postgresProvider.buildDocumentNodePayload(document.id);

    return {
      ok: true,
      document: mapDocumentRow(document),
      links: links.map((row) => mapNodeLinkRow(row)),
      payload,
      implicitUnsorted: links.length === 0,
    };
  });

  app.post("/documents/:id/nodes", async (request, reply) => {
    try {
      const document = await app.postgresProvider.getDocumentById(request.params.id);
      if (!document) {
        reply.code(404);
        return {
          ok: false,
          error: "Документ не найден",
        };
      }

      const links = await app.postgresProvider.addDocumentNodeLinks(document.id, {
        nodeIds: parseNodeIds(request.body?.nodeIds),
        primaryNodeId: parsePrimaryNodeId(request.body ?? {}),
      });
      const reindex = await updateDocumentNodePayload(app, document.id);

      return {
        ok: true,
        mode: "add",
        document: mapDocumentRow(document),
        links: links.map((row) => mapNodeLinkRow(row)),
        updatedPoints: reindex.updatedPoints,
        payload: reindex.payload,
      };
    } catch (error) {
      return handleDocumentNodeError(reply, error);
    }
  });

  app.patch("/documents/:id/nodes", async (request, reply) => {
    try {
      const document = await app.postgresProvider.getDocumentById(request.params.id);
      if (!document) {
        reply.code(404);
        return {
          ok: false,
          error: "Документ не найден",
        };
      }

      const links = await app.postgresProvider.replaceDocumentNodeLinks(document.id, {
        nodeIds: parseNodeIds(request.body?.nodeIds),
        primaryNodeId: parsePrimaryNodeId(request.body ?? {}),
      });
      const reindex = await updateDocumentNodePayload(app, document.id);

      return {
        ok: true,
        mode: "replace",
        document: mapDocumentRow(document),
        links: links.map((row) => mapNodeLinkRow(row)),
        updatedPoints: reindex.updatedPoints,
        payload: reindex.payload,
      };
    } catch (error) {
      return handleDocumentNodeError(reply, error);
    }
  });

  app.delete("/documents/:id/nodes/:nodeId", async (request, reply) => {
    try {
      if (!isUuid(request.params.nodeId)) {
        reply.code(400);
        return {
          ok: false,
          error: "Некорректный UUID раздела",
        };
      }

      const document = await app.postgresProvider.getDocumentById(request.params.id);
      if (!document) {
        reply.code(404);
        return {
          ok: false,
          error: "Документ не найден",
        };
      }

      const links = await app.postgresProvider.unlinkDocumentNode(
        document.id,
        request.params.nodeId
      );
      const reindex = await updateDocumentNodePayload(app, document.id);

      return {
        ok: true,
        document: mapDocumentRow(document),
        links: links.map((row) => mapNodeLinkRow(row)),
        updatedPoints: reindex.updatedPoints,
        payload: reindex.payload,
      };
    } catch (error) {
      return handleDocumentNodeError(reply, error);
    }
  });

  app.post("/documents/:id/reindex", async (request, reply) => {
    const document = await app.postgresProvider.getDocumentById(request.params.id);
    if (!document) {
      reply.code(404);
      return { ok: false, error: "Документ не найден" };
    }
    if (!document.original_file_path) {
      reply.code(400);
      return { ok: false, error: "У документа нет исходного пути для повторной индексации" };
    }

    const nodeLinks = await app.postgresProvider.getDocumentNodeIds(document.id).catch(() => []);
    const nodeIds = nodeLinks.map((link) => link.nodeId).filter(Boolean);
    const primaryNodeId = (nodeLinks.find((link) => link.isPrimary) || {}).nodeId || null;
    const categories = Array.isArray(document.categories) ? document.categories : [];

    const pointIds = await app.postgresProvider.getDocumentPointIds(document.id);
    try { await app.qdrantProvider.deletePoints(pointIds); } catch (err) { /* qdrant may be unavailable */ }
    await app.postgresProvider.deleteDocumentsByIds([document.id]);

    runDetached(async () => {
      await app.ingestionService.ingestFileFromRaw({
        relativePath: document.original_file_path,
        title: document.title,
        categories,
        nodeIds,
        primaryNodeId,
        force: true,
        createVisualAssets: true,
      });
    });

    reply.code(202);
    return {
      ok: true,
      queued: true,
      message:
        "Документ поставлен в очередь на повторную индексацию в полном режиме (с постраничными визуальными ассетами, включая OCR, если включён).",
    };
  });

  app.post("/documents/:id/reindex-payload", async (request, reply) => {
    try {
      const document = await app.postgresProvider.getDocumentById(request.params.id);
      if (!document) {
        reply.code(404);
        return {
          ok: false,
          error: "Документ не найден",
        };
      }

      const reindex = await updateDocumentNodePayload(app, document.id);

      return {
        ok: true,
        document: mapDocumentRow(document),
        updatedPoints: reindex.updatedPoints,
        payload: reindex.payload,
      };
    } catch (error) {
      return handleDocumentNodeError(reply, error);
    }
  });

  app.post("/documents/deduplicate", async (request) => {
    const pathPrefix = String(request.body?.pathPrefix ?? "").trim();
    const rows = await app.postgresProvider.listDuplicateDocuments({ pathPrefix });
    const groups = groupDuplicateRows(rows);

    const documentIdsToRemove = groups.flatMap((group) =>
      group.items.filter((item) => !item.keep).map((item) => item.id)
    );

    const pointIds = [];
    for (const documentId of documentIdsToRemove) {
      const ids = await app.postgresProvider.getDocumentPointIds(documentId);
      pointIds.push(...ids);
    }

    await app.qdrantProvider.deletePoints(pointIds);
    const { removedDocuments, removedGraphNodes } =
      await app.postgresProvider.deleteDocumentsByIds(documentIdsToRemove);
    if (removedGraphNodes > 0) {
      request.log.info(
        { documentIds: documentIdsToRemove, removedGraphNodes },
        "Удалены импортные узлы графа при удалении дублей документов"
      );
    }

    return {
      ok: true,
      pathPrefix,
      duplicateGroups: groups.length,
      removedDocuments,
      removedGraphNodes,
      removedVectors: pointIds.length,
      keptDocuments: groups
        .map((group) => ({
          fileName: group.fileName,
          keepDocumentId: group.keepDocumentId,
        }))
        .filter((item) => item.keepDocumentId),
    };
  });

  app.get("/documents/:id/chunks", async (request) => {
    return {
      items: await app.postgresProvider.getDocumentChunks(request.params.id),
    };
  });

  app.get("/documents/:id/original", async (request, reply) => {
    const document = await app.postgresProvider.getDocumentById(request.params.id);
    if (!document) {
      reply.code(404);
      return {
        ok: false,
        error: "Документ не найден",
      };
    }

    try {
      const filePath = await resolveOriginalDocumentFile(app, document);
      const fileName = document.original_file_name || path.basename(filePath);
      reply.header("Content-Type", mimeTypeForDocument(fileName));
      reply.header("Content-Disposition", contentDispositionFileName(fileName));
      return reply.send(createReadStream(filePath));
    } catch (error) {
      reply.code(404);
      return {
        ok: false,
        error: error.message,
      };
    }
  });

  app.post("/documents/:id/open-local", async (request, reply) => {
    const document = await app.postgresProvider.getDocumentById(request.params.id);
    const fallbackUrl = `/documents/${encodeURIComponent(request.params.id)}/original`;
    if (!document) {
      reply.code(404);
      return {
        ok: false,
        error: "Документ не найден",
      };
    }

    try {
      const filePath = await resolveOriginalDocumentFile(app, document);
      const helper = buildLocalOpenContract(app, document, filePath);

      return {
        ok: true,
        opened: false,
        mode: "local-helper",
        ...helper,
        fallbackUrl,
        message:
          "Для открытия в Windows-приложении отправьте token и path в локальный helper. Если helper не установлен, откройте полный файл через браузер.",
      };
    } catch (error) {
      return {
        ok: false,
        opened: false,
        fallbackUrl,
        error: error.message,
      };
    }
  });

  app.get("/documents/:id/assets", async (request, reply) => {
    const document = await app.postgresProvider.getDocumentById(request.params.id);
    if (!document) {
      reply.code(404);
      return {
        ok: false,
        error: "Документ не найден",
      };
    }

    const assetRows = await app.postgresProvider.listDocumentAssets(document.id);
    const sidecarMetadata = await app.visualAssetService.listDocumentAssets(document.id);
    const items = buildAssetItems(document.id, assetRows, sidecarMetadata);

    return {
      ok: true,
      documentId: document.id,
      title: document.title,
      originalFilePath: document.original_file_path,
      originalFileName: document.original_file_name,
      sourceType: document.source_type,
      assets: {
        documentId: document.id,
        sourceType: document.source_type,
        totalPages: sidecarMetadata.totalPages ?? items.length,
        extractedPages: sidecarMetadata.extractedPages ?? items.length,
        previewPages: sidecarMetadata.previewPages ?? items.filter((item) => item.url).length,
        byType: summarizeAssetClasses(items),
        byTopic: summarizeEngineeringTopics(items),
        bySignalTag: summarizeSignalTags(items),
        items,
      },
    };
  });

  app.get("/documents/:id/assets/browse", async (request, reply) => {
    const document = await app.postgresProvider.getDocumentById(request.params.id);
    if (!document) {
      reply.code(404);
      return {
        ok: false,
        error: "Документ не найден",
      };
    }

    const assetRows = await app.postgresProvider.listDocumentAssets(document.id);
    const sidecarMetadata = await app.visualAssetService.listDocumentAssets(document.id);
    const items = buildAssetItems(document.id, assetRows, sidecarMetadata);
    const assetClass = String(request.query?.assetClass ?? "all");
    const engineeringTopic = String(request.query?.engineeringTopic ?? "all");
    const signalTag = String(request.query?.signalTag ?? "all").trim().toUpperCase();
    const filteredItems =
      items.filter((item) => {
        const matchesClass =
          assetClass === "all" ? true : (item.assetClass ?? "unknown") === assetClass;
        const topics = Array.isArray(item.engineeringTopics) ? item.engineeringTopics : [];
        const tags = Array.isArray(item.signalTags) ? item.signalTags : [];
        const matchesTopic =
          engineeringTopic === "all" ? true : topics.includes(engineeringTopic);
        const matchesSignalTag =
          !signalTag || signalTag === "ALL"
            ? true
            : tags.some((tag) => String(tag).toUpperCase() === signalTag);

        return matchesClass && matchesTopic && matchesSignalTag;
      });

    return {
      ok: true,
      documentId: document.id,
      title: document.title,
      originalFilePath: document.original_file_path,
      originalFileName: document.original_file_name,
      assetClass,
      engineeringTopic,
      signalTag,
      totalItems: filteredItems.length,
      byType: summarizeAssetClasses(items),
      byTopic: summarizeEngineeringTopics(items),
      bySignalTag: summarizeSignalTags(items),
      items: filteredItems,
    };
  });

  app.post("/documents/:id/reclassify-assets", async (request, reply) => {
    const document = await app.postgresProvider.getDocumentById(request.params.id);
    if (!document) {
      reply.code(404);
      return {
        ok: false,
        error: "Документ не найден",
      };
    }

    if (document.source_type !== "pdf") {
      reply.code(400);
      return {
        ok: false,
        error: "Пере-классификация сейчас поддерживается только для PDF-документов",
      };
    }

    const assetRows = await app.postgresProvider.listDocumentAssets(document.id);
    const pageAssets = assetRows.filter((item) => item.asset_type === "pdf-page-preview");

    if (pageAssets.length === 0) {
      return {
        ok: true,
        documentId: document.id,
        updated: 0,
        assets: [],
      };
    }

    const updates = [];
    for (const asset of pageAssets) {
      const classification = analyzePdfPageAsset({
        pageNumber: asset.page_number,
        title: asset.title,
        text: asset.text_content ?? asset.text_excerpt ?? "",
      });

      const updatedAsset = await app.postgresProvider.updateDocumentAssetClassification(
        document.id,
        asset.page_number,
        {
          ...classification,
          classifierVersion: "v3",
        }
      );

      updates.push({
        id: asset.id,
        page: asset.page_number,
        title: localizePageTitle(asset.title),
        assetClass: classification.assetClass,
        confidence: classification.confidence,
        engineeringTopics: classification.engineeringTopics,
        signalTags: classification.signalTags,
        metadata: updatedAsset?.metadata_json ?? asset.metadata_json,
      });

      await app.qdrantProvider.setPayload([asset.id], {
        asset_class: classification.assetClass,
        asset_confidence: classification.confidence,
        engineering_topics: classification.engineeringTopics,
        signal_tags: classification.signalTags,
      });
    }

    return {
      ok: true,
      documentId: document.id,
      title: document.title,
      updated: updates.length,
      byType: summarizeAssetClasses(
        updates.map((item) => ({
          assetClass: item.assetClass,
          metadata: {
            engineeringTopics: item.engineeringTopics,
          },
        }))
      ),
      byTopic: summarizeEngineeringTopics(
        updates.map((item) => ({
          metadata: {
            engineeringTopics: item.engineeringTopics,
          },
        }))
      ),
      bySignalTag: summarizeSignalTags(
        updates.map((item) => ({
          signalTags: item.signalTags,
        }))
      ),
      assets: updates,
    };
  });

  app.post("/documents/:id/rebuild-visual-assets", async (request, reply) => {
    const document = await app.postgresProvider.getDocumentById(request.params.id);
    if (!document) {
      reply.code(404);
      return {
        ok: false,
        error: "Документ не найден",
      };
    }

    if (document.source_type !== "pdf") {
      reply.code(400);
      return {
        ok: false,
        error: "Точечный preview/OCR сейчас поддерживается только для PDF-документов",
      };
    }

    const body = request.body ?? {};
    const maxPages = parsePositiveInt(body.maxPages ?? request.query?.maxPages, 20, {
      min: 1,
      max: 100,
    });
    const createPreview = parseBoolean(body.createPreview ?? request.query?.createPreview, true);
    const ocrMode = parseOcrMode(body.ocrMode ?? request.query?.ocrMode);

    try {
      const fullPath = await resolveOriginalDocumentFile(app, document);
      const extracted = await app.extractorService.extractFromFile(
        fullPath,
        document.original_file_path
      );
      const totalPages = Array.isArray(extracted.pageTexts) ? extracted.pageTexts.length : 0;
      const pages = parsePageSelection(body.pages ?? request.query?.pages, totalPages, {
        maxPages,
      });

      if (pages.length === 0) {
        reply.code(400);
        return {
          ok: false,
          error: "Не удалось определить страницы для обработки",
        };
      }

      const visualAssets = await app.visualAssetService.extractTargetedPdfPageAssets({
        fullPath,
        documentId: document.id,
        title: document.title,
        pageTexts: extracted.pageTexts,
        pages,
        createPreview,
        ocrMode,
      });

      const preparedItems = (visualAssets.items ?? []).map((item) => {
        const classification = analyzePdfPageAsset({
          pageNumber: item.page,
          title: item.title,
          text: item.text,
        });

        return {
          ...item,
          assetClass: classification.assetClass,
          confidence: classification.confidence,
          engineeringTopics: classification.engineeringTopics,
          signalTags: classification.signalTags,
          scores: classification.scores,
          classifierVersion: "v3",
        };
      });

      const upsertedAssets = [];
      for (const item of preparedItems) {
        const asset = await app.postgresProvider.upsertDocumentAsset(document.id, item);
        if (asset) {
          upsertedAssets.push(asset);
        }
      }

      const nodePayload = await app.postgresProvider.buildDocumentNodePayload(document.id);
      if (upsertedAssets.length > 0) {
        await app.ingestionService.embedAndUpsertRecords({
          records: upsertedAssets,
          totalItems: upsertedAssets.length,
          progressLabel: "Индексирование PDF-страниц",
          getText: (asset) =>
            `${asset.title ?? document.title}\n\n${asset.text_content ?? asset.text_excerpt ?? ""}`.trim(),
          buildPayload: (asset) => ({
            document_id: document.id,
            asset_id: asset.id,
            resource_type: "asset",
            asset_type: asset.asset_type,
            page_number: asset.page_number,
            chunk_index: asset.page_number ? asset.page_number - 1 : 0,
            title: asset.title ?? document.title,
            asset_class: asset.metadata_json?.assetClass ?? null,
            asset_confidence: asset.metadata_json?.confidence ?? null,
            engineering_topics: asset.metadata_json?.engineeringTopics ?? [],
            signal_tags: asset.metadata_json?.signalTags ?? [],
            text: asset.text_excerpt ?? "",
            context: `PDF-страница ${asset.page_number ?? ""}`.trim(),
            text_with_context: `${asset.title ?? document.title}\n\n${asset.text_content ?? asset.text_excerpt ?? ""}`.trim(),
            categories: document.categories ?? [],
            source_path: document.original_file_path,
            file_name: asset.file_name,
            relative_path: asset.relative_path,
            mime_type: asset.mime_type,
            ...nodePayload,
          }),
        });
      }

      const items = buildAssetItems(document.id, upsertedAssets, visualAssets);
      return {
        ok: true,
        documentId: document.id,
        title: document.title,
        pages,
        totalPages,
        createPreview,
        ocrMode,
        updated: upsertedAssets.length,
        byType: summarizeAssetClasses(items),
        byTopic: summarizeEngineeringTopics(items),
        bySignalTag: summarizeSignalTags(items),
        items,
      };
    } catch (error) {
      reply.code(500);
      return {
        ok: false,
        error: error.message,
      };
    }
  });

  app.get("/documents/:id/assets/:fileName", async (request, reply) => {
    const document = await app.postgresProvider.getDocumentById(request.params.id);
    if (!document) {
      reply.code(404);
      return {
        ok: false,
        error: "Документ не найден",
      };
    }

    try {
      const buffer = await app.visualAssetService.readAssetFile(
        document.id,
        request.params.fileName
      );
      reply.header("Content-Type", mimeTypeForAsset(request.params.fileName));
      // Превью страниц практически неизменны — час кэша заметно ускоряет
      // повторный просмотр документов без риска надолго залипшей картинки.
      reply.header("Cache-Control", "private, max-age=3600");
      return reply.send(buffer);
    } catch (error) {
      reply.code(404);
      return {
        ok: false,
        error: "Файл предпросмотра не найден",
      };
    }
  });

  app.get("/documents/:id/pages/:pageNumber/preview", async (request, reply) => {
    const document = await app.postgresProvider.getDocumentById(request.params.id);
    if (!document) {
      reply.code(404);
      return {
        ok: false,
        error: "Документ не найден",
      };
    }

    if (document.source_type !== "pdf") {
      reply.code(400);
      return {
        ok: false,
        error: "Создание предпросмотра поддерживается только для PDF-документов",
      };
    }

    const pageNumber = Number(request.params.pageNumber);
    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
      reply.code(400);
      return {
        ok: false,
        error: "Номер страницы должен быть положительным целым числом",
      };
    }

    const asset = await app.postgresProvider.getDocumentAssetByPage(document.id, pageNumber);
    if (!asset) {
      reply.code(404);
      return {
        ok: false,
        error: "Страница не найдена в индексированных ресурсах документа",
      };
    }

    if (asset.file_name) {
      try {
        const buffer = await app.visualAssetService.readAssetFile(document.id, asset.file_name);
        reply.header("Content-Type", mimeTypeForAsset(asset.file_name));
        reply.header("Cache-Control", "private, max-age=3600");
        return reply.send(buffer);
      } catch (error) {
        // Fall through to lazy generation.
      }
    }

    try {
      const fullPath = path.join(app.config.rawRoot, document.original_file_path);
      const preview = await app.visualAssetService.generatePdfPagePreview({
        fullPath,
        documentId: document.id,
        title: document.title,
        pageNumber,
      });

      await app.postgresProvider.updateDocumentAssetPreview(document.id, pageNumber, preview);

      const buffer = await app.visualAssetService.readAssetFile(document.id, preview.fileName);
      reply.header("Content-Type", preview.mimeType ?? "image/png");
      return reply.send(buffer);
    } catch (error) {
      reply.code(500);
      return {
        ok: false,
        error: error.message,
      };
    }
  });

  app.post("/documents/upload", async (request, reply) => {
    try {
      const file = await request.file();
      if (!file) {
        reply.code(400);
        return {
          ok: false,
          error: "Нужно передать файл",
        };
      }

      const originalName = sanitizeFileName(file.filename);
      const storedRelativePath = `${Date.now()}-${originalName}`;
      const storedFullPath = path.join(app.config.rawRoot, storedRelativePath);
      const uploadBuffer = await file.toBuffer();

      await fs.mkdir(app.config.rawRoot, { recursive: true });
      await fs.writeFile(storedFullPath, uploadBuffer);

      const title = file.fields?.title?.value || originalName;
      const categories = parseCategories(file.fields?.categories?.value);
      const nodeIds = parseNodeIds(file.fields?.nodeIds?.value);
      assertImportNodeIdsAllowed(app, nodeIds);
      const primaryNodeId = parsePrimaryNodeId({
        primaryNodeId: file.fields?.primaryNodeId?.value,
      });

      const result = await app.ingestionService.ingestFileFromRaw({
        relativePath: storedRelativePath,
        title,
        categories,
        nodeIds,
        primaryNodeId,
      });

      return {
        ok: true,
        mode: "upload",
        originalName,
        storedRelativePath,
        ...result,
      };
    } catch (error) {
      reply.code(400);
      return {
        ok: false,
        error: error.message,
      };
    }
  });

  app.post("/documents/ingest-file", async (request, reply) => {
    try {
      const result = await app.ingestionService.ingestFileFromRaw(
        normalizeImportPayload(app, request.body ?? {})
      );
      return {
        ok: true,
        mode: "file",
        ...result,
      };
    } catch (error) {
      reply.code(400);
      return {
        ok: false,
        error: error.message,
      };
    }
  });

  app.post("/documents/ingest-file-async", async (request, reply) => {
    try {
      const payload = normalizeImportPayload(app, request.body ?? {});
      runDetached(async () => {
        await app.ingestionService.ingestFileFromRaw(payload);
      });

      reply.code(202);
      return {
        ok: true,
        mode: "file-async",
        queued: true,
        relativePath: payload.relativePath ?? null,
        message:
          "Файл поставлен в фоновую обработку. Проверяйте статус через /jobs или страницу /ui/jobs.",
      };
    } catch (error) {
      reply.code(400);
      return {
        ok: false,
        error: error.message,
      };
    }
  });

  app.post("/documents/ingest-folder", async (request, reply) => {
    try {
      const result = await app.ingestionService.ingestFolderFromRaw(
        normalizeImportPayload(app, request.body ?? {})
      );
      return {
        ok: true,
        mode: "folder",
        ...result,
      };
    } catch (error) {
      reply.code(400);
      return {
        ok: false,
        error: error.message,
      };
    }
  });

  app.post("/documents/ingest-folder-async", async (request, reply) => {
    try {
      const payload = normalizeImportPayload(app, request.body ?? {});
      runDetached(async () => {
        await app.ingestionService.ingestFolderFromRaw(payload);
      });

      reply.code(202);
      return {
        ok: true,
        mode: "folder-async",
        queued: true,
        relativeDir: payload.relativeDir ?? null,
        message:
          "Папка поставлена в фоновую обработку. Проверяйте статус через /jobs или страницу /ui/jobs.",
      };
    } catch (error) {
      reply.code(400);
      return {
        ok: false,
        error: error.message,
      };
    }
  });

  app.post("/documents/ingest-text", async (request, reply) => {
    try {
      const body = normalizeImportPayload(app, request.body ?? {});
      const result = await app.ingestionService.ingestTextDocument(body);
      return {
        ok: true,
        mode: "text",
        ...result,
      };
    } catch (error) {
      reply.code(400);
      return {
        ok: false,
        error: error.message,
      };
    }
  });
}
