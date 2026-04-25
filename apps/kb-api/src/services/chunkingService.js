function normalizeWhitespace(text) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitIntoSentences(text) {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function estimateTokens(text) {
  return Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.3);
}

export function estimateTokenCount(text) {
  return estimateTokens(text);
}

export function chunkTextDocument({
  text,
  title,
  categories = [],
  maxTokens = 450,
  overlapSentences = 2,
}) {
  const cleaned = normalizeWhitespace(text);
  const sentences = splitIntoSentences(cleaned);
  const chunks = [];

  if (sentences.length === 0) {
    return chunks;
  }

  let current = [];
  let currentTokens = 0;

  for (const sentence of sentences) {
    const sentenceTokens = estimateTokens(sentence);

    if (current.length > 0 && currentTokens + sentenceTokens > maxTokens) {
      const chunkText = current.join(" ").trim();
      chunks.push(chunkText);
      const overlap = current.slice(Math.max(0, current.length - overlapSentences));
      current = overlap;
      currentTokens = estimateTokens(current.join(" "));
    }

    current.push(sentence);
    currentTokens += sentenceTokens;
  }

  if (current.length > 0) {
    chunks.push(current.join(" ").trim());
  }

  return chunks.map((chunkText, index) => {
    const context = `Document: ${title}`;
    return {
      chunkIndex: index,
      text: chunkText,
      context,
      textWithContext: `${context}\n\n${chunkText}`,
      tokenEstimate: estimateTokens(chunkText),
      categories,
      sourceUrl: null,
      fileUrl: null,
    };
  });
}
