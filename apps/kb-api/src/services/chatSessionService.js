import { CloudProviderError } from "../providers/cloudChatProvider.js";
import { renderSystemPrompt } from "./systemPromptService.js";

const DEFAULT_TITLE = "Новый чат";
const MAX_TITLE_LENGTH = 60;
const SUPPORTED_MODES = new Set(["answer", "pages"]);
const SUPPORTED_PROVIDERS = new Set(["local", "cloud"]);
const CLOUD_PROVIDER_PREFIX = "cloud:";
const CLOUD_HISTORY_PAIRS = 6;

function buildTitleFromContent(content) {
  if (typeof content !== "string") {
    return DEFAULT_TITLE;
  }
  const trimmed = content.replace(/\s+/g, " ").trim();
  if (!trimmed) {
    return DEFAULT_TITLE;
  }
  if (trimmed.length <= MAX_TITLE_LENGTH) {
    return trimmed;
  }
  return `${trimmed.slice(0, MAX_TITLE_LENGTH - 1).trimEnd()}…`;
}

function normalizeMode(value) {
  const text = String(value ?? "").trim().toLowerCase();
  return SUPPORTED_MODES.has(text) ? text : "answer";
}

function normalizeProvider(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "local";
  const lower = raw.toLowerCase();
  if (SUPPORTED_PROVIDERS.has(lower)) return lower;
  if (lower.startsWith(CLOUD_PROVIDER_PREFIX)) {
    const id = raw.slice(CLOUD_PROVIDER_PREFIX.length).trim();
    return id ? `${CLOUD_PROVIDER_PREFIX}${id}` : "cloud";
  }
  return "local";
}

function isCloudProvider(value) {
  if (!value) return false;
  if (value === "cloud") return true;
  return typeof value === "string" && value.startsWith(CLOUD_PROVIDER_PREFIX);
}

function extractProviderId(value) {
  if (typeof value !== "string") return null;
  if (!value.startsWith(CLOUD_PROVIDER_PREFIX)) return null;
  const id = value.slice(CLOUD_PROVIDER_PREFIX.length).trim();
  return id || null;
}

function normalizeFilters(value) {
  if (!value || typeof value !== "object") {
    return { nodeIds: [], documentIds: [], tags: [] };
  }
  const nodeIds = Array.isArray(value.nodeIds)
    ? value.nodeIds.map((id) => String(id).trim()).filter(Boolean)
    : [];
  const documentIds = Array.isArray(value.documentIds)
    ? value.documentIds.map((id) => String(id).trim()).filter(Boolean)
    : [];
  const tags = Array.isArray(value.tags)
    ? value.tags.map((t) => String(t).trim()).filter(Boolean)
    : [];
  return { nodeIds, documentIds, tags };
}

