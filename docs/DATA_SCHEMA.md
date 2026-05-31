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
- `cloudProviders` → `{ providers: [...], defaultProviderId }`. Массив
  облачных провайдеров (полировка #4). См. `docs/CLOUD_PROVIDER.md`.
- `theme` → `{ defaultTheme: 'dark' | 'light' | 'system' }`. Применяется как
  серверный дефолт для пользователей без `localStorage.localrag.theme`.
- `indexing` → `{ concurrency: 1..4 }`. Параллелизм пайплайна индексации.
  Раздел ниже.
- `generation` → `{ maxTokens: 256..8192 }`. Максимальная длина ответа
  облачных моделей (default 4096). Раздел ниже.
- `ocr` → `{ autoOcrEmptyPages, ocrAll }`. Настройки OCR.
- `retrieval` → переопределения параметров retrieval (semantic/bm25/fusion/
  reranking) поверх `config/retrieval.yaml`.
- `systemPrompt` → `{ template }` или `null`. Кастомный системный промпт.
- `migrations` → `{ [name]: true }`. Флаги выполненных миграций.

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

## app_settings.generation

Ключ `generation` в `app_settings`:

```json
{ "maxTokens": 4096 }
```

- `maxTokens` — целое в диапазоне 256..8192 (default 4096). Максимальное
  число токенов, которые облачная модель тратит на ответ (включая
  reasoning-токены у моделей с thinking-режимом).
- Меняется через `PATCH /api/v2/settings/generation` или UI «Длина ответа
  модели» в Настройки → Модели и облако.
- Применяется в `chatSessionService` через `resolveCloudMaxTokens()` →
  передаётся в `cloudChatProvider.generate` и `generateStream`.
- На локальную Ollama-генерацию не влияет. См. `docs/CLOUD_PROVIDER.md`,
  раздел «Максимальная длина ответа».

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
  — документ-источник. FK SET NULL — страховка для не-import узлов:
  при `DELETE /documents/:id` импортные узлы (`author LIKE
  'import:%'`) удаляются явным `DELETE` в транзакции
  (`PostgresProvider.deleteImportedGraphNodesByDocumentIds`), а
  ручные узлы (`user:manual`) сохраняются и теряют только ссылку
  на исходный документ. Подробности — `docs/GRAPH_SCHEMA.md`,
  раздел «Удаление узлов при удалении документа»;
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

## Таблица graph_node_types (#8.1.e)

Справочник типов узлов графа. Создаётся идемпотентно в
`PostgresProvider.ensureGraphSchema()` вместе с `graph_nodes` и
`graph_edges`. Полная картина — `docs/GRAPH_NODE_TYPES.md`.

`graph_node_types`:

- `code VARCHAR(64) PRIMARY KEY` — техническое имя типа,
  snake_case латиницей (паттерн `^[a-z][a-z0-9_]*$`).
  Совпадает с `graph_nodes.type` (без FK для гибкости);
- `label_ru VARCHAR(128) NOT NULL` — русское название
  («Шкаф», «ПЛК», …) для UI и подсказок;
- `description TEXT` — описание для подсказки `?` в wizard'е
  профилей парсера;
- `icon VARCHAR(16)` — один emoji-символ для визуального
  отличия в списках;
- `sort_order INTEGER NOT NULL DEFAULT 100` — порядок
  сортировки в списках и в чекбоксах builds;
- `is_builtin BOOLEAN NOT NULL DEFAULT FALSE` — встроенный тип,
  загружается bootstrap'ом при старте `kb-api`. `code`
  неизменяем, удалить нельзя. 7 встроенных кодов: `object`,
  `cabinet`, `station`, `card`, `channel`, `signal`, `device`;
- `is_archived BOOLEAN NOT NULL DEFAULT FALSE` — мягкое
  скрытие из wizard'а;
- `created_at`, `updated_at TIMESTAMPTZ` — `updated_at`
  обновляется триггером `trg_graph_node_types_set_updated_at`.

Индекс: `idx_graph_node_types_archived` (по `is_archived`).

Bootstrap: `graphNodeTypeService.ensureBuiltinTypes()` при
старте `kb-api` делает `INSERT ... ON CONFLICT (code) DO
UPDATE SET is_builtin = TRUE` — обновляется только флаг, чтобы
не перетирать пользовательские правки `label_ru`/`description`/
`icon`/`sort_order`.

CRUD через REST API `/api/v2/graph/node-types`:

- `GET /api/v2/graph/node-types` — список с
  `usage_count` (LEFT JOIN на `graph_nodes` по `type`,
  только `is_archived = FALSE`).
- `GET /api/v2/graph/node-types/:code` — один тип.
- `POST /api/v2/graph/node-types` — создание кастомного
  (`is_builtin: false`). 409 если код существует.
- `PUT /api/v2/graph/node-types/:code` — обновление. `code`
  неизменяем. Системные нельзя переименовать (403).
- `DELETE /api/v2/graph/node-types/:code` — только кастомные.
  403 для встроенных, 409 если `usage_count > 0`.

Подробности — `docs/GRAPH_NODE_TYPES.md`.

## Таблица graph_extraction_candidates (Память инженера — Этап 3)

Очередь кандидатов LLM-извлечения случаев из документов. Создаётся в
`PostgresProvider.ensureGraphSchema()` (идемпотентный DDL —
`CREATE TABLE IF NOT EXISTS` + индексы). Извлечённые случаи пишутся сюда
со `status='pending'` и НЕ попадают в `graph_nodes`/`graph_edges`, пока
пользователь не подтвердит их на экране ревью — граф остаётся стерильным.

`graph_extraction_candidates`:

- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`;
- `source_document_id UUID REFERENCES documents(id) ON DELETE CASCADE` —
  документ-источник (при удалении документа кандидаты уходят каскадом);
- `extraction_job_id UUID NOT NULL` — группировка одного запуска
  извлечения (один клик «Извлечь знания»);
- `case_payload JSONB NOT NULL DEFAULT '{}'::jsonb` — весь случай
  (вложенный контракт `equipment`/`fault`/`solution`/`object`/
  `source_quote`/`confidence`);
- `confidence REAL` (nullable) — уверенность (дублируется отдельной
  колонкой для сортировки/фильтров);
- `status TEXT NOT NULL DEFAULT 'pending'` — `pending` / `approved` /
  `rejected`;
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
- `reviewed_at TIMESTAMPTZ` (nullable) — момент подтверждения/отклонения.

Индексы: `idx_graph_extraction_candidates_document` (по
`source_document_id`), `idx_graph_extraction_candidates_status` (по
`status`), `idx_graph_extraction_candidates_job` (по `extraction_job_id`).

Существующие таблицы не трогаются. Расширение `recordCaseTx` опциональными
`author`/`confidence` — это код, не DDL (колонки `author`/`confidence` уже
есть в `graph_nodes`/`graph_edges`). Подробно —
`docs/KNOWLEDGE_EXTRACTION.md`.

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

## Колонки контекстного обогащения (document_chunks) — Слой 2

Неразрушающий идемпотентный DDL в `ensureRuntimeSchema`:

```sql
ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS chunk_context TEXT;
ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS chunk_tags JSONB;
ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS chunk_summary TEXT;
```

| Колонка | Тип | Назначение |
|---|---|---|
| `chunk_context` | TEXT | LLM-контекст «где фрагмент и о чём». Идёт в индекс через `text_with_context`. |
| `chunk_tags` | JSONB | Массив тегов (≤10, каждый с `#`). Только метаданные — в поиск НЕ идут. |
| `chunk_summary` | TEXT | Краткое описание фрагмента (≤300 симв.). Только метаданные. |

Заполняются при импорте/переимпорте текстовых документов, если включено
контекстное обогащение (Слой 2). Существующие чанки и чанки без обогащения
имеют здесь `NULL` и сосуществуют с обогащёнными — переэмбеддинг не нужен.
Текст чанка (`text`) хранится дословно и обогащением не меняется. PDF-чанки не
затрагиваются. Подробности — [CONTEXTUAL_ENRICHMENT.md](CONTEXTUAL_ENRICHMENT.md).

## История изменений

- 2026-05-31: Память инженера — Этап 3. Новая таблица
  `graph_extraction_candidates` (очередь кандидатов LLM-извлечения,
  идемпотентный DDL + индексы по `source_document_id`/`status`/
  `extraction_job_id`). Настройки `app_settings.knowledge_extraction`
  (редактируемый промпт). Существующие таблицы не менялись; расширение
  `recordCaseTx`/`recordCase` опциональными `author`/`confidence` — это
  код, не DDL. Подробности — `docs/KNOWLEDGE_EXTRACTION.md`.
- 2026-05-30: Слой 2 — контекстное обогащение чанков. Новые колонки
  `document_chunks.chunk_context`, `chunk_tags`, `chunk_summary`
  (идемпотентный `ADD COLUMN IF NOT EXISTS`). Настройки/промпты в
  `app_settings.contextual_enrichment`, редактируются в UI. Подробности —
  `docs/CONTEXTUAL_ENRICHMENT.md`.

- 2026-05-21: #8.2.followup-1 — `DELETE /documents/:id` удаляет
  импортные узлы графа документа (`graph_nodes.source_document_id =
  <doc> AND author LIKE 'import:%'`) в одной транзакции до
  удаления документа. Структура БД не меняется: FK
  `graph_nodes.source_document_id` остаётся `ON DELETE SET NULL`
  как страховка для ручных узлов (`user:manual`), которые
  сохраняются и теряют только ссылку на исходный документ.
  Подробности — `docs/GRAPH_SCHEMA.md`.
- 2026-05-18: #8.1.e — новая таблица `graph_node_types` для
  справочника типов узлов графа (CRUD через UI/API,
  bootstrap встроенных типов, `usage_count` через LEFT JOIN на
  `graph_nodes`). `graph_nodes.type` оставлен TEXT без FK для
  гибкости парсера. Подробности — `docs/GRAPH_NODE_TYPES.md`.
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
