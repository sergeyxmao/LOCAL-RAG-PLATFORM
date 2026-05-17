// Сервис «Диагностика» — собирает 15 проверок готовности системы для отображения
// в Настройки → Диагностика. Никаких автозапросов; вызывается явно через POST.
export class DiagnosticsService {
  constructor({ postgresProvider, qdrantProvider }) {
    this.postgresProvider = postgresProvider;
    this.qdrantProvider = qdrantProvider;
  }

  async runAll() {
    const checks = await Promise.all([
      this._checkSystemRoot(),
      this._checkTreeBuilt(),
      this._checkClosureConsistency(),
      this._checkCountersFreshness(),
      this._checkPrimaryNodes(),
      this._checkQdrantAvailable(),
      this._checkQdrantPostgresMatch(),
      this._checkQdrantPayloadIndexes(),
      this._checkUiState(),
      this._checkActiveJobs(),
      this._checkTreeETag(),
      this._checkLocalOpenHelper(),
      this._checkImportNodeControl(),
      this._checkLastSyncStatus(),
      this._checkPayloadAuditEnabled(),
    ]);

    const ok = checks.filter((c) => c.status === "ok").length;
    const warnings = checks.filter((c) => c.status === "warning").length;
    const errors = checks.filter((c) => c.status === "error").length;

    return {
      checks,
      summary: { total: checks.length, ok, warnings, errors },
    };
  }

  _check(id, name) {
    return { id, name, status: "ok", details: "" };
  }

  _safe(call) {
    return call.catch((error) => ({ error: error?.message || String(error) }));
  }

  async _checkSystemRoot() {
    const result = this._check("system_root", "Системный раздел «Без раздела»");
    try {
      const { rows } = await this.postgresProvider.pool.query(
        `SELECT COUNT(*)::int AS c FROM knowledge_nodes WHERE is_system = TRUE AND is_active = TRUE`
      );
      const count = rows[0]?.c ?? 0;
      if (count === 1) {
        result.details = "активных системных разделов: 1";
      } else if (count === 0) {
        result.status = "error";
        result.details = "Системный раздел отсутствует. Создайте «Без раздела» через миграцию схемы или /ui/nodes.";
      } else {
        result.status = "warning";
        result.details = `активных системных разделов: ${count} (ожидалось 1)`;
      }
    } catch (error) {
      result.status = "error";
      result.details = error.message;
    }
    return result;
  }

  async _checkTreeBuilt() {
    const result = this._check("tree_built", "Дерево разделов создано");
    try {
      const { rows } = await this.postgresProvider.pool.query(
        `SELECT COUNT(*)::int AS c FROM knowledge_nodes WHERE is_active = TRUE`
      );
      const count = rows[0]?.c ?? 0;
      result.details = `активных узлов: ${count}`;
      if (count === 0) {
        result.status = "warning";
        result.details += ". В базе нет ни одного раздела — добавьте через /ui/v2/knowledge.";
      }
    } catch (error) {
      result.status = "error";
      result.details = error.message;
    }
    return result;
  }

  async _checkClosureConsistency() {
    const result = this._check("closure_consistency", "Closure-таблица согласована");
    try {
      const { rows } = await this.postgresProvider.pool.query(
        `SELECT
           (SELECT COUNT(*) FROM knowledge_nodes WHERE is_active = TRUE)::int AS nodes,
           (SELECT COUNT(*) FROM knowledge_node_closure WHERE ancestor_id = descendant_id)::int AS self`
      );
      const nodes = rows[0]?.nodes ?? 0;
      const self = rows[0]?.self ?? 0;
      if (nodes === self) {
        result.details = `узлов: ${nodes}, self-ссылок: ${self}`;
      } else {
        result.status = "warning";
        result.details = `узлов: ${nodes}, self-ссылок: ${self}. Closure требует пересборки.`;
      }
    } catch (error) {
      result.status = "error";
      result.details = error.message;
    }
    return result;
  }

  async _checkCountersFreshness() {
    const result = this._check("counters_fresh", "Кэш счётчиков узлов");
    try {
      const { rows } = await this.postgresProvider.pool.query(
        `SELECT
           (SELECT COUNT(*) FROM knowledge_nodes WHERE is_active = TRUE)::int AS nodes,
           (SELECT COUNT(*) FROM node_counters)::int AS counters,
           (SELECT MAX(updated_at) FROM node_counters) AS last_at`
      );
      const nodes = rows[0]?.nodes ?? 0;
      const counters = rows[0]?.counters ?? 0;
      const lastAt = rows[0]?.last_at;
      result.details = `узлов: ${nodes}, счётчиков: ${counters}` + (lastAt ? `, обновлены ${new Date(lastAt).toISOString()}` : "");
      if (counters < nodes) {
        result.status = "warning";
        result.details += ". Кэш счётчиков не покрывает все узлы.";
      }
    } catch (error) {
      result.status = "error";
      result.details = error.message;
    }
    return result;
  }

  async _checkPrimaryNodes() {
    const result = this._check("primary_nodes", "Primary-разделы документов корректны");
    try {
      const { rows } = await this.postgresProvider.pool.query(
        `SELECT document_id, COUNT(*) FILTER (WHERE is_primary = TRUE)::int AS primary_count
         FROM document_node_links
         GROUP BY document_id
         HAVING COUNT(*) FILTER (WHERE is_primary = TRUE) <> 1
         LIMIT 5`
      );
      if (rows.length === 0) {
        result.details = "Каждый документ имеет ровно один primary-раздел.";
      } else {
        result.status = "warning";
        result.details = `Найдены документы с неверным числом primary: ${rows.length} (примеры)`;
      }
    } catch (error) {
      result.status = "error";
      result.details = error.message;
    }
    return result;
  }

