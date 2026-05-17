import pg from "pg";

import { normalizeTagForCompare } from "../utils/tags.js";

const { Pool } = pg;
const UNSORTED_NODE_NAME = "Без раздела";
const ROOT_PARENT_SENTINEL = "00000000-0000-0000-0000-000000000000";

function providerError(code, message, details = {}) {
  return Object.assign(new Error(message), { code, details });
}

function buildDocumentAssetMetadata(asset) {
  return {
    page: asset.page ?? null,
    sourceType: asset.sourceType ?? "pdf",
    previewAvailable: asset.previewAvailable === true,
    assetClass: asset.assetClass ?? "text",
    confidence: asset.confidence ?? null,
    engineeringTopics: asset.engineeringTopics ?? [],
    signalTags: asset.signalTags ?? [],
    classifierVersion: asset.classifierVersion ?? "v3",
    scores: asset.scores ?? undefined,
    ocrStatus: asset.ocrStatus ?? undefined,
    ocrLang: asset.ocrLang ?? undefined,
    ocrError: asset.ocrError ?? undefined,
  };
}

export class PostgresProvider {
  constructor(config) {
    this.pool = new Pool(config);
  }

  async ensureRuntimeSchema() {
    await this.pool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS document_assets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
        asset_type TEXT NOT NULL,
        page_number INTEGER,
        title TEXT,
        text_excerpt TEXT,
        text_content TEXT,
        file_name TEXT NOT NULL,
        relative_path TEXT NOT NULL,
        mime_type TEXT,
        size_bytes INTEGER DEFAULT 0,
        metadata_json JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await this.pool.query(`
      ALTER TABLE document_assets
      ALTER COLUMN file_name DROP NOT NULL,
      ALTER COLUMN relative_path DROP NOT NULL
    `);

    await this.pool.query(`
      ALTER TABLE ingestion_jobs
      ADD COLUMN IF NOT EXISTS total_items INTEGER,
      ADD COLUMN IF NOT EXISTS processed_items INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS progress_message TEXT,
      ADD COLUMN IF NOT EXISTS pending_filename TEXT,
      ADD COLUMN IF NOT EXISTS pending_options JSONB,
      ADD COLUMN IF NOT EXISTS phase TEXT
    `);

    // Бэкфилл phase для существующих записей
    await this.pool.query(`
      UPDATE ingestion_jobs
      SET phase = CASE
        WHEN status = 'queued' AND document_id IS NULL THEN 'awaiting_upload'
        WHEN status = 'queued' AND document_id IS NOT NULL THEN 'awaiting_processing'
        WHEN status IN ('running', 'cancel_requested') THEN 'processing'
        ELSE 'done'
      END
      WHERE phase IS NULL
    `);

    await this.ensureKnowledgeNodeSchema();
    await this.ensureChatSessionSchema();
    await this.ensureAppSettingsSchema();
    await this.ensureGraphSchema();
  }

