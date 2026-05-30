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

// --- Слой 1: структурный чанкинг текстовых документов (docx/txt/md) ---
//
// Текст режется СНАЧАЛА по границам абзацев (пустая строка, \n\n), затем
// одиночный \n — вторичная граница (записи журнала, элементы списка).
// Разнородные блоки НЕ склеиваются в один большой кусок через join(" ").
// Внутри длинного блока добиваем по предложениям. Очень короткие соседние
// блоки объединяются до нижнего порога minTokens, чтобы не плодить чанки в
// несколько слов. Соседние блоки в одном чанке соединяются через "\n",
// сохраняя смысловую границу.
//
// Применяется ТОЛЬКО к текстовым документам. PDF-путь (постраничные
// asset-чанки) использует legacy sentence-стратегию и не затрагивается.

function splitStructuralBlocks(cleaned) {
  // Первичная граница — пустая строка (абзац). Внутри абзаца одиночный
  // перенос строки трактуется как вторичная граница (отдельная запись).
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
      const overlap = current.slice(Math.max(0, current.length - overlapSentences));
      current = overlap;
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

function chunkTextStructural(cleaned, { maxTokens, overlapSentences, minTokens }) {
  const rawBlocks = splitStructuralBlocks(cleaned);

  // Длинные блоки добиваем по предложениям до maxTokens.
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
    // Перебор лимита — закрываем текущий чанк (но не дробим уже короткий,
    // если он ещё не дотянул до нижнего порога — добиваем коротышей).
    if (current.length > 0 && currentTokens + blockTokens > maxTokens && currentTokens >= minTokens) {
      flush();
    }
    current.push(block);
    currentTokens += blockTokens;
  }
  flush();

  return chunks.filter(Boolean);
}

export function chunkTextDocument({
  text,
  title,
  categories = [],
  maxTokens = 450,
  overlapSentences = 2,
  structural = false,
  minTokens = null,
}) {
  const cleaned = normalizeWhitespace(text);

  let chunks;
  if (structural) {
    const lowerBound =
      Number.isFinite(minTokens) && minTokens > 0
        ? Math.trunc(minTokens)
        : Math.max(40, Math.round(maxTokens * 0.3));
    chunks = chunkTextStructural(cleaned, {
      maxTokens,
      overlapSentences,
      minTokens: lowerBound,
    });
  } else {
    // Legacy sentence-стратегия (PDF-путь, обратная совместимость).
    const sentences = splitIntoSentences(cleaned);
    chunks = [];
    if (sentences.length === 0) {
      return chunks;
    }
    let current = [];
    let currentTokens = 0;
    for (const sentence of sentences) {
      const sentenceTokens = estimateTokens(sentence);
      if (current.length > 0 && currentTokens + sentenceTokens > maxTokens) {
        chunks.push(current.join(" ").trim());
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
  }

  if (chunks.length === 0) {
    return [];
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
