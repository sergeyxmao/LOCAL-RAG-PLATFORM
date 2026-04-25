import { sentenceChunker } from "../chunkers/sentenceChunker.js";

export function buildChunks({ text, title, categories = [], chunkingConfig = {} }) {
  const rawChunks = sentenceChunker(text, {
    maxTokens: chunkingConfig.max_tokens ?? 450,
    overlapSentences: chunkingConfig.overlap_sentences ?? 2,
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
