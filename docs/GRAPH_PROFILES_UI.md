# Граф знаний: UI редактор профилей и алиасов

## Что делает

UI-редактор для управления YAML-конфигами парсера графа без правки
файлов вручную и без рестарта kb-api. Включает:

- список и CRUD профилей парсера (`config/graph-parsers.yaml`);
- список и CRUD канонических значений `signal_kind` и их алиасов
  (`config/graph-aliases.yaml`);
- режим прямого редактирования YAML с резервными копиями;
- dry-run проверку профиля на образце XLSX перед сохранением;
- кнопку «Перепарсить граф» в карточке документа.

После любой записи в YAML kb-api автоматически делает
`graphIngestionService.reloadConfigs()` — рестарт контейнера не нужен.

## Расположение в коде

| Слой | Файл |
|---|---|
| UI: вкладка «Граф знаний» в Настройках | `apps/kb-api/src/routes/uiV2Settings.js` (функции `renderGraphTabScript`, HTML-блок `data-settings-panel="graph"`, CSS-классы `.graph-…`) |
| UI: кнопка «Перепарсить граф» в карточке документа | `apps/kb-api/src/routes/uiV2Knowledge.js` (`confirmReparseGraph`, action `reparse-graph`) |
| API: CRUD профилей | `apps/kb-api/src/routes/graphProfiles.js` |
| API: CRUD алиасов | `apps/kb-api/src/routes/graphAliases.js` |
| API: ручной перепарс документа | `apps/kb-api/src/routes/graphReparse.js` (без изменений) |
| Сервис: чтение/запись YAML с round-trip и backup | `apps/kb-api/src/services/graphConfigService.js` |
| Сервис: dry-run preview парсера | `apps/kb-api/src/services/graphPreviewService.js` |
| YAML | `config/graph-parsers.yaml`, `config/graph-aliases.yaml` |
| Резервные копии | `data/config-backups/` (внутри контейнера: `/app/data/config-backups`) — путь переопределяется переменной окружения `GRAPH_CONFIG_BACKUP_DIR` |

## REST API

### Профили

| Метод | URL | Описание |
|---|---|---|
| `GET` | `/api/v2/graph/profiles` | Список профилей (плоские JS-объекты) |
| `GET` | `/api/v2/graph/profiles/raw` | Содержимое `graph-parsers.yaml` (строка) |
| `PUT` | `/api/v2/graph/profiles/raw` | Полная перезапись `graph-parsers.yaml` |
| `POST` | `/api/v2/graph/profiles/raw/validate` | Проверка YAML-текста без записи |
| `POST` | `/api/v2/graph/profiles/detect-style` | Автодетект стиля по образцу XLSX (multipart) |
| `POST` | `/api/v2/graph/profiles/test` | Dry-run парсера по образцу XLSX + черновому профилю (multipart) |
| `GET` | `/api/v2/graph/profiles/:id` | Получить один профиль |
| `POST` | `/api/v2/graph/profiles` | Создать новый профиль |
| `PUT` | `/api/v2/graph/profiles/:id` | Полная замена существующего профиля |
| `DELETE` | `/api/v2/graph/profiles/:id` | Удалить профиль |

Структурные правила (валидация):

- `id` — `^[a-z][a-z0-9_]*$`, до 96 символов. Не меняется при PUT.
- `description` — до 512 символов.
- `match` — обязательный, должен содержать хотя бы одно из:
  `file_extensions`, `sheet_name_pattern`, `required_headers`,
  `required_sheets`.
- `match.sheet_name_pattern` — валидный JavaScript regex.
- `layout.header_row`, `layout.data_start_row` — целые положительные.
- `builds` — массив строк из набора
  `{object, cabinet, station, card, channel, signal, device}`.
- Профиль должен содержать `columns` (metso-style) **или** `per_sheet`
  (koyo-style).

При ошибке валидации API возвращает 400 с массивом `details`.

### Алиасы

| Метод | URL | Описание |
|---|---|---|
| `GET` | `/api/v2/graph/aliases` | Карта `{ canonical: { description, aliases[] } }` |
| `GET` | `/api/v2/graph/aliases/raw` | Содержимое `graph-aliases.yaml` |
| `PUT` | `/api/v2/graph/aliases/raw` | Полная перезапись |
| `POST` | `/api/v2/graph/aliases/raw/validate` | Проверка YAML-текста |
| `GET` | `/api/v2/graph/aliases/:canonical` | Получить одно значение |
| `POST` | `/api/v2/graph/aliases` | Создать новое каноническое значение |
| `PUT` | `/api/v2/graph/aliases/:canonical` | Полная замена description + aliases |
| `DELETE` | `/api/v2/graph/aliases/:canonical` | Удалить каноническое значение |

