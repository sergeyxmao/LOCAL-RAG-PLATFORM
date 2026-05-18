const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value) {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function clampConfidence(value, defaultValue = 1.0) {
  if (value === undefined || value === null) return defaultValue;
  const num = Number(value);
  if (!Number.isFinite(num)) return defaultValue;
  if (num < 0) return 0;
  if (num > 1) return 1;
  return num;
}

function normalizeAuthor(value) {
  if (value === undefined || value === null) return "user:manual";
  const text = String(value).trim();
  return text || "user:manual";
}

function normalizeAttributes(value) {
  if (value === null || value === undefined) return {};
  if (typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

function mapNodeRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    description: row.description,
    attributes: row.attributes ?? {},
    sourceDocumentId: row.source_document_id,
    sourcePageNumber: row.source_page_number,
    sourceXlsxSheet: row.source_xlsx_sheet,
    sourceXlsxRow: row.source_xlsx_row,
    confidence: row.confidence === null || row.confidence === undefined
      ? 1.0
      : Number(row.confidence),
    author: row.author,
    isArchived: row.is_archived === true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEdgeRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    sourceNodeId: row.source_node_id,
    targetNodeId: row.target_node_id,
    relation: row.relation,
    attributes: row.attributes ?? {},
    confidence: row.confidence === null || row.confidence === undefined
      ? 1.0
      : Number(row.confidence),
    author: row.author,
    createdAt: row.created_at,
  };
}

function mapRelatedRow(row) {
  if (!row) return null;
  return {
    direction: row.direction,
    edge: {
      id: row.edge_id,
      sourceNodeId: row.source_node_id,
      targetNodeId: row.target_node_id,
      relation: row.relation,
      attributes: row.edge_attributes ?? {},
      confidence: row.edge_confidence === null || row.edge_confidence === undefined
        ? 1.0
        : Number(row.edge_confidence),
      author: row.edge_author,
      createdAt: row.edge_created_at,
    },
    node: {
      id: row.node_id,
      type: row.node_type,
      name: row.node_name,
      description: row.node_description,
      attributes: row.node_attributes ?? {},
      sourceDocumentId: row.node_source_document_id,
      sourcePageNumber: row.node_source_page_number,
      sourceXlsxSheet: row.node_source_xlsx_sheet,
      sourceXlsxRow: row.node_source_xlsx_row,
      confidence: row.node_confidence === null || row.node_confidence === undefined
        ? 1.0
        : Number(row.node_confidence),
      author: row.node_author,
      isArchived: row.node_is_archived === true,
      createdAt: row.node_created_at,
      updatedAt: row.node_updated_at,
    },
  };
}

function serviceError(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

export class GraphService {
  constructor({ postgresProvider, logger } = {}) {
    if (!postgresProvider) {
      throw new Error("GraphService требует postgresProvider");
    }
    this.postgresProvider = postgresProvider;
    this.logger = logger ?? null;
  }

  async createNode(input = {}) {
    const type = String(input.type ?? "").trim();
    const name = String(input.name ?? "").trim();
    if (!type) {
      throw serviceError("Не указан тип узла", 400);
    }
    if (!name) {
      throw serviceError("Не указано имя узла", 400);
    }
    if (input.sourceDocumentId !== undefined && input.sourceDocumentId !== null && !isUuid(input.sourceDocumentId)) {
      throw serviceError("Некорректный sourceDocumentId", 400);
    }

    const row = await this.postgresProvider.createGraphNode({
      type,
      name,
      description:
        input.description === undefined || input.description === null
          ? null
          : String(input.description),
      attributes: normalizeAttributes(input.attributes),
      sourceDocumentId: input.sourceDocumentId ?? null,
      sourcePageNumber:
        input.sourcePageNumber === undefined || input.sourcePageNumber === null
          ? null
          : Math.max(1, Math.trunc(Number(input.sourcePageNumber))),
      sourceXlsxSheet:
        input.sourceXlsxSheet === undefined || input.sourceXlsxSheet === null
          ? null
          : String(input.sourceXlsxSheet),
      sourceXlsxRow:
        input.sourceXlsxRow === undefined || input.sourceXlsxRow === null
          ? null
          : Math.max(1, Math.trunc(Number(input.sourceXlsxRow))),
      confidence: clampConfidence(input.confidence, 1.0),
      author: normalizeAuthor(input.author),
    });
    return mapNodeRow(row);
  }

  async getNodeById(id) {
    if (!isUuid(id)) {
      throw serviceError("Некорректный идентификатор узла", 400);
    }
    const row = await this.postgresProvider.getGraphNodeById(id);
    return mapNodeRow(row);
  }

  async listNodes(options = {}) {
    const result = await this.postgresProvider.listGraphNodes({
      type: options.type,
      author: options.author,
      isArchived: options.isArchived,
      sourceDocumentId: options.sourceDocumentId,
      nameSearch: options.nameSearch,
      limit: options.limit ?? 50,
      offset: options.offset ?? 0,
    });
    return {
      items: result.items.map(mapNodeRow),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    };
  }

  async updateNode(id, patch = {}) {
    if (!isUuid(id)) {
      throw serviceError("Некорректный идентификатор узла", 400);
    }
    const existing = await this.postgresProvider.getGraphNodeById(id);
    if (!existing) {
      return null;
    }

    const normalized = {};
    if (Object.prototype.hasOwnProperty.call(patch, "type")) {
      const value = String(patch.type ?? "").trim();
      if (!value) {
        throw serviceError("Тип узла не может быть пустым", 400);
      }
      normalized.type = value;
    }
    if (Object.prototype.hasOwnProperty.call(patch, "name")) {
      const value = String(patch.name ?? "").trim();
      if (!value) {
        throw serviceError("Имя узла не может быть пустым", 400);
      }
      normalized.name = value;
    }
    if (Object.prototype.hasOwnProperty.call(patch, "description")) {
      normalized.description =
        patch.description === null ? null : String(patch.description);
    }
    if (Object.prototype.hasOwnProperty.call(patch, "attributes")) {
      normalized.attributes = normalizeAttributes(patch.attributes);
    }
    if (Object.prototype.hasOwnProperty.call(patch, "sourceDocumentId")) {
      if (patch.sourceDocumentId !== null && !isUuid(patch.sourceDocumentId)) {
        throw serviceError("Некорректный sourceDocumentId", 400);
      }
      normalized.sourceDocumentId = patch.sourceDocumentId;
    }
    if (Object.prototype.hasOwnProperty.call(patch, "sourcePageNumber")) {
      normalized.sourcePageNumber =
        patch.sourcePageNumber === null
          ? null
          : Math.max(1, Math.trunc(Number(patch.sourcePageNumber)));
    }
    if (Object.prototype.hasOwnProperty.call(patch, "sourceXlsxSheet")) {
      normalized.sourceXlsxSheet =
        patch.sourceXlsxSheet === null ? null : String(patch.sourceXlsxSheet);
    }
    if (Object.prototype.hasOwnProperty.call(patch, "sourceXlsxRow")) {
      normalized.sourceXlsxRow =
        patch.sourceXlsxRow === null
          ? null
          : Math.max(1, Math.trunc(Number(patch.sourceXlsxRow)));
    }
    if (Object.prototype.hasOwnProperty.call(patch, "confidence")) {
      normalized.confidence = clampConfidence(patch.confidence, 1.0);
    }
    if (Object.prototype.hasOwnProperty.call(patch, "author")) {
      normalized.author = normalizeAuthor(patch.author);
    }
    if (Object.prototype.hasOwnProperty.call(patch, "isArchived")) {
      normalized.isArchived = patch.isArchived === true;
    }

    const row = await this.postgresProvider.updateGraphNode(id, normalized);
    return mapNodeRow(row);
  }

  async archiveNode(id) {
    if (!isUuid(id)) {
      throw serviceError("Некорректный идентификатор узла", 400);
    }
    const row = await this.postgresProvider.setGraphNodeArchived(id, true);
    return mapNodeRow(row);
  }

  async unarchiveNode(id) {
    if (!isUuid(id)) {
      throw serviceError("Некорректный идентификатор узла", 400);
    }
    const row = await this.postgresProvider.setGraphNodeArchived(id, false);
    return mapNodeRow(row);
  }

  async createEdge(input = {}) {
    const sourceNodeId = String(input.sourceNodeId ?? "").trim();
    const targetNodeId = String(input.targetNodeId ?? "").trim();
    const relation = String(input.relation ?? "").trim();

    if (!isUuid(sourceNodeId)) {
      throw serviceError("Некорректный sourceNodeId", 400);
    }
    if (!isUuid(targetNodeId)) {
      throw serviceError("Некорректный targetNodeId", 400);
    }
    if (!relation) {
      throw serviceError("Не указан тип связи (relation)", 400);
    }
    if (sourceNodeId === targetNodeId) {
      throw serviceError("Узел не может ссылаться на самого себя", 400);
    }

    const [sourceNode, targetNode] = await Promise.all([
      this.postgresProvider.getGraphNodeById(sourceNodeId),
      this.postgresProvider.getGraphNodeById(targetNodeId),
    ]);
    if (!sourceNode) {
      throw serviceError("Исходный узел не найден", 404);
    }
    if (!targetNode) {
      throw serviceError("Целевой узел не найден", 404);
    }

    const result = await this.postgresProvider.createGraphEdge({
      sourceNodeId,
      targetNodeId,
      relation,
      attributes: normalizeAttributes(input.attributes),
      confidence: clampConfidence(input.confidence, 1.0),
      author: normalizeAuthor(input.author),
    });

    return {
      edge: mapEdgeRow(result.edge),
      created: result.created === true,
    };
  }

  async listEdges(options = {}) {
    if (options.sourceNodeId !== undefined && options.sourceNodeId !== null && options.sourceNodeId !== "" && !isUuid(options.sourceNodeId)) {
      throw serviceError("Некорректный sourceNodeId", 400);
    }
    if (options.targetNodeId !== undefined && options.targetNodeId !== null && options.targetNodeId !== "" && !isUuid(options.targetNodeId)) {
      throw serviceError("Некорректный targetNodeId", 400);
    }

    const result = await this.postgresProvider.listGraphEdges({
      sourceNodeId: options.sourceNodeId,
      targetNodeId: options.targetNodeId,
      relation: options.relation,
      limit: options.limit ?? 100,
      offset: options.offset ?? 0,
    });
    return {
      items: result.items.map(mapEdgeRow),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    };
  }

  async getRelatedNodes(nodeId, options = {}) {
    if (!isUuid(nodeId)) {
      throw serviceError("Некорректный идентификатор узла", 400);
    }
    const direction = ["outgoing", "incoming", "both"].includes(options.direction)
      ? options.direction
      : "both";
    const rows = await this.postgresProvider.getRelatedGraphNodes(nodeId, {
      relation: options.relation,
      direction,
    });
    return rows.map(mapRelatedRow);
  }

  async deleteEdge(id) {
    if (!isUuid(id)) {
      throw serviceError("Некорректный идентификатор связи", 400);
    }
    return this.postgresProvider.deleteGraphEdge(id);
  }

  async getStats() {
    const stats = await this.postgresProvider.getGraphStats();
    if (this.nodeTypeService && typeof this.nodeTypeService.getLabelsMap === "function") {
      try {
        stats.nodeTypeLabels = await this.nodeTypeService.getLabelsMap();
      } catch (err) {
        if (this.logger?.warn) {
          this.logger.warn({ err }, "Не удалось получить лейблы типов узлов для stats");
        }
        stats.nodeTypeLabels = {};
      }
    } else {
      stats.nodeTypeLabels = {};
    }
    return stats;
  }

  async upsertNodeByBusinessKey({
    type,
    name,
    businessKey,
    parentNodeId = null,
    parentRelation = null,
    attributes = {},
    description = null,
    sourceDocumentId = null,
    sourceXlsxSheet = null,
    sourceXlsxRow = null,
    confidence = 1.0,
    author = "user:manual",
  } = {}) {
    const cleanType = String(type ?? "").trim();
    if (!cleanType) throw serviceError("Не указан тип узла", 400);
    const cleanName = String(name ?? "").trim();
    if (!cleanName) throw serviceError("Не указано имя узла", 400);
    const matches = Array.isArray(businessKey?.attributeMatches)
      ? businessKey.attributeMatches.filter(
          (m) =>
            m &&
            typeof m.field === "string" &&
            m.value !== undefined &&
            m.value !== null &&
            String(m.value).length > 0
        )
      : [];
    if (matches.length === 0 && !parentNodeId) {
      throw serviceError("Бизнес-ключ пуст: нечего искать", 400);
    }
    const parentRelations = parentRelation
      ? (Array.isArray(parentRelation) ? parentRelation : [parentRelation])
      : [];
    if (parentNodeId && !isUuid(parentNodeId)) {
      throw serviceError("Некорректный parentNodeId", 400);
    }

    const existing = await this.postgresProvider.findGraphNodeByBusinessKey({
      type: cleanType,
      attributeMatches: matches,
      parentNodeId,
      parentRelations,
    });

    if (existing) {
      const updatedRow = await this.postgresProvider.updateGraphNodeAttributesAndSource(
        existing.id,
        {
          name: cleanName,
          attributes: normalizeAttributes(attributes),
          description: description === undefined ? null : description,
          sourceXlsxSheet: sourceXlsxSheet ?? null,
          sourceXlsxRow:
            sourceXlsxRow === null || sourceXlsxRow === undefined
              ? null
              : Math.max(1, Math.trunc(Number(sourceXlsxRow))),
        }
      );
      return { node: mapNodeRow(updatedRow), created: false, updated: true };
    }

    const row = await this.postgresProvider.createGraphNode({
      type: cleanType,
      name: cleanName,
      description: description ?? null,
      attributes: normalizeAttributes(attributes),
      sourceDocumentId: sourceDocumentId ?? null,
      sourcePageNumber: null,
      sourceXlsxSheet: sourceXlsxSheet ?? null,
      sourceXlsxRow:
        sourceXlsxRow === null || sourceXlsxRow === undefined
          ? null
          : Math.max(1, Math.trunc(Number(sourceXlsxRow))),
      confidence: clampConfidence(confidence, 1.0),
      author: normalizeAuthor(author),
    });
    const created = mapNodeRow(row);

    if (parentNodeId && parentRelations.length > 0) {
      try {
        await this.postgresProvider.createGraphEdge({
          sourceNodeId: created.id,
          targetNodeId: parentNodeId,
          relation: parentRelations[0],
          attributes: {},
          confidence: clampConfidence(confidence, 1.0),
          author: normalizeAuthor(author),
        });
      } catch (err) {
        if (this.logger?.warn) {
          this.logger.warn({ err }, "Не удалось создать parent-связь при upsert");
        }
      }
    }

    return { node: created, created: true, updated: false };
  }
}
