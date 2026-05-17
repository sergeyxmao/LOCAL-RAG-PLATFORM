# Operations

Короткая рабочая памятка по эксплуатации локальной RAG-системы.

## Основные адреса

- `Open WebUI`: `http://localhost:3000`
- `kb-api health`: `http://localhost:8787/health`
- `Консультант`: `http://localhost:8787/ui/consult`
- `Импорт`: `http://localhost:8787/ui/ingest`
- `Разделы базы`: `http://localhost:8787/ui/nodes`
- `Поиск по страницам PDF`: `http://localhost:8787/ui/pages-search`
- `Статусы задач`: `http://localhost:8787/ui/jobs`

## Базовые команды

Запуск:

```powershell
& C:\Users\serge\local-rag-platform\scripts\start.ps1
```

Теперь `scripts\start.ps1` сначала проверяет Ollama и, если тот не отвечает, пытается сам запустить `ollama serve`.

Остановка:

```powershell
& C:\Users\serge\local-rag-platform\scripts\stop.ps1
```

Проверка контейнеров:

```powershell
docker ps -a
```

Проверка здоровья API:

```powershell
Invoke-RestMethod -Uri http://localhost:8787/health
```

## Правильный сценарий импорта

### Для большой рабочей папки

1. Открыть `http://localhost:8787/ui/ingest`
2. Вставить папку:

```text
КС новая/Документация metsoDNA CR/2 Функциональные блоки
```

3. Оставить категории:

```text
metso,dna,functional-blocks
```

4. Включить фоновый режим
5. Для первого прохода выключить:
   - `Создавать карточки и предпросмотр PDF-страниц`
6. Следить за задачами на `http://localhost:8787/ui/jobs`

### Очистка дублей

На странице `http://localhost:8787/ui/ingest` теперь есть отдельный блок очистки дублей.

Как использовать:

1. Указать корневой путь, например:

```text
КС новая
```

2. Нажать `Показать дубли`
3. Проверить список групп
4. Нажать `Очистить дубли`

Что делает система:

- ищет одинаковые уже индексированные файлы по имени и типу
- оставляет самый свежий индекс
- удаляет старые записи из PostgreSQL и Qdrant

Это нужно после неудачных повторных импортов и тестовых переиндексаций.

### Остановка задачи

На странице `http://localhost:8787/ui/jobs` у выполняющихся задач есть кнопка `Остановить`.

Как это работает:

- задача получает статус `останавливается`
- текущий маленький batch заканчивается
- после этого задача переходит в `остановлено`
- частично записанные чанки и векторы для этой задачи очищаются автоматически

### Повтор задачи

Для задач со статусом `ошибка` или `остановлено` на странице `http://localhost:8787/ui/jobs` есть кнопка `Повторить`.

Как это работает:

- система берёт исходный путь файла из истории задачи
- очищает старый неполный индекс именно для этого файла
- запускает повторный импорт в фоновом режиме
- preview страниц по умолчанию не включается, чтобы повтор был безопаснее на слабом ноутбуке

### Удобная работа со страницей задач

На `http://localhost:8787/ui/jobs` теперь есть:

- фильтр `Только активные`
- фильтр `Только ошибки и остановки`
- выбор, сколько строк показывать: `25 / 50 / 100`
- поиск по имени файла
- автообновление каждые 10 секунд

Практический смысл:

- для обычной работы держать режим `Только активные`
- если что-то упало, переключаться в `Только ошибки и остановки`
- если история стала большой, не открывать `Все задачи` без необходимости

### Для одного важного PDF

1. Открыть `http://localhost:8787/ui/ingest`
2. Указать путь к одному PDF
3. Для точечного анализа можно включить:
   - `Создавать карточки и предпросмотр PDF-страниц`

### Точечный preview/OCR после лёгкого импорта

Если большой PDF уже импортирован без preview:

1. Открыть `http://localhost:8787/ui/pages-search`
2. Выбрать PDF-документ
3. В поле `Страницы для preview/OCR` указать, например:

```text
1-5, 12
```

4. Оставить `Preview` включённым
5. OCR оставить `выкл.` или выбрать `OCR если доступен`
6. Нажать `Создать preview/OCR`

OCR не отправляет документы наружу. Он использует только локальную команду `tesseract`, если она установлена в контейнере. Если `tesseract` не установлен, preview всё равно создаётся, а OCR помечается как недоступный.

### Визуальный поиск по PDF-страницам

На `http://localhost:8787/ui/pages-search` кнопка `Визуальный поиск` ищет только среди page assets классов:

- `scheme`
- `screen`
- `table`
- `signals`

Это лёгкий локальный визуальный слой: поиск идёт по тексту страницы, OCR-тексту при наличии и классификации страницы. Полноценные image embeddings для схем и картинок пока не включены, чтобы не перегрузить текущий ноутбук.

## Очистка тестовой базы

