export function buildEmbeddingJobPayload(chunks, modelName) {
  return chunks.map((chunk) => ({
    model: modelName,
    input: chunk.textWithContext,
  }));
}
