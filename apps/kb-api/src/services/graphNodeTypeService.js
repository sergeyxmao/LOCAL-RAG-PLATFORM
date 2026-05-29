const CODE_REGEX = /^[a-z][a-z0-9_]*$/;
const LABEL_MAX = 128;
const DESCRIPTION_MAX = 2048;
const ICON_MAX = 16;
const SORT_ORDER_MIN = 1;
const SORT_ORDER_MAX = 9999;

const BUILTIN_TYPES = [
  {
    code: "object",
    label_ru: "Объект",
    icon: "🏭",
    sort_order: 10,
    description: "Верхний уровень: установка, цех, объект АСУ ТП.",
  },
  {
    code: "cabinet",
    label_ru: "Шкаф",
    icon: "🗄",
    sort_order: 20,
    description: "Шкаф автоматики, корпус с оборудованием.",
  },
  {
    code: "station",
    label_ru: "ПЛК",
    icon: "⚡",
    sort_order: 30,
    description: "Программируемый логический контроллер (контроллер автоматизации).",
  },
  {
    code: "card",
    label_ru: "Плата",
    icon: "🔌",
    sort_order: 40,
    description: "Модуль ввода/вывода в ПЛК или шкафу.",
  },
  {
    code: "channel",
    label_ru: "Канал",
    icon: "📡",
    sort_order: 50,
    description: "Физический канал на плате (терминал).",
  },
  {
    code: "signal",
    label_ru: "Сигнал",
    icon: "〰",
    sort_order: 60,
    description: "Логический сигнал, привязанный к каналу или прибору.",
  },
  {
    code: "device",
    label_ru: "Прибор",
    icon: "📟",
    sort_order: 70,
    description: "Полевой прибор: датчик, исполнительный механизм.",
  },
  // Память инженера (Этап 1): универсальный слой знаний и опыта,
  // не привязанный к таблицам сигналов АСУ ТП.
  {
    code: "equipment",
    label_ru: "Оборудование",
    icon: "🔧",
    sort_order: 80,
    description:
      "Зонтичный тип оборудования: датчик, насос, кабель, автомат, клеммник. Не путать с device (узкий полевой прибор АСУ ТП).",
  },
  {
    code: "fault",
    label_ru: "Неисправность",
    icon: "⚠️",
    sort_order: 90,
    description: "Случай неисправности / отказа / дефекта оборудования.",
  },
  {
    code: "solution",
    label_ru: "Решение",
    icon: "✅",
    sort_order: 100,
    description: "Принятое решение / действие, устранившее неисправность.",
  },
];

