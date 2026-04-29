function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function countMatches(text, patterns) {
  return patterns.reduce((total, pattern) => total + (pattern.test(text) ? 1 : 0), 0);
}

function uniqueValues(items, limit = 20) {
  return Array.from(new Set(items.filter(Boolean))).slice(0, limit);
}

function countWords(text) {
  if (!text) {
    return 0;
  }

  return text.split(/\s+/).filter(Boolean).length;
}

function extractSignalTags(text) {
  const matches =
    text.match(
      /\b[a-zа-я]{1,10}[-_]\d{1,5}[a-zа-я0-9_-]*\b|\b[a-zа-я]{2,10}\d{2,5}[a-zа-я0-9_-]*\b/gi
    ) ?? [];

  return uniqueValues(matches.map((item) => item.toUpperCase()), 20);
}

function collectEngineeringTopics(text) {
  const topics = [];
  const topicPatterns = [
    {
      topic: "PCS",
      patterns: [/\bpcs\b/i, /process control system/i, /система управления технологическим процессом/i],
    },
    {
      topic: "PCR",
      patterns: [/\bpcr\b/i],
    },
    {
      topic: "I/O",
      patterns: [/\bi\/o\b/i, /ввод\s*\/\s*вывод/i, /ввода\s*\/\s*вывода/i],
    },
    {
      topic: "SCADA/HMI",
      patterns: [/\bscada\b/i, /\bhmi\b/i, /мнемосхем/i, /операторск/i, /operator station/i],
    },
    {
      topic: "Аварии",
      patterns: [/\balarm\b/i, /авари/i, /тревог/i, /alarm summary/i, /alarm list/i],
    },
    {
      topic: "Interlock",
      patterns: [/\binterlock\b/i, /блокиров/i],
    },
    {
      topic: "Сеть",
      patterns: [/\bnetwork\b/i, /\bethernet\b/i, /\bmodbus\b/i, /\bopc\b/i, /\bprofinet\b/i, /\bprofibus\b/i, /топологи/i, /архитектур/i],
    },
    {
      topic: "Контроллеры",
      patterns: [/\bcontroller\b/i, /контроллер/i, /процессорн/i, /cpu/i],
    },
    {
      topic: "Шкафы/станции",
      patterns: [/\bcabinet\b/i, /шкаф/i, /\bstation\b/i, /станци/i],
    },
    {
      topic: "Резервирование",
      patterns: [/\bredundan/i, /резервирован/i],
    },
    {
      topic: "Сигналы/теги",
      patterns: [/\bsignal\b/i, /сигнал/i, /\btag\b/i, /тег/i, /channel/i, /канал/i],
    },
    {
      topic: "Схемы",
      patterns: [/схем/i, /diagram/i, /drawing/i, /чертеж/i, /подключени/i, /структур/i],
    },
    {
      topic: "Электрика/клеммы",
      patterns: [/terminal/i, /клемм/i, /wiring/i, /кабел/i, /шкаф/i, /cabinet/i, /монтажн/i],
    },
    {
      topic: "Функциональные блоки",
      patterns: [/functional block/i, /функциональн.*блок/i, /\bpid\b/i, /\bramp/i, /\bint\b/i],
    },
    {
      topic: "Регулирование",
      patterns: [/\bpid\b/i, /регулирован/i, /setpoint/i, /уставк/i, /контур/i],
    },
    {
      topic: "Параметры",
      patterns: [/\bparameter\b/i, /параметр/i, /\bsetpoint\b/i, /уставк/i, /priority/i, /приоритет/i],
    },
  ];

  for (const { topic, patterns } of topicPatterns) {
    if (countMatches(text, patterns) > 0) {
      topics.push(topic);
    }
  }

  return topics;
}

function countLineMatches(text, predicate) {
  return String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter(predicate).length;
}

function countRegexMatches(text, pattern) {
  return String(text ?? "").match(pattern)?.length ?? 0;
}

