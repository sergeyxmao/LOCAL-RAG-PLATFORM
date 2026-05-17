# Ingestion Pipeline

raw -> parsed -> chunks -> embeddings -> qdrant -> metadata

## Фазы задачи в `ingestion_jobs` и точная последовательность статусов

```
POST /jobs/queue
  └─→ INSERT status='queued', document_id=NULL, pending_filename='...',
       pending_options={size, createVisualAssets, primaryNodeId, categories}
       (видно в /jobs как «ожидает»; удаляется без 409)

PUT /jobs/:id/upload (multipart, один файл в теле)
  ├─→ getJobById: проверяет status='queued' AND document_id IS NULL
  │   (если уже не queued — 409)
  ├─→ читает файл, пишет в data/raw/<timestamp>-<filename>
  ├─→ reply 202 (Accepted)
  └─→ runDetached: ingestionService.ingestFileFromRaw({existingJobId})
       ├─→ createDocument: документ создан
       ├─→ attachDocumentToJob(jobId, doc.id):
       │     UPDATE ingestion_jobs SET document_id = doc.id,
       │                                pending_filename = NULL,
       │                                pending_options = NULL
       ├─→ updateJobStartedAt(jobId):
       │     UPDATE SET started_at = NOW(),
       │                status = CASE WHEN status='queued' THEN 'running'
       │                              ELSE status END
       └─→ ... основной pipeline (extract, OCR, chunks, embeddings) ...
            ├─→ при успехе: updateJobStatus(jobId, 'completed')
            ├─→ при ошибке: updateJobStatus(jobId, 'failed', error.message)
            └─→ при отмене: updateJobStatus(jobId, 'cancelled')
```

Состояния:

- **`queued` + `document_id IS NULL`** — pre-registered. Файл ещё не
  пришёл по сети. Лежит в `pending_filename` и `pending_options`
  (полировка #5, BB; видимость очереди — hotfix #10).
- **`queued` + `document_id IS NOT NULL`** — переходное состояние:
  документ создан, но `started_at` ещё не выставлен. Длится
  миллисекунды, на практике невидимо для UI.
- **`running`** — pipeline активен, `started_at` заполнен.
- **`cancel_requested`** — пользователь нажал «Отменить» во время
  `running`; рабочий поток увидит флаг между batch'ами и завершится.
- **`completed` / `failed` / `cancelled`** — терминальные, `finished_at`
  заполнен.

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
