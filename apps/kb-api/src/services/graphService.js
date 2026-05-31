import { HIERARCHY_RULES } from "./graphTreeService.js";

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

const NAME_MAX = 80;

// Краткая суть случая для поля name: первые ~80 символов текста,
// схлопнутые пробелы. Полный текст уходит в description.
function shortName(text) {
  const clean = String(text ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= NAME_MAX) return clean;
  return clean.slice(0, NAME_MAX).trim() + "…";
}

// Дата случая хранится атрибутом (вариант А: тип event отложен).
// Принимаем строку формата YYYY-MM-DD; при невалидном значении — null.
function normalizeCaseDate(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  return text;
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

// ====== Этап 3: кандидаты LLM-извлечения ======

function cleanStr(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

// Приводит произвольный case_payload к канонической вложенной форме контракта
// {equipment:{name,model,location}, fault:{text,date}, solution:{text,date},
//  object, source_quote, confidence}. Факты не переписываются — только
// нормализация структуры и обрезка пробелов.
function normalizeCasePayload(raw) {
  const cp = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const equipment =
    cp.equipment && typeof cp.equipment === "object" ? cp.equipment : {};
  const fault = cp.fault && typeof cp.fault === "object" ? cp.fault : {};
  const solution = cp.solution && typeof cp.solution === "object" ? cp.solution : {};
  const out = {
    equipment: {
      name: cleanStr(equipment.name) || null,
      model: cleanStr(equipment.model) || null,
      location: cleanStr(equipment.location) || null,
    },
    fault: {
      text: cleanStr(fault.text) || null,
      date: normalizeCaseDate(fault.date),
    },
    solution: {
      text: cleanStr(solution.text) || null,
      date: normalizeCaseDate(solution.date),
    },
    object: cleanStr(cp.object) || null,
    source_quote: cleanStr(cp.source_quote) || null,
  };
  if (cp.confidence !== undefined && cp.confidence !== null) {
    out.confidence = clampConfidence(cp.confidence, 0.5);
  }
  return out;
}

// Разворачивает вложенный case_payload кандидата в ПЛОСКИЕ поля recordCase.
// Сигнатура recordCase под вложенный объект НЕ переписывается — раскладка
// делается здесь. Дату случая берём из fault.date (иначе solution.date).
function flattenCasePayload(raw) {
  const cp = normalizeCasePayload(raw);
  return {
    equipmentName: cp.equipment.name || null,
    equipmentModel: cp.equipment.model || null,
    equipmentLocation: cp.equipment.location || null,
    objectName: cp.object || null,
    faultText: cp.fault.text || null,
    solutionText: cp.solution.text || null,
    date: cp.fault.date || cp.solution.date || null,
  };
}

function mapCandidateRow(row) {
  if (!row) return null;
  let payload = row.case_payload;
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch (_e) {
      payload = {};
    }
  }
  return {
    id: row.id,
    sourceDocumentId: row.source_document_id,
    extractionJobId: row.extraction_job_id,
    casePayload: payload && typeof payload === "object" ? payload : {},
    confidence:
      row.confidence === null || row.confidence === undefined
        ? null
        : Number(row.confidence),
    status: row.status,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  };
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

  // Жёсткое удаление узла с опциональным каскадом по иерархии дерева.
  // - cascade=false: удаляется только узел; его потомки по дереву
  //   остаются (становятся "сиротами" в дереве).
  // - cascade=true:  удаляются узел и все его потомки по дереву
  //   (HIERARCHY_RULES, идентично подсчёту descendantsCount).
  // Связи к удаляемым узлам уходят автоматически через
  // ON DELETE CASCADE на graph_edges.
  async hardDeleteNode(id, { cascade = false, treeService = null } = {}) {
    if (!isUuid(id)) {
      throw serviceError("Некорректный идентификатор узла", 400);
    }
    const existing = await this.postgresProvider.getGraphNodeById(id);
    if (!existing) {
      return { deleted: false, deletedCount: 0 };
    }
    if (cascade !== true) {
      const removed = await this.postgresProvider.hardDeleteGraphNode(id);
      return { deleted: removed > 0, deletedCount: removed };
    }
    if (!treeService || typeof treeService._countDescendants !== "function") {
      throw serviceError(
        "Каскадное удаление требует доступ к treeService — обратитесь к разработчику",
        500
      );
    }
    // Собираем полный список ID узлов к удалению: сам узел + все его
    // потомки по HIERARCHY_RULES. Метод аналогичен _countDescendants,
    // но возвращает сами id.
    const allIds = await this._collectDescendantIds(id, treeService);
    const removed = await this.postgresProvider.hardDeleteGraphNodes(allIds);
    return { deleted: removed > 0, deletedCount: removed };
  }

  async _collectDescendantIds(rootId, _treeService) {
    // Собирает все id потомков по дереву HIERARCHY_RULES (включая root).
    // treeService передаётся для API-совместимости, но не используется
    // напрямую — HIERARCHY_RULES импортируется статически выше.
    const pool = this.postgresProvider.pool;
    const visited = new Set([rootId]);
    const collected = [rootId];
    let frontier = [rootId];
    let safety = 0;
    while (frontier.length > 0 && safety < 100) {
      safety += 1;
      const typeRes = await pool.query(
        `SELECT id, type FROM graph_nodes WHERE id = ANY($1)`,
        [frontier]
      );
      const byType = new Map();
      for (const row of typeRes.rows) {
        if (!byType.has(row.type)) byType.set(row.type, []);
        byType.get(row.type).push(row.id);
      }
      const newFrontier = [];
      for (const [parentType, ids] of byType.entries()) {
        const parentRules = HIERARCHY_RULES.filter((r) => r.parent === parentType);
        for (const rule of parentRules) {
          const sql = rule.direction === "forward"
            ? `
              SELECT DISTINCT n.id
              FROM graph_nodes n
              JOIN graph_edges e ON e.source_node_id = n.id
              WHERE e.target_node_id = ANY($1)
                AND e.relation = $2
                AND n.type = $3
              `
            : `
              SELECT DISTINCT n.id
              FROM graph_nodes n
              JOIN graph_edges e ON e.target_node_id = n.id
              WHERE e.source_node_id = ANY($1)
                AND e.relation = $2
                AND n.type = $3
              `;
          const res = await pool.query(sql, [ids, rule.relation, rule.child]);
          for (const row of res.rows) {
            if (!visited.has(row.id)) {
              visited.add(row.id);
              collected.push(row.id);
              newFrontier.push(row.id);
            }
          }
        }
      }
      frontier = newFrontier;
    }
    return collected;
  }

  // ================== Память инженера: запись случая ==================
  // Композитный атомарный метод: за один сабмит фиксирует случай
  // (оборудование + неисправность + опционально решение и объект)
  // и связи между ними. Вся работа — в одной транзакции внутри
  // postgresProvider.recordCaseTx; при ошибке выполняется полный откат.
  async recordCase(input = {}) {
    const equipmentId =
      input.equipmentId === undefined || input.equipmentId === null
        ? null
        : String(input.equipmentId).trim();
    if (equipmentId && !isUuid(equipmentId)) {
      throw serviceError("Некорректный идентификатор оборудования", 400);
    }
    const equipmentName = String(input.equipmentName ?? "").trim();
    if (!equipmentId && !equipmentName) {
      throw serviceError("Не указано оборудование", 400);
    }

    const faultText = String(input.faultText ?? "").trim();
    if (!faultText) {
      throw serviceError("Не указано, что произошло (faultText)", 400);
    }

    const objectId =
      input.objectId === undefined || input.objectId === null
        ? null
        : String(input.objectId).trim();
    if (objectId && !isUuid(objectId)) {
      throw serviceError("Некорректный идентификатор объекта", 400);
    }
    const objectName = String(input.objectName ?? "").trim();

    const documentId =
      input.documentId === undefined || input.documentId === null
        ? null
        : String(input.documentId).trim();
    if (documentId && !isUuid(documentId)) {
      throw serviceError("Некорректный идентификатор документа", 400);
    }

    const solutionText = String(input.solutionText ?? "").trim();
    const equipmentModel = String(input.equipmentModel ?? "").trim();
    const equipmentLocation = String(input.equipmentLocation ?? "").trim();
    const date = normalizeCaseDate(input.date);

    const payload = {
      equipmentId: equipmentId || null,
      equipmentName: equipmentName || null,
      equipmentModel: equipmentModel || null,
      equipmentLocation: equipmentLocation || null,
      objectId: objectId || null,
      objectName: objectName || null,
      faultName: shortName(faultText),
      faultText,
      solutionName: solutionText ? shortName(solutionText) : null,
      solutionText: solutionText || null,
      date,
      documentId: documentId || null,
      // Этап 3: автор и уверенность. Дефолты сохраняют поведение Этапа 1
      // (ручная запись → "user:manual" / 1.0). LLM-подтверждение передаёт
      // author="agent:llm-extraction" и confidence из кандидата.
      author: normalizeAuthor(input.author),
      confidence: clampConfidence(input.confidence, 1.0),
    };

    const result = await this.postgresProvider.recordCaseTx(payload);

    const nodes = {};
    for (const key of Object.keys(result.nodes)) {
      nodes[key] = mapNodeRow(result.nodes[key]);
    }
    return {
      nodes,
      edges: result.edges.map(mapEdgeRow),
      created: result.created,
    };
  }

  // ============== Этап 3: очередь кандидатов LLM-извлечения ==============

  // Список кандидатов (по документу / запуску / статусу).
  async listCandidates(options = {}) {
    if (
      options.sourceDocumentId !== undefined &&
      options.sourceDocumentId !== null &&
      options.sourceDocumentId !== "" &&
      !isUuid(options.sourceDocumentId)
    ) {
      throw serviceError("Некорректный sourceDocumentId", 400);
    }
    if (
      options.extractionJobId !== undefined &&
      options.extractionJobId !== null &&
      options.extractionJobId !== "" &&
      !isUuid(options.extractionJobId)
    ) {
      throw serviceError("Некорректный extractionJobId", 400);
    }
    const result = await this.postgresProvider.listExtractionCandidates({
      sourceDocumentId: options.sourceDocumentId || undefined,
      extractionJobId: options.extractionJobId || undefined,
      status: options.status || undefined,
      limit: options.limit ?? 200,
      offset: options.offset ?? 0,
    });
    return {
      items: result.items.map(mapCandidateRow),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    };
  }

  // Список запусков извлечения (группировка по документу) — для левой
  // колонки экрана ревью.
  async listCandidateRuns(options = {}) {
    const rows = await this.postgresProvider.listExtractionRuns({
      limit: options.limit ?? 100,
    });
    return rows.map((r) => ({
      extractionJobId: r.extraction_job_id,
      sourceDocumentId: r.source_document_id,
      documentTitle: r.document_title,
      documentFileName: r.document_file_name,
      total: r.total,
      pending: r.pending,
      approved: r.approved,
      rejected: r.rejected,
      createdAt: r.created_at,
      lastReviewedAt: r.last_reviewed_at,
    }));
  }

  // Правка кандидата перед подтверждением (только статус 'pending').
  async updateCandidate(candidateId, patch = {}) {
    if (!isUuid(candidateId)) {
      throw serviceError("Некорректный идентификатор кандидата", 400);
    }
    const row = await this.postgresProvider.getExtractionCandidateById(candidateId);
    if (!row) {
      throw serviceError("Кандидат не найден", 404);
    }
    if (row.status !== "pending") {
      throw serviceError("Править можно только кандидата со статусом «на ревью»", 409);
    }
    const updated = await this.postgresProvider.updateExtractionCandidatePayload(
      candidateId,
      {
        casePayload:
          patch.casePayload !== undefined
            ? normalizeCasePayload(patch.casePayload)
            : undefined,
        confidence:
          patch.confidence === undefined
            ? undefined
            : patch.confidence === null
              ? null
              : clampConfidence(patch.confidence, 0.5),
      }
    );
    return { candidate: mapCandidateRow(updated) };
  }

  // Подтверждение кандидата: разворачиваем case_payload в плоские поля,
  // вызываем recordCase с author='agent:llm-extraction' и confidence из
  // кандидата. Дедупликация оборудования по имени отрабатывает внутри
  // recordCaseTx (findNodeByName), если передан equipmentName (а не id).
  async approveCandidate(candidateId) {
    if (!isUuid(candidateId)) {
      throw serviceError("Некорректный идентификатор кандидата", 400);
    }
    const row = await this.postgresProvider.getExtractionCandidateById(candidateId);
    if (!row) {
      throw serviceError("Кандидат не найден", 404);
    }
    if (row.status === "approved") {
      throw serviceError("Кандидат уже подтверждён", 409);
    }
    const flat = flattenCasePayload(row.case_payload);
    if (!flat.equipmentName) {
      throw serviceError(
        "В кандидате не указано оборудование — подтверждение невозможно",
        400
      );
    }
    if (!flat.faultText) {
      throw serviceError(
        "В кандидате не указано, что произошло — подтверждение невозможно",
        400
      );
    }
    const confidence =
      row.confidence === null || row.confidence === undefined
        ? 0.5
        : Number(row.confidence);

    const result = await this.recordCase({
      equipmentName: flat.equipmentName,
      equipmentModel: flat.equipmentModel,
      equipmentLocation: flat.equipmentLocation,
      objectName: flat.objectName,
      faultText: flat.faultText,
      solutionText: flat.solutionText,
      date: flat.date,
      documentId: row.source_document_id || null,
      author: "agent:llm-extraction",
      confidence,
    });

    const updated = await this.postgresProvider.updateExtractionCandidateStatus(
      candidateId,
      "approved"
    );

    const nodes = {};
    for (const key of Object.keys(result.nodes)) {
      nodes[key] = result.nodes[key];
    }
    return {
      candidate: mapCandidateRow(updated),
      nodes,
      edges: result.edges,
      created: result.created,
    };
  }

  // Отклонение кандидата: status='rejected', остаётся для аудита, в граф
  // не идёт.
  async rejectCandidate(candidateId) {
    if (!isUuid(candidateId)) {
      throw serviceError("Некорректный идентификатор кандидата", 400);
    }
    const row = await this.postgresProvider.getExtractionCandidateById(candidateId);
    if (!row) {
      throw serviceError("Кандидат не найден", 404);
    }
    const updated = await this.postgresProvider.updateExtractionCandidateStatus(
      candidateId,
      "rejected"
    );
    return { candidate: mapCandidateRow(updated) };
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
