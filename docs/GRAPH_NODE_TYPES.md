# Типы узлов графа (#8.1.e)

## Что делает

Справочник типов узлов графа знаний хранится в БД (таблица
`graph_node_types`) и редактируется через UI. Раньше набор типов
был захардкожен в коде парсера XLSX и в чекбоксах wizard'а
профилей — английскими техническими кодами без русских лейблов и
без описаний. Теперь:

- В UI везде видны русские названия (`Шкаф`, `ПЛК`, `Плата`, …) с
  emoji-иконками вместо `cabinet`, `station`, `card`.
- В wizard'е профилей парсера рядом с каждым чекбоксом `builds`
  есть подсказка `?` с описанием из БД.
- Можно добавлять кастомные типы для не-АСУ-доменов (например,
  `категория`, `подкатегория`, `деталь`) — они появятся в wizard'е,
  в API и в статистике графа.

10 «встроенных» типов создаются автоматически при первом старте
`kb-api` и помечены флагом `is_builtin = TRUE`:

- 7 типов слоя сигналов АСУ ТП: `object`, `cabinet`, `station`,
  `card`, `channel`, `signal`, `device`.
- 3 типа слоя «Память инженера» (Этап 1, ручная запись случаев):
  `equipment` (🔧 «Оборудование» — зонтичный тип: датчик, насос,
  кабель, автомат, клеммник; не путать с узким `device`),
  `fault` (⚠️ «Неисправность»), `solution` (✅ «Решение»).

Их `code` неизменяем; русское название, описание, иконку и порядок
сортировки можно править. Удалить их нельзя. Подробнее о слое
памяти — `docs/ENGINEER_MEMORY.md`.

Парсер XLSX (`xlsxParser.js`) в этой итерации продолжает работать
только с 7 встроенными кодами — если в `builds` профиля попадает
кастомный код, парсер его молча пропускает и добавляет warning
`unknown_node_type` в `graph_report.warnings`.

## Расположение в коде

- Таблица: `graph_node_types` в PostgreSQL, создаётся в
  `PostgresProvider.ensureGraphSchema()`
  (`apps/kb-api/src/providers/postgresProvider.js`).
- Сервис: `apps/kb-api/src/services/graphNodeTypeService.js` —
  CRUD-операции + `ensureBuiltinTypes()` + `getLabelsMap()`.
- Роуты: `apps/kb-api/src/routes/graphNodeTypes.js` — REST API
  `GET/POST/PUT/DELETE /api/v2/graph/node-types[/:code]`.
- UI: подвкладка «Типы узлов» в `apps/kb-api/src/routes/uiV2Settings.js`
  (Настройки → Граф знаний → Типы узлов).
- Bootstrap: `app.graphNodeTypeService.ensureBuiltinTypes()` в
  `apps/kb-api/src/index.js` после создания схемы.
- Stats: `GraphService.getStats()` обогащает ответ полем
  `nodeTypeLabels` через `nodeTypeService.getLabelsMap()`.
- Парсер: предупреждение `unknown_node_type` в
  `apps/kb-api/src/services/graphParsers/xlsxParser.js`
  (функция `warnUnknownBuilds`).

## Как использовать

### Через UI

Открыть **Настройки → Граф знаний → Типы узлов**.

- Карточка показывает иконку, русское название, код, бейдж
  «🔒 Системный» или «Кастомный», счётчик использования и порядок.
- Кнопка **«Изменить»** — открывает форму. У системных типов поле
  «Код» readonly; редактируются название, описание, иконка,
  порядок.
- Кнопка **«+ Создать тип»** — открывает форму с пустыми полями
  и редактируемым полем «Код» (snake_case латиницей, валидация
  паттерном `^[a-z][a-z0-9_]*$`).
- Кнопка **«Удалить»** для системных типов disabled с tooltip
  «Системный тип удалить нельзя». Для кастомных:
  - если `usage_count > 0` — модалка с предупреждением и кнопкой
    «Понятно», DELETE не отправляется;
  - если `usage_count === 0` — модалка с подтверждением «Удалить
    тип "X"?».

Каждое поле формы имеет подсказку `?` с пояснением.

### Через REST API

Базовый префикс: `http://localhost:8787/api/v2/graph/node-types`.

#### Список всех типов

```bash
curl http://localhost:8787/api/v2/graph/node-types
```

Ответ:

```json
{
  "ok": true,
  "types": [
    {
      "code": "object",
      "label_ru": "Объект",
      "description": "Верхний уровень: установка, цех, объект АСУ ТП.",
      "icon": "🏭",
      "sort_order": 10,
      "is_builtin": true,
      "is_archived": false,
      "usage_count": 0,
      "created_at": "...",
      "updated_at": "..."
    },
    ...
  ]
}
```

