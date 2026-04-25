import { workerConfig } from "./config.js";

console.log("ingestion-worker started");
console.log(
  "ingestion-worker config",
  JSON.stringify(
    {
      chatModel: workerConfig.models?.chat?.model ?? null,
      embeddingModel: workerConfig.models?.embedding?.model ?? null,
      chunking: workerConfig.ingestion?.chunking ?? null,
    },
    null,
    2
  )
);

setInterval(() => {
  console.log("ingestion-worker heartbeat", new Date().toISOString());
}, 30000);
