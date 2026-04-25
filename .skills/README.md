# Skills Index

Этот каталог содержит инструкции для Codex/агента при работе с LOCAL-RAG-PLATFORM.

Проект — локальная RAG-платформа для поиска по рабочей документации АСУ ТП.

## Доступные skills

### rag-system

Использовать, когда задача связана с общей RAG-архитектурой:

- pipeline RAG;
- ответы по источникам;
- fallback-empty;
- связь import → chunks → embeddings → retrieval → answer;
- качество ответов по документам.

### document-ingestion

Использовать, когда задача связана с импортом документов:

- data/raw;
- PDF, DOCX, TXT, MD, CSV, XLSX, XLS;
- async ingest;
- jobs;
- PDF pages;
- page_type;
- duplicate protection;
- createVisualAssets.

### vector-search

Использовать, когда задача связана с поиском:

- Qdrant;
- embeddings;
- semantic search;
- lexical search;
- hybrid retrieval;
- фильтры;
- теги;
- сигналы;
- источники ответа.

### local-llm-agent

Использовать, когда задача связана с локальной моделью и ответами:

- Ollama;
- Open WebUI;
- qwen3:4b;
- prompt building;
- RAG context;
- answer generation;
- поведение агента;
- русские ответы.

### security-and-privacy

Использовать, когда задача связана с приватностью и безопасностью:

- локальный режим;
- документы пользователя;
- запрет внешних API без разрешения;
- логи;
- секреты;
- токены;
- доступ к документам;
- будущая user isolation.

### operations-troubleshooting

Использовать, когда задача связана с запуском и диагностикой:

- Docker Desktop;
- WSL2;
- scripts/start.ps1;
- /health;
- /ui/jobs;
- Qdrant;
- PostgreSQL;
- Open WebUI;
- Ollama;
- ошибки диска;
- troubleshooting.

### project-documentation

Использовать, когда задача связана с документацией проекта:

- README.md;
- AGENTS.md;
- docs/PROJECT_CONTEXT.md;
- docs/SETUP_STATUS.md;
- docs/ROADMAP.md;
- docs/OPERATIONS.md;
- технические заметки;
- фиксация изменений;
- обновление документации после доработок.

### testing-quality

Использовать, когда задача связана с проверкой качества:

- smoke tests;
- regression checks;
- проверка импорта;
- проверка поиска;
- проверка источников;
- fallback-empty;
- UI checks.

### ui-ux-design

Использовать, когда задача связана с интерфейсом и удобством приложения:

- дизайн страниц;
- структура интерфейса;
- /ui/consult;
- /ui/ingest;
- /ui/jobs;
- /ui/pages-search;
- формы;
- фильтры;
- источники ответа;
- пустые состояния;
- ошибки;
- статусы загрузки;
- русские пользовательские тексты.

## Главное правило

Перед изменением кода агент должен выбрать подходящий skill, прочитать его и только потом предлагать план.

Если задача затрагивает несколько областей, нужно использовать несколько skills.

Примеры:

- плохие ответы по документам → rag-system + vector-search + local-llm-agent + testing-quality
- не импортируется PDF → document-ingestion + operations-troubleshooting + testing-quality
- ошибка Qdrant No space left on device → operations-troubleshooting + vector-search
- добавление OCR → document-ingestion + security-and-privacy + testing-quality
- изменение prompt-а → local-llm-agent + rag-system + testing-quality
- изменение внешнего вида /ui/consult → ui-ux-design + rag-system + testing-quality
- улучшение страницы импорта → ui-ux-design + document-ingestion + testing-quality
- улучшение страницы jobs → ui-ux-design + operations-troubleshooting + testing-quality
- обновление README или docs после изменения кода → project-documentation + testing-quality
- изменение интерфейса с новыми backend-данными → ui-ux-design + соответствующий backend skill + testing-quality
