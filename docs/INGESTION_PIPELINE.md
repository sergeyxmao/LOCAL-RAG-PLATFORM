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
- **Frontend upload concurrency** (`localrag.upload.concurrency`,
  1..3): сколько `PUT /jobs/:id/upload` лезет на сервер
  одновременно. Защищает сеть и фронтовый UI.
- **Backend indexing concurrency** (`app_settings.indexing.concurrency`,
  1..4): сколько pipeline'ов реально работает в фоне. Защищает
  CPU, RAM и канал к Ollama.

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
запускает свежий `ingestFileFromRaw({force: true})` для того же
исходного файла из `data/raw`. Сохраняются `categories`,
`nodeIds` и `primaryNodeId` (через
`postgresProvider.getDocumentNodeIds`). Полезно после включения OCR,
если документ был загружен раньше и остался без чанков.

## Лёгкий режим импорта (createVisualAssets=false)

При импорте через UI «База знаний → Загрузка» доступен флаг
«Лёгкий режим (без превью страниц)». По умолчанию **выключен**;
в `POST /documents/:id/reindex` он, наоборот, включён по умолчанию,
чтобы быстро переиндексировать без перерисовки картинок.

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

- Массовая первичная загрузка большой папки (>50 файлов) —
  экономит 10–30% времени и заметно меньше нагружает диск.
- Документы, которые точно не понадобится открывать постранично
  (логи, регламенты, текстовые таблицы).

### Когда НЕ использовать

- Документы со схемами, чертежами, изображениями: превью страниц
  нужны для визуального поиска и для подсветки источников в
  ответе.
- Документы, по которым планируется OCR: лёгкий режим всё равно
  ходит через OCR, но без визуальных ассетов нет возможности
  визуально проверить страницу.

### Возврат к полному режиму

Документ, загруженный в лёгком режиме, можно «достроить» через
`POST /documents/:id/rebuild-visual-assets` (выборочно по
страницам) или полностью переиндексировать в обычном режиме
через `POST /documents/:id/reindex` с
`{createVisualAssets: true}`.

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

- 2026-05-17: #8.1.b — после RAG-pipeline для XLSX/XLS/XLSM
  файлов запускается парсер графа знаний; отчёт парсера в
  `ingestion_jobs.graph_report` (JSONB). Подробности —
  `docs/GRAPH_INGESTION.md`.
- 2026-05-17: hotfix #12 — DELETE-устойчивость к недоступности
  Qdrant, корректная двух-метричная диагностика sync,
  документация лёгкого режима.
