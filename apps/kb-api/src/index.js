import Fastify from "fastify";
import multipart from "@fastify/multipart";

import { appConfig } from "./config.js";
import { PostgresProvider } from "./providers/postgresProvider.js";
import { QdrantProvider } from "./providers/qdrantProvider.js";
import { OllamaEmbeddingProvider } from "./providers/ollamaEmbeddingProvider.js";
import { OllamaChatProvider } from "./providers/ollamaChatProvider.js";
import { CloudChatProvider } from "./providers/cloudChatProvider.js";
import { ExtractorService } from "./services/extractorService.js";
import { IngestionService } from "./services/ingestionService.js";
import { SearchService } from "./services/searchService.js";
import { AnswerService } from "./services/answerService.js";
import { VisualAssetService } from "./services/visualAssetService.js";
import { ChatSessionService } from "./services/chatSessionService.js";
import { AppSettingsService } from "./services/appSettingsService.js";
import { DiagnosticsService } from "./services/diagnosticsService.js";
import { OcrService } from "./services/ocrService.js";
import { Semaphore } from "./utils/semaphore.js";
import { BackupService } from "./services/backupService.js";
import { settingsApiRoutes } from "./routes/settingsApi.js";
import { backupApiRoutes } from "./routes/backupApi.js";
import { diagnosticsRoutes } from "./routes/diagnosticsApi.js";
import { healthRoutes } from "./routes/health.js";
import { settingsRoutes } from "./routes/settings.js";
import { documentRoutes } from "./routes/documents.js";
import { searchRoutes } from "./routes/search.js";
import { askRoutes } from "./routes/ask.js";
import { tagRoutes } from "./routes/tags.js";
import { jobRoutes } from "./routes/jobs.js";
import { nodeRoutes } from "./routes/nodes.js";
import { adminRoutes } from "./routes/admin.js";
import { uiStateRoutes } from "./routes/uiState.js";
import { uiRoutes } from "./routes/ui.js";
import { uiV2Routes } from "./routes/uiV2.js";
import { chatSessionRoutes } from "./routes/chatSessions.js";
import { parseTagList } from "./utils/tags.js";

async function runTagsNormalizationMigration({ postgresProvider, qdrantProvider, appSettingsService, logger }) {
  try {
    const done = await appSettingsService.getMigrationFlag("tagsNormalized");
    if (done) return;
    const { rows } = await postgresProvider.pool.query(
      "SELECT id, categories FROM documents WHERE jsonb_typeof(categories) = 'array'"
    );
    let touched = 0;
    let qdrantSynced = 0;
    let qdrantFailed = 0;
    for (const row of rows) {
      const before = Array.isArray(row.categories) ? row.categories : [];
      if (before.length === 0) continue;
      const after = parseTagList(before);
      const same =
        before.length === after.length && before.every((value, idx) => value === after[idx]);
      if (same) continue;
      await postgresProvider.updateDocumentCategories(row.id, after);
      touched += 1;
      try {
        const pointIds = await postgresProvider.getDocumentPointIds(row.id);
        if (pointIds.length > 0) {
          await qdrantProvider.setPayload(pointIds, { categories: after });
          qdrantSynced += 1;
        }
      } catch (qErr) {
        qdrantFailed += 1;
        logger.warn({ documentId: row.id, err: qErr.message }, "Qdrant payload sync skipped during tag migration");
      }
    }
    await appSettingsService.setMigrationFlag("tagsNormalized");
    if (touched > 0) {
      logger.info({ touched, qdrantSynced, qdrantFailed }, "Tags normalized for existing documents");
    } else {
      logger.info("Tag normalization migration: nothing to update");
    }
  } catch (error) {
    logger.error({ err: error }, "Tag normalization migration failed");
  }
}

const app = Fastify({ logger: true });
await app.register(multipart, {
  limits: {
    files: 1000,
    fileSize: 500 * 1024 * 1024,
    fields: 20,
    fieldSize: 1024 * 1024,
  },
});