function serviceError(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

function mapTypeRow(row) {
  if (!row) return null;
  return {
    code: row.code,
    label_ru: row.label_ru,
    description: row.description,
    icon: row.icon,
    sort_order: Number(row.sort_order),
    is_builtin: row.is_builtin === true,
    is_archived: row.is_archived === true,
    usage_count: row.usage_count !== undefined && row.usage_count !== null
      ? Number(row.usage_count)
      : 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function normalizeIcon(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  if (!text) return null;
  return text.slice(0, ICON_MAX);
}

function normalizeLabel(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text || null;
}

function normalizeDescription(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const text = String(value);
  return text;
}

function normalizeSortOrder(value, fallback = 100) {
  if (value === undefined || value === null || value === "") return fallback;
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(SORT_ORDER_MIN, Math.min(SORT_ORDER_MAX, Math.trunc(num)));
}

export class GraphNodeTypeService {
  constructor({ postgresProvider, logger } = {}) {
    if (!postgresProvider) {
      throw new Error("GraphNodeTypeService требует postgresProvider");
    }
    this.postgresProvider = postgresProvider;
    this.pool = postgresProvider.pool;
    this.logger = logger ?? null;
  }

  async ensureBuiltinTypes() {
    for (const t of BUILTIN_TYPES) {
      await this.pool.query(
        `
        INSERT INTO graph_node_types
          (code, label_ru, description, icon, sort_order, is_builtin)
        VALUES ($1, $2, $3, $4, $5, TRUE)
        ON CONFLICT (code) DO UPDATE SET
          is_builtin = TRUE
        `,
        [t.code, t.label_ru, t.description, t.icon, t.sort_order]
      );
    }
    if (this.logger?.info) {
      this.logger.info(
        { count: BUILTIN_TYPES.length },
        "Bootstrap встроенных типов узлов графа выполнен"
      );
    }
  }

  async listTypes({ includeArchived = true } = {}) {
    const where = includeArchived ? "" : "WHERE is_archived = FALSE";
    const result = await this.pool.query(`
      SELECT
        t.code,
        t.label_ru,
        t.description,
        t.icon,
        t.sort_order,
        t.is_builtin,
        t.is_archived,
        t.created_at,
        t.updated_at,
        COALESCE(u.usage_count, 0) AS usage_count
      FROM graph_node_types t
      LEFT JOIN (
        SELECT type AS code, COUNT(*)::int AS usage_count
        FROM graph_nodes
        WHERE is_archived = FALSE
        GROUP BY type
      ) u ON u.code = t.code
      ${where}
      ORDER BY t.sort_order ASC, t.code ASC
    `);
    return result.rows.map(mapTypeRow);
  }

  async getTypeByCode(code) {
    const cleanCode = String(code ?? "").trim();
    if (!cleanCode) {
      throw serviceError("Не указан код типа узла", 400);
    }
    const result = await this.pool.query(
      `
      SELECT
        t.code,
        t.label_ru,
        t.description,
        t.icon,
        t.sort_order,
        t.is_builtin,
        t.is_archived,
        t.created_at,
        t.updated_at,
        COALESCE(u.usage_count, 0) AS usage_count
      FROM graph_node_types t
      LEFT JOIN (
        SELECT type AS code, COUNT(*)::int AS usage_count
        FROM graph_nodes
        WHERE is_archived = FALSE
        GROUP BY type
      ) u ON u.code = t.code
      WHERE t.code = $1
      LIMIT 1
      `,
      [cleanCode]
    );
    return mapTypeRow(result.rows[0]);
  }

  async getLabelsMap() {
    const result = await this.pool.query(
      `SELECT code, label_ru, icon FROM graph_node_types`
    );
    const map = {};
    for (const row of result.rows) {
      map[row.code] = {
        label_ru: row.label_ru,
        icon: row.icon,
      };
    }
    return map;
  }

  async createType(input = {}) {
    const code = String(input.code ?? "").trim();
    if (!code) {
      throw serviceError("Не указан код типа узла", 400);
    }
    if (!CODE_REGEX.test(code)) {
      throw serviceError(
        "Код должен начинаться с буквы латиницы и содержать только латиницу, цифры и _",
        400
      );
    }
    if (code.length > 64) {
      throw serviceError("Код не должен превышать 64 символа", 400);
    }
    const labelRu = normalizeLabel(input.label_ru);
    if (!labelRu) {
      throw serviceError("Не указано название (label_ru)", 400);
    }
    if (labelRu.length > LABEL_MAX) {
      throw serviceError(`Название не должно превышать ${LABEL_MAX} символов`, 400);
    }
    const description = normalizeDescription(input.description);
    if (description !== undefined && description !== null && description.length > DESCRIPTION_MAX) {
      throw serviceError(`Описание не должно превышать ${DESCRIPTION_MAX} символов`, 400);
    }
    const icon = normalizeIcon(input.icon);
    const sortOrder = normalizeSortOrder(input.sort_order, 100);

    const existing = await this.pool.query(
      `SELECT code FROM graph_node_types WHERE code = $1 LIMIT 1`,
      [code]
    );
    if (existing.rows.length > 0) {
      throw serviceError(`Тип "${code}" уже существует`, 409);
    }

    await this.pool.query(
      `
      INSERT INTO graph_node_types
        (code, label_ru, description, icon, sort_order, is_builtin, is_archived)
      VALUES ($1, $2, $3, $4, $5, FALSE, FALSE)
      `,
      [code, labelRu, description ?? null, icon, sortOrder]
    );

    return this.getTypeByCode(code);
  }

  async updateType(code, patch = {}) {
    const cleanCode = String(code ?? "").trim();
    if (!cleanCode) {
      throw serviceError("Не указан код типа узла", 400);
    }
    const existing = await this.getTypeByCode(cleanCode);
    if (!existing) {
      return null;
    }
    if (
      Object.prototype.hasOwnProperty.call(patch, "code") &&
      patch.code !== undefined &&
      patch.code !== null &&
      String(patch.code).trim() !== cleanCode
    ) {
      if (existing.is_builtin) {
        throw serviceError(
          `Нельзя менять код у системного типа "${cleanCode}"`,
          403
        );
      }
      throw serviceError("Поле code не редактируется", 400);
    }

    const sets = [];
    const params = [];

    if (Object.prototype.hasOwnProperty.call(patch, "label_ru")) {
      const labelRu = normalizeLabel(patch.label_ru);
      if (!labelRu) {
        throw serviceError("Название (label_ru) не может быть пустым", 400);
      }
      if (labelRu.length > LABEL_MAX) {
        throw serviceError(`Название не должно превышать ${LABEL_MAX} символов`, 400);
      }
      params.push(labelRu);
      sets.push(`label_ru = $${params.length}`);
    }
    if (Object.prototype.hasOwnProperty.call(patch, "description")) {
      const description = normalizeDescription(patch.description);
      if (description !== undefined && description !== null && description.length > DESCRIPTION_MAX) {
        throw serviceError(
          `Описание не должно превышать ${DESCRIPTION_MAX} символов`,
          400
        );
      }
      params.push(description === undefined ? null : description);
      sets.push(`description = $${params.length}`);
    }
    if (Object.prototype.hasOwnProperty.call(patch, "icon")) {
      params.push(normalizeIcon(patch.icon));
      sets.push(`icon = $${params.length}`);
    }
    if (Object.prototype.hasOwnProperty.call(patch, "sort_order")) {
      params.push(normalizeSortOrder(patch.sort_order, existing.sort_order));
      sets.push(`sort_order = $${params.length}`);
    }
    if (Object.prototype.hasOwnProperty.call(patch, "is_archived")) {
      params.push(patch.is_archived === true);
      sets.push(`is_archived = $${params.length}`);
    }

    if (sets.length === 0) {
      return existing;
    }

    params.push(cleanCode);
    await this.pool.query(
      `UPDATE graph_node_types SET ${sets.join(", ")} WHERE code = $${params.length}`,
      params
    );
    return this.getTypeByCode(cleanCode);
  }

  async deleteType(code) {
    const cleanCode = String(code ?? "").trim();
    if (!cleanCode) {
      throw serviceError("Не указан код типа узла", 400);
    }
    const existing = await this.getTypeByCode(cleanCode);
    if (!existing) {
      throw serviceError(`Тип узла "${cleanCode}" не найден`, 404);
    }
    if (existing.is_builtin) {
      throw serviceError(
        `Системный тип "${cleanCode}" нельзя удалить`,
        403
      );
    }
    if (existing.usage_count > 0) {
      throw serviceError(
        `Тип "${cleanCode}" используется в ${existing.usage_count} узлах. Сначала измените их тип или удалите.`,
        409
      );
    }
    await this.pool.query(
      `DELETE FROM graph_node_types WHERE code = $1`,
      [cleanCode]
    );
    return { code: cleanCode };
  }
}

export { BUILTIN_TYPES };
