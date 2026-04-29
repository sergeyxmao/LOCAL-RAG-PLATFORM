import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { chunkTextDocument, estimateTokenCount } from "./chunkingService.js";
import { analyzePdfPageAsset } from "./pageClassifierService.js";

const SUPPORTED_EXTENSIONS = new Set([".txt", ".md", ".pdf", ".docx", ".csv", ".xlsx", ".xls"]);

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function assertSafeRelativePath(relativePath) {
  if (!relativePath || path.isAbsolute(relativePath)) {
    throw new Error("relativePath must be a relative path inside data/raw");
  }

  const normalized = path.normalize(relativePath);
  if (normalized.startsWith("..") || normalized.includes(`..${path.sep}`)) {
    throw new Error("Path traversal is not allowed");
  }

  return normalized;
}

function mimeTypeFromPath(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".md") {
    return "text/markdown";
  }
  if (ext === ".pdf") {
    return "application/pdf";
  }
  if (ext === ".docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (ext === ".csv") {
    return "text/csv";
  }
  if (ext === ".xlsx") {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  if (ext === ".xls") {
    return "application/vnd.ms-excel";
  }
  return "text/plain";
}

function isSupportedFile(filePath) {
  return SUPPORTED_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function coerceBoolean(value, fallback) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["false", "0", "no", "off", "нет"].includes(normalized)) {
    return false;
  }
  if (["true", "1", "yes", "on", "да"].includes(normalized)) {
    return true;
  }

  return fallback;
}

class JobCancelledError extends Error {
  constructor(message = "Задача остановлена пользователем") {
    super(message);
    this.name = "JobCancelledError";
  }
}

export class IngestionService {
  constructor({
    config,
    postgresProvider,
    qdrantProvider,
    embeddingProvider,
    extractorService,
    visualAssetService,
  }) {
    this.config = config;
    this.postgresProvider = postgresProvider;
    this.qdrantProvider = qdrantProvider;
    this.embeddingProvider = embeddingProvider;
    this.extractorService = extractorService;
    this.visualAssetService = visualAssetService;
  }

  buildChunksForExtraction(extracted, title, categories) {
    if (Array.isArray(extracted.prebuiltChunks) && extracted.prebuiltChunks.length > 0) {
      return extracted.prebuiltChunks.map((chunk, index) => ({
        chunkIndex: index,
        text: chunk.text,
        context: chunk.context,
        textWithContext: `${chunk.context}\n\n${chunk.text}`,
        tokenEstimate: estimateTokenCount(chunk.text),
        categories,
        sourceUrl: null,
        fileUrl: null,
      }));
    }

    return chunkTextDocument({
      text: extracted.text,
      title,
      categories,
      maxTokens: this.config.ingestion.chunking.max_tokens,
      overlapSentences: this.config.ingestion.chunking.overlap_sentences,
    });
  }

  async ensureJobActive(jobId) {
    if (!jobId) {
      return;
    }

    const job = await this.postgresProvider.getJobById(jobId);
    if (!job) {
      return;
    }

    if (job.status === "cancel_requested" || job.status === "cancelled") {
      throw new JobCancelledError();
    }
  }

  async cleanupCancelledDocument({ jobId, documentId }) {
    if (!documentId) {
      if (jobId) {
        await this.postgresProvider.updateJobStatus(jobId, "cancelled", "Задача остановлена пользователем");
      }
      return;
    }

    const pointIds = await this.postgresProvider.getDocumentPointIds(documentId);
    await this.qdrantProvider.deletePoints(pointIds);
    await this.postgresProvider.clearDocumentContent(documentId);
    await this.postgresProvider.updateDocumentStatus(documentId, "cancelled");

    if (jobId) {
      await this.postgresProvider.updateJobStatus(jobId, "cancelled", "Задача остановлена пользователем");
    }
  }

  async prepareDocumentNodePayload(documentId, { nodeIds = [], primaryNodeId = null } = {}) {
    await this.postgresProvider.replaceDocumentNodeLinks(documentId, {
      nodeIds,
      primaryNodeId,
    });

    return this.postgresProvider.buildDocumentNodePayload(documentId);
  }

  async syncDocumentNodePayload(documentId) {
    const nodePayload = await this.postgresProvider.buildDocumentNodePayload(documentId);
    const pointIds = await this.postgresProvider.getDocumentPointIds(documentId);
    await this.qdrantProvider.setPayload(pointIds, nodePayload);

    return {
      nodePayload,
      updatedPoints: pointIds.length,
    };
  }