const postgresProvider = new PostgresProvider(appConfig.postgres);
await postgresProvider.ensureRuntimeSchema();
const staleJobs = await postgresProvider.failStaleRunningJobs();
const qdrantProvider = new QdrantProvider({
  url: appConfig.qdrantUrl,
  collectionName: appConfig.qdrantCollection,
});
const embeddingProvider = new OllamaEmbeddingProvider({
  baseUrl: appConfig.models.embedding.base_url,
  model: appConfig.models.embedding.model,
  batchSize: Number(appConfig.models.embedding.batch_size || 8),
  maxInputChars: Number(appConfig.models.embedding.max_input_chars || 400),
  unloadModels: [appConfig.models.chat.model],
});
const chatProvider = new OllamaChatProvider({
  baseUrl: appConfig.models.chat.base_url,
  model: appConfig.models.chat.model,
});
const extractorService = new ExtractorService({
  parsedRoot: appConfig.parsedRoot,
});
const visualAssetService = new VisualAssetService({
  assetRoot: appConfig.assetRoot,
  options: appConfig.ingestion.visual_assets,
});

const ocrService = new OcrService({ logger: app.log });

const appSettingsService = new AppSettingsService({
  postgresProvider,
  retrievalDefaults: appConfig.retrieval,
});
await appSettingsService.refreshRetrievalCache();

const indexingSettings = await appSettingsService.getIndexingSettings();
const indexingSemaphore = new Semaphore(indexingSettings.concurrency);
app.log.info(
  { concurrency: indexingSettings.concurrency },
  "Indexing semaphore initialised"
);

const ingestionService = new IngestionService({
  config: appConfig,
  postgresProvider,
  qdrantProvider,
  embeddingProvider,
  extractorService,
  visualAssetService,
  ocrService,
  appSettingsService,
  indexingSemaphore,
});

const diagnosticsService = new DiagnosticsService({
  postgresProvider,
  qdrantProvider,
});
await runTagsNormalizationMigration({ postgresProvider, qdrantProvider, appSettingsService, logger: app.log });

const searchService = new SearchService({
  embeddingProvider,
  qdrantProvider,
  retrievalConfig: appConfig.retrieval,
  appSettingsService,
});
qdrantProvider.postgresProvider = postgresProvider;

const answerService = new AnswerService({
  chatProvider,
  searchService,
  postgresProvider,
  modelsConfig: appConfig.models,
});
const cloudChatProvider = new CloudChatProvider();
const backupService = new BackupService({
  postgresConfig: appConfig.postgres,
  backupRoot: `${appConfig.dataRoot}/backups`,
  logger: app.log,
});

const chatSessionService = new ChatSessionService({
  postgresProvider,
  answerService,
  searchService,
  chatProvider,
  cloudChatProvider,
  appSettingsService,
  modelsConfig: appConfig.models,
});

app.decorate("config", appConfig);
app.decorate("postgresProvider", postgresProvider);
app.decorate("qdrantProvider", qdrantProvider);
app.decorate("embeddingProvider", embeddingProvider);
app.decorate("chatProvider", chatProvider);
app.decorate("extractorService", extractorService);
app.decorate("visualAssetService", visualAssetService);
app.decorate("ingestionService", ingestionService);
app.decorate("searchService", searchService);
app.decorate("answerService", answerService);
app.decorate("chatSessionService", chatSessionService);
app.decorate("appSettingsService", appSettingsService);
app.decorate("diagnosticsService", diagnosticsService);
app.decorate("ocrService", ocrService);
app.decorate("indexingSemaphore", indexingSemaphore);
app.decorate("cloudChatProvider", cloudChatProvider);
app.decorate("backupService", backupService);

await app.register(healthRoutes);
await app.register(settingsRoutes);
await app.register(documentRoutes);
await app.register(searchRoutes);
await app.register(askRoutes);
await app.register(tagRoutes);
await app.register(jobRoutes);
await app.register(nodeRoutes);
await app.register(adminRoutes);
await app.register(uiStateRoutes);
await app.register(settingsApiRoutes);
await app.register(chatSessionRoutes);
await app.register(backupApiRoutes);
await app.register(diagnosticsRoutes);
await app.register(uiRoutes);
await app.register(uiV2Routes);

app.addHook("onClose", async () => {
  await postgresProvider.close();
});

app
  .listen({ port: appConfig.port, host: appConfig.host })
  .then(() => {
    if (staleJobs.length > 0) {
      app.log.warn(
        { staleJobs: staleJobs.length },
        "Marked stale running ingestion jobs as failed after restart"
      );
    }
    app.log.info(`kb-api started on http://${appConfig.host}:${appConfig.port}`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