function buildScores(combinedText, textStart, signalTags, rawText = "") {
  const scores = {
    title: 0,
    contents: 0,
    changelog: 0,
    legal: 0,
    signals: 0,
    table: 0,
    scheme: 0,
    screen: 0,
    text: 0,
  };
  const raw = String(rawText ?? "");
  const dottedLeaderLines = countLineMatches(raw, (line) =>
    /[.·]{4,}\s*\d{1,4}\s*$/.test(line) || /(?:[.·]\s*){4,}\d{1,4}\s*$/.test(line)
  );
  const columnLikeLines = countLineMatches(raw, (line) => {
    const columns = line.split(/\t|\s{2,}|\s+\|\s+|;/).map((part) => part.trim()).filter(Boolean);
    return columns.length >= 3;
  });
  const shortDiagramLines = countLineMatches(raw, (line) =>
    line.length <= 90 && /[-─—>|<+*/\\()[\]{}]{3,}/.test(line)
  );
  const parameterRows = countLineMatches(raw, (line) =>
    /\b(default|type|range|unit|value|parameter|signal|tag|channel|address)\b|тип\s*:|значение|описание|адрес|клемм|канал|сигнал|параметр/i.test(line)
  );

  if (/комплект документации|document package|metso/.test(combinedText)) {
    scores.title += 2;
  }
  if (/функциональные блоки|functional block/.test(combinedText)) {
    scores.title += 2;
  }
  if (/архивные сведения об изменениях|история изменений|revision history|change history/.test(combinedText)) {
    scores.changelog += 5;
    scores.table += 1;
  }
  if (
    /все права защищены|лицензионным соглашением|оставляет за собой право|запрещается воспроизводить|copyright|all rights reserved/.test(
      combinedText
    )
  ) {
    scores.legal += 6;
  }
  if (
    /^содержание\b/.test(textStart) ||
    /^contents\b/.test(textStart) ||
    /\bсодержание\s+1\b/.test(combinedText) ||
    /\bcontents\s+1\b/.test(combinedText)
  ) {
    scores.contents += 5;
  }
  scores.contents += countMatches(combinedText, [
    /\b1\s+[а-яa-z]/,
    /\b2\s+[а-яa-z]/,
    /\b3\s+[а-яa-z]/,
    /резервирование pcs/,
    /табличные типы/,
    /типы ввода/,
    /главные интерактивные функции/,
  ]);
  if (dottedLeaderLines >= 3) {
    scores.contents += 6;
  } else if (dottedLeaderLines > 0) {
    scores.contents += 2;
  }
  if (countRegexMatches(raw, /\b\d{1,3}\.\d{1,3}\b/g) >= 6) {
    scores.contents += 2;
  }

  scores.table += countMatches(combinedText, [
    /таблиц|табличн|\btable\b/,
    /дата\s+редакция\s+замечания/,
    /\btag\b|тег|signal|сигнал/,
    /\bparameter\b|параметр|\bsetpoint\b|уставк|priority|приоритет|channel|канал/,
    /address|адрес|module|модул|terminal|клемм|unit|единиц/,
    /alarm list|signal list|перечень сигналов|список сигналов/,
  ]);
  if (columnLikeLines >= 5) {
    scores.table += 5;
  } else if (columnLikeLines >= 2) {
    scores.table += 2;
  }
  if (parameterRows >= 4) {
    scores.table += 3;
  }
  if (signalTags.length >= 3) {
    scores.table += 4;
  }

  scores.signals += countMatches(combinedText, [
    /signal list|перечень сигналов|список сигналов|tag list|список тегов|alarm list|список тревог/,
    /channel list|point list|alarm summary|signal summary/,
    /\btag\b|тег|signal|сигнал|channel|канал/,
    /\bai\b|\bao\b|\bdi\b|\bdo\b|\baio\b|\bdio\b|analog input|digital output/,
  ]);
  if (signalTags.length >= 3) {
    scores.signals += 3;
  }
  if (signalTags.length >= 6) {
    scores.signals += 2;
  }

  scores.screen += countMatches(combinedText, [
    /экран|\bhmi\b|operator station|display|trend|faceplate|мнемосхем|мнемосхема|\bscada\b/,
    /alarm list|список тревог|оператор|operator|overview|process display/,
    /human machine interface|alarm summary|trend display|face plate|screen dump|screenshot/,
    /кнопк|окно|панел|индикац|график|тренд|видеокадр/,
  ]);

  scores.scheme += countMatches(combinedText, [
    /схем|структур|архитектур|connection|network|interlock|flow diagram|loop diagram|topology/,
    /\bpcs\b|\bpcr\b|\bi\/o\b|ввод\s*\/\s*вывод|ввода\s*\/\s*вывода|controller|контроллер/,
    /cabinet|шкаф|station|станци|profibus|profinet|modbus|ethernet|opc|redundancy|резервирован/,
    /fieldbus|loop diagram|wiring|подключени|топологи/,
    /p&id|pid diagram|functional diagram|block diagram|блок-схем|принципиальн|монтажн|электрическ|чертеж/,
    /terminal|клемм|кабел|модул|rack|шина|bus|узел|node|line diagram|single line/,
  ]);
  if (shortDiagramLines >= 3) {
    scores.scheme += 3;
  }
  if (columnLikeLines >= 6 && scores.scheme >= 3) {
    scores.table += 1;
  }

  return scores;
}

