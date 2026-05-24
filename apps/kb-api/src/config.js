import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

function readYamlFile(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) {
      return fallback;
    }

    const raw = fs.readFileSync(filePath, "utf8");
    return yaml.load(raw) ?? fallback;
  } catch (error) {
    return fallback;
  }
}

const configDir = process.env.CONFIG_DIR || "/app/config";

const defaultModelsConfig = {
  chat: {
    provider: "ollama",
    model: process.env.CHAT_MODEL || "qwen3:4b",
    base_url: process.env.OLLAMA_BASE_URL || "http://host.docker.internal:11434",
  },
  embedding: {
    provider: "ollama",
    model: process.env.EMBEDDING_MODEL || "qwen3-embedding:0.6b",
    base_url: process.env.OLLAMA_BASE_URL || "http://host.docker.internal:11434",
    batch_size: Number(process.env.EMBEDDING_BATCH_SIZE || 8),
    max_input_chars: Number(process.env.EMBEDDING_MAX_INPUT_CHARS || 400),
  },
};

const rawModelsConfig = readYamlFile(path.join(configDir, "models.yaml"), {});
const embeddingBatchSize = Number(
  process.env.EMBEDDING_BATCH_SIZE ??
    rawModelsConfig.embedding?.batch_size ??
    defaultModelsConfig.embedding.batch_size
);
const embeddingMaxInputChars = Number(
  process.env.EMBEDDING_MAX_INPUT_CHARS ??
    rawModelsConfig.embedding?.max_input_chars ??
    defaultModelsConfig.embedding.max_input_chars
);
const modelsConfig = {
  chat: {
    ...defaultModelsConfig.chat,
    ...(rawModelsConfig.chat ?? {}),
  },
  embedding: {
    ...defaultModelsConfig.embedding,
    ...(rawModelsConfig.embedding ?? {}),
    batch_size: Number.isFinite(embeddingBatchSize)
      ? embeddingBatchSize
      : defaultModelsConfig.embedding.batch_size,
    max_input_chars: Number.isFinite(embeddingMaxInputChars)
      ? embeddingMaxInputChars
      : defaultModelsConfig.embedding.max_input_chars,
  },
};

const retrievalConfig = readYamlFile(path.join(configDir, "retrieval.yaml"), {
  semantic: { top_k: 12 },
  fusion: { top_k_final: 6 },
});

const ingestionConfig = readYamlFile(path.join(configDir, "ingestion.yaml"), {
  chunking: {
    strategy: "sentence",
    max_tokens: 450,
    overlap_sentences: 2,
  },
  visual_assets: {
    enabled: true,
    pdf_preview_pages: 4,
    pdf_scale: 2,
    ocr_command: "tesseract",
    ocr_lang: "rus+eng",
    ocr_timeout_ms: 60000,
    ocr_max_chars: 12000,
  },
  extractors: {
    txt: true,
    md: true,
  },
});

export const appConfig = {
  port: Number(process.env.KB_API_PORT || 8787),
  host: "0.0.0.0",
  dataRoot: process.env.DATA_ROOT || "/app/data",
  rawRoot: process.env.RAW_ROOT || "/app/data/raw",
  hostRawRoot: process.env.HOST_RAW_ROOT || "",
  parsedRoot: process.env.PARSED_ROOT || "/app/data/parsed",
  assetRoot: process.env.ASSET_ROOT || "/app/data/assets",
  qdrantCollection: process.env.QDRANT_COLLECTION || "local_rag_chunks",
  knowledgeNodes: {
    requireNodeIdsForImport: ["1", "true", "yes", "on", "да"].includes(
      String(process.env.REQUIRE_NODE_IDS_FOR_IMPORT || "").toLowerCase()
    ),
    nodeTreeCacheMaxEntries: Number(process.env.NODE_TREE_CACHE_MAX_ENTRIES || 8),
    reconciliationIntervalMs: Number(
      process.env.NODE_RECONCILIATION_INTERVAL_MS || 6 * 60 * 60 * 1000
    ),
    reconciliationSampleLimit: Number(process.env.NODE_RECONCILIATION_SAMPLE_LIMIT || 25),
  },
  localOpen: {
    helperUrl: process.env.LOCAL_OPEN_HELPER_URL || "http://127.0.0.1:8788/open",
    tokenSecret: process.env.LOCAL_OPEN_TOKEN_SECRET || "local-rag-platform-dev-open-helper",
    tokenTtlSeconds: Number(process.env.LOCAL_OPEN_TOKEN_TTL_SECONDS || 30),
  },
  postgres: {
    host: process.env.POSTGRES_HOST || "postgres",
    port: Number(process.env.POSTGRES_PORT || 5432),
    user: process.env.POSTGRES_USER || "localrag",
    password: process.env.POSTGRES_PASSWORD || "localrag123",
    database: process.env.POSTGRES_DB || "localrag",
  },
  qdrantUrl: process.env.QDRANT_URL || "http://qdrant:6333",
  models: modelsConfig,
  retrieval: retrievalConfig,
  ingestion: ingestionConfig,
  reranker: {
    // Дефолтный URL локального reranker-сервиса. Используется, если в UI
    // настройки «Поиск → reranker» поле «URL локального сервиса» пустое.
    localUrl: process.env.RERANKER_LOCAL_URL || "http://localrag-reranker:8090",
    // Таймаут на сетевой вызов внешнего reranker'а (jina/local). При
    // превышении — graceful fallback на эвристику, поиск не падает.
    // Дефолт 45000 мс рассчитан на локальный bge-/Qwen3-reranker на CPU
    // слабого ноутбука (15–30 с на запрос с пулом 12–30 кандидатов).
    // На GPU/быстром CPU можно уменьшить через env RERANKER_TIMEOUT_MS.
    timeoutMs: Number(process.env.RERANKER_TIMEOUT_MS || 45000),
    // Эндпоинт облачного Jina по умолчанию.
    jinaUrl: process.env.RERANKER_JINA_URL || "https://api.jina.ai/v1/rerank",
    // Имя модели, которое мы просим у Jina (используется только в режиме jina).
    jinaModel: process.env.RERANKER_JINA_MODEL || "jina-reranker-v2-base-multilingual",
  },
};
