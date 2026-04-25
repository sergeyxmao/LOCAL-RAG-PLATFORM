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
