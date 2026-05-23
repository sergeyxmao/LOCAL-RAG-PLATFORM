# Ingestion Pipeline

raw -> parsed -> chunks -> embeddings -> qdrant -> metadata

## Параллелизм индексации (hotfix #11)

С hotfix #11 в `ingestionService` встроен серверный `Semaphore`
(`apps/kb-api/src/utils/semaphore.js`), который ограничивает,
сколько pipeline'ов
`extract → OCR → chunking → embeddings → Qdrant` бегут
одновременно. Лимит — `app_settings.indexing.concurrency` (1..4,
default 1). Меняется через
`PATCH /api/v2/settings/indexing` или UI «Параллелизм индексации»
в Настройки → Сервисы. `setMax(n)` применяется мгновенно к
ожидающим задачам.

Два уровня очереди:
- **Frontend upload concurrency** — раньше управлялся селектором
  «Параллелизм загрузки» на странице БЗ → Загрузка. **С #8.1.c.fix-2
  селектор удалён из UI**, очередь на фронте всегда последовательная
  (worker pool = 1) — пользовательский фронт не нужен для
  throughput, всё решает бэкенд.
- **Backend indexing concurrency** (`app_settings.indexing.concurrency`,
  1..4): сколько pipeline'ов реально работает в фоне. Защищает
  CPU, RAM и канал к Ollama. **Единственный** контрол, влияющий
  на скорость импорта — Настройки → Сервисы → Параллелизм
  индексации.

## Фазы задачи в `ingestion_jobs` и точная последовательность статусов

С hotfix #11 у каждой задачи помимо `status` есть `phase` — точное
состояние в pipeline. UI ориентируется на `phase`, а `status`
остаётся для совместимости и аналитики.

```
POST /jobs/queue
  └─→ INSERT status='queued', phase='awaiting_upload',
       document_id=NULL, pending_filename='...',
       pending_options={size, createVisualAssets, primaryNodeId, categories}
       (видно в /jobs как «ждёт загрузки»; удаляется без 409)

PUT /jobs/:id/upload (multipart, один файл в теле)
  ├─→ getJobById: проверяет status='queued' AND document_id IS NULL
  │   (если уже не queued — 409)
  ├─→ читает файл, пишет в data/raw/<timestamp>-<filename>
  ├─→ reply 202 (Accepted)
  └─→ runDetached: ingestionService.ingestFileFromRaw({existingJobId})
       │
       │  ┌─ withIndexingSlot(jobId, fn): ─────────────────────────┐
       │  │  1. updateJobPhase(jobId, 'awaiting_processing')        │
       │  │     (UI бейдж: «в очереди на индексацию»)               │
       │  │  2. await semaphore.acquire()                           │
       │  │  3. updateJobPhase(jobId, 'processing')                 │
       │  │     (UI бейдж: «идёт»)                                  │
       │  │  4. fn()                                                │
       │  │  5. release()                                           │
       │  └────────────────────────────────────────────────────────┘
       │
       ├─→ createDocument: документ создан
       ├─→ attachDocumentToJob(jobId, doc.id):
       │     UPDATE SET document_id = doc.id,
       │                pending_filename = NULL,
       │                pending_options = NULL,
       │                phase = CASE WHEN phase = 'awaiting_upload'
       │                             THEN 'awaiting_processing'
       │                             ELSE phase END
       ├─→ updateJobStartedAt(jobId):
       │     UPDATE SET started_at = NOW(),
       │                status = 'running',
       │                phase = 'processing'  (если был 'queued')
       └─→ ... основной pipeline (extract, OCR, chunks, embeddings) ...
            ├─→ при успехе: updateJobStatus(jobId, 'completed')
            │   → phase = 'done'
            ├─→ при ошибке: updateJobStatus(jobId, 'failed')
            │   → phase = 'done'
            └─→ при отмене: updateJobStatus(jobId, 'cancelled')
                → phase = 'done'
```

Состояния:

