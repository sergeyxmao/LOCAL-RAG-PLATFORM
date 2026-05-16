# API Spec

Текущие маршруты:
- GET /health
- GET /settings
- GET /tags
- GET /documents
- GET /documents/duplicates
- GET /documents/:id/chunks
- GET /documents/:id/assets
- GET /documents/:id/assets/:fileName
- GET /documents/:id/pages/:pageNumber/preview
- GET /documents/:id/nodes
- GET /jobs
- GET /search
- GET /search/pages
- GET /search/visual
- GET /nodes
- GET /nodes/counts
- GET /nodes/export
- GET /nodes/:id
- GET /nodes/:id/ancestors
- GET /nodes/:id/descendants
- GET /nodes/:id/delete-info
- GET /nodes/:id/documents
- GET /admin/knowledge-nodes-status
- GET /admin/sync-status
- GET /admin/qdrant-status
- GET /ui/consult
- GET /ui/ingest
- GET /ui/nodes
- GET /ui/jobs
- GET /ui/pages-search
- GET /ui/state
- GET /ui/v2
- GET /ui/v2/chat
- GET /ui/v2/knowledge
- GET /ui/v2/settings
- GET /api/v2/chat/sessions
- GET /api/v2/chat/sessions/:id
- POST /api/v2/chat/sessions
- PATCH /api/v2/chat/sessions/:id
- DELETE /api/v2/chat/sessions/:id
- POST /api/v2/chat/sessions/:id/messages
- POST /documents/deduplicate
- POST /documents/upload
- POST /documents/ingest-file
- POST /documents/ingest-file-async
- POST /documents/ingest-folder
- POST /documents/ingest-folder-async
- POST /documents/ingest-text
- POST /documents/:id/reclassify-assets
- POST /documents/:id/rebuild-visual-assets
- POST /documents/:id/nodes
- POST /documents/:id/reindex-payload
- POST /documents/bulk-link
- POST /documents/bulk-unlink
- POST /nodes
- POST /nodes/import
- POST /nodes/:id/move
- POST /admin/reindex-nodes
- POST /admin/rebuild-qdrant
- POST /admin/reset-content
- POST /ui/state
- POST /jobs/:id/cancel
- POST /jobs/:id/retry
- POST /ask
- POST /ask/pages
- POST /search
- POST /search/pages
- POST /search/visual
- PATCH /documents/:id/nodes
- PATCH /nodes/:id
- DELETE /documents/:id/nodes/:nodeId
- DELETE /nodes/:id

Первый рабочий ingestion-срез:
- upload flow в `data/raw`
- batch ingest папки через `POST /documents/ingest-folder`
- фоновый ingest одного файла через `POST /documents/ingest-file-async`
- фоновый ingest папки через `POST /documents/ingest-folder-async`
- повторный ingest того же файла теперь по умолчанию пропускается как уже проиндексированный; для принудительной пере-загрузки можно передать `force: true`
- поддержка `.txt`, `.md`, `.pdf`, `.docx`, `.csv`, `.xlsx`, `.xls`
- parsed text сохраняется в `data/parsed`
- PDF дополнительно создаёт page-preview PNG assets в `data/assets`
- PDF page assets также регистрируются как `document_assets` в PostgreSQL
- для PDF-страниц сохраняются:
  - `assetClass`
  - `confidence`
  - `engineeringTopics`
  - `signalTags`

