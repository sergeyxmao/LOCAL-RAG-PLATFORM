# Граф знаний: парсер XLSX

## Что делает

Автоматически наполняет граф знаний (узлы и связи, см.
`docs/GRAPH_SCHEMA.md`) из XLSX/XLS/XLSM файлов с таблицами
сигналов АСУ ТП. Парсер запускается **после** обычного RAG-pipeline
(чанки + эмбеддинги + Qdrant), не заменяет его — RAG продолжает
работать. Парсер устроен через **YAML-профили**: разные
производители ПЛК дают разную структуру таблиц, и под каждый формат —
свой профиль.

Если ни один профиль не подошёл, job всё равно завершается со
статусом `done`. В отчёте `graph_report` появляется `profile_id:
null` и warning «Профиль для графа не распознан». Граф для этого
документа остаётся пустым, RAG-индекс — есть.

## Расположение в коде

- Оркестратор: `apps/kb-api/src/services/graphIngestionService.js`
  (метод `parseAndIngest({ documentId, filePath, jobId })`).
- Подбор профиля: `apps/kb-api/src/services/graphParsers/profileMatcher.js`.
- Парсер XLSX: `apps/kb-api/src/services/graphParsers/xlsxParser.js`
  (два движка: `parseMetsoStyle` и `parseKoyoStyle`).
- Нормализация `signal_kind`:
  `apps/kb-api/src/services/graphParsers/signalKindNormalizer.js`.
- Маршрут ручного перезапуска: `apps/kb-api/src/routes/graphReparse.js`
  (`POST /api/v2/graph/reparse/:documentId`).
- UPSERT по бизнес-ключу: `GraphService.upsertNodeByBusinessKey()`
  + `PostgresProvider.findGraphNodeByBusinessKey()`.
- Конфиги: `config/graph-parsers.yaml` (профили) и
  `config/graph-aliases.yaml` (signal_kind).
- Отчёт сохраняется в колонке `ingestion_jobs.graph_report` (JSONB,
  добавлена через идемпотентный DDL в `ensureRuntimeSchema`).

## Иерархия узлов, которую строит парсер

```
Объект (object)             — заводится вручную, в XLSX обычно нет
  └─ Шкаф (cabinet)         — installed_in объекту
       └─ ПЛК (station)     — installed_in шкафу
            └─ Плата (card) — installed_in станции
                 └─ Канал (channel)  — связь card has_channel channel
                      └─ Сигнал (signal) — connected_to каналу
                            └─ Прибор (device) — signal measures device
```

Шкаф **выше** ПЛК: в одном шкафу может стоять несколько ПЛК
(резервированные пары, разные подсистемы). Это нюанс, который
учтён в иерархии.

Не все уровни обязательны — профиль решает, какие он строит
(`builds: [cabinet, station, card, channel, signal, device]`).

## Бизнес-ключи (UPSERT)

При повторном импорте того же файла узлы не дублируются — они
обновляются по бизнес-ключу. Метод `upsertNodeByBusinessKey()` в
graphService ищет существующий узел и либо обновляет его, либо
создаёт новый + parent-связь.

| Тип узла | Бизнес-ключ | Родительский контекст |
|---|---|---|
| `object` | `name` | — |
| `cabinet` | `attributes.cabinet_code` (+ object_id, когда появится object) | в рамках объекта |
| `station` | `attributes.station_code` + cabinet_id | в рамках шкафа |
| `card` | `attributes.address` + station_id | в рамках ПЛК |
| `channel` | card_id + `attributes.channel_number` | в рамках платы |
| `signal` | `attributes.tag` + station_id | в рамках ПЛК |
| `device` | `attributes.position` + station_id | в рамках ПЛК |

Поиск parent-узла — через связь `installed_in`/`has_channel`/
`connected_to` (см. `findGraphNodeByBusinessKey` в
`postgresProvider`). На существующий узел при UPSERT:

- `name`, `attributes` (merge через `||::jsonb`),
  `description`, `source_xlsx_sheet`, `source_xlsx_row` — обновляются.
