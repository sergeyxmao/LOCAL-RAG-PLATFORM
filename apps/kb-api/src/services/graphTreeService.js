// Сервис сборки иерархического дерева графа знаний.
// Иерархия фиксирована для 7 встроенных типов (HIERARCHY_RULES);
// кастомные типы показываются только как корневые группы без иерархии.

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value) {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function serviceError(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

// Иерархия дерева для встроенных типов АСУ ТП.
// direction: 'forward'  — связь идёт child --[relation]--> parent
//            'backward' — связь идёт parent --[relation]--> child
const HIERARCHY_RULES = [
  { parent: "object",  child: "cabinet", relation: "installed_in", direction: "forward" },
  { parent: "cabinet", child: "station", relation: "installed_in", direction: "forward" },
  { parent: "station", child: "card",    relation: "installed_in", direction: "forward" },
  { parent: "card",    child: "channel", relation: "has_channel",  direction: "backward" },
  { parent: "channel", child: "signal",  relation: "connected_to", direction: "forward" },
  { parent: "signal",  child: "device",  relation: "measures",     direction: "backward" },
];

function mapNodeBrief(row, { hasChildren = false } = {}) {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    description: row.description ?? null,
    attributes: row.attributes ?? {},
    hasChildren: hasChildren === true,
    createdAt: row.created_at,
  };
}

export class GraphTreeService {
  constructor({ postgresProvider, graphNodeTypeService, logger } = {}) {
    if (!postgresProvider) {
      throw new Error("GraphTreeService требует postgresProvider");
    }
    if (!graphNodeTypeService) {
      throw new Error("GraphTreeService требует graphNodeTypeService");
    }
    this.postgresProvider = postgresProvider;
    this.pool = postgresProvider.pool;
    this.graphNodeTypeService = graphNodeTypeService;
    this.logger = logger ?? null;
  }

  // Возвращает все корневые группы — все типы из graph_node_types
  // (включая кастомные), отсортированные по sort_order. Для каждого
  // типа указывается количество активных узлов.
  async listRoots() {
    const types = await this.graphNodeTypeService.listTypes({ includeArchived: false });
    const countsRes = await this.pool.query(`
      SELECT type, COUNT(*)::int AS count
      FROM graph_nodes
      WHERE is_archived = FALSE
      GROUP BY type
    `);
    const counts = new Map();
    for (const row of countsRes.rows) {
      counts.set(row.type, Number(row.count));
    }
    return types.map((t) => ({
      code: t.code,
      label_ru: t.label_ru,
      icon: t.icon,
      description: t.description,
      sort_order: t.sort_order,
      is_builtin: t.is_builtin,
      count: counts.get(t.code) ?? 0,
    }));
  }

  // Возвращает узлы конкретного типа (страница). Для каждого узла
  // вычисляется hasChildren (один SQL-запрос на батч).
  async listNodesByType(type, { limit = 50, offset = 0 } = {}) {
    const cleanType = String(type ?? "").trim();
    if (!cleanType) {
      throw serviceError("Не указан тип узла", 400);
    }
    const safeLimit = Math.max(1, Math.min(500, Math.trunc(Number(limit) || 50)));
    const safeOffset = Math.max(0, Math.trunc(Number(offset) || 0));

    const itemsRes = await this.pool.query(
      `
      SELECT *
      FROM graph_nodes
      WHERE type = $1 AND is_archived = FALSE
      ORDER BY name ASC, created_at ASC
      LIMIT $2 OFFSET $3
      `,
      [cleanType, safeLimit, safeOffset]
    );
    const countRes = await this.pool.query(
      `SELECT COUNT(*)::int AS total FROM graph_nodes WHERE type = $1 AND is_archived = FALSE`,
      [cleanType]
    );

    const nodes = itemsRes.rows;
    const childCounts = await this._computeChildCountsForNodes(nodes);
    const total = Number(countRes.rows[0]?.total ?? 0);
    return {
      items: nodes.map((n) => mapNodeBrief(n, { hasChildren: (childCounts.get(n.id) ?? 0) > 0 })),
      total,
      limit: safeLimit,
      offset: safeOffset,
      hasMore: safeOffset + nodes.length < total,
    };
  }

  // Возвращает прямых детей узла согласно HIERARCHY_RULES.
  // Для каждого ребёнка также вычисляется hasChildren.
  async listChildren(parentId) {
    if (!isUuid(parentId)) {
      throw serviceError("Некорректный идентификатор узла", 400);
    }
    const parentRes = await this.pool.query(
      `SELECT id, type FROM graph_nodes WHERE id = $1 LIMIT 1`,
      [parentId]
    );
    if (parentRes.rows.length === 0) {
      throw serviceError("Узел не найден", 404);
    }
    const parentType = parentRes.rows[0].type;
    const rules = HIERARCHY_RULES.filter((r) => r.parent === parentType);
    if (rules.length === 0) {
      return { items: [] };
    }

    const children = [];
    for (const rule of rules) {
      const sql = rule.direction === "forward"
        ? `
          SELECT n.*
          FROM graph_nodes n
          JOIN graph_edges e ON e.source_node_id = n.id
          WHERE e.target_node_id = $1
            AND e.relation = $2
            AND n.type = $3
            AND n.is_archived = FALSE
          ORDER BY n.name ASC
          `
        : `
          SELECT n.*
          FROM graph_nodes n
          JOIN graph_edges e ON e.target_node_id = n.id
          WHERE e.source_node_id = $1
            AND e.relation = $2
            AND n.type = $3
            AND n.is_archived = FALSE
          ORDER BY n.name ASC
          `;
      const res = await this.pool.query(sql, [parentId, rule.relation, rule.child]);
      for (const row of res.rows) {
        children.push(row);
      }
    }

    // Уникализация (на случай если узел сошёлся по нескольким правилам)
    const seen = new Set();
    const unique = [];
    for (const row of children) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      unique.push(row);
    }

    const childCounts = await this._computeChildCountsForNodes(unique);
    return {
      items: unique.map((n) => mapNodeBrief(n, { hasChildren: (childCounts.get(n.id) ?? 0) > 0 })),
    };
  }

  // Считает количество детей по HIERARCHY_RULES для каждого
  // переданного узла. Один SQL-запрос на пачку через CTE.
  async _computeChildCountsForNodes(nodes) {
    const result = new Map();
    if (!Array.isArray(nodes) || nodes.length === 0) return result;
    // Группируем узлы по типу — для каждого типа свой набор правил.
    const byType = new Map();
    for (const n of nodes) {
      if (!byType.has(n.type)) byType.set(n.type, []);
      byType.get(n.type).push(n.id);
      result.set(n.id, 0);
    }

    for (const [parentType, ids] of byType.entries()) {
      const rules = HIERARCHY_RULES.filter((r) => r.parent === parentType);
      if (rules.length === 0) continue;
      for (const rule of rules) {
        const sql = rule.direction === "forward"
          ? `
            SELECT e.target_node_id AS parent_id, COUNT(*)::int AS cnt
            FROM graph_edges e
            JOIN graph_nodes n ON n.id = e.source_node_id
            WHERE e.target_node_id = ANY($1)
              AND e.relation = $2
              AND n.type = $3
              AND n.is_archived = FALSE
            GROUP BY e.target_node_id
            `
          : `
            SELECT e.source_node_id AS parent_id, COUNT(*)::int AS cnt
            FROM graph_edges e
            JOIN graph_nodes n ON n.id = e.target_node_id
            WHERE e.source_node_id = ANY($1)
              AND e.relation = $2
              AND n.type = $3
              AND n.is_archived = FALSE
            GROUP BY e.source_node_id
            `;
        const res = await this.pool.query(sql, [ids, rule.relation, rule.child]);
        for (const row of res.rows) {
          const prev = result.get(row.parent_id) ?? 0;
          result.set(row.parent_id, prev + Number(row.cnt));
        }
      }
    }
    return result;
  }

  // Полная карточка узла для правой панели: сам узел, входящие
  // связи (другие → этот), исходящие связи (этот → другие),
  // источник (документ + лист + строка), число потомков по дереву.
  async getNodeFullCard(nodeId) {
    if (!isUuid(nodeId)) {
      throw serviceError("Некорректный идентификатор узла", 400);
    }
    const nodeRes = await this.pool.query(
      `SELECT * FROM graph_nodes WHERE id = $1 LIMIT 1`,
      [nodeId]
    );
    if (nodeRes.rows.length === 0) {
      throw serviceError("Узел не найден", 404);
    }
    const node = nodeRes.rows[0];

    const [incomingRes, outgoingRes] = await Promise.all([
      this.pool.query(
        `
        SELECT
          e.id AS edge_id,
          e.relation,
          e.confidence AS edge_confidence,
          e.created_at AS edge_created_at,
          n.id AS other_id,
          n.type AS other_type,
          n.name AS other_name,
          n.is_archived AS other_archived
        FROM graph_edges e
        JOIN graph_nodes n ON n.id = e.source_node_id
        WHERE e.target_node_id = $1
        ORDER BY e.relation ASC, n.name ASC
        `,
        [nodeId]
      ),
      this.pool.query(
        `
        SELECT
          e.id AS edge_id,
          e.relation,
          e.confidence AS edge_confidence,
          e.created_at AS edge_created_at,
          n.id AS other_id,
          n.type AS other_type,
          n.name AS other_name,
          n.is_archived AS other_archived
        FROM graph_edges e
        JOIN graph_nodes n ON n.id = e.target_node_id
        WHERE e.source_node_id = $1
        ORDER BY e.relation ASC, n.name ASC
        `,
        [nodeId]
      ),
    ]);

    let sourceDocument = null;
    if (node.source_document_id) {
      try {
        const docRes = await this.pool.query(
          `SELECT id, title, original_file_path FROM documents WHERE id = $1 LIMIT 1`,
          [node.source_document_id]
        );
        if (docRes.rows.length > 0) {
          const d = docRes.rows[0];
          sourceDocument = {
            id: d.id,
            title: d.title,
            originalFilePath: d.original_file_path,
          };
        }
      } catch (err) {
        if (this.logger?.warn) {
          this.logger.warn({ err, nodeId }, "Не удалось получить источник узла");
        }
      }
    }

    const descendantsCount = await this._countDescendants(node.id);

    return {
      node: {
        id: node.id,
        type: node.type,
        name: node.name,
        description: node.description ?? null,
        attributes: node.attributes ?? {},
        sourceDocumentId: node.source_document_id,
        sourcePageNumber: node.source_page_number,
        sourceXlsxSheet: node.source_xlsx_sheet,
        sourceXlsxRow: node.source_xlsx_row,
        confidence: node.confidence === null || node.confidence === undefined
          ? 1.0
          : Number(node.confidence),
        author: node.author,
        isArchived: node.is_archived === true,
        createdAt: node.created_at,
        updatedAt: node.updated_at,
      },
      incoming: incomingRes.rows.map((r) => ({
        edgeId: r.edge_id,
        relation: r.relation,
        confidence: r.edge_confidence === null || r.edge_confidence === undefined
          ? 1.0
          : Number(r.edge_confidence),
        createdAt: r.edge_created_at,
        otherNode: {
          id: r.other_id,
          type: r.other_type,
          name: r.other_name,
          isArchived: r.other_archived === true,
        },
      })),
      outgoing: outgoingRes.rows.map((r) => ({
        edgeId: r.edge_id,
        relation: r.relation,
        confidence: r.edge_confidence === null || r.edge_confidence === undefined
          ? 1.0
          : Number(r.edge_confidence),
        createdAt: r.edge_created_at,
        otherNode: {
          id: r.other_id,
          type: r.other_type,
          name: r.other_name,
          isArchived: r.other_archived === true,
        },
      })),
      source: {
        document: sourceDocument,
        sheet: node.source_xlsx_sheet,
        row: node.source_xlsx_row,
        pageNumber: node.source_page_number,
        author: node.author,
        createdAt: node.created_at,
      },
      descendantsCount,
    };
  }

  // Подсчёт всех потомков узла по дереву HIERARCHY_RULES (рекурсивно
  // по правилам, не по всем связям). Используется для модалки
  // удаления "удалить также N потомков".
  async _countDescendants(rootId) {
    const visited = new Set([rootId]);
    let frontier = [rootId];
    let total = 0;
    let safetyHops = 0;
    while (frontier.length > 0 && safetyHops < 100) {
      safetyHops += 1;
      const childrenIds = [];
      const typeRes = await this.pool.query(
        `SELECT id, type FROM graph_nodes WHERE id = ANY($1)`,
        [frontier]
      );
      const idToType = new Map();
      for (const row of typeRes.rows) {
        idToType.set(row.id, row.type);
      }
      // Группируем frontier по типу
      const byType = new Map();
      for (const id of frontier) {
        const t = idToType.get(id);
        if (!t) continue;
        if (!byType.has(t)) byType.set(t, []);
        byType.get(t).push(id);
      }
      for (const [parentType, ids] of byType.entries()) {
        const rules = HIERARCHY_RULES.filter((r) => r.parent === parentType);
        for (const rule of rules) {
          const sql = rule.direction === "forward"
            ? `
              SELECT DISTINCT n.id
              FROM graph_nodes n
              JOIN graph_edges e ON e.source_node_id = n.id
              WHERE e.target_node_id = ANY($1)
                AND e.relation = $2
                AND n.type = $3
                AND n.is_archived = FALSE
              `
            : `
              SELECT DISTINCT n.id
              FROM graph_nodes n
              JOIN graph_edges e ON e.target_node_id = n.id
              WHERE e.source_node_id = ANY($1)
                AND e.relation = $2
                AND n.type = $3
                AND n.is_archived = FALSE
              `;
          const res = await this.pool.query(sql, [ids, rule.relation, rule.child]);
          for (const row of res.rows) {
            if (!visited.has(row.id)) {
              visited.add(row.id);
              childrenIds.push(row.id);
              total += 1;
            }
          }
        }
      }
      frontier = childrenIds;
    }
    return total;
  }

  // Соседи узла для визуализации (vis-network).
  // depth = 1: только прямые соседи (любые связи).
  // depth = 2: соседи соседей.
  async getNodeNeighbors(nodeId, { depth = 1 } = {}) {
    if (!isUuid(nodeId)) {
      throw serviceError("Некорректный идентификатор узла", 400);
    }
    const safeDepth = Math.max(1, Math.min(2, Math.trunc(Number(depth) || 1)));
    const nodes = new Map();
    const edges = new Map();

    const rootRes = await this.pool.query(
      `SELECT id, type, name, is_archived FROM graph_nodes WHERE id = $1 LIMIT 1`,
      [nodeId]
    );
    if (rootRes.rows.length === 0) {
      throw serviceError("Узел не найден", 404);
    }
    nodes.set(rootRes.rows[0].id, rootRes.rows[0]);

    let frontier = [nodeId];
    for (let hop = 0; hop < safeDepth; hop += 1) {
      if (frontier.length === 0) break;
      const res = await this.pool.query(
        `
        SELECT
          e.id AS edge_id,
          e.source_node_id,
          e.target_node_id,
          e.relation,
          ns.id AS s_id, ns.type AS s_type, ns.name AS s_name, ns.is_archived AS s_archived,
          nt.id AS t_id, nt.type AS t_type, nt.name AS t_name, nt.is_archived AS t_archived
        FROM graph_edges e
        JOIN graph_nodes ns ON ns.id = e.source_node_id
        JOIN graph_nodes nt ON nt.id = e.target_node_id
        WHERE (e.source_node_id = ANY($1) OR e.target_node_id = ANY($1))
          AND ns.is_archived = FALSE
          AND nt.is_archived = FALSE
        `,
        [frontier]
      );
      const newFrontier = [];
      for (const row of res.rows) {
        edges.set(row.edge_id, {
          id: row.edge_id,
          source: row.source_node_id,
          target: row.target_node_id,
          relation: row.relation,
        });
        if (!nodes.has(row.s_id)) {
          nodes.set(row.s_id, { id: row.s_id, type: row.s_type, name: row.s_name, is_archived: row.s_archived });
          newFrontier.push(row.s_id);
        }
        if (!nodes.has(row.t_id)) {
          nodes.set(row.t_id, { id: row.t_id, type: row.t_type, name: row.t_name, is_archived: row.t_archived });
          newFrontier.push(row.t_id);
        }
      }
      frontier = newFrontier;
    }

    return {
      nodes: Array.from(nodes.values()).map((n) => ({
        id: n.id,
        type: n.type,
        name: n.name,
      })),
      edges: Array.from(edges.values()),
    };
  }
}

export { HIERARCHY_RULES };
