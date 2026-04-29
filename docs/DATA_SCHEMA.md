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
