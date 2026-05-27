export class AnswerService {
  constructor({ chatProvider, searchService, postgresProvider, modelsConfig }) {
    this.chatProvider = chatProvider;
    this.searchService = searchService;
    this.postgresProvider = postgresProvider;
    this.modelsConfig = modelsConfig;
  }

  translateAssetClass(assetClass) {
    const labels = {
      title: "титул",
      contents: "содержание",
      changelog: "изменения",
      legal: "юридическая страница",
      signals: "сигналы и теги",
      table: "таблица",
      scheme: "схема",
      screen: "экран",
      text: "текст",
      empty: "пустая страница",
      unknown: "не определено",
    };

    return labels[assetClass] ?? assetClass ?? "не определено";
  }

  translateModelStatus(status) {
    const text = String(status || "").trim();
    if (!text) {
      return "неизвестная ошибка модели";
    }

    const normalized = text.toLowerCase();

    if (
      normalized.includes("this operation was aborted") ||
      normalized.includes("operation was aborted") ||
      normalized === "aborted"
    ) {
      return "операция модели была прервана";
    }

    if (normalized.includes("timeout")) {
      return "модель не успела ответить за отведённое время";
    }

    if (normalized.includes("connection refused")) {
      return "нет соединения с локальной моделью";
    }

    if (normalized.includes("econnreset") || normalized.includes("socket hang up")) {
      return "соединение с локальной моделью было разорвано";
    }

    return text;
  }

  describeSource(source, index) {
    const lines = [`Источник ${index + 1}:`, `Заголовок: ${source.title}`];

    if (source.source_path) {
      lines.push(`Путь: ${source.source_path}`);
    }

    if (Array.isArray(source.node_paths) && source.node_paths.length > 0) {
      lines.push(`Разделы: ${source.node_paths.join("; ")}`);
    }

    if (source.resource_type === "asset") {
      if (typeof source.page_number === "number") {
        lines.push(`Страница: ${source.page_number}`);
      }
      if (source.asset_class) {
        lines.push(`Тип страницы: ${this.translateAssetClass(source.asset_class)}`);
      }
      if (source.asset_url) {
        lines.push(`Ссылка на страницу: ${source.asset_url}`);
      }
      if (source.asset_preview_url) {
        lines.push(`Ссылка на предпросмотр: ${source.asset_preview_url}`);
      }
      if (Array.isArray(source.signal_tags) && source.signal_tags.length > 0) {
        lines.push(`Теги/сигналы: ${source.signal_tags.join(", ")}`);
      }
    } else {
      lines.push(`Чанк: ${source.chunk_index}`);
    }

    lines.push(source.text);
    return lines.join("\n");
  }

  buildFallbackAnswer(question, sources, { nodeId = null, nodeName = null } = {}) {
    if (!sources.length) {
      return {
        answer: nodeId
          ? `В выбранном разделе${nodeName ? ` «${nodeName}»` : ""} подходящие источники не найдены.`
          : "Для этого вопроса не найдено подходящих источников.",
        mode: "fallback-empty",
      };
    }

    const bestSource = sources[0];
    const condensedText = bestSource.text.replace(/\s+/g, " ").trim().slice(0, 320);
    const answerLines = [
      "Быстрый запасной ответ по лучшему найденному источнику [1].",
      `Вопрос: ${question}`,
      `Лучший источник говорит: ${condensedText}`,
    ];

    if (bestSource.resource_type === "asset" && typeof bestSource.page_number === "number") {
      answerLines.push(`Лучшая страница: ${bestSource.page_number}`);
    }

    if (bestSource.asset_class) {
      answerLines.push(
        `Лучший тип страницы: ${this.translateAssetClass(bestSource.asset_class)}`
      );
    }

    if (bestSource.asset_url) {
      answerLines.push(`Ссылка на страницу: ${bestSource.asset_url}`);
    } else if (bestSource.asset_preview_url) {
      answerLines.push(`Ссылка на предпросмотр: ${bestSource.asset_preview_url}`);
    }
    if (Array.isArray(bestSource.signal_tags) && bestSource.signal_tags.length > 0) {
      answerLines.push(`Теги/сигналы: ${bestSource.signal_tags.join(", ")}`);
    }

    const answer = answerLines.join("\n");

    return {
      answer,
      mode: "fallback-source-snippet",
    };
  }

  async answerQuestion(
    question,
    {
      limit = 4,
      scope = "all",
      assetClass = "all",
      engineeringTopic = "all",
      signalTag = "all",
      documentId = null,
      documentIds = [],
      selectedTags = [],
      nodeId = null,
      nodeIds = [],
      includeChildren = true,
    } = {}
  ) {
    const startedAt = Date.now();
    const hybrid = await this.searchService.hybridSearch(question, {
      limit,
      scope,
      assetClass,
      engineeringTopic,
      signalTag,
      documentId,
      documentIds,
      selectedTags,
      nodeId,
      nodeIds,
      includeChildren,
    });
    const sources = hybrid.items;
    const rerankingInfo = hybrid.reranking || null;
    const hydeInfo = hybrid.hyde || null;

    if (sources.length === 0) {
      const fallback = this.buildFallbackAnswer(question, sources, {
        nodeId: hybrid.debug?.node_id,
        nodeName: hybrid.debug?.node_name,
      });
      const answer = fallback.answer;

      await this.postgresProvider.logQuery({
        question,
        answer,
        sources,
        chatModel: this.modelsConfig.chat.model,
        embeddingModel: this.modelsConfig.embedding.model,
        latencyMs: Date.now() - startedAt,
      });

      return {
        answer,
        sources,
        mode: fallback.mode,
        reranking: rerankingInfo,
        hyde: hydeInfo,
      };
    }

    const contextBlock = sources
      .map((source, index) => this.describeSource(source, index))
      .join("\n\n---\n\n");

    let answer;
    let mode = "llm";

    try {
      answer = await this.chatProvider.generate([
        {
          role: "system",
          content:
            "Ты локальный консультант по рабочим документам. Отвечай только по предоставленным источникам. Если источников недостаточно, скажи об этом прямо. Держи ответ кратким и добавляй ссылки на источники в виде [1], [2].",
        },
        {
          role: "user",
          content: `Вопрос:\n${question}\n\nИсточники:\n${contextBlock}`,
        },
      ]);
    } catch (error) {
      const fallback = this.buildFallbackAnswer(question, sources, {
        nodeId: hybrid.debug?.node_id,
        nodeName: hybrid.debug?.node_name,
      });
      answer = `${fallback.answer}\n\nСтатус модели: ${this.translateModelStatus(error.message)}`;
      mode = fallback.mode;
    }

    await this.postgresProvider.logQuery({
      question,
      answer,
      sources,
      chatModel: this.modelsConfig.chat.model,
      embeddingModel: this.modelsConfig.embedding.model,
      latencyMs: Date.now() - startedAt,
    });

    return {
      answer,
      sources,
      mode,
      reranking: rerankingInfo,
      hyde: hydeInfo,
    };
  }
}