  async ensureGraphSchema() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS graph_nodes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
        source_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
        source_page_number INTEGER,
        source_xlsx_sheet TEXT,
        source_xlsx_row INTEGER,
        confidence REAL NOT NULL DEFAULT 1.0
          CHECK (confidence >= 0.0 AND confidence <= 1.0),
        author TEXT NOT NULL DEFAULT 'user:manual',
        is_archived BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_graph_nodes_type
      ON graph_nodes(type) WHERE is_archived = FALSE
    `);
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_graph_nodes_source_document
      ON graph_nodes(source_document_id) WHERE source_document_id IS NOT NULL
    `);
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_graph_nodes_author
      ON graph_nodes(author)
    `);
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_graph_nodes_name
      ON graph_nodes(name)
    `);
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_graph_nodes_attributes
      ON graph_nodes USING gin(attributes)
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS graph_edges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_node_id UUID NOT NULL
          REFERENCES graph_nodes(id) ON DELETE CASCADE,
        target_node_id UUID NOT NULL
          REFERENCES graph_nodes(id) ON DELETE CASCADE,
        relation TEXT NOT NULL,
        attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
        confidence REAL NOT NULL DEFAULT 1.0
          CHECK (confidence >= 0.0 AND confidence <= 1.0),
        author TEXT NOT NULL DEFAULT 'user:manual',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT graph_edges_unique_triple
          UNIQUE (source_node_id, target_node_id, relation)
      )
    `);

    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_graph_edges_source
      ON graph_edges(source_node_id)
    `);
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_graph_edges_target
      ON graph_edges(target_node_id)
    `);
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_graph_edges_relation
      ON graph_edges(relation)
    `);

    await this.pool.query(`
      CREATE OR REPLACE FUNCTION graph_nodes_set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await this.pool.query(`
      DROP TRIGGER IF EXISTS trg_graph_nodes_set_updated_at ON graph_nodes
    `);
    await this.pool.query(`
      CREATE TRIGGER trg_graph_nodes_set_updated_at
      BEFORE UPDATE ON graph_nodes
      FOR EACH ROW
      EXECUTE FUNCTION graph_nodes_set_updated_at()
    `);
  }

  async createGraphNode(node) {
    const result = await this.pool.query(
      `
      INSERT INTO graph_nodes (
        type,
        name,
        description,
        attributes,
        source_document_id,
        source_page_number,
        source_xlsx_sheet,
        source_xlsx_row,
        confidence,
        author
      )
      VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10)
      RETURNING *
      `,
      [
        node.type,
        node.name,
        node.description ?? null,
        JSON.stringify(node.attributes ?? {}),
        node.sourceDocumentId ?? null,
        node.sourcePageNumber ?? null,
        node.sourceXlsxSheet ?? null,
        node.sourceXlsxRow ?? null,
        node.confidence ?? 1.0,
        node.author ?? "user:manual",
      ]
    );
    return result.rows[0];
  }

  async getGraphNodeById(nodeId) {
    const result = await this.pool.query(
      `SELECT * FROM graph_nodes WHERE id = $1 LIMIT 1`,
      [nodeId]
    );
    return result.rows[0] ?? null;
  }

  async listGraphNodes(options = {}) {
    const parsedLimit = Number(options.limit);
    const limit = Number.isFinite(parsedLimit)
      ? Math.max(1, Math.min(500, Math.trunc(parsedLimit)))
      : 50;
    const parsedOffset = Number(options.offset);
    const offset = Number.isFinite(parsedOffset)
      ? Math.max(0, Math.trunc(parsedOffset))
      : 0;

    const conditions = [];
    const params = [];

    if (typeof options.type === "string" && options.type.trim()) {
      params.push(options.type.trim());
      conditions.push(`type = $${params.length}`);
    }
    if (typeof options.author === "string" && options.author.trim()) {
      params.push(options.author.trim());
      conditions.push(`author = $${params.length}`);
    }
    if (typeof options.isArchived === "boolean") {
      params.push(options.isArchived);
      conditions.push(`is_archived = $${params.length}`);
    } else {
      conditions.push(`is_archived = FALSE`);
    }
    if (typeof options.sourceDocumentId === "string" && options.sourceDocumentId.trim()) {
      params.push(options.sourceDocumentId.trim());
      conditions.push(`source_document_id = $${params.length}`);
    }
    if (typeof options.nameSearch === "string" && options.nameSearch.trim()) {
      params.push(`%${options.nameSearch.trim()}%`);
      conditions.push(`name ILIKE $${params.length}`);
    }

    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    params.push(limit);
    const limitPlaceholder = `$${params.length}`;
    params.push(offset);
    const offsetPlaceholder = `$${params.length}`;

    const itemsResult = await this.pool.query(
      `
      SELECT *
      FROM graph_nodes
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}
      `,
      params
    );

    const countParams = params.slice(0, params.length - 2);
    const countResult = await this.pool.query(
      `SELECT COUNT(*)::int AS total FROM graph_nodes ${whereSql}`,
      countParams
    );

    return {
      items: itemsResult.rows,
      total: Number(countResult.rows[0]?.total ?? 0),
      limit,
      offset,
    };
  }

  async updateGraphNode(nodeId, patch) {
    const fieldMap = {
      type: "type",
      name: "name",
      description: "description",
      sourceDocumentId: "source_document_id",
      sourcePageNumber: "source_page_number",
      sourceXlsxSheet: "source_xlsx_sheet",
      sourceXlsxRow: "source_xlsx_row",
      confidence: "confidence",
      author: "author",
      isArchived: "is_archived",
    };

    const assignments = [];
    const params = [nodeId];

    for (const [key, column] of Object.entries(fieldMap)) {
      if (Object.prototype.hasOwnProperty.call(patch, key)) {
        params.push(patch[key]);
        assignments.push(`${column} = $${params.length}`);
      }
    }

    if (Object.prototype.hasOwnProperty.call(patch, "attributes")) {
      params.push(JSON.stringify(patch.attributes ?? {}));
      assignments.push(`attributes = $${params.length}::jsonb`);
    }

    if (assignments.length === 0) {
      return this.getGraphNodeById(nodeId);
    }

    const result = await this.pool.query(
      `
      UPDATE graph_nodes
      SET ${assignments.join(", ")}
      WHERE id = $1
      RETURNING *
      `,
      params
    );
    return result.rows[0] ?? null;
  }

  async setGraphNodeArchived(nodeId, isArchived) {
    const result = await this.pool.query(
      `
      UPDATE graph_nodes
      SET is_archived = $2
      WHERE id = $1
      RETURNING *
      `,
      [nodeId, isArchived === true]
    );
    return result.rows[0] ?? null;
  }

  async createGraphEdge(edge) {
    const result = await this.pool.query(
      `
      INSERT INTO graph_edges (
        source_node_id,
        target_node_id,
        relation,
        attributes,
        confidence,
        author
      )
      VALUES ($1, $2, $3, $4::jsonb, $5, $6)
      ON CONFLICT (source_node_id, target_node_id, relation) DO NOTHING
      RETURNING *
      `,
      [
        edge.sourceNodeId,
        edge.targetNodeId,
        edge.relation,
        JSON.stringify(edge.attributes ?? {}),
        edge.confidence ?? 1.0,
        edge.author ?? "user:manual",
      ]
    );

    if (result.rows[0]) {
      return { edge: result.rows[0], created: true };
    }

    const existing = await this.pool.query(
      `
      SELECT *
      FROM graph_edges
      WHERE source_node_id = $1 AND target_node_id = $2 AND relation = $3
      LIMIT 1
      `,
      [edge.sourceNodeId, edge.targetNodeId, edge.relation]
    );
    return { edge: existing.rows[0] ?? null, created: false };
  }

  async getGraphEdgeById(edgeId) {
    const result = await this.pool.query(
      `SELECT * FROM graph_edges WHERE id = $1 LIMIT 1`,
      [edgeId]
    );
    return result.rows[0] ?? null;
  }

  async listGraphEdges(options = {}) {
    const parsedLimit = Number(options.limit);
    const limit = Number.isFinite(parsedLimit)
      ? Math.max(1, Math.min(500, Math.trunc(parsedLimit)))
      : 100;
    const parsedOffset = Number(options.offset);
    const offset = Number.isFinite(parsedOffset)
      ? Math.max(0, Math.trunc(parsedOffset))
      : 0;

    const conditions = [];
    const params = [];

    if (typeof options.sourceNodeId === "string" && options.sourceNodeId.trim()) {
      params.push(options.sourceNodeId.trim());
      conditions.push(`source_node_id = $${params.length}`);
    }
    if (typeof options.targetNodeId === "string" && options.targetNodeId.trim()) {
      params.push(options.targetNodeId.trim());
      conditions.push(`target_node_id = $${params.length}`);
    }
    if (typeof options.relation === "string" && options.relation.trim()) {
      params.push(options.relation.trim());
      conditions.push(`relation = $${params.length}`);
    }

    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    params.push(limit);
    const limitPlaceholder = `$${params.length}`;
    params.push(offset);
    const offsetPlaceholder = `$${params.length}`;

    const itemsResult = await this.pool.query(
      `
      SELECT *
      FROM graph_edges
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}
      `,
      params
    );

    const countParams = params.slice(0, params.length - 2);
    const countResult = await this.pool.query(
      `SELECT COUNT(*)::int AS total FROM graph_edges ${whereSql}`,
      countParams
    );

    return {
      items: itemsResult.rows,
      total: Number(countResult.rows[0]?.total ?? 0),
      limit,
      offset,
    };
  }

  async getRelatedGraphNodes(nodeId, options = {}) {
    const direction = ["outgoing", "incoming", "both"].includes(options.direction)
      ? options.direction
      : "both";
    const relation =
      typeof options.relation === "string" && options.relation.trim()
        ? options.relation.trim()
        : null;

    const items = [];

    if (direction === "outgoing" || direction === "both") {
      const params = [nodeId];
      let relationSql = "";
      if (relation) {
        params.push(relation);
        relationSql = ` AND e.relation = $${params.length}`;
      }
      const result = await this.pool.query(
        `
        SELECT
          e.id AS edge_id,
          e.source_node_id,
          e.target_node_id,
          e.relation,
          e.attributes AS edge_attributes,
          e.confidence AS edge_confidence,
          e.author AS edge_author,
          e.created_at AS edge_created_at,
          n.id AS node_id,
          n.type AS node_type,
          n.name AS node_name,
          n.description AS node_description,
          n.attributes AS node_attributes,
          n.source_document_id AS node_source_document_id,
          n.source_page_number AS node_source_page_number,
          n.source_xlsx_sheet AS node_source_xlsx_sheet,
          n.source_xlsx_row AS node_source_xlsx_row,
          n.confidence AS node_confidence,
          n.author AS node_author,
          n.is_archived AS node_is_archived,
          n.created_at AS node_created_at,
          n.updated_at AS node_updated_at,
          'outgoing' AS direction
        FROM graph_edges e
        JOIN graph_nodes n ON n.id = e.target_node_id
        WHERE e.source_node_id = $1${relationSql}
        ORDER BY e.created_at DESC
        `,
        params
      );
      items.push(...result.rows);
    }

    if (direction === "incoming" || direction === "both") {
      const params = [nodeId];
      let relationSql = "";
      if (relation) {
        params.push(relation);
        relationSql = ` AND e.relation = $${params.length}`;
      }
      const result = await this.pool.query(
        `
        SELECT
          e.id AS edge_id,
          e.source_node_id,
          e.target_node_id,
          e.relation,
          e.attributes AS edge_attributes,
          e.confidence AS edge_confidence,
          e.author AS edge_author,
          e.created_at AS edge_created_at,
          n.id AS node_id,
          n.type AS node_type,
          n.name AS node_name,
          n.description AS node_description,
          n.attributes AS node_attributes,
          n.source_document_id AS node_source_document_id,
          n.source_page_number AS node_source_page_number,
          n.source_xlsx_sheet AS node_source_xlsx_sheet,
          n.source_xlsx_row AS node_source_xlsx_row,
          n.confidence AS node_confidence,
          n.author AS node_author,
          n.is_archived AS node_is_archived,
          n.created_at AS node_created_at,
          n.updated_at AS node_updated_at,
          'incoming' AS direction
        FROM graph_edges e
        JOIN graph_nodes n ON n.id = e.source_node_id
        WHERE e.target_node_id = $1${relationSql}
        ORDER BY e.created_at DESC
        `,
        params
      );
      items.push(...result.rows);
    }

    return items;
  }

  async deleteGraphEdge(edgeId) {
    const result = await this.pool.query(
      `DELETE FROM graph_edges WHERE id = $1 RETURNING id`,
      [edgeId]
    );
    return result.rows.length > 0;
  }

  async getGraphStats() {
    const [nodesByTypeRes, edgesByRelationRes, totalsRes] = await Promise.all([
      this.pool.query(
        `
        SELECT type, COUNT(*)::int AS count
        FROM graph_nodes
        WHERE is_archived = FALSE
        GROUP BY type
        ORDER BY type
        `
      ),
      this.pool.query(
        `
        SELECT relation, COUNT(*)::int AS count
        FROM graph_edges
        GROUP BY relation
        ORDER BY relation
        `
      ),
      this.pool.query(
        `
        SELECT
          (SELECT COUNT(*)::int FROM graph_nodes WHERE is_archived = FALSE) AS total_active_nodes,
          (SELECT COUNT(*)::int FROM graph_nodes WHERE is_archived = TRUE) AS total_archived_nodes,
          (SELECT COUNT(*)::int FROM graph_edges) AS total_edges
        `
      ),
    ]);

    const nodesByType = {};
    for (const row of nodesByTypeRes.rows) {
      nodesByType[row.type] = Number(row.count);
    }
    const edgesByRelation = {};
    for (const row of edgesByRelationRes.rows) {
      edgesByRelation[row.relation] = Number(row.count);
    }

    const totals = totalsRes.rows[0] ?? {};
    return {
      nodesByType,
      edgesByRelation,
      totalActiveNodes: Number(totals.total_active_nodes ?? 0),
      totalArchivedNodes: Number(totals.total_archived_nodes ?? 0),
      totalEdges: Number(totals.total_edges ?? 0),
    };
  }

  async ensureAppSettingsSchema() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await this.pool.query(`
      ALTER TABLE chat_sessions
      ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'local'
    `);
  }

  async ensureChatSessionSchema() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL DEFAULT 'Новый чат',
        mode TEXT NOT NULL DEFAULT 'answer',
        filters JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at
      ON chat_sessions(updated_at DESC)
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        sources JSONB NOT NULL DEFAULT '[]'::jsonb,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created
      ON chat_messages(session_id, created_at)
    `);
  }

  async ensureKnowledgeNodeSchema() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS knowledge_nodes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        parent_id UUID REFERENCES knowledge_nodes(id) ON DELETE RESTRICT,
        name TEXT NOT NULL,
        type_label TEXT,
        color TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        is_system BOOLEAN NOT NULL DEFAULT FALSE,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT chk_no_self_parent CHECK (id <> parent_id)
      )
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS knowledge_node_closure (
        ancestor_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
        descendant_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
        depth INTEGER NOT NULL,
        PRIMARY KEY (ancestor_id, descendant_id)
      )
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS document_node_links (
        document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE RESTRICT,
        is_primary BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (document_id, node_id)
      )
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS job_node_links (
        job_id UUID NOT NULL REFERENCES ingestion_jobs(id) ON DELETE CASCADE,
        node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE RESTRICT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (job_id, node_id)
      )
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS node_counters (
        node_id UUID PRIMARY KEY REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
        direct_documents INTEGER NOT NULL DEFAULT 0,
        scope_documents INTEGER NOT NULL DEFAULT 0,
        scope_pages INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS node_sync_status (
        id INTEGER PRIMARY KEY DEFAULT 1,
        last_reindex_at TIMESTAMPTZ,
        last_scope TEXT,
        last_target_id UUID,
        last_document_count INTEGER NOT NULL DEFAULT 0,
        last_point_count INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS ui_state (
        id INTEGER PRIMARY KEY DEFAULT 1,
        current_node_id UUID REFERENCES knowledge_nodes(id) ON DELETE SET NULL,
        include_children BOOLEAN NOT NULL DEFAULT TRUE,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await this.pool.query(`
      INSERT INTO node_sync_status (id)
      VALUES (1)
      ON CONFLICT (id) DO NOTHING
    `);
    await this.pool.query(`
      INSERT INTO ui_state (id)
      VALUES (1)
      ON CONFLICT (id) DO NOTHING
    `);

    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_nodes_parent ON knowledge_nodes(parent_id)
    `);
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_nodes_active
      ON knowledge_nodes(is_active)
      WHERE is_active = TRUE
    `);
    await this.pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_nodes_sibling_name
      ON knowledge_nodes ((COALESCE(parent_id, '${ROOT_PARENT_SENTINEL}'::uuid)), lower(name))
      WHERE is_active = TRUE
    `);
    await this.pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_nodes_system_unsorted
      ON knowledge_nodes (lower(name))
      WHERE is_system = TRUE
    `);
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_closure_descendant
      ON knowledge_node_closure(descendant_id)
    `);
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_closure_depth
      ON knowledge_node_closure(depth)
    `);
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_dnl_node
      ON document_node_links(node_id)
    `);
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_dnl_node_doc
      ON document_node_links(node_id, document_id)
    `);
    await this.pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_dnl_primary_per_doc
      ON document_node_links(document_id)
      WHERE is_primary = TRUE
    `);
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_jnl_node
      ON job_node_links(node_id)
    `);

    await this.pool.query(`
      CREATE OR REPLACE FUNCTION touch_knowledge_nodes_updated_at()
      RETURNS trigger AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await this.pool.query(`
      DROP TRIGGER IF EXISTS trg_knowledge_nodes_touch_updated_at ON knowledge_nodes
    `);
    await this.pool.query(`
      CREATE TRIGGER trg_knowledge_nodes_touch_updated_at
      BEFORE UPDATE ON knowledge_nodes
      FOR EACH ROW
      EXECUTE FUNCTION touch_knowledge_nodes_updated_at()
    `);

    await this.pool.query(`
      CREATE OR REPLACE FUNCTION maintain_knowledge_node_closure_on_insert()
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO knowledge_node_closure (ancestor_id, descendant_id, depth)
        VALUES (NEW.id, NEW.id, 0)
        ON CONFLICT DO NOTHING;

        IF NEW.parent_id IS NOT NULL THEN
          INSERT INTO knowledge_node_closure (ancestor_id, descendant_id, depth)
          SELECT ancestor_id, NEW.id, depth + 1
          FROM knowledge_node_closure
          WHERE descendant_id = NEW.parent_id
          ON CONFLICT (ancestor_id, descendant_id)
          DO UPDATE SET depth = EXCLUDED.depth;
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await this.pool.query(`
      DROP TRIGGER IF EXISTS trg_knowledge_node_closure_insert ON knowledge_nodes
    `);
    await this.pool.query(`
      CREATE TRIGGER trg_knowledge_node_closure_insert
      AFTER INSERT ON knowledge_nodes
      FOR EACH ROW
      EXECUTE FUNCTION maintain_knowledge_node_closure_on_insert()
    `);

    await this.pool.query(
      `
      INSERT INTO knowledge_nodes (
        name,
        type_label,
        color,
        sort_order,
        is_active,
        is_system,
        description
      )
      SELECT $1, 'Системный', '#9CA3AF', 1000000, TRUE, TRUE,
        'Служебный раздел для документов без явной привязки'
      WHERE NOT EXISTS (
        SELECT 1
        FROM knowledge_nodes
        WHERE is_system = TRUE AND lower(name) = lower($1)
      )
      `,
      [UNSORTED_NODE_NAME]
    );

    await this.pool.query(`
      CREATE OR REPLACE FUNCTION rebuild_knowledge_node_closure()
      RETURNS void AS $$
      BEGIN
        DELETE FROM knowledge_node_closure;

        WITH RECURSIVE tree(ancestor_id, descendant_id, depth, path) AS (
          SELECT id, id, 0, ARRAY[id]
          FROM knowledge_nodes
          UNION ALL
          SELECT tree.ancestor_id, child.id, tree.depth + 1, tree.path || child.id
          FROM tree
          JOIN knowledge_nodes child ON child.parent_id = tree.descendant_id
          WHERE NOT child.id = ANY(tree.path)
        )
        INSERT INTO knowledge_node_closure (ancestor_id, descendant_id, depth)
        SELECT ancestor_id, descendant_id, depth
        FROM tree
        ON CONFLICT (ancestor_id, descendant_id)
        DO UPDATE SET depth = EXCLUDED.depth;
      END;
      $$ LANGUAGE plpgsql
    `);

    await this.pool.query(`SELECT rebuild_knowledge_node_closure()`);

    await this.pool.query(`
      CREATE OR REPLACE FUNCTION refresh_all_node_counters()
      RETURNS void AS $$
      BEGIN
        DELETE FROM node_counters nc
        WHERE NOT EXISTS (
          SELECT 1
          FROM knowledge_nodes n
          WHERE n.id = nc.node_id
        );

        INSERT INTO node_counters (
          node_id,
          direct_documents,
          scope_documents,
          scope_pages,
          updated_at
        )
        WITH unsorted_node AS (
          SELECT id
          FROM knowledge_nodes
          WHERE is_system = TRUE AND lower(name) = lower('Без раздела')
          ORDER BY created_at ASC
          LIMIT 1
        ),
        direct_link_counts AS (
          SELECT
            node_id,
            COUNT(DISTINCT document_id)::int AS direct_documents
          FROM document_node_links
          GROUP BY node_id
        ),
        scope_link_documents AS (
          SELECT DISTINCT
            c.ancestor_id AS node_id,
            dnl.document_id
          FROM knowledge_node_closure c
          JOIN document_node_links dnl ON dnl.node_id = c.descendant_id
        ),
        scope_link_counts AS (
          SELECT
            node_id,
            COUNT(document_id)::int AS scope_documents
          FROM scope_link_documents
          GROUP BY node_id
        ),
        scope_page_counts AS (
          SELECT
            scoped.node_id,
            COUNT(a.id)::int AS scope_pages
          FROM scope_link_documents scoped
          JOIN document_assets a ON a.document_id = scoped.document_id
          GROUP BY scoped.node_id
        ),
        unlinked_documents AS (
          SELECT d.id
          FROM documents d
          WHERE NOT EXISTS (
            SELECT 1
            FROM document_node_links dnl
            WHERE dnl.document_id = d.id
          )
        ),
        unlinked_counts AS (
          SELECT
            COUNT(DISTINCT ud.id)::int AS documents,
            COUNT(a.id)::int AS pages
          FROM unlinked_documents ud
          LEFT JOIN document_assets a ON a.document_id = ud.id
        )
        SELECT
          n.id AS node_id,
          (
            COALESCE(direct_link_counts.direct_documents, 0) +
            CASE
              WHEN n.id = (SELECT id FROM unsorted_node)
              THEN (SELECT documents FROM unlinked_counts)
              ELSE 0
            END
          )::int AS direct_documents,
          (
            COALESCE(scope_link_counts.scope_documents, 0) +
            CASE
              WHEN n.id = (SELECT id FROM unsorted_node)
              THEN (SELECT documents FROM unlinked_counts)
              ELSE 0
            END
          )::int AS scope_documents,
          (
            COALESCE(scope_page_counts.scope_pages, 0) +
            CASE
              WHEN n.id = (SELECT id FROM unsorted_node)
              THEN (SELECT pages FROM unlinked_counts)
              ELSE 0
            END
          )::int AS scope_pages,
          NOW()
        FROM knowledge_nodes n
        LEFT JOIN direct_link_counts ON direct_link_counts.node_id = n.id
        LEFT JOIN scope_link_counts ON scope_link_counts.node_id = n.id
        LEFT JOIN scope_page_counts ON scope_page_counts.node_id = n.id
        ON CONFLICT (node_id)
        DO UPDATE SET
          direct_documents = EXCLUDED.direct_documents,
          scope_documents = EXCLUDED.scope_documents,
          scope_pages = EXCLUDED.scope_pages,
          updated_at = NOW();

        RETURN;
      END;
      $$ LANGUAGE plpgsql
    `);

    await this.pool.query(`
      CREATE OR REPLACE FUNCTION refresh_all_node_counters_trigger()
      RETURNS trigger AS $$
      BEGIN
        PERFORM refresh_all_node_counters();
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql
    `);

    await this.pool.query(`
      DROP TRIGGER IF EXISTS trg_node_counters_links_refresh ON document_node_links
    `);
    await this.pool.query(`
      CREATE TRIGGER trg_node_counters_links_refresh
      AFTER INSERT OR UPDATE OR DELETE ON document_node_links
      FOR EACH STATEMENT
      EXECUTE FUNCTION refresh_all_node_counters_trigger()
    `);
    await this.pool.query(`
      DROP TRIGGER IF EXISTS trg_node_counters_assets_refresh ON document_assets
    `);
    await this.pool.query(`
      CREATE TRIGGER trg_node_counters_assets_refresh
      AFTER INSERT OR UPDATE OR DELETE ON document_assets
      FOR EACH STATEMENT
      EXECUTE FUNCTION refresh_all_node_counters_trigger()
    `);
    await this.pool.query(`
      DROP TRIGGER IF EXISTS trg_node_counters_nodes_refresh ON knowledge_nodes
    `);
    await this.pool.query(`
      CREATE TRIGGER trg_node_counters_nodes_refresh
      AFTER INSERT OR UPDATE OR DELETE ON knowledge_nodes
      FOR EACH STATEMENT
      EXECUTE FUNCTION refresh_all_node_counters_trigger()
    `);
    await this.pool.query(`
      DROP TRIGGER IF EXISTS trg_node_counters_documents_refresh ON documents
    `);
    await this.pool.query(`
      CREATE TRIGGER trg_node_counters_documents_refresh
      AFTER INSERT OR UPDATE OR DELETE ON documents
      FOR EACH STATEMENT
      EXECUTE FUNCTION refresh_all_node_counters_trigger()
    `);
    await this.pool.query(`SELECT refresh_all_node_counters()`);
  }

  async close() {
    await this.pool.end();
  }

  async failStaleRunningJobs(reason = "Процесс был прерван перезапуском сервиса") {
    const failedJobs = await this.pool.query(
      `
      UPDATE ingestion_jobs
      SET
        status = 'failed',
        phase = 'done',
        error_message = COALESCE(error_message, $1),
        finished_at = NOW()
      WHERE status = 'running'
      RETURNING id, document_id
      `,
      [reason]
    );

    const documentIds = failedJobs.rows
      .map((row) => row.document_id)
      .filter(Boolean);

    if (documentIds.length > 0) {
      await this.pool.query(
        `
        UPDATE documents
        SET status = 'failed', updated_at = NOW()
        WHERE id = ANY($1::uuid[]) AND status = 'indexing'
        `,
        [documentIds]
      );
    }

    return failedJobs.rows;
  }

  async getSettings() {
    const result = await this.pool.query("SELECT * FROM system_settings WHERE id = 1");
    return result.rows[0] ?? null;
  }

  async getUiState() {
    const result = await this.pool.query(
      `
      SELECT
        ui_state.id,
        ui_state.current_node_id,
        ui_state.include_children,
        ui_state.updated_at,
        n.name AS node_name,
        n.is_system AS node_is_system
      FROM ui_state
      LEFT JOIN knowledge_nodes n ON n.id = ui_state.current_node_id
      WHERE ui_state.id = 1
      LIMIT 1
      `
    );

    return result.rows[0] ?? null;
  }

  async getKnowledgeNodeReadinessStats() {
    const result = await this.pool.query(
      `
      WITH node_stats AS (
        SELECT
          COUNT(*)::int AS node_count,
          COUNT(*) FILTER (WHERE is_active = TRUE)::int AS active_node_count,
          COUNT(*) FILTER (
            WHERE is_system = TRUE
              AND lower(name) = lower($1)
              AND is_active = TRUE
          )::int AS active_unsorted_count
        FROM knowledge_nodes
      ),
      missing_self_closure AS (
        SELECT COUNT(*)::int AS count
        FROM knowledge_nodes n
        WHERE NOT EXISTS (
          SELECT 1
          FROM knowledge_node_closure c
          WHERE c.ancestor_id = n.id
            AND c.descendant_id = n.id
            AND c.depth = 0
        )
      ),
      closure_self AS (
        SELECT COUNT(*)::int AS count
        FROM knowledge_node_closure
        WHERE ancestor_id = descendant_id AND depth = 0
      ),
      document_link_stats AS (
        SELECT
          COUNT(*)::int AS total_documents,
          COUNT(*) FILTER (WHERE link_counts.link_count > 0)::int AS linked_documents,
          COUNT(*) FILTER (WHERE COALESCE(link_counts.link_count, 0) = 0)::int AS unlinked_documents,
          COUNT(*) FILTER (
            WHERE link_counts.link_count > 0
              AND COALESCE(link_counts.primary_count, 0) = 0
          )::int AS linked_documents_without_primary,
          COUNT(*) FILTER (WHERE COALESCE(link_counts.primary_count, 0) > 1)::int AS documents_with_multiple_primary
        FROM documents d
        LEFT JOIN LATERAL (
          SELECT
            COUNT(*)::int AS link_count,
            COUNT(*) FILTER (WHERE is_primary = TRUE)::int AS primary_count
          FROM document_node_links dnl
          WHERE dnl.document_id = d.id
        ) link_counts ON TRUE
      ),
      active_jobs AS (
        SELECT COUNT(*)::int AS count
        FROM ingestion_jobs
        WHERE status = ANY($2::text[])
      ),
      ui_state_stats AS (
        SELECT COUNT(*)::int AS count
        FROM ui_state
      ),
      counter_stats AS (
        SELECT
          COUNT(*)::int AS count,
          (
            SELECT COUNT(*)::int
            FROM knowledge_nodes n
            WHERE NOT EXISTS (
              SELECT 1
              FROM node_counters nc
              WHERE nc.node_id = n.id
            )
          ) AS missing_count
        FROM node_counters
      )
      SELECT
        node_stats.node_count,
        node_stats.active_node_count,
        node_stats.active_unsorted_count,
        closure_self.count AS closure_self_count,
        missing_self_closure.count AS closure_missing_self_count,
        document_link_stats.total_documents,
        document_link_stats.linked_documents,
        document_link_stats.unlinked_documents,
        document_link_stats.linked_documents_without_primary,
        document_link_stats.documents_with_multiple_primary,
        active_jobs.count AS active_jobs_count,
        ui_state_stats.count AS ui_state_rows,
        counter_stats.count AS node_counters_rows,
        counter_stats.missing_count AS node_counters_missing_rows
      FROM node_stats
      CROSS JOIN closure_self
      CROSS JOIN missing_self_closure
      CROSS JOIN document_link_stats
      CROSS JOIN active_jobs
      CROSS JOIN ui_state_stats
      CROSS JOIN counter_stats
      `,
      [UNSORTED_NODE_NAME, ["queued", "running", "cancel_requested"]]
    );

    return result.rows[0];
  }

  async resetRagContent({ force = false, resetUserNodes = true } = {}) {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      const activeJobs = await client.query(
        `
        SELECT COUNT(*)::int AS count
        FROM ingestion_jobs
        WHERE status = ANY($1::text[])
        `,
        [["queued", "running", "cancel_requested"]]
      );
      const activeJobCount = Number(activeJobs.rows[0]?.count ?? 0);
      if (activeJobCount > 0 && !force) {
        throw providerError(
          "ACTIVE_JOBS_PRESENT",
          "Сначала остановите активные задачи или запустите сброс с force=true",
          { activeJobCount }
        );
      }

      const beforeResult = await client.query(
        `
        SELECT
          (SELECT COUNT(*)::int FROM documents) AS documents,
          (SELECT COUNT(*)::int FROM document_chunks) AS chunks,
          (SELECT COUNT(*)::int FROM document_assets) AS assets,
          (SELECT COUNT(*)::int FROM ingestion_jobs) AS jobs,
          (SELECT COUNT(*)::int FROM knowledge_nodes WHERE is_system = FALSE) AS user_nodes,
          (SELECT COUNT(*)::int FROM query_logs) AS query_logs
        `
      );
      const before = beforeResult.rows[0] ?? {};

      if (activeJobCount > 0 && force) {
        await client.query(
          `
          UPDATE ingestion_jobs
          SET
            status = 'cancelled',
            progress_message = 'Остановлено перед очисткой базы',
            finished_at = NOW()
          WHERE status = ANY($1::text[])
          `,
          [["queued", "running", "cancel_requested"]]
        );
      }

      await client.query(`DELETE FROM query_logs`);
      await client.query(`DELETE FROM job_node_links`);
      await client.query(`DELETE FROM ingestion_jobs`);
      await client.query(`DELETE FROM documents`);

      if (resetUserNodes) {
        await client.query(`UPDATE knowledge_nodes SET parent_id = NULL WHERE is_system = FALSE`);
        await client.query(`DELETE FROM knowledge_nodes WHERE is_system = FALSE`);
      }

      await client.query(`SELECT rebuild_knowledge_node_closure()`);
      await client.query(
        `
        UPDATE ui_state
        SET
          current_node_id = (
            SELECT id
            FROM knowledge_nodes
            WHERE is_system = TRUE AND lower(name) = lower($1)
            ORDER BY created_at ASC
            LIMIT 1
          ),
          include_children = FALSE,
          updated_at = NOW()
        WHERE id = 1
        `,
        [UNSORTED_NODE_NAME]
      );
      await client.query(
        `
        INSERT INTO node_sync_status (
          id,
          last_reindex_at,
          last_scope,
          last_target_id,
          last_document_count,
          last_point_count,
          last_error,
          updated_at
        )
        VALUES (1, NOW(), 'reset-content', NULL, 0, 0, NULL, NOW())
        ON CONFLICT (id)
        DO UPDATE SET
          last_reindex_at = EXCLUDED.last_reindex_at,
          last_scope = EXCLUDED.last_scope,
          last_target_id = NULL,
          last_document_count = 0,
          last_point_count = 0,
          last_error = NULL,
          updated_at = NOW()
        `
      );
      await client.query(`SELECT refresh_all_node_counters()`);

      await client.query("COMMIT");
      return {
        before: {
          documents: Number(before.documents ?? 0),
          chunks: Number(before.chunks ?? 0),
          assets: Number(before.assets ?? 0),
          jobs: Number(before.jobs ?? 0),
          userNodes: Number(before.user_nodes ?? 0),
          queryLogs: Number(before.query_logs ?? 0),
        },
        resetUserNodes: resetUserNodes === true,
        forced: force === true,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async saveUiState({ currentNodeId = null, includeChildren = true } = {}) {
    let effectiveNodeId = currentNodeId || null;
    let effectiveIncludeChildren = includeChildren !== false;

    if (effectiveNodeId) {
      const node = await this.getKnowledgeNodeById(effectiveNodeId);
      if (!node || node.is_active === false) {
        throw providerError("NODE_NOT_FOUND", "Раздел не найден");
      }
      if (node.is_system) {
        effectiveIncludeChildren = false;
      }
    }

    const result = await this.pool.query(
      `
      INSERT INTO ui_state (
        id,
        current_node_id,
        include_children,
        updated_at
      )
      VALUES (1, $1, $2, NOW())
      ON CONFLICT (id)
      DO UPDATE SET
        current_node_id = EXCLUDED.current_node_id,
        include_children = EXCLUDED.include_children,
        updated_at = NOW()
      RETURNING *
      `,
      [effectiveNodeId, effectiveIncludeChildren]
    );

    return result.rows[0];
  }

  async listKnowledgeNodes({ includeInactive = false } = {}) {
    const result = await this.pool.query(
      `
      SELECT
        id,
        parent_id,
        name,
        type_label,
        color,
        sort_order,
        is_active,
        is_system,
        description,
        created_at,
        updated_at
      FROM knowledge_nodes
      WHERE ($1::boolean = TRUE OR is_active = TRUE)
      ORDER BY
        CASE WHEN is_system THEN 1 ELSE 0 END ASC,
        sort_order ASC,
        lower(name) ASC,
        created_at ASC
      `,
      [includeInactive === true]
    );

    return result.rows;
  }

  async getKnowledgeNodeById(nodeId) {
    const result = await this.pool.query(
      `
      SELECT
        id,
        parent_id,
        name,
        type_label,
        color,
        sort_order,
        is_active,
        is_system,
        description,
        created_at,
        updated_at
      FROM knowledge_nodes
      WHERE id = $1
      LIMIT 1
      `,
      [nodeId]
    );

    return result.rows[0] ?? null;
  }

  async getUnsortedKnowledgeNode() {
    const result = await this.pool.query(
      `
      SELECT
        id,
        parent_id,
        name,
        type_label,
        color,
        sort_order,
        is_active,
        is_system,
        description,
        created_at,
        updated_at
      FROM knowledge_nodes
      WHERE is_system = TRUE AND lower(name) = lower($1)
      ORDER BY created_at ASC
      LIMIT 1
      `,
      [UNSORTED_NODE_NAME]
    );

    return result.rows[0] ?? null;
  }

  async listKnowledgeNodeCounts() {
    const result = await this.pool.query(
      `
      WITH unsorted_node AS (
        SELECT id
        FROM knowledge_nodes
        WHERE is_system = TRUE AND lower(name) = lower($1)
        ORDER BY created_at ASC
        LIMIT 1
      ),
      direct_link_counts AS (
        SELECT
          node_id,
          COUNT(DISTINCT document_id)::int AS direct_documents
        FROM document_node_links
        GROUP BY node_id
      ),
      scope_link_documents AS (
        SELECT DISTINCT
          c.ancestor_id AS node_id,
          dnl.document_id
        FROM knowledge_node_closure c
        JOIN document_node_links dnl ON dnl.node_id = c.descendant_id
      ),
      scope_link_counts AS (
        SELECT
          node_id,
          COUNT(document_id)::int AS scope_documents
        FROM scope_link_documents
        GROUP BY node_id
      ),
      scope_page_counts AS (
        SELECT
          scoped.node_id,
          COUNT(a.id)::int AS scope_pages
        FROM scope_link_documents scoped
        JOIN document_assets a ON a.document_id = scoped.document_id
        GROUP BY scoped.node_id
      ),
      unlinked_documents AS (
        SELECT d.id
        FROM documents d
        WHERE NOT EXISTS (
          SELECT 1
          FROM document_node_links dnl
          WHERE dnl.document_id = d.id
        )
      ),
      unlinked_counts AS (
        SELECT
          COUNT(DISTINCT ud.id)::int AS documents,
          COUNT(a.id)::int AS pages
        FROM unlinked_documents ud
        LEFT JOIN document_assets a ON a.document_id = ud.id
      )
      SELECT
        n.id AS node_id,
        (
          COALESCE(direct_link_counts.direct_documents, 0) +
          CASE
            WHEN n.id = (SELECT id FROM unsorted_node)
            THEN (SELECT documents FROM unlinked_counts)
            ELSE 0
          END
        )::int AS direct_documents,
        (
          COALESCE(scope_link_counts.scope_documents, 0) +
          CASE
            WHEN n.id = (SELECT id FROM unsorted_node)
            THEN (SELECT documents FROM unlinked_counts)
            ELSE 0
          END
        )::int AS scope_documents,
        (
          COALESCE(scope_page_counts.scope_pages, 0) +
          CASE
            WHEN n.id = (SELECT id FROM unsorted_node)
            THEN (SELECT pages FROM unlinked_counts)
            ELSE 0
          END
        )::int AS scope_pages
      FROM knowledge_nodes n
      LEFT JOIN direct_link_counts ON direct_link_counts.node_id = n.id
      LEFT JOIN scope_link_counts ON scope_link_counts.node_id = n.id
      LEFT JOIN scope_page_counts ON scope_page_counts.node_id = n.id
      ORDER BY n.sort_order ASC, lower(n.name) ASC
      `,
      [UNSORTED_NODE_NAME]
    );

    return result.rows;
  }

  async refreshNodeCounters() {
    const rows = await this.listKnowledgeNodeCounts();
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");
      await client.query(`
        DELETE FROM node_counters nc
        WHERE NOT EXISTS (
          SELECT 1
          FROM knowledge_nodes n
          WHERE n.id = nc.node_id
        )
      `);

      for (const row of rows) {
        await client.query(
          `
          INSERT INTO node_counters (
            node_id,
            direct_documents,
            scope_documents,
            scope_pages,
            updated_at
          )
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (node_id)
          DO UPDATE SET
            direct_documents = EXCLUDED.direct_documents,
            scope_documents = EXCLUDED.scope_documents,
            scope_pages = EXCLUDED.scope_pages,
            updated_at = NOW()
          `,
          [
            row.node_id,
            Number(row.direct_documents ?? 0),
            Number(row.scope_documents ?? 0),
            Number(row.scope_pages ?? 0),
          ]
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return {
      updatedRows: rows.length,
    };
  }

  async listReconciliationDocumentIds({ limit = 25 } = {}) {
    const normalizedLimit = Math.max(1, Math.min(200, Math.trunc(Number(limit) || 25)));
    const result = await this.pool.query(
      `
      SELECT id
      FROM documents
      WHERE status = 'indexed'
      ORDER BY updated_at DESC, id ASC
      LIMIT $1
      `,
      [normalizedLimit]
    );

    return result.rows.map((row) => row.id);
  }

  async listKnowledgeNodeDescendants(nodeId, { includeSelf = false } = {}) {
    const result = await this.pool.query(
      `
      SELECT
        n.id,
        n.parent_id,
        n.name,
        n.type_label,
        n.color,
        n.sort_order,
        n.is_active,
        n.is_system,
        n.description,
        n.created_at,
        n.updated_at,
        c.depth
      FROM knowledge_node_closure c
      JOIN knowledge_nodes n ON n.id = c.descendant_id
      WHERE c.ancestor_id = $1
        AND ($2::boolean = TRUE OR c.depth > 0)
      ORDER BY c.depth ASC, n.sort_order ASC, lower(n.name) ASC
      `,
      [nodeId, includeSelf === true]
    );

    return result.rows;
  }

  async listKnowledgeNodeAncestors(nodeId, { includeSelf = false } = {}) {
    const result = await this.pool.query(
      `
      SELECT
        n.id,
        n.parent_id,
        n.name,
        n.type_label,
        n.color,
        n.sort_order,
        n.is_active,
        n.is_system,
        n.description,
        n.created_at,
        n.updated_at,
        c.depth
      FROM knowledge_node_closure c
      JOIN knowledge_nodes n ON n.id = c.ancestor_id
      WHERE c.descendant_id = $1
        AND ($2::boolean = TRUE OR c.depth > 0)
      ORDER BY c.depth DESC, n.sort_order ASC, lower(n.name) ASC
      `,
      [nodeId, includeSelf === true]
    );

    return result.rows;
  }

  async createKnowledgeNode(node) {
    const result = await this.pool.query(
      `
      INSERT INTO knowledge_nodes (
        parent_id,
        name,
        type_label,
        color,
        sort_order,
        description
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        node.parentId ?? null,
        node.name,
        node.typeLabel ?? null,
        node.color ?? null,
        node.sortOrder ?? 0,
        node.description ?? null,
      ]
    );

    return result.rows[0];
  }

  async updateKnowledgeNode(nodeId, updates) {
    const assignments = [];
    const params = [nodeId];
    const fieldMap = {
      name: "name",
      typeLabel: "type_label",
      color: "color",
      sortOrder: "sort_order",
      isActive: "is_active",
      description: "description",
    };

    for (const [key, column] of Object.entries(fieldMap)) {
      if (Object.prototype.hasOwnProperty.call(updates, key)) {
        params.push(updates[key]);
        assignments.push(`${column} = $${params.length}`);
      }
    }

    if (assignments.length === 0) {
      return this.getKnowledgeNodeById(nodeId);
    }

    const result = await this.pool.query(
      `
      UPDATE knowledge_nodes
      SET ${assignments.join(", ")}
      WHERE id = $1
      RETURNING *
      `,
      params
    );

    return result.rows[0] ?? null;
  }

  async moveKnowledgeNode(nodeId, newParentId) {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      const nodeResult = await client.query(
        `
        SELECT *
        FROM knowledge_nodes
        WHERE id = $1
        FOR UPDATE
        `,
        [nodeId]
      );
      const node = nodeResult.rows[0] ?? null;
      if (!node) {
        throw providerError("NODE_NOT_FOUND", "Раздел не найден");
      }
      if (node.is_system) {
        throw providerError("SYSTEM_NODE_LOCKED", "Системный раздел нельзя перемещать");
      }

      const normalizedParentId = newParentId ?? null;
      if (normalizedParentId === nodeId) {
        throw providerError("NODE_CYCLE", "Нельзя переместить раздел внутрь самого себя");
      }

      if (normalizedParentId) {
        const parentResult = await client.query(
          `
          SELECT id
          FROM knowledge_nodes
          WHERE id = $1 AND is_active = TRUE
          LIMIT 1
          `,
          [normalizedParentId]
        );
        if (!parentResult.rows[0]) {
          throw providerError("PARENT_NOT_FOUND", "Новый родительский раздел не найден");
        }

        const cycleResult = await client.query(
          `
          SELECT 1
          FROM knowledge_node_closure
          WHERE ancestor_id = $1 AND descendant_id = $2
          LIMIT 1
          `,
          [nodeId, normalizedParentId]
        );
        if (cycleResult.rows[0]) {
          throw providerError("NODE_CYCLE", "Нельзя переместить раздел внутрь своего потомка");
        }
      }

      const subtreeResult = await client.query(
        `
        SELECT descendant_id
        FROM knowledge_node_closure
        WHERE ancestor_id = $1
        `,
        [nodeId]
      );
      const subtreeIds = subtreeResult.rows.map((row) => row.descendant_id);

      await client.query(
        `
        DELETE FROM knowledge_node_closure
        WHERE descendant_id = ANY($1::uuid[])
          AND NOT (ancestor_id = ANY($1::uuid[]))
        `,
        [subtreeIds]
      );

      const updatedResult = await client.query(
        `
        UPDATE knowledge_nodes
        SET parent_id = $2
        WHERE id = $1
        RETURNING *
        `,
        [nodeId, normalizedParentId]
      );

      if (normalizedParentId) {
        await client.query(
          `
          INSERT INTO knowledge_node_closure (ancestor_id, descendant_id, depth)
          SELECT
            supertree.ancestor_id,
            subtree.descendant_id,
            supertree.depth + subtree.depth + 1 AS depth
          FROM knowledge_node_closure supertree
          CROSS JOIN knowledge_node_closure subtree
          WHERE supertree.descendant_id = $2
            AND subtree.ancestor_id = $1
          ON CONFLICT (ancestor_id, descendant_id)
          DO UPDATE SET depth = EXCLUDED.depth
          `,
          [nodeId, normalizedParentId]
        );
      }

      await client.query("COMMIT");
      return updatedResult.rows[0] ?? null;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getKnowledgeNodeDeleteInfo(nodeId) {
    const result = await this.pool.query(
      `
      WITH subtree AS (
        SELECT descendant_id, depth
        FROM knowledge_node_closure
        WHERE ancestor_id = $1
      ),
      direct_documents AS (
        SELECT DISTINCT document_id
        FROM document_node_links
        WHERE node_id = $1
      ),
      scope_documents AS (
        SELECT DISTINCT dnl.document_id
        FROM document_node_links dnl
        JOIN subtree ON subtree.descendant_id = dnl.node_id
      )
      SELECT
        n.id,
        n.parent_id,
        n.name,
        n.is_system,
        (SELECT COUNT(*)::int FROM subtree WHERE depth > 0) AS descendant_count,
        (SELECT COUNT(*)::int FROM direct_documents) AS direct_documents,
        (SELECT COUNT(*)::int FROM scope_documents) AS scope_documents,
        (
          SELECT COUNT(a.id)::int
          FROM scope_documents sd
          JOIN document_assets a ON a.document_id = sd.document_id
        ) AS scope_pages
      FROM knowledge_nodes n
      WHERE n.id = $1
      LIMIT 1
      `,
      [nodeId]
    );

    return result.rows[0] ?? null;
  }

  async deleteKnowledgeNode(nodeId, { strategy = "block" } = {}) {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      const nodeResult = await client.query(
        `
        SELECT *
        FROM knowledge_nodes
        WHERE id = $1
        FOR UPDATE
        `,
        [nodeId]
      );
      const node = nodeResult.rows[0] ?? null;
      if (!node) {
        throw providerError("NODE_NOT_FOUND", "Раздел не найден");
      }
      if (node.is_system) {
        throw providerError("SYSTEM_NODE_LOCKED", "Системный раздел нельзя удалить");
      }

      const descendantResult = await client.query(
        `
        SELECT COUNT(*)::int AS count
        FROM knowledge_node_closure
        WHERE ancestor_id = $1 AND depth > 0
        `,
        [nodeId]
      );
      const descendantCount = Number(descendantResult.rows[0]?.count ?? 0);
      if (descendantCount > 0) {
        throw providerError(
          "NODE_HAS_DESCENDANTS",
          "Сначала переместите или удалите вложенные разделы",
          { descendantCount }
        );
      }

      const linkedResult = await client.query(
        `
        SELECT DISTINCT document_id
        FROM document_node_links
        WHERE node_id = $1
        `,
        [nodeId]
      );
      const documentIds = linkedResult.rows.map((row) => row.document_id);

      let movedDocuments = 0;
      if (documentIds.length > 0) {
        if (strategy === "block") {
          throw providerError(
            "NODE_HAS_DOCUMENTS",
            "В разделе есть документы. Выберите стратегию перепривязки.",
            { directDocuments: documentIds.length }
          );
        }

        if (!["move_to_parent", "move_to_unsorted"].includes(strategy)) {
          throw providerError(
            "UNSUPPORTED_DELETE_STRATEGY",
            "Для первого шага доступны стратегии block, move_to_parent и move_to_unsorted"
          );
        }

        let targetNodeId = node.parent_id;
        if (strategy === "move_to_unsorted" || !targetNodeId) {
          const unsortedResult = await client.query(
            `
            SELECT id
            FROM knowledge_nodes
            WHERE is_system = TRUE AND lower(name) = lower($1)
            ORDER BY created_at ASC
            LIMIT 1
            `,
            [UNSORTED_NODE_NAME]
          );
          targetNodeId = unsortedResult.rows[0]?.id ?? null;
        }

        if (!targetNodeId) {
          throw providerError("TARGET_NODE_NOT_FOUND", "Не найден раздел для перепривязки");
        }

        await client.query(
          `
          INSERT INTO document_node_links (document_id, node_id, is_primary)
          SELECT DISTINCT document_id, $2::uuid, FALSE
          FROM document_node_links
          WHERE node_id = $1
          ON CONFLICT (document_id, node_id) DO NOTHING
          `,
          [nodeId, targetNodeId]
        );

        await client.query(
          `
          DELETE FROM document_node_links
          WHERE node_id = $1
          `,
          [nodeId]
        );

        await client.query(
          `
          UPDATE document_node_links target
          SET is_primary = TRUE
          WHERE target.node_id = $2
            AND target.document_id = ANY($1::uuid[])
            AND NOT EXISTS (
              SELECT 1
              FROM document_node_links existing
              WHERE existing.document_id = target.document_id
                AND existing.is_primary = TRUE
            )
          `,
          [documentIds, targetNodeId]
        );

        movedDocuments = documentIds.length;
      }

      await client.query(
        `
        DELETE FROM job_node_links
        WHERE node_id = $1
        `,
        [nodeId]
      );

      await client.query(`DELETE FROM knowledge_nodes WHERE id = $1`, [nodeId]);

      await client.query("COMMIT");
      return {
        deleted: true,
        movedDocuments,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteKnowledgeNodeCascade(rootNodeId) {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      const rootResult = await client.query(
        `SELECT * FROM knowledge_nodes WHERE id = $1 FOR UPDATE`,
        [rootNodeId]
      );
      const root = rootResult.rows[0] ?? null;
      if (!root) {
        throw providerError("NODE_NOT_FOUND", "Раздел не найден");
      }
      if (root.is_system) {
        throw providerError("SYSTEM_NODE_LOCKED", "Системный раздел нельзя удалить");
      }

      const unsortedResult = await client.query(
        `
        SELECT id
        FROM knowledge_nodes
        WHERE is_system = TRUE AND lower(name) = lower($1)
        ORDER BY created_at ASC
        LIMIT 1
        `,
        [UNSORTED_NODE_NAME]
      );
      const unsortedId = unsortedResult.rows[0]?.id ?? null;
      if (!unsortedId) {
        throw providerError("TARGET_NODE_NOT_FOUND", 'Не найден системный раздел "Без раздела"');
      }

      const subtreeResult = await client.query(
        `
        SELECT c.descendant_id AS id, c.depth
        FROM knowledge_node_closure c
        WHERE c.ancestor_id = $1
        ORDER BY c.depth DESC
        `,
        [rootNodeId]
      );
      const subtreeNodes = subtreeResult.rows;
      const subtreeIds = subtreeNodes.map((r) => r.id);

      if (subtreeIds.includes(unsortedId)) {
        throw providerError(
          "SYSTEM_NODE_LOCKED",
          'Системный раздел "Без раздела" попал в поддерево — операция отменена'
        );
      }

      const docsResult = await client.query(
        `SELECT DISTINCT document_id FROM document_node_links WHERE node_id = ANY($1::uuid[])`,
        [subtreeIds]
      );
      const documentIds = docsResult.rows.map((r) => r.document_id);

      if (documentIds.length > 0) {
        await client.query(
          `
          INSERT INTO document_node_links (document_id, node_id, is_primary)
          SELECT DISTINCT document_id, $2::uuid, FALSE
          FROM document_node_links
          WHERE node_id = ANY($1::uuid[])
          ON CONFLICT (document_id, node_id) DO NOTHING
          `,
          [subtreeIds, unsortedId]
        );

        await client.query(
          `DELETE FROM document_node_links WHERE node_id = ANY($1::uuid[])`,
          [subtreeIds]
        );

        await client.query(
          `
          UPDATE document_node_links target
          SET is_primary = TRUE
          WHERE target.node_id = $2
            AND target.document_id = ANY($1::uuid[])
            AND NOT EXISTS (
              SELECT 1
              FROM document_node_links existing
              WHERE existing.document_id = target.document_id
                AND existing.is_primary = TRUE
            )
          `,
          [documentIds, unsortedId]
        );
      }

      await client.query(
        `DELETE FROM job_node_links WHERE node_id = ANY($1::uuid[])`,
        [subtreeIds]
      );

      for (const node of subtreeNodes) {
        await client.query(`DELETE FROM knowledge_nodes WHERE id = $1`, [node.id]);
      }

      await client.query("COMMIT");
      return {
        deleted: true,
        cascade: true,
        movedDocuments: documentIds.length,
        deletedNodes: subtreeIds.length,
        documentIds,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async listDocumentsForKnowledgeNode(nodeId, { includeChildren = true, limit = 100 } = {}) {
    const parsedLimit = Number(limit);
    const normalizedLimit = Number.isFinite(parsedLimit)
      ? Math.max(1, Math.min(500, Math.trunc(parsedLimit)))
      : 100;

    const node = await this.getKnowledgeNodeById(nodeId);
    if (!node) {
      return null;
    }

    const result = await this.pool.query(
      `
      WITH scope_nodes AS (
        SELECT $1::uuid AS node_id
        WHERE $2::boolean = FALSE
        UNION
        SELECT descendant_id AS node_id
        FROM knowledge_node_closure
        WHERE ancestor_id = $1 AND $2::boolean = TRUE
      ),
      scoped_documents AS (
        SELECT DISTINCT dnl.document_id
        FROM document_node_links dnl
        JOIN scope_nodes ON scope_nodes.node_id = dnl.node_id
        UNION
        SELECT d.id
        FROM documents d
        WHERE $3::boolean = TRUE
          AND NOT EXISTS (
            SELECT 1
            FROM document_node_links existing
            WHERE existing.document_id = d.id
          )
      )
      SELECT
        d.id,
        d.title,
        d.source_type,
        d.original_file_name,
        d.original_file_path,
        d.categories,
        d.status,
        d.created_at,
        d.updated_at,
        COALESCE(chunk_counts.chunk_count, 0) AS chunk_count,
        COALESCE(asset_counts.page_count, 0) AS page_count,
        COALESCE(node_links.node_links, '[]'::jsonb) AS node_links
      FROM scoped_documents scoped
      JOIN documents d ON d.id = scoped.document_id
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS chunk_count
        FROM document_chunks c
        WHERE c.document_id = d.id
      ) chunk_counts ON TRUE
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS page_count
        FROM document_assets a
        WHERE a.document_id = d.id
      ) asset_counts ON TRUE
      LEFT JOIN LATERAL (
        SELECT jsonb_agg(
          jsonb_build_object(
            'node_id', dnl.node_id,
            'name', n.name,
            'type_label', n.type_label,
            'color', n.color,
            'is_primary', dnl.is_primary,
            'is_system', n.is_system
          )
          ORDER BY dnl.is_primary DESC, n.sort_order ASC, lower(n.name) ASC
        ) AS node_links
        FROM document_node_links dnl
        JOIN knowledge_nodes n ON n.id = dnl.node_id
        WHERE dnl.document_id = d.id
      ) node_links ON TRUE
      ORDER BY d.created_at DESC
      LIMIT $4
      `,
      [nodeId, includeChildren === true, node.is_system === true, normalizedLimit]
    );

    return result.rows;
  }

  async listTags({ nodeId = null, includeChildren = true, limit = 200 } = {}) {
    const parsedLimit = Number(limit);
    const normalizedLimit = Number.isFinite(parsedLimit)
      ? Math.max(1, Math.min(500, Math.trunc(parsedLimit)))
      : 200;

    const normalizedNodeId = String(nodeId ?? "").trim();
    const params = [];
    let scopedDocumentsSql = `
      scoped_documents AS (
        SELECT d.id AS document_id
        FROM documents d
      )
    `;

    if (normalizedNodeId) {
      const node = await this.getKnowledgeNodeById(normalizedNodeId);
      if (!node) {
        return null;
      }

      params.push(normalizedNodeId);
      const nodePlaceholder = `$${params.length}`;
      params.push(includeChildren === true);
      const includeChildrenPlaceholder = `$${params.length}`;
      params.push(node.is_system === true);
      const includeUnlinkedPlaceholder = `$${params.length}`;

      scopedDocumentsSql = `
        scope_nodes AS (
          SELECT ${nodePlaceholder}::uuid AS node_id
          WHERE ${includeChildrenPlaceholder}::boolean = FALSE
          UNION
          SELECT descendant_id AS node_id
          FROM knowledge_node_closure
          WHERE ancestor_id = ${nodePlaceholder}::uuid
            AND ${includeChildrenPlaceholder}::boolean = TRUE
        ),
        scoped_documents AS (
          SELECT DISTINCT dnl.document_id
          FROM document_node_links dnl
          JOIN scope_nodes ON scope_nodes.node_id = dnl.node_id
          UNION
          SELECT d.id
          FROM documents d
          WHERE ${includeUnlinkedPlaceholder}::boolean = TRUE
            AND NOT EXISTS (
              SELECT 1
              FROM document_node_links existing
              WHERE existing.document_id = d.id
            )
        )
      `;
    }

    params.push(normalizedLimit);
    const limitPlaceholder = `$${params.length}`;
    const result = await this.pool.query(
      `
      WITH ${scopedDocumentsSql},
      raw_tags AS (
        SELECT
          sd.document_id,
          trim(tag_value.value) AS tag
        FROM scoped_documents sd
        JOIN documents d ON d.id = sd.document_id
        CROSS JOIN LATERAL jsonb_array_elements_text(
          CASE
            WHEN jsonb_typeof(d.categories) = 'array' THEN d.categories
            ELSE '[]'::jsonb
          END
        ) AS tag_value(value)
        WHERE trim(tag_value.value) <> ''
      ),
      normalized_tags AS (
        SELECT
          document_id,
          CASE
            WHEN lower(tag) = 'met-o' THEN 'metso'
            ELSE tag
          END AS tag
        FROM raw_tags
      )
      SELECT
        lower(tag) AS key,
        min(tag) AS tag,
        COUNT(DISTINCT document_id)::int AS count
      FROM normalized_tags
      GROUP BY lower(tag)
      ORDER BY COUNT(DISTINCT document_id) DESC, min(tag) ASC
      LIMIT ${limitPlaceholder}
      `,
      params
    );

    return result.rows;
  }

  async listDocumentsWithTag(tagName) {
    const normalized = String(tagName ?? "").trim();
    if (!normalized) return [];
    const result = await this.pool.query(
      `
      SELECT id, categories
      FROM documents
      WHERE jsonb_typeof(categories) = 'array'
        AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(categories) AS t(value)
          WHERE lower(trim(t.value)) = lower($1)
        )
      `,
      [normalized]
    );
    return result.rows.map((row) => ({
      id: row.id,
      categories: Array.isArray(row.categories) ? row.categories : [],
    }));
  }

  async renameTagAcrossDocuments(oldName, newName) {
    const oldTrim = String(oldName ?? "").trim();
    const newTrim = String(newName ?? "").trim();
    if (!oldTrim || !newTrim) {
      throw Object.assign(new Error("Имя тега не может быть пустым"), { statusCode: 400 });
    }
    const oldLower = oldTrim.toLowerCase();
    const newLower = newTrim.toLowerCase();
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const docs = await client.query(
        `
        SELECT id, categories
        FROM documents
        WHERE jsonb_typeof(categories) = 'array'
          AND EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(categories) AS t(value)
            WHERE lower(trim(t.value)) = $1
          )
        FOR UPDATE
        `,
        [oldLower]
      );
      const updatedIds = [];
      for (const row of docs.rows) {
        const before = Array.isArray(row.categories) ? row.categories : [];
        const map = new Map();
        for (const raw of before) {
          const value = String(raw ?? "").trim();
          if (!value) continue;
          const lower = value.toLowerCase();
          if (lower === oldLower) {
            if (!map.has(newLower)) map.set(newLower, newTrim);
            continue;
          }
          if (!map.has(lower)) map.set(lower, value);
        }
        if (oldLower !== newLower && !map.has(newLower)) {
          map.set(newLower, newTrim);
        }
        const after = Array.from(map.values());
        await client.query(
          `UPDATE documents SET categories = $2::jsonb, updated_at = NOW() WHERE id = $1`,
          [row.id, JSON.stringify(after)]
        );
        await client.query(
          `UPDATE document_chunks SET categories = $2::jsonb, updated_at = NOW() WHERE document_id = $1`,
          [row.id, JSON.stringify(after)]
        );
        updatedIds.push(row.id);
      }
      await client.query("COMMIT");
      return { updatedIds, count: updatedIds.length };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteTagAcrossDocuments(tagName) {
    const normalized = String(tagName ?? "").trim();
    if (!normalized) {
      throw Object.assign(new Error("Имя тега не может быть пустым"), { statusCode: 400 });
    }
    const targetLower = normalized.toLowerCase();
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const docs = await client.query(
        `
        SELECT id, categories
        FROM documents
        WHERE jsonb_typeof(categories) = 'array'
          AND EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(categories) AS t(value)
            WHERE lower(trim(t.value)) = $1
          )
        FOR UPDATE
        `,
        [targetLower]
      );
      const updatedIds = [];
      for (const row of docs.rows) {
        const before = Array.isArray(row.categories) ? row.categories : [];
        const after = before.filter((value) => String(value ?? "").trim().toLowerCase() !== targetLower);
        await client.query(
          `UPDATE documents SET categories = $2::jsonb, updated_at = NOW() WHERE id = $1`,
          [row.id, JSON.stringify(after)]
        );
        await client.query(
          `UPDATE document_chunks SET categories = $2::jsonb, updated_at = NOW() WHERE document_id = $1`,
          [row.id, JSON.stringify(after)]
        );
        updatedIds.push(row.id);
      }
      await client.query("COMMIT");
      return { updatedIds, count: updatedIds.length };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async listAllDocumentIds() {
    const result = await this.pool.query(
      `
      SELECT id
      FROM documents
      ORDER BY created_at DESC
      `
    );

    return result.rows.map((row) => row.id);
  }

  async listDocumentIdsForKnowledgeNode(nodeId, { includeChildren = true } = {}) {
    const node = await this.getKnowledgeNodeById(nodeId);
    if (!node) {
      return null;
    }

    const result = await this.pool.query(
      `
      WITH scope_nodes AS (
        SELECT $1::uuid AS node_id
        WHERE $2::boolean = FALSE
        UNION
        SELECT descendant_id AS node_id
        FROM knowledge_node_closure
        WHERE ancestor_id = $1 AND $2::boolean = TRUE
      ),
      scoped_documents AS (
        SELECT DISTINCT dnl.document_id
        FROM document_node_links dnl
        JOIN scope_nodes ON scope_nodes.node_id = dnl.node_id
        UNION
        SELECT d.id
        FROM documents d
        WHERE $3::boolean = TRUE
          AND NOT EXISTS (
            SELECT 1
            FROM document_node_links existing
            WHERE existing.document_id = d.id
          )
      )
      SELECT d.id
      FROM scoped_documents scoped
      JOIN documents d ON d.id = scoped.document_id
      ORDER BY d.created_at DESC
      `,
      [nodeId, includeChildren === true, node.is_system === true]
    );

    return result.rows.map((row) => row.id);
  }

  async listDocumentNodeLinks(documentId) {
    const result = await this.pool.query(
      `
      SELECT
        dnl.document_id,
        dnl.node_id,
        dnl.is_primary,
        dnl.created_at AS linked_at,
        n.parent_id,
        n.name,
        n.type_label,
        n.color,
        n.sort_order,
        n.is_active,
        n.is_system,
        n.description,
        n.created_at,
        n.updated_at
      FROM document_node_links dnl
      JOIN knowledge_nodes n ON n.id = dnl.node_id
      WHERE dnl.document_id = $1
      ORDER BY dnl.is_primary DESC, n.sort_order ASC, lower(n.name) ASC
      `,
      [documentId]
    );

    return result.rows;
  }

  async normalizeDocumentNodeIds(nodeIds) {
    const uniqueNodeIds = Array.from(
      new Set((Array.isArray(nodeIds) ? nodeIds : []).map((item) => String(item)).filter(Boolean))
    );

    if (uniqueNodeIds.length > 0) {
      return uniqueNodeIds;
    }

    const unsortedNode = await this.getUnsortedKnowledgeNode();
    if (!unsortedNode) {
      throw providerError("TARGET_NODE_NOT_FOUND", "Не найден системный раздел Без раздела");
    }

    return [unsortedNode.id];
  }

  async assertKnowledgeNodesExist(nodeIds) {
    const uniqueNodeIds = Array.from(new Set(nodeIds));
    if (uniqueNodeIds.length === 0) {
      return;
    }

    const result = await this.pool.query(
      `
      SELECT id
      FROM knowledge_nodes
      WHERE id = ANY($1::uuid[]) AND is_active = TRUE
      `,
      [uniqueNodeIds]
    );
    const foundIds = new Set(result.rows.map((row) => row.id));
    const missingIds = uniqueNodeIds.filter((nodeId) => !foundIds.has(nodeId));
    if (missingIds.length > 0) {
      throw providerError("NODE_NOT_FOUND", "Один или несколько разделов не найдены", {
        nodeIds: missingIds,
      });
    }
  }

  async replaceDocumentNodeLinks(documentId, { nodeIds = [], primaryNodeId = null } = {}) {
    const normalizedNodeIds = await this.normalizeDocumentNodeIds(nodeIds);
    await this.assertKnowledgeNodesExist(normalizedNodeIds);
    const normalizedPrimaryNodeId =
      primaryNodeId && normalizedNodeIds.includes(primaryNodeId)
        ? primaryNodeId
        : normalizedNodeIds[0];

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const documentResult = await client.query(
        `
        SELECT id
        FROM documents
        WHERE id = $1
        LIMIT 1
        `,
        [documentId]
      );
      if (!documentResult.rows[0]) {
        throw providerError("DOCUMENT_NOT_FOUND", "Документ не найден");
      }

      await client.query(`DELETE FROM document_node_links WHERE document_id = $1`, [documentId]);

      for (const nodeId of normalizedNodeIds) {
        await client.query(
          `
          INSERT INTO document_node_links (document_id, node_id, is_primary)
          VALUES ($1, $2, $3)
          `,
          [documentId, nodeId, nodeId === normalizedPrimaryNodeId]
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return this.listDocumentNodeLinks(documentId);
  }

  async addDocumentNodeLinks(documentId, { nodeIds = [], primaryNodeId = null } = {}) {
    const [existingLinks, normalizedNodeIds] = await Promise.all([
      this.listDocumentNodeLinks(documentId),
      this.normalizeDocumentNodeIds(nodeIds),
    ]);
    const mergedNodeIds = Array.from(
      new Set([
        ...existingLinks.map((link) => link.node_id),
        ...normalizedNodeIds,
      ])
    );
    const existingPrimary = existingLinks.find((link) => link.is_primary)?.node_id ?? null;

    return this.replaceDocumentNodeLinks(documentId, {
      nodeIds: mergedNodeIds,
      primaryNodeId: primaryNodeId ?? existingPrimary ?? normalizedNodeIds[0] ?? mergedNodeIds[0],
    });
  }

  async unlinkDocumentNode(documentId, nodeId) {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      const documentResult = await client.query(
        `
        SELECT id
        FROM documents
        WHERE id = $1
        LIMIT 1
        `,
        [documentId]
      );
      if (!documentResult.rows[0]) {
        throw providerError("DOCUMENT_NOT_FOUND", "Документ не найден");
      }

      await client.query(
        `
        DELETE FROM document_node_links
        WHERE document_id = $1 AND node_id = $2
        `,
        [documentId, nodeId]
      );

      const remainingResult = await client.query(
        `
        SELECT node_id, is_primary
        FROM document_node_links
        WHERE document_id = $1
        ORDER BY is_primary DESC, created_at ASC
        `,
        [documentId]
      );

      if (remainingResult.rows.length === 0) {
        const unsortedResult = await client.query(
          `
          SELECT id
          FROM knowledge_nodes
          WHERE is_system = TRUE AND lower(name) = lower($1)
          ORDER BY created_at ASC
          LIMIT 1
          `,
          [UNSORTED_NODE_NAME]
        );
        const unsortedNodeId = unsortedResult.rows[0]?.id ?? null;
        if (!unsortedNodeId) {
          throw providerError("TARGET_NODE_NOT_FOUND", "Не найден системный раздел Без раздела");
        }

        await client.query(
          `
          INSERT INTO document_node_links (document_id, node_id, is_primary)
          VALUES ($1, $2, TRUE)
          ON CONFLICT (document_id, node_id)
          DO UPDATE SET is_primary = TRUE
          `,
          [documentId, unsortedNodeId]
        );
      } else if (!remainingResult.rows.some((row) => row.is_primary)) {
        await client.query(
          `
          UPDATE document_node_links
          SET is_primary = TRUE
          WHERE document_id = $1 AND node_id = $2
          `,
          [documentId, remainingResult.rows[0].node_id]
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return this.listDocumentNodeLinks(documentId);
  }

  async replaceJobNodeLinks(jobId, nodeIds = []) {
    const normalizedNodeIds = await this.normalizeDocumentNodeIds(nodeIds);
    await this.assertKnowledgeNodesExist(normalizedNodeIds);

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const jobResult = await client.query(
        `
        SELECT id
        FROM ingestion_jobs
        WHERE id = $1
        LIMIT 1
        `,
        [jobId]
      );
      if (!jobResult.rows[0]) {
        throw providerError("JOB_NOT_FOUND", "Задача не найдена");
      }

      await client.query(`DELETE FROM job_node_links WHERE job_id = $1`, [jobId]);
      for (const nodeId of normalizedNodeIds) {
        await client.query(
          `
          INSERT INTO job_node_links (job_id, node_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
          `,
          [jobId, nodeId]
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return normalizedNodeIds;
  }

  async buildDocumentNodePayload(documentId) {
    const document = await this.getDocumentById(documentId);
    if (!document) {
      throw providerError("DOCUMENT_NOT_FOUND", "Документ не найден");
    }

    const directLinks = await this.listDocumentNodeLinks(documentId);
    const effectiveLinks =
      directLinks.length > 0
        ? directLinks
        : [await this.getUnsortedKnowledgeNode()].filter(Boolean).map((node) => ({
            node_id: node.id,
            is_primary: true,
            parent_id: node.parent_id,
            name: node.name,
            type_label: node.type_label,
            color: node.color,
            sort_order: node.sort_order,
            is_active: node.is_active,
            is_system: node.is_system,
            description: node.description,
            created_at: node.created_at,
            updated_at: node.updated_at,
          }));

    if (effectiveLinks.length === 0) {
      throw providerError("TARGET_NODE_NOT_FOUND", "Не найден системный раздел Без раздела");
    }

    const nodeIds = effectiveLinks.map((link) => link.node_id);
    const primaryNodeId =
      effectiveLinks.find((link) => link.is_primary)?.node_id ?? effectiveLinks[0].node_id;

    const [scopeResult, pathResult] = await Promise.all([
      this.pool.query(
        `
        SELECT DISTINCT c.ancestor_id AS node_id
        FROM knowledge_node_closure c
        WHERE c.descendant_id = ANY($1::uuid[])
        ORDER BY c.ancestor_id ASC
        `,
        [nodeIds]
      ),
      this.pool.query(
        `
        WITH direct_nodes AS (
          SELECT unnest($1::uuid[]) AS node_id
        )
        SELECT
          direct_nodes.node_id,
          string_agg(n.name, ' / ' ORDER BY c.depth DESC) AS path
        FROM direct_nodes
        JOIN knowledge_node_closure c ON c.descendant_id = direct_nodes.node_id
        JOIN knowledge_nodes n ON n.id = c.ancestor_id
        GROUP BY direct_nodes.node_id
        ORDER BY min(n.sort_order) ASC, lower(string_agg(n.name, ' / ' ORDER BY c.depth DESC)) ASC
        `,
        [nodeIds]
      ),
    ]);

    const nodePaths = pathResult.rows.map((row) => row.path).filter(Boolean);

    return {
      node_ids: nodeIds,
      node_scope_ids: scopeResult.rows.map((row) => row.node_id),
      primary_node_id: primaryNodeId,
      node_paths: nodePaths,
      payload_version: 2,
    };
  }

  async getDocumentNodeIds(documentId) {
    const result = await this.pool.query(
      `SELECT node_id, is_primary FROM document_node_links WHERE document_id = $1`,
      [documentId]
    );
    return result.rows.map((row) => ({ nodeId: row.node_id, isPrimary: row.is_primary }));
  }

  async getNodeSyncStatus() {
    const result = await this.pool.query(
      `
      SELECT
        id,
        last_reindex_at,
        last_scope,
        last_target_id,
        last_document_count,
        last_point_count,
        last_error,
        updated_at
      FROM node_sync_status
      WHERE id = 1
      LIMIT 1
      `
    );

    return result.rows[0] ?? null;
  }

  async recordNodeSyncStatus({
    scope,
    targetId = null,
    documentCount = 0,
    pointCount = 0,
    errorMessage = null,
  }) {
    const result = await this.pool.query(
      `
      INSERT INTO node_sync_status (
        id,
        last_reindex_at,
        last_scope,
        last_target_id,
        last_document_count,
        last_point_count,
        last_error,
        updated_at
      )
      VALUES (1, NOW(), $1, $2, $3, $4, $5, NOW())
      ON CONFLICT (id)
      DO UPDATE SET
        last_reindex_at = EXCLUDED.last_reindex_at,
        last_scope = EXCLUDED.last_scope,
        last_target_id = EXCLUDED.last_target_id,
        last_document_count = EXCLUDED.last_document_count,
        last_point_count = EXCLUDED.last_point_count,
        last_error = EXCLUDED.last_error,
        updated_at = NOW()
      RETURNING *
      `,
      [
        scope,
        targetId,
        Math.max(0, Number(documentCount) || 0),
        Math.max(0, Number(pointCount) || 0),
        errorMessage,
      ]
    );

    return result.rows[0];
  }

  async listDocuments({ limit = null } = {}) {
    const parsedLimit = Number(limit);
    const hasLimit =
      limit !== undefined &&
      limit !== null &&
      limit !== "" &&
      Number.isFinite(parsedLimit);
    const params = [];
    const limitSql = hasLimit
      ? `LIMIT $${params.push(Math.max(1, Math.min(500, Math.trunc(parsedLimit))))}`
      : "";

    const result = await this.pool.query(
      `
      SELECT
        d.id,
        d.title,
        d.source_type,
        d.original_file_name,
        d.original_file_path,
        d.categories,
        d.status,
        d.created_at,
        d.updated_at,
        COALESCE(chunk_counts.chunk_count, 0) AS chunk_count,
        COALESCE(asset_counts.page_count, 0) AS page_count,
        COALESCE(node_links.node_links, '[]'::jsonb) AS node_links
      FROM documents d
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS chunk_count
        FROM document_chunks c
        WHERE c.document_id = d.id
      ) chunk_counts ON TRUE
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS page_count
        FROM document_assets a
        WHERE a.document_id = d.id
      ) asset_counts ON TRUE
      LEFT JOIN LATERAL (
        SELECT jsonb_agg(
          jsonb_build_object(
            'node_id', dnl.node_id,
            'name', n.name,
            'type_label', n.type_label,
            'color', n.color,
            'is_primary', dnl.is_primary,
            'is_system', n.is_system
          )
          ORDER BY dnl.is_primary DESC, n.sort_order ASC, lower(n.name) ASC
        ) AS node_links
        FROM document_node_links dnl
        JOIN knowledge_nodes n ON n.id = dnl.node_id
        WHERE dnl.document_id = d.id
      ) node_links ON TRUE
      ORDER BY d.created_at DESC
      ${limitSql}
      `,
      params
    );

    return result.rows;
  }

  async listDuplicateDocuments({ pathPrefix = "" } = {}) {
    const normalizedPrefix = String(pathPrefix ?? "").trim();
    const params = [];
    const conditions = [
      `d.status = 'indexed'`,
      `COALESCE(d.original_file_name, '') <> ''`,
    ];

    if (normalizedPrefix) {
      params.push(`${normalizedPrefix}%`);
      conditions.push(`d.original_file_path ILIKE $${params.length}`);
    }

    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await this.pool.query(
      `
      WITH ranked AS (
        SELECT
          d.id,
          d.title,
          d.source_type,
          d.original_file_name,
          d.original_file_path,
          d.categories,
          d.status,
          d.created_at,
          d.updated_at,
          lower(d.original_file_name) AS duplicate_key,
          COUNT(*) OVER (
            PARTITION BY lower(d.original_file_name), d.source_type
          ) AS duplicate_count,
          ROW_NUMBER() OVER (
            PARTITION BY lower(d.original_file_name), d.source_type
            ORDER BY d.created_at DESC, d.id DESC
          ) AS keep_rank
        FROM documents d
        ${whereSql}
      )
      SELECT
        ranked.*,
        COALESCE(chunk_counts.chunk_count, 0) AS chunk_count
      FROM ranked
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS chunk_count
        FROM document_chunks c
        WHERE c.document_id = ranked.id
      ) chunk_counts ON TRUE
      WHERE ranked.duplicate_count > 1
      ORDER BY ranked.duplicate_key ASC, ranked.keep_rank ASC, ranked.created_at DESC
      `,
      params
    );

    return result.rows;
  }

  async getDocumentChunks(documentId) {
    const result = await this.pool.query(
      `
      SELECT
        id,
        document_id,
        chunk_index,
        text,
        context,
        text_with_context,
        token_estimate,
        categories,
        source_url,
        file_url,
        created_at,
        updated_at
      FROM document_chunks
      WHERE document_id = $1
      ORDER BY chunk_index ASC
      `,
      [documentId]
    );

    return result.rows;
  }

  async countQdrantRebuildRecords({
    documentIds = [],
    includeChunks = true,
    includeAssets = true,
    documentStatus = null,
  } = {}) {
    const ids = Array.isArray(documentIds)
      ? documentIds.map((id) => String(id ?? "").trim()).filter(Boolean)
      : [];
    const params = [];
    const documentFilters = [];

    if (ids.length > 0) {
      params.push(ids);
      documentFilters.push(`d.id = ANY($${params.length}::uuid[])`);
    }
    if (documentStatus) {
      params.push(String(documentStatus));
      documentFilters.push(`d.status = $${params.length}`);
    }
    const documentFilterSql = documentFilters.length
      ? `AND ${documentFilters.join(" AND ")}`
      : "";

    const result = await this.pool.query(
      `
      SELECT
        ${
          includeChunks
            ? `(
                SELECT COUNT(*)::int
                FROM document_chunks c
                JOIN documents d ON d.id = c.document_id
                WHERE TRUE ${documentFilterSql}
              )`
            : "0"
        } AS chunk_count,
        ${
          includeAssets
            ? `(
                SELECT COUNT(*)::int
                FROM document_assets a
                JOIN documents d ON d.id = a.document_id
                WHERE TRUE ${documentFilterSql}
              )`
            : "0"
        } AS asset_count
      `,
      params
    );

    const row = result.rows[0] ?? {};
    const chunkCount = Number(row.chunk_count ?? 0);
    const assetCount = Number(row.asset_count ?? 0);
    return {
      chunkCount,
      assetCount,
      totalCount: chunkCount + assetCount,
    };
  }

  async listQdrantRebuildRecords({
    documentIds = [],
    includeChunks = true,
    includeAssets = true,
    documentStatus = null,
    limit = 100,
    offset = 0,
  } = {}) {
    const ids = Array.isArray(documentIds)
      ? documentIds.map((id) => String(id ?? "").trim()).filter(Boolean)
      : [];
    const params = [];
    const documentFilters = [];

    if (ids.length > 0) {
      params.push(ids);
      documentFilters.push(`d.id = ANY($${params.length}::uuid[])`);
    }
    if (documentStatus) {
      params.push(String(documentStatus));
      documentFilters.push(`d.status = $${params.length}`);
    }
    const documentFilterSql = documentFilters.length
      ? `AND ${documentFilters.join(" AND ")}`
      : "";

    const selects = [];
    if (includeChunks) {
      selects.push(`
        SELECT
          c.id AS point_id,
          c.document_id,
          NULL::uuid AS asset_id,
          c.id AS chunk_id,
          'chunk'::text AS resource_type,
          NULL::text AS asset_type,
          NULL::text AS asset_class,
          NULL::text AS asset_confidence,
          '[]'::jsonb AS engineering_topics,
          '[]'::jsonb AS signal_tags,
          NULL::integer AS page_number,
          c.chunk_index,
          d.title,
          NULL::text AS file_name,
          NULL::text AS relative_path,
          NULL::text AS mime_type,
          c.text,
          c.context,
          c.text_with_context,
          d.categories,
          d.original_file_path AS source_path,
          c.source_url,
          c.file_url,
          d.created_at AS document_created_at,
          0 AS resource_rank,
          COALESCE(c.text_with_context, c.text, '') AS embed_text
        FROM document_chunks c
        JOIN documents d ON d.id = c.document_id
        WHERE TRUE ${documentFilterSql}
      `);
    }

    if (includeAssets) {
      selects.push(`
        SELECT
          a.id AS point_id,
          a.document_id,
          a.id AS asset_id,
          NULL::uuid AS chunk_id,
          'asset'::text AS resource_type,
          a.asset_type,
          a.metadata_json ->> 'assetClass' AS asset_class,
          a.metadata_json ->> 'confidence' AS asset_confidence,
          COALESCE(a.metadata_json -> 'engineeringTopics', '[]'::jsonb) AS engineering_topics,
          COALESCE(a.metadata_json -> 'signalTags', '[]'::jsonb) AS signal_tags,
          a.page_number,
          COALESCE(a.page_number - 1, 0) AS chunk_index,
          COALESCE(a.title, d.title) AS title,
          a.file_name,
          a.relative_path,
          a.mime_type,
          COALESCE(a.text_excerpt, '') AS text,
          concat_ws(' ', 'PDF-страница', a.page_number::text) AS context,
          concat_ws(E'\n\n', COALESCE(a.title, d.title), COALESCE(a.text_content, a.text_excerpt, '')) AS text_with_context,
          d.categories,
          d.original_file_path AS source_path,
          NULL::text AS source_url,
          NULL::text AS file_url,
          d.created_at AS document_created_at,
          1 AS resource_rank,
          concat_ws(E'\n\n', COALESCE(a.title, d.title), COALESCE(a.text_content, a.text_excerpt, '')) AS embed_text
        FROM document_assets a
        JOIN documents d ON d.id = a.document_id
        WHERE TRUE ${documentFilterSql}
      `);
    }

    if (selects.length === 0) {
      return [];
    }

    params.push(Math.max(1, Math.min(500, Math.trunc(Number(limit) || 100))));
    const limitPlaceholder = `$${params.length}`;
    params.push(Math.max(0, Math.trunc(Number(offset) || 0)));
    const offsetPlaceholder = `$${params.length}`;

    const result = await this.pool.query(
      `
      WITH records AS (
        ${selects.join("\nUNION ALL\n")}
      )
      SELECT *
      FROM records
      ORDER BY document_created_at ASC, document_id ASC, resource_rank ASC, chunk_index ASC, point_id ASC
      LIMIT ${limitPlaceholder}
      OFFSET ${offsetPlaceholder}
      `,
      params
    );

    return result.rows;
  }

  async getDocumentById(documentId) {
    const result = await this.pool.query(
      `
      SELECT
        id,
        title,
        slug,
        source_type,
        original_file_path,
        original_file_name,
        mime_type,
        checksum,
        categories,
        status,
        created_at,
        updated_at
      FROM documents
      WHERE id = $1
      LIMIT 1
      `,
      [documentId]
    );

    return result.rows[0] ?? null;
  }

  async updateDocumentStatus(documentId, status) {
    const result = await this.pool.query(
      `
      UPDATE documents
      SET status = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [documentId, status]
    );

    return result.rows[0] ?? null;
  }

  async updateDocumentTitle(documentId, title) {
    const result = await this.pool.query(
      `
      UPDATE documents
      SET title = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [documentId, title]
    );

    return result.rows[0] ?? null;
  }

  async updateDocumentCategories(documentId, categories) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const normalizedCategories = JSON.stringify(Array.isArray(categories) ? categories : []);
      const result = await client.query(
        `
        UPDATE documents
        SET categories = $2::jsonb, updated_at = NOW()
        WHERE id = $1
        RETURNING *
        `,
        [documentId, normalizedCategories]
      );

      await client.query(
        `
        UPDATE document_chunks
        SET categories = $2::jsonb, updated_at = NOW()
        WHERE document_id = $1
        `,
        [documentId, normalizedCategories]
      );

      await client.query("COMMIT");
      return result.rows[0] ?? null;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async findIndexedDocumentByPathOrChecksum(originalFilePath, checksum) {
    const result = await this.pool.query(
      `
      SELECT
        id,
        title,
        slug,
        source_type,
        original_file_path,
        original_file_name,
        mime_type,
        checksum,
        categories,
        status,
        created_at,
        updated_at
      FROM documents
      WHERE status = 'indexed'
        AND (
          original_file_path = $1
          OR checksum = $2
        )
      ORDER BY updated_at DESC
      LIMIT 1
      `,
      [originalFilePath, checksum]
    );

    return result.rows[0] ?? null;
  }

  async listDocumentAssets(documentId) {
    const result = await this.pool.query(
      `
      SELECT
        id,
        document_id,
        asset_type,
        page_number,
        title,
        text_excerpt,
        text_content,
        file_name,
        relative_path,
        mime_type,
        size_bytes,
        metadata_json,
        created_at
      FROM document_assets
      WHERE document_id = $1
      ORDER BY page_number ASC NULLS LAST, created_at ASC
      `,
      [documentId]
    );

    return result.rows;
  }

  async getDocumentAssetByPage(documentId, pageNumber) {
    const result = await this.pool.query(
      `
      SELECT
        id,
        document_id,
        asset_type,
        page_number,
        title,
        text_excerpt,
        text_content,
        file_name,
        relative_path,
        mime_type,
        size_bytes,
        metadata_json,
        created_at
      FROM document_assets
      WHERE document_id = $1 AND page_number = $2
      LIMIT 1
      `,
      [documentId, pageNumber]
    );

    return result.rows[0] ?? null;
  }

  async listJobs(options = {}) {
    const statusMode = typeof options.statusMode === "string" ? options.statusMode : "all";
    const search = typeof options.search === "string" ? options.search.trim() : "";
    const nodeId = typeof options.nodeId === "string" ? options.nodeId.trim() : "";
    const includeChildren = options.includeChildren !== false;
    const parsedLimit = Number(options.limit);
    const limit = Number.isFinite(parsedLimit)
      ? Math.max(1, Math.min(200, Math.trunc(parsedLimit)))
      : 50;
    const parsedOffset = Number(options.offset);
    const offset = Number.isFinite(parsedOffset)
      ? Math.max(0, Math.trunc(parsedOffset))
      : 0;
    const statuses = Array.isArray(options.statuses)
      ? options.statuses.filter((s) => typeof s === "string" && s.trim() !== "")
      : null;

    const conditions = [];
    const params = [];

    if (statuses && statuses.length > 0) {
      params.push(statuses);
      conditions.push(`j.status = ANY($${params.length}::text[])`);
    } else if (statusMode === "active") {
      params.push(["queued", "running", "cancel_requested"]);
      conditions.push(`j.status = ANY($${params.length}::text[])`);
    } else if (statusMode === "history") {
      params.push(["completed", "failed", "cancelled"]);
      conditions.push(`j.status = ANY($${params.length}::text[])`);
    } else if (statusMode === "errors") {
      params.push(["failed", "cancelled"]);
      conditions.push(`j.status = ANY($${params.length}::text[])`);
    }

    if (search) {
      params.push(`%${search}%`);
      const placeholder = `$${params.length}`;
      conditions.push(`(
        COALESCE(d.title, '') ILIKE ${placeholder}
        OR COALESCE(d.original_file_name, '') ILIKE ${placeholder}
        OR COALESCE(d.original_file_path, '') ILIKE ${placeholder}
        OR COALESCE(j.error_message, '') ILIKE ${placeholder}
      )`);
    }

    let nodeFilterSql = "";
    if (nodeId) {
      const node = await this.getKnowledgeNodeById(nodeId);
      if (!node) {
        return null;
      }

      params.push(nodeId);
      const nodePlaceholder = `$${params.length}`;
      params.push(includeChildren === true);
      const includeChildrenPlaceholder = `$${params.length}`;
      params.push(node.is_system === true);
      const includeUnlinkedPlaceholder = `$${params.length}`;
      nodeFilterSql = `
        EXISTS (
          SELECT 1
          FROM job_node_links jnl
          WHERE jnl.job_id = j.id
            AND (
              (${includeChildrenPlaceholder}::boolean = FALSE AND jnl.node_id = ${nodePlaceholder}::uuid)
              OR (
                ${includeChildrenPlaceholder}::boolean = TRUE
                AND EXISTS (
                  SELECT 1
                  FROM knowledge_node_closure c
                  WHERE c.ancestor_id = ${nodePlaceholder}::uuid
                    AND c.descendant_id = jnl.node_id
                )
              )
            )
        )
        OR (
          ${includeUnlinkedPlaceholder}::boolean = TRUE
          AND NOT EXISTS (
            SELECT 1
            FROM job_node_links existing_jnl
            WHERE existing_jnl.job_id = j.id
          )
        )
      `;
      conditions.push(`(${nodeFilterSql})`);
    }

    const countParams = params.slice();
    params.push(limit);
    const limitPlaceholder = `$${params.length}`;
    params.push(offset);
    const offsetPlaceholder = `$${params.length}`;
    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [result, countResult] = await Promise.all([
      this.pool.query(
        `
      SELECT
        j.id,
        j.document_id,
        j.job_type,
        j.status,
        j.phase,
        j.error_message,
        j.total_items,
        j.processed_items,
        j.progress_message,
        j.pending_filename,
        j.pending_options,
        CASE
          WHEN j.total_items IS NOT NULL AND j.total_items > 0
          THEN ROUND((COALESCE(j.processed_items, 0)::numeric / j.total_items::numeric) * 100, 1)
          ELSE NULL
        END AS progress_percent,
        j.started_at,
        j.finished_at,
        j.created_at,
        d.title AS document_title,
        d.original_file_name,
        d.original_file_path,
        d.status AS document_status,
        COALESCE(chunk_counts.chunk_count, 0) AS chunk_count
      FROM ingestion_jobs j
      LEFT JOIN documents d ON d.id = j.document_id
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS chunk_count
        FROM document_chunks c
        WHERE c.document_id = j.document_id
      ) chunk_counts ON TRUE
      ${whereSql}
      ORDER BY COALESCE(j.finished_at, j.started_at, j.created_at) DESC
      LIMIT ${limitPlaceholder}
      OFFSET ${offsetPlaceholder}
      `,
        params
      ),
      this.pool.query(
        `
      SELECT COUNT(*)::int AS total
      FROM ingestion_jobs j
      LEFT JOIN documents d ON d.id = j.document_id
      ${whereSql}
      `,
        countParams
      ),
    ]);

    const rows = result.rows;
    const total = Number(countResult.rows[0]?.total ?? rows.length);
    rows.total = total;
    return rows;
  }

  async deleteJobById(jobId) {
    const result = await this.pool.query(
      `
      DELETE FROM ingestion_jobs
      WHERE id = $1
      `,
      [jobId]
    );

    return (result.rowCount ?? 0) > 0;
  }

  async getJobById(jobId) {
    const result = await this.pool.query(
      `
      SELECT
        j.id,
        j.document_id,
        j.job_type,
        j.status,
        j.phase,
        j.error_message,
        j.total_items,
        j.processed_items,
        j.progress_message,
        j.pending_filename,
        j.pending_options,
        j.started_at,
        j.finished_at,
        j.created_at,
        d.title AS document_title,
        d.original_file_name,
        d.original_file_path,
        d.categories,
        d.status AS document_status
      FROM ingestion_jobs j
      LEFT JOIN documents d ON d.id = j.document_id
      WHERE j.id = $1
      LIMIT 1
      `,
      [jobId]
    );

    return result.rows[0] ?? null;
  }

  async updateJobPhase(jobId, phase) {
    const result = await this.pool.query(
      `UPDATE ingestion_jobs SET phase = $2 WHERE id = $1 RETURNING phase`,
      [jobId, phase]
    );
    return result.rows[0]?.phase ?? null;
  }

  async requestJobCancellation(jobId) {
    const result = await this.pool.query(
      `
      UPDATE ingestion_jobs
      SET
        status = CASE
          WHEN status = 'running' THEN 'cancel_requested'
          WHEN status = 'queued' THEN 'cancelled'
          ELSE status
        END,
        progress_message = CASE
          WHEN status = 'running' THEN 'Остановка запрошена'
          WHEN status = 'queued' THEN 'Отменено пользователем'
          ELSE progress_message
        END,
        finished_at = CASE
          WHEN status = 'queued' THEN NOW()
          ELSE finished_at
        END
      WHERE id = $1
      RETURNING *
      `,
      [jobId]
    );

    return result.rows[0] ?? null;
  }

  async getDocumentPointIds(documentId) {
    const [chunkIds, assetIds] = await Promise.all([
      this.pool.query(`SELECT id FROM document_chunks WHERE document_id = $1`, [documentId]),
      this.pool.query(`SELECT id FROM document_assets WHERE document_id = $1`, [documentId]),
    ]);

    return [
      ...chunkIds.rows.map((row) => row.id),
      ...assetIds.rows.map((row) => row.id),
    ];
  }

  async listDocumentsByOriginalPath(originalFilePath) {
    const result = await this.pool.query(
      `
      SELECT
        id,
        title,
        original_file_path,
        categories,
        status
      FROM documents
      WHERE original_file_path = $1
      ORDER BY created_at DESC
      `,
      [originalFilePath]
    );

    return result.rows;
  }

  async deleteDocumentsByIds(documentIds) {
    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return 0;
    }

    const result = await this.pool.query(
      `
      DELETE FROM documents
      WHERE id = ANY($1::uuid[])
      `,
      [documentIds]
    );

    return result.rowCount ?? 0;
  }

  async clearDocumentContent(documentId) {
    await this.pool.query(`DELETE FROM document_assets WHERE document_id = $1`, [documentId]);
    await this.pool.query(`DELETE FROM document_chunks WHERE document_id = $1`, [documentId]);
  }

  async lexicalSearch(
    query,
    limit = 12,
    {
      nodeId = null,
      nodeIds = [],
      includeChildren = true,
      includeUnlinked = false,
      scope = "all",
      assetClass = "all",
      engineeringTopic = "all",
      signalTag = "all",
      documentId = null,
      documentIds = [],
      selectedTags = [],
    } = {}
  ) {
    const targetNodeIds = Array.from(
      new Set(
        [
          ...(Array.isArray(nodeIds) ? nodeIds : []),
          nodeId,
        ]
          .map((id) => String(id ?? "").trim())
          .filter(Boolean)
      )
    );
    const normalized = String(query ?? "").trim();
    if (!normalized) {
      return [];
    }

    const buildQueryVariants = (value) => {
      const source = String(value ?? "");
      const hasLatin = /[a-z]/i.test(source);
      const hasCyrillicConfusable = /[АВЕКМНОРСТХУавекмнорстху]/.test(source);
      if (!hasLatin || !hasCyrillicConfusable) {
        return [source];
      }

      const map = new Map([
        ["А", "A"], ["В", "B"], ["Е", "E"], ["К", "K"], ["М", "M"],
        ["Н", "H"], ["О", "O"], ["Р", "P"], ["С", "C"], ["Т", "T"],
        ["Х", "X"], ["У", "Y"], ["а", "a"], ["в", "b"], ["е", "e"],
        ["к", "k"], ["м", "m"], ["н", "h"], ["о", "o"], ["р", "p"],
        ["с", "c"], ["т", "t"], ["х", "x"], ["у", "y"],
      ]);
      const converted = Array.from(source, (char) => map.get(char) ?? char).join("");
      return Array.from(new Set([source, converted].filter(Boolean)));
    };

    const queryVariants = buildQueryVariants(normalized);
    const params = [normalized, queryVariants];
    const exactChunkMatchSql = `
      EXISTS (
        SELECT 1
        FROM unnest($2::text[]) AS query_variant(value)
        WHERE lower(coalesce(c.text_with_context, '')) LIKE '%' || lower(query_variant.value) || '%'
      )
    `;
    const exactAssetMatchSql = `
      EXISTS (
        SELECT 1
        FROM unnest($2::text[]) AS query_variant(value)
        WHERE lower(coalesce(concat_ws(' ', a.title, a.text_content), '')) LIKE '%' || lower(query_variant.value) || '%'
      )
    `;
    const normalizedSelectedTags = Array.from(
      new Set(
        (Array.isArray(selectedTags) ? selectedTags : String(selectedTags ?? "").split(","))
          .map((tag) => normalizeTagForCompare(tag))
          .filter(Boolean)
      )
    );
    const normalizedDocumentIds = Array.from(
      new Set(
        [
          ...(Array.isArray(documentIds) ? documentIds : []),
          documentId,
        ]
          .map((id) => String(id ?? "").trim())
          .filter(Boolean)
      )
    );
    const normalizedScope = String(scope ?? "all").trim();
    const normalizedAssetClass = String(assetClass ?? "all").trim();
    const normalizedEngineeringTopic = String(engineeringTopic ?? "all").trim();
    const normalizedSignalTag = String(signalTag ?? "all").trim().toUpperCase();

    const buildResourceScopeCondition = (resourceType) => {
      if (normalizedScope === "assets" && resourceType !== "asset") {
        return "AND FALSE";
      }
      if (normalizedScope === "chunks" && resourceType === "asset") {
        return "AND FALSE";
      }
      return "";
    };
    const buildDocumentCondition = (documentIdSql) => {
      if (normalizedDocumentIds.length === 0) {
        return "";
      }

      params.push(normalizedDocumentIds);
      const documentIdsPlaceholder = `$${params.length}`;
      return `AND ${documentIdSql} = ANY(${documentIdsPlaceholder}::uuid[])`;
    };
    const buildAssetOnlyChunkBlock = () => {
      if (
        (normalizedAssetClass && normalizedAssetClass !== "all") ||
        (normalizedEngineeringTopic && normalizedEngineeringTopic !== "all") ||
        (normalizedSignalTag && normalizedSignalTag !== "ALL")
      ) {
        return "AND FALSE";
      }
      return "";
    };
    const buildAssetMetadataCondition = () => {
      const conditions = [];

      if (normalizedAssetClass && normalizedAssetClass !== "all") {
        params.push(normalizedAssetClass);
        conditions.push(`AND a.metadata_json ->> 'assetClass' = $${params.length}`);
      }

      if (normalizedEngineeringTopic && normalizedEngineeringTopic !== "all") {
        params.push(normalizedEngineeringTopic);
        conditions.push(`
          AND EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(
              CASE
                WHEN jsonb_typeof(a.metadata_json -> 'engineeringTopics') = 'array'
                THEN a.metadata_json -> 'engineeringTopics'
                ELSE '[]'::jsonb
              END
            ) AS engineering_topic(value)
            WHERE engineering_topic.value = $${params.length}
          )
        `);
      }

      if (normalizedSignalTag && normalizedSignalTag !== "ALL") {
        params.push(normalizedSignalTag);
        conditions.push(`
          AND EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(
              CASE
                WHEN jsonb_typeof(a.metadata_json -> 'signalTags') = 'array'
                THEN a.metadata_json -> 'signalTags'
                ELSE '[]'::jsonb
              END
            ) AS signal_tag(value)
            WHERE upper(signal_tag.value) = $${params.length}
          )
        `);
      }

      return conditions.join("\n");
    };
    const nodePayloadSelectSql = `
      COALESCE(node_payload.node_ids, '[]'::jsonb) AS node_ids,
      COALESCE(node_payload.node_scope_ids, '[]'::jsonb) AS node_scope_ids,
      node_payload.primary_node_id,
      COALESCE(node_payload.node_paths, '[]'::jsonb) AS node_paths,
      2 AS payload_version
    `;
    const nodePayloadJoinSql = (documentIdSql) => `
      LEFT JOIN LATERAL (
        WITH existing_links AS (
          SELECT
            dnl.node_id,
            dnl.is_primary
          FROM document_node_links dnl
          WHERE dnl.document_id = ${documentIdSql}
        ),
        direct_links AS (
          SELECT node_id, is_primary
          FROM existing_links
          UNION ALL
          SELECT
            n.id AS node_id,
            TRUE AS is_primary
          FROM knowledge_nodes n
          WHERE n.is_system = TRUE
            AND lower(n.name) = lower('${UNSORTED_NODE_NAME}')
            AND NOT EXISTS (SELECT 1 FROM existing_links)
          ORDER BY is_primary DESC, node_id ASC
        ),
        path_rows AS (
          SELECT
            direct_links.node_id,
            string_agg(n.name, ' / ' ORDER BY c.depth DESC) AS path
          FROM direct_links
          JOIN knowledge_node_closure c ON c.descendant_id = direct_links.node_id
          JOIN knowledge_nodes n ON n.id = c.ancestor_id
          GROUP BY direct_links.node_id
        )
        SELECT
          jsonb_agg(DISTINCT direct_links.node_id::text) AS node_ids,
          jsonb_agg(DISTINCT cscope.ancestor_id::text) AS node_scope_ids,
          min(direct_links.node_id::text) FILTER (WHERE direct_links.is_primary) AS primary_node_id,
          jsonb_agg(DISTINCT path_rows.path) FILTER (WHERE path_rows.path IS NOT NULL) AS node_paths
        FROM direct_links
        LEFT JOIN knowledge_node_closure cscope ON cscope.descendant_id = direct_links.node_id
        LEFT JOIN path_rows ON path_rows.node_id = direct_links.node_id
      ) node_payload ON TRUE
    `;
    const buildNodeScopeCondition = (documentIdSql) => {
      if (targetNodeIds.length === 0) {
        return "";
      }

      params.push(targetNodeIds);
      const nodesPlaceholder = `$${params.length}`;
      params.push(includeChildren === true);
      const includeChildrenPlaceholder = `$${params.length}`;
      params.push(includeUnlinked === true);
      const includeUnlinkedPlaceholder = `$${params.length}`;

      return `
        AND (
          EXISTS (
            SELECT 1
            FROM document_node_links dnl
            WHERE dnl.document_id = ${documentIdSql}
              AND (
                (
                  ${includeChildrenPlaceholder}::boolean = FALSE
                  AND dnl.node_id = ANY(${nodesPlaceholder}::uuid[])
                )
                OR (
                  ${includeChildrenPlaceholder}::boolean = TRUE
                  AND EXISTS (
                    SELECT 1
                    FROM knowledge_node_closure cscope
                    WHERE cscope.ancestor_id = ANY(${nodesPlaceholder}::uuid[])
                      AND cscope.descendant_id = dnl.node_id
                  )
                )
              )
          )
          OR (
            ${includeUnlinkedPlaceholder}::boolean = TRUE
            AND NOT EXISTS (
              SELECT 1
              FROM document_node_links existing
              WHERE existing.document_id = ${documentIdSql}
            )
          )
        )
      `;
    };
    const buildTagCondition = (categoriesSql) => {
      if (normalizedSelectedTags.length === 0) {
        return "";
      }

      params.push(normalizedSelectedTags);
      const tagsPlaceholder = `$${params.length}`;
      return `
        AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(
            CASE
              WHEN jsonb_typeof(${categoriesSql}) = 'array' THEN ${categoriesSql}
              ELSE '[]'::jsonb
            END
          ) AS category_tag(value)
          WHERE CASE
              WHEN lower(trim(category_tag.value)) = 'met-o' THEN 'metso'
              ELSE lower(trim(category_tag.value))
            END = ANY(${tagsPlaceholder}::text[])
        )
      `;
    };
    const chunkScopeSql = buildNodeScopeCondition("c.document_id");
    const assetScopeSql = buildNodeScopeCondition("a.document_id");
    const chunkTagSql = buildTagCondition("d.categories");
    const assetTagSql = buildTagCondition("d.categories");
    const chunkResourceScopeSql = buildResourceScopeCondition("chunk");
    const assetResourceScopeSql = buildResourceScopeCondition("asset");
    const chunkDocumentSql = buildDocumentCondition("c.document_id");
    const assetDocumentSql = buildDocumentCondition("a.document_id");
    const chunkAssetOnlyBlockSql = buildAssetOnlyChunkBlock();
    const assetMetadataSql = buildAssetMetadataCondition();
    params.push(limit);
    const limitPlaceholder = `$${params.length}`;

    const result = await this.pool.query(
      `
      WITH chunk_ranked AS (
        SELECT
          c.id AS chunk_id,
          c.document_id,
          NULL::uuid AS asset_id,
          'chunk'::text AS resource_type,
          NULL::text AS asset_type,
          NULL::text AS asset_class,
          NULL::text AS asset_confidence,
          '[]'::jsonb AS engineering_topics,
          '[]'::jsonb AS signal_tags,
          NULL::integer AS page_number,
          c.chunk_index,
          d.title,
          NULL::text AS file_name,
          NULL::text AS relative_path,
          NULL::text AS mime_type,
          c.text,
          c.context,
          c.text_with_context,
          d.categories,
          d.original_file_path AS source_path,
          c.source_url,
          c.file_url,
          ${nodePayloadSelectSql},
          ts_rank_cd(
            to_tsvector('simple', replace(coalesce(c.text_with_context, ''), '-', ' ')),
            plainto_tsquery('simple', replace($1, '-', ' '))
          ) +
          CASE
            WHEN ${exactChunkMatchSql}
            THEN 0.75
            ELSE 0
          END AS lexical_score
        FROM document_chunks c
        JOIN documents d ON d.id = c.document_id
        ${nodePayloadJoinSql("c.document_id")}
        WHERE (
          to_tsvector('simple', replace(coalesce(c.text_with_context, ''), '-', ' ')) @@
            plainto_tsquery('simple', replace($1, '-', ' '))
          OR ${exactChunkMatchSql}
        )
        ${chunkResourceScopeSql}
        ${chunkAssetOnlyBlockSql}
        ${chunkDocumentSql}
        ${chunkScopeSql}
        ${chunkTagSql}
      ),
      asset_ranked AS (
        SELECT
          NULL::uuid AS chunk_id,
          a.document_id,
          a.id AS asset_id,
          'asset'::text AS resource_type,
          a.asset_type,
          a.metadata_json ->> 'assetClass' AS asset_class,
          a.metadata_json ->> 'confidence' AS asset_confidence,
          COALESCE(a.metadata_json -> 'engineeringTopics', '[]'::jsonb) AS engineering_topics,
          COALESCE(a.metadata_json -> 'signalTags', '[]'::jsonb) AS signal_tags,
          a.page_number,
          COALESCE(a.page_number - 1, 0) AS chunk_index,
          a.title,
          a.file_name,
          a.relative_path,
          a.mime_type,
          a.text_excerpt AS text,
          a.title AS context,
          concat_ws(E'\n\n', a.title, a.text_content) AS text_with_context,
          d.categories,
          d.original_file_path AS source_path,
          NULL::text AS source_url,
          NULL::text AS file_url,
          ${nodePayloadSelectSql},
          ts_rank_cd(
            to_tsvector('simple', replace(coalesce(concat_ws(' ', a.title, a.text_content), ''), '-', ' ')),
            plainto_tsquery('simple', replace($1, '-', ' '))
          ) +
          CASE
            WHEN ${exactAssetMatchSql}
            THEN 0.75
            ELSE 0
          END AS lexical_score
        FROM document_assets a
        JOIN documents d ON d.id = a.document_id
        ${nodePayloadJoinSql("a.document_id")}
        WHERE (
          to_tsvector('simple', replace(coalesce(concat_ws(' ', a.title, a.text_content), ''), '-', ' ')) @@
            plainto_tsquery('simple', replace($1, '-', ' '))
          OR ${exactAssetMatchSql}
        )
        ${assetResourceScopeSql}
        ${assetDocumentSql}
        ${assetScopeSql}
        ${assetTagSql}
        ${assetMetadataSql}
      ),
      ranked AS (
        SELECT
          chunk_id,
          document_id,
          asset_id,
          resource_type,
          asset_type,
          asset_class,
          asset_confidence,
          engineering_topics,
          signal_tags,
          page_number,
          chunk_index,
          title,
          file_name,
          relative_path,
          mime_type,
          text,
          context,
          text_with_context,
          categories,
          source_path,
          source_url,
          file_url,
          node_ids,
          node_scope_ids,
          primary_node_id,
          node_paths,
          payload_version,
          lexical_score
        FROM chunk_ranked
        UNION ALL
        SELECT
          chunk_id,
          document_id,
          asset_id,
          resource_type,
          asset_type,
          asset_class,
          asset_confidence,
          engineering_topics,
          signal_tags,
          page_number,
          chunk_index,
          title,
          file_name,
          relative_path,
          mime_type,
          text,
          context,
          text_with_context,
          categories,
          source_path,
          source_url,
          file_url,
          node_ids,
          node_scope_ids,
          primary_node_id,
          node_paths,
          payload_version,
          lexical_score
        FROM asset_ranked
      )
      SELECT *
      FROM ranked
      WHERE lexical_score > 0
      ORDER BY lexical_score DESC, page_number ASC NULLS LAST, chunk_index ASC
      LIMIT ${limitPlaceholder}
      `,
      params
    );

    return result.rows;
  }

  async createDocument(document) {
    const result = await this.pool.query(
      `
      INSERT INTO documents (
        title,
        slug,
        source_type,
        original_file_path,
        original_file_name,
        mime_type,
        checksum,
        categories,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
      RETURNING *
      `,
      [
        document.title,
        document.slug,
        document.sourceType,
        document.originalFilePath,
        document.originalFileName,
        document.mimeType,
        document.checksum,
        JSON.stringify(document.categories ?? []),
        document.status ?? "indexed",
      ]
    );

    return result.rows[0];
  }

  async createChunks(documentId, chunks) {
    const inserted = [];

    for (const chunk of chunks) {
      const result = await this.pool.query(
        `
        INSERT INTO document_chunks (
          document_id,
          chunk_index,
          text,
          context,
          text_with_context,
          token_estimate,
          categories,
          source_url,
          file_url
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)
        RETURNING *
        `,
        [
          documentId,
          chunk.chunkIndex,
          chunk.text,
          chunk.context,
          chunk.textWithContext,
          chunk.tokenEstimate,
          JSON.stringify(chunk.categories ?? []),
          chunk.sourceUrl ?? null,
          chunk.fileUrl ?? null,
        ]
      );

      inserted.push(result.rows[0]);
    }

    return inserted;
  }

  async createDocumentAssets(documentId, assets) {
    const inserted = [];

    for (const asset of assets) {
      const metadata = buildDocumentAssetMetadata(asset);

      const result = await this.pool.query(
        `
        INSERT INTO document_assets (
          document_id,
          asset_type,
          page_number,
          title,
          text_excerpt,
          text_content,
          file_name,
          relative_path,
          mime_type,
          size_bytes,
          metadata_json
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
        RETURNING *
        `,
        [
          documentId,
          asset.type,
          asset.page ?? null,
          asset.title ?? null,
          asset.textExcerpt ?? null,
          asset.text ?? null,
          asset.fileName ?? null,
          asset.relativePath ?? null,
          asset.mimeType ?? null,
          asset.sizeBytes ?? 0,
          JSON.stringify(metadata),
        ]
      );

      inserted.push(result.rows[0]);
    }

    return inserted;
  }

  async upsertDocumentAsset(documentId, asset) {
    const metadata = buildDocumentAssetMetadata(asset);
    const result = await this.pool.query(
      `
      WITH existing AS (
        SELECT id
        FROM document_assets
        WHERE document_id = $1
          AND asset_type = $2
          AND page_number = $3
        ORDER BY created_at ASC
        LIMIT 1
      ),
      updated AS (
        UPDATE document_assets a
        SET
          title = COALESCE($4, a.title),
          text_excerpt = COALESCE($5, a.text_excerpt),
          text_content = COALESCE($6, a.text_content),
          file_name = COALESCE($7, a.file_name),
          relative_path = COALESCE($8, a.relative_path),
          mime_type = COALESCE($9, a.mime_type),
          size_bytes = CASE WHEN $10::int > 0 THEN $10 ELSE a.size_bytes END,
          metadata_json = COALESCE(a.metadata_json, '{}'::jsonb) || $11::jsonb
        FROM existing
        WHERE a.id = existing.id
        RETURNING a.*
      ),
      inserted AS (
        INSERT INTO document_assets (
          document_id,
          asset_type,
          page_number,
          title,
          text_excerpt,
          text_content,
          file_name,
          relative_path,
          mime_type,
          size_bytes,
          metadata_json
        )
        SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb
        WHERE NOT EXISTS (SELECT 1 FROM updated)
          AND NOT EXISTS (SELECT 1 FROM existing)
        RETURNING *
      )
      SELECT * FROM updated
      UNION ALL
      SELECT * FROM inserted
      LIMIT 1
      `,
      [
        documentId,
        asset.type,
        asset.page ?? null,
        asset.title ?? null,
        asset.textExcerpt ?? null,
        asset.text ?? null,
        asset.fileName ?? null,
        asset.relativePath ?? null,
        asset.mimeType ?? null,
        asset.sizeBytes ?? 0,
        JSON.stringify(metadata),
      ]
    );

    return result.rows[0] ?? null;
  }

  async updateDocumentAssetPreview(documentId, pageNumber, preview) {
    const result = await this.pool.query(
      `
      UPDATE document_assets
      SET
        file_name = $3,
        relative_path = $4,
        mime_type = $5,
        size_bytes = $6,
        metadata_json = COALESCE(metadata_json, '{}'::jsonb) || $7::jsonb
      WHERE document_id = $1 AND page_number = $2
      RETURNING *
      `,
      [
        documentId,
        pageNumber,
        preview.fileName,
        preview.relativePath,
        preview.mimeType ?? null,
        preview.sizeBytes ?? 0,
        JSON.stringify({
          previewAvailable: preview.previewAvailable === true,
        }),
      ]
    );

    return result.rows[0] ?? null;
  }

  async updateDocumentAssetClassification(documentId, pageNumber, classification) {
    const nextMetadata = {
      assetClass: classification.assetClass ?? "text",
      confidence: classification.confidence ?? null,
      engineeringTopics: classification.engineeringTopics ?? [],
      signalTags: classification.signalTags ?? [],
      classifierVersion: classification.classifierVersion ?? "v3",
      scores: classification.scores ?? undefined,
    };

    const result = await this.pool.query(
      `
      UPDATE document_assets
      SET metadata_json = COALESCE(metadata_json, '{}'::jsonb) || $3::jsonb
      WHERE document_id = $1 AND page_number = $2
      RETURNING *
      `,
      [documentId, pageNumber, JSON.stringify(nextMetadata)]
    );

    return result.rows[0] ?? null;
  }

  async createJob(job) {
    const result = await this.pool.query(
      `
      INSERT INTO ingestion_jobs (
        document_id,
        job_type,
        status,
        phase,
        error_message,
        total_items,
        processed_items,
        progress_message,
        started_at,
        finished_at,
        pending_filename,
        pending_options
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
      RETURNING *
      `,
      [
        job.documentId,
        job.jobType,
        job.status,
        job.phase ?? null,
        job.errorMessage ?? null,
        job.totalItems ?? null,
        job.processedItems ?? 0,
        job.progressMessage ?? null,
        job.startedAt ?? null,
        job.finishedAt ?? null,
        job.pendingFilename ?? null,
        job.pendingOptions ? JSON.stringify(job.pendingOptions) : null,
      ]
    );

    return result.rows[0];
  }

  async attachDocumentToJob(jobId, documentId) {
    const result = await this.pool.query(
      `UPDATE ingestion_jobs
       SET document_id = $2,
           pending_filename = NULL,
           pending_options = NULL,
           phase = CASE WHEN phase = 'awaiting_upload' THEN 'awaiting_processing' ELSE phase END
       WHERE id = $1
       RETURNING *`,
      [jobId, documentId]
    );
    return result.rows[0] ?? null;
  }

  async updateJobStatus(jobId, status, errorMessage = null) {
    const result = await this.pool.query(
      `
      UPDATE ingestion_jobs
      SET status = $2,
          phase = CASE
            WHEN $2 IN ('completed', 'failed', 'cancelled') THEN 'done'
            WHEN $2 = 'running' THEN 'processing'
            ELSE phase
          END,
          error_message = $3,
          processed_items = CASE
            WHEN $2 = 'completed' AND total_items IS NOT NULL THEN total_items
            ELSE processed_items
          END,
          progress_message = CASE
            WHEN $2 = 'completed' THEN 'Готово'
            WHEN $2 = 'failed' THEN 'Ошибка'
            WHEN $2 = 'cancelled' THEN 'Остановлено'
            ELSE progress_message
          END,
          finished_at = CASE WHEN $2 IN ('completed', 'failed', 'cancelled') THEN NOW() ELSE finished_at END
      WHERE id = $1
      RETURNING *
      `,
      [jobId, status, errorMessage]
    );

    return result.rows[0] ?? null;
  }

  async updateJobProgress(jobId, { processedItems = null, totalItems = null, progressMessage = null }) {
    const result = await this.pool.query(
      `
      UPDATE ingestion_jobs
      SET
        processed_items = COALESCE($2, processed_items),
        total_items = COALESCE($3, total_items),
        progress_message = COALESCE($4, progress_message)
      WHERE id = $1
      RETURNING *
      `,
      [jobId, processedItems, totalItems, progressMessage]
    );

    return result.rows[0] ?? null;
  }

  async updateJobStartedAt(jobId) {
    const result = await this.pool.query(
      `UPDATE ingestion_jobs
       SET started_at = COALESCE(started_at, NOW()),
           status = CASE WHEN status = 'queued' THEN 'running' ELSE status END,
           phase = CASE WHEN status = 'queued' THEN 'processing' ELSE phase END
       WHERE id = $1
       RETURNING *`,
      [jobId]
    );
    return result.rows[0] ?? null;
  }

  async logQuery(entry) {
    await this.pool.query(
      `
      INSERT INTO query_logs (
        session_id,
        question,
        answer,
        sources_json,
        chat_model,
        embedding_model,
        latency_ms
      )
      VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7)
      `,
      [
        entry.sessionId ?? null,
        entry.question,
        entry.answer ?? null,
        JSON.stringify(entry.sources ?? []),
        entry.chatModel,
        entry.embeddingModel,
        entry.latencyMs ?? null,
      ]
    );
  }
}
