# Web-референсы для дизайн-прототипа V3

Исследование выполнено через Tavily MCP (`tavily_search`) 25.04.2026. Рабочие документы АСУ ТП наружу не отправлялись: искались только публичные UI/UX и продуктовые референсы.

| # | Референс | Ссылка | Что полезного взять | Экран LOCAL-RAG-PLATFORM |
|---|---|---|---|---|
| 1 | Glean Workplace Search AI | https://www.glean.com/product/workplace-search-ai | Единая строка поиска по разным источникам, быстрый переход от вопроса к проверяемому ответу, акцент на "не копаться по папкам". | консультант, библиотека |
| 2 | Glean: How search works | https://www.glean.com/resources/guides/how-glean-search-works | Идея персонализированного и контекстного поиска: не просто список документов, а объяснимый путь от запроса к результату. | консультант, источники |
| 3 | Google NotebookLM Discover Sources | https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-discover-sources/ | Явная работа с наборами источников: выбрать, добавить, использовать в ответе, не смешивая всё без контроля. | консультант, источники, библиотека |
| 4 | Perplexity AI source-focused flow | https://www.perplexity.ai/ | Citation-first подход: ответ сразу связан с источниками, а ссылки выглядят как часть ответа, не как вторичный хвост. | консультант, источники |
| 5 | Perplexity focus/source selection discussion | https://community.perplexity.ai/t/able-to-specify-sources-similar-to-the-perplexity-ui/634 | Идея выбора набора источников перед вопросом: web, файлы, коннекторы, документы. | консультант, библиотека |
| 6 | Onyx / Danswer self-hosted AI search | https://github.com/danswer-ai/danswer | Self-hosted логика, chat UI поверх локальных/корпоративных источников, важность deployable интерфейса без облачной зависимости. | консультант, библиотека, админ/статус |
| 7 | Hebbia Matrix | https://www.hebbia.com/blog/5-ways-equity-research-teams-use-hebbia-to-drive-speed-and-insight | Работа с большим числом документов через структурированные результаты, таблицы, проверяемые факты и цитаты к PDF. | консультант, источники, библиотека |
| 8 | Dropbox Dash | https://dash.dropbox.com/ai-info-page | Универсальный поиск как knowledge workspace: файлы, контекст, организация материалов, быстрые ответы по контенту. | библиотека, консультант |
| 9 | Notion Enterprise Search | https://www.notion.com/product/enterprise-search | Выбор источников, поиск по workspace и подключённым приложениям, AI-ответы с цитатами и контролем доступа. | консультант, библиотека, источники |
| 10 | Notion Search help | https://www.notion.com/help/search | Полноэкранный поиск с фильтрами по источнику, заголовку, автору и истории недавних документов. | библиотека, консультант |
| 11 | Guru AI Knowledge Platform | https://www.getguru.com/ | Verified knowledge, единый источник правды, статусы актуальности знаний и доверие к ответам. | источники, админ/статус |
| 12 | Slite Ask | https://slite.com/ask | AI-вопросы к базе знаний с ответами по доверенным документам, ссылками на релевантные материалы и подсветкой пробелов. | консультант, источники |
| 13 | Slite Knowledge Base | https://slite.com/solutions/knowledge-base | Knowledge management panel: устаревшие материалы, пробелы в базе, поддержка связки docs + enterprise search. | библиотека, админ/статус |
| 14 | Langdock Document Search | https://docs.langdock.com/product/chat/document-search | Режимы работы с документами: полный retrieval, targeted search, page viewer для PDF с таблицами, схемами и изображениями. | консультант, загрузка, источники |
| 15 | AWS vector ingestion jobs | https://docs.aws.amazon.com/opensearch-service/latest/developerguide/view-vector-ingestion-jobs.html | Отдельное представление import history и ingestion jobs с понятными статусами обработки. | загрузка, админ/статус |
| 16 | OpenSearch vector ingestion | https://docs.opensearch.org/latest/vector-search/ingesting-data/index/ | Разделение способов ingestion, pipeline и bulk ingest; полезно для статусов "chunks / embeddings / index". | загрузка, админ/статус |

## Выводы для V3

- Источники должны быть видны до, во время и после ответа: выбранные документы, использованные документы и конкретные страницы/таблицы.
- Консультант должен выглядеть как рабочая поверхность, а не как отчёт: слева библиотека, сверху запрос, в центре ответ, снизу проверяемые источники.
- Загрузка должна быть отдельным рабочим flow с форматами, режимами, очередью, прогрессом, ошибками и предупреждениями для слабого ноутбука.
- Админ-экран должен отделять обычное обслуживание от опасных действий.
- Для LOCAL-RAG-PLATFORM особенно важны таблицы, PDF-страницы, page_type, сигналы, теги и честный fallback-empty.
