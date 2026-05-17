# Граф знаний АСУ ТП

## Что делает

Граф знаний — структурированное представление оборудования АСУ ТП:
системы, шкафы, платы, сигналы, адреса, связи. Параллельный
RAG-слой. RAG (Qdrant + чанки) отвечает на нечёткие текстовые
вопросы; граф — на точные структурные.

В отличие от обычного retrieval, который возвращает похожие текстовые
фрагменты, граф даёт точные ответы на вопросы вроде «что внутри
шкафа IO-03», «где установлена плата DII8P24», «какой адрес у
сигнала KS_T2B1».

## Расположение в коде

- Сервис: `apps/kb-api/src/services/graphService.js`
- Роуты: `apps/kb-api/src/routes/graph.js`
- Доступ к БД: `apps/kb-api/src/providers/postgresProvider.js`
  (методы `createGraphNode`, `getGraphNodeById`, `listGraphNodes`,
  `updateGraphNode`, `setGraphNodeArchived`, `createGraphEdge`,
  `listGraphEdges`, `getRelatedGraphNodes`, `deleteGraphEdge`,
  `getGraphStats`)
- Схема БД: таблицы `graph_nodes`, `graph_edges` в PostgreSQL.
  Создаются автоматически в
  `PostgresProvider.ensureGraphSchema()`, которая вызывается из
  `ensureRuntimeSchema()` при старте `kb-api`.

## Что входит в #8.1.a

- Таблицы `graph_nodes`, `graph_edges` (идемпотентный DDL).
- Сервис `GraphService` с CRUD-операциями.
- REST API `/api/v2/graph/*`.

Намеренно отсутствует в этой итерации:

