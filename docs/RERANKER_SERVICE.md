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
- Альтернатива на CPU слабого ноута — `Qwen/Qwen3-Reranker-0.6B`
  (cross-encoder, ~600 М параметров). По релевантности на русско-английских
  технических текстах обычно даёт лучший top-1, но на CPU тяжелее bge:
  ожидайте 25–40 с на запрос с пулом 10–20 кандидатов. Требует увеличенного
  таймаута `RERANKER_TIMEOUT_MS` (см. ниже).
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
| `MODEL`                | `BAAI/bge-reranker-base`     | Имя модели для `sentence-transformers`. Альтернатива: `Qwen/Qwen3-Reranker-0.6B`. |
| `DEVICE`               | `cpu`                        | `cpu` / `cuda` / `mps` — без правки кода        |
| `MAX_LENGTH`           | `512`                        | Максимум токенов на пару query/doc              |
| `RERANKER_PORT`        | `8090`                       | Внешний порт хоста                              |
| `RERANKER_LOCAL_URL`   | `http://localrag-reranker:8090` | URL, по которому kb-api ходит на reranker     |
| `RERANKER_TIMEOUT_MS`  | `45000`                      | Таймаут HTTP-запроса kb-api к reranker'у (мс). Должен покрывать реальное время инференса на текущем железе, иначе сработает fallback на эвристику. |

Ограничения в `infra/docker-compose.yml`:

- `mem_limit: 2g`, `mem_reservation: 768m` — чтобы на пиках reranker не утянул
  весь стек на слабом ноутбуке.
- healthcheck — `curl /health` каждые 30 сек, `start_period: 120s` (модель
  может грузиться 1–2 минуты на холодном старте).

## Ограничения по железу

- **Слабый ноутбук (8 ГБ RAM, CPU без AVX-512):**
  - `bge-reranker-base` на CPU реально обрабатывает пул 10–20 кандидатов за
    15–30 с (не 0.3–1.5 с — старая оценка была для тёплого процессора и
    пула 6–12). Поэтому таймаут kb-api поднят до 45 с (`RERANKER_TIMEOUT_MS`).
  - `Qwen/Qwen3-Reranker-0.6B` на том же CPU — 25–40 с.
- **Память:** модель + рантайм занимают ~1.2–1.6 ГБ RSS для bge, ~2.5–3 ГБ
  для Qwen3-Reranker-0.6B. Для Qwen3 поднимите `mem_limit` в
  `infra/docker-compose.yml` до 3–4 ГБ.
- **Диск:** кэш модели ~700 МБ для `bge-reranker-base`, ~2.3 ГБ для
  `bge-reranker-v2-m3`, ~1.2 ГБ для `Qwen/Qwen3-Reranker-0.6B`.

## Таймаут kb-api → reranker

На слабом CPU инференс cross-encoder'а на 10–20 парах query/doc легко
занимает 15–30 с. Если таймаут kb-api меньше — клиент рвёт соединение
ещё до того, как сервис успевает ответить, и сработает fallback на
эвристику. По логам это видно так:

- в kb-api — `Reranker не ответил вовремя` / `code=timeout`;
- в reranker-сервисе — `Batches: 100%` приходит уже после того, как
  клиент отключился (запрос всё равно досчитывается).

Дефолт `RERANKER_TIMEOUT_MS=45000` мс — настраивается через env, не
требует правки кода. На GPU/быстром CPU значение можно снизить до
5000–8000.

> ⚠️ Логика fallback на эвристику в `searchService.rerankItems` намеренно
> сохранена: она нужна на случай реальной недоступности reranker-сервиса
> (контейнер не поднят, OOM, ошибка модели). Меняется только таймаут —
> чтобы fallback не срабатывал ложно из-за медленного CPU.

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
2. В `infra/.env` задать `RERANKER_MODEL=<HF-идентификатор>`
   (или прокинуть `MODEL=...` напрямую). Варианты:
   - `BAAI/bge-reranker-base` — дефолт, легче всех.
   - `BAAI/bge-reranker-v2-m3` — точнее, тяжелее (~2.3 ГБ).
   - `Qwen/Qwen3-Reranker-0.6B` — точнее на технических русско-английских
     запросах, но на CPU слабого ноута 25–40 с на запрос. Убедитесь, что
     `RERANKER_TIMEOUT_MS` ≥ 45000.
3. Поднять заново: `docker compose up -d reranker`.
4. Первый запрос подождёт скачивания модели (~700 МБ – 2.3 ГБ в зависимости
   от выбора). Прогресс виден в `docker logs -f localrag-reranker`.

Код kb-api не зависит от имени модели — он отображает в бейдже то, что
вернёт `/health` или то, что записано в настройках.

### Пример переключения на Qwen3-Reranker-0.6B

```bash
# infra/.env
RERANKER_MODEL=Qwen/Qwen3-Reranker-0.6B
RERANKER_TIMEOUT_MS=45000   # обязательно: на CPU 25–40 с
```

```bash
cd infra
docker compose stop reranker kb-api
docker compose up -d reranker kb-api
docker logs -f localrag-reranker   # дождаться "model loaded in ..."
curl http://localhost:8090/health  # status: ok, model: Qwen/Qwen3-Reranker-0.6B
```

Затем в `/ui/consult` выбрать провайдера reranking «локальный» и задать
вопрос — бейдж под ответом должен показать «reranking: локальный
(Qwen/Qwen3-Reranker-0.6B)», без пометки «(запасной)».

## Что делать, если контейнер не нужен

Не запускать. `kb-api` в режиме «Эвристика» работает без reranker-сервиса,
в режимах «Jina»/«Локальный» при недоступности reranker'а делает fallback
на эвристику и явно отмечает это в бейдже под ответом и в логах warn.

---

История изменений:

- 2026-05-23 — создан документ: описание сервиса `localrag-reranker`,
  модели `BAAI/bge-reranker-base`, эндпоинтов `/health` и `/rerank`,
  переменных окружения, ограничений по RAM/CPU.
- 2026-05-24 — дефолтный таймаут kb-api → reranker поднят с 8 с до 45 с
  (env `RERANKER_TIMEOUT_MS`), чтобы bge/Qwen3 на CPU слабого ноута не
  падали ложно в эвристический fallback. Описан переход на
  `Qwen/Qwen3-Reranker-0.6B` через env без правок кода.