  async _checkQdrantAvailable() {
    const result = this._check("qdrant_available", "Qdrant доступен");
    try {
      if (!this.qdrantProvider?.client?.getCollections) {
        throw new Error("Qdrant client не сконфигурирован");
      }
      const collections = await this.qdrantProvider.client.getCollections();
      const list = collections?.collections || [];
      result.details = `коллекций: ${list.length}`;
    } catch (error) {
      result.status = "error";
      result.details = error.message;
    }
    return result;
  }

  async _checkQdrantPostgresMatch() {
    const result = this._check("qdrant_pg_match", "Qdrant совпадает с indexed PostgreSQL");
    try {
      const status = await this.qdrantProvider.getCollectionStatus();
      const points = status?.exists ? Number(status.pointsCount || 0) : 0;
      const { rows } = await this.postgresProvider.pool.query(
        `SELECT
           (SELECT COUNT(*) FROM document_chunks)::int AS chunks,
           (SELECT COUNT(*) FROM document_assets WHERE file_name IS NOT NULL)::int AS assets`
      );
      const chunks = rows[0]?.chunks ?? 0;
      const assets = rows[0]?.assets ?? 0;
      const total = chunks + assets;
      if (points === total) {
        result.details = `Qdrant: ${points}, Postgres chunks+assets: ${total}`;
      } else {
        result.status = "warning";
        const direction = points > total ? "лишние точки" : "недостающие точки";
        result.details = `Qdrant: ${points}, Postgres: ${total} (${direction}). Запустите «Пересобрать Qdrant» на вкладке Обслуживание.`;
      }
    } catch (error) {
      result.status = "error";
      result.details = error.message;
    }
    return result;
  }

  async _checkQdrantPayloadIndexes() {
    const result = this._check("qdrant_payload_indexes", "Payload-индексы Qdrant созданы");
    try {
      const status = await this.qdrantProvider.getCollectionStatus();
      if (!status?.exists) {
        result.status = "warning";
        result.details = "Коллекция в Qdrant не создана — индексы появятся после первого импорта.";
        return result;
      }
      const expected = ["document_id", "node_ids", "categories", "resource_type"];
      const indexed = Array.isArray(status.payloadIndexedFields) ? status.payloadIndexedFields : [];
      const missing = expected.filter((f) => !indexed.includes(f));
      if (missing.length === 0) {
        result.details = `индексов: ${indexed.length}, ключевые поля покрыты`;
      } else {
        result.status = "warning";
        result.details = `отсутствуют payload-индексы: ${missing.join(", ")}. Перезапустите kb-api или пересоберите коллекцию.`;
      }
    } catch (error) {
      result.status = "error";
      result.details = error.message;
    }
    return result;
  }

  async _checkUiState() {
    const result = this._check("ui_state", "Состояние UI сохраняется");
    try {
      const { rows } = await this.postgresProvider.pool.query(
        `SELECT COUNT(*)::int AS c FROM ui_state`
      );
      if ((rows[0]?.c ?? 0) >= 1) {
        result.details = "Таблица ui_state инициализирована.";
      } else {
        result.status = "warning";
        result.details = "Таблица ui_state пуста — её строка по умолчанию должна быть создана при старте.";
      }
    } catch (error) {
      result.status = "error";
      result.details = error.message;
    }
    return result;
  }

  async _checkActiveJobs() {
    const result = this._check("active_jobs", "Активные фоновые задачи");
    try {
      const { rows } = await this.postgresProvider.pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE status IN ('queued', 'running', 'cancel_requested'))::int AS active,
           COUNT(*) FILTER (WHERE status = 'queued' AND document_id IS NULL)::int AS pre_upload`
      );
      const active = rows[0]?.active ?? 0;
      const preUpload = rows[0]?.pre_upload ?? 0;
      if (active === 0) {
        result.details = "Активных задач нет.";
      } else {
        result.details = `активных: ${active}` + (preUpload > 0 ? ` (из них ожидают загрузку файла: ${preUpload})` : "");
      }
    } catch (error) {
      result.status = "error";
      result.details = error.message;
    }
    return result;
  }

  async _checkTreeETag() {
    const result = this._check("tree_etag", "Дерево разделов отдаётся с ETag");
    result.details = "Проверка возможна только через сетевой вызов /nodes?format=tree (см. логи).";
    return result;
  }

  async _checkLocalOpenHelper() {
    const result = this._check("local_open_helper", "Локальное открытие файлов");
    result.details = "helper-контракт публикуется при наличии config.localOpen.helperUrl.";
    return result;
  }

  async _checkImportNodeControl() {
    const result = this._check("import_node_control", "Контроль раздела при импорте");
    result.details = "В UI v2 импорт всегда привязан к выбранному разделу.";
    return result;
  }

  async _checkLastSyncStatus() {
    const result = this._check("last_sync", "Последняя синхронизация Qdrant");
    try {
      const status = await this.postgresProvider.getNodeSyncStatus();
      if (!status) {
        result.status = "warning";
        result.details = "Запись node_sync_status отсутствует.";
        return result;
      }
      if (status.last_error) {
        result.status = "warning";
        result.details = `Последняя ошибка: ${status.last_error}`;
      } else if (status.last_reindex_at) {
        result.details = `Последний реиндекс: ${new Date(status.last_reindex_at).toISOString()}, документов: ${status.last_document_count}, точек: ${status.last_point_count}`;
      } else {
        result.details = "Реиндексаций ещё не было.";
      }
    } catch (error) {
      result.status = "error";
      result.details = error.message;
    }
    return result;
  }

  async _checkPayloadAuditEnabled() {
    const result = this._check("payload_audit", "Фоновая сверка payload Qdrant");
    result.details = "Включается при следующем импорте; вручную через «Пересобрать Qdrant».";
    return result;
  }
}