- Парсер XLSX (это #8.1.b).
- LLM-извлечение знаний из PDF (это #8.1.d).
- UI (это #8.2).
- Подключение графа к retrieval/answer (это #8.3).

То есть после #8.1.a в БД есть пустые таблицы и работающие
эндпоинты — наполнять граф пока приходится вручную через API.

## Как использовать

### Через API

Базовый префикс: `http://localhost:8787/api/v2/graph`.

#### Создать узел-шкаф

```bash
curl -X POST http://localhost:8787/api/v2/graph/nodes \
  -H "Content-Type: application/json" \
  -d '{
    "type": "cabinet",
    "name": "Cabinet KS-3_IO-06",
    "attributes": { "cabinet_id": "KS-3_IO-06", "vendor": "Honeywell" }
  }'
```

Ответ:

```json
{ "ok": true, "node": { "id": "...", "type": "cabinet", ... } }
```

#### Создать узел-плату со ссылкой на документ

```bash
curl -X POST http://localhost:8787/api/v2/graph/nodes \
  -H "Content-Type: application/json" \
  -d '{
    "type": "card",
    "name": "AII8C @ 2:0:0",
    "attributes": {
      "card_type": "AII8C",
      "address": "2:0:0:0",
      "station": "DP01",
      "fbc": 2, "ibc": 0, "card_slot": 0
    },
    "sourceDocumentId": "<uuid>",
    "sourceXlsxSheet": "_IO-06",
    "sourceXlsxRow": 4
  }'
```

#### Связать плату со шкафом

```bash
curl -X POST http://localhost:8787/api/v2/graph/edges \
  -H "Content-Type: application/json" \
  -d '{
    "sourceNodeId": "<card-uuid>",
    "targetNodeId": "<cabinet-uuid>",
    "relation": "installed_in",
    "attributes": { "slot_number": 0 }
  }'
```

Связи идемпотентны: повторный `POST` с тем же триплетом
`(sourceNodeId, targetNodeId, relation)` вернёт уже существующую
запись с тем же `edge.id`, а не создаст дубль. В ответ
дополнительно приходит `created: true|false`, чтобы клиент знал,
была ли запись создана только что или уже была.

#### Получить все связи платы (входящие + исходящие)

```bash
curl "http://localhost:8787/api/v2/graph/nodes/<card-uuid>/related?direction=both"
```

`direction` принимает `outgoing` (узел как источник), `incoming`
(узел как цель), `both` (по умолчанию). Опциональный фильтр
`relation=<строка>` сужает выдачу до конкретного типа связи.

#### Список узлов по типу

```bash
curl "http://localhost:8787/api/v2/graph/nodes?type=signal&limit=20"
```

Доступные фильтры:

- `type` — тип узла;
- `author` — кто создал узел;
- `isArchived` — `true`/`false`. По умолчанию (без параметра)
  возвращаются только неархивированные;
- `sourceDocumentId` — документ-источник;
- `nameSearch` — подстрока для ILIKE-поиска по `name`;
- `limit` (1..500, по умолчанию 50);
- `offset` (≥0, по умолчанию 0).

Ответ всегда формата `{ ok, items, total, limit, offset }`.

#### Сводка по графу

```bash
curl http://localhost:8787/api/v2/graph/stats
```

Ответ:

```json
{
  "ok": true,
  "nodesByType": { "cabinet": 4, "card": 12, "signal": 96 },
  "edgesByRelation": { "installed_in": 12, "connected_to": 96 },
  "totalActiveNodes": 112,
  "totalArchivedNodes": 3,
  "totalEdges": 108
}
```

### Через UI

В #8.1.a — нет, UI появится в #8.2. Пока работа с графом —
только через API.

## Полный список роутов

| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/v2/graph/nodes` | Создать узел |
| GET | `/api/v2/graph/nodes/:id` | Получить узел |
| GET | `/api/v2/graph/nodes` | Список с фильтрами (`type`, `author`, `isArchived`, `sourceDocumentId`, `nameSearch`, `limit`, `offset`) |
| PATCH | `/api/v2/graph/nodes/:id` | Обновить узел (любые поля кроме `id`, `createdAt`) |
| DELETE | `/api/v2/graph/nodes/:id` | Архивировать (НЕ физическое удаление; `is_archived=true`) |
| POST | `/api/v2/graph/nodes/:id/unarchive` | Разархивировать |
| POST | `/api/v2/graph/edges` | Создать связь (idempotent: при дублирующем триплете возвращает существующую) |
| GET | `/api/v2/graph/edges` | Список с фильтрами (`sourceNodeId`, `targetNodeId`, `relation`, `limit`, `offset`) |
| GET | `/api/v2/graph/nodes/:id/related` | Связи узла (`relation`, `direction`=`outgoing`/`incoming`/`both`) |
| DELETE | `/api/v2/graph/edges/:id` | Удалить связь (физически — связи легко создать заново) |
| GET | `/api/v2/graph/stats` | Сводка по графу |

Все ошибочные ответы — `{ ok: false, error: "..." }` с
русским сообщением. Все валидационные ошибки — `400`.
Несуществующие узлы/связи — `404`.

## Технические детали

### Модель данных

#### `graph_nodes`

| Поле | Тип | Назначение |
|---|---|---|
| `id` | UUID PK | Идентификатор |
| `type` | TEXT | Тип узла (`system`/`cabinet`/`card`/`signal`/...). Свободная строка, не enum |
| `name` | TEXT | Имя узла |
| `description` | TEXT | Опциональное описание |
| `attributes` | JSONB | Type-specific поля (см. ниже) |
| `source_document_id` | UUID FK | Документ-источник (опц.) |
| `source_page_number` | INT | Страница в документе (опц.) |
| `source_xlsx_sheet` | TEXT | Лист XLSX (опц.) |
| `source_xlsx_row` | INT | Строка XLSX (опц.) |
| `confidence` | REAL | Уверенность 0.0–1.0 |
| `author` | TEXT | Источник: `import:xlsx:<profile_id>`, `agent:llm-extraction`, `user:manual`, `system:reconciler` |
| `is_archived` | BOOL | Архивирование вместо физического удаления |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | Автообновление через триггер `trg_graph_nodes_set_updated_at` |

Индексы:

- `idx_graph_nodes_type` — `type WHERE is_archived = FALSE`;
- `idx_graph_nodes_source_document` — `source_document_id WHERE
  source_document_id IS NOT NULL`;
- `idx_graph_nodes_author` — `author`;
- `idx_graph_nodes_name` — `name` (под ILIKE);
- `idx_graph_nodes_attributes` — GIN по `attributes` (под
  будущий поиск по JSONB).

#### `graph_edges`

| Поле | Тип | Назначение |
|---|---|---|
| `id` | UUID PK | |
| `source_node_id` | UUID FK | Откуда связь (`ON DELETE CASCADE`) |
| `target_node_id` | UUID FK | Куда связь (`ON DELETE CASCADE`) |
| `relation` | TEXT | Тип связи (`part_of`/`installed_in`/`connected_to`/...) |
| `attributes` | JSONB | Свойства связи |
| `confidence` | REAL | Уверенность 0.0–1.0 |
| `author` | TEXT | Источник |
| `created_at` | TIMESTAMPTZ | |

Ограничения:

- `UNIQUE (source_node_id, target_node_id, relation)` —
  защита от дублей. На этом строится идемпотентность
  `POST /api/v2/graph/edges`.
- `ON DELETE CASCADE` — если узел удалён физически (что не
  делается из API, только через psql), связи тоже исчезают.

Индексы:

- `idx_graph_edges_source` — `source_node_id`;
- `idx_graph_edges_target` — `target_node_id`;
- `idx_graph_edges_relation` — `relation`.

### Канонические типы узлов

Это **рекомендации**, не enum. Поле `type` — свободная строка,
поэтому можно создавать свои типы под будущие нужды.

- `system` — система (KS-3, GPA-KC-3);
- `subsystem` — подсистема (АСУТП, IO-03);
- `cabinet` — шкаф;
- `card` — плата;
- `signal` — сигнал;
- `loop_tag` — позиция в схеме;
- `address` — адрес сигнала;
- `vendor` — производитель;
- `regulation` — нормативный документ;
- `object` — объект (ЦСП-3) — для будущего мульти-объектного
  режима.

### Канонические типы связей

Так же — рекомендации, не enum.

- `part_of` — A is part_of B (шкаф part_of системы);
- `installed_in` — плата installed_in шкафу;
- `connected_to` — сигнал connected_to плате
  (`attributes.channel_number`);
- `addressed_at` — сигнал addressed_at адресу;
- `described_in` — узел described_in документе
  (`attributes.page_number`, `attributes.section`);
- `supplies` — A supplies B (источник питания / сигнал);
- `regulates` — регулятор A regulates параметр B.

### Примеры `attributes` для узлов

```json
// card
{
  "card_type": "AII8C",
  "address": "2:0:0:0",
  "station": "DP01",
  "fbc": 2, "ibc": 0, "card_slot": 0
}

// signal
{
  "signal_kind_raw": "1AI",
  "signal_kind": "AI",
  "channel": 0,
  "loop_tag": "KS_T2B1",
  "device_tag": "TTBK1"
}

// cabinet
{
  "cabinet_id": "KS-3_IO-06",
  "vendor": "Honeywell"
}
```

### Архивирование vs удаление

`DELETE /api/v2/graph/nodes/:id` — **архивирование**
(`is_archived=true`). По умолчанию `GET /api/v2/graph/nodes`
отдаёт только неархивированные. Это сделано для аудита и для
возможности восстановить узлы, ошибочно «удалённые» агентом LLM.
Чтобы увидеть архивированные, добавить `?isArchived=true`.

Физическое удаление узлов — только через `psql` вручную владельцем.

`DELETE /api/v2/graph/edges/:id` — **физическое удаление**.
Связи легко создать заново, для них архивирование избыточно.

### Уверенность (`confidence`) и автор (`author`)

Каждый узел и связь имеют:

- `confidence` 0.0–1.0 — насколько данные надёжны.
  - `1.0` — точные данные (импорт из XLSX по проверенному профилю
    или ручное создание);
  - `0.5..0.9` — извлечено LLM из PDF, требует подтверждения;
  - `0.0` — отвергнуто пользователем (но не удалено для аудита).
- `author` — кто создал.
  - `import:xlsx:<profile_id>` — парсер XLSX по профилю
    (#8.1.b);
  - `agent:llm-extraction` — LLM-извлечение из PDF (#8.1.d);
  - `user:manual` — создан вручную через UI/API (по умолчанию);
  - `system:reconciler` — системные узлы (служебные).

Это нужно для будущей логики UI (#8.2):

- Узлы с `confidence < 1.0` и `author='agent:llm-extraction'`
  будут показываться как «черновики», требующие подтверждения
  пользователем;
- При повторной обработке документа агентом — старые «черновики»
  могут быть отвергнуты (`confidence=0.0`, остаются для аудита).

### Идемпотентность создания связей

`POST /api/v2/graph/edges` использует `INSERT ... ON CONFLICT (source_node_id, target_node_id, relation) DO NOTHING`
+ повторный `SELECT`. Если триплет уже есть, эндпоинт возвращает
старую запись с `created: false`. Новый — с `created: true`.
Поэтому ингесторы (XLSX и LLM из #8.1.b/#8.1.d) могут безопасно
повторно загружать данные без накопления дублей.

### Миграции

Все изменения схемы графа — неразрушающие, идемпотентный DDL в
`PostgresProvider.ensureGraphSchema()` (`CREATE TABLE IF NOT
EXISTS`, `CREATE INDEX IF NOT EXISTS`, `CREATE OR REPLACE
FUNCTION`, `DROP TRIGGER IF EXISTS` + `CREATE TRIGGER`).
Метод вызывается из `ensureRuntimeSchema()` при каждом старте
`kb-api`. Существующих данных не касаемся.

В `infra/postgres/init/001_init.sql` граф НЕ добавлен — init
выполняется только при первом создании Postgres-контейнера, а
существующим стендам он не применится.

## Ограничения и риски

- Текущая итерация (#8.1.a) — только схема + API. Парсера XLSX и
  LLM-извлечения нет. Граф наполняется только вручную через API.
- На слабом ноутбуке: операции — обычные SQL-запросы, нагрузки на
  CPU/диск минимальны.
- При недоступности Postgres все эндпоинты графа возвращают 500.
  Деградация retrieval не предусмотрена в этой итерации
  (граф ещё не подключён к retrieval).
- Поле `attributes` — JSONB без жёсткой схемы. Это намеренный
  выбор для скорости разработки: профили XLSX (#8.1.b) могут
  складывать туда любые поля; UI (#8.2) будет рисовать карточку
  по `type` без жёсткой проверки.

## История изменений

- 2026-05-17: #8.1.a — создан фундамент (схема БД, сервис,
  REST API). UI и парсер XLSX появятся в #8.1.b и #8.2.
