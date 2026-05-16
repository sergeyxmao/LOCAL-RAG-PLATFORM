# Бэкапы и восстановление

## Что включено в бэкап

- **PostgreSQL**: все таблицы (`documents`, `document_chunks`, `document_assets`,
  `ingestion_jobs`, `knowledge_nodes`, `knowledge_node_closure`,
  `document_node_links`, `chat_sessions`, `chat_messages`, `app_settings`, ...).
  Файл — `data/backups/backup_YYYYMMDD_HHMMSS.sql.gz` (gzip-сжатый дамп `pg_dump`).

## Что НЕ включено в бэкап

- **Qdrant (vector store)** — индексы векторов. Бэкап делается отдельно через
  Qdrant snapshots API; после восстановления Postgres из старого бэкапа может
  потребоваться «Пересобрать Qdrant» (`POST /admin/rebuild-qdrant`), чтобы
  векторные индексы совпали с метаданными.
- **Файлы документов** в `data/raw/`, `data/parsed/`, `data/assets/` — это
  исходники и парсинг-кэш. Бэкапятся отдельно через файловую систему (rsync,
  zip, и т.п.).

## Через UI

Доступно с полировки итерации 3:

1. Открыть `/ui/v2/settings` → блок «Бэкапы».
2. **«Создать бэкап»** — kb-api сохраняет дамп в
   `data/backups/backup_<timestamp>.sql.gz`. Прогресс отображается мини-плашкой
   («идёт создание…» → «бэкап создан: ... · 12.4 МБ»).
3. **Список последних бэкапов** с датой, размером, кнопками:
   - «Скачать» — отдаёт файл стримом (`Content-Type: application/gzip`).
   - «Восстановить» — двойное подтверждение (prompt со словом `ВОССТАНОВИТЬ` +
     confirm). После восстановления страница автоматически перезагружается.
   - «Удалить» — с подтверждением.
4. **«Восстановить из файла»** — загрузить `.sql` или `.sql.gz`, нажать
   «Восстановить», ввести слово `ВОССТАНОВИТЬ`.

Эндпоинты `/api/v2/backups/*` доступны напрямую, как и остальные
`/api/v2/*` (sessions, settings, ...) — это API нового UI, не legacy.
В проекте по архитектуре нет авторизации: он локальный, на одном ноуте,
без внешнего доступа. Если в будущем добавится сетевой доступ — нужно
будет вводить полноценную авторизацию сразу для всех `/api/v2/*`, а не
только бэкапов.

## Через REST API

```bash
# Список
curl http://localhost:8787/api/v2/backups
# → { ok: true, backups: [{ filename, size, createdAt }, ...] }

# Создать
curl -X POST http://localhost:8787/api/v2/backups
# → { ok: true, filename: 'backup_20260516_180000.sql.gz', size: 12345678, durationMs: 4200 }

# Скачать
curl -O http://localhost:8787/api/v2/backups/backup_20260516_180000.sql.gz/download

# Удалить
curl -X DELETE http://localhost:8787/api/v2/backups/backup_20260516_180000.sql.gz

# Восстановить из существующего файла
curl -X POST http://localhost:8787/api/v2/backups/backup_20260516_180000.sql.gz/restore \
  -H 'Content-Type: application/json' \
  -d '{"confirm":"ВОССТАНОВИТЬ"}'

# Восстановить из загружаемого файла (multipart)
curl -X POST http://localhost:8787/api/v2/backups/restore-upload \
  -F 'file=@./backup_20260516_180000.sql.gz' \
  -F 'confirm=ВОССТАНОВИТЬ'
```

## Через PowerShell-скрипты

- `scripts/backup.ps1` — создаёт бэкап в `data/backups/`.
- `scripts/restore.ps1 -File backup_*.sql.gz` — восстанавливает.

## Технические детали

- Бэкап делается через `pg_dump` (с флагами `--no-owner --no-privileges`), пайп
  в `gzip`, запись в файл. Запуск через `child_process.spawn`, без блокировки
  event loop.
- Восстановление — `gunzip -c` (если `.gz`) | `psql -v ON_ERROR_STOP=0`. После
  завершения `kb-api` повторно вызывает `ensureRuntimeSchema()` на случай, если
  бэкап старее текущей схемы.
- Имя файла валидируется по шаблону `backup_\d{8}_\d{6}\.sql(\.gz)?` — никаких
  `..`, `/`, `\` в имени.
- `pg_dump` и `psql` доступны в kb-api контейнере благодаря строке
  `apk add --no-cache postgresql16-client gzip` в `Dockerfile`.
- Папка `data/backups/` живёт внутри volume `data/`, который уже монтируется в
  `docker-compose.yml`.

## Важно

- Восстановление полностью заменяет содержимое PostgreSQL — текущие документы,
  чаты, настройки будут утеряны без отдельного бэкапа.
- После восстановления может потребоваться пересборка Qdrant (Настройки →
  Пересобрать Qdrant), потому что Qdrant не бэкапится этим механизмом.
- Файлы в `data/raw/` остаются нетронутыми.
- Эндпоинты `/api/v2/backups/*` доступны напрямую (без админ-флага), как и
  остальные `/api/v2/*` в проекте. Это сознательное решение: проект
  локальный, без сетевого доступа, авторизации нет ни для каких API.

## История изменений

- 2026-05-16: добавлен UI и REST API для бэкапов (полировка после итерации 3).
- 2026-05-16: hotfix — снят `adminFlagPreHandler` с `/api/v2/backups/*`.
  В предыдущей версии эндпоинты были по ошибке защищены тем же флагом, что
  и старый UI; из-за этого блок «Бэкапы» в новом `/ui/v2/settings` падал
  с сообщением «Эта страница перенесена…». Старый UI остался под флагом
  `?admin=1` как раньше — это две независимые группы.
