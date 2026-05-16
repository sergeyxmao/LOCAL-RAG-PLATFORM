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
import { BackupService } from "./services/backupService.js";
import { settingsApiRoutes } from "./routes/settingsApi.js";
import { backupApiRoutes } from "./routes/backupApi.js";
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

const app = Fastify({ logger: true });
await app.register(multipart);

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

const ingestionService = new IngestionService({
  config: appConfig,
  postgresProvider,
  qdrantProvider,
  embeddingProvider,
  extractorService,
  visualAssetService,
});

const searchService = new SearchService({
  embeddingProvider,
  qdrantProvider,
  retrievalConfig: appConfig.retrieval,
});
qdrantProvider.postgresProvider = postgresProvider;

const answerService = new AnswerService({
  chatProvider,
  searchService,
  postgresProvider,
  modelsConfig: appConfig.models,
});

const appSettingsService = new AppSettingsService({ postgresProvider });
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
