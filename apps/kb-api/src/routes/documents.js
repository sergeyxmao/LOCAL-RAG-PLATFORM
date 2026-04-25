import fs from "node:fs/promises";
import path from "node:path";

import { analyzePdfPageAsset } from "../services/pageClassifierService.js";

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

function sanitizeFileName(name) {
  return (name || "upload.bin")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

function parseCategories(rawValue) {
  if (!rawValue) {
    return [];
  }

  if (Array.isArray(rawValue)) {
    return rawValue;
  }

  try {
    const normalized = String(rawValue).replace(/\\"/g, '"');
    const parsed = JSON.parse(normalized);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    // Ignore and fall back to comma-separated parsing.
  }

  return String(rawValue)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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
  app.get("/documents", async () => {
    return {
      items: await app.postgresProvider.listDocuments(),
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
    const removedDocuments = await app.postgresProvider.deleteDocumentsByIds(documentIdsToRemove);

    return {
      ok: true,
      pathPrefix,
      duplicateGroups: groups.length,
      removedDocuments,
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
          classifierVersion: "v2",
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

      const result = await app.ingestionService.ingestFileFromRaw({
        relativePath: storedRelativePath,
        title,
        categories,
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
      const result = await app.ingestionService.ingestFileFromRaw(request.body ?? {});
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
      const payload = request.body ?? {};
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
      const result = await app.ingestionService.ingestFolderFromRaw(request.body ?? {});
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
      const payload = request.body ?? {};
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
      const body = request.body ?? {};
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