#### Один тип

```bash
curl http://localhost:8787/api/v2/graph/node-types/cabinet
```

Ответ: `{ ok: true, type: { ... } }` или 404 «Тип узла не найден».

#### Создать кастомный тип

```bash
curl -X POST http://localhost:8787/api/v2/graph/node-types \
  -H "Content-Type: application/json" \
  -d '{"code":"widget","label_ru":"Виджет","icon":"🧩","description":"Тестовый кастомный тип.","sort_order":150}'
```

Ответ (HTTP 201): `{ ok: true, type: { ..., is_builtin: false }, message: "Тип \"widget\" создан." }`.

Ошибки:
- 400 — невалидный `code` (не соответствует паттерну
  `^[a-z][a-z0-9_]*$`) или пустой `label_ru`.
- 409 — `code` уже существует.

#### Обновить тип

```bash
curl -X PUT http://localhost:8787/api/v2/graph/node-types/cabinet \
  -H "Content-Type: application/json" \
  -d '{"label_ru":"Шкаф автоматики","sort_order":15}'
```

Ответ (HTTP 200): `{ ok: true, type: { ... }, message: "Тип \"cabinet\" обновлён." }`.

Поле `code` в body игнорируется при совпадении или возвращает
403 «Нельзя менять код у системного типа», если оно отличается.

#### Удалить кастомный тип

```bash
curl -X DELETE http://localhost:8787/api/v2/graph/node-types/widget
```

Ответ:
- 200 `{ ok: true, message: "Тип \"widget\" удалён." }`.
- 403 «Системный тип "cabinet" нельзя удалить» — для встроенных.
- 409 «Тип "X" используется в N узлах. Сначала измените их тип
  или удалите.» — если на тип ссылается хотя бы один активный
  `graph_nodes`.

#### Статистика графа

`GET /api/v2/graph/stats` теперь возвращает дополнительное поле
`nodeTypeLabels` — словарь `code → { label_ru, icon }`:

```json
{
  "ok": true,
  "nodesByType": { "cabinet": 3, "card": 8 },
  "edgesByRelation": { "installed_in": 8 },
  "totalActiveNodes": 48,
  "totalArchivedNodes": 0,
  "totalEdges": 12,
  "nodeTypeLabels": {
    "cabinet": { "label_ru": "Шкаф", "icon": "🗄" },
    "card":    { "label_ru": "Плата", "icon": "🔌" }
  }
}
```

Старое поле `nodesByType` оставлено без изменений для обратной
совместимости.

## Технические детали

### Таблица `graph_node_types`

```sql
CREATE TABLE IF NOT EXISTS graph_node_types (
  code VARCHAR(64) PRIMARY KEY,
  label_ru VARCHAR(128) NOT NULL,
  description TEXT,
  icon VARCHAR(16),
  sort_order INTEGER NOT NULL DEFAULT 100,
  is_builtin BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_graph_node_types_archived
  ON graph_node_types (is_archived);
```

`updated_at` обновляется триггером `trg_graph_node_types_set_updated_at`.

### Bootstrap встроенных типов

При каждом старте `kb-api` вызывается
`graphNodeTypeService.ensureBuiltinTypes()`, который для каждого
из 10 встроенных кодов (7 слоя сигналов + `equipment`/`fault`/
`solution` слоя памяти инженера) делает:

```sql
INSERT INTO graph_node_types (code, label_ru, description, icon, sort_order, is_builtin)
VALUES (...) 
ON CONFLICT (code) DO UPDATE SET is_builtin = TRUE
```

**Важно:** `ON CONFLICT DO UPDATE` обновляет **только** флаг
`is_builtin`. Если пользователь через UI переименовал «Шкаф» в
«Cabinet (англ.)» или поменял иконку, при следующем старте
`kb-api` эти правки **не перетираются**.

### Подсчёт `usage_count`

В `listTypes()` и `getTypeByCode()` усиление через LEFT JOIN:

```sql
SELECT t.*, COALESCE(u.usage_count, 0) AS usage_count
FROM graph_node_types t
LEFT JOIN (
  SELECT type AS code, COUNT(*)::int AS usage_count
  FROM graph_nodes
  WHERE is_archived = FALSE
  GROUP BY type
) u ON u.code = t.code
ORDER BY t.sort_order ASC, t.code ASC
```

Архивированные узлы (`is_archived = TRUE`) в счётчик не
включаются — их «логическое удаление» уже произошло, ссылка не
блокирует удаление типа.

