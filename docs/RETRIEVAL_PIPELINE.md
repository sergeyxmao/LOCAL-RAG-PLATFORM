# Retrieval Pipeline

question -> embedding -> semantic search in Qdrant -> lexical search in PostgreSQL -> fusion -> reranking -> answer

## Текущая реализация

- semantic retrieval — `Qdrant` (`kb-api` → `OllamaEmbeddingProvider` → Qdrant);
- lexical retrieval — PostgreSQL full-text search + точное подстрочное совпадение;
- fusion — Reciprocal Rank Fusion (RRF);
- CSV/XLSX строки индексируются отдельными чанками для поиска тегов/параметров;
- reranking — переключаемый, три режима (см. ниже).

## Три режима reranking

Выбираются в UI «Настройки → Поиск → Reranking» и в API
`PATCH /api/v2/settings/reranking`. Поле `provider` — одно из:

| Режим       | Что делает                                                                                    | Приватность                                                          | Скорость              |
| ----------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------- |
| `heuristic` | Локальная арифметика — взвешенные суммы fusion/semantic/lexical скоров (`computeRerankScore`) | Документы наружу НЕ отправляются                                     | очень быстрый         |
| `local`     | Локальный reranker-сервис `apps/reranker-service` (`BAAI/bge-reranker-base` или `Qwen/Qwen3-Reranker-0.6B` на CPU) | Документы наружу НЕ отправляются                                     | 15–40 с на CPU слабого ноута, ~100 мс на GPU |
| `jina`      | Облачный Jina API (`jina-reranker-v2-base-multilingual`)                                      | ⚠️ Тексты найденных фрагментов отправляются в облако Jina по HTTPS  | зависит от сети       |

`enabled` и `candidate_pool` для всех режимов лежат в `retrieval.reranking.*`
(файл `config/retrieval.yaml`, переопределяется через
`PATCH /api/v2/settings/retrieval`).

## Формат /rerank (общий для jina и local)

Запрос:

```json
{ "query": "...", "documents": ["doc1", "doc2", ...], "top_n": 6 }
```

Ответ (Jina-совместимый):

```json
{ "results": [ { "index": 1, "relevance_score": 0.91 }, ... ] }
```

Локальный сервис слушает по умолчанию `http://localrag-reranker:8090` внутри
docker-сети (см. `docs/RERANKER_SERVICE.md`).

## Fallback и видимость режима (требование владельца)

- Любая ошибка выбранного reranker'а (HTTP 401/403, таймаут, отсутствие ключа,
  лежащий сервис, сеть) приводит к **автоматическому fallback на эвристику**.
  Поиск НЕ падает.
- Фактический режим виден в трёх местах:
  1. В метаданных ответа чата — бейдж под сообщением:
     `reranking: Jina` / `reranking: локальный (bge-reranker-base)` /
     `reranking: эвристика` / `reranking: эвристика (запасной)`.
  2. В «Настройки → Поиск» — статусная строка «Локальный reranker: доступен/не
     доступен», «Jina: ключ задан/нет».
  3. В логах `localrag-kb-api` — `request.log.warn` с кодом причины
     (`auth`, `timeout`, `network`, `no_key`, `no_url`, ...).
- В `hybridSearch` структура `result.reranking`:
  ```js
  {
    enabled: true,
    provider: "local",          // что было выбрано
    mode: "local",              // что реально отработало
    model: "BAAI/bge-reranker-base",
    fallbackReason: "...",      // только при mode === "heuristic-fallback"
    failedProvider: "local"     // только при fallback
  }
  ```

## Конфигурация

- `config/retrieval.yaml` — дефолты (`reranking.enabled`, `reranking.candidate_pool`).
- Переменные окружения:
  - `RERANKER_LOCAL_URL` — URL локального сервиса (дефолт `http://localrag-reranker:8090`).
  - `RERANKER_TIMEOUT_MS` — таймаут на сетевой вызов (дефолт `45000`).
    Локальный cross-encoder на CPU слабого ноута считает один запрос
    15–40 с (см. `docs/RERANKER_SERVICE.md`), поэтому таймаут поднят с
    исходных 8 с до 45 с — иначе fallback на эвристику срабатывает ложно
    по каждому запросу, и качество реранкинга деградирует до
    лексического совпадения. На GPU/быстром CPU значение можно снизить
    до 5000–8000.
  - `RERANKER_MODEL` — `BAAI/bge-reranker-base` по умолчанию; альтернатива
    `Qwen/Qwen3-Reranker-0.6B` (тяжелее, но точнее).
  - `RERANKER_JINA_URL` — `https://api.jina.ai/v1/rerank` по умолчанию.
  - `RERANKER_JINA_MODEL` — `jina-reranker-v2-base-multilingual` по умолчанию.
- В БД (`app_settings`, ключ `reranking`) — provider, URL локального сервиса,
  Jina-ключ (хранится сырым, в API маскируется как другие ключи).

---

История изменений:

- 2026-05-23 — добавлено описание трёх режимов reranking (jina/local/heuristic),
  fallback-логика, формат `/rerank`, индикация фактического режима в ответе.
- 2026-05-24 — отмечено, что локальный reranker на CPU требует увеличенного
  таймаута (`RERANKER_TIMEOUT_MS=45000` по умолчанию). Добавлен
  `Qwen/Qwen3-Reranker-0.6B` как опциональная модель через env.