Поведение retrieval/answer:
- `POST /search` использует hybrid retrieval: semantic + lexical + heuristic reranking
- если semantic search/Qdrant временно недоступен, `/search` не падает целиком, а возвращает доступные lexical-результаты и кладёт причину в `debug.semantic_error`
- `POST /search` принимает `scope: "all" | "chunks" | "assets"`
- `POST /search` принимает `documentId`, чтобы ограничить поиск одним документом
- `POST /search` принимает `nodeId` и `includeChildren`, чтобы ограничить semantic + lexical search выбранным разделом
- `POST /search` принимает `selectedTags: string[]`, чтобы ограничить semantic + lexical search документами с выбранными `documents.categories`
- `POST /search` принимает `engineeringTopic`, чтобы фильтровать asset-результаты по инженерной теме
- `POST /search` принимает `signalTag`, чтобы фильтровать asset-результаты по точному тегу или сигналу, например `LIT-101`
- Lexical branch hybrid search применяет эти фильтры ещё в SQL-запросе, а не после выборки кандидатов, поэтому fallback без Qdrant сохраняет тот же scope.
- Lexical results возвращают `node_ids`, `node_scope_ids`, `primary_node_id`, `node_paths` и `payload_version`; документы без явной привязки отображаются как `Без раздела`.
- `POST /search/pages` — page-only обёртка над `scope: "assets"`
- `POST /search/visual` — page-only поиск по визуальным PDF-страницам; если `assetClass=all`, оставляет классы `scheme`, `screen`, `table`, `signals`
- `GET /search?query=...&nodeId=...&includeChildren=true&selectedTags=metso,dna` — read-only JSON-вариант для быстрой браузерной проверки scoped search
- `GET /search/pages?query=...&nodeId=...&includeChildren=true` — read-only JSON-вариант для scoped поиска по PDF-страницам
- `GET /search/visual?query=...&nodeId=...&includeChildren=true` — read-only JSON-вариант визуального поиска по PDF-страницам
- `POST /search/pages` принимает `assetClass`:
  - `title`
  - `contents`
  - `changelog`
  - `legal`
  - `signals`
  - `table`
  - `scheme`
  - `screen`
  - `text`
- `POST /search/pages` также принимает `engineeringTopic`, например:
  - `PCS`
  - `PCR`
  - `I/O`
  - `Резервирование`
- `POST /search/pages` также принимает `signalTag`, чтобы искать страницы по конкретному тегу или сигналу
- `POST /ask` сначала пытается собрать ответ через локальную LLM по найденным источникам
- `POST /ask` принимает `scope: "all" | "chunks" | "assets"`
- `POST /ask` принимает `documentId`, чтобы ограничить ответ одним документом
- `POST /ask` принимает `nodeId` и `includeChildren`; ответ строится только по источникам выбранного раздела
- `POST /ask` принимает `selectedTags: string[]`; ответ строится только по найденным источникам документов с этими тегами
- `POST /ask` принимает `engineeringTopic` для фильтрации asset-источников по инженерной теме
- `POST /ask` принимает `signalTag` для фильтрации asset-источников по точному тегу или сигналу
- `POST /ask/pages` строит ответ только по page-level asset results
- `POST /ask/pages` принимает `nodeId` и `includeChildren`
- `POST /ask/pages` принимает `assetClass` для фильтрации по типу страниц
- `POST /ask/pages` принимает `engineeringTopic` для фильтрации по инженерной теме
- `POST /ask/pages` принимает `signalTag` для фильтрации по точному тегу или сигналу
- если локальная LLM не укладывается по времени на слабом ноутбуке, `POST /ask` возвращает grounded fallback с `mode: fallback-source-snippet`
- если после retrieval нет релевантных источников, `POST /ask` возвращает честный ответ без галлюцинации с `mode: fallback-empty`
- `GET /tags?nodeId=...&includeChildren=true` отдаёт список `#тегов` документов в текущем scope с количеством документов по каждому тегу; без `nodeId` считает по всей базе

Поведение visual assets:
- `POST /documents/ingest-file` для PDF создаёт page previews и page-level metadata
- `GET /documents/:id/assets` отдаёт page records со сводками:
  - `byType`
  - `byTopic`
  - `bySignalTag`
  - `items`
- `GET /documents/:id/assets/browse` принимает:
  - `assetClass`
  - `engineeringTopic`
  - `signalTag`
- `GET /documents/:id/pages/:pageNumber/preview` лениво создаёт и возвращает PNG preview для любой индексированной PDF-страницы
- `POST /documents/:id/rebuild-visual-assets` точечно создаёт или обновляет page assets для выбранных PDF-страниц:
  - `pages`: строка `1-5, 12`, массив номеров страниц или `all`;
  - `maxPages`: защитный лимит, по умолчанию 20;
  - `createPreview`: создавать PNG preview;
  - `ocrMode`: `off`, `try`, `require`.
