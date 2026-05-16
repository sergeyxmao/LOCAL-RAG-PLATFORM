# Data Schema

Основные таблицы:
- documents
- document_chunks
- document_assets
- ingestion_jobs
- knowledge_nodes
- knowledge_node_closure
- document_node_links
- job_node_links
- node_counters
- node_sync_status
- ui_state
- query_logs
- system_settings

## Разделы базы знаний

`knowledge_nodes` хранит пользовательское дерево разделов произвольной глубины:

- `parent_id` — родительский узел или `NULL` для корня;
- `name`, `type_label`, `color`, `sort_order`, `description` — отображение в UI;
- `is_system` — служебные узлы, сейчас `Без раздела`;
- `is_active` — мягкое отключение раздела.

`knowledge_node_closure` хранит предков и потомков для быстрых запросов по поддереву. В таблице всегда есть self-reference вида `(node_id, node_id, 0)`.

`document_node_links` хранит M:N-привязку документов к разделам:

- один документ может быть в нескольких разделах;
- `is_primary = true` задаёт основной раздел для отображения;
- partial unique index гарантирует максимум один primary-раздел на документ.

Если у документа пока нет строк в `document_node_links`, API считает его документом системного раздела `Без раздела`. При явной замене привязок пустой набор тоже переводится в `Без раздела`.

`job_node_links` подготовлен под будущую привязку задач импорта к разделам.

Qdrant payload документа теперь можно пересчитать без переиндексации векторов через `POST /documents/:id/reindex-payload`. Добавляемые поля:

- `node_ids`;
- `node_scope_ids`;
- `primary_node_id`;
- `node_paths`;
- `payload_version = 2`.

Новые документы при импорте сразу получают эти поля в payload. Endpoints импорта принимают `nodeIds` и `primaryNodeId`; если `nodeIds` пустой, документ привязывается к `Без раздела`. Для уже индексированного файла повторный импорт с `nodeIds` не создаёт дубль, а обновляет привязки и payload существующего документа.

`node_counters` хранит кэш счётчиков разделов:

- `direct_documents` — документы, привязанные напрямую к узлу;
- `scope_documents` — документы узла и вложенных разделов;
- `scope_pages` — PDF-страницы документов в scope.

Кэш обновляется SQL-триггерами после изменений `documents`, `document_assets`, `document_node_links` и `knowledge_nodes`. `/nodes/counts` по-прежнему умеет считать live-значения, а `/admin/knowledge-nodes-status` дополнительно проверяет, что кэш заполнен для всех узлов.

`node_sync_status` хранит последнюю ручную синхронизацию Postgres -> Qdrant для payload разделов:

- `last_reindex_at` — когда запускали пересборку;
- `last_scope` и `last_target_id` — что пересобирали (`all`, `document`, `node`);
- `last_document_count` и `last_point_count` — сколько документов и Qdrant points обновлено;
- `last_error` — последняя ошибка, если синхронизация не завершилась.

Массовая синхронизация выполняется через `POST /admin/reindex-nodes` и не пересчитывает embeddings.

`ui_state` хранит последнее выбранное состояние локального UI:

- `current_node_id` — выбранный рабочий раздел или `NULL`;
- `include_children` — учитывать вложенные разделы;
- `updated_at` — время последнего сохранения.

Для системного раздела `Без раздела` backend сохраняет `include_children = false`, потому что это служебный scope документов без явной привязки.

## Qdrant payload indexes

При старте поиска, записи chunk-ов или пересоздании коллекции backend проверяет payload indexes Qdrant. Индексируются поля, которые используются в фильтрах retrieval:

- `document_id`;
- `node_ids`;
- `node_scope_ids`;
- `primary_node_id`;
- `node_paths`;
- `categories`;
- `resource_type`;
- `asset_class`;
- `engineering_topics`;
- `signal_tags`;
- `payload_version`.

`GET /admin/qdrant-status` показывает фактически найденные `payloadIndexedFields`, чтобы состояние можно было проверить без прямого доступа к Qdrant.

## PDF page assets

`document_assets` хранит page-level записи PDF. Для страниц в `metadata_json` сохраняются:

- `assetClass` — `title`, `contents`, `changelog`, `legal`, `signals`, `table`, `scheme`, `screen`, `text`, `empty`;
- `confidence` — базовая/средняя/высокая уверенность эвристического классификатора;
- `engineeringTopics` — найденные инженерные темы;
- `signalTags` — найденные точные теги/сигналы;
- `classifierVersion` — текущая версия классификатора, сейчас `v3`;
- `scores` — диагностические баллы классификации;
- `previewAvailable` — есть ли PNG preview;
- `ocrStatus`, `ocrLang`, `ocrError` — состояние локального OCR, если он запускался.

Точечный rebuild `POST /documents/:id/rebuild-visual-assets` обновляет или создаёт эти строки без повторного импорта документа целиком и затем обновляет соответствующие Qdrant points.

## Таблицы UI v2

В рамках UI v2 (см. `docs/UI_V2.md`) добавляются неразрушающие таблицы для истории
чатов:

`chat_sessions`:

- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` — идентификатор сессии;
- `title TEXT NOT NULL DEFAULT 'Новый чат'` — заголовок чата; первое сообщение
  пользователя автоматически становится заголовком (до 60 символов);
- `mode TEXT NOT NULL DEFAULT 'answer'` — режим сессии: `answer` (ответ ИИ) или
  `pages` (только страницы документов); без `CHECK`, чтобы можно было добавить
  новый режим без миграции;
- `filters JSONB NOT NULL DEFAULT '{}'::jsonb` — выбранные фильтры в формате
  `{ "nodeIds": [...], "documentIds": [...] }`;
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` — обновляется при добавлении
  сообщения или изменении настроек сессии.

Индекс: `idx_chat_sessions_updated_at` по `updated_at DESC` — для быстрой
выдачи списка истории.

`chat_messages`:

- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`;
- `session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE` —
  удаление сессии каскадно удаляет её сообщения;
- `role TEXT NOT NULL CHECK (role IN ('user', 'assistant'))`;
- `content TEXT NOT NULL` — текст сообщения;
- `sources JSONB NOT NULL DEFAULT '[]'::jsonb` — массив компактных описаний
  источников: `{ documentId, documentName, sourcePath, resourceType, page,
  chunkIndex, snippet, score, assetClass, assetUrl, assetPreviewUrl, nodePaths,
  signalTags }`;
- `metadata JSONB NOT NULL DEFAULT '{}'::jsonb` — служебная информация:
  `mode` (`llm`, `fallback-empty`, `pages`, `error`), `durationMs`,
  `searchMode` (`answer`/`pages`), `filters` (снимок применённых фильтров на
  момент ответа);
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`.

Индекс: `idx_chat_messages_session_created` по `(session_id, created_at)` — для
быстрой выдачи всех сообщений сессии в хронологическом порядке.

Таблицы создаются идемпотентно в `PostgresProvider.ensureChatSessionSchema()`,
которая вызывается из `ensureRuntimeSchema()` при старте `kb-api`. Расширение
`pgcrypto` уже включается выше для основного DDL, поэтому отдельно его создавать
не требуется.
