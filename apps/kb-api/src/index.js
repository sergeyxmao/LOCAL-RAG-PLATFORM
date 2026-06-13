import Fastify from "fastify";
import multipart from "@fastify/multipart";

import { appConfig } from "./config.js";
import { PostgresProvider } from "./providers/postgresProvider.js";
import { QdrantProvider } from "./providers/qdrantProvider.js";
import { OllamaEmbeddingProvider } from "./providers/ollamaEmbeddingProvider.js";
import { GigachatEmbeddingProvider } from "./providers/gigachatEmbeddingProvider.js";
import { OllamaChatProvider } from "./providers/ollamaChatProvider.js";
import { CloudChatProvider } from "./providers/cloudChatProvider.js";
import { RerankerProvider } from "./providers/rerankerProvider.js";
import { ExtractorService } from "./services/extractorService.js";
import { IngestionService } from "./services/ingestionService.js";
import { SearchService } from "./services/searchService.js";
import { AnswerService } from "./services/answerService.js";
import { VisualAssetService } from "./services/visualAssetService.js";
import { ChatSessionService } from "./services/chatSessionService.js";
import { AppSettingsService } from "./services/appSettingsService.js";
import { DiagnosticsService } from "./services/diagnosticsService.js";
import { OcrService } from "./services/ocrService.js";
import { HydeService } from "./services/hydeService.js";
import { ContextualEnrichmentService } from "./services/contextualEnrichmentService.js";
import { KnowledgeExtractionService } from "./services/knowledgeExtractionService.js";
import { GraphService } from "./services/graphService.js";
import { GraphIngestionService, loadGraphConfigs } from "./services/graphIngestionService.js";
import { GraphConfigService } from "./services/graphConfigService.js";
import { GraphPreviewService } from "./services/graphPreviewService.js";
import { GraphNodeTypeService } from "./services/graphNodeTypeService.js";
import { GraphTreeService } from "./services/graphTreeService.js";
import { GraphSearchService } from "./services/graphSearchService.js";
import { GraphAnswerService } from "./services/graphAnswerService.js";
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
import { uiAssetRoutes } from "./routes/uiAssets.js";
import { chatSessionRoutes } from "./routes/chatSessions.js";
import { graphRoutes } from "./routes/graph.js";
import { graphExtractionRoutes } from "./routes/graphExtraction.js";
import { graphReparseRoutes } from "./routes/graphReparse.js";
import { graphProfilesRoutes } from "./routes/graphProfiles.js";
import { graphAliasesRoutes } from "./routes/graphAliases.js";
import { graphNodeTypeRoutes } from "./routes/graphNodeTypes.js";
import { graphTreeRoutes } from "./routes/graphTree.js";
import { graphSearchRoutes } from "./routes/graphSearch.js";
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

async function runOcrAllDefaultTrueMigration({ appSettingsService, logger }) {
  // #8.1.c.fix-2: владелец работает со сканами, дефолт «OCR для всех страниц
  // PDF» переключён на true. Эта миграция один раз переписывает уже
  // сохранённое значение false → true (если оно было явно false).
  // Запускается один раз: помечается флагом ocrAllDefaultTrue.
  try {
    const done = await appSettingsService.getMigrationFlag("ocrAllDefaultTrue");
    if (done) return;
    const current = await appSettingsService.getOcrSettings();
    // После смены дефолта в getOcrSettings: если raw.ocrAll был true или
    // отсутствовал — current.ocrAll уже true и обновление не нужно.
    // Принудительно подтверждаем true, чтобы значение лежало явно в БД
    // (полезно для diagnostics и UI), и помечаем миграцию.
    if (current.ocrAll !== true) {
      await appSettingsService.updateOcrSettings({
        autoOcrEmptyPages: current.autoOcrEmptyPages,
        ocrAll: true,
      });
      logger.info("OCR migration: ocrAll переключён на true (было false)");
    } else {
      logger.info("OCR migration: ocrAll уже true, изменений нет");
    }
    await appSettingsService.setMigrationFlag("ocrAllDefaultTrue");
  } catch (error) {
    logger.error({ err: error }, "OCR ocrAllDefaultTrue migration failed");
  }
}

const app = Fastify({
  logger: true,
  // Схемы валидации намеренно используют union-типы (например documentId
  // string|null, limit number|string) — parseNumber/parseTagList принимают
  // оба вида, а documentId/nodeId реально приходят как null. allowUnionTypes
  // подтверждает это AJV и убирает strict-предупреждения при компиляции схем.
  ajv: { customOptions: { allowUnionTypes: true } },
});
await app.register(multipart, {
  limits: {
    files: 1000,
    fileSize: 500 * 1024 * 1024,
    fields: 20,
    fieldSize: 1024 * 1024,
  },
});

