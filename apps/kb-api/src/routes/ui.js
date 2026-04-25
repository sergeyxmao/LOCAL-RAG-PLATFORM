function renderConsultantHtml() {
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Консультант по документам</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #111418;
      --panel: #1a2027;
      --panel-2: #222a33;
      --text: #eef3f8;
      --muted: #9fb0c3;
      --accent: #6ec1ff;
      --line: #32404e;
      --ok: #87d68d;
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", Tahoma, sans-serif;
      background: linear-gradient(180deg, #0e1216 0%, #151c23 100%);
      color: var(--text);
    }
    .wrap {
      max-width: 1150px;
      margin: 0 auto;
      padding: 24px;
    }
    .nav {
      display: flex;
      gap: 10px;
      margin-bottom: 18px;
      flex-wrap: wrap;
    }
    .nav a {
      color: var(--accent);
      text-decoration: none;
      padding: 8px 12px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: rgba(110, 193, 255, 0.12);
    }
    h1 {
      margin: 0 0 10px;
      font-size: 28px;
    }
    .lead {
      margin: 0 0 22px;
      color: var(--muted);
      line-height: 1.5;
    }
    .panel {
      background: rgba(26, 32, 39, 0.92);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 18px;
      margin-bottom: 18px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
    }
    .row {
      display: grid;
      grid-template-columns: minmax(220px, 1fr) 210px 180px 180px;
      gap: 12px;
      align-items: end;
    }
    .row-compact {
      display: grid;
      grid-template-columns: 180px 180px 180px 120px;
      gap: 12px;
      align-items: end;
      margin-top: 12px;
    }
    label {
      display: block;
      font-size: 13px;
      color: var(--muted);
      margin-bottom: 8px;
    }
    input, textarea, button, select {
      width: 100%;
      border-radius: 12px;
      border: 1px solid var(--line);
      background: var(--panel-2);
      color: var(--text);
      font: inherit;
    }
    input, textarea, select {
      padding: 12px 14px;
    }
    textarea {
      min-height: 108px;
      resize: vertical;
      line-height: 1.5;
    }
    button {
      padding: 12px 14px;
      cursor: pointer;
      background: linear-gradient(135deg, #2176ae, #1f9af0);
      border: none;
      font-weight: 600;
    }
    button.secondary {
      background: linear-gradient(135deg, #3d4c5e, #54657a);
    }
    .actions {
      display: flex;
      gap: 10px;
      margin-top: 14px;
    }
    .status {
      margin-top: 12px;
      color: var(--muted);
      min-height: 20px;
    }
    .answer {
      white-space: pre-wrap;
      line-height: 1.6;
    }
    .summary {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }
    .summary button {
      width: auto;
      border: 1px solid var(--line);
      background: rgba(110, 193, 255, 0.12);
      color: var(--accent);
      border-radius: 999px;
      padding: 6px 10px;
      cursor: pointer;
    }
    .result {
      padding: 14px;
      border-radius: 12px;
      border: 1px solid var(--line);
      background: rgba(34, 42, 51, 0.85);
      margin-bottom: 12px;
    }
    .result h3 {
      margin: 0 0 8px;
      font-size: 18px;
    }
    .meta {
      color: var(--muted);
      font-size: 13px;
      line-height: 1.5;
      margin-bottom: 10px;
    }
    .excerpt {
      line-height: 1.55;
      white-space: pre-wrap;
    }
    .link {
      color: var(--accent);
      text-decoration: none;
    }
    .pill {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 999px;
      background: rgba(110, 193, 255, 0.12);
      color: var(--accent);
      margin-right: 6px;
      margin-bottom: 6px;
      font-size: 12px;
    }
    .ok {
      color: var(--ok);
    }
    .hint {
      color: var(--muted);
      font-size: 13px;
      margin-top: 10px;
      line-height: 1.5;
    }
    @media (max-width: 900px) {
      .row,
      .row-compact {
        grid-template-columns: 1fr;
      }
      .actions {
        flex-direction: column;
      }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="nav">
      <a href="/ui/consult">Консультант</a>
      <a href="/ui/ingest">Импорт</a>
      <a href="/ui/pages-search">Поиск по страницам PDF</a>
      <a href="/ui/jobs">Статусы задач</a>
    </div>
    <h1>Консультант по документам</h1>
    <p class="lead">
      Это основной браузерный режим для вопросов по вашей базе знаний. Здесь можно задать вопрос по всем документам,
      только по одному документу, только по текстовым чанкам или только по PDF-страницам.
    </p>

    <div class="panel">
      <div>
        <label for="question">Вопрос</label>
        <textarea id="question" placeholder="Например: какие функциональные блоки описаны в этом документе и где смотреть содержание?">Какие разделы и функциональные блоки описаны в документе?</textarea>
      </div>
      <div class="row" style="margin-top: 12px;">
        <div>
          <label for="documentId">Документ</label>
          <select id="documentId">
            <option value="">Все документы</option>
          </select>
        </div>
        <div>
          <label for="scope">Область поиска</label>
          <select id="scope">
            <option value="all">Все источники</option>
            <option value="chunks">Только текст</option>
            <option value="assets">Только PDF-страницы</option>
          </select>
        </div>
        <div>
          <label for="assetClass">Тип страницы</label>
          <select id="assetClass">
            <option value="all">Все</option>
            <option value="title">Титулы</option>
            <option value="contents">Содержание</option>
            <option value="changelog">Изменения</option>
            <option value="legal">Юридические</option>
            <option value="signals">Сигналы/теги</option>
            <option value="table">Таблицы</option>
            <option value="scheme">Схемы</option>
            <option value="screen">Экраны</option>
            <option value="text">Текст</option>
          </select>
        </div>
        <div>
          <label for="limit">Лимит источников</label>
          <input id="limit" type="number" min="1" max="10" value="4" />
        </div>
      </div>
      <div class="row-compact">
        <div>
          <label for="engineeringTopic">Инженерная тема</label>
          <select id="engineeringTopic">
            <option value="all">Все темы</option>
          </select>
        </div>
        <div>
          <label for="signalTag">Сигнал / тег</label>
          <input id="signalTag" placeholder="Например, LIT-101" />
        </div>
      </div>
      <div class="actions">
        <button id="askBtn">Получить ответ</button>
        <button id="searchBtn" class="secondary">Показать только источники</button>
      </div>
      <div id="status" class="status"></div>
      <div class="hint">
        Для общего ответа оставьте область поиска <strong>Все источники</strong>. Для схем, таблиц и содержаний переключайтесь на
        <strong>Только PDF-страницы</strong>.
      </div>
      <div id="summary" class="summary"></div>
      <div id="topics" class="summary"></div>
      <div id="signalTags" class="summary"></div>
    </div>

    <div class="panel">
      <h2>Ответ</h2>
      <div id="answer" class="answer">Ответ еще не запрашивался.</div>
    </div>

    <div class="panel">
      <h2>Источники</h2>
      <div id="results">Пока пусто.</div>
    </div>
  </div>

  <script>
    const questionEl = document.getElementById("question");
    const limitEl = document.getElementById("limit");
    const documentIdEl = document.getElementById("documentId");
    const scopeEl = document.getElementById("scope");
    const assetClassEl = document.getElementById("assetClass");
    const engineeringTopicEl = document.getElementById("engineeringTopic");
    const signalTagEl = document.getElementById("signalTag");
    const statusEl = document.getElementById("status");
    const summaryEl = document.getElementById("summary");
    const topicsEl = document.getElementById("topics");
    const signalTagsEl = document.getElementById("signalTags");
    const answerEl = document.getElementById("answer");
    const resultsEl = document.getElementById("results");
    const askBtn = document.getElementById("askBtn");
    const searchBtn = document.getElementById("searchBtn");

    const assetClassLabels = {
      all: "Все",
      title: "Титул",
      contents: "Содержание",
      changelog: "Изменения",
      legal: "Юридическая",
      signals: "Сигналы/теги",
      table: "Таблица",
      scheme: "Схема",
      screen: "Экран",
      text: "Текст",
      empty: "Пустая",
      unknown: "Не определено",
    };

    const methodLabels = {
      semantic: "Смысловой",
      lexical: "Точный",
      browse: "Просмотр",
    };

    const modeLabels = {
      llm: "ответ модели",
      "fallback-source-snippet": "быстрый ответ по источнику",
      "fallback-empty": "источники не найдены",
      "no-sources": "источники не найдены",
    };

    function setStatus(text, ok = false) {
      statusEl.textContent = text;
      statusEl.className = ok ? "status ok" : "status";
    }

    function translateAssetClass(value) {
      return assetClassLabels[value] || value || "Не определено";
    }

    function translateMethod(value) {
      return methodLabels[value] || value || "Неизвестно";
    }

    function translateMode(value) {
      return modeLabels[value] || value || "неизвестно";
    }

    function safeArray(value) {
      return Array.isArray(value) ? value.filter(Boolean) : [];
    }

    function basenameFromPath(value) {
      if (!value) {
        return "";
      }
      const normalized = String(value).replace(/\\\\/g, "/");
      const parts = normalized.split("/");
      return parts[parts.length - 1] || normalized;
    }

    function buildDisplayTitle(item) {
      const page = item.page_number ?? null;
      const sourceName = item.source_file_name || basenameFromPath(item.source_path) || "";

      if (sourceName && typeof page === "number") {
        return sourceName + " - Страница " + page;
      }

      return item.title || sourceName || "Без названия";
    }

    function renderResults(items) {
      if (!items || items.length === 0) {
        resultsEl.innerHTML = "<div class=\\"result\\">Подходящие источники не найдены.</div>";
        return;
      }

      resultsEl.innerHTML = items.map((item, index) => {
        const assetUrl = item.asset_url || item.asset_preview_url || "";
        const page = item.page_number ?? "-";
        const displayTitle = buildDisplayTitle(item);
        const assetClass = item.asset_class
          ? "<span class=\\"pill\\">" + translateAssetClass(item.asset_class) + "</span>"
          : "";
        const methods = Array.isArray(item.methods)
          ? item.methods.map((m) => "<span class=\\"pill\\">" + translateMethod(m) + "</span>").join("")
          : "";
        const topics = safeArray(item.engineeringTopics || item.engineering_topics)
          .map((topic) => "<span class=\\"pill\\">" + topic + "</span>")
          .join("");
        const signals = safeArray(item.signalTags || item.signal_tags)
          .slice(0, 6)
          .map((tag) => "<span class=\\"pill\\">" + tag + "</span>")
          .join("");
        const excerpt = item.textExcerpt || item.text || "";
        const source = item.source_path || "";
        return \`
          <div class="result">
            <h3>[\${index + 1}] \${displayTitle}</h3>
            <div class="meta">
              Страница: <strong>\${page}</strong><br />
              Источник: \${source}<br />
              \${assetUrl ? 'Открыть: <a class="link" href="' + assetUrl + '" target="_blank" rel="noopener">страницу / предпросмотр</a><br />' : ""}
              \${assetClass}
              \${methods}
              \${topics}
              \${signals}
            </div>
            <div class="excerpt">\${excerpt}</div>
          </div>
        \`;
      }).join("");
    }

    function renderSummary(items) {
      if (!items || items.length === 0) {
        summaryEl.innerHTML = "";
        return;
      }

      summaryEl.innerHTML = items
        .map((item) => (
          '<button type="button" data-asset-class="' + item.assetClass + '">' +
          translateAssetClass(item.assetClass) + ': ' + item.count +
          '</button>'
        ))
        .join("");

      summaryEl.querySelectorAll("button[data-asset-class]").forEach((button) => {
        button.addEventListener("click", () => {
          assetClassEl.value = button.dataset.assetClass;
        });
      });
    }

    function renderTopics(items) {
      if (!items || items.length === 0) {
        topicsEl.innerHTML = "";
        engineeringTopicEl.innerHTML = '<option value="all">Все темы</option>';
        return;
      }

      engineeringTopicEl.innerHTML = ['<option value="all">Все темы</option>']
        .concat(items.map((item) => (
          '<option value="' + item.topic + '">' + item.topic + " (" + item.count + ")</option>"
        )))
        .join("");

      topicsEl.innerHTML = items
        .map((item) => (
          '<button type="button" data-engineering-topic="' + item.topic + '">' +
          item.topic + ': ' + item.count +
          '</button>'
        ))
        .join("");

      topicsEl.querySelectorAll("button[data-engineering-topic]").forEach((button) => {
        button.addEventListener("click", () => {
          engineeringTopicEl.value = button.dataset.engineeringTopic;
        });
      });
    }

    function renderSignalTags(items) {
      if (!items || items.length === 0) {
        signalTagsEl.innerHTML = "";
        return;
      }

      signalTagsEl.innerHTML = items
        .map((item) => (
          '<button type="button" data-signal-tag="' + item.tag + '">' +
          item.tag + ': ' + item.count +
          '</button>'
        ))
        .join("");

      signalTagsEl.querySelectorAll("button[data-signal-tag]").forEach((button) => {
        button.addEventListener("click", () => {
          signalTagEl.value = button.dataset.signalTag;
        });
      });
    }

    async function postJson(url, body) {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || ("HTTP " + response.status));
      }
      return data;
    }

    async function loadDocuments() {
      try {
        const response = await fetch("/documents");
        const data = await response.json();
        const items = Array.isArray(data.items) ? data.items : [];
        const options = ['<option value="">Все документы</option>']
          .concat(items.map((item) => {
            const displayName =
              item.original_file_name ||
              basenameFromPath(item.original_file_path) ||
              item.title ||
              item.id;
            const label = displayName + " [" + item.id + "]";
            return '<option value="' + item.id + '">' + label + '</option>';
          }))
          .join("");
        documentIdEl.innerHTML = options;
      } catch (error) {
        setStatus("Не удалось загрузить список документов: " + error.message);
      }
    }

    async function loadDocumentSummary() {
      const documentId = documentIdEl.value || null;
      if (!documentId) {
        renderSummary([]);
        renderTopics([]);
        renderSignalTags([]);
        return;
      }

      try {
        const response = await fetch("/documents/" + documentId + "/assets");
        const data = await response.json();
        renderSummary(data.assets?.byType || []);
        renderTopics(data.assets?.byTopic || []);
        renderSignalTags(data.assets?.bySignalTag || []);
      } catch (error) {
        setStatus("Не удалось загрузить сводку документа: " + error.message);
      }
    }

    function buildPayload() {
      return {
        limit: Number(limitEl.value || 4),
        scope: scopeEl.value || "all",
        assetClass: assetClassEl.value || "all",
        engineeringTopic: engineeringTopicEl.value || "all",
        signalTag: signalTagEl.value.trim() || "all",
        documentId: documentIdEl.value || null,
      };
    }

    async function runSearch() {
      const query = questionEl.value.trim();
      if (!query) {
        setStatus("Введите вопрос или поисковый запрос.");
        return;
      }

      setStatus("Ищу подходящие источники...");
      try {
        const data = await postJson("/search", {
          query,
          ...buildPayload(),
        });
        renderResults(data.items || []);
        answerEl.textContent = "Ответ не запрашивался. Сейчас показаны только найденные источники.";
        setStatus("Готово. Источников найдено: " + (data.items?.length || 0), true);
      } catch (error) {
        setStatus("Ошибка поиска: " + error.message);
      }
    }

    async function runAsk() {
      const question = questionEl.value.trim();
      if (!question) {
        setStatus("Введите вопрос.");
        return;
      }

      setStatus("Строю ответ по найденным источникам...");
      try {
        const data = await postJson("/ask", {
          question,
          ...buildPayload(),
        });
        answerEl.textContent = data.answer || "Пустой ответ.";
        renderResults(data.sources || []);
        setStatus("Ответ готов. Режим: " + translateMode(data.mode), true);
      } catch (error) {
        setStatus("Ошибка ответа: " + error.message);
      }
    }

    askBtn.addEventListener("click", runAsk);
    searchBtn.addEventListener("click", runSearch);
    documentIdEl.addEventListener("change", loadDocumentSummary);
    loadDocuments();
  </script>
</body>
</html>`;
}

function renderPagesSearchHtml() {
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Поиск по страницам PDF</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #111418;
      --panel: #1a2027;
      --panel-2: #222a33;
      --text: #eef3f8;
      --muted: #9fb0c3;
      --accent: #6ec1ff;
      --line: #32404e;
      --ok: #87d68d;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: "Segoe UI", Tahoma, sans-serif;
      background: linear-gradient(180deg, #0e1216 0%, #151c23 100%);
      color: var(--text);
    }

    .wrap {
      max-width: 1100px;
      margin: 0 auto;
      padding: 24px;
    }

    h1 {
      margin: 0 0 10px;
      font-size: 28px;
    }

    .lead {
      margin: 0 0 22px;
      color: var(--muted);
      line-height: 1.5;
    }

    .panel {
      background: rgba(26, 32, 39, 0.92);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 18px;
      margin-bottom: 18px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
    }

    .row {
      display: grid;
      grid-template-columns: minmax(220px, 1fr) 210px 140px 160px 160px 100px;
      gap: 12px;
      align-items: end;
    }

    label {
      display: block;
      font-size: 13px;
      color: var(--muted);
      margin-bottom: 8px;
    }

    input, textarea, button {
      width: 100%;
      border-radius: 12px;
      border: 1px solid var(--line);
      background: var(--panel-2);
      color: var(--text);
      font: inherit;
    }

    input, textarea {
      padding: 12px 14px;
    }

    textarea {
      min-height: 96px;
      resize: vertical;
      line-height: 1.5;
    }

    button {
      padding: 12px 14px;
      cursor: pointer;
      background: linear-gradient(135deg, #2176ae, #1f9af0);
      border: none;
      font-weight: 600;
    }

    button.secondary {
      background: linear-gradient(135deg, #3d4c5e, #54657a);
    }

    .actions {
      display: flex;
      gap: 10px;
      margin-top: 14px;
    }

    .status {
      margin-top: 12px;
      color: var(--muted);
      min-height: 20px;
    }

    .answer {
      white-space: pre-wrap;
      line-height: 1.6;
    }

    .summary {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }

    .hint {
      color: var(--muted);
      font-size: 13px;
      margin-top: 10px;
      line-height: 1.5;
    }

    .summary button {
      width: auto;
      border: 1px solid var(--line);
      background: rgba(110, 193, 255, 0.12);
      color: var(--accent);
      border-radius: 999px;
      padding: 6px 10px;
      cursor: pointer;
    }

    .result {
      padding: 14px;
      border-radius: 12px;
      border: 1px solid var(--line);
      background: rgba(34, 42, 51, 0.85);
      margin-bottom: 12px;
    }

    .result h3 {
      margin: 0 0 8px;
      font-size: 18px;
    }

    .meta {
      color: var(--muted);
      font-size: 13px;
      line-height: 1.5;
      margin-bottom: 10px;
    }

    .excerpt {
      line-height: 1.55;
    }

    .link {
      color: var(--accent);
      text-decoration: none;
    }

    .pill {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 999px;
      background: rgba(110, 193, 255, 0.12);
      color: var(--accent);
      margin-right: 6px;
      margin-bottom: 6px;
      font-size: 12px;
    }

    .ok {
      color: var(--ok);
    }

    select {
      width: 100%;
      border-radius: 12px;
      border: 1px solid var(--line);
      background: var(--panel-2);
      color: var(--text);
      font: inherit;
      padding: 12px 14px;
    }

    @media (max-width: 800px) {
      .row {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="nav">
      <a href="/ui/consult">Консультант</a>
      <a href="/ui/ingest">Импорт</a>
      <a href="/ui/pages-search">Поиск по страницам PDF</a>
      <a href="/ui/jobs">Статусы задач</a>
    </div>
    <h1>Поиск по страницам PDF</h1>
    <p class="lead">
      Это легкая браузерная оболочка поверх <code>/search/pages</code> и <code>/ask/pages</code>.
      Здесь можно искать нужную страницу схемы или задать вопрос только по PDF-страницам.
    </p>

    <div class="panel">
      <div class="row">
        <div>
          <label for="query">Запрос</label>
          <input id="query" value="АРХИВНЫЕ СВЕДЕНИЯ ОБ ИЗМЕНЕНИЯХ В ДОКУМЕНТАЦИИ" />
        </div>
        <div>
          <label for="documentId">Документ</label>
          <select id="documentId">
            <option value="">Все документы</option>
          </select>
        </div>
        <div>
          <label for="assetClass">Тип страниц</label>
          <select id="assetClass">
            <option value="all">Все</option>
            <option value="title">Титулы</option>
            <option value="contents">Содержание</option>
            <option value="changelog">Изменения</option>
            <option value="legal">Юридические</option>
            <option value="signals">Сигналы/теги</option>
            <option value="table">Таблицы</option>
            <option value="scheme">Схемы</option>
            <option value="screen">Экраны</option>
            <option value="text">Текст</option>
          </select>
        </div>
        <div>
          <label for="engineeringTopic">Инженерная тема</label>
          <select id="engineeringTopic">
            <option value="all">Все темы</option>
          </select>
        </div>
        <div>
          <label for="signalTag">Сигнал / тег</label>
          <input id="signalTag" placeholder="Например, LIT-101" />
        </div>
        <div>
          <label for="limit">Лимит</label>
          <input id="limit" type="number" min="1" max="10" value="3" />
        </div>
        <div>
          <label>&nbsp;</label>
          <button id="searchBtn">Найти страницы</button>
        </div>
      </div>
      <div class="actions">
        <button id="browseBtn" class="secondary">Показать страницы типа</button>
        <button id="askBtn" class="secondary">Спросить по страницам</button>
        <button id="reclassifyBtn" class="secondary">Обновить классификацию</button>
      </div>
      <div id="status" class="status"></div>
      <div class="hint">
        Логика простая: выберите документ, потом либо нажмите на тип ниже, либо выберите тип вручную и нажмите одну из кнопок.
      </div>
      <div id="summary" class="summary"></div>
      <div id="topics" class="summary"></div>
      <div id="signalTags" class="summary"></div>
    </div>

    <div class="panel">
      <h2>Ответ</h2>
      <div id="answer" class="answer">Ответ еще не запрашивался. Нажмите «Спросить по страницам».</div>
    </div>

    <div class="panel">
      <h2>Найденные страницы</h2>
      <div id="results">Пока пусто.</div>
    </div>
  </div>

  <script>
    const queryEl = document.getElementById("query");
    const limitEl = document.getElementById("limit");
    const documentIdEl = document.getElementById("documentId");
    const assetClassEl = document.getElementById("assetClass");
    const engineeringTopicEl = document.getElementById("engineeringTopic");
    const signalTagEl = document.getElementById("signalTag");
    const statusEl = document.getElementById("status");
    const summaryEl = document.getElementById("summary");
    const resultsEl = document.getElementById("results");
    const answerEl = document.getElementById("answer");
    const searchBtn = document.getElementById("searchBtn");
    const browseBtn = document.getElementById("browseBtn");
    const askBtn = document.getElementById("askBtn");
    const reclassifyBtn = document.getElementById("reclassifyBtn");
    const topicsEl = document.getElementById("topics");
    const signalTagsEl = document.getElementById("signalTags");
    const assetClassLabels = {
      all: "Все",
      title: "Титул",
      contents: "Содержание",
      changelog: "Изменения",
      legal: "Юридическая",
      signals: "Сигналы/теги",
      table: "Таблица",
      scheme: "Схема",
      screen: "Экран",
      text: "Текст",
      empty: "Пустая",
      unknown: "Не определено",
    };
    const methodLabels = {
      semantic: "Смысловой",
      lexical: "Точный",
      browse: "Просмотр",
    };
    const modeLabels = {
      llm: "ответ модели",
      "fallback-source-snippet": "быстрый ответ по источнику",
      "fallback-empty": "источники не найдены",
    };

    function setStatus(text, ok = false) {
      statusEl.textContent = text;
      statusEl.className = ok ? "status ok" : "status";
    }

    function translateAssetClass(value) {
      return assetClassLabels[value] || value || "Не определено";
    }

    function translateMethod(value) {
      return methodLabels[value] || value || "Неизвестно";
    }

    function translateMode(value) {
      return modeLabels[value] || value || "неизвестно";
    }

    function safeArray(value) {
      return Array.isArray(value) ? value.filter(Boolean) : [];
    }

    function basenameFromPath(value) {
      if (!value) {
        return "";
      }
      const normalized = String(value).replace(/\\\\/g, "/");
      const parts = normalized.split("/");
      return parts[parts.length - 1] || normalized;
    }

    function localizePageTitle(title) {
      return String(title || "")
        .replace(/ - Page (\\d+)$/i, " - Страница $1")
        .replace(/^PDF Page (\\d+)$/i, "Страница $1");
    }

    function buildDisplayTitle(item) {
      const page = item.page_number ?? null;
      const sourceName =
        item.source_file_name ||
        basenameFromPath(item.source_path) ||
        "";

      if (sourceName && typeof page === "number") {
        return sourceName + " - Страница " + page;
      }

      if (typeof page === "number" && item.title) {
        return localizePageTitle(item.title);
      }

      if (item.title) {
        return localizePageTitle(item.title);
      }

      return "Без названия";
    }

    function renderResults(items) {
      if (!items || items.length === 0) {
        resultsEl.innerHTML = "<div class=\\"result\\">Ничего не найдено.</div>";
        return;
      }

      resultsEl.innerHTML = items.map((item) => {
        const assetUrl = item.asset_url || item.asset_preview_url || "";
        const page = item.page_number ?? "-";
        const displayTitle = buildDisplayTitle(item);
        const assetClass = item.asset_class
          ? "<span class=\\"pill\\">" + translateAssetClass(item.asset_class) + "</span>"
          : "";
        const methods = Array.isArray(item.methods)
          ? item.methods
              .map((m) => "<span class=\\"pill\\">" + translateMethod(m) + "</span>")
              .join("")
          : "";
        const topics = safeArray(item.engineeringTopics || item.engineering_topics)
          .map((topic) => "<span class=\\"pill\\">" + topic + "</span>")
          .join("");
        const signals = safeArray(item.signalTags || item.signal_tags)
          .slice(0, 6)
          .map((tag) => "<span class=\\"pill\\">" + tag + "</span>")
          .join("");
        const confidence = item.confidence || item.asset_confidence
          ? "<span class=\\"pill\\">Уверенность: " + (item.confidence || item.asset_confidence) + "</span>"
          : "";
        const excerpt = item.textExcerpt || item.text || "";
        const source = item.source_path || "";
        return \`
          <div class="result">
            <h3>\${displayTitle}</h3>
            <div class="meta">
              Страница: <strong>\${page}</strong><br />
              Источник: \${source}<br />
              \${assetUrl ? 'Предпросмотр: <a class="link" href="' + assetUrl + '" target="_blank" rel="noopener">открыть страницу</a><br />' : ""}
              \${assetClass}
              \${confidence}
              \${methods}
              \${topics}
              \${signals}
            </div>
            <div class="excerpt">\${excerpt}</div>
          </div>
        \`;
      }).join("");
    }

    function renderSummary(items) {
      if (!items || items.length === 0) {
        summaryEl.innerHTML = "";
        return;
      }

      summaryEl.innerHTML = items
        .map((item) => (
          '<button type="button" data-asset-class="' + item.assetClass + '">' +
          translateAssetClass(item.assetClass) + ': ' + item.count +
          '</button>'
        ))
        .join("");

      summaryEl.querySelectorAll("button[data-asset-class]").forEach((button) => {
        button.addEventListener("click", async () => {
          assetClassEl.value = button.dataset.assetClass;
          await runBrowseByType();
        });
      });
    }

    function renderTopics(items) {
      if (!items || items.length === 0) {
        topicsEl.innerHTML = "";
        engineeringTopicEl.innerHTML = '<option value="all">Все темы</option>';
        return;
      }

      engineeringTopicEl.innerHTML = ['<option value="all">Все темы</option>']
        .concat(
          items.map((item) => (
            '<option value="' + item.topic + '">' + item.topic + " (" + item.count + ")</option>"
          ))
        )
        .join("");

      topicsEl.innerHTML = items
        .map((item) => (
          '<button type="button" data-engineering-topic="' + item.topic + '">' +
          item.topic + ': ' + item.count +
          "</button>"
        ))
        .join("");

      topicsEl.querySelectorAll("button[data-engineering-topic]").forEach((button) => {
        button.addEventListener("click", async () => {
          engineeringTopicEl.value = button.dataset.engineeringTopic;
          await runBrowseByType();
        });
      });
    }

    function renderSignalTags(items) {
      if (!items || items.length === 0) {
        signalTagsEl.innerHTML = "";
        return;
      }

      signalTagsEl.innerHTML = items
        .map((item) => (
          '<button type="button" data-signal-tag="' + item.tag + '">' +
          item.tag + ': ' + item.count +
          "</button>"
        ))
        .join("");

      signalTagsEl.querySelectorAll("button[data-signal-tag]").forEach((button) => {
        button.addEventListener("click", async () => {
          signalTagEl.value = button.dataset.signalTag;
          await runBrowseByType();
        });
      });
    }

    async function postJson(url, body) {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || ("HTTP " + response.status));
      }
      return response.json();
    }

    async function loadDocuments() {
      try {
        const response = await fetch("/documents");
        const data = await response.json();
        const items = Array.isArray(data.items) ? data.items : [];
        const options = ['<option value="">Все документы</option>']
          .concat(items.map((item) => {
            const displayName =
              item.original_file_name ||
              basenameFromPath(item.original_file_path) ||
              item.title ||
              item.id;
            const label = displayName + " [" + item.id + "]";
            return '<option value="' + item.id + '">' + label + '</option>';
          }))
          .join("");
        documentIdEl.innerHTML = options;
      } catch (error) {
        setStatus("Не удалось загрузить список документов: " + error.message);
      }
    }

    async function loadDocumentSummary() {
      const documentId = documentIdEl.value || null;
      if (!documentId) {
        renderSummary([]);
        renderTopics([]);
        renderSignalTags([]);
        return;
      }

      try {
        const response = await fetch("/documents/" + documentId + "/assets");
        const data = await response.json();
        renderSummary(data.assets?.byType || []);
        renderTopics(data.assets?.byTopic || []);
        renderSignalTags(data.assets?.bySignalTag || []);
      } catch (error) {
        setStatus("Не удалось загрузить сводку документа: " + error.message);
      }
    }

    async function runSearch() {
      const query = queryEl.value.trim();
      const limit = Number(limitEl.value || 3);
      const documentId = documentIdEl.value || null;
      const assetClass = assetClassEl.value || "all";
      const engineeringTopic = engineeringTopicEl.value || "all";
      const signalTag = signalTagEl.value.trim() || "all";
      if (!query) {
        setStatus("Введите запрос.");
        return;
      }

      answerEl.textContent = "Ответ не обновлялся. Чтобы получить интерпретацию найденных страниц, нажмите «Спросить по страницам».";
      setStatus("Ищу страницы...");
      try {
        const data = await postJson("/search/pages", {
          query,
          limit,
          assetClass,
          engineeringTopic,
          signalTag,
          documentId,
        });
        renderResults(data.items || []);
        const count = data.items?.length || 0;
        setStatus("Готово. Найдено страниц: " + count, true);
      } catch (error) {
        setStatus("Ошибка поиска: " + error.message);
      }
    }

    async function runBrowseByType() {
      const documentId = documentIdEl.value || null;
      const assetClass = assetClassEl.value || "all";
      const engineeringTopic = engineeringTopicEl.value || "all";
      const signalTag = signalTagEl.value.trim() || "all";
      if (!documentId) {
        setStatus("Сначала выберите документ.");
        return;
      }

      answerEl.textContent = "Ответ не обновлялся. Это режим просмотра страниц по типу.";
      setStatus("Загружаю страницы выбранного типа...");
      try {
        const response = await fetch(
          "/documents/" +
            documentId +
            "/assets/browse?assetClass=" +
            encodeURIComponent(assetClass) +
            "&engineeringTopic=" +
            encodeURIComponent(engineeringTopic) +
            "&signalTag=" +
            encodeURIComponent(signalTag)
        );
        const data = await response.json();
        const items = Array.isArray(data.items)
          ? data.items.map((item) => ({
              page_number: item.page,
              title: item.title,
              text: item.text,
              textExcerpt: item.textExcerpt,
              source_path: data.originalFilePath || data.title,
              source_file_name: data.originalFileName || "",
              asset_class: item.assetClass,
              confidence: item.confidence,
              engineeringTopics: item.engineeringTopics,
              signalTags: item.signalTags,
              asset_url: item.url,
              asset_preview_url: item.url || (item.page ? "/documents/" + data.documentId + "/pages/" + item.page + "/preview" : null),
              methods: ["browse"],
            }))
          : [];
        renderResults(items);
        renderSummary(data.byType || []);
        renderTopics(data.byTopic || []);
        renderSignalTags(data.bySignalTag || []);
        setStatus("Готово. Страниц этого типа: " + (data.totalItems || 0), true);
      } catch (error) {
        setStatus("Ошибка просмотра: " + error.message);
      }
    }

    async function runReclassify() {
      const documentId = documentIdEl.value || null;
      if (!documentId) {
        setStatus("Сначала выберите документ.");
        return;
      }

      setStatus("Обновляю классификацию страниц...");
      try {
        const data = await postJson("/documents/" + documentId + "/reclassify-assets", {});
        renderSummary(data.byType || []);
        renderTopics(data.byTopic || []);
        renderSignalTags(data.bySignalTag || []);
        setStatus("Классификация обновлена. Страниц обработано: " + (data.updated || 0), true);
      } catch (error) {
        setStatus("Ошибка пере-классификации: " + error.message);
      }
    }

    async function runAsk() {
      const question = queryEl.value.trim();
      const limit = Number(limitEl.value || 3);
      const documentId = documentIdEl.value || null;
      const assetClass = assetClassEl.value || "all";
      const engineeringTopic = engineeringTopicEl.value || "all";
      const signalTag = signalTagEl.value.trim() || "all";
      if (!question) {
        setStatus("Введите вопрос.");
        return;
      }

      setStatus("Строю ответ по страницам...");
      try {
        const data = await postJson("/ask/pages", {
          question,
          limit,
          assetClass,
          engineeringTopic,
          signalTag,
          documentId,
        });
        answerEl.textContent = data.answer || "Пустой ответ.";
        renderResults(data.sources || []);
        setStatus("Ответ готов. Режим: " + translateMode(data.mode), true);
      } catch (error) {
        setStatus("Ошибка ответа: " + error.message);
      }
    }

    searchBtn.addEventListener("click", runSearch);
    browseBtn.addEventListener("click", runBrowseByType);
    askBtn.addEventListener("click", runAsk);
    reclassifyBtn.addEventListener("click", runReclassify);
    documentIdEl.addEventListener("change", loadDocumentSummary);
    loadDocuments();
  </script>
</body>
</html>`;
}

function renderIngestHtml() {
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Импорт документов</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #111418;
      --panel: #1a2027;
      --panel-2: #222a33;
      --text: #eef3f8;
      --muted: #9fb0c3;
      --accent: #6ec1ff;
      --line: #32404e;
      --ok: #87d68d;
      --warn: #ffd36e;
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", Tahoma, sans-serif;
      background: linear-gradient(180deg, #0e1216 0%, #151c23 100%);
      color: var(--text);
    }
    .wrap {
      max-width: 1100px;
      margin: 0 auto;
      padding: 24px;
    }
    h1 { margin: 0 0 10px; font-size: 28px; }
    .lead {
      margin: 0 0 22px;
      color: var(--muted);
      line-height: 1.5;
    }
    .nav {
      display: flex;
      gap: 10px;
      margin-bottom: 18px;
      flex-wrap: wrap;
    }
    .nav a {
      color: var(--accent);
      text-decoration: none;
      padding: 8px 12px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: rgba(110, 193, 255, 0.12);
    }
    .panel {
      background: rgba(26, 32, 39, 0.92);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 18px;
      margin-bottom: 18px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
    }
    .row {
      display: grid;
      grid-template-columns: 1fr 220px;
      gap: 12px;
      align-items: end;
    }
    label {
      display: block;
      font-size: 13px;
      color: var(--muted);
      margin-bottom: 8px;
    }
    input, textarea, button {
      width: 100%;
      border-radius: 12px;
      border: 1px solid var(--line);
      background: var(--panel-2);
      color: var(--text);
      font: inherit;
    }
    input, textarea {
      padding: 12px 14px;
    }
    textarea {
      min-height: 92px;
      resize: vertical;
      line-height: 1.5;
    }
    button {
      padding: 12px 14px;
      cursor: pointer;
      background: linear-gradient(135deg, #2176ae, #1f9af0);
      border: none;
      font-weight: 600;
    }
    button.secondary {
      background: linear-gradient(135deg, #3d4c5e, #54657a);
    }
    .status {
      margin-top: 12px;
      min-height: 20px;
      color: var(--muted);
    }
    .ok { color: var(--ok); }
    .warn { color: var(--warn); }
    .hint {
      color: var(--muted);
      font-size: 13px;
      margin-top: 10px;
      line-height: 1.5;
    }
    .result {
      white-space: pre-wrap;
      line-height: 1.55;
      font-family: Consolas, "Cascadia Code", monospace;
      font-size: 13px;
    }
    .checkbox {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 12px;
      color: var(--muted);
    }
    .checkbox input {
      width: auto;
      margin: 0;
    }
    @media (max-width: 800px) {
      .row {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="nav">
      <a href="/ui/consult">Консультант</a>
      <a href="/ui/ingest">Импорт</a>
      <a href="/ui/pages-search">Поиск по страницам PDF</a>
      <a href="/ui/jobs">Статусы задач</a>
    </div>
    <h1>Импорт документов</h1>
    <p class="lead">
      Здесь можно запустить загрузку одного файла или целой папки из <code>data/raw</code>.
      Это браузерная оболочка поверх <code>/documents/ingest-file</code> и <code>/documents/ingest-folder</code>.
    </p>

    <div class="panel">
      <h2>Один файл</h2>
      <div class="row">
        <div>
          <label for="relativePath">Путь внутри data/raw</label>
          <input id="relativePath" value="КС новая/Документация metsoDNA CR/2 Функциональные блоки/g2043_ru_04-0.pdf" />
        </div>
        <div>
          <label for="fileCategories">Категории через запятую</label>
          <input id="fileCategories" value="metso,dna,functional-blocks" />
        </div>
      </div>
      <div class="hint">Пример: <code>КС новая/Документация metsoDNA CR/2 Функциональные блоки/g2043_ru_04-0.pdf</code></div>
      <label class="checkbox">
        <input id="fileCreateVisualAssets" type="checkbox" checked />
        <span>Создавать карточки и предпросмотр PDF-страниц</span>
      </label>
      <label class="checkbox">
        <input id="fileForce" type="checkbox" />
        <span>Переиндексировать, даже если такой файл уже есть</span>
      </label>
      <div class="status" id="fileStatus"></div>
      <div class="row">
        <button id="ingestFileBtn">Загрузить файл</button>
        <button id="ingestFileAsyncBtn" class="secondary">Загрузить файл в фоне</button>
      </div>
    </div>

    <div class="panel">
      <h2>Папка</h2>
      <div class="row">
        <div>
          <label for="relativeDir">Папка внутри data/raw</label>
          <input id="relativeDir" value="КС новая/Документация metsoDNA CR/2 Функциональные блоки" />
        </div>
        <div>
          <label for="folderCategories">Категории через запятую</label>
          <input id="folderCategories" value="metso,dna,functional-blocks" />
        </div>
      </div>
      <label class="checkbox">
        <input id="recursive" type="checkbox" checked />
        <span>Обходить вложенные папки</span>
      </label>
      <label class="checkbox">
        <input id="folderCreateVisualAssets" type="checkbox" />
        <span>Создавать карточки и предпросмотр PDF-страниц. Для большой папки сначала лучше выключить.</span>
      </label>
      <label class="checkbox">
        <input id="folderForce" type="checkbox" />
        <span>Переиндексировать, даже если файлы уже есть</span>
      </label>
      <div class="status" id="folderStatus"></div>
      <div class="row">
        <button id="ingestFolderBtn">Загрузить папку</button>
        <button id="ingestFolderAsyncBtn" class="secondary">Загрузить папку в фоне</button>
      </div>
    </div>

    <div class="panel">
      <h2>Результат</h2>
      <div id="result" class="result">Пока пусто.</div>
    </div>

    <div class="panel">
      <h2>Очистка дублей</h2>
      <div class="row">
        <div>
          <label for="dedupePathPrefix">Префикс пути</label>
          <input id="dedupePathPrefix" value="КС новая" />
        </div>
        <div>
          <label>&nbsp;</label>
          <button id="previewDuplicatesBtn" class="secondary">Показать дубли</button>
        </div>
      </div>
      <div class="hint">
        Эта операция ищет одинаковые файлы по имени и оставляет самый свежий индекс, а старые дубли удаляет из базы и Qdrant.
      </div>
      <div class="status" id="dedupeStatus"></div>
      <div class="row">
        <button id="dedupeBtn">Очистить дубли</button>
        <button id="dedupeRefreshBtn" class="secondary">Обновить список дублей</button>
      </div>
    </div>
  </div>

  <script>
    const relativePathEl = document.getElementById("relativePath");
    const fileCategoriesEl = document.getElementById("fileCategories");
    const relativeDirEl = document.getElementById("relativeDir");
    const folderCategoriesEl = document.getElementById("folderCategories");
    const recursiveEl = document.getElementById("recursive");
    const fileCreateVisualAssetsEl = document.getElementById("fileCreateVisualAssets");
    const folderCreateVisualAssetsEl = document.getElementById("folderCreateVisualAssets");
    const fileForceEl = document.getElementById("fileForce");
    const folderForceEl = document.getElementById("folderForce");
    const fileStatusEl = document.getElementById("fileStatus");
    const folderStatusEl = document.getElementById("folderStatus");
    const resultEl = document.getElementById("result");
    const dedupePathPrefixEl = document.getElementById("dedupePathPrefix");
    const dedupeStatusEl = document.getElementById("dedupeStatus");
    const ingestFileBtn = document.getElementById("ingestFileBtn");
    const ingestFileAsyncBtn = document.getElementById("ingestFileAsyncBtn");
    const ingestFolderBtn = document.getElementById("ingestFolderBtn");
    const ingestFolderAsyncBtn = document.getElementById("ingestFolderAsyncBtn");
    const previewDuplicatesBtn = document.getElementById("previewDuplicatesBtn");
    const dedupeBtn = document.getElementById("dedupeBtn");
    const dedupeRefreshBtn = document.getElementById("dedupeRefreshBtn");

    function parseCategories(value) {
      return String(value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    function setStatus(element, text, tone = "") {
      element.textContent = text;
      element.className = tone ? "status " + tone : "status";
    }

    function renderDuplicatePreview(data) {
      const groups = Array.isArray(data.groups) ? data.groups : [];
      if (groups.length === 0) {
        resultEl.textContent = "Дубли не найдены.";
        return;
      }

      resultEl.textContent = JSON.stringify({
        pathPrefix: data.pathPrefix,
        totalGroups: data.totalGroups,
        totalDocuments: data.totalDocuments,
        groups: groups.map((group) => ({
          fileName: group.fileName,
          duplicateCount: group.duplicateCount,
          keepDocumentId: group.keepDocumentId,
          items: group.items.map((item) => ({
            id: item.id,
            keep: item.keep,
            chunkCount: item.chunkCount,
            originalFilePath: item.originalFilePath,
            createdAt: item.createdAt,
          })),
        })),
      }, null, 2);
    }

    async function postJson(url, body) {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || ("HTTP " + response.status));
      }
      return data;
    }

    function renderResult(data) {
      resultEl.textContent = JSON.stringify(data, null, 2);
    }

    ingestFileBtn.addEventListener("click", async () => {
      const relativePath = relativePathEl.value.trim();
      if (!relativePath) {
        setStatus(fileStatusEl, "Укажите путь к файлу.", "warn");
        return;
      }

      setStatus(fileStatusEl, "Идёт загрузка файла...");
      try {
        const data = await postJson("/documents/ingest-file", {
          relativePath,
          categories: parseCategories(fileCategoriesEl.value),
          createVisualAssets: fileCreateVisualAssetsEl.checked,
          force: fileForceEl.checked,
        });
        renderResult(data);
        setStatus(fileStatusEl, "Файл успешно обработан.", "ok");
      } catch (error) {
        setStatus(fileStatusEl, "Ошибка: " + error.message, "warn");
      }
    });

    ingestFolderBtn.addEventListener("click", async () => {
      const relativeDir = relativeDirEl.value.trim();
      if (!relativeDir) {
        setStatus(folderStatusEl, "Укажите путь к папке.", "warn");
        return;
      }

      setStatus(folderStatusEl, "Идёт загрузка папки...");
      try {
        const data = await postJson("/documents/ingest-folder", {
          relativeDir,
          categories: parseCategories(folderCategoriesEl.value),
          recursive: recursiveEl.checked,
          createVisualAssets: folderCreateVisualAssetsEl.checked,
          force: folderForceEl.checked,
        });
        renderResult(data);
        const tone = data.failedCount > 0 ? "warn" : "ok";
        setStatus(
          folderStatusEl,
          "Папка обработана. Успешно: " + data.indexedCount + ", ошибок: " + data.failedCount,
          tone
        );
      } catch (error) {
        setStatus(folderStatusEl, "Ошибка: " + error.message, "warn");
      }
    });

    ingestFileAsyncBtn.addEventListener("click", async () => {
      const relativePath = relativePathEl.value.trim();
      if (!relativePath) {
        setStatus(fileStatusEl, "Укажите путь к файлу.", "warn");
        return;
      }

      setStatus(fileStatusEl, "Файл поставлен в фоновую обработку...");
      try {
        const data = await postJson("/documents/ingest-file-async", {
          relativePath,
          categories: parseCategories(fileCategoriesEl.value),
          createVisualAssets: fileCreateVisualAssetsEl.checked,
          force: fileForceEl.checked,
        });
        renderResult(data);
        setStatus(fileStatusEl, "Файл поставлен в фон. Следите за статусом на /ui/jobs.", "ok");
      } catch (error) {
        setStatus(fileStatusEl, "Ошибка: " + error.message, "warn");
      }
    });

    ingestFolderAsyncBtn.addEventListener("click", async () => {
      const relativeDir = relativeDirEl.value.trim();
      if (!relativeDir) {
        setStatus(folderStatusEl, "Укажите путь к папке.", "warn");
        return;
      }

      setStatus(folderStatusEl, "Папка поставлена в фоновую обработку...");
      try {
        const data = await postJson("/documents/ingest-folder-async", {
          relativeDir,
          categories: parseCategories(folderCategoriesEl.value),
          recursive: recursiveEl.checked,
          createVisualAssets: folderCreateVisualAssetsEl.checked,
          force: folderForceEl.checked,
        });
        renderResult(data);
        setStatus(folderStatusEl, "Папка поставлена в фон. Следите за статусом на /ui/jobs.", "ok");
      } catch (error) {
        setStatus(folderStatusEl, "Ошибка: " + error.message, "warn");
      }
    });

    previewDuplicatesBtn.addEventListener("click", async () => {
      const pathPrefix = dedupePathPrefixEl.value.trim();
      setStatus(dedupeStatusEl, "Ищу дубли...");
      try {
        const response = await fetch(
          "/documents/duplicates?pathPrefix=" + encodeURIComponent(pathPrefix)
        );
        const data = await response.json();
        renderDuplicatePreview(data);
        setStatus(dedupeStatusEl, "Проверка завершена. Групп дублей: " + (data.totalGroups || 0), "ok");
      } catch (error) {
        setStatus(dedupeStatusEl, "Ошибка: " + error.message, "warn");
      }
    });

    dedupeRefreshBtn.addEventListener("click", async () => {
      previewDuplicatesBtn.click();
    });

    dedupeBtn.addEventListener("click", async () => {
      const pathPrefix = dedupePathPrefixEl.value.trim();
      setStatus(dedupeStatusEl, "Удаляю старые дубли...");
      try {
        const data = await postJson("/documents/deduplicate", {
          pathPrefix,
        });
        renderResult(data);
        setStatus(
          dedupeStatusEl,
          "Готово. Удалено документов: " + (data.removedDocuments || 0) + ", векторов: " + (data.removedVectors || 0),
          "ok"
        );
      } catch (error) {
        setStatus(dedupeStatusEl, "Ошибка: " + error.message, "warn");
      }
    });
  </script>
</body>
</html>`;
}

function renderJobsHtml() {
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Статусы задач</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #111418;
      --panel: #1a2027;
      --text: #eef3f8;
      --muted: #9fb0c3;
      --accent: #6ec1ff;
      --line: #32404e;
      --ok: #87d68d;
      --warn: #ffd36e;
      --bad: #ff8c8c;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", Tahoma, sans-serif;
      background: linear-gradient(180deg, #0e1216 0%, #151c23 100%);
      color: var(--text);
    }
    .wrap { max-width: 1200px; margin: 0 auto; padding: 24px; }
    .nav {
      display: flex;
      gap: 10px;
      margin-bottom: 18px;
      flex-wrap: wrap;
    }
    .nav a {
      color: var(--accent);
      text-decoration: none;
      padding: 8px 12px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: rgba(110, 193, 255, 0.12);
    }
    .panel {
      background: rgba(26, 32, 39, 0.92);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 18px;
    }
    h1 { margin: 0 0 10px; font-size: 28px; }
    .lead { margin: 0 0 18px; color: var(--muted); line-height: 1.5; }
    button {
      border-radius: 12px;
      border: none;
      background: linear-gradient(135deg, #2176ae, #1f9af0);
      color: var(--text);
      font: inherit;
      padding: 10px 14px;
      cursor: pointer;
      margin-bottom: 14px;
    }
    .toolbar {
      display: flex;
      gap: 12px;
      align-items: end;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }
    .toolbar-group {
      min-width: 190px;
    }
    .toolbar label {
      display: block;
      font-size: 13px;
      color: var(--muted);
      margin-bottom: 6px;
    }
    .toolbar select,
    .toolbar input[type="text"] {
      width: 100%;
      border-radius: 12px;
      border: 1px solid var(--line);
      background: rgba(34, 42, 51, 0.92);
      color: var(--text);
      font: inherit;
      padding: 10px 12px;
    }
    .toolbar-inline {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--muted);
      font-size: 14px;
      padding-bottom: 10px;
    }
    .toolbar-inline input {
      width: auto;
    }
    table { width: 100%; border-collapse: collapse; }
    th, td {
      border-bottom: 1px solid var(--line);
      text-align: left;
      padding: 10px 8px;
      vertical-align: top;
      font-size: 14px;
    }
    th { color: var(--muted); font-weight: 600; }
    .status-running { color: var(--warn); }
    .status-cancel_requested { color: var(--warn); }
    .status-completed { color: var(--ok); }
    .status-cancelled { color: var(--muted); }
    .status-failed { color: var(--bad); }
    .small { color: var(--muted); font-size: 12px; }
    .progress {
      min-width: 110px;
    }
    .bar {
      width: 100%;
      height: 8px;
      border-radius: 999px;
      overflow: hidden;
      background: rgba(159, 176, 195, 0.18);
      margin: 5px 0;
    }
    .bar span {
      display: block;
      height: 100%;
      background: linear-gradient(135deg, #2176ae, #1f9af0);
    }
    .row-running {
      background: rgba(255, 211, 110, 0.04);
    }
    .path {
      word-break: break-word;
    }
    @media (max-width: 900px) {
      .toolbar {
        flex-direction: column;
        align-items: stretch;
      }
      .toolbar-group {
        min-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="nav">
      <a href="/ui/consult">Консультант</a>
      <a href="/ui/ingest">Импорт</a>
      <a href="/ui/pages-search">Поиск по страницам PDF</a>
      <a href="/ui/jobs">Статусы задач</a>
    </div>
    <div class="panel">
      <h1>Статусы задач</h1>
      <p class="lead">Здесь видно, какие импорты выполняются, какие завершились и какие упали с ошибкой.</p>
      <div class="toolbar">
        <div class="toolbar-group">
          <label for="statusFilter">Что показывать</label>
          <select id="statusFilter">
            <option value="active">Только активные</option>
            <option value="errors">Только ошибки и остановки</option>
            <option value="all">Все задачи</option>
          </select>
        </div>
        <div class="toolbar-group">
          <label for="limitFilter">Сколько строк</label>
          <select id="limitFilter">
            <option value="25">25</option>
            <option value="50" selected>50</option>
            <option value="100">100</option>
          </select>
        </div>
        <div class="toolbar-group">
          <label for="searchFilter">Поиск по файлу</label>
          <input id="searchFilter" type="text" placeholder="Например, g2043_ru_04-1.pdf" />
        </div>
        <div class="toolbar-inline">
          <input id="autoRefresh" type="checkbox" checked />
          <label for="autoRefresh">Автообновление каждые 10 секунд</label>
        </div>
      </div>
      <button id="refreshBtn">Обновить</button>
      <div id="content">Загрузка...</div>
    </div>
  </div>
  <script>
    const contentEl = document.getElementById("content");
    const refreshBtn = document.getElementById("refreshBtn");
    const statusFilterEl = document.getElementById("statusFilter");
    const limitFilterEl = document.getElementById("limitFilter");
    const searchFilterEl = document.getElementById("searchFilter");
    const autoRefreshEl = document.getElementById("autoRefresh");
    const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
      dateStyle: "short",
      timeStyle: "medium",
    });

    function escapeHtml(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    function statusLabel(status) {
      const labels = {
        running: "выполняется",
        cancel_requested: "останавливается",
        cancelled: "остановлено",
        completed: "готово",
        failed: "ошибка",
        pending: "ожидает",
      };
      return labels[status] || status || "неизвестно";
    }

    function documentStatusLabel(status) {
      const labels = {
        indexed: "проиндексирован",
        indexing: "индексируется",
        cancelled: "остановлен",
        failed: "ошибка",
        new: "новый",
      };
      return labels[status] || status || "";
    }

    function jobTypeLabel(jobType) {
      const labels = {
        "ingest-file": "импорт файла",
        "ingest-folder": "импорт папки",
        "ingest-text": "импорт текста",
      };
      return labels[jobType] || jobType || "задача";
    }

    function renderAction(item) {
      if (item.status === "running" || item.status === "cancel_requested") {
        const disabled = item.status === "cancel_requested" ? "disabled" : "";
        const label = item.status === "cancel_requested" ? "Остановка..." : "Остановить";
        return "<button class='stop-btn' data-job-id='" + escapeHtml(item.id) + "' " + disabled + ">" + label + "</button>";
      }

      if ((item.status === "failed" || item.status === "cancelled") && item.job_type === "ingest-file") {
        return "<button class='retry-btn' data-job-id='" + escapeHtml(item.id) + "'>Повторить</button>";
      }

      return "<span class='small'>—</span>";
    }

    function renderProgress(item) {
      const total = Number(item.total_items || 0);
      const processed = Number(item.processed_items || 0);
      const percent = Number(item.progress_percent || 0);
      const width = Math.max(0, Math.min(100, percent || (total > 0 ? (processed / total) * 100 : 0)));
      const label = total > 0 ? processed + " / " + total : "—";
      return "<div class='progress'>" +
        "<div>" + escapeHtml(label) + "</div>" +
        "<div class='bar'><span style='width:" + width + "%'></span></div>" +
        "<div class='small'>" + escapeHtml(item.progress_message || "") + "</div>" +
      "</div>";
    }

    function formatDate(value) {
      if (!value) {
        return "—";
      }

      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        return value;
      }

      return dateFormatter.format(parsed);
    }

    async function loadJobs() {
      const params = new URLSearchParams();
      params.set("statusMode", statusFilterEl.value || "active");
      params.set("limit", limitFilterEl.value || "50");

      const searchTerm = (searchFilterEl.value || "").trim();
      if (searchTerm) {
        params.set("search", searchTerm);
      }

      const response = await fetch("/jobs?" + params.toString());
      const data = await response.json();
      const items = Array.isArray(data.items) ? data.items : [];

      if (items.length === 0) {
        contentEl.innerHTML = "По текущему фильтру задачи не найдены.";
        return;
      }

      contentEl.innerHTML =
        "<table><thead><tr><th>Статус</th><th>Прогресс</th><th>Документ</th><th>Файл</th><th>Чанки</th><th>Тип</th><th>Действие</th><th>Начало</th><th>Завершение</th><th>Ошибка</th></tr></thead><tbody>" +
        items.map((item) => {
          const documentLabel = item.document_title || item.document_id || "—";
          const fileLabel = item.original_file_name || item.original_file_path || "—";
          const rowClass = item.status === "running" || item.status === "cancel_requested" ? " class='row-running'" : "";
          return "<tr" + rowClass + ">" +
            "<td class='status-" + escapeHtml(item.status) + "'>" + escapeHtml(statusLabel(item.status)) + "</td>" +
            "<td>" + renderProgress(item) + "</td>" +
            "<td>" + escapeHtml(documentLabel) + "<div class='small'>" + escapeHtml(documentStatusLabel(item.document_status)) + "</div></td>" +
            "<td><div>" + escapeHtml(fileLabel) + "</div><div class='small path'>" + escapeHtml(item.original_file_path || "") + "</div></td>" +
            "<td>" + escapeHtml(item.chunk_count || "0") + "</td>" +
            "<td>" + escapeHtml(jobTypeLabel(item.job_type)) + "</td>" +
            "<td>" + renderAction(item) + "</td>" +
            "<td>" + escapeHtml(formatDate(item.started_at)) + "</td>" +
            "<td>" + escapeHtml(formatDate(item.finished_at)) + "</td>" +
            "<td class='small'>" + escapeHtml(item.error_message || "—") + "</td>" +
          "</tr>";
        }).join("") +
        "</tbody></table>";

      contentEl.querySelectorAll(".stop-btn").forEach((button) => {
        button.addEventListener("click", async () => {
          button.disabled = true;
          button.textContent = "Остановка...";

          try {
            const response = await fetch("/jobs/" + encodeURIComponent(button.dataset.jobId) + "/cancel", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: "{}",
            });
            const data = await response.json();
            if (!response.ok || data.ok !== true) {
              throw new Error(data.error || "Не удалось остановить задачу");
            }
          } catch (error) {
            alert(error.message || "Не удалось остановить задачу");
          } finally {
            await loadJobs();
          }
        });
      });

      contentEl.querySelectorAll(".retry-btn").forEach((button) => {
        button.addEventListener("click", async () => {
          button.disabled = true;
          button.textContent = "Запуск...";

          try {
            const response = await fetch("/jobs/" + encodeURIComponent(button.dataset.jobId) + "/retry", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: "{}",
            });
            const data = await response.json();
            if (!response.ok || data.ok !== true) {
              throw new Error(data.error || "Не удалось поставить повторный импорт в очередь");
            }
          } catch (error) {
            alert(error.message || "Не удалось поставить повторный импорт в очередь");
          } finally {
            await loadJobs();
          }
        });
      });
    }

    refreshBtn.addEventListener("click", loadJobs);
    statusFilterEl.addEventListener("change", loadJobs);
    limitFilterEl.addEventListener("change", loadJobs);
    searchFilterEl.addEventListener("input", loadJobs);
    loadJobs();
    setInterval(() => {
      if (autoRefreshEl.checked) {
        loadJobs();
      }
    }, 10000);
  </script>
</body>
</html>`;
}

export async function uiRoutes(app) {
  app.get("/ui/consult", async (_request, reply) => {
    reply.type("text/html; charset=utf-8");
    return renderConsultantHtml();
  });

  app.get("/ui/pages-search", async (_request, reply) => {
    reply.type("text/html; charset=utf-8");
    return renderPagesSearchHtml();
  });

  app.get("/ui/ingest", async (_request, reply) => {
    reply.type("text/html; charset=utf-8");
    return renderIngestHtml();
  });

  app.get("/ui/jobs", async (_request, reply) => {
    reply.type("text/html; charset=utf-8");
    return renderJobsHtml();
  });
}
