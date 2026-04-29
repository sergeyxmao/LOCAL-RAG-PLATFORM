# LOCAL-RAG-PLATFORM — Разделы базы знаний (knowledge_nodes)

Полная спецификация фичи: пользовательское дерево разделов как сквозной scope для библиотеки документов, тэгов, поиска, /ask и задач импорта.

Статус реализации на 2026-04-28: закрыто на 100% по текущему ТЗ. Реализованы БД/closure/`node_counters`, scoped SQL + Qdrant search, UI `/ui/consult`, `/ui/pages-search`, `/ui/ingest`, `/ui/jobs`, `/ui/nodes`, теги в scope, ETag/cache дерева, safe delete strategies включая `cascade_documents` с двойным подтверждением, open-local helper contract, ручная и фоновая сверка payload. Регрессионный сценарий закреплён в `scripts/knowledge-nodes-smoke.mjs`.

---

## 1. Цели и контекст

### 1.1 Зачем

Сейчас все документы лежат в одной куче. Появляется второй и далее объекты (месторождения, цеха, проекты), и нужна возможность:

- работать в контексте одного выбранного раздела;
- видеть в библиотеке только его документы;
- искать только по нему (lexical и semantic);
- задавать вопросы LLM только по его источникам;
- грузить документы сразу в выбранные разделы, в том числе в несколько одновременно;
- быстро переключаться между разделами;
- иметь визуальное напоминание, в каком контексте сейчас работаешь.

### 1.2 Как сейчас устроены документы, теги и поиск

- `documents` — документ, путь, имя, checksum, статус, `categories` (тэги).
- `document_chunks` — текстовые чанки.
- `document_assets` — PDF-страницы, preview, классификация страниц.
- `ingestion_jobs` — задачи импорта.
- Тэги `#` фактически живут в `documents.categories`, при загрузке попадают в чанки и Qdrant payload.
- Qdrant payload: `document_id`, `chunk_id`/`asset_id`, текст, title, categories, source_path, page metadata.
- Semantic search идёт в Qdrant **без** filter по payload.
- Lexical search идёт SQL-запросом по `document_chunks` и `document_assets`.
- Фильтры по документам/page_type/темам/сигналам применяются в `SearchService` уже **после** получения кандидатов.

Главный вывод: scope разделов нельзя сделать только в UI. Нужны изменения в БД, SQL-поиске и Qdrant filter одновременно.

### 1.3 Почему «Разделы базы», а не жёсткие «Объекты»

Структура меняется от проекта к проекту: сегодня `Месторождение / Цех / Установка`, завтра `Проект / Электрика / Шкафы / Паспорта`. Если зашить уровни в код — сломается. Поэтому: пользовательское дерево произвольной глубины, нейтральные узлы, метки и цвета задаёт пользователь.

---

## 2. Терминология

