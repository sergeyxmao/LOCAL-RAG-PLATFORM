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
- graph_nodes
- graph_edges

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

## Документ и page_count (API)

Таблица `documents` (см. `infra/postgres/init/001_init.sql`) не
хранит поле `page_count` физически — оно вычисляется в API при
выдаче списка документов:

```sql
COUNT(*) FROM document_assets WHERE document_id = d.id AS page_count
```

Из этого следуют важные правила:

- `page_count = 0` означает либо однопстраничный документ типа
  `.txt`/`.md`/`.csv`, либо PDF, **загруженный в лёгком режиме**
  (`createVisualAssets=false`). Это **by design**, не баг.
- Физическое количество страниц PDF при этом не теряется — оно
  доступно через парсинг исходного файла из `data/raw`, но
  отдельно в БД не сохраняется.
- Колонка «Страниц» в UI «База знаний → Документы» берётся
  напрямую из `page_count` API и поэтому показывает `0` для
  документов, загруженных лёгким режимом.
- Чтобы «достроить» страницы постфактум, см.
  `POST /documents/:id/rebuild-visual-assets` и `reindex` в
  `docs/INGESTION_PIPELINE.md`.

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

## Таблица app_settings (итерация 3)

Bag-O-Settings для произвольных настроек проекта. Идемпотентно создаётся в
`PostgresProvider.ensureAppSettingsSchema()` вместе с колонкой
`chat_sessions.provider`.

`app_settings`:

- `key TEXT PRIMARY KEY` — имя настройки;
- `value JSONB NOT NULL DEFAULT '{}'::jsonb` — структурированное значение;
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`.

Используемые сейчас ключи:

- `cloudProvider` → `{ name, baseUrl, apiKey, model, useByDefault }`. См.
  `docs/CLOUD_PROVIDER.md`. **Важно:** `apiKey` хранится в plaintext. В API
  наружу всегда возвращается маска (`sk-•••••a3f9`).
- `theme` → `{ defaultTheme: 'dark' | 'light' | 'system' }`. Применяется как
  серверный дефолт для пользователей без `localStorage.localrag.theme`.

Колонка `chat_sessions.provider`:

- Тип `TEXT NOT NULL DEFAULT 'local'`.
- Значения: `'local'` (генерация через `OllamaChatProvider`) или `'cloud'`
  (генерация через `CloudChatProvider` с настройками из
  `app_settings.cloudProvider`).
- CHECK не ставится — чтобы можно было добавить новый провайдер без миграции.
- Существующие до итерации 3 сессии автоматически получают `'local'` благодаря
  DEFAULT.

Дополнительные поля `chat_messages.metadata` (JSONB, без миграции):

- `provider`: `'local'` / `'cloud'` — снимок провайдера на момент ответа.
- `providerName`: имя провайдера (только для облака).
- `model`: имя модели, которая отвечала.
- `tokensIn`, `tokensOut`: количество входных/выходных токенов (только облако).
- `durationMs`: число (для облака — время до получения ответа; для локалки —
  суммарное время через `answerService`).
- `error`: `{ code, message }` при ошибке провайдера. Коды описаны в
  `docs/CLOUD_PROVIDER.md`.

## Таблица ingestion_jobs — phase (hotfix #11)

Колонка `ingestion_jobs.phase TEXT` добавлена через
`ALTER TABLE ... ADD COLUMN IF NOT EXISTS` (бэкфилл прописан в
`ensureRuntimeSchema`). Значения:

| `phase`               | `status`               | Описание |
|-----------------------|------------------------|----------|
| `awaiting_upload`     | `queued`               | Pre-registered (POST /jobs/queue), файла ещё нет. `document_id IS NULL`, `pending_filename` и `pending_options` заполнены. |
| `awaiting_processing` | `queued`               | Файл загружен (PUT /jobs/:id/upload), ждёт свободного слота indexing-semaphore. `document_id` может быть NULL (если ещё не создан) или уже привязан. |
| `processing`          | `running` / `cancel_requested` | Semaphore acquired, pipeline бежит. `started_at` заполнен. |
| `done`                | `completed` / `failed` / `cancelled` | Терминальное. `finished_at` заполнен. |

Phase — единый источник правды для UI. `status` остаётся для
обратной совместимости и аналитики. Переходы синхронизируются
автоматически в:

- `createJob` — принимает `phase` параметром;
- `attachDocumentToJob` — `awaiting_upload → awaiting_processing`;
- `updateJobStartedAt` — `queued → processing`;
- `updateJobStatus` — `running → processing`,
  `{completed,failed,cancelled} → done`;
- `failStaleRunningJobs` — при cleanup на старте сервиса
  `running → done` (вместе с status=failed).

## app_settings.indexing (hotfix #11)

Ключ `indexing` в `app_settings`:

```json
{ "concurrency": 1 }
```

- `concurrency` — целое в диапазоне 1..4 (default 1). Управляет
  серверным `Semaphore` индексации.
- Меняется через `PATCH /api/v2/settings/indexing` или UI «Параллелизм
  индексации» в Настройки → Сервисы. `setMax(n)` применяется мгновенно.
- При старте `kb-api` значение читается и передаётся в конструктор
  `IngestionService`.

## Таблицы графа знаний АСУ ТП (#8.1.a)

Граф знаний — параллельный RAG-слой со структурированными данными
об оборудовании. Полная картина — `docs/GRAPH_SCHEMA.md`.
Идемпотентно создаётся в `PostgresProvider.ensureGraphSchema()`
при каждом старте `kb-api`.

`graph_nodes`:

- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`;
- `type TEXT NOT NULL` — тип узла (`system`/`cabinet`/`card`/
  `signal`/...). Свободная строка, не enum;
