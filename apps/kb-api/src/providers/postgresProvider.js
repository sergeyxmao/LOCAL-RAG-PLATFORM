import pg from "pg";

const { Pool } = pg;

export class PostgresProvider {
  constructor(config) {
    this.pool = new Pool(config);
  }

  async ensureRuntimeSchema() {
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
      ADD COLUMN IF NOT EXISTS progress_message TEXT
    `);
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

  async listDocuments() {
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
        COUNT(c.id) AS chunk_count
      FROM documents d
      LEFT JOIN document_chunks c ON c.document_id = d.id
      GROUP BY d.id
      ORDER BY d.created_at DESC
      `
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
    const parsedLimit = Number(options.limit);
    const limit = Number.isFinite(parsedLimit)
      ? Math.max(1, Math.min(200, Math.trunc(parsedLimit)))
      : 50;

    const conditions = [];
    const params = [];

    if (statusMode === "active") {
      params.push(["running", "cancel_requested"]);
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

    params.push(limit);
    const limitPlaceholder = `$${params.length}`;
    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await this.pool.query(
      `
      SELECT
        j.id,
        j.document_id,
        j.job_type,
        j.status,
        j.error_message,
        j.total_items,
        j.processed_items,
        j.progress_message,
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
      ORDER BY j.created_at DESC
      LIMIT ${limitPlaceholder}
      `,
      params
    );

    return result.rows;
  }

  async getJobById(jobId) {
    const result = await this.pool.query(
      `
      SELECT
        j.id,
        j.document_id,
        j.job_type,
        j.status,
        j.error_message,
        j.total_items,
        j.processed_items,
        j.progress_message,
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

  async requestJobCancellation(jobId) {
    const result = await this.pool.query(
      `
      UPDATE ingestion_jobs
      SET
        status = CASE
          WHEN status = 'running' THEN 'cancel_requested'
          ELSE status
        END,
        progress_message = CASE
          WHEN status = 'running' THEN 'Остановка запрошена'
          ELSE progress_message
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

  async lexicalSearch(query, limit = 12) {
    const normalized = String(query ?? "").trim();
    if (!normalized) {
      return [];
    }

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
          c.categories,
          d.original_file_path AS source_path,
          c.source_url,
          c.file_url,
          ts_rank_cd(
            to_tsvector('simple', replace(coalesce(c.text_with_context, ''), '-', ' ')),
            plainto_tsquery('simple', replace($1, '-', ' '))
          ) +
          CASE
            WHEN lower(coalesce(c.text_with_context, '')) LIKE '%' || lower($1) || '%'
            THEN 0.75
            ELSE 0
          END AS lexical_score
        FROM document_chunks c
        JOIN documents d ON d.id = c.document_id
        WHERE
          to_tsvector('simple', replace(coalesce(c.text_with_context, ''), '-', ' ')) @@
            plainto_tsquery('simple', replace($1, '-', ' '))
          OR lower(coalesce(c.text_with_context, '')) LIKE '%' || lower($1) || '%'
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
          ts_rank_cd(
            to_tsvector('simple', replace(coalesce(concat_ws(' ', a.title, a.text_content), ''), '-', ' ')),
            plainto_tsquery('simple', replace($1, '-', ' '))
          ) +
          CASE
            WHEN lower(coalesce(concat_ws(' ', a.title, a.text_content), '')) LIKE '%' || lower($1) || '%'
            THEN 0.75
            ELSE 0
          END AS lexical_score
        FROM document_assets a
        JOIN documents d ON d.id = a.document_id
        WHERE
          to_tsvector('simple', replace(coalesce(concat_ws(' ', a.title, a.text_content), ''), '-', ' ')) @@
            plainto_tsquery('simple', replace($1, '-', ' '))
          OR lower(coalesce(concat_ws(' ', a.title, a.text_content), '')) LIKE '%' || lower($1) || '%'
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
          lexical_score
        FROM asset_ranked
      )
      SELECT *
      FROM ranked
      WHERE lexical_score > 0
      ORDER BY lexical_score DESC, page_number ASC NULLS LAST, chunk_index ASC
      LIMIT $2
      `,
      [normalized, limit]
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
      const metadata = {
        page: asset.page ?? null,
        sourceType: asset.sourceType ?? "pdf",
        previewAvailable: asset.previewAvailable === true,
        assetClass: asset.assetClass ?? "text",
        confidence: asset.confidence ?? null,
        engineeringTopics: asset.engineeringTopics ?? [],
        signalTags: asset.signalTags ?? [],
        classifierVersion: asset.classifierVersion ?? "v2",
      };

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
      classifierVersion: classification.classifierVersion ?? "v2",
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
        error_message,
        total_items,
        processed_items,
        progress_message,
        started_at,
        finished_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
      `,
      [
        job.documentId,
        job.jobType,
        job.status,
        job.errorMessage ?? null,
        job.totalItems ?? null,
        job.processedItems ?? 0,
        job.progressMessage ?? null,
        job.startedAt ?? null,
        job.finishedAt ?? null,
      ]
    );

    return result.rows[0];
  }

  async updateJobStatus(jobId, status, errorMessage = null) {
    const result = await this.pool.query(
      `
      UPDATE ingestion_jobs
      SET status = $2,
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