- **Узел (node)** — элемент дерева разделов. Может быть корневым или вложенным.
- **Раздел / scope** — выбранный узел в шапке приложения, текущий рабочий контекст.
- **Прямые документы** — документы, привязанные ровно к выбранному узлу.
- **Раздел и вложенные** — выбранный узел + все его потомки.
- **Системный узел «Без раздела»** — служебный узел для документов, не привязанных явно ни к одному пользовательскому разделу. Не удаляется и не переименовывается.
- **Primary node** — основной раздел документа (для отображения «главного места»). Поиск учитывает все привязки, не только primary.
- **Тэг (#)** — тематическая метка (кросс-секционная). Это отдельное измерение от разделов: разделы говорят *где*, тэги — *о чём*.

---

## 3. Модель данных

### 3.1 knowledge_nodes — само дерево

```sql
CREATE TABLE knowledge_nodes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id   uuid REFERENCES knowledge_nodes(id) ON DELETE RESTRICT,
  name        text NOT NULL,
  type_label  text,                       -- произвольная метка типа: "Месторождение", "Цех"
  color       text,                       -- HEX или токен темы
  sort_order  int NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  is_system   boolean NOT NULL DEFAULT false,  -- для "Без раздела" и подобных
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_no_self_parent CHECK (id <> parent_id)
);

CREATE INDEX idx_nodes_parent ON knowledge_nodes(parent_id);
CREATE INDEX idx_nodes_active ON knowledge_nodes(is_active) WHERE is_active = true;
CREATE UNIQUE INDEX ux_nodes_sibling_name
  ON knowledge_nodes(parent_id, lower(name))
  WHERE is_active = true;
```

### 3.2 knowledge_node_closure — для быстрых запросов по поддереву

```sql
CREATE TABLE knowledge_node_closure (
  ancestor_id   uuid NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  descendant_id uuid NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  depth         int  NOT NULL,
  PRIMARY KEY (ancestor_id, descendant_id)
);

CREATE INDEX idx_closure_descendant ON knowledge_node_closure(descendant_id);
CREATE INDEX idx_closure_depth      ON knowledge_node_closure(depth);
```

Важно: closure включает self-reference `(node_id, node_id, 0)`. Это упрощает запросы «выбранный + потомки» до одного `WHERE ancestor_id = ?` без `UNION`.

Альтернатива: PostgreSQL `ltree`. Для shallow-tree (3–5 уровней) проще, но при rename и move нужно перегенерировать labels. Для произвольной глубины с частыми операциями — closure стабильнее.

### 3.3 document_node_links — связь документов с разделами (M:N)

```sql
CREATE TABLE document_node_links (
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  node_id     uuid NOT NULL REFERENCES knowledge_nodes(id) ON DELETE RESTRICT,
  is_primary  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (document_id, node_id)
);

CREATE INDEX idx_dnl_node     ON document_node_links(node_id);
CREATE INDEX idx_dnl_node_doc ON document_node_links(node_id, document_id);

-- Только один primary node на документ
CREATE UNIQUE INDEX ux_dnl_primary_per_doc
  ON document_node_links(document_id)
  WHERE is_primary = true;
```

Документ может быть в нескольких разделах. Поиск учитывает все привязки. `is_primary` — только для отображения «главного места» в библиотеке.

### 3.4 job_node_links — связь задач импорта с разделами

```sql
CREATE TABLE job_node_links (
  job_id     uuid NOT NULL REFERENCES ingestion_jobs(id) ON DELETE CASCADE,
  node_id    uuid NOT NULL REFERENCES knowledge_nodes(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (job_id, node_id)
);

CREATE INDEX idx_jnl_node ON job_node_links(node_id);
```

В `ingestion_jobs` дополнительно можно кэшировать `target_node_ids jsonb` для быстрого UI, но источник истины — `job_node_links`.

### 3.5 node_counters — кэш счетчиков (опционально, рекомендуется)

```sql
CREATE TABLE node_counters (
  node_id           uuid PRIMARY KEY REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  direct_documents  int  NOT NULL DEFAULT 0,
  scope_documents   int  NOT NULL DEFAULT 0,   -- включая потомков
  scope_pages       int  NOT NULL DEFAULT 0,
  updated_at        timestamptz NOT NULL DEFAULT now()
);
```

Обновляется триггерами на `document_node_links` или фоновой задачей раз в N минут. Без кэша рендер дерева бьёт N запросов на каждый узел.

---

## 4. Жизненный цикл узла

### 4.1 Create

`POST /nodes { parentId, name, type_label?, color? }`

Если `parentId = null` — корневой узел. После INSERT в `knowledge_nodes` обязательно вставить строки в closure: для нового узла `(self, self, 0)` + `(ancestor, new, depth+1)` для каждого предка через parent_id.

### 4.2 Rename

`PATCH /nodes/:id { name }`

Помимо UPDATE в БД, **обязательно** запустить пересчёт `node_paths` в Qdrant payload для всех документов, чьи `node_scope_ids` содержат этот узел. Лучше через очередь как фоновую задачу, не блокировать HTTP. Пока задача не завершилась — UI помечает раздел индикатором «синхронизация».

### 4.3 Move (смена parent)

`POST /nodes/:id/move { newParentId }`

Шаги:

1. Проверить, что `newParentId` не равен `id` и не находится среди потомков (антицикл): `NOT EXISTS (SELECT 1 FROM closure WHERE ancestor_id = :id AND descendant_id = :newParentId)`.
2. Удалить из closure все строки, где `descendant_id IN (потомки + self)` и `ancestor_id NOT IN (потомки + self)` — это «отрывает» поддерево от старого предка.
3. Вставить новые строки: для всех `descendant_id IN (поддерево)` и всех `ancestor_id IN (предки newParent + newParent)` со скорректированной `depth`.
4. UPDATE `knowledge_nodes.parent_id`.
5. Запустить пересчёт `node_scope_ids` и `node_paths` в Qdrant для всех документов в перемещённом поддереве.

### 4.4 Delete

`DELETE /nodes/:id?strategy=...`

Перед удалением API возвращает количество прямых документов и потомков. UI показывает диалог с выбором стратегии:

- `strategy=block` — отказать, если есть документы (`409 Conflict`);
- `strategy=move_to_parent` — перепривязать документы к parent;
- `strategy=move_to_unsorted` — перепривязать в системный «Без раздела»;
- `strategy=cascade_documents` — удалить документы вместе с узлом (опасно, требует двойного подтверждения).

После удаления: пересчитать payload в Qdrant для затронутых документов; если документы удалены — снести их точки.

### 4.5 Системные узлы

- `Без раздела` (`is_system = true`) создаётся миграцией. Не удаляется, не переименовывается. В UI рисуется внизу picker'а серым.
- В будущем здесь же могут жить `Архив`, `Корзина`.

---

## 5. Связи документов с разделами

### 5.1 Привязка

При импорте — обязательный массив `nodeIds` в запросе. Один документ → N разделов. Один из них — primary (по умолчанию первый).

### 5.2 Изменение привязок

`PATCH /documents/:id/nodes { nodeIds, primary }` — заменяет полный набор привязок. После UPDATE — пересчёт `node_ids`, `node_scope_ids`, `node_paths`, `primary_node_id` в Qdrant payload документа.

### 5.3 Документ без раздела

В dev-режиме — допустимо, попадает в «Без раздела». В production — рекомендуется блокировать импорт без `nodeIds` и показывать «Выберите раздел базы».

---

## 6. Связи задач с разделами

При создании ingestion_job сохраняем `nodeIds` через `job_node_links`. Фильтр `/jobs?nodeId=...&includeChildren=true` строится через:

```sql
SELECT j.*
FROM ingestion_jobs j
WHERE EXISTS (
  SELECT 1
  FROM job_node_links jnl
  JOIN knowledge_node_closure c ON c.descendant_id = jnl.node_id
  WHERE jnl.job_id = j.id
    AND c.ancestor_id = :nodeId          -- если includeChildren=true
    -- AND jnl.node_id = :nodeId          -- если includeChildren=false
);
```

`EXISTS` важен — иначе при multi-node задачах будут дубли строк.

---

## 7. Qdrant payload

### 7.1 Что добавить

```js
{
  // существующее
  document_id, chunk_id, text, title, source_path, page_number, page_type,

  // новое — для разделов
  node_ids:        ["uuid", ...],   // прямые
  node_scope_ids:  ["uuid", ...],   // прямые + ВСЕ предки (union по всем привязкам)
  primary_node_id: "uuid",
  node_paths:      ["Месторождение X / Цех 2", ...],

  // полезные мета — рекомендуется внести сразу
  doc_type:        "passport|manual|spec|drawing|other",
  ingested_at:     "2026-04-26T...",
  language:        "ru|en",

  // для будущих миграций
  payload_version: 2
}
```

`payload_version` — стоит ноль, спасает потом много. Когда схема меняется, фильтром `payload_version < 2` находишь все «старые» точки и переиндексируешь.

Чанки и векторы по разделам **не дублируются**. Один чанк — одна точка в Qdrant.

### 7.2 Когда обновлять

Триггеры на пересчёт payload документа:

- изменился набор `document_node_links`;
- переименован любой узел из `node_scope_ids` документа;
- перемещён любой узел из `node_scope_ids` документа;
- удалён любой узел из `node_scope_ids` документа;
- ручная команда `POST /documents/:id/reindex-payload`.

Поток:

1. Получить актуальные `node_ids` из `document_node_links`.
2. Из closure посчитать union предков → `node_scope_ids`.
3. Вытащить human-readable имена → `node_paths`.
4. Получить point ids документа через существующий `getDocumentPointIds(documentId)`.
5. `qdrant.setPayload(pointIds, { node_ids, node_scope_ids, node_paths, primary_node_id })`.

### 7.3 Ограничение размера

`node_scope_ids` растёт линейно с глубиной. На практике ограничивать UI 5–10 уровнями. Если кто-то строит дерево на 20 уровней — это уже UX-проблема, не техническая.

---

## 8. Поиск и фильтры

### 8.1 Алгоритм scoped search

1. UI передаёт `nodeId` и `includeChildren`.
2. Backend строит `scopeNodeIds`:
   - если `includeChildren=true`: `SELECT descendant_id FROM closure WHERE ancestor_id = :nodeId`;
   - если `includeChildren=false`: `[:nodeId]`.
3. **Lexical search**: SQL-запрос джойнит `document_chunks` и `document_assets` с `document_node_links` по `node_id IN scopeNodeIds`.
4. **Semantic search**: Qdrant filter:
   ```js
   // includeChildren=true
   filter = { must: [{ key: "node_scope_ids", match: { any: [nodeId] } }] }
   // includeChildren=false
   filter = { must: [{ key: "node_ids",       match: { any: [nodeId] } }] }
   ```
5. **Все остальные фильтры (тэги, page_type, signal, выбранные documentIds) собираются в тот же filter** одной структурой `must`/`should`. Не делать post-filter после fetch — иначе top-K Qdrant вернёт нерелевантные кандидаты до фильтрации.
6. Дедупликация на уровне `document_id` (документ в нескольких разделах не должен возвращаться повторно).
7. Источники в ответе содержат `node_paths` для отображения.

### 8.2 Переключатель «Только этот раздел / Этот раздел и вложенные»

Дефолт: «Этот раздел и вложенные». Переключатель влияет на: `/documents`, `/tags`, `/search`, `/ask`, `/search/pages`, `/ask/pages`, `/jobs`. Для системного «Без раздела» переключатель скрыт (всегда только он сам).

### 8.3 /ask на пустом scope

Если в выбранном scope источников нет — честный ответ:

> В выбранном разделе подходящие источники не найдены.

Не добирать из других разделов. Не использовать общую модель без RAG. Не выдумывать.

---

## 9. Загрузка документов

### 9.1 UI

Перед загрузкой — выбор одного или нескольких разделов. По умолчанию подставляется текущий раздел из шапки. Над кнопкой «Загрузить» — список выбранных разделов с возможностью удалить тег.

В dev-режиме допустимо «Без раздела» с предупреждением. В production — блокировать.

### 9.2 API

Все endpoints импорта принимают `nodeIds: string[]` и опциональный `primaryNodeId: string`:

- `POST /documents/upload`
- `POST /documents/ingest-file`
- `POST /documents/ingest-file-async`
- `POST /documents/ingest-folder`
- `POST /documents/ingest-folder-async`

После создания документа backend создаёт строки в `document_node_links` и инициирует расчёт payload в Qdrant.

---

## 10. UI / UX

### 10.1 Шапка

Главный акцент — текущий раздел. Бренд вторичен:

```
[LR]  Месторождение X ▸ Цех 2 ▸ АСУ ТП  ▼     [Этот раздел и вложенные ▾]   LOCAL-RAG-PLATFORM
```

Хлебные крошки кликабельны: клик по родительскому уровню переключает scope на него. Клик по `▼` открывает picker.

Если раздел не выбран:

```
[LR]  Выберите раздел базы  ▼     ...
```

### 10.2 Цветовое выделение

Не заливать фон всей страницы — пострадает читаемость. Лучше: цветная полоса 4–6px под шапкой с цветом узла + цветной accent у логотипа. Цвет наследуется от ближайшего узла с заданным `color` вверх по дереву.

### 10.3 Picker (одно окно, два режима)

**Режим одиночного выбора** (из шапки):

- поиск по разделам с подсветкой;
- дерево с раскрытием/сворачиванием;
- блок «Недавние» + «Закреплённые» сверху;
- кнопки: создать раздел, создать вложенный, переименовать, цвет/метка, удалить;
- кнопка «Открыть раздел».

**Режим множественного выбора** (из загрузки):

- то же дерево;
- checkbox у каждого узла;
- список выбранных разделов внизу с возможностью убрать;
- кнопка «Применить для загрузки».

В дереве показывать путь и счётчики:

```
Месторождение X / Цех 2
14 документов · 320 страниц
```

### 10.4 Карточка документа

- Бейдж primary node;
- если документов в нескольких разделах — мини-список «Также в: …»;
- тэги отдельной строкой (тэги — это *о чём*, не путать с разделами).

### 10.5 Drag & drop

Документы из библиотеки можно перетащить на узел в picker для смены/добавления привязки (с модификатором Shift — добавить, без — заменить).

### 10.6 URL deep-linking

`/ui/consult?nodeId=...&includeChildren=true` — для закладок и шаринга. Состояние scope синхронизируется с URL.

### 10.7 Mobile

Picker на узких экранах — fullscreen modal. Хлебные крошки сворачиваются в `Раздел ▼`.

### 10.8 Страницы

- `/ui/consult` — библиотека/поиск/ask, всё в scope;
- `/ui/ingest` — multi-select разделов перед загрузкой;
- `/ui/pages-search` — поиск страниц в scope;
- `/ui/jobs` — задачи текущего раздела + переключатель «текущий / все / ошибки»;
- `/ui/nodes` (новая) — управление деревом, массовая привязка, импорт/экспорт.

---

## 11. API

### 11.1 Дерево

```
GET    /nodes                              # плоский список или дерево (?format=tree)
POST   /nodes                              # { parentId, name, type_label?, color? }
PATCH  /nodes/:id                          # { name?, color?, type_label?, sort_order?, is_active? }
DELETE /nodes/:id?strategy=block|move_to_parent|move_to_unsorted|cascade_documents
POST   /nodes/:id/move                     # { newParentId } с проверкой циклов
GET    /nodes/:id/descendants
GET    /nodes/:id/ancestors
GET    /nodes/:id/documents?includeChildren=true
GET    /nodes/counts                       # { nodeId: { direct, scope, pages } }
GET    /nodes/export                       # JSON-дерева
POST   /nodes/import                       # импорт дерева из JSON
```

### 11.2 Документы

```
GET    /documents?nodeId=...&includeChildren=true
POST   /documents/:id/nodes                # { nodeIds, primary } — добавить
PATCH  /documents/:id/nodes                # { nodeIds, primary } — заменить полный набор
DELETE /documents/:id/nodes/:nodeId
POST   /documents/:id/reindex-payload      # ручной пересчёт Qdrant payload

POST   /documents/bulk-link                # { documentIds, nodeIds, mode: 'add'|'replace' }
POST   /documents/bulk-unlink              # { documentIds, nodeIds }

POST   /documents/upload                   + nodeIds + primaryNodeId
POST   /documents/ingest-file              + nodeIds + primaryNodeId
POST   /documents/ingest-file-async        + nodeIds + primaryNodeId
POST   /documents/ingest-folder            + nodeIds + primaryNodeId
POST   /documents/ingest-folder-async      + nodeIds + primaryNodeId
```

### 11.3 Поиск

```
POST   /search          + { nodeId, includeChildren, ... }
POST   /ask             + { nodeId, includeChildren, ... }
POST   /search/pages    + { nodeId, includeChildren, ... }
POST   /ask/pages       + { nodeId, includeChildren, ... }
                       + selectedTags filters documents.categories
GET    /tags?nodeId=...&includeChildren=true
GET    /jobs?nodeId=...&includeChildren=true
```

### 11.4 UI-state и админ

```
GET    /ui/state                       # { currentNodeId, includeChildren }
POST   /ui/state                       # сохранить
POST   /admin/reindex-nodes            # пересборка Qdrant payload из Postgres
GET    /admin/sync-status              # последняя сверка Postgres ↔ Qdrant
POST   /documents/:id/open-local       # см. раздел 12
```

### 11.5 Контракт /ask

```js
{
  question:          string,
  nodeId:            uuid,
  includeChildren:   boolean,    // default true
  documentIds:       uuid[],
  selectedTags:      string[],
  scope:             "chunks" | "pages" | "auto",
  assetClass:        string[],
  engineeringTopic:  string[],
  signalTag:         string[],
  limit:             number
}
```

`AnswerService` использует тот же scoped search, что и `/search`.

---

## 12. Открытие оригинала через Windows-приложение

Браузер не может напрямую запускать Windows-приложения. В Docker — тем более, контейнер не равен хосту. Варианты от простого к сложному:

1. **Скачать → открыть из Downloads** — нулевые усилия, но требует ручного клика.
2. **Custom URL scheme** (`localrag://open?path=...`) — регистрируется при установке локального хелпера. Просто, но ограничено по параметрам и безопасности.
3. **Локальный хелпер на 127.0.0.1:NNNN** — фоновый процесс на Windows, HTTP endpoint `POST /open` с проверкой токена сессии, запускает `start "" "C:\path\to\file.pdf"`. **Рекомендуется.**
4. **Browser extension с native messaging** — гибко, но требует установки расширения.
5. **WebSocket-bridge** — постоянное соединение с локальным агентом, для real-time UX.

Поток для варианта 3:

1. UI → backend: `POST /documents/:id/open-local` → backend возвращает `{ token, path, helper_url }`.
2. UI → `helper_url` (`http://127.0.0.1:NNNN/open`): `POST { token, path }`.
3. Хелпер проверяет токен (одноразовый, TTL 30 секунд), запускает `start ""`.

Хелпер устанавливается отдельным MSI/exe, добавляется в автозагрузку. Слушает только loopback, токен подписан секретом, разделяемым с backend через переменную окружения.

---

## 13. Производительность и кэширование

- Индексы из раздела 3 — обязательны.
- `node_scope_ids` в Qdrant как keyword index (быстрый `match.any`).
- `node_counters` обновлять триггерами на `document_node_links`:

  ```sql
  CREATE OR REPLACE FUNCTION recalc_node_counters_for(_node_ids uuid[]) ...
  ```

  или фоновой задачей раз в 5 минут (компромисс простоты и точности).
- Дерево узлов в backend кэшировать в памяти (LRU, инвалидация по любому изменению `knowledge_nodes`).
- `/nodes?format=tree` отдавать с ETag для frontend-кэша.
- Для очень больших библиотек документов scoped lexical search через CTE с `LIMIT` до сортировки.

---

## 14. Reconciliation Postgres ↔ Qdrant

Нужно, потому что между двумя хранилищами всегда возможен drift (упал Qdrant в момент `setPayload`, прерывание процесса, ручное вмешательство в БД).

### 14.1 Механизмы

- **`payload_version`** в payload: миграции находят старые точки одним фильтром.
- **Команда `POST /admin/reindex-nodes`** пересобирает payload для:
  - всех документов (`scope=all`);
  - конкретного документа (`scope=document&id=...`);
  - всех документов под узлом (`scope=node&id=...`).
- **Фоновая сверка** раз в N часов: для семпла из K документов сверить `node_ids` в Postgres и в Qdrant payload, при расхождении — запланировать переиндексацию.
- **`GET /admin/sync-status`** показывает: время последней сверки, число расхождений, время последней массовой переиндексации.

### 14.2 Идемпотентность

`setPayload` идемпотентен по своей природе. Любая операция переиндексации может быть выполнена повторно безопасно.

---

## 15. Безопасность и инварианты

- `is_primary` — максимум один на документ (partial unique index).
- Запрет `parent_id = id` (CHECK).
- Антицикл при move (проверка через closure).
- Удаление узла с документами — только с явной стратегией.
- Системный «Без раздела» — нельзя удалить, нельзя переименовать (проверять `is_system` в API-handler).
- Имена sibling узлов — уникальны в рамках одного `parent_id` (case-insensitive).
- Все эндпоинты, меняющие привязки документов, должны атомарно обновлять `document_node_links` и инициировать обновление Qdrant в одной транзакции (или через outbox-паттерн при сбое).

---

## 16. Миграция

Проект в разработке, исторических данных мало. Безопасный путь:

1. Накатить миграцию: `knowledge_nodes`, `closure`, `document_node_links`, `job_node_links`, `node_counters`.
2. Создать системный узел `Без раздела` (`is_system = true`).
3. Все существующие документы привязать к `Без раздела`.
4. Прогнать переиндексацию Qdrant payload (добавить `node_ids`, `node_scope_ids`, `node_paths`, `payload_version=2`).
5. Дать UI для управления деревом.
6. После проверки — почистить тестовые документы штатным удалением (чистит и Postgres, и Qdrant).
7. Загрузить документы заново уже с выбранными разделами.

Дерево разделов **не очищать** при чистке документов.

---

## 17. Тестовые сценарии

Минимальный набор для регресса:

1. Документ привязан к 2 узлам → отображается в обоих scope, в результатах поиска не дублируется.
2. Поиск с `includeChildren=false` не возвращает документы из родителя или брата.
3. Поиск с `includeChildren=true` подтягивает документы из всех потомков.
4. Rename узла → `node_paths` обновлены во всех связанных точках Qdrant за разумное время.
5. Move узла под другого родителя → `node_scope_ids` всех точек поддерева обновлены.
6. Move узла под собственного потомка → отказ с ошибкой «цикл».
7. Delete узла с документами → API возвращает 409 без `strategy`; с `strategy=move_to_parent` документы перепривязаны.
8. Системный «Без раздела» → нельзя rename/delete (403).
9. /ask на пустом scope → честный ответ без leak из других разделов.
10. После `POST /admin/reindex-nodes?scope=all` payload в Qdrant полностью совпадает с Postgres (выборочная сверка по 100 документам).
11. Bulk-link 50 документов в новый узел → `node_counters` обновлены, payload в Qdrant пересчитан.
12. Параллельные rename + ingest в одном узле → нет corrupted state, оба завершились успешно.
13. Загрузка документа в 3 раздела сразу → 3 строки в `document_node_links`, 1 из них primary.
14. Удаление документа → удалены строки в `document_node_links` и точки в Qdrant; счётчики пересчитаны.
15. URL `/ui/consult?nodeId=...&includeChildren=true` корректно восстанавливает scope при открытии в новой вкладке.
16. `GET /nodes?format=tree` возвращает ETag и `304 Not Modified` по `If-None-Match`.
17. `cascade_documents` без двойного подтверждения возвращает 400; с `confirm=DELETE_DOCUMENTS_AND_NODE` и точным `confirmName` удаляет только выбранный smoke-scope.
18. `POST /admin/reconcile-nodes-sample` выполняет выборочную сверку payload.
19. `POST /documents/:id/open-local` возвращает helper-контракт `token`, `path`, `helper_url`.

---

## 18. Риски

- **UI-only фильтр** — агент начнёт отвечать источниками из чужих разделов. **Митигация**: scope обязателен и в SQL, и в Qdrant filter.
- **Postgres обновлён, Qdrant нет** — semantic search протекает между разделами. **Митигация**: `payload_version`, фоновая сверка, ручной reindex.
- **Lexical и semantic фильтруются по-разному** — непредсказуемые ответы. **Митигация**: оба источника обязаны фильтровать по одному и тому же `scopeNodeIds`.
- **Большие массивы descendant ids утяжеляют запрос** — payload-фильтр через `node_scope_ids` решает это, не нужно слать в Qdrant список из тысяч документов.
- **Race conditions** при rename + import одного узла — последняя запись побеждает; payload документа всё равно будет пересчитан.
- **Privacy через эмбеддинги**: даже после фильтра ранжирование может «знать» о других документах. **Митигация**: только если документ перенесли — payload должен быть полностью обновлён, не просто помечен.
- **Кэш ответов /ask**: если кэшируешь — ключ обязан включать `nodeId` и `includeChildren`.
- **UX-перегрузка**: дерево + тэги + scope-toggle + page_type + signal + assetClass — слишком много фильтров на экране. Дефолты должны быть разумными, продвинутые фильтры — за «Развернуть фильтры».
- **Удаление узла без подтверждения** — потеря данных. **Митигация**: всегда диалог со счётчиками и стратегией.

---

## 19. План внедрения

Маленькими этапами, каждый этап деплоится и работает. На 2026-04-28 все пункты ниже реализованы в текущей ветке; дальнейшие изменения по разделам базы считаются улучшениями сверх этого ТЗ.

1. Миграция: `knowledge_nodes`, `closure`, `document_node_links`, `job_node_links`, `node_counters`. Создать `Без раздела`. Триггер для closure.
2. Read-only API дерева: `GET /nodes`, `GET /nodes/:id/descendants`, `GET /nodes/counts`. UI пока не трогаем.
3. Write API дерева: `POST/PATCH /nodes`, `POST /nodes/:id/move`, `DELETE /nodes/:id`. Антицикл, имена sibling-уникальны.
4. Привязка документов к узлам: `PATCH /documents/:id/nodes`, `POST /documents/bulk-link`, `POST /documents/:id/reindex-payload`. Поиск пока не меняем.
5. `nodeIds` в импорт: все 5 endpoint'ов. Создание `document_node_links` после успешного ingest.
6. Qdrant payload в новом импорте: `node_ids`, `node_scope_ids`, `node_paths`, `primary_node_id`, `payload_version: 2`.
7. Auto-reindex payload при изменении привязок документа.
8. Auto-reindex при rename/move/delete узла (фоновая задача).
9. Scoped lexical search в SQL.
10. Scoped Qdrant filter в semantic search.
11. Подключение `/ask`, `/search`, `/search/pages`, `/ask/pages`, `/jobs` к scope.
12. UI: шапка с picker'ом и переключателем, URL deep-linking, цветной accent.
13. UI: multi-select разделов в `/ui/ingest`.
14. UI: `/ui/nodes` — управление деревом, массовая привязка, импорт/экспорт.
15. Reconciliation: `POST /admin/reindex-nodes`, фоновая сверка, `GET /admin/sync-status`.
16. Open-local helper для Windows (отдельная подзадача).
17. Очистка тестовых документов и загрузка заново.

### Первый безопасный патч

Минимально-инвазивный первый шаг — этапы 1–3:

- миграция БД;
- создание системного «Без раздела»;
- read-only + write API дерева;
- никаких изменений в search/ask/import;
- никаких изменений в текущих документах и Qdrant.

Деплоится, проверяется, дальше идём.

---

## 20. Что НЕ делаем сейчас

- Версионирование дерева (история изменений) — overkill для текущего этапа.
- Permissions / multi-tenant — откладываем до появления реальной потребности.
- Шаблоны узлов — nice-to-have.
- Auto-suggest разделов на основе содержимого документа — после стабилизации основной фичи.
- Полнотекстовый поиск по именам узлов и описаниям — после стабилизации.

---

## 21. Чек-лист готовности фичи

Статус на 2026-04-28: backend live-check `GET /admin/knowledge-nodes-status` показывает `100%`, регрессионный smoke `scripts/knowledge-nodes-smoke.mjs` проходит `15/15`.

- [x] Миграция накатывается на чистую и на существующую БД.
- [x] `Без раздела` создан, защищён от удаления и переименования.
- [x] Все CRUD-операции узлов работают, антицикл реализован.
- [x] Closure корректно поддерживается на create/move/delete.
- [x] `is_primary` уникален в рамках документа.
- [x] Импорт во все 5 endpoint'ов принимает `nodeIds`.
- [x] Qdrant payload содержит `node_ids`, `node_scope_ids`, `node_paths`, `primary_node_id`, `payload_version: 2`.
- [x] Lexical и semantic search фильтруются по scope одинаково.
- [x] `/ask` на пустом scope не делает leak.
- [x] UI: шапка с picker и переключателем; multi-select в загрузке; страница `/ui/nodes`.
- [x] URL deep-linking работает.
- [x] Reconciliation запускается вручную и работает.
- [x] Все 15 тестовых сценариев проходят.
- [x] Документация обновлена.
