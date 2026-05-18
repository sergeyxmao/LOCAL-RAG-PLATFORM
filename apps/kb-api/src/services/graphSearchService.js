// Поиск узлов графа знаний.
// Ищет по: имени (name), типу (type), значениям атрибутов (attributes)
// и точному совпадению по id.

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value) {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function serviceError(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

function escapeIlikePattern(s) {
  return String(s).replace(/[\\%_]/g, (m) => "\\" + m);
}

export class GraphSearchService {
  constructor({ postgresProvider, logger } = {}) {
    if (!postgresProvider) {
      throw new Error("GraphSearchService требует postgresProvider");
    }
    this.postgresProvider = postgresProvider;
    this.pool = postgresProvider.pool;
    this.logger = logger ?? null;
  }

  async search(query, { type = null, limit = 50 } = {}) {
    const q = String(query ?? "").trim();
    if (q.length === 0) {
      throw serviceError("Пустой поисковый запрос", 400);
    }
    const safeLimit = Math.max(1, Math.min(200, Math.trunc(Number(limit) || 50)));

    // Если запрос — UUID, ищем точно по id.
    if (isUuid(q)) {
      const res = await this.pool.query(
        `SELECT * FROM graph_nodes WHERE id = $1 LIMIT 1`,
        [q]
      );
      return res.rows.map((row) => ({
        node: {
          id: row.id,
          type: row.type,
          name: row.name,
          attributes: row.attributes ?? {},
          isArchived: row.is_archived === true,
        },
        matchedField: "id",
        matchedValue: row.id,
      }));
    }

    const pattern = "%" + escapeIlikePattern(q) + "%";
    const params = [pattern];
    let typeFilter = "";
    if (typeof type === "string" && type.trim()) {
      params.push(type.trim());
      typeFilter = ` AND n.type = $${params.length}`;
    }
    params.push(safeLimit);
    const limitPlaceholder = `$${params.length}`;

    // Поиск по name + атрибутам. Используем DISTINCT ON (n.id) с
    // приоритетом матча: name > type > attributes.
    const sql = `
      WITH name_match AS (
        SELECT n.id, n.type, n.name, n.attributes, n.is_archived,
               1 AS priority,
               'name' AS matched_field,
               n.name AS matched_value
        FROM graph_nodes n
        WHERE n.is_archived = FALSE
          AND n.name ILIKE $1 ESCAPE '\\'
          ${typeFilter}
      ),
      type_match AS (
        SELECT n.id, n.type, n.name, n.attributes, n.is_archived,
               2 AS priority,
               'type' AS matched_field,
               n.type AS matched_value
        FROM graph_nodes n
        WHERE n.is_archived = FALSE
          AND n.type ILIKE $1 ESCAPE '\\'
          ${typeFilter}
      ),
      attr_match AS (
        SELECT DISTINCT ON (n.id)
               n.id, n.type, n.name, n.attributes, n.is_archived,
               3 AS priority,
               pairs.key AS matched_field,
               pairs.attr_value AS matched_value
        FROM graph_nodes n
        CROSS JOIN LATERAL jsonb_each_text(n.attributes) AS pairs(key, attr_value)
        WHERE n.is_archived = FALSE
          AND pairs.attr_value ILIKE $1 ESCAPE '\\'
          ${typeFilter}
        ORDER BY n.id, pairs.key
      ),
      combined AS (
        SELECT * FROM name_match
        UNION ALL
        SELECT * FROM type_match
        UNION ALL
        SELECT * FROM attr_match
      ),
      ranked AS (
        SELECT DISTINCT ON (id) *
        FROM combined
        ORDER BY id, priority ASC
      )
      SELECT * FROM ranked
      ORDER BY priority ASC, name ASC
      LIMIT ${limitPlaceholder}
    `;

    const res = await this.pool.query(sql, params);
    return res.rows.map((row) => ({
      node: {
        id: row.id,
        type: row.type,
        name: row.name,
        attributes: row.attributes ?? {},
        isArchived: row.is_archived === true,
      },
      matchedField: row.matched_field,
      matchedValue: row.matched_value,
    }));
  }
}
