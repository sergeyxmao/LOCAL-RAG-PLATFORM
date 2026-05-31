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

## Что добавлено в #8.1.b

- Автоматическое наполнение графа из XLSX/XLS файлов при импорте.
- Подробности — `docs/GRAPH_INGESTION.md`.
- 2 готовых профиля парсера (`metso_dna_rio`,
  `koyo_directlogic_pro`).
- Alias-конфиг для нормализации `signal_kind`.
- UPSERT по бизнес-ключу через
  `GraphService.upsertNodeByBusinessKey()`.
- Endpoint `/api/v2/graph/reparse/:documentId` для ручного
  перезапуска парсера на уже загруженных документах.
- Новая колонка `ingestion_jobs.graph_report` (JSONB) — отчёт
  парсера сохраняется при импорте.

Намеренно отсутствует в этих двух итерациях:

- LLM-извлечение знаний из PDF (это #8.1.d).
- UI «Маппинг колонок» (это #8.1.c).
- UI «Граф знаний» (это #8.2).
- Подключение графа к retrieval/answer (это #8.3).

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
| POST | `/api/v2/graph/case` | Записать случай (память инженера): атомарно создаёт/находит узлы `equipment`/`fault`/`solution`/`object` и связи между ними. См. `docs/ENGINEER_MEMORY.md` |
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

Начиная с #8.1.e канонические типы хранятся в таблице
`graph_node_types` (`code` PK, `label_ru`, `description`, `icon`,
`sort_order`, `is_builtin`, `is_archived`), редактируются через
UI «Настройки → Граф знаний → Типы узлов» и REST API
`/api/v2/graph/node-types`. Подробности — `docs/GRAPH_NODE_TYPES.md`.

10 встроенных типов (`is_builtin = TRUE`).

Слой сигналов АСУ ТП (7):

- `object` 🏭 — Объект (верхний уровень: установка, цех);
- `cabinet` 🗄 — Шкаф автоматики;
- `station` ⚡ — ПЛК (программируемый логический контроллер);
- `card` 🔌 — Плата (модуль ввода/вывода);
- `channel` 📡 — Канал на плате;
- `signal` 〰 — Логический сигнал;
- `device` 📟 — Полевой прибор.

Слой «Память инженера» (3, Этап 1 — ручная запись случаев,
`docs/ENGINEER_MEMORY.md`):

- `equipment` 🔧 — Оборудование (зонтичный тип: датчик, насос,
  кабель, автомат, клеммник; не путать с узким `device`);
- `fault` ⚠️ — Неисправность;
- `solution` ✅ — Решение.

Их `code` неизменяем, удалить их нельзя; русское название,
описание, иконку и порядок сортировки можно править. Кастомные
типы добавляются полноценным CRUD.

`graph_nodes.type` остаётся TEXT-полем без FK на
`graph_node_types.code` — это сознательный компромисс ради
гибкости парсера. Семантическая целостность — на уровне
приложения.

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

Связи слоя «Память инженера»:

- `relates_to` — `fault` relates_to `equipment` (неисправность
  относится к оборудованию);
- `resolves` — `solution` resolves `fault` (решение устраняет
  неисправность);
- `located_at` — `equipment` located_at `object` (оборудование
  находится на объекте).

Связь записанного случая с документом-источником **не** делается
ребром (`graph_edges.target_node_id` ссылается только на
`graph_nodes`, а документ живёт в таблице `documents`). Вместо
этого у создаваемых узлов проставляется поле
`source_document_id` — там же штатно отрабатывает удаление
документа (FK).

### Примеры `attributes` для узлов

```json
// card
{
  "card_type": "AII8C",
  "address": "2:0:0:0",
  "station": "DP01",
  "fbc": 2, "ibc": 0, "card_slot": 0
}

// signal (metso-style)
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

Для koyo-style сигналов (#8.1.b.fix) могут присутствовать
дополнительные опциональные поля; пишутся в attributes только
если соответствующая колонка заполнена:

```json
// signal (koyo-style AI)
{
  "tag": "SUO_AI_01",
  "description": "Температура подшипника 1",
  "signal_kind": "AI",
  "signal_address": "V10000:R",
  "card_address": "M0",
  "channel": "0",
  "station_code": "SUO",
  "range_lo_lo": "V10100",
  "range_lo": "V10101",
  "range_hi": "V10102",
  "range_hi_hi": "V10103",
  "range_break_addr": "V10200",
  "range_eu_addr": "V10300"
}

// signal (koyo-style DI)
{
  "tag": "SUO_DI_05",
  "signal_address": "B10500.5",
  "bit_address": "X5",
  "coil_address": "C5"
}

// signal (koyo-style DO)
{
  "tag": "SUO_DO_01",
  "signal_address": "B10520.0",
  "output_address": "Y0",
  "coil_address": "C100"
}
```

### Архивирование vs удаление

`DELETE /api/v2/graph/nodes/:id` — **архивирование**
(`is_archived=true`). По умолчанию `GET /api/v2/graph/nodes`
отдаёт только неархивированные. Это сделано для аудита и для
возможности восстановить узлы, ошибочно «удалённые» агентом LLM.
Чтобы увидеть архивированные, добавить `?isArchived=true`.

Физическое удаление узлов — только через `psql` вручную владельцем
или через UI «Граф знаний» (`POST .../hard-delete`, см.
`docs/GRAPH_UI.md`).

`DELETE /api/v2/graph/edges/:id` — **физическое удаление**.
Связи легко создать заново, для них архивирование избыточно.

### Удаление узлов при удалении документа

`DELETE /documents/:id` дополнительно удаляет импортные узлы
графа этого документа в той же транзакции, что и сам документ.
Правило удаления узла — обе проверки одновременно:

1. `graph_nodes.source_document_id` совпадает с id удаляемого
   документа;
2. `graph_nodes.author` начинается с `import:` (например,
   `import:xlsx:koyo_directlogic_pro`).

Ручные узлы (`author = 'user:manual'`) и узлы других документов
не удаляются. Их `source_document_id` обнуляется штатным FK
`ON DELETE SET NULL` — узел сохраняется в графе как «сирота»
без ссылки на исходный документ.

Рёбра удалённых узлов уходят каскадом через FK
`graph_edges.{source,target}_node_id ON DELETE CASCADE`.

FK `graph_nodes.source_document_id` остаётся `ON DELETE SET NULL`
как страховка для не-import узлов — превращать его в каскадный
было бы деструктивно для ручных узлов.

Реализация — `PostgresProvider.deleteImportedGraphNodesByDocumentIds()`
+ обновлённый `deleteDocumentsByIds()` (одна транзакция, узлы
удаляются ПЕРЕД документами, иначе FK SET NULL обнулит ссылку и
фильтр перестанет находить узлы).

В ответе `DELETE /documents/:id` (и
`POST /documents/deduplicate`) появляется поле
`removedGraphNodes: <number>` — сколько узлов удалено по этому
правилу.

### Уверенность (`confidence`) и автор (`author`)

Каждый узел и связь имеют:

- `confidence` 0.0–1.0 — насколько данные надёжны.
  - `1.0` — точные данные (импорт из XLSX по проверенному профилю
    или ручное создание);
  - `0.5..0.9` — извлечено LLM, перенесено в граф после подтверждения
    (confidence из кандидата);
  - `0.0` — отвергнуто пользователем (но не удалено для аудита).
- `author` — кто создал.
  - `import:xlsx:<profile_id>` — парсер XLSX по профилю
    (#8.1.b);
  - `agent:llm-extraction` — **реально используется (Память инженера,
    Этап 3)**: LLM-извлечение случаев из текстовых документов
    (`docx`/`txt`/`md`). Узлы с этим автором создаются `recordCase` при
    подтверждении кандидата на экране ревью;
  - `user:manual` — создан вручную через UI/API (по умолчанию);
  - `system:reconciler` — системные узлы (служебные).

#### Поток через очередь кандидатов (Этап 3)

LLM-извлечение НЕ пишет в граф напрямую. Извлечённые случаи попадают в
очередь кандидатов `graph_extraction_candidates` (`status='pending'`).
Граф остаётся стерильным: ни один непроверенный узел в него не попадает.
Пользователь на экране «Граф знаний → Кандидаты» подтверждает / правит /
отклоняет каждый случай. **Только подтверждённый** случай переносится в
граф — тем же `recordCase`/`recordCaseTx`, что и ручная запись, но с
`author='agent:llm-extraction'` и `confidence` из кандидата.
Дедупликация оборудования по имени отрабатывает внутри `recordCaseTx`
(`findNodeByName`, `ILIKE`). Подробно —
`docs/KNOWLEDGE_EXTRACTION.md`.

С Этапа 3 `recordCase`/`recordCaseTx` принимают опциональные
`author`/`confidence` (обратно совместимо: при отсутствии — `user:manual`
/ `1.0`). Колонки `author`/`confidence` уже были в схеме — это изменение
кода, не DDL.

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
  складывать туда любые поля; UI (#8.2) рисует карточку
  по `type` без жёсткой проверки.

## Иерархия в дереве UI (HIERARCHY_RULES, #8.2)

UI «Граф знаний» (`/ui/v2/graph`, см. `docs/GRAPH_UI.md`) строит
дерево на основе фиксированной карты из 6 правил, описывающей
иерархию встроенных типов АСУ ТП:

```javascript
const HIERARCHY_RULES = [
  { parent: 'object',  child: 'cabinet', relation: 'installed_in', direction: 'forward' },
  { parent: 'cabinet', child: 'station', relation: 'installed_in', direction: 'forward' },
  { parent: 'station', child: 'card',    relation: 'installed_in', direction: 'forward' },
  { parent: 'card',    child: 'channel', relation: 'has_channel',  direction: 'backward' },
  { parent: 'channel', child: 'signal',  relation: 'connected_to', direction: 'forward' },
  { parent: 'signal',  child: 'device',  relation: 'measures',     direction: 'backward' },
];
```

- `direction = 'forward'`  — связь `child → parent`
  (`source_node_id = child`, `target_node_id = parent`).
- `direction = 'backward'` — связь `parent → child`.

Эти правила определяют:

1. **Структуру дерева** в UI (что является ребёнком чего);
2. **Каскадное удаление**: при `cascade=true` сервис
   `hardDeleteNode` рекурсивно собирает потомков по этим
   правилам (не по всем связям подряд);
3. **Подсчёт потомков** (`descendantsCount`) для модалки
   удаления.

Правила определены в `apps/kb-api/src/services/graphTreeService.js`
и экспортируются как `HIERARCHY_RULES` для повторного использования
в `graphService.js` и зеркалятся в `apps/kb-api/src/routes/uiV2Graph.js`
как `CLIENT_HIERARCHY_RULES` для построения родительской связи
при создании узла из модалки.

**Кастомные типы узлов** (созданные через `#8.1.e`) не
участвуют в HIERARCHY_RULES: они показываются в дереве **только
как корневые группы**. Чтобы кастомный тип попал в дерево как
ребёнок другого типа, нужно явно расширить `HIERARCHY_RULES`
(в коде, в обоих местах). Вынос правил в БД — отложенная
улучшалка.

## История изменений

- 2026-05-21: #8.2.followup-1 — при удалении документа удаляются
  его импортные узлы графа (`author LIKE 'import:%'` + совпадение
  `source_document_id`). Ручные узлы (`user:manual`) и узлы других
  документов сохраняются — их `source_document_id` обнуляется
  штатным FK `ON DELETE SET NULL`. Рёбра уходят каскадом по FK.
  В ответе `DELETE /documents/:id` появилось поле
  `removedGraphNodes`.
- 2026-05-19: #8.1.b.fix — расширен список атрибутов сигнала
  для koyo-style профилей (диапазоны AI, биты DI/DO, coil-адреса,
  калибровка AO). Подробности — `docs/GRAPH_INGESTION.md`.
- 2026-05-18: #8.2 — добавлен раздел про HIERARCHY_RULES (см.
  `docs/GRAPH_UI.md`).
- 2026-05-18: #8.1.e — таблица `graph_node_types`, CRUD-API
  `/api/v2/graph/node-types`, UI-подвкладка «Типы узлов»,
  динамические `builds` в wizard'е профилей с русскими лейблами и
  иконками, поле `nodeTypeLabels` в `/api/v2/graph/stats`. AJV
  валидация `builds` в `graph-parsers.yaml` ослаблена с enum до
  паттерна. Подробности — `docs/GRAPH_NODE_TYPES.md`.
- 2026-05-17: #8.1.b — парсер XLSX (`docs/GRAPH_INGESTION.md`),
  2 готовых профиля, alias-конфиг, UPSERT по бизнес-ключу,
  endpoint `/api/v2/graph/reparse/:documentId`, колонка
  `ingestion_jobs.graph_report`.
- 2026-05-17: #8.1.a — создан фундамент (схема БД, сервис,
  REST API). UI и парсер XLSX появятся в #8.1.b и #8.2.
