# Reranker Service

## Что это

`apps/reranker-service` — Python-сервис (FastAPI + sentence-transformers),
который запускается в контейнере `localrag-reranker` и переоценивает кандидатов
после semantic+BM25 поиска по модели cross-encoder.

Сервис **опциональный**:

- если контейнер не поднят — `kb-api` автоматически делает fallback на
  эвристику или Jina (см. `docs/RETRIEVAL_PIPELINE.md`);
- если контейнер поднят, но модель ещё грузится — `kb-api` тоже сделает
  fallback на эвристику и явно отметит это в бейдже ответа.

## Модель

- По умолчанию: `BAAI/bge-reranker-base` (~278 М параметров, CPU-friendly).
- На более мощном железе можно поменять на `BAAI/bge-reranker-v2-m3` без
  правок кода — через env-переменную `MODEL` контейнера (см. `infra/.env.example`).
- Модель скачивается при первом старте и кэшируется в volume
  `workspace/reranker_cache:/data/hf-cache` — повторные старты быстрые.

## Эндпоинты

### `GET /health`

Возвращает живость и статус загрузки модели:

```json
{
  "ok": true,
  "status": "ok",
  "model": "BAAI/bge-reranker-base",
  "device": "cpu",
  "max_length": 512,
  "model_loaded": true,
  "model_load_error": null,
  "model_load_seconds": 14.2
}
```

`status` может быть `ok`, `loading` (модель ещё грузится — `/rerank` пока
ответит 503), `error` (ошибка загрузки, в `model_load_error` детали).

### `POST /rerank`

Формат запроса/ответа — совместим с Jina `/v1/rerank`, чтобы `kb-api`
использовал один и тот же HTTP-клиент для облака и локального сервиса.

Запрос:

```json
{ "query": "что такое HART?", "documents": ["...", "..."], "top_n": 6 }
```

Ответ:

```json
{
  "model": "BAAI/bge-reranker-base",
  "results": [
    { "index": 1, "relevance_score": 5.81 },
    { "index": 0, "relevance_score": -2.13 }
  ]
}
```

`relevance_score` — сырой score cross-encoder'а (logit), большее = более
релевантно. Сортировка по убыванию.

## Конфигурация контейнера

Через env (см. `infra/.env.example`):

| Переменная             | Дефолт                       | Назначение                                      |
| ---------------------- | ---------------------------- | ----------------------------------------------- |
| `MODEL`                | `BAAI/bge-reranker-base`     | Имя модели для `sentence-transformers`          |
| `DEVICE`               | `cpu`                        | `cpu` / `cuda` / `mps` — без правки кода        |
| `MAX_LENGTH`           | `512`                        | Максимум токенов на пару query/doc              |
| `RERANKER_PORT`        | `8090`                       | Внешний порт хоста                              |
| `RERANKER_LOCAL_URL`   | `http://localrag-reranker:8090` | URL, по которому kb-api ходит на reranker     |

Ограничения в `infra/docker-compose.yml`:

- `mem_limit: 2g`, `mem_reservation: 768m` — чтобы на пиках reranker не утянул
  весь стек на слабом ноутбуке.
- healthcheck — `curl /health` каждые 30 сек, `start_period: 120s` (модель
  может грузиться 1–2 минуты на холодном старте).

## Ограничения по железу

- **Слабый ноутбук (8 ГБ RAM, CPU без AVX-512):** `bge-reranker-base` на CPU
  обрабатывает 6–12 кандидатов за ~0.3–1.5 с. Для большего пула (например 30)
  ожидайте 3–5 секунд.
- **Память:** модель + рантайм занимают ~1.2–1.6 ГБ RSS. `mem_limit: 2g`
  оставляет запас.
- **Диск:** кэш модели ~700 МБ для `bge-reranker-base`, ~2.3 ГБ для
  `bge-reranker-v2-m3`.

## Как запустить только reranker

Из директории `infra/`:

```bash
docker compose up -d reranker
docker logs -f localrag-reranker  # увидеть загрузку модели
curl http://localhost:8090/health
```

Проверка с тестовыми документами:

```bash
curl -s -X POST http://localhost:8090/rerank \
  -H "Content-Type: application/json" \
  -d '{"query":"что такое HART?","documents":["HART — цифровой протокол поверх 4-20 мА","Modbus RTU использует RS-485"],"top_n":2}'
```

В ответе документ про HART должен получить заметно больший `relevance_score`.

## Как сменить модель

1. Остановить контейнер: `docker compose stop reranker`.
2. В `infra/.env` задать `RERANKER_MODEL=BAAI/bge-reranker-v2-m3`
   (или прокинуть `MODEL=...` напрямую).
3. Поднять заново: `docker compose up -d reranker`.
4. Первый запрос подождёт скачивания (~2.3 ГБ для v2-m3).

Код kb-api не зависит от имени модели — он отображает в бейдже то, что
вернёт `/health` или то, что записано в настройках.

## Что делать, если контейнер не нужен

Не запускать. `kb-api` в режиме «Эвристика» работает без reranker-сервиса,
в режимах «Jina»/«Локальный» при недоступности reranker'а делает fallback
на эвристику и явно отмечает это в бейдже под ответом и в логах warn.

---

История изменений:

- 2026-05-23 — создан документ: описание сервиса `localrag-reranker`,
  модели `BAAI/bge-reranker-base`, эндпоинтов `/health` и `/rerank`,
  переменных окружения, ограничений по RAM/CPU.
