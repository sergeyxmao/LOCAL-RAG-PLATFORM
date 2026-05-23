# Architecture

Поток данных:

Документ -> parsing -> chunking -> embeddings -> Qdrant -> retrieval -> reranking -> answer

## Компоненты в docker-compose

| Контейнер              | Назначение                                                       | Обязателен |
| ---------------------- | ---------------------------------------------------------------- | ---------- |
| `localrag-postgres`    | Метаданные, статусы задач, чаты, settings, BM25                  | да         |
| `localrag-qdrant`      | Векторный поиск                                                  | да         |
| `localrag-kb-api`      | Fastify-API: импорт, поиск, ответы, UI v2                        | да         |
| `localrag-ingestion-worker` | Каркас для фонового импорта                                 | нет (заглушка) |
| `localrag-open-webui`  | Чат-фронт через Ollama                                            | нет        |
| `localrag-reranker`    | Локальный cross-encoder reranker (`apps/reranker-service`)        | нет (опциональный — kb-api делает fallback) |

## Reranking

Reranking — последний этап retrieval, переключаемый между тремя режимами:

- `heuristic` — арифметика в kb-api (без модели);
- `local` — обращение к `localrag-reranker` (`BAAI/bge-reranker-base` на CPU);
- `jina` — облачный Jina API (тексты фрагментов уходят в облако).

При любой ошибке выбранного режима kb-api автоматически делает fallback на
эвристику и отмечает фактический режим в ответе (бейдж под сообщением в чате)
и в логах. Подробности — в `docs/RETRIEVAL_PIPELINE.md` и `docs/RERANKER_SERVICE.md`.

---

История изменений:

- 2026-05-23 — добавлен опциональный контейнер `localrag-reranker` и
  упоминание трёх режимов reranking.