- OCR работает только локально через команду `tesseract`, если она доступна в контейнере; внешние OCR/API не используются.
- `GET /ui/pages-search` даёт лёгкий браузерный UI для page-only поиска, ответа и browse-режима
- `/ui/pages-search` также даёт кнопки `Визуальный поиск` и `Создать preview/OCR` для точечной работы с важными PDF
- `/ui/pages-search?nodeId=...&includeChildren=true` восстанавливает выбранный рабочий раздел из URL, ограничивает список документов и передаёт раздел в `/search/pages` и `/ask/pages`
- `GET /ui/consult` даёт основной браузерный UI для вопросов по базе, выбору рабочего раздела, документа и фильтрам по scope/теме/сигналу
- `/ui/consult?nodeId=...&includeChildren=true` восстанавливает выбранный рабочий раздел из URL и передаёт его в `/search` и `/ask`
- `GET /ui/ingest` даёт лёгкий браузерный UI для загрузки одного файла или целой папки из `data/raw`
- `/ui/ingest?nodeId=...&includeChildren=true` восстанавливает рабочий раздел из URL, показывает множественный выбор разделов для загрузки, передаёт `nodeIds/primaryNodeId` в upload/ingest-запросы и показывает очередь/историю задач выбранного раздела
- `GET /ui/nodes` даёт браузерный UI для дерева разделов: просмотр счётчиков, создание пользовательского раздела, редактирование, перемещение, просмотр документов выбранного раздела, массовую привязку документов через `/documents/bulk-link`, экспорт/импорт дерева и ручная синхронизация payload выбранного раздела
- `/ui/nodes` показывает live-блок `Готовность разделов базы`, построенный на `GET /admin/knowledge-nodes-status`
- Таблица документов в `/ui/nodes` показывает прямые `nodeLinks` документа и бейдж основного раздела
- В таблице документов `/ui/nodes` можно выбрать документы и убрать их из текущего пользовательского раздела через `POST /documents/bulk-unlink`; для системного `Без раздела` отвязка через UI отключена
- `/ui/nodes?nodeId=...` восстанавливает выбранный раздел из URL; удаление через UI доступно только для пустого пользовательского раздела после проверки счётчиков и ввода точного названия
- `GET /documents/duplicates` показывает активные группы дублей среди уже индексированных документов
- `GET /documents?nodeId=...&includeChildren=true&limit=100` отдаёт документы выбранного раздела; без `nodeId` работает как общий список
- В элементах `/documents` возвращается `node_links`: прямые привязки документа к разделам с `node_id`, `name`, `type_label`, `color`, `is_primary`, `is_system`
- `POST /documents/deduplicate` удаляет старые индексированные дубли из PostgreSQL и Qdrant, оставляя самый свежий индекс
- `GET /ui/jobs` даёт браузерный UI для просмотра статусов задач импорта
- `/ui/jobs?nodeId=...&includeChildren=true` восстанавливает выбранный рабочий раздел из URL и загружает задачи через scoped `/jobs`
- `GET /ui/state` отдаёт сохранённый рабочий раздел UI, `POST /ui/state` сохраняет `currentNodeId` и `includeChildren`; `/ui/consult`, `/ui/pages-search`, `/ui/ingest` и `/ui/jobs` используют это состояние, если страница открыта без `nodeId` в URL. Для системного раздела `Без раздела` backend принудительно хранит `includeChildren=false`
- `GET /jobs?nodeId=...&includeChildren=true&limit=20` отдаёт задачи импорта выбранного раздела; для `Без раздела` также показывает старые задачи без явной привязки
- `POST /jobs/:id/cancel` останавливает активную задачу и очищает её частичные чанки/векторы
- `POST /jobs/:id/retry` очищает неполный индекс файла и запускает задачу заново
- `POST /documents/:id/reclassify-assets` пере-считает типы и инженерные темы уже загруженного PDF без повторной загрузки
- `POST /documents/ingest-folder` принимает:
  - `relativeDir`
  - `categories`
  - `nodeIds`
  - `primaryNodeId`
  - `recursive`
  - `force`
  и индексирует все поддерживаемые файлы из папки внутри `data/raw` последовательно, с отчётом по каждому файлу
- `POST /documents/upload`, `POST /documents/ingest-file`, `POST /documents/ingest-file-async`, `POST /documents/ingest-folder`, `POST /documents/ingest-folder-async`, `POST /documents/ingest-text` принимают `nodeIds: string[]` и `primaryNodeId?: string`
- если `nodeIds` не передан, новый документ явно привязывается к системному разделу `Без раздела`
- результаты ingest-файла и ingest-папки теперь могут содержать:
  - `skipped: true`
  - `skipReason: "already-indexed"`