Правила:

- `canonical` — `^[A-Za-z][A-Za-z0-9_-]*$`, до 64 символов.
- `description` — до 256 символов.
- `aliases[i]` — непустая строка до 128 символов.

### Ручной перепарс

`POST /api/v2/graph/reparse/:documentId` (без изменений с #8.1.b):
запускает парсер графа для документа, использует **текущие** профили
и алиасы. Если профиль для файла не найден — возвращает
`report.profile_id = null` с warning.

## Как пользоваться

### Создать новый профиль (UI)

1. Открыть **Настройки → Граф знаний → Профили парсера**.
2. Нажать **«Создать профиль»**.
3. **(Опционально)** прикрепить образец XLSX. После загрузки UI
   делает автодетект:
   - ≥ 2 листа из набора `{AI, AO, DI, DO, AIN, AOUT, DIN, DOUT}` →
     koyo-style;
   - иначе → metso-style.
   Стиль можно переключить вручную.
4. Заполнить **ID профиля** (snake_case латиницей), описание.
5. **Условия match** — расширения, опц. regex имени листа,
   опц. список обязательных заголовков/листов.
6. **layout** — номера строк с заголовком и первой строкой данных.
7. **builds** — какие уровни иерархии создавать.
8. **cabinet** (только metso) — regex для извлечения кода шкафа из
   имени листа и шаблон имени.
9. **columns** — JSON-объект `{ внутреннее_поле: "Заголовок в XLSX" }`.
   Сравнение нечувствительно к регистру и пробелам.
10. **per_sheet** (только koyo) — JSON-объект
    `{ "AI": { builds, signal_kind, columns }, ... }`.
11. **«Проверить профиль»** — UI делает dry-run на прикреплённом
    образце и показывает summary, warnings, первые 10 сигналов.
    Узлы в граф не создаются.
12. **«Сохранить»** — UI делает POST, kb-api создаёт backup
    `graph-parsers.yaml.YYYYMMDD-HHMMSS.bak`, записывает YAML,
    вызывает `reloadConfigs()`. Новый профиль активен сразу.

### Редактировать профиль (UI)

То же, но `ID` заблокирован для изменений. PUT полностью заменяет
поля, кроме `id`.

### Raw-режим YAML

Кнопка **«Редактировать YAML напрямую»** открывает модалку с
`<textarea>` на содержимое файла. Кнопки:

- **«Проверить синтаксис»** — POST на `…/raw/validate`. Возвращает
  понятное русское сообщение об ошибке (с указанием строки/колонки,
  если парсер их даёт).
- **«Сохранить»** — PUT на `…/raw`. Перед записью kb-api валидирует
  структуру; при ошибке файл на диске **не меняется**.

Комментарии в файле сохраняются при записи структурированных правок
через `…/profiles/:id` или `…/aliases/:canonical`, потому что сервис
использует пакет [`yaml`](https://www.npmjs.com/package/yaml)
(eemeli/yaml) с Document API — round-trip сохраняет комментарии и
форматирование. В raw-режиме комментарии сохраняются как есть —
запись идёт текстом «как набрано».

### Алиасы signal_kind

Подвкладка **«Алиасы signal_kind»** показывает каждое каноническое
значение (AI/AO/DI/DO/RTD/FI/RS) с описанием и списком
поддерживаемых форм написания. Действия:

- **«Добавить значение»** — создать новое каноническое имя
  (например, `PFC` для шим-выходов) с собственным набором алиасов.
- **«Изменить»** — поменять описание и/или список алиасов
  (textarea, одна форма на строку).
- **«Удалить»** — удаляет всё каноническое значение. Сигналы с
  этим `signal_kind` после удаления при следующем перепарсе
  получат `signal_kind = null` (если нет другого канона, который
  захватит их по prefix-match).

### Перепарсить граф из карточки документа

В **База знаний → Документы** строка XLSX/XLS-документа содержит
дополнительную иконку (граф) с tooltip **«Перепарсить граф»**.
Для PDF/DOCX/TXT иконка скрыта.

Клик → модалка подтверждения → `POST /api/v2/graph/reparse/:id` →
toast с числами:

> Граф обновлён. Профиль: metso_dna_rio. Создано: 0, обновлено: 12,
> связей: 23.

Полный отчёт парсера отображается в дополнительной модалке (то же,
что приходит в ответе сервера).

Если профиль не распознан — toast-предупреждение со ссылкой на
вкладку «Граф знаний».

## Технические детали

### Round-trip YAML с комментариями

`graphConfigService` использует пакет [`yaml`](https://eemeli.org/yaml/v2/),
не `js-yaml`. Для каждой операции редактирования:

1. Файл читается через `parseDocument(text)` — возвращает `Document`
   с сохранённой структурой комментариев и якорей.
2. Поиск элемента — по `id` (для профилей) или ключу (для алиасов)
   через `findItemIndexById(seqNode, id)` или `doc.get('signal_kind').get(canonical)`.
3. Изменение — через `seq.set(idx, plain)` / `map.set(key, value)`.
4. Сериализация — `doc.toString()`, комментарии и форматирование
   сохраняются.

В raw-режиме запись идёт как простая текстовая запись (комментарии
тоже сохраняются — как уже находятся в тексте).

### Резервные копии

Перед каждой записью YAML kb-api делает backup в
`/app/data/config-backups/` (на хосте: `data/config-backups/`):

- имя: `graph-parsers.yaml.YYYYMMDD-HHMMSSMS.bak` или
  `graph-aliases.yaml.YYYYMMDD-HHMMSSMS.bak` (UTC, миллисекунды
  в хвосте — чтобы две операции в одну секунду не делили имя);
- хранятся последние **10** копий каждого файла; старые удаляются
  автоматически (lexicographic sort, отрезаем хвост).

Путь переопределяется переменной окружения
`GRAPH_CONFIG_BACKUP_DIR`. По умолчанию — `${DATA_ROOT}/config-backups`.

### Hot-reload

После каждой записи через API вызывается
`graphIngestionService.reloadConfigs()`. Он повторно читает YAML
через `loadGraphConfigs()` и пересобирает signal_kind matcher.
Активные парсы (запущенные до изменения) дорабатывают со старыми
конфигами; следующие парсы — уже с новыми.

### Dry-run preview

`POST /api/v2/graph/profiles/test`:

1. Получает multipart с файлом и JSON-строкой профиля.
2. Сохраняет файл во временный путь `os.tmpdir()/graph-preview-<uuid>.xlsx`.
3. Вызывает `parseWorkbookWithProfile()` напрямую — парсер возвращает
   JS-объекты узлов, **не делает** ни одного UPSERT, потому что
   `parseWorkbookWithProfile()` сам по себе вообще не общается с БД
   (это делает только `graphIngestionService.parseAndIngest()`).
4. Считает summary по типам узлов и возвращает первые 10 сигналов
   как пример.
5. Удаляет временный файл.

Никакого изменения в БД не происходит — preview безопасен.

### Автодетект стиля

`POST /api/v2/graph/profiles/detect-style`:

1. Читает workbook через `readWorkbook(tempPath)`.
2. Считает листы, имена которых нормализованно (lowercase, trim)
   попадают в `{ai, ao, di, do, ain, aout, din, dout}`.
3. Если найдено **≥ 2** — стиль `koyo`; иначе — `metso`.
4. Возвращает список листов с превью первых 6 строк по 16 ячеек
   (чтобы UI мог показать пользователю, что в файле).

### Идемпотентность и безопасность

- Все YAML-операции — атомарные: `fs.writeFile(...)` после успешной
  валидации. Если валидация падает — файл не меняется.
- Backup создаётся **до** записи: если запись прервалась, на диске
  остаётся backup предыдущей валидной версии.
- Reload конфига обёрнут в try/catch: если reload упал —
  graphIngestionService продолжает работать со старым конфигом, но
  следующий запуск парсера прочитает новый.
- Все user-input строки валидируются на длину и формат на уровне
  Fastify schema (AJV).

## Ограничения и риски

- На очень больших образцах XLSX (> 5 МБ) `test`/`detect-style`
  отклоняют файл (`413 Payload Too Large`). Это сделано намеренно —
  preview должен быть быстрым.
- Параллельные правки YAML через UI и текстовый редактор на хосте
  могут конфликтовать. Last-write wins. Backup помогает откатиться.
- При удалении канонического значения `signal_kind` сигналы с этим
  значением **не обновляются автоматически** — нужно вручную сделать
  reparse тех документов, в которых были эти значения, через
  «Перепарсить граф».
- Раскраска синтаксиса в raw-режиме намеренно **не реализована**
  (CSS-only). Кнопка «Проверить синтаксис» компенсирует.
- `graph_report` старых job-ов в БД не пересчитывается, когда
  меняешь YAML. Reparse через кнопку обновляет узлы графа, но не
  переписывает старый report в `ingestion_jobs.graph_report`.

## История изменений

- 2026-05-17: #8.1.c — UI редактор профилей, алиасов, dry-run
  preview, raw-режим YAML, кнопка «Перепарсить граф» в карточке
  документа. Резервные копии в `data/config-backups/` (последние 10).
  Round-trip комментариев через пакет `yaml` (eemeli/yaml).