// Базовые security-заголовки. Платформа локальная, но UI рендерит
// извлечённый из документов текст — заголовки дешёвые и снижают риск
// XSS/clickjacking без влияния на работу страниц.
app.addHook("onSend", async (_request, reply) => {
  reply.header("X-Content-Type-Options", "nosniff");
  reply.header("X-Frame-Options", "SAMEORIGIN");
  reply.header("Referrer-Policy", "same-origin");
});

// Единый формат ошибок. Ошибки валидации схем (Fastify по умолчанию отдаёт
// { statusCode, error, message }) приводятся к контракту приложения
// { ok:false, error }, который читают все клиенты (старый UI берёт data.error,
// новый — data.error/message). Прочие ошибки — поведение Fastify по умолчанию.
app.setErrorHandler((error, request, reply) => {
  if (error.validation) {
    request.log.info({ err: error, url: request.url }, "Запрос отклонён схемой валидации");
    reply.code(400).send({ ok: false, error: error.message });
    return;
  }
  request.log.error({ err: error, url: request.url }, "Необработанная ошибка запроса");
  reply.send(error);
});

const postgresProvider = new PostgresProvider(appConfig.postgres);
await postgresProvider.ensureRuntimeSchema();
const staleJobs = await postgresProvider.failStaleRunningJobs();
const qdrantProvider = new QdrantProvider({
  url: appConfig.qdrantUrl,
  collectionName: appConfig.qdrantCollection,
});
const embeddingProvider = (() => {
  const provider = String(appConfig.models.embedding.provider || "ollama").toLowerCase();
  if (provider === "gigachat" || provider === "sber") {
    return new GigachatEmbeddingProvider({
      authKey: process.env.GIGACHAT_AUTH_KEY,
      scope: process.env.GIGACHAT_SCOPE || "GIGACHAT_API_PERS",
      model: appConfig.models.embedding.model || "Embeddings",
      oauthUrl:
        process.env.GIGACHAT_OAUTH_URL ||
        "https://ngw.devices.sberbank.ru:9443/api/v2/oauth",
      apiUrl:
        process.env.GIGACHAT_EMBEDDINGS_URL ||
        "https://gigachat.devices.sberbank.ru/api/v1/embeddings",
      verifySsl: String(process.env.GIGACHAT_VERIFY_SSL ?? "true").toLowerCase() !== "false",
      caBundlePath: process.env.GIGACHAT_CA_BUNDLE || "",
      batchSize: Number(appConfig.models.embedding.batch_size || 32),
      maxInputChars: Number(appConfig.models.embedding.max_input_chars || 2500),
      requestTimeoutMs: Number(process.env.GIGACHAT_TIMEOUT_MS || 60000),
    });
  }
  return new OllamaEmbeddingProvider({
    baseUrl: appConfig.models.embedding.base_url,
    model: appConfig.models.embedding.model,
    batchSize: Number(appConfig.models.embedding.batch_size || 8),
    maxInputChars: Number(appConfig.models.embedding.max_input_chars || 400),
    unloadModels: [appConfig.models.chat.model],
  });
})();
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

const graphService = new GraphService({
  postgresProvider,
  logger: app.log,
});

const graphNodeTypeService = new GraphNodeTypeService({
  postgresProvider,
  logger: app.log,
});
try {
  await graphNodeTypeService.ensureBuiltinTypes();
} catch (err) {
  app.log.error({ err }, "Не удалось инициализировать встроенные типы узлов графа");
}

graphService.nodeTypeService = graphNodeTypeService;

const graphTreeService = new GraphTreeService({
  postgresProvider,
  graphNodeTypeService,
  logger: app.log,
});

const graphSearchService = new GraphSearchService({
  postgresProvider,
  logger: app.log,
});

// #8.3: граф знаний в answer-pipeline. Переиспользует graphSearchService и
// graphService (их методы не модифицируются).
const graphAnswerService = new GraphAnswerService({
  graphSearchService,
  graphService,
  logger: app.log,
});

const graphConfigDir = process.env.CONFIG_DIR || "/app/config";
const graphConfigs = loadGraphConfigs({ configDir: graphConfigDir, logger: app.log });
if (Array.isArray(graphConfigs.errors) && graphConfigs.errors.length > 0) {
  app.log.error(
    { errors: graphConfigs.errors },
    "Конфиги парсера графа невалидны — парсер вернёт ok=false на каждом XLSX"
  );
}