- **`phase='awaiting_upload'`** (`status='queued'`, `document_id IS NULL`) —
  pre-registered. Файл ещё не пришёл по сети.
  Лежит в `pending_filename` и `pending_options` (полировка #5, BB;
  видимость очереди — hotfix #10). Удаляется через DELETE без 409.
- **`phase='awaiting_processing'`** (`status='queued'`) — файл на
  диске, ждём свободный слот семафора индексации. UI показывает
  «в очереди на индексацию».
- **`phase='processing'`** (`status='running'`) — semaphore acquired,
  pipeline бежит. `started_at` заполнен.
- **`status='cancel_requested'`** — пользователь нажал «Отменить» во
  время processing; рабочий поток увидит флаг между batch'ами и
  завершится.
- **`phase='done'`** (`status='completed'/'failed'/'cancelled'`) —
  терминальное состояние. `finished_at` заполнен.

## Точки входа для импорта файла

| Эндпоинт | Когда используется | Создаёт job? |
|---|---|---|
| `POST /documents/upload` | Прямая загрузка одного файла | Да, fresh |
| `POST /documents/ingest-file` (sync) | Импорт из `data/raw` по пути | Да, fresh |
| `POST /documents/ingest-file-async` | Импорт в фоне | Да, fresh |
| `POST /documents/ingest-folder-async` | Импорт серверной папки | По файлу |
| `POST /jobs/queue` + `PUT /jobs/:id/upload` | Очередь UI v2 (BB) | Да, **переиспользует pre-registered** |
| `POST /jobs/:id/retry` | Повторить упавшую задачу | Да, fresh (delete старых doc-points) |

В сервисе `ingestionService.ingestFileFromRaw({existingJobId})` если
передан `existingJobId` — `createJob` не вызывается, вместо этого
`attachDocumentToJob(jobId, doc.id)` пристёгивает свежесозданный
документ, и `updateJobStartedAt` переводит `queued → running`.

## Извлечение текста из PDF: восстановление пробелов

`extractorService.extractPdfText` идёт по страницам PDF и собирает
текст из `textContent.items` (pdfjs-dist). Сборка вынесена в чистую
функцию `buildPageTextWithSpacing(items)` из
`apps/kb-api/src/services/pdfTextSpacing.js` — её можно покрыть
юнит-тестом без подключения pdfjs и без обращения к диску
(`tests/extractor-spacing.test.mjs`).

Раньше items склеивались через `.join(" ")` + `replace(/\s+/g, " ")`
— это давало пробелы только если pdfjs уже разделил куски пробелами.
На реальных документах (особенно русскоязычных PDF с встроенными
шрифтами без явных глифов пробела) pdfjs часто отдаёт соседние
слова отдельными items без пробелов между ними, либо одной длинной
строкой. В результате текст «слипался»
(«БлокACUимеетдвавхода»), что портило и semantic search
(размытые эмбеддинги), и lexical search (нет границ слов), и
качество ответов LLM (модель не видит факты в чанке).

Алгоритм восстановления пробелов:

1. **Координатный шаг (между items).** Для каждого item известны
   `transform[4]=x`, `transform[5]=y`, `width`, `height` и (при наличии)
   `hasEOL`. Между двумя соседними items вычисляется горизонтальный
   зазор `gap = currentX − (prevX + prevWidth)`. Если зазор больше
   ~25% от высоты шрифта (`fontHeight * 0.25`, эмпирическая ширина
   пробела) — между items вставляется пробел. Если у items
   отличается `y` (новая строка) или у предыдущего item был
   `hasEOL=true` — тоже пробел.
2. **Вторичная эвристика (внутри одного item).** Если pdfjs отдал
   целую слипшуюся фразу одним item-ом, координат для разбиения
   нет. Тогда `repairGluedSegment(str)` вставляет пробелы по
   границам:
   - кириллица↔латиница (в любую сторону): `БлокACU` → `Блок ACU`,
     `ACUимеет` → `ACU имеет`;
   - кириллическая буква↔цифра: `20мА` → `20 мА`,
     `напряжение220` → `напряжение 220`;
   - CamelCase строчная→ЗАГЛАВНАЯ только если обе буквы кириллические
     **и** перед заглавной стоит не менее трёх кириллических строчных
     подряд: `вышеЗначение` → `выше Значение`. Это защищает короткие
     единицы измерения (`мА`, `кВт`, `мкФ`) от ложных разрывов.
   - Латинские коды модулей (`AIU8H`, `BIU4`, `AIR8C`) и серийники
     (`A413165`) — **не трогаются**: правил «латиница+цифра» и Latin
     CamelCase в эвристике нет.
   - Эвристика срабатывает только если в item.str ≥20 символов
     и нет ни одного пробела внутри.

Ограничения:

- Если pdfjs отдал длинную чисто кириллическую строку одним item-ом
  без пробелов и без явных границ (например,
  `имеетдвааналоговыхпереключаемыхвхода` — серия русских строчных
  букв подряд), вторичная эвристика не разобьёт её — нет сигнала
  о границах слов. Это документированное ограничение.
- Фикс применяется только к новым импортам/переимпортам. Уже
  сохранённые чанки в PostgreSQL и векторы в Qdrant остаются
  прежними. Для применения к ранее загруженным документам
  использовать UI «Документы» → «Переиндексировать» или
  `POST /documents/:id/reindex`.

## Фаза OCR (полировка #6A)

После text-extraction в `ingestionService.ingestFileFromRaw` вызывается
`maybeRunOcr(extracted, {existingJobId})`:

1. Только для PDF (`sourceType === "pdf"`).
2. `extractorService.extractPdfText` возвращает массив `emptyPages` —
   страницы, на которых после нативного извлечения текста меньше 10
   символов (порог `PDF_EMPTY_PAGE_THRESHOLD`).
3. Если `emptyPages.length === 0` — OCR пропускается.
4. Если есть пустые страницы:
   - Читаем настройки `app_settings.ocr`:
     `{ autoOcrEmptyPages: boolean, ocrAll: boolean }`. По умолчанию
     `autoOcrEmptyPages: true`.
   - Если оба флага выключены — OCR пропускается.
   - Если `ocrAll: true` — OCR применяется ко всем страницам, иначе
     только к пустым.
5. `ocrService.isAvailable()` запускает `tesseract --version` и
   `pdftoppm -v` (5 сек таймаут). Если их нет в системе — OCR
   тихо пропускается (логируется warn).
6. Для каждой целевой страницы:
   - `pdftoppm -r 200 -png -f N -l N <pdf> <tmpdir>/page-N` —
     рендер в PNG (200 dpi, 60 сек таймаут).
   - `tesseract <png> - -l rus+eng --psm 6` — распознавание
     (30 сек таймаут на страницу).
   - Распознанный текст складывается в `Map<pageNumber, text>`.
   - `progress_message` существующей задачи обновляется как
     `OCR: страница X из Y`.
7. Результаты мерджатся: для каждой страницы выбирается оригинальный
   текст (если ≥10 симв.) либо OCR-результат. Итог пересобирается
   в `extracted.text` и `extracted.pageTexts`.
8. `extractorService.finalizeExtraction` пишет итоговый текст в
   `parsedRoot`. Дальше — обычный chunking pipeline.

OCR-инструменты ставятся в Dockerfile проекта
(`tesseract-ocr`, `tesseract-ocr-data-rus`, `tesseract-ocr-data-eng`,
`poppler-utils`). На локальной разработке должны быть установлены
вручную. Если их нет — OCR не блокирует основной flow, просто
пропускает фазу.

Производительность: ~1-3 секунды на страницу A4 200 dpi на типовом
CPU. PDF на 100 страниц со сканами — 2-5 минут OCR.

## Кнопка «Переиндексировать» документ

`POST /documents/:id/reindex` — удаляет старые chunks/points и
запускает свежий `ingestFileFromRaw({force: true, createVisualAssets: true})`
для того же исходного файла из `data/raw`. Сохраняются `categories`,
`nodeIds` и `primaryNodeId` (через
`postgresProvider.getDocumentNodeIds`). Полезно после включения OCR,
если документ был загружен раньше и остался без чанков.

Повторный импорт всегда идёт в **полном режиме** (с постраничными
визуальными ассетами) — после reindex у документа снова есть `page_count`,
работает «Найти страницы» и источники в ответах показывают «Страница N»
вместо «Фрагмент #N».

## Инвариант: полный режим по умолчанию

> **С 2026-05-23 (#8.1.c.fix-3) полный режим — единственный дефолт
> для всех точек входа импорта.** Это касается:
>
> - первичной загрузки из UI «База знаний → Загрузка»
>   (`POST /jobs/queue` + `PUT /jobs/:id/upload`);
> - переиндексации одного документа (`POST /documents/:id/reindex`);
> - повторного импорта из задачи (`POST /jobs/:id/retry`);
> - фонового импорта папок (`POST /documents/ingest-folder-async`).
>
> Раньше два бэкенд-эндпоинта (reindex и retry) были жёстко зашиты на
> `createVisualAssets: false` — это безвозвратно стирало `document_assets`
> при переимпорте: счётчик «N страниц» обнулялся, ломалась вкладка
> «Найти страницы», источники в ответах деградировали с «Страница N»
> до «Фрагмент #N». Эта зашитая ветка убрана.
>
> Параметр `createVisualAssets` **остаётся валидной опцией API** —
> бэкенд по-прежнему принимает `createVisualAssets: false` для
> ручных curl-сценариев, но НИГДЕ в коде он больше не используется
> как зашитый дефолт. Если параметр не передан — пайплайн идёт в
> полном режиме (`ingestionService.ingestFileFromRaw` дефолтит
> `createVisualAssets = true`).

### Что дают визуальные ассеты (`document_assets`)

- Счётчик страниц в UI «База знаний → Документы»
  (`page_count = COUNT(*) FROM document_assets WHERE document_id = d.id`).
- Вкладка «Найти страницы» (`/ui/pages-search`, `POST /search/visual`) —
  ищет по эмбеддингам страниц.
- Источники в ответах `/ui/consult` показывают «Страница N»
  (`buildAssetItems` / `localizePageTitle` в `documents.js` строят
  заголовок «Страница N» именно из `document_assets`). Без ассетов
  источник деградирует до «Фрагмент #N».
- В Qdrant под документ появляются точки страниц (`resource_type='asset'`)
  в дополнение к точкам чанков.

### Нагрузка полного режима

Полный режим рендерит каждую страницу PDF в PNG-превью и считает для
неё отдельный эмбеддинг — это CPU + место на диске. Это **осознанный
выбор проекта**: качество поиска и навигации по документам важнее
экономии ресурсов на временном ноутбуке.

Операционное предупреждение: при импорте очень больших папок учитывать
объём ассетов на диске (была историческая проблема
`No space left on device: WAL buffer size exceeds available disk space`).
Это **не повод** включать лёгкий режим, а повод контролировать
свободное место на `C:` перед массовым импортом — см.
`docs/OPERATIONS.md` и `.skills/operations-troubleshooting/SKILL.md`.

## Лёгкий режим импорта (createVisualAssets=false) — только как API-опция

> **Лёгкий режим — НЕ дефолт.** Он остаётся доступен только через явную
> передачу `createVisualAssets: false` в API (например, через curl).
> UI Загрузки всегда передаёт `true`, оба внутренних reindex/retry — тоже
> `true`.

### Что делает лёгкий режим

- Парсит документ, извлекает текст.
- Считает эмбеддинги и кладёт чанки в Qdrant (`document_chunks`).
- **Пропускает шаг создания page-ассетов**: для каждой PDF-страницы
  не делается превью-рендер в PNG, не создаётся запись в
  `document_assets`, не считается эмбеддинг страницы.

### Видимые последствия (by design, не баг)

- Колонка «Страниц» в UI «База знаний → Документы» показывает `0`,
  потому что значение `page_count` API считает как
  `COUNT(*) FROM document_assets WHERE document_id = d.id`. При
  лёгком режиме ассетов нет.
- Поиск по тексту работает корректно — чанки и их векторы созданы.
- Не работает «открыть страницу из источника» по превью (PNG нет).
- В Qdrant под документ появляются только точки чанков
  (`resource_type` отсутствует или равен `chunk`), не появляются
  точки страниц (`resource_type='asset'`).
- Карточка диагностики «Qdrant совпадает с indexed PostgreSQL»
  это учитывает: считает чанки и страницы отдельно.

### Когда использовать

В нормальной работе — **никогда**. Полный режим включён по умолчанию,
потому что без визуальных ассетов теряется визуальный поиск и
красивые ссылки на источники. Лёгкий режим оставлен как явная
API-опция исключительно для отладочных curl-сценариев.

### Когда НЕ использовать (то есть всегда в обычной работе)

- Документы со схемами, чертежами, изображениями: превью страниц
  нужны для визуального поиска и для подсветки источников в
  ответе.
- Документы, по которым планируется OCR: лёгкий режим всё равно
  ходит через OCR, но без визуальных ассетов нет возможности
  визуально проверить страницу.
- Любой документ, по которому пользователь будет задавать
  вопросы в `/ui/consult` — иначе источники придут как
  «Фрагмент #N».

### Возврат к полному режиму

Документ, случайно загруженный в лёгком режиме (например, ручным curl),
можно «достроить» через `POST /documents/:id/rebuild-visual-assets`
(выборочно по страницам) или полностью переиндексировать через
`POST /documents/:id/reindex` — он теперь всегда работает в полном
режиме и сам создаёт ассеты.

## Удаление документа при упавшем Qdrant (hotfix #12)

`DELETE /documents/:id` стал устойчив к временной недоступности
Qdrant: если первичная попытка `qdrantProvider.deletePoints(...)`
бросает ошибку (например, `ECONNREFUSED`), backend:

1. Логирует warn `Qdrant недоступен при удалении документа...`.
2. **Всё равно удаляет** документ, чанки, ассеты и привязки
   разделов из PostgreSQL (`deleteDocumentsByIds`).
3. Возвращает в ответе клиенту флаг `qdrantError` с текстом
   ошибки и поле `message` с подсказкой пользователю.
4. `removedVectors` в этом случае равен `0` — точки повиснут в
   Qdrant до следующего «Пересобрать Qdrant».

UI v2 «База знаний → Документы» при наличии `qdrantError`
показывает жёлтую плашку с рекомендацией запустить
«Пересобрать Qdrant» в Настройках → Обслуживание. Карточка
диагностики «Qdrant совпадает с indexed PostgreSQL» помогает
найти такие хвосты — у чанков/страниц будет несовпадение.

## XLSX и граф знаний (#8.1.b)

Для файлов с расширением `.xlsx`/`.xls`/`.xlsm` после успешного
RAG-pipeline запускается дополнительный шаг — **парсер графа
знаний**:

```
extract → OCR → chunking → embeddings → Qdrant → updateDocumentStatus("indexed")
   └─ runGraphParserIfApplicable(documentId, filePath, jobId)
        └─ graphIngestionService.parseAndIngest(...)
             ├─ выбирает YAML-профиль из config/graph-parsers.yaml
             ├─ парсит лист(ы) XLSX, нормализует signal_kind по
             │  config/graph-aliases.yaml
             ├─ UPSERT узлов (cabinet/station/card/channel/signal/device)
             │  по бизнес-ключу через graphService.upsertNodeByBusinessKey
             ├─ создаёт связи installed_in/has_channel/connected_to/measures
             │  идемпотентно (ON CONFLICT DO NOTHING)
             └─ пишет отчёт в ingestion_jobs.graph_report (JSONB)
→ updateJobStatus("completed")
```

Любая ошибка графа = warning в логах + `graph_report.ok = false`.
RAG-индекс при этом сохранён, job завершается как `completed`.

Подробности — `docs/GRAPH_INGESTION.md`.

## История изменений

- 2026-05-23: #8.1.c.fix-3 — убран зашитый лёгкий режим из двух
  бэкенд-эндпоинтов повторного импорта. `POST /documents/:id/reindex`
  (`apps/kb-api/src/routes/documents.js`) и `POST /jobs/:id/retry`
  (`apps/kb-api/src/routes/jobs.js`) больше не передают
  `createVisualAssets: false` в `ingestFileFromRaw`. Полный режим
  с постраничными визуальными ассетами теперь единственный дефолт
  для всех точек входа импорта (UI Загрузки уже был выровнен в
  #8.1.c.fix-2). Параметр `createVisualAssets` сохранён как валидная
  опция API — `false` принимается, если передан явно (например, через
  curl), но нигде не используется как зашитый дефолт. Это фиксит
  потерю `document_assets` при reindex: после переиндексации у
  документа снова есть `page_count > 0`, работает «Найти страницы»,
  источники в ответах показывают «Страница N» вместо «Фрагмент #N».
  Ветка `!shouldCreateVisualAssets` в `ingestionService` (для явного
  `false` через API) сохранена и не менялась.
- 2026-05-21: восстановление пробелов при извлечении текста из PDF.
  Чистая функция `buildPageTextWithSpacing` вынесена в
  `apps/kb-api/src/services/pdfTextSpacing.js` и подменяет наивную
  склейку `items.join(" ")` в `extractorService.extractPdfText`.
  Алгоритм: координатный шаг (пробел при `gap > fontHeight * 0.25`)
  + вторичная эвристика `repairGluedSegment` для длинных слипшихся
  кусков (границы кириллица↔латиница, кириллица↔цифра, кириллический
  CamelCase). Латинские коды модулей и серийники не трогаются.
  Юнит-тесты: `tests/extractor-spacing.test.mjs`
  (`node --test tests/extractor-spacing.test.mjs`, 22 теста).
  Применяется только к новым импортам — для существующих документов
  нужен переимпорт через UI «Документы» → «Переиндексировать».
- 2026-05-17: #8.1.b — после RAG-pipeline для XLSX/XLS/XLSM
  файлов запускается парсер графа знаний; отчёт парсера в
  `ingestion_jobs.graph_report` (JSONB). Подробности —
  `docs/GRAPH_INGESTION.md`.
- 2026-05-17: hotfix #12 — DELETE-устойчивость к недоступности
  Qdrant, корректная двух-метричная диагностика sync,
  документация лёгкого режима.
