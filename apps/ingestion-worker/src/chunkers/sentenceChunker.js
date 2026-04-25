function normalizeWhitespace(text) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function estimateTokens(text) {
  return Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.3);
}

export function sentenceChunker(text, options = {}) {
  const maxTokens = options.maxTokens ?? 450;
  const overlapSentences = options.overlapSentences ?? 2;
  const sentences = normalizeWhitespace(text)
    .split(/(?<=[.!?])\s+|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const chunks = [];
  let current = [];
  let currentTokens = 0;

  for (const sentence of sentences) {
    const sentenceTokens = estimateTokens(sentence);

    if (current.length > 0 && currentTokens + sentenceTokens > maxTokens) {
      chunks.push(current.join(" ").trim());
      current = current.slice(Math.max(0, current.length - overlapSentences));
      currentTokens = estimateTokens(current.join(" "));
    }

    current.push(sentence);
    currentTokens += sentenceTokens;
  }

  if (current.length > 0) {
    chunks.push(current.join(" ").trim());
  }

  return chunks;
}