function resolveConfidence(scores, assetClass) {
  const values = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const bestScore = values[0]?.[1] ?? 0;
  const secondScore = values[1]?.[1] ?? 0;

  if (assetClass === "text") {
    return bestScore >= 3 ? "средняя" : "базовая";
  }

  if (bestScore >= 6 && bestScore - secondScore >= 2) {
    return "высокая";
  }

  if (bestScore >= 4) {
    return "средняя";
  }

  return "базовая";
}

export function analyzePdfPageAsset({ pageNumber, title, text }) {
  const normalizedTitle = normalizeText(title);
  const normalizedText = normalizeText(text);
  const combined = `${normalizedTitle} ${normalizedText}`.trim();
  const rawText = `${title ?? ""}\n${text ?? ""}`.trim();
  const textStart = normalizedText.slice(0, 240);
  const wordCount = countWords(combined);
  const signalTags = extractSignalTags(combined);
  const engineeringTopics = collectEngineeringTopics(combined);

  if (!combined) {
    return {
      assetClass: "empty",
      confidence: "высокая",
      engineeringTopics,
      signalTags,
      scores: {},
    };
  }

  if (
    pageNumber === 1 &&
    wordCount <= 60 &&
    (/комплект документации/.test(combined) ||
      /функциональные блоки/.test(combined) ||
      /metso/.test(combined))
  ) {
    return {
      assetClass: "title",
      confidence: "высокая",
      engineeringTopics,
      signalTags,
      scores: { title: 8 },
    };
  }

  const scores = buildScores(combined, textStart, signalTags, rawText);
  let assetClass = "text";
  const looksLikeRepeatedFrontMatterHeader =
    wordCount <= 24 &&
    /функциональные блоки сервера управления технологическим процессом/.test(combined) &&
    /комплект документации/.test(combined) &&
    scores.contents === 0 &&
    scores.changelog === 0 &&
    scores.legal === 0 &&
    scores.signals === 0 &&
    scores.table === 0 &&
    scores.screen === 0;

  if (looksLikeRepeatedFrontMatterHeader) {
    return {
      assetClass: "text",
      confidence: "средняя",
      engineeringTopics,
      signalTags,
      scores,
    };
  }

  if (scores.changelog >= 4) {
    assetClass = "changelog";
  } else if (scores.legal >= 5) {
    assetClass = "legal";
  } else if (scores.contents >= 5 || (scores.contents >= 4 && scores.table >= 1)) {
    assetClass = "contents";
  } else if (scores.signals >= 5 && scores.signals >= scores.table && scores.signals >= scores.screen) {
    assetClass = "signals";
  } else if (scores.table >= 4 && scores.table >= scores.scheme && scores.table >= scores.screen) {
    assetClass = "table";
  } else if (scores.screen >= 3 && scores.screen >= scores.scheme) {
    assetClass = "screen";
  } else if (scores.scheme >= 3) {
    assetClass = "scheme";
  }

  return {
    assetClass,
    confidence: resolveConfidence(scores, assetClass),
    engineeringTopics,
    signalTags,
    scores,
  };
}

export function classifyPdfPageAsset(args) {
  return analyzePdfPageAsset(args).assetClass;
}