  async embedAndUpsertRecords({
    records,
    jobId = null,
    totalItems = null,
    progressOffset = 0,
    progressLabel = "Индексирование",
    batchSize = 2,
    getText,
    buildPayload,
  }) {
    let processedItems = progressOffset;

    for (let start = 0; start < records.length; start += batchSize) {
      await this.ensureJobActive(jobId);

      const batch = records.slice(start, start + batchSize);
      const texts = batch.map(getText);
      const vectors = await this.embeddingProvider.embed(texts);

      await this.qdrantProvider.upsertChunks(
        batch.map((record, index) => ({
          id: record.id,
          vector: vectors[index],
          payload: buildPayload(record, index),
        }))
      );

      processedItems += batch.length;

      await this.ensureJobActive(jobId);

      if (jobId) {
        await this.postgresProvider.updateJobProgress(jobId, {
          processedItems,
          totalItems,
          progressMessage: `${progressLabel}: ${processedItems}/${totalItems ?? "?"}`,
        });
      }
    }

    return processedItems;
  }

  async ingestTextDocument({
    title,
    text,
    sourceLabel = "manual",
    categories = [],
    nodeIds = [],
    primaryNodeId = null,
  }) {
    const checksum = crypto.createHash("sha256").update(text, "utf8").digest("hex");
    const chunks = chunkTextDocument({
      text,
      title,
      categories,
      maxTokens: this.config.ingestion.chunking.max_tokens,
      overlapSentences: this.config.ingestion.chunking.overlap_sentences,
    });

    if (chunks.length === 0) {
      throw new Error("Document does not contain extractable text");
    }

    const job = await this.postgresProvider.createJob({
      documentId: null,
      jobType: "ingest-text",
      status: "running",
      totalItems: chunks.length,
      processedItems: 0,
      progressMessage: "Подготовка текста",
      startedAt: new Date(),
    });
    await this.postgresProvider.replaceJobNodeLinks(job.id, nodeIds);

    try {
      await this.ensureJobActive(job.id);

      const document = await this.postgresProvider.createDocument({
        title,
        slug: slugify(title),
        sourceType: "text",
        originalFilePath: sourceLabel,
        originalFileName: sourceLabel,
        mimeType: "text/plain",
        checksum,
        categories,
        status: "indexed",
      });
      const nodePayload = await this.prepareDocumentNodePayload(document.id, {
        nodeIds,
        primaryNodeId,
      });

      const insertedChunks = await this.postgresProvider.createChunks(document.id, chunks);
      await this.embedAndUpsertRecords({
        records: insertedChunks,
        jobId: job.id,
        totalItems: insertedChunks.length,
        progressLabel: "Индексирование текста",
        getText: (chunk) => chunk.text_with_context,
        buildPayload: (chunk) => ({
          document_id: document.id,
          chunk_id: chunk.id,
          chunk_index: chunk.chunk_index,
          title: document.title,
          text: chunk.text,
          context: chunk.context,
          text_with_context: chunk.text_with_context,
          categories: chunk.categories,
          source_path: document.original_file_path,
          ...nodePayload,
        }),
      });

      await this.postgresProvider.updateJobStatus(job.id, "completed");

      return {
        document,
        chunksIndexed: insertedChunks.length,
        nodePayload,
      };
    } catch (error) {
      if (error instanceof JobCancelledError) {
        await this.postgresProvider.updateJobStatus(job.id, "cancelled", error.message);
        throw error;
      }

      await this.postgresProvider.updateJobStatus(job.id, "failed", error.message);
      throw error;
    }
  }