- если уже индексированный файл повторно импортируется с `nodeIds`, документ не дублируется, но его привязка к разделам и Qdrant payload обновляются
- `POST /documents/ingest-file-async` и `POST /documents/ingest-folder-async` сразу возвращают `202 Accepted` и запускают импорт в фоне; статус дальше отслеживается через `/jobs` или `/ui/jobs`
- PDF-страницы эвристически классифицируются в типы:
  - `title`
  - `contents`
  - `changelog`
  - `legal`
  - `signals`
  - `table`
  - `scheme`
  - `screen`
  - `text`
- для страниц также сохраняются инженерные признаки:
  - `engineeringTopics`
  - `signalTags`
  - `confidence`

Разделы базы знаний:
- `GET /nodes?format=tree|flat` отдаёт пользовательское дерево разделов.
- При старте создаётся системный раздел `Без раздела`; он показывает документы без явной привязки.
- `GET /nodes/counts` отдаёт счётчики документов и PDF-страниц по разделам.
- `POST /nodes` создаёт раздел: `parentId`, `name`, `typeLabel`, `color`, `sortOrder`, `description`.
- `POST /nodes/import?dryRun=true|false` принимает JSON экспорта с `items` и безопасно создаёт только отсутствующие пользовательские разделы; системные и неактивные узлы пропускаются, документы не меняются.
- `PATCH /nodes/:id` меняет пользовательский раздел; системный раздел менять нельзя.
- `POST /nodes/:id/move` меняет родителя и защищён от циклов.
- `DELETE /nodes/:id?strategy=block|move_to_parent|move_to_unsorted|cascade_documents` удаляет пустой пользовательский раздел, перепривязывает его документы или, только при двойном подтверждении, удаляет раздел вместе с документами.
- `PATCH /nodes/:id`, `POST /nodes/:id/move` и `DELETE /nodes/:id` возвращают поле `sync`; API автоматически пересчитывает Qdrant payload документов выбранного раздела и его вложенных разделов после rename/move/delete.
- Для `strategy=cascade_documents` обязательно передать `confirm=DELETE_DOCUMENTS_AND_NODE` и точное `confirmName` названия раздела; использовать только для осознанной очистки.
- `GET /documents/:id/nodes` показывает привязки документа и рассчитанный payload разделов.
- `POST /documents/:id/nodes` добавляет документ в разделы.
- `PATCH /documents/:id/nodes` заменяет полный набор разделов документа.
- `DELETE /documents/:id/nodes/:nodeId` отвязывает документ от раздела; если разделов не осталось, документ возвращается в `Без раздела`.
- `POST /documents/:id/reindex-payload` пересчитывает `node_ids`, `node_scope_ids`, `node_paths`, `primary_node_id`, `payload_version` в Qdrant payload без пересоздания векторов.
- `POST /documents/bulk-link` и `POST /documents/bulk-unlink` делают массовую привязку/отвязку.
- `POST /admin/reindex-nodes` пересобирает payload разделов в Qdrant без пересчёта embeddings:
  - `scope=all` — все документы;
  - `scope=document&id=...` — один документ;
  - `scope=node&id=...&includeChildren=true` — документы раздела.
- Массовая пересборка обновляет только реально существующие Qdrant points по `document_id`; старые строки Postgres без points не прерывают весь проход и отражаются в `missingPoints`.
- `GET /admin/sync-status` показывает последнюю ручную синхронизацию payload разделов: время, scope, цель, число документов, число Qdrant points и последнюю ошибку.
- `POST /admin/reconcile-nodes-sample` запускает выборочную сверку payload разделов для последних indexed-документов.
- `GET /admin/knowledge-nodes-status` показывает готовность фичи разделов базы: системный `Без раздела`, closure self-links, `node_counters`, primary-ссылки документов, Qdrant status, совпадение Qdrant с indexed PostgreSQL, payload indexes, `ui_state`, ETag/cache дерева, open-local helper-контракт, фоновой reconciliation, активные задачи и последнюю ошибку синхронизации.
- `GET /admin/qdrant-status` показывает доступность Qdrant collection, общее число chunk/page records в PostgreSQL, отдельно число records только по документам `indexed` и список `payloadIndexedFields`.
- `POST /admin/rebuild-qdrant` пересобирает Qdrant points из PostgreSQL chunks/assets:
  - по умолчанию работает как dry-run;
  - по умолчанию берёт только документы `indexed`, чтобы failed/cancelled импорты не раздували восстановление;
  - `documentStatus=all` включает все статусы документов, использовать только осознанно;
  - для запуска требует `dryRun=false` и `confirm=REBUILD_QDRANT`;
  - `resetCollection=true` удаляет существующую Qdrant collection перед пересборкой, поэтому использовать только после отдельного подтверждения;
  - создаёт фоновую задачу `rebuild-qdrant`, прогресс смотреть через `/ui/jobs`.
