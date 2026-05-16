const DEFAULT_TITLE = "Новый чат";
const MAX_TITLE_LENGTH = 60;
const SUPPORTED_MODES = new Set(["answer", "pages"]);

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

function normalizeFilters(value) {
  if (!value || typeof value !== "object") {
    return { nodeIds: [], documentIds: [] };
  }
  const nodeIds = Array.isArray(value.nodeIds)
    ? value.nodeIds.map((id) => String(id).trim()).filter(Boolean)
    : [];
  const documentIds = Array.isArray(value.documentIds)
    ? value.documentIds.map((id) => String(id).trim()).filter(Boolean)
    : [];
  return { nodeIds, documentIds };
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
    filters: row.filters ?? { nodeIds: [], documentIds: [] },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function compactSourceForStorage(source) {
  if (!source || typeof source !== "object") {
    return null;
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
  constructor({ postgresProvider, answerService, searchService }) {
    this.postgresProvider = postgresProvider;
    this.answerService = answerService;
    this.searchService = searchService;
  }

  get pool() {
    return this.postgresProvider.pool;
  }

  async listSessions({ limit = 50 } = {}) {
    const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50));
    const { rows } = await this.pool.query(
      `SELECT id, title, mode, filters, created_at, updated_at
       FROM chat_sessions
       ORDER BY updated_at DESC
       LIMIT $1`,
      [safeLimit]
    );
    return rows.map(mapSessionRow);
  }

  async createSession({ title, mode, filters } = {}) {
    const safeTitle = title && String(title).trim() ? String(title).trim() : DEFAULT_TITLE;
    const safeMode = normalizeMode(mode);
    const safeFilters = normalizeFilters(filters);

    const { rows } = await this.pool.query(
      `INSERT INTO chat_sessions (title, mode, filters)
       VALUES ($1, $2, $3::jsonb)
       RETURNING id, title, mode, filters, created_at, updated_at`,
      [safeTitle, safeMode, JSON.stringify(safeFilters)]
    );
    return mapSessionRow(rows[0]);
  }

  async getSessionById(id) {
    const { rows } = await this.pool.query(
      `SELECT id, title, mode, filters, created_at, updated_at
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

  async updateSession(id, { title, mode, filters } = {}) {
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

    if (sets.length === 0) {
      return session;
    }

    sets.push(`updated_at = NOW()`);
    params.push(id);

    const { rows } = await this.pool.query(
      `UPDATE chat_sessions
       SET ${sets.join(", ")}
       WHERE id = $${index}
       RETURNING id, title, mode, filters, created_at, updated_at`,
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
      options.nodeId = filters.nodeIds[0];
      options.includeChildren = true;
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
            mode,
            filters,
            durationMs: Date.now() - startedAt,
            searchMode: "pages",
          },
        };
      } catch (error) {
        return {
          content: `Не удалось выполнить поиск страниц: ${this.describeError(error)}`,
          sources: [],
          metadata: {
            mode: "error",
            filters,
            durationMs: Date.now() - startedAt,
            searchMode: "pages",
            error: String(error?.message ?? error),
          },
        };
      }
    }

    try {
      const result = await this.answerService.answerQuestion(question, options);
      return {
        content: result.answer,
        sources: Array.isArray(result.sources) ? result.sources : [],
        metadata: {
          mode: result.mode ?? "llm",
          filters,
          durationMs: Date.now() - startedAt,
          searchMode: "answer",
        },
      };
    } catch (error) {
      return {
        content: `Не удалось получить ответ: ${this.describeError(error)}`,
        sources: [],
        metadata: {
          mode: "error",
          filters,
          durationMs: Date.now() - startedAt,
          searchMode: "answer",
          error: String(error?.message ?? error),
        },
      };
    }
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
      metadata: { mode: session.mode },
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