function mapMessageRow(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role,
    content: row.content,
    sources: row.sources ?? [],
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

function mapSessionRow(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    title: row.title,
    mode: row.mode,
    filters: row.filters ?? { nodeIds: [], documentIds: [], tags: [] },
    provider: row.provider || "local",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isEmptyReasoningResult(result) {
  if (!result || result.aborted) return false;
  const hasContent = typeof result.content === "string" && result.content.trim().length > 0;
  if (hasContent) return false;
  return result.finishReason === "length" || result.thinkingMode === "reasoning";
}

function buildEmptyReasoningMessage(maxTokens) {
  const limitText = Number.isFinite(maxTokens) ? `${maxTokens}` : "текущий";
  return (
    `Модель израсходовала весь лимит токенов на рассуждение (${limitText}) ` +
    `и не успела сформировать ответ. Увеличьте «Максимальную длину ответа» ` +
    `в настройках или упростите вопрос.`
  );
}

function compactSourceForStorage(source) {
  if (!source || typeof source !== "object") {
    return null;
  }
  // #8.3: графовый источник хранится своей компактной формой с origin:"graph",
  // чтобы UI мог отрисовать карточку графа и считать факты для бейджа.
  if (source.origin === "graph") {
    return {
      origin: "graph",
      resourceType: "graph_node",
      documentId: null,
      documentName: source.title ?? source.graph_type ?? "Узел графа",
      graphNodeId: source.graph_node_id ?? source.graphNodeId ?? null,
      graphType: source.graph_type ?? source.graphType ?? null,
      graphAttributes:
        source.graph_attributes ?? source.graphAttributes ?? {},
      graphRelations: Array.isArray(source.graph_relations)
        ? source.graph_relations
        : Array.isArray(source.graphRelations)
          ? source.graphRelations
          : [],
      snippet:
        typeof source.text === "string"
          ? source.text.slice(0, 600)
          : source.snippet ?? null,
    };
  }
  return {
    documentId: source.document_id ?? source.documentId ?? null,
    documentName: source.title ?? source.document_name ?? source.documentName ?? null,
    sourcePath: source.source_path ?? source.sourcePath ?? null,
    resourceType: source.resource_type ?? source.resourceType ?? null,
    page: source.page_number ?? source.page ?? null,
    chunkIndex: source.chunk_index ?? source.chunkIndex ?? null,
    snippet:
      typeof source.text === "string" ? source.text.slice(0, 600) : source.snippet ?? null,
    // Слой 2: контекстное обогащение — метаданные для отображения в карточке.
    chunkContext: source.chunk_context ?? source.chunkContext ?? null,
    chunkSummary: source.chunk_summary ?? source.chunkSummary ?? null,
    chunkTags: Array.isArray(source.chunk_tags)
      ? source.chunk_tags
      : Array.isArray(source.chunkTags)
        ? source.chunkTags
        : [],
    score: source.score ?? null,
    assetClass: source.asset_class ?? source.assetClass ?? null,
    assetUrl: source.asset_url ?? source.assetUrl ?? null,
    assetPreviewUrl: source.asset_preview_url ?? source.assetPreviewUrl ?? null,
    nodePaths: Array.isArray(source.node_paths)
      ? source.node_paths
      : Array.isArray(source.nodePaths)
        ? source.nodePaths
        : [],
    signalTags: Array.isArray(source.signal_tags)
      ? source.signal_tags
      : Array.isArray(source.signalTags)
        ? source.signalTags
        : [],
  };
}

export class ChatSessionService {
  constructor({
    postgresProvider,
    answerService,
    searchService,
    chatProvider,
    cloudChatProvider,
    appSettingsService,
    modelsConfig,
    graphAnswerService = null,
  }) {
    this.postgresProvider = postgresProvider;
    this.answerService = answerService;
    this.searchService = searchService;
    this.chatProvider = chatProvider;
    this.cloudChatProvider = cloudChatProvider;
    this.appSettingsService = appSettingsService;
    this.modelsConfig = modelsConfig;
    // #8.3: граф знаний для структурных вопросов (опционален).
    this.graphAnswerService = graphAnswerService;
  }

  // #8.3: единая точка lookup графа для чата. Возвращает безопасный пустой
  // результат, если граф не подключён или вопрос нерелевантен.
  async lookupGraph(question) {
    if (!this.graphAnswerService) {
      return { used: false, reason: "no_identifier", facts: [], count: 0 };
    }
    try {
      return await this.graphAnswerService.lookup(question);
    } catch (err) {
      return { used: false, reason: "error", facts: [], count: 0, error: err?.message || String(err) };
    }
  }

  graphMeta(graph) {
    return {
      used: !!(graph && graph.used === true && Array.isArray(graph.facts) && graph.facts.length > 0),
      count: graph && Array.isArray(graph.facts) ? graph.facts.length : 0,
      reason: graph?.reason ?? "no_identifier",
    };
  }

  get pool() {
    return this.postgresProvider.pool;
  }

  async listSessions({ limit = 50 } = {}) {
    const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50));
    const { rows } = await this.pool.query(
      `SELECT id, title, mode, filters, provider, created_at, updated_at
       FROM chat_sessions
       ORDER BY updated_at DESC
       LIMIT $1`,
      [safeLimit]
    );
    return rows.map(mapSessionRow);
  }

  async createSession({ title, mode, filters, provider } = {}) {
    const safeTitle = title && String(title).trim() ? String(title).trim() : DEFAULT_TITLE;
    const safeMode = normalizeMode(mode);
    const safeFilters = normalizeFilters(filters);
    const safeProvider = normalizeProvider(provider);

    const { rows } = await this.pool.query(
      `INSERT INTO chat_sessions (title, mode, filters, provider)
       VALUES ($1, $2, $3::jsonb, $4)
       RETURNING id, title, mode, filters, provider, created_at, updated_at`,
      [safeTitle, safeMode, JSON.stringify(safeFilters), safeProvider]
    );
    return mapSessionRow(rows[0]);
  }

  async getSessionById(id) {
    const { rows } = await this.pool.query(
      `SELECT id, title, mode, filters, provider, created_at, updated_at
       FROM chat_sessions
       WHERE id = $1`,
      [id]
    );
    return mapSessionRow(rows[0] ?? null);
  }

  async listMessages(sessionId) {
    const { rows } = await this.pool.query(
      `SELECT id, session_id, role, content, sources, metadata, created_at
       FROM chat_messages
       WHERE session_id = $1
       ORDER BY created_at ASC, id ASC`,
      [sessionId]
    );
    return rows.map(mapMessageRow);
  }

  async getSessionWithMessages(id) {
    const session = await this.getSessionById(id);
    if (!session) {
      return null;
    }
    const messages = await this.listMessages(session.id);
    return { session, messages };
  }

  async updateSession(id, { title, mode, filters, provider } = {}) {
    const session = await this.getSessionById(id);
    if (!session) {
      return null;
    }

    const sets = [];
    const params = [];
    let index = 1;

    if (title !== undefined) {
      const safeTitle = title && String(title).trim() ? String(title).trim() : DEFAULT_TITLE;
      sets.push(`title = $${index++}`);
      params.push(safeTitle);
    }

    if (mode !== undefined) {
      sets.push(`mode = $${index++}`);
      params.push(normalizeMode(mode));
    }

    if (filters !== undefined) {
      sets.push(`filters = $${index++}::jsonb`);
      params.push(JSON.stringify(normalizeFilters(filters)));
    }

    if (provider !== undefined) {
      sets.push(`provider = $${index++}`);
      params.push(normalizeProvider(provider));
    }

    if (sets.length === 0) {
      return session;
    }

    sets.push(`updated_at = NOW()`);
    params.push(id);

    const { rows } = await this.pool.query(
      `UPDATE chat_sessions
       SET ${sets.join(", ")}
       WHERE id = $${index}
       RETURNING id, title, mode, filters, provider, created_at, updated_at`,
      params
    );
    return mapSessionRow(rows[0] ?? null);
  }

  async deleteSession(id) {
    const { rowCount } = await this.pool.query(
      `DELETE FROM chat_sessions WHERE id = $1`,
      [id]
    );
    return rowCount > 0;
  }

  async insertMessage(sessionId, { role, content, sources = [], metadata = {} }) {
    const compactSources = Array.isArray(sources)
      ? sources.map(compactSourceForStorage).filter(Boolean)
      : [];
    const { rows } = await this.pool.query(
      `INSERT INTO chat_messages (session_id, role, content, sources, metadata)
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
       RETURNING id, session_id, role, content, sources, metadata, created_at`,
      [
        sessionId,
        role,
        content,
        JSON.stringify(compactSources),
        JSON.stringify(metadata ?? {}),
      ]
    );
    await this.pool.query(
      `UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1`,
      [sessionId]
    );
    return mapMessageRow(rows[0]);
  }

  async maybeUpdateTitleFromFirstMessage(sessionId, content) {
    const { rows } = await this.pool.query(
      `SELECT title FROM chat_sessions WHERE id = $1`,
      [sessionId]
    );
    if (!rows[0]) {
      return;
    }
    if (rows[0].title && rows[0].title !== DEFAULT_TITLE) {
      return;
    }
    const newTitle = buildTitleFromContent(content);
    if (!newTitle || newTitle === rows[0].title) {
      return;
    }
    await this.pool.query(
      `UPDATE chat_sessions SET title = $1, updated_at = NOW() WHERE id = $2`,
      [newTitle, sessionId]
    );
  }

  buildSearchOptions(session) {
    const filters = normalizeFilters(session?.filters);
    const options = {};
    if (filters.documentIds.length > 0) {
      options.documentIds = filters.documentIds;
    }
    if (filters.nodeIds.length > 0) {
      options.nodeIds = filters.nodeIds;
      options.includeChildren = true;
    }
    if (filters.tags.length > 0) {
      options.selectedTags = filters.tags;
    }
    return { options, filters };
  }

  formatPagesAssistantContent(items) {
    if (!items || items.length === 0) {
      return "По выбранным фильтрам ничего не нашлось. Попробуйте расширить выборку или переформулировать запрос.";
    }
    return `Найдено страниц: ${items.length}. Подробности — в карточках ниже.`;
  }

  async generateAssistantPayload(session, question) {
    const { options, filters } = this.buildSearchOptions(session);
    const startedAt = Date.now();

    if (session.mode === "pages") {
      try {
        const result = await this.searchService.hybridSearch(question, {
          ...options,
          scope: "assets",
          limit: 10,
        });
        const items = Array.isArray(result?.items) ? result.items : [];
        const content = this.formatPagesAssistantContent(items);
        const mode = items.length === 0 ? "fallback-empty" : "pages";
        return {
          content,
          sources: items,
          metadata: {
            provider: "local",
            mode,
            filters,
            durationMs: Date.now() - startedAt,
            searchMode: "pages",
            reranking: result?.reranking || null,
            hyde: result?.hyde || null,
          },
        };
      } catch (error) {
        return {
          content: `Не удалось выполнить поиск страниц: ${this.describeError(error)}`,
          sources: [],
          metadata: {
            provider: "local",
            mode: "error",
            filters,
            durationMs: Date.now() - startedAt,
            searchMode: "pages",
            error: { code: "search_error", message: String(error?.message ?? error) },
          },
        };
      }
    }

    if (isCloudProvider(session.provider)) {
      return this.generateCloudAnswer(session, question, { options, filters, startedAt });
    }

    try {
      // #8.3: answerService сам сделает graph-lookup (graphContext не передаём),
      // вернёт объединённые источники (RAG + граф) и result.graph для бейджа.
      const result = await this.answerService.answerQuestion(question, options);
      return {
        content: result.answer,
        sources: Array.isArray(result.sources) ? result.sources : [],
        metadata: {
          provider: "local",
          model: this.modelsConfig?.chat?.model || null,
          mode: result.mode ?? "llm",
          filters,
          durationMs: Date.now() - startedAt,
          searchMode: "answer",
          reranking: result?.reranking || null,
          hyde: result?.hyde || null,
          graph: result?.graph || { used: false, count: 0, reason: "no_identifier" },
        },
      };
    } catch (error) {
      return {
        content: `Не удалось получить ответ: ${this.describeError(error)}`,
        sources: [],
        metadata: {
          provider: "local",
          model: this.modelsConfig?.chat?.model || null,
          mode: "error",
          filters,
          durationMs: Date.now() - startedAt,
          searchMode: "answer",
          error: { code: "local_error", message: String(error?.message ?? error) },
        },
      };
    }
  }

  async resolveCloudForSession(session) {
    if (!this.appSettingsService) return { provider: null, providerKey: session.provider, fallbackUsed: false };
    const sessionProvider = session.provider || "cloud";
    const explicitId = extractProviderId(sessionProvider);
    if (explicitId) {
      const exact = await this.appSettingsService.getCloudProviderById(explicitId);
      if (exact && exact.baseUrl && exact.apiKey && exact.model) {
        return { provider: exact, providerKey: `${CLOUD_PROVIDER_PREFIX}${exact.id}`, fallbackUsed: false };
      }
      const fallback = await this.appSettingsService.getDefaultCloudProvider();
      if (fallback && fallback.baseUrl && fallback.apiKey && fallback.model) {
        return {
          provider: fallback,
          providerKey: `${CLOUD_PROVIDER_PREFIX}${fallback.id}`,
          fallbackUsed: true,
          missingId: explicitId,
        };
      }
      return { provider: null, providerKey: sessionProvider, fallbackUsed: false, missingId: explicitId };
    }
    const defaultProvider = await this.appSettingsService.getDefaultCloudProvider();
    if (defaultProvider && defaultProvider.baseUrl && defaultProvider.apiKey && defaultProvider.model) {
      return {
        provider: defaultProvider,
        providerKey: `${CLOUD_PROVIDER_PREFIX}${defaultProvider.id}`,
        fallbackUsed: false,
      };
    }
    const legacy = await this.appSettingsService.getCloudProvider();
    if (legacy && legacy.baseUrl && legacy.apiKey && legacy.model) {
      return { provider: legacy, providerKey: "cloud", fallbackUsed: false };
    }
    return { provider: null, providerKey: sessionProvider, fallbackUsed: false };
  }

  async generateCloudAnswer(session, question, { options, filters, startedAt }) {
    if (!this.appSettingsService || !this.cloudChatProvider) {
      return {
        content: "Облачный провайдер не подключён в сборке kb-api.",
        sources: [],
        metadata: {
          provider: "cloud",
          mode: "error",
          filters,
          durationMs: Date.now() - startedAt,
          searchMode: "answer",
          error: { code: "no_credentials", message: "Облачный провайдер не подключён." },
        },
      };
    }

    const resolved = await this.resolveCloudForSession(session);
    const cloud = resolved.provider;
    if (!cloud || !cloud.baseUrl || !cloud.apiKey || !cloud.model) {
      return {
        content: "Облако не настроено. Откройте «Настройки» и добавьте облачного провайдера.",
        sources: [],
        metadata: {
          provider: resolved.providerKey || "cloud",
          mode: "error",
          filters,
          durationMs: Date.now() - startedAt,
          searchMode: "answer",
          error: {
            code: "no_credentials",
            message: "Облако не настроено. Добавьте провайдера в разделе «Настройки».",
          },
        },
      };
    }

    let ragSources = [];
    let rerankingInfo = null;
    let hydeInfo = null;
    try {
      const hybrid = await this.searchService.hybridSearch(question, options);
      ragSources = Array.isArray(hybrid?.items) ? hybrid.items : [];
      rerankingInfo = hybrid?.reranking || null;
      hydeInfo = hybrid?.hyde || null;
    } catch (error) {
      return {
        content: `Не удалось выполнить поиск перед обращением к облаку: ${this.describeError(error)}`,
        sources: [],
        metadata: {
          provider: "cloud",
          model: cloud.model,
          mode: "error",
          filters,
          durationMs: Date.now() - startedAt,
          searchMode: "answer",
          error: { code: "search_error", message: String(error?.message ?? error) },
        },
      };
    }

    // #8.3: граф знаний для структурных вопросов.
    const graph = await this.lookupGraph(question);
    const graphMeta = this.graphMeta(graph);
    const graphFacts = graphMeta.used ? graph.facts : [];
    const graphSources = graphMeta.used && this.graphAnswerService
      ? this.graphAnswerService.toSources(graphFacts)
      : [];
    const sources = ragSources.concat(graphSources);

    const history = await this.loadRecentHistoryForCloud(session.id, CLOUD_HISTORY_PAIRS);
    const messages = await this.buildCloudMessages({ question, sources: ragSources, history, graphFacts });
    const maxTokens = await this.resolveCloudMaxTokens();

    try {
      const result = await this.cloudChatProvider.generate({
        messages,
        model: cloud.model,
        baseUrl: cloud.baseUrl,
        apiKey: cloud.apiKey,
        maxTokens,
      });
      const fallbackNote = resolved.fallbackUsed
        ? "Выбранный провайдер удалён — использован провайдер по умолчанию."
        : null;
      const emptyReasoning = isEmptyReasoningResult(result);
      return {
        content: emptyReasoning ? buildEmptyReasoningMessage(maxTokens) : result.content,
        sources,
        metadata: {
          provider: resolved.providerKey,
          providerName: cloud.name || "Cloud",
          model: result.model || cloud.model,
          mode: emptyReasoning ? "empty-reasoning" : "llm",
          filters,
          durationMs: Date.now() - startedAt,
          searchMode: "answer",
          tokensIn: result.usage?.promptTokens ?? 0,
          tokensOut: result.usage?.completionTokens ?? 0,
          ...(emptyReasoning
            ? {
                finishReason: result.finishReason || null,
                thinkingMode: result.thinkingMode || null,
                maxTokensUsed: maxTokens,
              }
            : {}),
          ...(fallbackNote ? { providerFallback: fallbackNote } : {}),
          reranking: rerankingInfo,
          hyde: hydeInfo,
          graph: graphMeta,
        },
      };
    } catch (error) {
      const isCloudErr = error instanceof CloudProviderError;
      return {
        content: isCloudErr
          ? error.userMessage
          : `Сбой облачного провайдера: ${this.describeError(error)}`,
        sources,
        metadata: {
          provider: resolved.providerKey,
          providerName: cloud.name || "Cloud",
          model: cloud.model,
          mode: "error",
          filters,
          durationMs: Date.now() - startedAt,
          searchMode: "answer",
          error: {
            code: isCloudErr ? error.code : "server_error",
            message: isCloudErr ? error.userMessage : String(error?.message ?? error),
          },
          reranking: rerankingInfo,
          hyde: hydeInfo,
          graph: graphMeta,
        },
      };
    }
  }

  async resolveCloudMaxTokens() {
    if (!this.appSettingsService || typeof this.appSettingsService.getGenerationSettings !== "function") {
      return 4096;
    }
    try {
      const { maxTokens } = await this.appSettingsService.getGenerationSettings();
      return Number.isFinite(maxTokens) ? maxTokens : 4096;
    } catch (err) {
      return 4096;
    }
  }

  async loadRecentHistoryForCloud(sessionId, pairs) {
    const limit = Math.max(1, Math.min(20, Number(pairs) || 6)) * 2;
    const { rows } = await this.pool.query(
      `SELECT role, content
       FROM chat_messages
       WHERE session_id = $1 AND role IN ('user', 'assistant')
       ORDER BY created_at DESC, id DESC
       LIMIT $2`,
      [sessionId, limit]
    );
    return rows
      .reverse()
      .map((row) => ({ role: row.role, content: String(row.content || "") }));
  }

  async buildCloudMessages({ question, sources, history, graphFacts = [] }) {
    const settings = this.appSettingsService
      ? await this.appSettingsService.getSystemPrompt()
      : { template: null };
    const systemContent = renderSystemPrompt(settings.template, {
      question,
      sources,
      history,
      graphFacts,
    });
    return [
      { role: "system", content: systemContent },
      ...(history || []),
      { role: "user", content: question },
    ];
  }

  describeError(error) {
    const message = String(error?.message ?? error ?? "").trim();
    if (!message) {
      return "неизвестная ошибка";
    }
    const lower = message.toLowerCase();
    if (lower.includes("connection refused")) {
      return "нет соединения с локальной моделью или Qdrant";
    }
    if (lower.includes("econnreset") || lower.includes("socket hang up")) {
      return "соединение было разорвано";
    }
    if (lower.includes("timeout")) {
      return "сервис не успел ответить за отведённое время";
    }
    return message;
  }

  async buildLocalAnswerMessages({ question, sources, graphFacts = [] }) {
    const settings = this.appSettingsService
      ? await this.appSettingsService.getSystemPrompt()
      : { template: null };
    const systemContent = renderSystemPrompt(settings.template, {
      question,
      sources,
      history: [],
      graphFacts,
    });
    return [
      { role: "system", content: systemContent },
      { role: "user", content: question },
    ];
  }

  async streamAssistantMessage(sessionId, content, { onMeta, onSources, onToken, onDone, onError, abortSignal } = {}) {
    const session = await this.getSessionById(sessionId);
    if (!session) {
      const err = new Error("Сессия чата не найдена");
      err.statusCode = 404;
      throw err;
    }
    const trimmed = typeof content === "string" ? content.trim() : "";
    if (!trimmed) {
      const err = new Error("Сообщение не может быть пустым");
      err.statusCode = 400;
      throw err;
    }

    const userMessage = await this.insertMessage(sessionId, {
      role: "user",
      content: trimmed,
      sources: [],
      metadata: { mode: session.mode, provider: session.provider },
    });
    await this.maybeUpdateTitleFromFirstMessage(sessionId, trimmed);
    if (typeof onMeta === "function") onMeta({ userMessageId: userMessage.id });

    if (session.mode === "pages") {
      return this.streamPagesAnswer(session, trimmed, userMessage, { onSources, onDone, onError });
    }

    const { options, filters } = this.buildSearchOptions(session);
    let ragSources = [];
    let rerankingInfo = null;
    let hydeInfo = null;
    try {
      const hybrid = await this.searchService.hybridSearch(trimmed, options);
      ragSources = Array.isArray(hybrid?.items) ? hybrid.items : [];
      rerankingInfo = hybrid?.reranking || null;
      hydeInfo = hybrid?.hyde || null;
    } catch (error) {
      const message = `Не удалось выполнить поиск: ${this.describeError(error)}`;
      const assistant = await this.insertMessage(sessionId, {
        role: "assistant",
        content: message,
        sources: [],
        metadata: {
          provider: session.provider,
          mode: "error",
          filters,
          searchMode: "answer",
          error: { code: "search_error", message: String(error?.message ?? error) },
        },
      });
      if (typeof onError === "function") onError({ code: "search_error", message });
      if (typeof onDone === "function") onDone({ assistantMessageId: assistant.id, metadata: assistant.metadata });
      return assistant;
    }

    // #8.3: граф знаний для структурных вопросов. Графовые источники идут
    // после RAG-источников со своей нумерацией; факты — в блок {graph_facts}.
    const graph = await this.lookupGraph(trimmed);
    const graphMeta = this.graphMeta(graph);
    const graphFacts = graphMeta.used ? graph.facts : [];
    const graphSources = graphMeta.used && this.graphAnswerService
      ? this.graphAnswerService.toSources(graphFacts)
      : [];
    const sources = ragSources.concat(graphSources);

    if (typeof onSources === "function") onSources(sources);

    const streamOpts = {
      filters,
      onToken,
      onDone,
      onError,
      abortSignal,
      reranking: rerankingInfo,
      hyde: hydeInfo,
      ragSources,
      graphFacts,
      graphMeta,
    };
    if (isCloudProvider(session.provider)) {
      return this.streamCloudAnswer(session, trimmed, sources, userMessage, streamOpts);
    }
    return this.streamLocalAnswer(session, trimmed, sources, userMessage, streamOpts);
  }

  async streamPagesAnswer(session, question, userMessage, { onSources, onDone, onError }) {
    const { options, filters } = this.buildSearchOptions(session);
    const startedAt = Date.now();
    try {
      const result = await this.searchService.hybridSearch(question, { ...options, scope: "assets", limit: 10 });
      const items = Array.isArray(result?.items) ? result.items : [];
      if (typeof onSources === "function") onSources(items);
      const content = this.formatPagesAssistantContent(items);
      const mode = items.length === 0 ? "fallback-empty" : "pages";
      const assistant = await this.insertMessage(session.id, {
        role: "assistant",
        content,
        sources: items,
        metadata: {
          provider: "local",
          mode,
          filters,
          durationMs: Date.now() - startedAt,
          searchMode: "pages",
          reranking: result?.reranking || null,
          hyde: result?.hyde || null,
        },
      });
      if (typeof onDone === "function") onDone({ assistantMessageId: assistant.id, metadata: assistant.metadata });
      return assistant;
    } catch (error) {
      const message = `Не удалось выполнить поиск страниц: ${this.describeError(error)}`;
      const assistant = await this.insertMessage(session.id, {
        role: "assistant",
        content: message,
        sources: [],
        metadata: { provider: "local", mode: "error", filters, durationMs: Date.now() - startedAt, searchMode: "pages", error: { code: "search_error", message: String(error?.message ?? error) } },
      });
      if (typeof onError === "function") onError({ code: "search_error", message });
      if (typeof onDone === "function") onDone({ assistantMessageId: assistant.id, metadata: assistant.metadata });
      return assistant;
    }
  }

  async streamLocalAnswer(session, question, sources, userMessage, { filters, onToken, onDone, onError, abortSignal, reranking = null, hyde = null, ragSources = null, graphFacts = [], graphMeta = null }) {
    const startedAt = Date.now();
    // ragSources — только RAG-фрагменты (для {sources} и fallback-логики);
    // sources — объединённые (RAG + граф) для хранения/отображения.
    const ragOnly = Array.isArray(ragSources) ? ragSources : sources;
    const graphInfo = graphMeta || { used: false, count: 0, reason: "no_identifier" };
    if (!this.chatProvider || typeof this.chatProvider.generateStream !== "function") {
      const message = "Стриминг локального ИИ недоступен.";
      const assistant = await this.insertMessage(session.id, {
        role: "assistant",
        content: message,
        sources,
        metadata: { provider: "local", mode: "error", filters, durationMs: Date.now() - startedAt, error: { code: "server_error", message }, graph: graphInfo },
      });
      if (typeof onError === "function") onError({ code: "server_error", message });
      if (typeof onDone === "function") onDone({ assistantMessageId: assistant.id, metadata: assistant.metadata });
      return assistant;
    }

    // Развилка fallback: RAG пуст. Если граф дал факт — отвечаем по графу
    // (graph-only), иначе — прежний честный fallback-empty.
    if (!ragOnly.length && !graphInfo.used) {
      const fallback = this.answerService.buildFallbackAnswer(question, ragOnly, {});
      const assistant = await this.insertMessage(session.id, {
        role: "assistant",
        content: fallback.answer,
        sources,
        metadata: { provider: "local", model: this.modelsConfig?.chat?.model || null, mode: fallback.mode, filters, durationMs: Date.now() - startedAt, searchMode: "answer", reranking, hyde, graph: graphInfo },
      });
      if (typeof onToken === "function") onToken(fallback.answer);
      if (typeof onDone === "function") onDone({ assistantMessageId: assistant.id, metadata: assistant.metadata });
      return assistant;
    }

    const graphOnly = !ragOnly.length && graphInfo.used;
    const messages = await this.buildLocalAnswerMessages({ question, sources: ragOnly, graphFacts });
    try {
      const result = await this.chatProvider.generateStream({ messages, onToken, abortSignal });
      const finalContent = result.content || (result.aborted ? "(прервано пользователем)" : "");
      const assistant = await this.insertMessage(session.id, {
        role: "assistant",
        content: finalContent,
        sources,
        metadata: {
          provider: "local",
          model: this.modelsConfig?.chat?.model || null,
          mode: result.aborted ? "aborted" : graphOnly ? "graph-only" : "llm",
          aborted: result.aborted === true,
          filters,
          durationMs: Date.now() - startedAt,
          searchMode: "answer",
          reranking,
          hyde,
          graph: graphInfo,
        },
      });
      if (typeof onDone === "function") onDone({ assistantMessageId: assistant.id, metadata: assistant.metadata });
      return assistant;
    } catch (error) {
      const message = `Сбой локальной модели: ${this.describeError(error)}`;
      const assistant = await this.insertMessage(session.id, {
        role: "assistant",
        content: message,
        sources,
        metadata: { provider: "local", model: this.modelsConfig?.chat?.model || null, mode: "error", filters, durationMs: Date.now() - startedAt, error: { code: "local_error", message: String(error?.message ?? error) }, reranking, hyde, graph: graphInfo },
      });
      if (typeof onError === "function") onError({ code: "local_error", message });
      if (typeof onDone === "function") onDone({ assistantMessageId: assistant.id, metadata: assistant.metadata });
      return assistant;
    }
  }

  async streamCloudAnswer(session, question, sources, userMessage, { filters, onToken, onDone, onError, abortSignal, reranking = null, hyde = null, ragSources = null, graphFacts = [], graphMeta = null }) {
    const startedAt = Date.now();
    const ragOnly = Array.isArray(ragSources) ? ragSources : sources;
    const graphInfo = graphMeta || { used: false, count: 0, reason: "no_identifier" };
    const resolved = await this.resolveCloudForSession(session);
    const cloud = resolved.provider;
    if (!cloud || !cloud.baseUrl || !cloud.apiKey || !cloud.model) {
      const message = "Облако не настроено. Откройте «Настройки» и добавьте облачного провайдера.";
      const assistant = await this.insertMessage(session.id, {
        role: "assistant",
        content: message,
        sources,
        metadata: {
          provider: resolved.providerKey || "cloud",
          mode: "error",
          filters,
          durationMs: Date.now() - startedAt,
          error: { code: "no_credentials", message },
          graph: graphInfo,
        },
      });
      if (typeof onError === "function") onError({ code: "no_credentials", message });
      if (typeof onDone === "function") onDone({ assistantMessageId: assistant.id, metadata: assistant.metadata });
      return assistant;
    }

    const history = await this.loadRecentHistoryForCloud(session.id, CLOUD_HISTORY_PAIRS);
    const tail = history.filter((m) => m.role !== "user" || m.content.trim() !== question);
    const messages = await this.buildCloudMessages({ question, sources: ragOnly, history: tail, graphFacts });
    const maxTokens = await this.resolveCloudMaxTokens();

    try {
      const result = await this.cloudChatProvider.generateStream({
        messages,
        model: cloud.model,
        baseUrl: cloud.baseUrl,
        apiKey: cloud.apiKey,
        maxTokens,
        onToken,
        abortSignal,
      });
      const emptyReasoning = isEmptyReasoningResult(result);
      let finalContent;
      let mode;
      if (result.aborted) {
        finalContent = result.content || "(прервано пользователем)";
        mode = "aborted";
      } else if (emptyReasoning) {
        finalContent = buildEmptyReasoningMessage(maxTokens);
        mode = "empty-reasoning";
      } else {
        finalContent = result.content || "";
        mode = !ragOnly.length && graphInfo.used ? "graph-only" : "llm";
      }
      const fallbackNote = resolved.fallbackUsed
        ? "Выбранный провайдер удалён — использован провайдер по умолчанию."
        : null;
      const assistant = await this.insertMessage(session.id, {
        role: "assistant",
        content: finalContent,
        sources,
        metadata: {
          provider: resolved.providerKey,
          providerName: cloud.name || "Cloud",
          model: result.model || cloud.model,
          mode,
          aborted: result.aborted === true,
          filters,
          durationMs: Date.now() - startedAt,
          searchMode: "answer",
          tokensIn: result.usage?.promptTokens ?? 0,
          tokensOut: result.usage?.completionTokens ?? 0,
          ...(emptyReasoning
            ? {
                finishReason: result.finishReason || null,
                thinkingMode: result.thinkingMode || null,
                maxTokensUsed: maxTokens,
              }
            : {}),
          ...(fallbackNote ? { providerFallback: fallbackNote } : {}),
          reranking,
          hyde,
          graph: graphInfo,
        },
      });
      if (typeof onDone === "function") onDone({ assistantMessageId: assistant.id, metadata: assistant.metadata });
      return assistant;
    } catch (error) {
      const isCloudErr = error instanceof CloudProviderError;
      const message = isCloudErr ? error.userMessage : `Сбой облака: ${this.describeError(error)}`;
      const code = isCloudErr ? error.code : "server_error";
      const assistant = await this.insertMessage(session.id, {
        role: "assistant",
        content: message,
        sources,
        metadata: {
          provider: resolved.providerKey,
          providerName: cloud.name || "Cloud",
          model: cloud.model,
          mode: "error",
          filters,
          durationMs: Date.now() - startedAt,
          error: { code, message },
          reranking,
          hyde,
          graph: graphInfo,
        },
      });
      if (typeof onError === "function") onError({ code, message });
      if (typeof onDone === "function") onDone({ assistantMessageId: assistant.id, metadata: assistant.metadata });
      return assistant;
    }
  }

  async appendUserMessageAndAnswer(sessionId, content) {
    const session = await this.getSessionById(sessionId);
    if (!session) {
      const err = new Error("Сессия чата не найдена");
      err.statusCode = 404;
      throw err;
    }

    const trimmed = typeof content === "string" ? content.trim() : "";
    if (!trimmed) {
      const err = new Error("Сообщение не может быть пустым");
      err.statusCode = 400;
      throw err;
    }

    const userMessage = await this.insertMessage(sessionId, {
      role: "user",
      content: trimmed,
      sources: [],
      metadata: { mode: session.mode, provider: session.provider },
    });

    await this.maybeUpdateTitleFromFirstMessage(sessionId, trimmed);

    const assistantPayload = await this.generateAssistantPayload(session, trimmed);
    const assistantMessage = await this.insertMessage(sessionId, {
      role: "assistant",
      content: assistantPayload.content,
      sources: assistantPayload.sources,
      metadata: assistantPayload.metadata,
    });

    return { userMessage, assistantMessage };
  }
}
