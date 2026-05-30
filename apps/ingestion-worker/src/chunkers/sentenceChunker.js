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

function splitIntoSentences(text) {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

// Legacy sentence-стратегия (PDF и обратная совместимость).
export function sentenceChunker(text, options = {}) {
  const maxTokens = options.maxTokens ?? 450;
  const overlapSentences = options.overlapSentences ?? 2;
  const sentences = splitIntoSentences(normalizeWhitespace(text));

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

// --- Слой 1: структурный чанкинг текстовых документов (docx/txt/md) ---
// Зеркало kb-api/src/services/chunkingService.js: режем по границам абзацев
// (\n\n; одиночный \n — вторичная граница), длинные блоки добиваем по
// предложениям, коротышей объединяем до minTokens. Реализации не должны
// разъезжаться между kb-api и ingestion-worker.
function splitStructuralBlocks(cleaned) {
  const paragraphs = cleaned
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const blocks = [];
  for (const paragraph of paragraphs) {
    const lines = paragraph
      .split(/\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length <= 1) {
      blocks.push(paragraph.trim());
    } else {
      for (const line of lines) {
        blocks.push(line);
      }
    }
  }
  return blocks;
}

function splitLongBlock(block, maxTokens, overlapSentences) {
  const sentences = splitIntoSentences(block);
  if (sentences.length <= 1) {
    return [block];
  }
  const pieces = [];
  let current = [];
  let currentTokens = 0;
  for (const sentence of sentences) {
    const sentenceTokens = estimateTokens(sentence);
    if (current.length > 0 && currentTokens + sentenceTokens > maxTokens) {
      pieces.push(current.join(" ").trim());
      current = current.slice(Math.max(0, current.length - overlapSentences));
      currentTokens = estimateTokens(current.join(" "));
    }
    current.push(sentence);
    currentTokens += sentenceTokens;
  }
  if (current.length > 0) {
    pieces.push(current.join(" ").trim());
  }
  return pieces.filter(Boolean);
}

export function structuralChunker(text, options = {}) {
  const maxTokens = options.maxTokens ?? 220;
  const overlapSentences = options.overlapSentences ?? 2;
  const minTokens = Number.isFinite(options.minTokens) && options.minTokens > 0
    ? Math.trunc(options.minTokens)
    : Math.max(40, Math.round(maxTokens * 0.3));

  const cleaned = normalizeWhitespace(text);
  const rawBlocks = splitStructuralBlocks(cleaned);

  const blocks = [];
  for (const block of rawBlocks) {
    if (estimateTokens(block) > maxTokens) {
      blocks.push(...splitLongBlock(block, maxTokens, overlapSentences));
    } else {
      blocks.push(block);
    }
  }

  const chunks = [];
  let current = [];
  let currentTokens = 0;
  const flush = () => {
    if (current.length > 0) {
      chunks.push(current.join("\n").trim());
      current = [];
      currentTokens = 0;
    }
  };

  for (const block of blocks) {
    const blockTokens = estimateTokens(block);
    if (current.length > 0 && currentTokens + blockTokens > maxTokens && currentTokens >= minTokens) {
      flush();
    }
    current.push(block);
    currentTokens += blockTokens;
  }
  flush();

  return chunks.filter(Boolean);
}