Если все загруженные документы были тестовыми и нужно начать с пустого проекта:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\reset-rag-content.ps1
```

Что очищается:

- документы, chunks, PDF page assets, jobs, query logs в PostgreSQL
- Qdrant collection `local_rag_chunks`
- файлы в `data/raw`, `data/parsed`, `data/assets`
- пользовательские разделы базы

Что сохраняется:

- схема PostgreSQL
- настройки
- системный раздел `Без раздела`
- код проекта и Docker volumes

API-вариант:

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://localhost:8787/admin/reset-content `
  -ContentType "application/json" `
  -Body '{"confirm":"RESET_LOCAL_RAG_CONTENT"}'
```

## Нормальная работа через браузер

### Консультант по документам

Основной рабочий браузерный режим теперь здесь:

- `http://localhost:8787/ui/consult`

Как проверять:

1. Выбрать документ или оставить `Все документы`
2. Выбрать область поиска:
   - `Все источники`
   - `Только текст`
   - `Только PDF-страницы`
3. Задать вопрос
4. Нажать `Получить ответ`

Что должно получиться:

- в блоке `Ответ` появляется grounded-ответ
- в блоке `Источники` показываются реальные найденные фрагменты
- для заведомо мусорного вопроса система должна честно вернуть:

```text
Для этого вопроса не найдено подходящих источников.
```

Это нормальное поведение. Оно лучше, чем выдуманный ответ без опоры на базу.

## Что делать, если импорт падает

Смотреть:

- `http://localhost:8787/ui/jobs`
- `docker logs localrag-kb-api --tail 100`
- `docker logs localrag-qdrant --tail 100`

Типовые причины:

- мало места на диске `C:`
- Docker engine завис после переполнения диска
- тяжёлый PDF слишком долго обрабатывается
- Ollama на хосте остановился, и тогда в задачах появляется `fetch failed`

## Что делать при ошибке `fetch failed`

1. Проверить, слушает ли Ollama порт:

```powershell
netstat -ano | Select-String 11434
```

2. Проверить, отвечает ли сервер:

```powershell
Invoke-RestMethod -Uri http://127.0.0.1:11434/api/tags
```

3. Если ответа нет, запустить Ollama вручную:

```powershell
Start-Process "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" -ArgumentList "serve" -WindowStyle Hidden
```

4. После этого снова запустить:

```powershell
& C:\Users\serge\local-rag-platform\scripts\start.ps1
```

## Что уже было найдено

На `2026-04-23` импорт больших PDF падал из-за нехватки места на диске, а не из-за модели:

```text
No space left on device: WAL buffer size exceeds available disk space
```

После очистки безопасных кэшей:

- `C:\Users\serge\.cache\whisper`
- `C:\Users\serge\AppData\Local\pip\cache`
- `C:\Users\serge\AppData\Local\Google\Chrome\User Data\Default\Cache`
- `%TEMP%`

свободное место на `C:` было восстановлено.

На `2026-04-24` было подтверждено, что:

- `Повторить` для остановленных/ошибочных задач работает
- `Остановить` корректно чистит частичные чанки и векторы
- повторный импорт `g2043_ru_04-3.pdf` завершился успешно

На `2026-04-25` было подтверждено, что:

- тяжёлый файл `g2043_ru_04-1.pdf` завершил импорт до `655 / 655`
- `/ui/consult` работает как основной браузерный режим вопросов по базе
- очистка дублей по `КС новая` показывает `0` активных дублей после чистки
- на нормальный вопрос система возвращает ответ по найденным источникам
- на мусорный вопрос система теперь возвращает `fallback-empty`, а не случайный нерелевантный фрагмент

## Быстрая проверка места на диске

```powershell
Get-PSDrive C
```

## Восстановление Qdrant после переполнения диска

Если `localrag-qdrant` постоянно перезапускается, а в логах есть `OffsetOutOfBounds`, сначала не удалять данные вручную.

Проверить статус:

```powershell
Invoke-RestMethod http://localhost:8787/admin/qdrant-status
docker logs localrag-qdrant --tail 100
```

Нормальный восстановленный статус выглядит так:

- `qdrant.ok = true`
- `qdrant.exists = true`
- `qdrant.status = green`
- `qdrant.pointsCount` совпадает с `postgresIndexed.totalCount`
- `qdrant.payloadIndexedFields` содержит поля `document_id`, `node_scope_ids`, `categories`, `asset_class`, `engineering_topics` и `signal_tags`

## Проверка разделов базы знаний

Полный smoke-прогон:

```powershell
node scripts/knowledge-nodes-smoke.mjs
```

Быстрые health-check endpoints:

```powershell
Invoke-RestMethod http://localhost:8787/admin/knowledge-nodes-status
Invoke-RestMethod http://localhost:8787/admin/qdrant-status
```

Нормальный статус `knowledge_nodes`:

- `status = ready`
- `progressPercent = 100`
- `nodeCountersMissingRows = 0`
- `qdrant.status = green`
- активных задач нет

Опасное удаление документов вместе с разделом доступно только через API и только с двойным подтверждением:

```powershell
Invoke-RestMethod -Method Delete `
  -Uri "http://localhost:8787/nodes/<node-id>?strategy=cascade_documents" `
  -ContentType "application/json" `
  -Body '{"confirm":"DELETE_DOCUMENTS_AND_NODE","confirmName":"Точное название раздела"}'