- `POST /admin/reset-content` очищает тестовое содержимое локальной базы и требует `confirm=RESET_LOCAL_RAG_CONTENT`:
  - удаляет документы, chunks, page assets, jobs, query logs;
  - очищает Qdrant collection;
  - может удалить файлы из `data/raw`, `data/parsed`, `data/assets`;
  - сохраняет схему, настройки и системный раздел `Без раздела`;
  - по умолчанию удаляет пользовательские разделы, чтобы проект был пустым для нового тестирования.
- Semantic search фильтруется в Qdrant по `node_scope_ids` или `node_ids`.
- Lexical search фильтруется в PostgreSQL по тем же `nodeId/includeChildren`, тегам документов, document scope, page scope и инженерным фильтрам.
- `/ui/consult` загружает теги через scoped `/tags`, поэтому окно `#` показывает теги выбранного раздела, а не всей базы.

## UI v2 — API чата

Эти эндпоинты используются страницей `/ui/v2/chat`. Все ответы возвращают
`{ ok: true, ... }` или `{ ok: false, error: "..." }` с HTTP-кодом ошибки.

- `GET /api/v2/chat/sessions`
- `POST /api/v2/chat/sessions`
- `GET /api/v2/chat/sessions/:id`
- `PATCH /api/v2/chat/sessions/:id`
- `DELETE /api/v2/chat/sessions/:id`
- `POST /api/v2/chat/sessions/:id/messages`

И статические HTML-страницы UI v2:

- `GET /ui/v2` — редирект на `/ui/v2/chat`.
- `GET /ui/v2/chat` — страница «Чат» (готова в итерации 1).
- `GET /ui/v2/knowledge` — плейсхолдер «В разработке» (итерация 2).
- `GET /ui/v2/settings` — плейсхолдер «В разработке» (итерация 3).

### Примеры

Список сессий:

```bash
curl http://localhost:8787/api/v2/chat/sessions
# → { ok: true, sessions: [ { id, title, mode, filters, createdAt, updatedAt }, ... ] }
```

Создать пустую сессию:

```bash
curl -X POST http://localhost:8787/api/v2/chat/sessions \
  -H 'Content-Type: application/json' \
  -d '{"title":"Тестовый чат","mode":"answer","filters":{"nodeIds":[],"documentIds":[]}}'
# → { ok: true, session: { id, title, mode, filters, createdAt, updatedAt } }
```

Получить сессию вместе с сообщениями:

```bash
curl http://localhost:8787/api/v2/chat/sessions/<id>
# → { ok: true, session: {...}, messages: [ { id, role, content, sources, metadata, createdAt }, ... ] }
```

Обновить режим/фильтры:

```bash
curl -X PATCH http://localhost:8787/api/v2/chat/sessions/<id> \
  -H 'Content-Type: application/json' \
  -d '{"mode":"pages","filters":{"nodeIds":["<node-uuid>"],"documentIds":[]}}'
```

Отправить сообщение пользователя и получить ответ ассистента:

```bash
curl -X POST http://localhost:8787/api/v2/chat/sessions/<id>/messages \
  -H 'Content-Type: application/json' \
  -d '{"content":"Какие документы есть в базе?"}'
# → { ok: true, userMessage: {...}, assistantMessage: { content, sources, metadata } }
```

Удалить сессию (каскадом удалятся сообщения):

```bash
curl -X DELETE http://localhost:8787/api/v2/chat/sessions/<id>
# → { ok: true }
```