const graphIngestionService = new GraphIngestionService({
  graphService,
  postgresProvider,
  configs: graphConfigs,
  configDir: graphConfigDir,
  logger: app.log,
});

const graphBackupDir =
  process.env.GRAPH_CONFIG_BACKUP_DIR ||
  `${appConfig.dataRoot}/config-backups`;
const graphConfigService = new GraphConfigService({
  profilesPath: `${graphConfigDir}/graph-parsers.yaml`,
  aliasesPath: `${graphConfigDir}/graph-aliases.yaml`,
  backupDir: graphBackupDir,
  logger: app.log,
});
const graphPreviewService = new GraphPreviewService({
  graphConfigService,
  logger: app.log,
});

const cloudChatProvider = new CloudChatProvider({
  defaultTimeoutMs: appConfig.cloudChat.timeoutMs,
});

const contextualEnrichmentService = new ContextualEnrichmentService({
  cloudChatProvider,
  appSettingsService,
  globalEnabled: appConfig.ingestion?.contextual_enrichment?.enabled !== false,
  logger: app.log,
});

const knowledgeExtractionService = new KnowledgeExtractionService({
  cloudChatProvider,
  appSettingsService,
  postgresProvider,
  globalEnabled: appConfig.ingestion?.knowledge_extraction?.enabled !== false,
  logger: app.log,
});

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
  graphIngestionService,
  contextualEnrichmentService,
  logger: app.log,
});

const diagnosticsService = new DiagnosticsService({
  postgresProvider,
  qdrantProvider,
});
await runTagsNormalizationMigration({ postgresProvider, qdrantProvider, appSettingsService, logger: app.log });
await runOcrAllDefaultTrueMigration({ appSettingsService, logger: app.log });

const rerankerProvider = new RerankerProvider({
  defaultLocalUrl: appConfig.reranker.localUrl,
  defaultJinaUrl: appConfig.reranker.jinaUrl,
  defaultJinaModel: appConfig.reranker.jinaModel,
  defaultTimeoutMs: appConfig.reranker.timeoutMs,
});

const hydeService = new HydeService({
  cloudChatProvider,
  appSettingsService,
  logger: app.log,
});

const searchService = new SearchService({
  embeddingProvider,
  qdrantProvider,
  retrievalConfig: appConfig.retrieval,
  appSettingsService,
  rerankerProvider,
  rerankerConfig: appConfig.reranker,
  hydeService,
  logger: app.log,
});
qdrantProvider.postgresProvider = postgresProvider;

const answerService = new AnswerService({
  chatProvider,
  searchService,
  postgresProvider,
  modelsConfig: appConfig.models,
  graphAnswerService,
});
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
  graphAnswerService,
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
app.decorate("rerankerProvider", rerankerProvider);
app.decorate("hydeService", hydeService);
app.decorate("contextualEnrichmentService", contextualEnrichmentService);
app.decorate("knowledgeExtractionService", knowledgeExtractionService);
app.decorate("backupService", backupService);
app.decorate("graphService", graphService);
app.decorate("graphIngestionService", graphIngestionService);
app.decorate("graphConfigService", graphConfigService);
app.decorate("graphPreviewService", graphPreviewService);
app.decorate("graphNodeTypeService", graphNodeTypeService);
app.decorate("graphTreeService", graphTreeService);
app.decorate("graphSearchService", graphSearchService);
app.decorate("graphAnswerService", graphAnswerService);

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
await app.register(graphRoutes);
await app.register(graphExtractionRoutes);
await app.register(graphReparseRoutes);
await app.register(graphProfilesRoutes);
await app.register(graphAliasesRoutes);
await app.register(graphNodeTypeRoutes);
await app.register(graphTreeRoutes);
await app.register(graphSearchRoutes);
await app.register(uiRoutes);
await app.register(uiV2Routes);
await app.register(uiAssetRoutes);

app.addHook("onClose", async () => {
  await postgresProvider.close();
});

// Graceful shutdown: docker stop шлёт SIGTERM — закрываем HTTP-сервер и пул
// PostgreSQL штатно, вместо обрыва соединений по таймауту контейнера.
let shuttingDown = false;
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    if (shuttingDown) return;
    shuttingDown = true;
    app.log.info({ signal }, "Получен сигнал остановки, завершаем работу");
    const forceExit = setTimeout(() => {
      app.log.warn("Штатное завершение не уложилось в 10 секунд, выходим принудительно");
      process.exit(1);
    }, 10000);
    forceExit.unref();
    app
      .close()
      .then(() => process.exit(0))
      .catch((err) => {
        app.log.error({ err }, "Ошибка при штатном завершении");
        process.exit(1);
      });
  });
}

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
