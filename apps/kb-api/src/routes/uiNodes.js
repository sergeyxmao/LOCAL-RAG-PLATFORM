export function renderNodesHtml() {
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Разделы базы знаний</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f4f6f8;
      --panel: #ffffff;
      --panel-2: #f8fafb;
      --text: #111c29;
      --muted: #617185;
      --line: #d7e0e8;
      --line-soft: #e7edf3;
      --accent: #176b87;
      --accent-soft: #eaf7fb;
      --ok: #0f7b55;
      --warn: #9a6500;
      --bad: #b3261e;
      --shadow: 0 18px 50px rgba(17, 28, 41, 0.08);
      --radius: 8px;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", Tahoma, sans-serif;
      background: var(--bg);
      color: var(--text);
      letter-spacing: 0;
    }
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      padding: 10px 22px;
      min-height: 58px;
      background: var(--panel);
      border-bottom: 1px solid var(--line);
      position: sticky;
      top: 0;
      z-index: 5;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 220px;
      font-weight: 800;
      color: var(--text);
      text-decoration: none;
      white-space: nowrap;
    }
    .brand-mark {
      width: 30px;
      height: 30px;
      display: inline-grid;
      place-items: center;
      border-radius: 8px;
      background: linear-gradient(135deg, #113a4a, #24a07b);
      color: #fff;
      font-size: 13px;
    }
    .main-nav {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .nav-link {
      color: #26323e;
      text-decoration: none;
      min-height: 34px;
      padding: 7px 11px;
      border-radius: 7px;
      border: 1px solid var(--line);
      background: #fff;
      display: inline-flex;
      align-items: center;
    }
    .nav-link.active {
      border-color: transparent;
      background: #14202c;
      color: #fff;
    }
    .wrap {
      width: 100%;
      max-width: 1520px;
      margin: 0 auto;
      padding: 16px 18px 24px;
    }
    .layout {
      display: grid;
      grid-template-columns: minmax(330px, 410px) minmax(0, 1fr);
      gap: 14px;
      align-items: start;
    }
    .panel {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      overflow: hidden;
    }
    .panel-head {
      padding: 14px;
      border-bottom: 1px solid var(--line);
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }
    .subhead {
      padding: 0;
      border: 0;
    }
    h1, h2, h3, p { margin: 0; }
    h1 { font-size: 22px; line-height: 1.15; }
    h2 { font-size: 18px; line-height: 1.2; }
    h3 { font-size: 15px; line-height: 1.25; }
    .lead {
      color: var(--muted);
      line-height: 1.4;
      margin-top: 6px;
      font-size: 13px;
    }
    .panel-body {
      padding: 14px;
      display: grid;
      gap: 12px;
    }
    .toolbar,
    .actions-row,
    .links-row,
    .badge-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
    }
    .btn {
      border: 1px solid var(--line);
      border-radius: 7px;
      background: var(--panel-2);
      color: var(--text);
      min-height: 36px;
      padding: 8px 12px;
      font: inherit;
      font-weight: 650;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .btn.primary {
      background: #14202c;
      border-color: #14202c;
      color: #fff;
    }
    .btn.danger {
      background: #fff5f4;
      border-color: #efb1ab;
      color: var(--bad);
    }
    .btn.soft { background: #fff; }
    .btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
    .status {
      border: 1px solid var(--line);
      border-radius: 7px;
      background: var(--panel-2);
      color: var(--muted);
      padding: 9px 10px;
      line-height: 1.4;
      font-size: 13px;
      min-height: 38px;
    }
    .status.ok {
      border-color: #b9ded0;
      background: #edf8f2;
      color: var(--ok);
    }
    .status.warn {
      border-color: #f0cf97;
      background: #fff7e8;
      color: var(--warn);
    }
    .status.bad {
      border-color: #efb7b7;
      background: #fff1f1;
      color: var(--bad);
    }
    .delete-panel {
      border: 1px solid #f0b9b5;
      border-radius: 7px;
      background: #fffafa;
      padding: 10px;
      display: grid;
      gap: 9px;
      margin-top: 10px;
    }
    .delete-panel.safe {
      border-color: #b9ded0;
      background: #f7fcf9;
    }
    .delete-summary {
      color: #5f2b28;
      font-size: 13px;
      line-height: 1.4;
    }
    .delete-panel.safe .delete-summary {
      color: #0d6f4f;
    }
    .tree {
      display: grid;
      gap: 7px;
      align-content: start;
      grid-auto-rows: max-content;
      max-height: calc(100vh - 230px);
      min-height: 420px;
      overflow: auto;
      padding-right: 2px;
    }
    .node-row {
      width: 100%;
      border: 1px solid var(--line);
      border-left: 5px solid var(--accent);
      border-radius: 7px;
      background: #fff;
      color: var(--text);
      text-align: left;
      padding: 9px 10px;
      cursor: pointer;
      display: grid;
      gap: 5px;
    }
    .node-row:hover {
      border-color: #b8cbd8;
      background: #fbfdfe;
    }
    .node-row.active {
      border-color: #8bc9d5;
      background: var(--accent-soft);
    }
    .node-row.drag-target {
      border-color: #20a47a;
      background: #edf8f2;
      box-shadow: inset 0 0 0 1px #20a47a;
    }
    .node-name {
      font-weight: 750;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .node-meta {
      color: var(--muted);
      font-size: 12px;
      line-height: 1.35;
    }
    .badge {
      border: 1px solid var(--line);
      border-radius: 999px;
      background: var(--panel-2);
      color: #344455;
      padding: 3px 8px;
      font-size: 12px;
      line-height: 1.2;
    }
    .badge.system {
      border-color: #cfd6dd;
      background: #f3f5f7;
      color: #657180;
    }
    .badge.ok {
      border-color: #b9ded0;
      background: #edf8f2;
      color: var(--ok);
    }
    .node-link-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
      min-width: 180px;
    }
    .node-link-badge {
      display: inline-flex;
      align-items: center;
      max-width: 240px;
      border: 1px solid #cbe7f0;
      border-radius: 999px;
      background: #f3fbfe;
      color: #0f5d78;
      padding: 3px 8px;
      font-size: 12px;
      line-height: 1.2;
      overflow-wrap: anywhere;
    }
    .node-link-badge.primary {
      border-color: #b9ded0;
      background: #edf8f2;
      color: var(--ok);
      font-weight: 750;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }
    .stat {
      border: 1px solid var(--line);
      border-radius: 7px;
      background: var(--panel-2);
      padding: 10px;
    }
    .stat strong {
      display: block;
      font-size: 19px;
      line-height: 1.2;
    }
    .stat span {
      color: var(--muted);
      font-size: 12px;
    }
    .readiness {
      border: 1px solid var(--line);
      border-radius: 7px;
      background: #fbfdff;
      padding: 10px;
      display: grid;
      gap: 8px;
    }
    .readiness-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
    }
    .readiness-title {
      font-weight: 800;
      font-size: 14px;
    }
    .readiness-percent {
      color: var(--accent);
      font-weight: 900;
    }
    .readiness-checks {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 6px;
    }
    .readiness-check {
      border: 1px solid var(--line-soft);
      border-radius: 7px;
      background: #fff;
      color: var(--muted);
      min-width: 0;
      padding: 7px 8px;
      font-size: 12px;
      line-height: 1.35;
    }
    .readiness-check strong {
      display: block;
      color: var(--text);
      margin-bottom: 2px;
    }
    .readiness-check.ok {
      border-color: #b9ded0;
      background: #f4fbf7;
    }
    .readiness-check.warn {
      border-color: #f0cf97;
      background: #fff9ee;
    }
    .readiness-check.bad {
      border-color: #efb7b7;
      background: #fff5f5;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 12px;
    }
    .box {
      border: 1px solid var(--line);
      border-radius: 7px;
      background: #fff;
      padding: 12px;
      display: grid;
      gap: 10px;
    }
    .field {
      display: grid;
      gap: 5px;
    }
    label {
      color: var(--muted);
      font-size: 12px;
    }
    input,
    select,
    textarea {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 7px;
      background: #fff;
      color: var(--text);
      min-height: 36px;
      padding: 8px 10px;
      font: inherit;
    }
    textarea {
      resize: vertical;
      min-height: 72px;
      line-height: 1.35;
    }
    input[type="color"] {
      padding: 3px;
      min-height: 38px;
    }
    input:disabled,
    select:disabled,
    textarea:disabled {
      background: #f3f5f7;
      color: #6a7684;
    }
    .form-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 96px;
      gap: 8px;
    }
    .bulk-controls {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 180px auto auto;
      gap: 8px;
      align-items: end;
    }
    .document-picker {
      border: 1px solid var(--line);
      border-radius: 7px;
      background: #fff;
      display: grid;
      gap: 0;
      max-height: 260px;
      overflow: auto;
    }
    .document-pick-row {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: 9px;
      align-items: start;
      padding: 9px 10px;
      border-bottom: 1px solid var(--line-soft);
    }
    .document-pick-row[draggable="true"],
    tr[draggable="true"] {
      cursor: grab;
    }
    .document-pick-row:last-child {
      border-bottom: 0;
    }
    .document-pick-row input {
      width: 16px;
      min-height: 16px;
      margin-top: 2px;
      padding: 0;
    }
    .document-pick-title {
      font-weight: 700;
      overflow-wrap: anywhere;
    }
    .document-pick-meta {
      color: var(--muted);
      font-size: 12px;
      line-height: 1.35;
      margin-top: 3px;
      overflow-wrap: anywhere;
    }
    .table-wrap {
      border: 1px solid var(--line);
      border-radius: 7px;
      overflow: auto;
      max-height: 320px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 680px;
    }
    th,
    td {
      padding: 9px 10px;
      border-bottom: 1px solid var(--line-soft);
      text-align: left;
      vertical-align: top;
      font-size: 13px;
    }
    th {
      color: #374556;
      background: var(--panel-2);
      font-weight: 750;
      position: sticky;
      top: 0;
    }
    .doc-title {
      font-weight: 700;
      max-width: 320px;
      word-break: break-word;
    }
    .muted {
      color: var(--muted);
      line-height: 1.4;
    }
    .empty {
      border: 1px dashed #c8d5e1;
      border-radius: 7px;
      background: var(--panel-2);
      color: var(--muted);
      padding: 14px;
      line-height: 1.4;
    }
    @media (max-width: 980px) {
      .topbar {
        align-items: flex-start;
        flex-direction: column;
      }
      .main-nav {
        justify-content: flex-start;
      }
      .layout,
      .grid-2 {
        grid-template-columns: 1fr;
      }
      .tree {
        max-height: none;
        min-height: 0;
      }
    }
    @media (max-width: 680px) {
      .wrap { padding: 10px; }
      .stats,
      .readiness-checks,
      .form-row { grid-template-columns: 1fr; }
      .bulk-controls { grid-template-columns: 1fr; }
      .links-row .btn,
      .actions-row .btn { width: 100%; }
    }
  </style>
</head>
<body>
  <header class="topbar">
    <a class="brand" href="/ui/consult"><span class="brand-mark">LR</span><span>LOCAL-RAG-PLATFORM</span></a>
    <nav class="main-nav" aria-label="Главная навигация">
      <a class="nav-link" href="/ui/consult">Консультант</a>
      <a class="nav-link" href="/ui/ingest">Загрузка документов</a>
      <a class="nav-link active" href="/ui/nodes">Разделы базы</a>
      <a class="nav-link" href="/ui/jobs">Админ / состояние базы</a>
      <a class="nav-link" href="/ui/pages-search">Поиск по страницам PDF</a>
    </nav>
  </header>

  <main class="wrap">
    <section class="layout">
      <aside class="panel">
        <div class="panel-head">
          <div>
            <h1>Разделы базы</h1>
            <p class="lead">Дерево рабочих объектов, проектов и папок документации.</p>
          </div>
          <div class="toolbar">
            <button id="refreshBtn" class="btn soft" type="button">Обновить</button>
            <a class="btn soft" href="/nodes/export" target="_blank" rel="noreferrer">Экспорт</a>
          </div>
        </div>
        <div class="panel-body">
          <div id="treeStatus" class="status">Разделы загружаются.</div>
          <div id="nodeTree" class="tree"></div>
        </div>
      </aside>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h2 id="detailTitle">Выберите раздел</h2>
            <p id="detailPath" class="lead">Контекст раздела появится после загрузки дерева.</p>
          </div>
          <div id="detailBadges" class="badge-row"></div>
        </div>
        <div class="panel-body">
          <div class="stats">
            <div class="stat"><strong id="directCount">0</strong><span>документов напрямую</span></div>
            <div class="stat"><strong id="scopeCount">0</strong><span>документов в разделе</span></div>
            <div class="stat"><strong id="pageCount">0</strong><span>PDF-страниц</span></div>
          </div>

          <div class="links-row">
            <a id="consultLink" class="btn soft" href="/ui/consult">Открыть в консультанте</a>
            <a id="ingestLink" class="btn soft" href="/ui/ingest">Загружать сюда</a>
            <a id="jobsLink" class="btn soft" href="/ui/jobs">Задачи раздела</a>
            <button id="syncBtn" class="btn soft" type="button">Сверить payload Qdrant</button>
          </div>
          <div id="actionStatus" class="status">Готово к работе.</div>
          <div class="readiness">
            <div class="readiness-head">
              <div>
                <div class="readiness-title">Готовность разделов базы</div>
                <p id="readinessSummary" class="lead">Проверяю backend, Qdrant и связи документов.</p>
              </div>
              <div id="readinessPercent" class="readiness-percent">—</div>
            </div>
            <div id="readinessChecks" class="readiness-checks"></div>
          </div>

          <div class="grid-2">
            <form id="createForm" class="box">
              <h3>Новый раздел</h3>
              <div class="field">
                <label for="createParent">Родитель</label>
                <select id="createParent"></select>
              </div>
              <div class="field">
                <label for="createName">Название</label>
                <input id="createName" type="text" placeholder="Например, Цех 2" required />
              </div>
              <div class="form-row">
                <div class="field">
                  <label for="createType">Тип</label>
                  <input id="createType" type="text" placeholder="Проект, цех, установка" />
                </div>
                <div class="field">
                  <label for="createColor">Цвет</label>
                  <input id="createColor" type="color" value="#176b87" />
                </div>
              </div>
              <div class="field">
                <label for="createDescription">Описание</label>
                <textarea id="createDescription" placeholder="Короткая пометка для себя"></textarea>
              </div>
              <button class="btn primary" type="submit">Создать раздел</button>
            </form>

            <div class="box">
              <h3>Выбранный раздел</h3>
              <div id="selectedNodeNotice" class="status warn" hidden></div>
              <div class="field">
                <label for="editName">Название</label>
                <input id="editName" type="text" />
              </div>
              <div class="form-row">
                <div class="field">
                  <label for="editType">Тип</label>
                  <input id="editType" type="text" />
                </div>
                <div class="field">
                  <label for="editColor">Цвет</label>
                  <input id="editColor" type="color" value="#176b87" />
                </div>
              </div>
              <div class="field">
                <label for="editDescription">Описание</label>
                <textarea id="editDescription"></textarea>
              </div>
              <div class="field">
                <label for="moveParent">Новый родитель</label>
                <select id="moveParent"></select>
              </div>
              <div class="actions-row">
                <button id="saveBtn" class="btn primary" type="button">Сохранить</button>
                <button id="moveBtn" class="btn soft" type="button">Переместить</button>
                <button id="deleteInfoBtn" class="btn soft" type="button">Проверить удаление</button>
              </div>
              <div id="deletePanel" class="delete-panel" hidden>
                <div id="deleteSummary" class="delete-summary"></div>
                <div id="deleteConfirmBox" class="field" hidden>
                  <label for="deleteConfirmName">Для удаления пустого раздела введите его название</label>
                  <input id="deleteConfirmName" type="text" autocomplete="off" />
                </div>
                <button id="deleteNodeBtn" class="btn danger" type="button" disabled>Удалить пустой раздел</button>
              </div>
            </div>
          </div>

          <div class="box">
            <div class="panel-head subhead">
              <div>
                <h3>Массовая привязка документов</h3>
                <p class="lead">Выберите документы из общей базы и привяжите их к текущему разделу.</p>
              </div>
              <button id="bulkReloadBtn" class="btn soft" type="button">Обновить список</button>
            </div>
            <div class="bulk-controls">
              <div class="field">
                <label for="bulkSearch">Поиск документа</label>
                <input id="bulkSearch" type="text" placeholder="Название, путь или тег" />
              </div>
              <div class="field">
                <label for="bulkMode">Режим</label>
                <select id="bulkMode">
                  <option value="add">Добавить раздел</option>
                  <option value="replace">Заменить разделы</option>
                </select>
              </div>
              <button id="bulkSelectVisibleBtn" class="btn soft" type="button">Выбрать видимые</button>
              <button id="bulkClearBtn" class="btn soft" type="button">Снять выбор</button>
            </div>
            <div id="bulkDocsBox" class="empty">Список документов ещё не загружен.</div>
            <div class="actions-row">
              <button id="bulkLinkBtn" class="btn primary" type="button">Привязать выбранные</button>
              <span id="bulkSelectionSummary" class="muted">Выбрано: 0. За один раз безопасно до 25 документов.</span>
            </div>
          </div>

          <div class="box">
            <div class="panel-head subhead">
              <div>
                <h3>Импорт дерева разделов</h3>
                <p class="lead">Вставьте JSON из экспорта. Импорт создаёт только отсутствующие пользовательские разделы.</p>
              </div>
            </div>
            <div class="field">
              <label for="importJson">JSON дерева</label>
              <textarea id="importJson" placeholder='{"items":[{"name":"Проект","children":[{"name":"Цех 1"}]}]}'></textarea>
            </div>
            <div class="actions-row">
              <button id="importCheckBtn" class="btn soft" type="button">Проверить JSON</button>
              <button id="importApplyBtn" class="btn primary" type="button">Импортировать отсутствующие</button>
            </div>
            <div id="importStatus" class="status">Удалений и изменений документов при импорте нет.</div>
          </div>

          <div class="box">
            <div class="panel-head subhead">
              <div>
                <h3>Документы выбранного раздела</h3>
                <p id="documentsHint" class="lead">Показаны первые документы с учётом вложенных разделов.</p>
              </div>
              <div class="toolbar">
                <button id="documentsRefreshBtn" class="btn soft" type="button">Обновить список</button>
                <button id="unlinkSelectedBtn" class="btn danger" type="button" disabled>Убрать из текущего раздела</button>
              </div>
            </div>
            <div id="documentsBox" class="empty">Выберите раздел, чтобы увидеть документы.</div>
            <div id="scopedSelectionSummary" class="muted">Выбрано: 0. Отвязка доступна для пользовательских разделов.</div>
          </div>
        </div>
      </section>
    </section>
  </main>

  <script>
    const nodeTreeEl = document.getElementById("nodeTree");
    const treeStatusEl = document.getElementById("treeStatus");
    const detailTitleEl = document.getElementById("detailTitle");
    const detailPathEl = document.getElementById("detailPath");
    const detailBadgesEl = document.getElementById("detailBadges");
    const directCountEl = document.getElementById("directCount");
    const scopeCountEl = document.getElementById("scopeCount");
    const pageCountEl = document.getElementById("pageCount");
    const consultLinkEl = document.getElementById("consultLink");
    const ingestLinkEl = document.getElementById("ingestLink");
    const jobsLinkEl = document.getElementById("jobsLink");
    const actionStatusEl = document.getElementById("actionStatus");
    const createFormEl = document.getElementById("createForm");
    const createParentEl = document.getElementById("createParent");
    const createNameEl = document.getElementById("createName");
    const createTypeEl = document.getElementById("createType");
    const createColorEl = document.getElementById("createColor");
    const createDescriptionEl = document.getElementById("createDescription");
    const editNameEl = document.getElementById("editName");
    const editTypeEl = document.getElementById("editType");
    const editColorEl = document.getElementById("editColor");
    const editDescriptionEl = document.getElementById("editDescription");
    const moveParentEl = document.getElementById("moveParent");
    const selectedNodeNoticeEl = document.getElementById("selectedNodeNotice");
    const saveBtn = document.getElementById("saveBtn");
    const moveBtn = document.getElementById("moveBtn");
    const deleteInfoBtn = document.getElementById("deleteInfoBtn");
    const deletePanelEl = document.getElementById("deletePanel");
    const deleteSummaryEl = document.getElementById("deleteSummary");
    const deleteConfirmBoxEl = document.getElementById("deleteConfirmBox");
    const deleteConfirmNameEl = document.getElementById("deleteConfirmName");
    const deleteNodeBtn = document.getElementById("deleteNodeBtn");
    const syncBtn = document.getElementById("syncBtn");
    const refreshBtn = document.getElementById("refreshBtn");
    const documentsRefreshBtn = document.getElementById("documentsRefreshBtn");
    const unlinkSelectedBtn = document.getElementById("unlinkSelectedBtn");
    const documentsBoxEl = document.getElementById("documentsBox");
    const documentsHintEl = document.getElementById("documentsHint");
    const scopedSelectionSummaryEl = document.getElementById("scopedSelectionSummary");
    const bulkReloadBtn = document.getElementById("bulkReloadBtn");
    const bulkSearchEl = document.getElementById("bulkSearch");
    const bulkModeEl = document.getElementById("bulkMode");
    const bulkSelectVisibleBtn = document.getElementById("bulkSelectVisibleBtn");
    const bulkClearBtn = document.getElementById("bulkClearBtn");
    const bulkDocsBoxEl = document.getElementById("bulkDocsBox");
    const bulkLinkBtn = document.getElementById("bulkLinkBtn");
    const bulkSelectionSummaryEl = document.getElementById("bulkSelectionSummary");
    const importJsonEl = document.getElementById("importJson");
    const importCheckBtn = document.getElementById("importCheckBtn");
    const importApplyBtn = document.getElementById("importApplyBtn");
    const importStatusEl = document.getElementById("importStatus");
    const readinessSummaryEl = document.getElementById("readinessSummary");
    const readinessPercentEl = document.getElementById("readinessPercent");
    const readinessChecksEl = document.getElementById("readinessChecks");

    let flatNodes = [];
    let selectedNodeId = "";
    let allDocuments = [];
    let visibleBulkDocumentIds = [];
    let selectedBulkDocumentIds = new Set();
    let selectedScopedDocumentIds = new Set();
    let lastDeleteInfo = null;

    function escapeHtml(value) {
      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function formatNumber(value) {
      return Number(value || 0).toLocaleString("ru-RU");
    }

    function setStatus(element, message, tone) {
      element.textContent = message;
      element.className = "status" + (tone ? " " + tone : "");
    }

    function resetDeletePanel() {
      lastDeleteInfo = null;
      deletePanelEl.hidden = true;
      deletePanelEl.classList.remove("safe");
      deleteSummaryEl.textContent = "";
      deleteConfirmBoxEl.hidden = true;
      deleteConfirmNameEl.value = "";
      deleteNodeBtn.disabled = true;
      deleteNodeBtn.textContent = "Удалить пустой раздел";
    }

    function renderSystemNodeLock() {
      lastDeleteInfo = null;
      deletePanelEl.hidden = false;
      deletePanelEl.classList.remove("safe");
      deleteConfirmBoxEl.hidden = true;
      deleteConfirmNameEl.value = "";
      deleteNodeBtn.disabled = true;
      deleteNodeBtn.textContent = "Системный раздел не удаляется";
      deleteSummaryEl.textContent = "Системный раздел нельзя удалить, переименовать или переместить. " +
        "Он нужен для документов без явной привязки; обычные разделы создавайте и редактируйте отдельно.";
    }

    function validateDeleteConfirmation() {
      const node = currentNode();
      if (!node || !lastDeleteInfo || deleteConfirmBoxEl.hidden) {
        deleteNodeBtn.disabled = true;
        return;
      }

      deleteNodeBtn.disabled = deleteConfirmNameEl.value.trim() !== node.name;
    }

    function renderDeleteInfo(data) {
      const node = currentNode();
      const descendantCount = Number(data.descendantCount ?? 0);
      const directDocuments = Number(data.directDocuments ?? 0);
      const scopeDocuments = Number(data.scopeDocuments ?? 0);
      const scopePages = Number(data.scopePages ?? 0);
      const isSystem = data.node?.isSystem === true || node?.isSystem === true;
      const canDeleteEmpty = !isSystem && descendantCount === 0 && directDocuments === 0;

      lastDeleteInfo = data;
      deletePanelEl.hidden = false;
      deletePanelEl.classList.toggle("safe", canDeleteEmpty);
      deleteConfirmBoxEl.hidden = !canDeleteEmpty;
      deleteConfirmNameEl.value = "";

      if (isSystem) {
        deleteSummaryEl.textContent = "Системный раздел удалить нельзя. Проверка: потомков " +
          formatNumber(descendantCount) + ", документов " + formatNumber(scopeDocuments) +
          ", страниц " + formatNumber(scopePages) + ".";
      } else if (descendantCount > 0) {
        deleteSummaryEl.textContent = "Раздел не пустой: есть вложенные разделы (" +
          formatNumber(descendantCount) + "). Сначала переместите или удалите вложенные разделы.";
      } else if (directDocuments > 0) {
        deleteSummaryEl.textContent = "Раздел не пустой: документов напрямую " +
          formatNumber(directDocuments) + ". Безопасное удаление доступно только для пустых разделов.";
      } else {
        deleteSummaryEl.textContent = "Раздел пустой: документов 0, вложенных разделов 0. Для удаления введите точное название раздела.";
      }

      validateDeleteConfirmation();
    }

    function documentTitle(item) {
      return item.title || item.originalFileName || item.original_file_name || item.id;
    }

    function documentPath(item) {
      return item.originalFilePath || item.original_file_path || "";
    }

    function documentChunkCount(item) {
      return item.chunkCount ?? item.chunk_count ?? 0;
    }

    function documentPageCount(item) {
      return item.pageCount ?? item.page_count ?? 0;
    }

    function documentNodeLinks(item) {
      const links = item.nodeLinks || item.node_links || [];
      return Array.isArray(links) ? links.filter((link) => link && link.name) : [];
    }

    function renderDocumentNodeLinks(item) {
      const links = documentNodeLinks(item);
      if (!links.length) {
        return '<span class="muted">нет явной привязки</span>';
      }

      return '<div class="node-link-row">' + links.map((link) => {
        const label = (link.typeLabel || link.type_label)
          ? String(link.typeLabel || link.type_label) + ": " + link.name
          : link.name;
        const primary = link.isPrimary === true || link.is_primary === true;
        return '<span class="node-link-badge' + (primary ? " primary" : "") + '">' +
          escapeHtml(label) +
          (primary ? " · основной" : "") +
          '</span>';
      }).join("") + '</div>';
    }

    async function fetchJson(url, options) {
      const response = await fetch(url, options);
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.ok === false) {
        throw new Error(data?.error || "HTTP " + response.status);
      }
      return data;
    }

    function readinessTone(check) {
      if (check.ok) {
        return "ok";
      }
      return check.level === "bad" ? "bad" : "warn";
    }

    function renderReadinessStatus(data) {
      const statusLabel = data.status === "ready"
        ? "готово"
        : data.status === "problem"
          ? "есть блокирующие проблемы"
          : "нужно внимание";
      readinessPercentEl.textContent = formatNumber(data.progressPercent || 0) + "%";
      readinessSummaryEl.textContent =
        "Статус: " + statusLabel + ". Проверок пройдено: " +
        formatNumber(data.passed || 0) + " из " + formatNumber(data.total || 0) + ".";

      readinessChecksEl.innerHTML = (data.checks || [])
        .map((check) => (
          '<div class="readiness-check ' + readinessTone(check) + '">' +
            '<strong>' + (check.ok ? "✓ " : "! ") + escapeHtml(check.label) + '</strong>' +
            '<span>' + escapeHtml(check.details || "") + '</span>' +
          '</div>'
        ))
        .join("");
    }

    async function loadReadinessStatus() {
      try {
        const data = await fetchJson("/admin/knowledge-nodes-status");
        renderReadinessStatus(data);
      } catch (error) {
        readinessPercentEl.textContent = "—";
        readinessSummaryEl.textContent = "Не удалось проверить готовность разделов: " + error.message;
        readinessChecksEl.innerHTML = "";
      }
    }

    function parseImportJson() {
      const raw = importJsonEl.value.trim();
      if (!raw) {
        throw new Error("Вставьте JSON дерева разделов.");
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return { items: parsed };
      }
      if (parsed && Array.isArray(parsed.items)) {
        return parsed;
      }
      throw new Error("JSON должен быть экспортом с массивом items.");
    }

    function importSummaryText(data) {
      const summary = data.summary || {};
      const planned = Number(summary.created || 0);
      const existing = Number(summary.existing || 0);
      const skippedSystem = Number(summary.skippedSystem || 0);
      const skippedInactive = Number(summary.skippedInactive || 0);
      const prefix = data.dryRun ? "Проверка завершена." : "Импорт завершён.";
      const createdPreview = Array.isArray(data.createdNodes) && data.createdNodes.length
        ? " Первые разделы: " + data.createdNodes.slice(0, 5).map((item) => item.path || item.name).join("; ") + "."
        : "";
      return prefix + " Создать: " + formatNumber(planned) +
        ", уже есть: " + formatNumber(existing) +
        ", пропущено системных: " + formatNumber(skippedSystem) +
        ", неактивных: " + formatNumber(skippedInactive) + "." +
        createdPreview;
    }

    function syncSummaryText(sync) {
      if (!sync) {
        return "";
      }
      if (sync.ok === false) {
        return " Payload не обновлён: " + (sync.error || "ошибка Qdrant") +
          ". Можно нажать «Сверить payload Qdrant».";
      }
      if (Number(sync.updatedDocuments || 0) === 0 && Number(sync.updatedPoints || 0) === 0) {
        return " Payload проверен: в выбранном разделе нет документов с Qdrant-точками.";
      }
      if (Number(sync.updatedDocuments || 0) > 0 && Number(sync.updatedPoints || 0) === 0) {
        return " Payload проверен: документы есть, но Qdrant-точек для них не найдено.";
      }
      return " Payload обновлён автоматически: документов " +
        formatNumber(sync.updatedDocuments) + ", точек " +
        formatNumber(sync.updatedPoints) + ".";
    }

    async function runTreeImport(dryRun) {
      let payload;
      try {
        payload = parseImportJson();
      } catch (error) {
        setStatus(importStatusEl, "Не удалось прочитать JSON: " + error.message, "bad");
        return;
      }

      if (!dryRun && !window.confirm("Импортировать отсутствующие разделы из JSON? Документы и существующие разделы не изменяются.")) {
        return;
      }

      try {
        setStatus(importStatusEl, dryRun ? "Проверяю JSON дерева." : "Импортирую отсутствующие разделы.");
        const data = await fetchJson("/nodes/import?dryRun=" + (dryRun ? "true" : "false"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setStatus(importStatusEl, importSummaryText(data), "ok");
        if (!dryRun) {
          await loadNodes(selectedNodeId);
        }
      } catch (error) {
        setStatus(importStatusEl, "Не удалось импортировать дерево: " + error.message, "bad");
      }
    }

    function flattenTree(items, depth, pathParts) {
      const rows = [];
      for (const item of items || []) {
        const path = pathParts.concat(item.name || "Без названия");
        rows.push({ ...item, depth, path: path.join(" / ") });
        rows.push(...flattenTree(item.children || [], depth + 1, path));
      }
      return rows;
    }

    function currentNode() {
      return flatNodes.find((item) => String(item.id) === String(selectedNodeId)) || null;
    }

    function descendantsOf(nodeId) {
      const blocked = new Set([String(nodeId)]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const item of flatNodes) {
          if (item.parentId && blocked.has(String(item.parentId)) && !blocked.has(String(item.id))) {
            blocked.add(String(item.id));
            changed = true;
          }
        }
      }
      return blocked;
    }

    function activeUserNodes() {
      return flatNodes.filter((item) => item.isActive !== false && item.isSystem !== true);
    }

    function optionLabel(item) {
      const prefix = item.depth > 0 ? "  ".repeat(item.depth) + "- " : "";
      const docs = item.counts?.scopeDocuments ?? 0;
      return prefix + item.name + " (" + docs + ")";
    }

    function renderParentSelects() {
      const createOptions = ['<option value="">Корень дерева</option>']
        .concat(activeUserNodes().map((item) =>
          '<option value="' + escapeHtml(item.id) + '">' + escapeHtml(optionLabel(item)) + '</option>'
        ))
        .join("");
      createParentEl.innerHTML = createOptions;

      const node = currentNode();
      const blocked = node ? descendantsOf(node.id) : new Set();
      const moveOptions = ['<option value="">Корень дерева</option>']
        .concat(activeUserNodes()
          .filter((item) => !blocked.has(String(item.id)))
          .map((item) =>
            '<option value="' + escapeHtml(item.id) + '">' + escapeHtml(optionLabel(item)) + '</option>'
          ))
        .join("");
      moveParentEl.innerHTML = moveOptions;
      if (node) {
        moveParentEl.value = node.parentId || "";
      }
    }

    function renderTree() {
      if (!flatNodes.length) {
        nodeTreeEl.innerHTML = '<div class="empty">Разделы ещё не созданы.</div>';
        return;
      }

      nodeTreeEl.innerHTML = flatNodes.map((item) => {
        const counts = item.counts || {};
        const color = item.color || "#176b87";
        const activeClass = String(item.id) === String(selectedNodeId) ? " active" : "";
        const type = item.typeLabel && !(item.isSystem && item.typeLabel === "Системный")
          ? '<span class="badge">' + escapeHtml(item.typeLabel) + '</span>'
          : "";
        const system = item.isSystem ? '<span class="badge system">Системный</span>' : "";
        return '<button class="node-row' + activeClass + '" type="button" data-node-id="' + escapeHtml(item.id) + '" style="border-left-color:' + escapeHtml(color) + ';padding-left:' + (10 + item.depth * 18) + 'px;">'
          + '<span class="node-name">' + escapeHtml(item.name) + '</span>'
          + '<span class="badge-row">' + type + system + '</span>'
          + '<span class="node-meta">' + formatNumber(counts.directDocuments) + ' напрямую · ' + formatNumber(counts.scopeDocuments) + ' в разделе · ' + formatNumber(counts.scopePages) + ' страниц</span>'
          + '</button>';
      }).join("");
    }

    function syncUrl() {
      const url = new URL(window.location.href);
      if (selectedNodeId) {
        url.searchParams.set("nodeId", selectedNodeId);
      } else {
        url.searchParams.delete("nodeId");
      }
      window.history.replaceState({}, "", url.pathname + url.search);
    }

    function renderDetails() {
      const node = currentNode();
      if (!node) {
        detailTitleEl.textContent = "Выберите раздел";
        detailPathEl.textContent = "Контекст раздела появится после загрузки дерева.";
        detailBadgesEl.innerHTML = "";
        directCountEl.textContent = "0";
        scopeCountEl.textContent = "0";
        pageCountEl.textContent = "0";
        saveBtn.disabled = true;
        moveBtn.disabled = true;
        deleteInfoBtn.disabled = true;
        syncBtn.disabled = true;
        selectedNodeNoticeEl.hidden = true;
        selectedNodeNoticeEl.textContent = "";
        resetDeletePanel();
        renderBulkSelectionSummary();
        return;
      }

      const counts = node.counts || {};
      detailTitleEl.textContent = node.name;
      detailPathEl.textContent = node.path || node.name;
      detailBadgesEl.innerHTML =
        (node.typeLabel && !(node.isSystem && node.typeLabel === "Системный") ? '<span class="badge">' + escapeHtml(node.typeLabel) + '</span>' : "") +
        (node.isSystem ? '<span class="badge system">Системный</span>' : '<span class="badge ok">Пользовательский</span>');
      directCountEl.textContent = formatNumber(counts.directDocuments);
      scopeCountEl.textContent = formatNumber(counts.scopeDocuments);
      pageCountEl.textContent = formatNumber(counts.scopePages);

      const scoped = "?nodeId=" + encodeURIComponent(node.id) + "&includeChildren=true";
      consultLinkEl.href = "/ui/consult" + scoped;
      ingestLinkEl.href = "/ui/ingest" + scoped;
      jobsLinkEl.href = "/ui/jobs" + scoped;

      editNameEl.value = node.name || "";
      editTypeEl.value = node.typeLabel || "";
      editColorEl.value = /^#[0-9a-f]{6}$/i.test(node.color || "") ? node.color : "#176b87";
      editDescriptionEl.value = node.description || "";
      renderParentSelects();

      const locked = node.isSystem === true;
      editNameEl.disabled = locked;
      editTypeEl.disabled = locked;
      editColorEl.disabled = locked;
      editDescriptionEl.disabled = locked;
      moveParentEl.disabled = locked;
      saveBtn.disabled = locked;
      moveBtn.disabled = locked;
      deleteInfoBtn.disabled = locked;
      syncBtn.disabled = false;
      selectedNodeNoticeEl.hidden = !locked;
      selectedNodeNoticeEl.textContent = locked
        ? "Это системный раздел для документов без явной привязки. Его нельзя редактировать, перемещать, удалять или вручную пополнять."
        : "";
      resetDeletePanel();
      if (locked) {
        renderSystemNodeLock();
      }
      renderBulkSelectionSummary();
    }

    function filteredBulkDocuments() {
      const query = bulkSearchEl.value.trim().toLowerCase();
      const items = query
        ? allDocuments.filter((item) => {
            const text = [
              documentTitle(item),
              documentPath(item),
              item.status,
              ...(Array.isArray(item.categories) ? item.categories : []),
            ].join(" ").toLowerCase();
            return text.includes(query);
          })
        : allDocuments;
      return items.slice(0, 100);
    }

    function renderBulkSelectionSummary() {
      const selectedCount = selectedBulkDocumentIds.size;
      const node = currentNode();
      bulkSelectionSummaryEl.textContent =
        node?.isSystem === true
          ? "Выбрано: " + selectedCount + ". К системному разделу документы не привязываются вручную."
          : "Выбрано: " + selectedCount + ". За один раз безопасно до 25 документов.";
      bulkLinkBtn.disabled = selectedCount === 0 || !node || node.isSystem === true;
    }

    function renderScopedSelectionSummary() {
      const node = currentNode();
      const selectedCount = selectedScopedDocumentIds.size;
      let text = "Выбрано: " + selectedCount + ".";

      if (!node) {
        text += " Выберите раздел.";
      } else if (node.isSystem) {
        text += " Отвязка от системного раздела недоступна через UI.";
      } else if (selectedCount > 25) {
        text += " За один раз безопасно до 25 документов.";
      } else {
        text += " Можно убрать выбранные документы из текущего раздела.";
      }

      scopedSelectionSummaryEl.textContent = text;
      unlinkSelectedBtn.disabled =
        !node || node.isSystem === true || selectedCount === 0 || selectedCount > 25;
    }

    function renderBulkDocuments() {
      const items = filteredBulkDocuments();
      visibleBulkDocumentIds = items.map((item) => item.id);
      if (!allDocuments.length) {
        bulkDocsBoxEl.className = "empty";
        bulkDocsBoxEl.textContent = "Документы ещё не загружены.";
        renderBulkSelectionSummary();
        return;
      }
      if (!items.length) {
        bulkDocsBoxEl.className = "empty";
        bulkDocsBoxEl.textContent = "По этому фильтру документов не найдено.";
        renderBulkSelectionSummary();
        return;
      }

      bulkDocsBoxEl.className = "document-picker";
      bulkDocsBoxEl.innerHTML = items.map((item) => {
        const checked = selectedBulkDocumentIds.has(String(item.id)) ? " checked" : "";
        const tags = Array.isArray(item.categories) && item.categories.length
          ? " · " + item.categories.map((tag) => "#" + tag).join(", ")
          : "";
        return '<label class="document-pick-row" draggable="true" data-drag-document-id="' + escapeHtml(item.id) + '">'
          + '<input type="checkbox" data-bulk-document-id="' + escapeHtml(item.id) + '"' + checked + ' />'
          + '<span><span class="document-pick-title">' + escapeHtml(documentTitle(item)) + '</span>'
          + '<span class="document-pick-meta">' + escapeHtml(documentPath(item)) + '</span>'
          + '<span class="document-pick-meta">' + escapeHtml(item.status || "") + " · chunks " + formatNumber(documentChunkCount(item)) + " · страниц " + formatNumber(documentPageCount(item)) + escapeHtml(tags) + '</span></span>'
          + '</label>';
      }).join("");
      renderBulkSelectionSummary();
    }

    async function loadBulkDocuments() {
      bulkDocsBoxEl.className = "empty";
      bulkDocsBoxEl.textContent = "Загружаю список документов.";
      const data = await fetchJson("/documents?limit=100");
      allDocuments = Array.isArray(data.items) ? data.items : [];
      selectedBulkDocumentIds = new Set(
        Array.from(selectedBulkDocumentIds).filter((id) =>
          allDocuments.some((item) => String(item.id) === String(id))
        )
      );
      renderBulkDocuments();
    }

    async function loadNodeDocuments() {
      const node = currentNode();
      if (!node) {
        documentsBoxEl.className = "empty";
        documentsBoxEl.textContent = "Выберите раздел, чтобы увидеть документы.";
        selectedScopedDocumentIds = new Set();
        renderScopedSelectionSummary();
        return;
      }

      documentsBoxEl.className = "empty";
      documentsBoxEl.textContent = "Документы загружаются.";
      const data = await fetchJson("/nodes/" + encodeURIComponent(node.id) + "/documents?includeChildren=true&limit=25");
      const items = Array.isArray(data.items) ? data.items : [];
      documentsHintEl.textContent = "Показаны первые " + items.length + " документов с учётом вложенных разделов.";
      selectedScopedDocumentIds = new Set(
        Array.from(selectedScopedDocumentIds).filter((id) =>
          items.some((item) => String(item.id) === String(id))
        )
      );

      if (!items.length) {
        documentsBoxEl.className = "empty";
        documentsBoxEl.textContent = "В этом разделе документов пока нет.";
        renderScopedSelectionSummary();
        return;
      }

      documentsBoxEl.className = "table-wrap";
      documentsBoxEl.innerHTML =
        '<table><thead><tr><th>Выбор</th><th>Документ</th><th>Разделы</th><th>Статус</th><th>Chunks</th><th>Страницы</th><th>Теги</th></tr></thead><tbody>' +
        items.map((item) => {
          const tags = Array.isArray(item.categories) && item.categories.length
            ? item.categories.map((tag) => "#" + tag).join(", ")
            : "нет";
          const id = String(item.id || "");
          const checked = selectedScopedDocumentIds.has(id) ? " checked" : "";
          return '<tr draggable="true" data-drag-document-id="' + escapeHtml(id) + '">'
            + '<td><input type="checkbox" data-scoped-document-id="' + escapeHtml(id) + '"' + checked + ' /></td>'
            + '<td><div class="doc-title">' + escapeHtml(item.title || item.originalFileName || item.id) + '</div><div class="muted">' + escapeHtml(item.originalFilePath || "") + '</div></td>'
            + '<td>' + renderDocumentNodeLinks(item) + '</td>'
            + '<td>' + escapeHtml(item.status || "") + '</td>'
            + '<td>' + formatNumber(item.chunkCount) + '</td>'
            + '<td>' + formatNumber(item.pageCount) + '</td>'
            + '<td>' + escapeHtml(tags) + '</td>'
            + '</tr>';
        }).join("") +
        '</tbody></table>';
      renderScopedSelectionSummary();
    }

    function selectNode(nodeId, options) {
      if (String(nodeId || "") !== String(selectedNodeId || "")) {
        selectedScopedDocumentIds = new Set();
      }
      selectedNodeId = nodeId || "";
      syncUrl();
      renderTree();
      renderDetails();
      if (!options || options.loadDocuments !== false) {
        loadNodeDocuments().catch((error) => {
          documentsBoxEl.className = "empty";
          documentsBoxEl.textContent = "Не удалось загрузить документы: " + error.message;
        });
      }
    }

    function dragDocumentIdFromTarget(target) {
      const row = target.closest("[data-drag-document-id]");
      return row ? String(row.dataset.dragDocumentId || "") : "";
    }

    function clearNodeDragTargets() {
      nodeTreeEl.querySelectorAll(".drag-target").forEach((item) => {
        item.classList.remove("drag-target");
      });
    }

    function nodeFromTreeRow(row) {
      const nodeId = row ? String(row.dataset.nodeId || "") : "";
      return flatNodes.find((item) => String(item.id) === nodeId) || null;
    }

    async function linkDraggedDocument(documentId, node, mode) {
      const body = {
        documentIds: [documentId],
        nodeIds: [node.id],
        mode,
      };
      if (mode === "replace") {
        body.primaryNodeId = node.id;
      }

      const data = await fetchJson("/documents/bulk-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      selectedBulkDocumentIds = new Set();
      selectedScopedDocumentIds = new Set();
      setStatus(
        actionStatusEl,
        (mode === "add" ? "Документ добавлен в раздел: " : "Документ перенесён в раздел: ") +
          node.name +
          ". Обновлено документов: " +
          formatNumber(data.updatedDocuments) +
          ".",
        "ok"
      );
      await loadNodes(node.id);
      await loadBulkDocuments();
    }

    async function loadNodes(preferredNodeId) {
      setStatus(treeStatusEl, "Разделы загружаются.");
      const data = await fetchJson("/nodes?format=tree&includeInactive=true");
      flatNodes = flattenTree(data.items || [], 0, []);
      const urlNodeId = new URL(window.location.href).searchParams.get("nodeId");
      const targetId = preferredNodeId || selectedNodeId || urlNodeId;
      const targetExists = flatNodes.some((item) => String(item.id) === String(targetId));
      const systemNode = flatNodes.find((item) => item.isSystem === true);
      selectedNodeId = targetExists ? targetId : (systemNode?.id || flatNodes[0]?.id || "");
      renderParentSelects();
      renderTree();
      renderDetails();
      setStatus(treeStatusEl, "Разделов в дереве: " + formatNumber(flatNodes.length), "ok");
      await loadReadinessStatus();
      await loadNodeDocuments();
    }

    function selectedPayloadFromEdit() {
      return {
        name: editNameEl.value.trim(),
        typeLabel: editTypeEl.value.trim() || null,
        color: editColorEl.value || null,
        description: editDescriptionEl.value.trim() || null,
      };
    }

    nodeTreeEl.addEventListener("click", (event) => {
      const row = event.target.closest("[data-node-id]");
      if (row) {
        selectNode(row.dataset.nodeId);
      }
    });

    document.addEventListener("dragstart", (event) => {
      const documentId = dragDocumentIdFromTarget(event.target);
      if (!documentId || !event.dataTransfer) {
        return;
      }
      event.dataTransfer.effectAllowed = "copyMove";
      event.dataTransfer.setData("application/x-localrag-document-id", documentId);
      event.dataTransfer.setData("text/plain", documentId);
    });

    nodeTreeEl.addEventListener("dragover", (event) => {
      const row = event.target.closest("[data-node-id]");
      const node = nodeFromTreeRow(row);
      clearNodeDragTargets();
      if (!row || !node || node.isSystem === true) {
        return;
      }
      event.preventDefault();
      event.dataTransfer.dropEffect = event.shiftKey ? "copy" : "move";
      row.classList.add("drag-target");
    });

    nodeTreeEl.addEventListener("dragleave", (event) => {
      const row = event.target.closest("[data-node-id]");
      if (!row || row.contains(event.relatedTarget)) {
        return;
      }
      row.classList.remove("drag-target");
    });

    nodeTreeEl.addEventListener("drop", async (event) => {
      const row = event.target.closest("[data-node-id]");
      const node = nodeFromTreeRow(row);
      clearNodeDragTargets();
      if (!row || !node || node.isSystem === true) {
        return;
      }
      event.preventDefault();
      const documentId =
        event.dataTransfer.getData("application/x-localrag-document-id") ||
        event.dataTransfer.getData("text/plain");
      if (!documentId) {
        return;
      }

      const mode = event.shiftKey ? "add" : "replace";
      try {
        setStatus(
          actionStatusEl,
          mode === "add"
            ? "Добавляю документ в раздел: " + node.name + "."
            : "Переношу документ в раздел: " + node.name + "."
        );
        await linkDraggedDocument(documentId, node, mode);
      } catch (error) {
        setStatus(actionStatusEl, "Не удалось привязать документ перетаскиванием: " + error.message, "bad");
      }
    });

    createFormEl.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = createNameEl.value.trim();
      if (!name) {
        setStatus(actionStatusEl, "Введите название нового раздела.", "warn");
        return;
      }

      try {
        setStatus(actionStatusEl, "Создаю раздел.");
        const data = await fetchJson("/nodes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parentId: createParentEl.value || null,
            name,
            typeLabel: createTypeEl.value.trim() || null,
            color: createColorEl.value || null,
            description: createDescriptionEl.value.trim() || null,
          }),
        });
        createNameEl.value = "";
        createTypeEl.value = "";
        createDescriptionEl.value = "";
        setStatus(actionStatusEl, "Раздел создан: " + data.node.name, "ok");
        await loadNodes(data.node.id);
      } catch (error) {
        setStatus(actionStatusEl, "Не удалось создать раздел: " + error.message, "bad");
      }
    });

    saveBtn.addEventListener("click", async () => {
      const node = currentNode();
      if (!node || node.isSystem) {
        setStatus(actionStatusEl, "Системный раздел нельзя изменять.", "warn");
        return;
      }
      const payload = selectedPayloadFromEdit();
      if (!payload.name) {
        setStatus(actionStatusEl, "Введите название раздела.", "warn");
        return;
      }

      try {
        setStatus(actionStatusEl, "Сохраняю раздел.");
        const data = await fetchJson("/nodes/" + encodeURIComponent(node.id), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setStatus(actionStatusEl, "Раздел сохранён: " + data.node.name + "." + syncSummaryText(data.sync), data.sync?.ok === false ? "warn" : "ok");
        await loadNodes(data.node.id);
      } catch (error) {
        setStatus(actionStatusEl, "Не удалось сохранить раздел: " + error.message, "bad");
      }
    });

    moveBtn.addEventListener("click", async () => {
      const node = currentNode();
      if (!node || node.isSystem) {
        setStatus(actionStatusEl, "Системный раздел нельзя перемещать.", "warn");
        return;
      }

      try {
        setStatus(actionStatusEl, "Перемещаю раздел.");
        const data = await fetchJson("/nodes/" + encodeURIComponent(node.id) + "/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newParentId: moveParentEl.value || null }),
        });
        setStatus(actionStatusEl, "Раздел перемещён: " + data.node.name + "." + syncSummaryText(data.sync), data.sync?.ok === false ? "warn" : "ok");
        await loadNodes(data.node.id);
      } catch (error) {
        setStatus(actionStatusEl, "Не удалось переместить раздел: " + error.message, "bad");
      }
    });

    deleteInfoBtn.addEventListener("click", async () => {
      const node = currentNode();
      if (!node) {
        return;
      }
      if (node.isSystem) {
        renderSystemNodeLock();
        setStatus(actionStatusEl, "Системный раздел нельзя удалить или переместить.", "warn");
        return;
      }
      try {
        const data = await fetchJson("/nodes/" + encodeURIComponent(node.id) + "/delete-info");
        renderDeleteInfo(data);
        setStatus(
          actionStatusEl,
          "Потомков: " + formatNumber(data.descendantCount) +
            ", документов напрямую: " + formatNumber(data.directDocuments) +
            ", документов в разделе: " + formatNumber(data.scopeDocuments) +
            ", страниц: " + formatNumber(data.scopePages) + ".",
          (data.node?.isSystem || data.descendantCount > 0 || data.directDocuments > 0) ? "warn" : "ok"
        );
      } catch (error) {
        setStatus(actionStatusEl, "Не удалось получить проверку удаления: " + error.message, "bad");
      }
    });

    deleteConfirmNameEl.addEventListener("input", validateDeleteConfirmation);

    deleteNodeBtn.addEventListener("click", async () => {
      const node = currentNode();
      if (!node || node.isSystem || !lastDeleteInfo) {
        setStatus(actionStatusEl, "Удаление недоступно для выбранного раздела.", "warn");
        return;
      }

      if (deleteConfirmNameEl.value.trim() !== node.name) {
        setStatus(actionStatusEl, "Введите точное название раздела для подтверждения.", "warn");
        validateDeleteConfirmation();
        return;
      }

      if (!window.confirm('Удалить пустой раздел "' + node.name + '"? Документы не удаляются.')) {
        return;
      }

      try {
        setStatus(actionStatusEl, "Удаляю пустой раздел.");
        const data = await fetchJson("/nodes/" + encodeURIComponent(node.id) + "?strategy=block", {
          method: "DELETE",
        });
        setStatus(
          actionStatusEl,
          (data.deleted ? "Пустой раздел удалён." : "Удаление завершено.") + syncSummaryText(data.sync),
          data.sync?.ok === false ? "warn" : "ok"
        );
        await loadNodes(node.parentId || "");
      } catch (error) {
        setStatus(actionStatusEl, "Не удалось удалить раздел: " + error.message, "bad");
      }
    });

    syncBtn.addEventListener("click", async () => {
      const node = currentNode();
      if (!node) {
        return;
      }
      try {
        setStatus(actionStatusEl, "Сверяю payload раздела в Qdrant.");
        const data = await fetchJson("/admin/reindex-nodes?scope=node&id=" + encodeURIComponent(node.id) + "&includeChildren=true", {
          method: "POST",
        });
        const message = Number(data.updatedDocuments || 0) === 0 && Number(data.updatedPoints || 0) === 0
          ? "Payload проверен: в выбранном разделе нет документов с Qdrant-точками."
          : Number(data.updatedDocuments || 0) > 0 && Number(data.updatedPoints || 0) === 0
            ? "Payload проверен: документы есть, но Qdrant-точек для них не найдено."
            : "Payload обновлён: документов " + formatNumber(data.updatedDocuments) +
              ", точек " + formatNumber(data.updatedPoints) +
              ", без точек " + formatNumber(data.missingPoints) + ".";
        setStatus(
          actionStatusEl,
          message,
          "ok"
        );
        await loadReadinessStatus();
      } catch (error) {
        setStatus(actionStatusEl, "Не удалось сверить payload Qdrant: " + error.message, "bad");
      }
    });

    refreshBtn.addEventListener("click", () => {
      loadNodes().catch((error) => setStatus(treeStatusEl, "Не удалось загрузить разделы: " + error.message, "bad"));
    });

    documentsRefreshBtn.addEventListener("click", () => {
      loadNodeDocuments().catch((error) => {
        documentsBoxEl.className = "empty";
        documentsBoxEl.textContent = "Не удалось загрузить документы: " + error.message;
      });
    });

    documentsBoxEl.addEventListener("change", (event) => {
      const checkbox = event.target.closest("[data-scoped-document-id]");
      if (!checkbox) {
        return;
      }

      const documentId = String(checkbox.dataset.scopedDocumentId || "");
      if (!documentId) {
        return;
      }

      if (checkbox.checked) {
        selectedScopedDocumentIds.add(documentId);
      } else {
        selectedScopedDocumentIds.delete(documentId);
      }
      renderScopedSelectionSummary();
    });

    unlinkSelectedBtn.addEventListener("click", async () => {
      const node = currentNode();
      const documentIds = Array.from(selectedScopedDocumentIds);
      if (!node) {
        setStatus(actionStatusEl, "Выберите раздел.", "warn");
        return;
      }
      if (node.isSystem) {
        setStatus(actionStatusEl, "Отвязка от системного раздела недоступна через UI.", "warn");
        return;
      }
      if (documentIds.length === 0) {
        setStatus(actionStatusEl, "Выберите документы для отвязки.", "warn");
        return;
      }
      if (documentIds.length > 25) {
        setStatus(actionStatusEl, "За один раз выберите не больше 25 документов.", "warn");
        return;
      }
      if (!window.confirm('Убрать выбранные документы из раздела "' + node.name + '"? Документы не удаляются.')) {
        return;
      }

      try {
        setStatus(actionStatusEl, "Убираю документы из текущего раздела: " + node.name + ".");
        const data = await fetchJson("/documents/bulk-unlink", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentIds,
            nodeIds: [node.id],
          }),
        });
        selectedScopedDocumentIds = new Set();
        setStatus(actionStatusEl, "Документы отвязаны от раздела: " + formatNumber(data.updatedDocuments) + ".", "ok");
        await loadNodes(node.id);
        await loadBulkDocuments();
      } catch (error) {
        setStatus(actionStatusEl, "Не удалось отвязать документы: " + error.message, "bad");
      }
    });

    bulkSearchEl.addEventListener("input", renderBulkDocuments);

    bulkDocsBoxEl.addEventListener("change", (event) => {
      const checkbox = event.target.closest("[data-bulk-document-id]");
      if (!checkbox) {
        return;
      }
      const documentId = String(checkbox.dataset.bulkDocumentId || "");
      if (!documentId) {
        return;
      }
      if (checkbox.checked) {
        selectedBulkDocumentIds.add(documentId);
      } else {
        selectedBulkDocumentIds.delete(documentId);
      }
      renderBulkSelectionSummary();
    });

    bulkReloadBtn.addEventListener("click", () => {
      loadBulkDocuments().catch((error) => {
        bulkDocsBoxEl.className = "empty";
        bulkDocsBoxEl.textContent = "Не удалось загрузить список документов: " + error.message;
      });
    });

    bulkSelectVisibleBtn.addEventListener("click", () => {
      for (const documentId of visibleBulkDocumentIds.slice(0, 25)) {
        selectedBulkDocumentIds.add(String(documentId));
      }
      renderBulkDocuments();
    });

    bulkClearBtn.addEventListener("click", () => {
      selectedBulkDocumentIds = new Set();
      renderBulkDocuments();
    });

    bulkLinkBtn.addEventListener("click", async () => {
      const node = currentNode();
      const documentIds = Array.from(selectedBulkDocumentIds);
      if (!node) {
        setStatus(actionStatusEl, "Выберите раздел для привязки документов.", "warn");
        return;
      }
      if (node.isSystem) {
        setStatus(actionStatusEl, "К системному разделу документы не привязываются вручную. Он используется автоматически для документов без раздела.", "warn");
        return;
      }
      if (documentIds.length === 0) {
        setStatus(actionStatusEl, "Выберите документы для привязки.", "warn");
        return;
      }
      if (documentIds.length > 25) {
        setStatus(actionStatusEl, "За один раз выберите не больше 25 документов.", "warn");
        return;
      }

      try {
        setStatus(actionStatusEl, "Привязываю документы к разделу: " + node.name + ".");
        const data = await fetchJson("/documents/bulk-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentIds,
            nodeIds: [node.id],
            primaryNodeId: node.id,
            mode: bulkModeEl.value || "add",
          }),
        });
        selectedBulkDocumentIds = new Set();
        setStatus(actionStatusEl, "Документы обновлены: " + formatNumber(data.updatedDocuments) + ".", "ok");
        await loadNodes(node.id);
        await loadBulkDocuments();
      } catch (error) {
        setStatus(actionStatusEl, "Не удалось привязать документы: " + error.message, "bad");
      }
    });

    importCheckBtn.addEventListener("click", () => {
      runTreeImport(true);
    });

    importApplyBtn.addEventListener("click", () => {
      runTreeImport(false);
    });

    (async () => {
      try {
        await loadNodes();
        await loadBulkDocuments();
      } catch (error) {
        setStatus(treeStatusEl, "Не удалось загрузить разделы: " + error.message, "bad");
        setStatus(actionStatusEl, "Проверьте, запущен ли kb-api и доступна ли база.", "bad");
      }
    })();
  </script>
</body>
</html>`;
}