```

Через UI `/ui/nodes` штатно удаляются только пустые пользовательские разделы.

Безопасный dry-run переноса повреждённой коллекции:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\recover-qdrant-collection.ps1
```

После явного решения восстановить Qdrant:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\recover-qdrant-collection.ps1 -Apply
```

Скрипт не удаляет коллекцию, а переносит `workspace\qdrant_data\collections\local_rag_chunks` в `workspace\qdrant_recovery_backups`.

Затем проверить, сколько точек можно восстановить из PostgreSQL:

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://localhost:8787/admin/rebuild-qdrant `
  -ContentType "application/json" `
  -Body '{"dryRun":true}'
```

По умолчанию пересборка берёт только документы со статусом `indexed`. Это нормальный рабочий режим: старые failed/cancelled импорты не должны раздувать восстановление Qdrant.

Запуск фоновой пересборки Qdrant:

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://localhost:8787/admin/rebuild-qdrant `
  -ContentType "application/json" `
  -Body '{"dryRun":false,"confirm":"REBUILD_QDRANT","batchSize":25}'
```

Прогресс смотреть на `http://localhost:8787/ui/jobs`.

## Regression smoke для knowledge_nodes

После изменений в разделах базы, scoped search, Qdrant payload или UI-разделах можно прогнать безопасный smoke:

```powershell
node scripts\knowledge-nodes-smoke.mjs
```

Скрипт создаёт только временные разделы и документы с префиксом `kn-smoke-*`, проверяет 15 сценариев из `docs/knowledge-nodes-spec.md`, затем удаляет свои временные документы, Qdrant points и разделы. Рабочие документы АСУ ТП он не трогает.

На `2026-04-28` полный smoke прошёл `15/15`. Дополнительно проверены:

- `/ui/state` сохраняет и возвращает выбранный рабочий раздел;
- системный раздел `Без раздела` сохраняется с `includeChildren=false`;
- Qdrant после восстановления зелёный: `957` точек в `local_rag_chunks`;
- на `/ui/jobs` нет активных задач.

Live-статус готовности разделов базы:

```powershell
Invoke-RestMethod http://localhost:8787/admin/knowledge-nodes-status
```

Нормально, когда:

- `status = ready`;
- `progressPercent = 100`;
- `qdrant.pointsCount` совпадает с `postgresIndexed.totalCount`;
- все проверки в `checks` имеют `ok = true`.

То же самое видно на странице `http://localhost:8787/ui/nodes` в блоке `Готовность разделов базы`.

## Проверка Docker / WSL

```powershell
wsl -l -v
docker version
```

Если `docker-desktop` в состоянии `Stopped`, сначала поднять Docker Desktop, а уже потом импортировать документы.

## Что не надо делать

- Не запускать тяжёлую папку повторно много раз подряд
- Не включать preview страниц для всей большой папки на слабом ноутбуке как первый шаг
- Не судить о “зависании” только по PowerShell: всегда смотреть `/ui/jobs`

## Диагностика готовности системы

В новом UI v2: открыть `/ui/v2/settings` → вкладка **«Диагностика»** →
кнопка «Запустить проверки». 15 карточек со статусами OK / warning /
error и краткими деталями.

Ключевые проверки:

- **Системный раздел «Без раздела»** — должен быть ровно один активный.
- **Дерево разделов создано** — count активных узлов > 0.
- **Closure-таблица согласована** — узлов = self-ссылок в
  `knowledge_node_closure`.
- **Qdrant доступен** — `client.getCollections()` отвечает.
- **Qdrant совпадает с indexed PostgreSQL** — `points` ==
  `chunks + assets`. Если расходится — запустить «Пересобрать Qdrant»
  на вкладке «Обслуживание».
- **Payload-индексы Qdrant созданы** — должны быть `document_id`,
  `node_ids`, `categories`, `resource_type`. Создаются автоматически
  при первом импорте.
- **Активные фоновые задачи** — счётчик `running/queued` (включая
  pre-upload очередь без `document_id`).
- **Последняя синхронизация Qdrant** — `node_sync_status.last_error`
  должен быть пустым.

Эндпоинт: `POST /api/v2/diagnostics`. Не вызывает автозапросов —
только по нажатию кнопки.

## OCR для сканов

В новом UI v2: открыть `/ui/v2/settings` → вкладка «Сервисы» →
карточка **«OCR (распознавание сканов)»**.

- Чекбокс «Включить автоматический OCR для PDF-страниц без текста»
  (по умолчанию ВКЛ).
- Чекбокс «OCR для всех страниц PDF (медленно)» (по умолчанию ВЫКЛ).
- Индикатор доступности `tesseract` справа от заголовка.

Для уже загруженных документов без текста: на странице «База знаний →
Документы» кнопка `🔄` («Переиндексировать») в действиях документа.
Модалка подтверждения → старые chunks/points удаляются, документ
заново проходит pipeline, включая OCR (если включён).

OCR работает локально через `tesseract` (`rus+eng`) и `pdftoppm` из
poppler-utils. Никаких внешних сервисов.
