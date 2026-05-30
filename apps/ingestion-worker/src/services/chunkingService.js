import { structuralChunker } from "../chunkers/sentenceChunker.js";

export function buildChunks({ text, title, categories = [], chunkingConfig = {} }) {
  // Слой 1: текстовые документы режутся структурно (по абзацам), целевой
  // размер — text_max_tokens. PDF-путь в этом сервисе не используется.
  const rawChunks = structuralChunker(text, {
    maxTokens: chunkingConfig.text_max_tokens ?? 220,
    overlapSentences: chunkingConfig.overlap_sentences ?? 2,
    minTokens: chunkingConfig.text_min_tokens ?? null,
  });

  return rawChunks.map((chunkText, index) => {
    const context = `Document: ${title}`;
    return {
      chunkIndex: index,
      text: chunkText,
      context,
      textWithContext: `${context}\n\n${chunkText}`,
      categories,
    };
  });
}