- `name TEXT NOT NULL` — человекочитаемое имя;
- `description TEXT` — опциональное описание;
- `attributes JSONB NOT NULL DEFAULT '{}'::jsonb` — type-specific
  поля. Для `card`: `{card_type, address, station, fbc, ibc,
  card_slot}`. Для `signal`: `{signal_kind, channel, loop_tag,
  device_tag}`. Для `cabinet`: `{cabinet_id, vendor}`;
- `source_document_id UUID REFERENCES documents(id) ON DELETE SET NULL`
  — документ-источник;
- `source_page_number INTEGER`, `source_xlsx_sheet TEXT`,
  `source_xlsx_row INTEGER` — для трассировки до места в исходных
  данных;
- `confidence REAL NOT NULL DEFAULT 1.0 CHECK (confidence BETWEEN 0 AND 1)`
  — уверенность в данных. `1.0` — точные (XLSX/ручной ввод),
  `0.5..0.9` — LLM-извлечение, `0.0` — отвергнуто пользователем;
- `author TEXT NOT NULL DEFAULT 'user:manual'` — кто создал:
  `import:xlsx:<profile_id>`, `agent:llm-extraction`,
  `user:manual`, `system:reconciler`;
- `is_archived BOOLEAN NOT NULL DEFAULT FALSE` — soft-delete:
  `DELETE /api/v2/graph/nodes/:id` только архивирует, физическое
  удаление — через psql вручную;
- `created_at`, `updated_at TIMESTAMPTZ` — `updated_at`
  обновляется триггером `trg_graph_nodes_set_updated_at`.

Индексы: `idx_graph_nodes_type` (partial по `is_archived=FALSE`),
`idx_graph_nodes_source_document` (partial по `IS NOT NULL`),
`idx_graph_nodes_author`, `idx_graph_nodes_name`,
`idx_graph_nodes_attributes` (GIN по JSONB).

`graph_edges`:

- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`;
- `source_node_id UUID NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE`;
- `target_node_id UUID NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE`;
- `relation TEXT NOT NULL` — тип связи (`part_of`/`installed_in`/
  `connected_to`/`addressed_at`/`described_in`/`supplies`/
  `regulates`). Свободная строка;
- `attributes JSONB NOT NULL DEFAULT '{}'::jsonb` — свойства самой
  связи (например, `{channel_number: 4}` для `connected_to`);
- `confidence REAL NOT NULL DEFAULT 1.0 CHECK (...)`;
- `author TEXT NOT NULL DEFAULT 'user:manual'`;
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
- `UNIQUE (source_node_id, target_node_id, relation)` — защита от
  дублей. `POST /api/v2/graph/edges` использует `ON CONFLICT DO
  NOTHING`, повторное создание того же триплета идемпотентно.

Индексы: `idx_graph_edges_source`, `idx_graph_edges_target`,
`idx_graph_edges_relation`.

Цепочка REST API — в `docs/GRAPH_SCHEMA.md`. Точка входа
сервиса — `apps/kb-api/src/services/graphService.js`, роуты —
`apps/kb-api/src/routes/graph.js`.

## Колонка ingestion_jobs.graph_report (#8.1.b)

Идемпотентно добавляется через
`ALTER TABLE ingestion_jobs ADD COLUMN IF NOT EXISTS graph_report JSONB`
в `ensureRuntimeSchema`. NULL — парсер графа не запускался для
этой задачи (например, файл не XLSX). Не-NULL — отчёт парсера:

```json
{
  "ok": true,
  "profile_id": "metso_dna_rio",
  "summary": {
    "cabinet": { "created": 1, "updated": 0 },
    "station": { "created": 1, "updated": 0 },
    "card": { "created": 27, "updated": 0 },
    ...
  },
  "edges_created": 458,
  "warnings": [...],
  "started_at": "...",
  "finished_at": "..."
}
```

Подробности — `docs/GRAPH_INGESTION.md`.

## История изменений

- 2026-05-17: #8.1.b — парсер XLSX наполняет граф знаний
  параллельно с RAG-pipeline. Новая колонка
  `ingestion_jobs.graph_report JSONB`. Подробности —
  `docs/GRAPH_INGESTION.md`.
- 2026-05-17: #8.1.a — фундамент графа знаний АСУ ТП. Новые
  таблицы `graph_nodes`, `graph_edges` (идемпотентный DDL в
  `ensureGraphSchema`). Подробности — `docs/GRAPH_SCHEMA.md`.
- 2026-05-17: hotfix #12 — DELETE-устойчивость к недоступности
  Qdrant, корректная двух-метричная диагностика sync,
  документация лёгкого режима (`createVisualAssets=false`) и
  правил вычисления `page_count` в API.