  async ingestFileFromRaw({
    relativePath,
    title,
    categories = [],
    nodeIds = [],
    primaryNodeId = null,
    force = false,
    createVisualAssets = true,
  }) {
    const safeRelativePath = assertSafeRelativePath(relativePath);
    const fullPath = path.join(this.config.rawRoot, safeRelativePath);
    const fileBuffer = await fs.readFile(fullPath);
    const checksum = crypto.createHash("sha256").update(fileBuffer).digest("hex");
    const effectiveTitle = title || path.basename(fullPath);
    const shouldCreateVisualAssets = coerceBoolean(createVisualAssets, true);

    if (!force) {
      const existingDocument = await this.postgresProvider.findIndexedDocumentByPathOrChecksum(
        safeRelativePath,
        checksum
      );
      if (existingDocument) {
        let nodePayload = null;
        let nodePayloadUpdatedPoints = 0;
        if (Array.isArray(nodeIds) && nodeIds.length > 0) {
          await this.postgresProvider.addDocumentNodeLinks(existingDocument.id, {
            nodeIds,
            primaryNodeId,
          });
          const nodeSync = await this.syncDocumentNodePayload(existingDocument.id);
          nodePayload = nodeSync.nodePayload;
          nodePayloadUpdatedPoints = nodeSync.updatedPoints;
        }

        return {
          documentId: existingDocument.id,
          title: existingDocument.title,
          relativePath: safeRelativePath,
          chunksIndexed: null,
          skipped: true,
          skipReason: "already-indexed",
          nodePayload,
          nodePayloadUpdatedPoints,
        };
      }
    }

    const extracted = await this.extractorService.extractFromFile(fullPath, safeRelativePath);
    const chunks = this.buildChunksForExtraction(extracted, effectiveTitle, categories);

    if (chunks.length === 0) {
      throw new Error("Document does not contain extractable text");
    }

    const expectedAssetItems =
      extracted.sourceType === "pdf" && shouldCreateVisualAssets && Array.isArray(extracted.pageTexts)
        ? extracted.pageTexts.length
        : 0;
    const totalItems = chunks.length + expectedAssetItems;

    const document = await this.postgresProvider.createDocument({
      title: effectiveTitle,
      slug: slugify(effectiveTitle),
      sourceType: extracted.sourceType,
      originalFilePath: safeRelativePath,
      originalFileName: path.basename(fullPath),
      mimeType: mimeTypeFromPath(fullPath),
      checksum,
      categories,
      status: "indexing",
    });

    const job = await this.postgresProvider.createJob({
      documentId: document.id,
      jobType: "ingest-file",
      status: "running",
      totalItems,
      processedItems: 0,
      progressMessage: "Подготовка документа",
      startedAt: new Date(),
    });
    await this.postgresProvider.replaceJobNodeLinks(job.id, nodeIds);

    try {
      await this.ensureJobActive(job.id);
      const nodePayload = await this.prepareDocumentNodePayload(document.id, {
        nodeIds,
        primaryNodeId,
      });

      const insertedChunks = await this.postgresProvider.createChunks(document.id, chunks);
      let processedItems = await this.embedAndUpsertRecords({
        records: insertedChunks,
        jobId: job.id,
        totalItems,
        progressLabel: "Индексирование текста",
        getText: (chunk) => chunk.text_with_context,
        buildPayload: (chunk) => ({
          document_id: document.id,
          chunk_id: chunk.id,
          chunk_index: chunk.chunk_index,
          title: document.title,
          text: chunk.text,
          context: chunk.context,
          text_with_context: chunk.text_with_context,
          categories: chunk.categories,
          source_path: document.original_file_path,
          ...nodePayload,
        }),
      });

      await this.ensureJobActive(job.id);
      await this.postgresProvider.updateDocumentStatus(document.id, "indexed");

      let visualAssets = null;
      if (extracted.sourceType === "pdf" && this.visualAssetService && shouldCreateVisualAssets) {
        try {
          await this.ensureJobActive(job.id);
          await this.postgresProvider.updateJobProgress(job.id, {
            processedItems,
            totalItems,
            progressMessage: "Создание карточек PDF-страниц",
          });

          visualAssets = await this.visualAssetService.extractPdfPagePreviews({
            fullPath,
            documentId: document.id,
            title: document.title,
            pageTexts: extracted.pageTexts,
          });
          if (Array.isArray(visualAssets?.items)) {
            visualAssets.items = visualAssets.items.map((item) => {
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
          }
          if (Array.isArray(visualAssets?.items) && visualAssets.items.length > 0) {
            const insertedAssets = await this.postgresProvider.createDocumentAssets(
              document.id,
              visualAssets.items
            );
            const effectiveTotalItems = insertedChunks.length + insertedAssets.length;
            await this.postgresProvider.updateJobProgress(job.id, {
              processedItems,
              totalItems: effectiveTotalItems,
              progressMessage: "Индексирование PDF-страниц",
            });

            processedItems = await this.embedAndUpsertRecords({
              records: insertedAssets,
              jobId: job.id,
              totalItems: effectiveTotalItems,
              progressOffset: insertedChunks.length,
              progressLabel: "Индексирование PDF-страниц",
              getText: (asset) =>
                `${asset.title ?? ""}\n\n${asset.text_content ?? asset.text_excerpt ?? ""}`.trim(),
              buildPayload: (asset, index) => ({
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
                categories: categories ?? [],
                source_path: document.original_file_path,
                file_name: asset.file_name,
                relative_path: asset.relative_path,
                mime_type: asset.mime_type,
                ...nodePayload,
              }),
            });
          }
        } catch (error) {
          visualAssets = {
            ok: false,
            mode: "failed",
            error: error.message,
          };
          await this.postgresProvider.updateJobProgress(job.id, {
            processedItems,
            totalItems,
            progressMessage:
              "Текст документа проиндексирован, но предпросмотр PDF-страниц не создан",
          });
        }
      } else if (extracted.sourceType === "pdf" && !shouldCreateVisualAssets) {
        visualAssets = {
          ok: true,
          mode: "disabled-by-request",
          message: "Предпросмотр PDF-страниц отключён для ускорения импорта",
        };
      }

      await this.postgresProvider.updateJobStatus(job.id, "completed");

      return {
        documentId: document.id,
        title: document.title,
        relativePath: safeRelativePath,
        chunksIndexed: insertedChunks.length,
        visualAssets,
        nodePayload,
      };
    } catch (error) {
      if (error instanceof JobCancelledError) {
        await this.cleanupCancelledDocument({
          jobId: job.id,
          documentId: document.id,
        });
        throw error;
      }

      await this.postgresProvider.updateDocumentStatus(document.id, "failed");
      await this.postgresProvider.updateJobStatus(job.id, "failed", error.message);
      throw error;
    }
  }

  async ingestFolderFromRaw({
    relativeDir,
    categories = [],
    nodeIds = [],
    primaryNodeId = null,
    recursive = true,
    force = false,
    createVisualAssets = true,
  }) {
    const safeRelativeDir = assertSafeRelativePath(relativeDir);
    const fullDirPath = path.join(this.config.rawRoot, safeRelativeDir);
    const directoryStat = await fs.stat(fullDirPath).catch(() => null);

    if (!directoryStat || !directoryStat.isDirectory()) {
      throw new Error("Указанная папка не найдена внутри data/raw");
    }

    const files = [];
    const visitDirectory = async (currentRelativeDir) => {
      const currentFullDir = path.join(this.config.rawRoot, currentRelativeDir);
      const entries = await fs.readdir(currentFullDir, { withFileTypes: true });

      for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, "ru"))) {
        const entryRelativePath = path.posix.join(
          currentRelativeDir.replace(/\\/g, "/"),
          entry.name
        );

        if (entry.isDirectory()) {
          if (recursive) {
            await visitDirectory(entryRelativePath);
          }
          continue;
        }

        if (!entry.isFile() || !isSupportedFile(entry.name)) {
          continue;
        }

        files.push(entryRelativePath);
      }
    };