- `source_document_id`, `confidence`, `author`, `created_at`,
  `is_archived` — **не перезаписываются** (это «первичный»
  источник; повторный импорт того же файла не меняет атрибуцию).

## Готовые профили

### `metso_dna_rio`

Для XLSX-файлов уровня
`DP-01_SAU-GPA-KC-3-АСУТП-ВД(WD)-…XLSX` — Metso DNA / Honeywell-
style RIO. На каждом листе — таблица сигналов одного шкафа
(`_IO-06`, `IO-07`, …). Сигнатура:

- расширение `.xlsx` / `.xlsm`,
- хотя бы один лист совпадает с `^_?IO-\d+`,
- в строке заголовков есть `LOOPTAG`, `ADDRESS`, `CARH_TYPE`.

Иерархия, которую строит: `cabinet → station → card → channel →
signal → device`.

### `koyo_directlogic_pro`

Для XLS/XLSX уровня `_Ъ_…xls` — Koyo DirectLogic / Productivity.
В файле обязательно 4 листа: `AI`, `AO`, `DI`, `DO`. Сигнатура:

- расширение `.xls` / `.xlsx`,
- все четыре листа присутствуют.

Иерархия: `cabinet → station → card → channel → signal`.
`signal_kind` задаётся per-sheet (на листе `AI` все сигналы — `AI`),
поэтому alias-таблица для Koyo не нужна.

