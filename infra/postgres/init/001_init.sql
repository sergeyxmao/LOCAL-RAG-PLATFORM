CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT,
    source_type TEXT,
    original_file_path TEXT,
    original_file_name TEXT,
    mime_type TEXT,
    checksum TEXT,
    categories JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    text TEXT NOT NULL,
    context TEXT,
    text_with_context TEXT,
    token_estimate INTEGER DEFAULT 0,
    categories JSONB DEFAULT '[]'::jsonb,
    source_url TEXT,
    file_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    asset_type TEXT NOT NULL,
    page_number INTEGER,
    title TEXT,
    text_excerpt TEXT,
    text_content TEXT,
    file_name TEXT,
    relative_path TEXT,
    mime_type TEXT,
    size_bytes INTEGER DEFAULT 0,
    metadata_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ingestion_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    job_type TEXT,
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

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
);

CREATE TABLE IF NOT EXISTS knowledge_node_closure (
    ancestor_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    descendant_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    depth INTEGER NOT NULL,
    PRIMARY KEY (ancestor_id, descendant_id)
);

CREATE TABLE IF NOT EXISTS document_node_links (
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE RESTRICT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (document_id, node_id)
);

CREATE TABLE IF NOT EXISTS job_node_links (
    job_id UUID NOT NULL REFERENCES ingestion_jobs(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (job_id, node_id)
);

CREATE TABLE IF NOT EXISTS node_counters (
    node_id UUID PRIMARY KEY REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    direct_documents INTEGER NOT NULL DEFAULT 0,
    scope_documents INTEGER NOT NULL DEFAULT 0,
    scope_pages INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS node_sync_status (
    id INTEGER PRIMARY KEY DEFAULT 1,
    last_reindex_at TIMESTAMPTZ,
    last_scope TEXT,
    last_target_id UUID,
    last_document_count INTEGER NOT NULL DEFAULT 0,
    last_point_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ui_state (
    id INTEGER PRIMARY KEY DEFAULT 1,
    current_node_id UUID REFERENCES knowledge_nodes(id) ON DELETE SET NULL,
    include_children BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO node_sync_status (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ui_state (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_nodes_parent ON knowledge_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_nodes_active
    ON knowledge_nodes(is_active)
    WHERE is_active = TRUE;
CREATE UNIQUE INDEX IF NOT EXISTS ux_nodes_sibling_name
    ON knowledge_nodes ((COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid)), lower(name))
    WHERE is_active = TRUE;
CREATE UNIQUE INDEX IF NOT EXISTS ux_nodes_system_unsorted
    ON knowledge_nodes (lower(name))
    WHERE is_system = TRUE;
CREATE INDEX IF NOT EXISTS idx_closure_descendant ON knowledge_node_closure(descendant_id);
CREATE INDEX IF NOT EXISTS idx_closure_depth ON knowledge_node_closure(depth);
CREATE INDEX IF NOT EXISTS idx_dnl_node ON document_node_links(node_id);
CREATE INDEX IF NOT EXISTS idx_dnl_node_doc ON document_node_links(node_id, document_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_dnl_primary_per_doc
    ON document_node_links(document_id)
    WHERE is_primary = TRUE;
CREATE INDEX IF NOT EXISTS idx_jnl_node ON job_node_links(node_id);

CREATE OR REPLACE FUNCTION touch_knowledge_nodes_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_knowledge_nodes_touch_updated_at ON knowledge_nodes;
CREATE TRIGGER trg_knowledge_nodes_touch_updated_at
BEFORE UPDATE ON knowledge_nodes
FOR EACH ROW
EXECUTE FUNCTION touch_knowledge_nodes_updated_at();

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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_knowledge_node_closure_insert ON knowledge_nodes;
CREATE TRIGGER trg_knowledge_node_closure_insert
AFTER INSERT ON knowledge_nodes
FOR EACH ROW
EXECUTE FUNCTION maintain_knowledge_node_closure_on_insert();

INSERT INTO knowledge_nodes (
    name,
    type_label,
    color,
    sort_order,
    is_active,
    is_system,
    description
)
SELECT
    'Без раздела',
    'Системный',
    '#9CA3AF',
    1000000,
    TRUE,
    TRUE,
    'Служебный раздел для документов без явной привязки'
WHERE NOT EXISTS (
    SELECT 1
    FROM knowledge_nodes
    WHERE is_system = TRUE AND lower(name) = lower('Без раздела')
);

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
$$ LANGUAGE plpgsql;

SELECT rebuild_knowledge_node_closure();

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
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_all_node_counters_trigger()
RETURNS trigger AS $$
BEGIN
    PERFORM refresh_all_node_counters();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_node_counters_links_refresh ON document_node_links;
CREATE TRIGGER trg_node_counters_links_refresh
AFTER INSERT OR UPDATE OR DELETE ON document_node_links
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_all_node_counters_trigger();

DROP TRIGGER IF EXISTS trg_node_counters_assets_refresh ON document_assets;
CREATE TRIGGER trg_node_counters_assets_refresh
AFTER INSERT OR UPDATE OR DELETE ON document_assets
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_all_node_counters_trigger();

DROP TRIGGER IF EXISTS trg_node_counters_nodes_refresh ON knowledge_nodes;
CREATE TRIGGER trg_node_counters_nodes_refresh
AFTER INSERT OR UPDATE OR DELETE ON knowledge_nodes
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_all_node_counters_trigger();

DROP TRIGGER IF EXISTS trg_node_counters_documents_refresh ON documents;
CREATE TRIGGER trg_node_counters_documents_refresh
AFTER INSERT OR UPDATE OR DELETE ON documents
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_all_node_counters_trigger();

SELECT refresh_all_node_counters();

CREATE TABLE IF NOT EXISTS query_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT,
    question TEXT NOT NULL,
    answer TEXT,
    sources_json JSONB DEFAULT '[]'::jsonb,
    chat_model TEXT,
    embedding_model TEXT,
    latency_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    active_chat_model TEXT,
    active_embedding_model TEXT,
    chunk_strategy TEXT,
    chunk_max_tokens INTEGER,
    chunk_overlap_sentences INTEGER,
    top_k_semantic INTEGER,
    top_k_bm25 INTEGER,
    top_k_final INTEGER,
    reranking_enabled BOOLEAN DEFAULT FALSE
);

INSERT INTO system_settings (
    id,
    active_chat_model,
    active_embedding_model,
    chunk_strategy,
    chunk_max_tokens,
    chunk_overlap_sentences,
    top_k_semantic,
    top_k_bm25,
    top_k_final,
    reranking_enabled
)
VALUES (
    1,
    'qwen3:4b',
    'qwen3-embedding:0.6b',
    'sentence',
    450,
    2,
    12,
    12,
    6,
    FALSE
)
ON CONFLICT (id) DO NOTHING;
