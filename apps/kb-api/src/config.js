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

const modelsConfig = readYamlFile(path.join(configDir, "models.yaml"), {
  chat: {
    provider: "ollama",
    model: process.env.CHAT_MODEL || "qwen3:4b",
    base_url: process.env.OLLAMA_BASE_URL || "http://host.docker.internal:11434",
  },
  embedding: {
    provider: "ollama",
    model: process.env.EMBEDDING_MODEL || "qwen3-embedding:0.6b",
    base_url: process.env.OLLAMA_BASE_URL || "http://host.docker.internal:11434",
  },
});

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
  parsedRoot: process.env.PARSED_ROOT || "/app/data/parsed",
  assetRoot: process.env.ASSET_ROOT || "/app/data/assets",
  qdrantCollection: process.env.QDRANT_COLLECTION || "local_rag_chunks",
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
};
