# Retrieval Pipeline

```
question ─┬─ [HyDE] → embedding → semantic search (Qdrant) ─┐
          │                                                  ├─ fusion (RRF) → reranking → answer
          ├─ lexical search (PostgreSQL, BM25) ──────────────┘                              ▲
          │                                                                                 │
          └─ [граф?] идентификатор в вопросе → graph-lookup (Postgres) → факты ── {graph_facts} ┘
```

Графовая дорожка идёт **параллельно** RAG и **не участвует** в RRF-фьюжне:
у узлов графа нет vector/lexical-скоров, поэтому факты подаются отдельным
блоком `{graph_facts}` и отдельными источниками `origin:"graph"`. Подробно:
[GRAPH_RETRIEVAL.md](GRAPH_RETRIEVAL.md).

## Текущая реализация

- HyDE (опционально) — облачный LLM генерирует гипотетический параграф документа по вопросу пользователя; эмбеддинг считается по нему, а не по сырому вопросу. По умолчанию выключен. Подробно: [HYDE_RETRIEVAL.md](HYDE_RETRIEVAL.md).
- semantic retrieval — `Qdrant` (`kb-api` → embedding-провайдер → Qdrant);
- lexical retrieval — PostgreSQL full-text search + точное подстрочное совпадение (BM25);
- fusion — Reciprocal Rank Fusion (RRF);
- граф знаний (опционально) — для структурных вопросов с идентификатором (термин с цифрой или дефисом) ищется точный узел + его прямые связи; факты подмешиваются отдельным блоком. Подробно: [GRAPH_RETRIEVAL.md](GRAPH_RETRIEVAL.md).
- CSV/XLSX строки индексируются отдельными чанками для поиска тегов/параметров;
- reranking — переключаемый, три режима (см. ниже).

**Важно:** HyDE влияет ТОЛЬКО на semantic-этап. BM25 всегда идёт по сырому вопросу — точные термины и идентификаторы не должны размываться гипотетическим параграфом.

**Контекстное обогащение (Слой 2) на стороне индексации:** если при импорте текстового документа было включено контекстное обогащение, в `text_with_context` каждого чанка добавлен LLM-контекст в формате `Заголовок\nКонтекст: <context>\n\n<текст>`. Этот же `text_with_context` используется и для semantic-эмбеддинга, и для BM25 (`to_tsvector` считается на лету из `text_with_context`) — поэтому контекст улучшает **оба** этапа поиска. **Теги и summary в индексацию НЕ идут** — это только метаданные для отображения/фильтров. Подробно: [CONTEXTUAL_ENRICHMENT.md](CONTEXTUAL_ENRICHMENT.md).

## HyDE — гипотетический параграф перед semantic-поиском

См. подробное описание: [HYDE_RETRIEVAL.md](HYDE_RETRIEVAL.md).

Включается в UI «Настройки → HyDE». Использует один из настроенных облачных провайдеров (`cloudProviders[].id` через поле `providerId`). Промпт хранится в `app_settings.hyde.prompt`, редактируется отдельно от главного системного промпта.

Видимость в чате — бейдж под ответом: `HyDE: использован (модель, Nмс)` / `HyDE: fallback (причина)` / отсутствует, если выключен.

Структура `result.hyde`:
```js
{
  used: true,                   // сработал ли HyDE
  query: "<гипотетический параграф>",  // или сырой вопрос, если used=false
  originalQuery: "<вопрос пользователя>",
  latencyMs: 2300,
  model: "deepseek-v4-flash",
  providerId: "...",
  providerName: "DeepSeek",
  // при used=false:
  reason: "disabled" | "no_provider" | "no_model" | "no_prompt" | "short_response" | "error",
  error: "..."                  // только при reason=error
}
```

## Граф знаний — структурные факты

См. подробное описание: [GRAPH_RETRIEVAL.md](GRAPH_RETRIEVAL.md).

Триггер чисто эвристический: в вопросе есть идентификатор-подобный термин
(цифра или дефис). Тогда `graphAnswerService.lookup()` ищет узел по точным
полям (`name, tag, loop_tag, signal_address, address, cabinet_id`), берёт до
3 узлов и до 8 связей на узел. Без LLM-вызовов — только Postgres `ILIKE` +
запросы связей. При недоступности Postgres lookup возвращает `used:false`, и
RAG-ответ не падает.

Видимость в чате — бейдж под ответом `граф: N фактов` (есть только при
`used=true`) и карточки источников с пометкой `🕸 граф`.

Структура `result.graph` (в `metadata.graph` сообщения; по образцу
`result.hyde`):
```js
{
  used: true,        // приняты ли структурные матчи
  count: 2,          // сколько фактов подмешано
  reason: "ok"       // "no_identifier" | "no_match" | "error" | "ok"
}
```

Если RAG пуст, а граф дал факт — ответ генерируется по графу, `mode` =
`"graph-only"` (вместо `fallback-empty`). Если пусто и там, и там — прежний
`fallback-empty`.

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
- 2026-05-27 — добавлен слой HyDE (Hypothetical Document Embeddings) перед
  semantic-поиском. Опциональный, по умолчанию выключен. Использует один
  из настроенных облачных провайдеров. Промпт хранится в БД и редактируется
  через UI «Настройки → HyDE». Видим в чате бейджем под ответом. Подробно
  в [HYDE_RETRIEVAL.md](HYDE_RETRIEVAL.md).