    await visitDirectory(safeRelativeDir.replace(/\\/g, "/"));

    if (files.length === 0) {
      return {
        relativeDir: safeRelativeDir.replace(/\\/g, "/"),
        totalFiles: 0,
        indexedCount: 0,
        failedCount: 0,
        items: [],
      };
    }

    const results = [];
    for (const relativePath of files) {
      try {
        const result = await this.ingestFileFromRaw({
          relativePath,
          categories,
          nodeIds,
          primaryNodeId,
          force,
          createVisualAssets,
        });
        results.push({
          ok: true,
          relativePath,
          documentId: result.documentId,
          title: result.title,
          chunksIndexed: result.chunksIndexed,
          skipped: result.skipped === true,
          skipReason: result.skipReason ?? null,
          nodePayload: result.nodePayload ?? null,
          sourceType: path.extname(relativePath).slice(1).toLowerCase(),
        });
      } catch (error) {
        results.push({
          ok: false,
          relativePath,
          error: error.message,
          sourceType: path.extname(relativePath).slice(1).toLowerCase(),
        });
      }
    }

    return {
      relativeDir: safeRelativeDir.replace(/\\/g, "/"),
      totalFiles: results.length,
      indexedCount: results.filter((item) => item.ok && item.skipped !== true).length,
      skippedCount: results.filter((item) => item.skipped === true).length,
      failedCount: results.filter((item) => !item.ok).length,
      items: results,
    };
  }
}