### `graph_nodes.type` остаётся TEXT

В этой итерации `graph_nodes.type` намеренно **не** превращается
в FK на `graph_node_types.code`. Причины:

- Гибкость для парсеров: парсер может создать узел с любым
  типом, даже если тип ещё не добавлен в справочник.
- Скорость миграции: текущие профили (`metso_dna_rio`,
  `koyo_directlogic_pro`) уже работают с английскими кодами без
  FK.
- Соответствие подходу `graph_nodes.type` ≈ свободная строка
  (см. `docs/GRAPH_SCHEMA.md` → «Канонические типы узлов»).

Семантическая целостность — на уровне приложения (валидация UI,
warning'и парсера).

### AJV-валидация `builds` в профилях парсера

Раньше `builds` в `graph-parsers.yaml` валидировался enum'ом из 7
кодов:

```javascript
const ALLOWED_BUILDS = new Set(["object", "cabinet", ..., "device"]);
```

Теперь — open string array с проверкой паттерна
`^[a-z][a-z0-9_]*$`:

```javascript
const BUILD_CODE_REGEX = /^[a-z][a-z0-9_]*$/;
```

Это позволяет указывать в профиле любой код типа, в том числе
кастомный из БД. Реальная семантика — парсер.

### Warning `unknown_node_type` в парсере

В `xlsxParser.js` добавлена константа `PARSER_SUPPORTED_BUILDS`
с теми же 7 кодами. Функция `warnUnknownBuilds()` вызывается в
`parseMetsoStyle` (для `profile.builds`) и в `parseKoyoStyle`
(для `sheet.builds` внутри `per_sheet`):

```js
function warnUnknownBuilds(warningsMap, buildsList, contextLabel) {
  for (const code of buildsList ?? []) {
    if (typeof code !== "string") continue;
    if (PARSER_SUPPORTED_BUILDS.has(code)) continue;
    aggregateWarning(
      warningsMap,
      "unknown_node_type",
      "Этот тип узла не поддерживается парсером XLSX. Узлы будут пропущены.",
      contextLabel ? `${contextLabel}: ${code}` : code
    );
  }
}
```

Warning попадает в `ingestion_jobs.graph_report.warnings`.

### Wizard профилей парсера

При каждом открытии wizard'а делается `GET /api/v2/graph/node-types`,
результат пишется в `state.nodeTypes`. Функция `renderBuilds()`:

1. Берёт `state.nodeTypes`, фильтрует архивированные.
2. Сортирует по `sort_order`.
3. В режимах `metso`/`koyo` скрывает `object` (он только для
   `universal`).
4. Для каждого типа рендерит чекбокс с emoji-иконкой,
   `label_ru` и подсказкой `?` с описанием.
5. `value` чекбокса — английский `code`. В YAML профиля и в
   `graph_nodes.type` пишется именно код.

Если в БД ещё ничего нет (теоретически возможно — например, до
вызова bootstrap), `renderBuilds()` рендерит 7 встроенных кодов
как fallback.

## Ограничения и риски

- **Парсер XLSX не учит кастомные типы.** Если профиль ссылается
  на кастомный код в `builds`, парсер его пропустит и добавит
  warning. Полное расширение парсера на кастомные типы —
  отдельная будущая задача.
- **Сейчас нет audit-log изменений типов.** Только `updated_at`
  на строке таблицы.
- **`is_archived` для типов** есть в схеме, но UI его не
  использует: архивирование пока не нужно владельцу, удаление
  кастомных и невозможность удалить встроенные — достаточная
  политика. Архивирование можно включить через PUT body с
  `is_archived: true`, такие типы исчезают из wizard'а
  (`!is_archived`), но остаются в списке через GET — и из них
  можно безопасно вернуть видимость.
- **Иконка — короткая строка до 16 байт.** Один emoji (большинство
  emoji занимают 4 байта UTF-8) проходит. Сложные последовательности
  (ZWJ, флаги стран) могут не помещаться — это сознательное
  ограничение длины.

## История изменений

- 2026-05-18: #8.1.e — таблица `graph_node_types`, CRUD,
  UI-подвкладка «Типы узлов», русские лейблы в wizard'е парсера
  и в `/api/v2/graph/stats`. Парсер XLSX по-прежнему работает
  только со встроенными кодами; неизвестные коды попадают в
  `graph_report.warnings` под `unknown_node_type`. AJV-валидация
  `builds` в `graph-parsers.yaml` ослаблена с enum до паттерна
  `^[a-z][a-z0-9_]*$`. Подробности — этот документ.