**Forward-fill пустых ячеек Модуль/Место** (#8.1.b.fix). В реальных
koyo-таблицах столбцы `Модуль` и `Место` заполнены только в **первой
строке группы каналов**, для остальных строк значения «протягиваются»
визуально через объединённые ячейки. Парсер делает явный forward-fill:
если в текущей строке `card_type`/`card_slot` пустые, подставляются
значения из последней непустой строки **в пределах того же листа** (между
листами forward-fill не работает, так что F4-16AD-1 на листе AI не
перетекает в DI как D4-64ND2).

**Источник `station_code` / `cabinet_code`** (#8.1.b.fix, #8.1.b.fix-2).
Алгоритм выбора в три шага:

1. **Наиболее частотный префикс тегов.** Если в YAML профиля задан блок
   `cabinet.source: tag_prefix` с regex `cabinet.pattern` (по умолчанию
   `^([A-Za-z]+)_`), парсер обходит все листы `per_sheet`, вытаскивает
   префикс из каждого `tag` (например, из `SUO_AI_01` → `SUO`) и считает
   частоту каждого префикса. Префиксы, совпадающие (case-insensitive) с
   именем `signal_kind` (`AI`, `AO`, `DI`, `DO`, `AIN`, `AOUT`, `DIN`,
   `DOUT`), **исключаются** — это нотация листа (например, `AO_00` на
   листе AO), а не имя шкафа. Из оставшихся выбирается самый частотный
   префикс — это и есть `station_code` = `cabinet_code`. Если после
   фильтрации кандидатов нет — шаг считается неуспешным.
2. **Имя файла без timestamp-префикса.** От `filename_without_ext`
   отрезается префикс `^\d+-` (например,
   `1779132055097-СУО.xls` → `СУО`). Если что-то отрезалось — это
   `station_code`. `cabinet_code` остаётся `null`.
3. **Имя файла как есть.** Если оба предыдущих шага не сработали,
   `station_code = filename_without_ext`, `cabinet_code = null`.

Узел `cabinet` создаётся только если `cabinet_code` определён на шаге 1
(тогда `cabinet_code` совпадает с `station_code`). На шагах 2–3 узел
шкафа не создаётся, станция остаётся «без шкафа» — это допустимое
поведение.

**Header-leak detection** (#8.1.b.fix). Если на первой строке данных
обнаружены текстовые значения, совпадающие с метками заголовков
(≥ 2 совпадений — например, в колонке `Модуль` лежит слово «Модуль»,
а в `Место` — «Место»), парсер пропускает такую строку и добавляет в
`graph_report.warnings` запись `header_row_leak`. Это спасает от мусорных
узлов типа `card "Модуль (слот Место)"`, которые возникали, когда
layout `header_row` / `data_start_row` в YAML расходился с реальным
файлом.

**Дополнительные атрибуты сигнала** (#8.1.b.fix). Любая колонка в
`per_sheet.<sheet>.columns`, не входящая в «ядро»
(`tag`, `position`, `description`, `card_type`, `card_slot`,
`channel_number`, `signal_address`), попадает в `signal.attributes`
**только если её значение не пустое** (чтобы не плодить null-ключи).

Что добавлено в стандартный koyo-профиль:

- **AI:** `range_lo_lo`, `range_lo`, `range_hi`, `range_hi_hi`
  (адреса уставок), `range_break_addr` (адрес ошибки),
  `range_eu_addr` (адрес преобразованного значения в EU);
- **DI:** `bit_address` (бит X-входа), `coil_address` (C-катушка);
- **DO:** `output_address` (бит Y-выхода), `coil_address`;
- **AO:** `cal_4ma_addr`, `cal_20ma_addr` (калибровка),
  `pid_cv_addr`, `pid_eu_addr` (PID-регулятор), `range_break_addr`.

**Пропуск «Резерва»** теперь регистронезависим: правило
`description_matches:^Резерв` срабатывает на `Резерв`, `резерв`,
`РЕЗЕРВ`, `Резерв-1` и т.п.

## Алиасы для `signal_kind`

`config/graph-aliases.yaml` декларирует канонические значения
(`AI`, `AO`, `DI`, `DO`, `RTD`, `FI`, `RS`) и их написания в
разных форматах.

Парсер при сохранении сигнала пишет:

- `attributes.signal_kind_raw` — **всегда** ровно как в XLSX,
- `attributes.signal_kind` — каноническое значение **если
  нашли** или `null` если нет.

Когда `signal_kind = null`, парсер добавляет в `graph_report`
warning `signal_kind_unknown` с примерами:

```json
{
  "code": "signal_kind_unknown",
  "count": 2,
  "examples": ["HART", "Modbus RTU"],
  "hint": "Добавьте алиасы в config/graph-aliases.yaml..."
}
```

## Как использовать

### При импорте файла (автоматически)

```bash
# Через UI (Загрузка) или API
curl -X POST http://localhost:8787/jobs/queue \
  -H "Content-Type: application/json" \
  -d '{"items":[{"filename":"DP-01_…xlsx"}]}'
# затем PUT /jobs/:id/upload с multipart
```

После завершения:

```bash
curl http://localhost:8787/jobs?statuses=completed | jq '.items[0].graph_report'
```

Пример отчёта:

```json
{
  "ok": true,
  "profile_id": "metso_dna_rio",
  "summary": {
    "object":  { "created": 0, "updated": 0 },
    "cabinet": { "created": 1, "updated": 0 },
    "station": { "created": 1, "updated": 0 },
    "card":    { "created": 27, "updated": 0 },
    "channel": { "created": 215, "updated": 0 },
    "signal":  { "created": 215, "updated": 0 },
    "device":  { "created": 184, "updated": 0 }
  },
  "edges_created": 458,
  "warnings": [
    {
      "code": "signal_kind_unknown",
      "count": 12,
      "examples": ["HART"],
      "hint": "Добавьте алиасы..."
    }
  ],
  "started_at": "2026-05-17T18:30:00Z",
  "finished_at": "2026-05-17T18:30:14Z"
}
```

### Ручной перезапуск парсера

```bash
curl -X POST http://localhost:8787/api/v2/graph/reparse/<documentId>
```

Когда нужно:

- обновили профиль в `config/graph-parsers.yaml` и хотите
  применить к уже загруженному файлу;
- добавили алиас в `config/graph-aliases.yaml` и хотите, чтобы
  старые сигналы получили `signal_kind`;
- хотите перепроверить, не появились ли новые warnings.

Ответ: `{ ok: true, report: { ... } }` (тот же формат отчёта).

Ошибки:

- 404 — документа нет в БД;
- 400 — у документа расширение не `.xlsx`/`.xls`/`.xlsm`;
- 500 — исходный файл не найден на диске.

### Через UI

С #8.1.c — есть. В **Настройках → Граф знаний** можно:

- посмотреть список профилей, создать, отредактировать, удалить
  (с автодетектом стиля по образцу XLSX, dry-run preview и raw-режимом
  YAML);
- управлять алиасами `signal_kind` (добавлять новые формы написания
  без рестарта kb-api);
- перезапустить парсер для существующего документа кнопкой
  «Перепарсить граф» прямо в строке документа в «База знаний →
  Документы» (только для XLSX/XLS/XLSM).

Подробное описание UI и API — в `docs/GRAPH_PROFILES_UI.md`.

UI «Граф знаний» (просмотр узлов/связей самого графа) появится в #8.2.

## Как добавить новый профиль

1. Открыть исходный XLSX в Excel и понять структуру:
   - в какой строке заголовки;
   - где первая строка данных;
   - какие колонки соответствуют каким полям;
   - какой код шкафа / ПЛК прячется в названии листа или в
     отдельной ячейке.
2. Открыть `config/graph-parsers.yaml` и добавить новый блок в
   `profiles:` (после существующих профилей, иначе старые
   условия `match` могут перехватить файл).
3. Условия `match`:
   - `file_extensions`: список расширений;
   - `required_sheets`: листы, обязательные для совпадения
     (полный список или нет);
   - `sheet_name_pattern`: regex, должен совпасть хотя бы с
     одним листом;
   - `required_headers`: подстроки, которые должны быть в
     строке заголовков (нечувствительно к регистру и пробелам).
4. `layout.header_row` / `data_start_row` — номера строк
   (1-indexed).
5. `columns` — маппинг внутренних имён полей парсера на
   заголовки в XLSX. Парсер ищет:
   - точное совпадение нормализованного заголовка;
   - если нет — заголовок, содержащий искомую подстроку.
6. `builds` — список уровней, которые этот профиль строит:
   `[cabinet, station, card, channel, signal, device]`.
7. `cabinet` (опционально) — откуда брать код шкафа. Поддержаны
   два источника:
   - `source: sheet_name` — извлекать из имени листа по регэкспу
     `pattern` (используется в metso-профиле, лист `_IO-06` → `IO-06`);
   - `source: tag_prefix` — наиболее частотный префикс тегов среди всех
     листов `per_sheet` (например, `SUO_AI_01`, `SUO_DI_01` → `SUO`),
     исключая префиксы, совпадающие с `signal_kind` (`AI`/`AO`/`DI`/`DO`).
     Подходит для koyo-style, где код шкафа не виден в имени листа.
   В обоих режимах поддерживается `name_template` с подстановкой
   `{cabinet_code}`.
8. `skip_rows` — правила пропуска строк. Поддержано:
   `loop_tag_empty`, `loop_tag_matches:<regex>` (case-insensitive),
   `tag_empty`, `description_matches:<regex>` (case-insensitive).
9. Сохранить YAML, перезапустить `kb-api` (`docker compose
   restart kb-api`), загрузить тестовый XLSX, проверить
   `graph_report`.

## Что делать с непринятыми signal_kind

1. Открыть `config/graph-aliases.yaml`.
2. Найти подходящую каноническую группу (`AI`/`AO`/…).
3. Добавить новое написание в `aliases:`.
4. Перезапустить `kb-api`.
5. Для уже загруженных документов вызвать
   `POST /api/v2/graph/reparse/:documentId` — сигналы получат
   обновлённый `signal_kind`.

## Что НЕ делает парсер (намеренно)

- Не архивирует «исчезнувшие» узлы (если строка пропала из
  свежей версии XLSX). Это отдельное ТЗ.
- Не ведёт audit log изменений атрибутов (отдельное ТЗ).
- Не связывает узлы с разделами `knowledge_nodes` —
  RAG-чанки получают `node_ids`/`primary_node_id` как
  раньше, но граф живёт параллельно.
- Не запускает Ollama / эмбеддинги — нагрузка только на CPU.
- Не подключён к retrieval/answer (это #8.3).
- В koyo-профиле пока не читает лист «Общий» с описанием ПЛК
  (модель, версия прошивки и т.п.) — это запланировано в Шаге А.2.

## Идемпотентность и безопасность

- Парсер запускается **после** RAG-pipeline, в try/catch. Любая
  ошибка → warning в логах + `graph_report.ok = false`. RAG-
  индекс при этом сохранён.
- Битый YAML не валит kb-api: на старте — error в логах, при
  попытке парсинга — `graph_report.ok = false` с
  `config_errors`.
- При недоступности Postgres парсер тоже упадёт (вся БД упадёт),
  но это контролируется ingestionService — задача станет `failed`,
  графа просто не будет.
- Связи (`installed_in`, `has_channel`, `connected_to`,
  `measures`) идемпотентны на уровне БД через
  `UNIQUE(source, target, relation) + ON CONFLICT DO NOTHING`
  (см. `docs/GRAPH_SCHEMA.md`).

## Ограничения и риски

- Файлы > 50 МБ — парсер может занять >30 секунд на слабом
  ноутбуке. Это после RAG-pipeline, который и сам не быстрый.
- Если в XLSX отсутствует обязательная колонка (`LOOPTAG` для
  metso, `Tag` для koyo) — парсер не упадёт, но соответствующие
  узлы будут построены без этого поля. Все такие случаи
  попадают в warnings.
- Профили **порядково-чувствительны**: первый совпавший
  выбирается. Новые профили лучше класть **в конец** списка,
  чтобы они не перехватывали файлы, которые подходят под более
  специфичные.

## История изменений

- 2026-05-19: #8.1.b.fix-2 — cabinet_code/station_code определяются по
  частотному префиксу тегов (исключая AI/AO/DI/DO как ложные префиксы),
  а не по общему префиксу всех листов. Фикс для файлов, где один лист
  использует нотацию без префикса шкафа (напр. AO_00).
- 2026-05-19: #8.1.b.fix — баг-фиксы парсера koyo: forward-fill
  пустых ячеек Модуль/Место; детекция и пропуск «прорыва»
  строки заголовка в данные; корректное чтение `signal_address`
  и `description` на всех листах; станция и шкаф из
  tag_prefix вместо timestamp-имени файла; создание узла
  `cabinet` + связь `station→cabinet`; расширенные атрибуты
  сигналов (диапазоны AI: `range_lo_lo` / `range_lo` /
  `range_hi` / `range_hi_hi` / `range_break_addr` / `range_eu_addr`;
  биты DI/DO: `bit_address`, `output_address`, `coil_address`;
  калибровка AO: `cal_4ma_addr`, `cal_20ma_addr`, `pid_cv_addr`,
  `pid_eu_addr`); регистронезависимый `description_matches:^Резерв`
  и `loop_tag_matches`; NFC-нормализация заголовков.
- 2026-05-17: #8.1.b — парсер XLSX с YAML-профилями,
  2 рабочих профиля (`metso_dna_rio`, `koyo_directlogic_pro`),
  alias-конфиг для `signal_kind`, интеграция в
  `ingestionService` после RAG-pipeline, UPSERT по бизнес-
  ключу, endpoint `/api/v2/graph/reparse/:documentId`.
  Тестовые фикстуры — `tests/fixtures/*.xlsx|.xls`,
  генератор `tests/fixtures/generate-graph-fixtures.mjs`.
- 2026-05-17: #8.1.c — UI редактор профилей и алиасов с
  hot-reload и резервными копиями; dry-run preview;
  raw-режим YAML; кнопка «Перепарсить граф» в карточке
  документа. См. `docs/GRAPH_PROFILES_UI.md`.
