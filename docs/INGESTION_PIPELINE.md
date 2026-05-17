# Ingestion Pipeline

raw -> parsed -> chunks -> embeddings -> qdrant -> metadata

## Фазы задачи в `ingestion_jobs`

```
queued (pre-upload)  --PUT /jobs/:id/upload-->  running  --done-->  completed
                                                        \--err-->   failed
                                                        \--cancel-> cancelled
```

- **`queued` + `document_id IS NULL`** — pre-registered, файл ещё не
  загружен. Запись создана через `POST /jobs/queue` со списком
  метаданных (имя файла, размер, целевой узел, флаг превью). В этой
  фазе `pending_filename TEXT` и `pending_options JSONB` хранят
  параметры будущей загрузки. Задача удаляется мгновенно через
  `DELETE /jobs/:id` без 409 (полировка #5, BB).
- **`queued` + `document_id IS NOT NULL`** — обычное «queued» из
  старого flow (документ создан, очередь до старта pipeline). Удаление
  возвращает 409 — сначала надо отменить.
- **`running`** — pipeline идёт. `started_at` заполнен. `total_items`
  и `processed_items` отслеживают прогресс. Отмена через
  `POST /jobs/:id/cancel` ставит `cancel_requested`.
- **`completed` / `failed` / `cancelled`** — терминальные. `finished_at`
  заполнен. Можно удалять через `DELETE /jobs/:id` без подтверждения
  на стороне БД.

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
