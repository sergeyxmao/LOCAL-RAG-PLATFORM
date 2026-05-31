function renderKnowledgeCss() {
  return `
    .kb-page {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr;
      min-height: 0;
    }
    #kbTree {
      padding: 4px 2px 4px 4px;
    }

    .kb-node-row {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 5px 6px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      color: var(--text);
      position: relative;
    }
    .kb-node-row:hover { background: var(--surface-2); }
    .kb-node-row.is-active {
      background: var(--accent-soft);
      color: var(--accent);
    }
    .kb-node-row__toggle {
      width: 18px;
      height: 18px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      background: transparent;
      border: none;
    }
    .kb-node-row__toggle--hidden { visibility: hidden; }
    .kb-node-row__label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .kb-node-row__count {
      font-family: "JetBrains Mono", monospace;
      font-size: 11px;
      color: var(--text-muted);
    }
    .kb-node-row.is-active .kb-node-row__count { color: var(--accent); }
    .kb-node-row__menu {
      opacity: 0;
      transition: opacity 0.12s ease;
      background: none;
      border: none;
      padding: 2px;
      border-radius: 4px;
      color: inherit;
      display: inline-flex;
    }
    .kb-node-row:hover .kb-node-row__menu { opacity: 0.7; }
    .kb-node-row__menu:hover { opacity: 1; background: var(--surface-hover); }

    .kb-popover {
      position: absolute;
      top: 28px;
      right: 6px;
      z-index: 25;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      box-shadow: var(--shadow);
      min-width: 180px;
      overflow: hidden;
    }
    .kb-popover button {
      display: block;
      width: 100%;
      text-align: left;
      padding: 8px 12px;
      border: none;
      background: none;
      color: var(--text);
      font-size: 13px;
    }
    .kb-popover button:hover { background: var(--surface-2); }
    .kb-popover button.is-danger { color: var(--danger); }

    .kb-main {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding: 18px 24px 32px;
      overflow-y: auto;
      min-width: 0;
    }
    .kb-tabs {
      display: flex;
      gap: 4px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 4px;
      overflow-x: auto;
      flex-wrap: nowrap;
    }
    .kb-tab {
      border: none;
      background: transparent;
      color: var(--text-muted);
      padding: 10px 14px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .kb-tab:hover { color: var(--text); }
    .kb-tab.is-active {
      color: var(--accent);
      border-bottom-color: var(--accent);
    }
    .kb-tab-panel { display: none; flex-direction: column; gap: 14px; }
    .kb-tab-panel.is-active { display: flex; }
    .kb-summary {
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
      align-items: center;
      font-size: 13px;
      color: var(--text-muted);
    }
    .kb-summary .mono {
      color: var(--text-strong);
      font-size: 13px;
    }
    .kb-summary__divider { color: var(--text-muted); opacity: 0.5; }

    .kb-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
    }
    .kb-card__head {
      padding: 14px 18px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
    }
    .kb-card__title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-strong);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .kb-card__title svg { color: var(--text-muted); }
    .kb-card__body { padding: 16px 18px; }
    .kb-card__collapsed-row {
      padding: 10px 18px;
      font-size: 13px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .kb-card.is-collapsed .kb-card__head { border-bottom-color: transparent; }
    .kb-card.is-collapsed .kb-card__body { display: none; }

    .kb-dropzone {
      border: 2px dashed var(--border-strong);
      border-radius: 10px;
      padding: 28px 20px;
      text-align: center;
      color: var(--text-muted);
      transition: border-color 0.12s ease, background 0.12s ease;
    }
    .kb-dropzone.is-dragover {
      border-color: var(--accent);
      background: var(--accent-soft);
      color: var(--text);
    }
    .kb-dropzone h3 {
      margin: 0 0 6px;
      color: var(--text-strong);
      font-size: 15px;
    }
    .kb-dropzone__buttons {
      display: flex;
      gap: 10px;
      justify-content: center;
      margin-top: 14px;
      flex-wrap: wrap;
    }
    .kb-dropzone__buttons label.btn { cursor: pointer; }
    .kb-dropzone input[type="file"] { display: none; }
    .kb-dropzone__hint {
      margin-top: 12px;
      font-size: 11px;
      color: var(--text-muted);
    }

    .kb-upload-fields {
      display: grid;
      grid-template-columns: 1fr 220px auto;
      gap: 10px;
      margin-top: 14px;
      align-items: end;
    }
    .kb-upload-fields label {
      font-size: 12px;
      color: var(--text-muted);
      display: block;
      margin-bottom: 4px;
    }
    .kb-input, .kb-select {
      width: 100%;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--surface-2);
      color: var(--text);
      font: inherit;
      outline: none;
    }
    .kb-input:focus, .kb-select:focus { border-color: var(--accent); }
    .kb-upload-options {
      margin-top: 12px;
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
      font-size: 13px;
      color: var(--text-muted);
    }
    .kb-upload-options label {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
    }
    .kb-upload-options input[type="checkbox"] { accent-color: var(--accent); }

    .kb-jobs-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .kb-job {
      padding: 10px 12px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--surface-2);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .kb-job__head {
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: space-between;
      flex-wrap: wrap;
    }
    .kb-job__title {
      font-family: "JetBrains Mono", monospace;
      font-size: 12px;
      color: var(--text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
      min-width: 0;
    }
    .kb-job__status {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 999px;
      font-family: "JetBrains Mono", monospace;
    }
    .kb-job__status--running { background: var(--accent-soft); color: var(--accent); }
    .kb-job__status--queued { background: var(--surface-hover); color: var(--text-muted); }
    .kb-job__status--completed { color: var(--success); }
    .kb-job__status--failed, .kb-job__status--cancelled { color: var(--danger); }
    .kb-job__progress {
      height: 6px;
      width: 100%;
      background: var(--surface-hover);
      border-radius: 999px;
      overflow: hidden;
    }
    .kb-job__progress > div {
      height: 100%;
      background: var(--accent);
      transition: width 0.2s ease;
    }
    .kb-job__meta {
      font-size: 11px;
      color: var(--text-muted);
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
    }
    .kb-job__actions {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .kb-job__error {
      font-size: 11px;
      color: var(--danger);
      word-break: break-word;
    }

    .kb-jobs-toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 10px;
    }
    .kb-jobs-filters {
      display: inline-flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .kb-jobs-pill {
      border: 1px solid var(--border);
      background: transparent;
      color: var(--text-muted);
      padding: 4px 11px;
      border-radius: 999px;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
    }
    .kb-jobs-pill:hover { color: var(--text); border-color: var(--border-strong); }
    .kb-jobs-pill.is-active {
      background: var(--accent-soft);
      color: var(--accent);
      border-color: var(--accent);
    }
    .kb-jobs-pageSize {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--text-muted);
      margin-left: auto;
    }
    .kb-jobs-pageSize select {
      background: var(--surface-2);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 4px 6px;
      border-radius: 6px;
      font-size: 12px;
    }
    .kb-jobs-pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding-top: 10px;
      margin-top: 10px;
      border-top: 1px solid var(--border);
      font-size: 12px;
      color: var(--text-muted);
    }
    .kb-jobs-pagination button[disabled] { opacity: 0.4; cursor: not-allowed; }

    .kb-doc-toolbar {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      padding-bottom: 12px;
    }
    .kb-doc-toolbar .document-search {
      flex: 1;
      min-width: 180px;
      max-width: 320px;
    }
    .kb-doc-toolbar__bulk {
      display: none;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .kb-doc-toolbar__bulk.is-active { display: inline-flex; }

    .kb-doc-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .kb-doc-table thead th {
      text-align: left;
      font-weight: 500;
      color: var(--text-muted);
      padding: 8px 8px;
      border-bottom: 1px solid var(--border);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .kb-doc-table tbody td {
      padding: 10px 8px;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
    }
    .kb-doc-table tbody tr:hover td { background: var(--surface-2); }
    .kb-doc-table .doc-title {
      color: var(--text-strong);
      max-width: 320px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .kb-doc-table .doc-path {
      color: var(--text-muted);
      font-family: "JetBrains Mono", monospace;
      font-size: 11px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 320px;
      display: block;
    }
    .kb-doc-table .doc-pages, .kb-doc-table .doc-chunks, .kb-doc-table .doc-date {
      font-family: "JetBrains Mono", monospace;
      color: var(--text-muted);
      font-size: 12px;
    }
    .kb-doc-table .doc-node {
      font-size: 12px;
      color: var(--text-muted);
    }
    .kb-doc-table .doc-tags {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
    .kb-doc-table .doc-tag {
      padding: 1px 7px;
      border-radius: 999px;
      background: var(--surface-2);
      font-size: 11px;
      font-family: "JetBrains Mono", monospace;
      color: var(--text);
    }
    .kb-tags-intro {
      font-size: 12px;
      color: var(--text-muted);
      margin: 0 0 4px;
    }
    .kb-tags-table th[data-tag-sort] {
      cursor: pointer;
      user-select: none;
    }
    .kb-tags-table th[data-tag-sort]:hover { color: var(--text); }
    .kb-doc-table .doc-actions {
      display: flex;
      gap: 4px;
      justify-content: flex-end;
    }
    .kb-doc-action {
      width: 28px;
      height: 28px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-muted);
      transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
    }
    .kb-doc-action:hover { background: var(--surface-2); color: var(--text); border-color: var(--border); }
    .kb-doc-action.is-danger:hover { color: var(--danger); }
    .kb-doc-empty, .kb-doc-error {
      padding: 26px 18px;
      text-align: center;
      color: var(--text-muted);
      font-size: 13px;
    }
    .kb-doc-error {
      border-left: 3px solid var(--danger);
      text-align: left;
      background: var(--surface-2);
      color: var(--danger);
    }
    .kb-show-more {
      margin-top: 14px;
      text-align: center;
    }

    .kb-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }
    .kb-modal-backdrop.is-open { display: flex; }
    .kb-modal {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      width: min(480px, 92vw);
      max-height: 86vh;
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow);
    }
    .kb-modal__head {
      padding: 14px 18px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .kb-modal__title { font-weight: 600; color: var(--text-strong); }
    .kb-modal__body {
      padding: 16px 18px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .kb-modal__foot {
      padding: 12px 18px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    .kb-tags-edit {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      min-height: 28px;
    }
    .kb-tags-edit .doc-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .kb-tags-edit .doc-tag button {
      border: none;
      background: none;
      color: var(--text-muted);
      padding: 0;
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
    }
    .kb-tag-input-row {
      display: flex;
      gap: 8px;
    }
    .kb-tag-suggestions {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
    .kb-tag-suggestions button {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 2px 9px;
      font-size: 11px;
      font-family: "JetBrains Mono", monospace;
      color: var(--text-muted);
      cursor: pointer;
    }
    .kb-tag-suggestions button:hover { color: var(--text); border-color: var(--border-strong); }

    .kb-prompt {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    @media (max-width: 1024px) {
      .kb-upload-fields { grid-template-columns: 1fr; }
    }
  `;
}

function renderKnowledgeScript(initialStateJson) {
  return `
    (function () {
      var INITIAL_STATE = ${initialStateJson};
      var DEFAULT_JOBS_STATUSES = ["running", "completed", "stopped"];
      var DEFAULT_JOBS_PAGE_SIZE = 25;
      var ALLOWED_PAGE_SIZES = [10, 25, 50];

      function loadJobsStatusesFromStorage() {
        try {
          var raw = localStorage.getItem("localrag.jobsFilter.statuses");
          if (!raw) return DEFAULT_JOBS_STATUSES.slice();
          var parsed = JSON.parse(raw);
          if (!Array.isArray(parsed)) return DEFAULT_JOBS_STATUSES.slice();
          var filtered = parsed.filter(function (s) {
            return DEFAULT_JOBS_STATUSES.indexOf(s) !== -1;
          });
          return filtered.length ? filtered : DEFAULT_JOBS_STATUSES.slice();
        } catch (err) {
          return DEFAULT_JOBS_STATUSES.slice();
        }
      }
      function loadJobsPageSizeFromStorage() {
        try {
          var raw = localStorage.getItem("localrag.jobsFilter.pageSize");
          var n = Number(raw);
          if (ALLOWED_PAGE_SIZES.indexOf(n) === -1) return DEFAULT_JOBS_PAGE_SIZE;
          return n;
        } catch (err) {
          return DEFAULT_JOBS_PAGE_SIZE;
        }
      }
      function saveJobsStatusesToStorage(statuses) {
        try { localStorage.setItem("localrag.jobsFilter.statuses", JSON.stringify(statuses)); } catch (err) {}
      }
      function saveJobsPageSizeToStorage(n) {
        try { localStorage.setItem("localrag.jobsFilter.pageSize", String(n)); } catch (err) {}
      }
      // #8.1.c.fix-2: концепция «параллелизм загрузки» из UI Загрузки убрана.
      // Параллелизм всего pipeline индексации управляется централизованно из
      // «Настройки → Сервисы → Параллелизм индексации» (через indexingSemaphore).
      // Очередь регистрации задач на фронте всегда работает по одному файлу.

      var state = {
        nodes: [],
        nodeCounts: {},
        nodeExpanded: new Set(),
        activeNodeId: null,
        includeChildren: true,
        documents: [],
        documentLimit: 50,
        documentOffset: 0,
        documentHasMore: false,
        documentSearch: "",
        selectedDocIds: new Set(),
        jobs: [],
        jobsTotal: 0,
        jobsCollapsed: true,
        jobsTimer: null,
        jobsStatuses: loadJobsStatusesFromStorage(),
        jobsPageSize: loadJobsPageSizeFromStorage(),
        jobsPage: 1,
        existingTags: [],
        globalTags: [],
        globalTagsSearch: "",
        globalTagsSort: { by: "count", dir: "desc" },
        unsortedNodeId: null,
        uploadInProgress: false,
      };

      var dom = {
        page: document.getElementById("kbPage"),
        tree: document.getElementById("kbTree"),
        treeNewBtn: document.getElementById("kbTreeNewBtn"),
        summary: document.getElementById("kbSummary"),
        dropzone: document.getElementById("kbDropzone"),
        fileInput: document.getElementById("kbFileInput"),
        folderInput: document.getElementById("kbFolderInput"),
        serverPath: document.getElementById("kbServerPath"),
        serverImportBtn: document.getElementById("kbServerImportBtn"),
        nodeSelect: document.getElementById("kbNodeSelect"),
        // Удалены в #8.1.c.fix-2: lightModeChk, recursiveChk, concurrency selector.
        // UI всегда передаёт createVisualAssets=true и recursive=true;
        // параллелизмом управляет «Настройки → Сервисы → Параллелизм индексации».
        jobsList: document.getElementById("kbJobsList"),
        jobsCard: document.getElementById("kbJobsCard"),
        jobsCollapsedRow: document.getElementById("kbJobsCollapsed"),
        jobsToggleBtn: document.getElementById("kbJobsToggle"),
        jobsRefreshBtn: document.getElementById("kbJobsRefresh"),
        docSearch: document.getElementById("kbDocSearch"),
        docTableBody: document.getElementById("kbDocBody"),
        docHeaderCheckbox: document.getElementById("kbDocSelectAll"),
        docShowMore: document.getElementById("kbDocShowMore"),
        docBulkBar: document.getElementById("kbDocBulk"),
        docBulkCount: document.getElementById("kbDocBulkCount"),
        docBulkMove: document.getElementById("kbDocBulkMove"),
        docBulkDelete: document.getElementById("kbDocBulkDelete"),
        docToggleScope: document.getElementById("kbDocToggleScope"),
        addDocBtn: document.getElementById("kbAddDocBtn"),
        modalBackdrop: document.getElementById("kbModalBackdrop"),
        modalTitle: document.getElementById("kbModalTitle"),
        modalBody: document.getElementById("kbModalBody"),
        modalFoot: document.getElementById("kbModalFoot"),
      };

      function escapeHtml(value) {
        if (value === null || value === undefined) return "";
        return String(value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      function showToast(message, kind) {
        var existing = document.querySelector(".toast");
        if (existing) existing.remove();
        var el = document.createElement("div");
        el.className = "toast" + (kind === "error" ? " toast--error" : "");
        if (kind === "warning") {
          el.style.borderColor = "#d18f00";
          el.style.color = "#a86a00";
        }
        el.textContent = message;
        document.body.appendChild(el);
        var ttl = kind === "warning" || kind === "error" ? 8000 : 4200;
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, ttl);
      }

      function api(method, path, body) {
        var opts = { method: method, headers: {} };
        if (body !== undefined && !(body instanceof FormData)) {
          opts.headers["Content-Type"] = "application/json";
          opts.body = JSON.stringify(body);
        } else if (body instanceof FormData) {
          opts.body = body;
        }
        return fetch(path, opts).then(function (response) {
          return response.json().then(function (data) {
            if (!response.ok || (data && data.ok === false)) {
              var error = new Error((data && data.error) || ("HTTP " + response.status));
              error.status = response.status;
              error.data = data;
              throw error;
            }
            return data;
          });
        });
      }

      function fmtBytes(bytes) {
        if (!bytes) return "0 Б";
        var units = ["Б", "КБ", "МБ", "ГБ", "ТБ"];
        var n = Number(bytes);
        var i = 0;
        while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
        var formatted = i === 0 ? Math.round(n) : n.toFixed(1);
        return formatted + " " + units[i];
      }

      function fmtDate(value) {
        if (!value) return "";
        try {
          var d = new Date(value);
          var now = new Date();
          var sameDay =
            d.getFullYear() === now.getFullYear() &&
            d.getMonth() === now.getMonth() &&
            d.getDate() === now.getDate();
          if (sameDay) {
            return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
          }
          return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
        } catch (err) { return ""; }
      }

      function nodeChildrenMap() {
        var map = {};
        state.nodes.forEach(function (n) {
          var parent = n.parentId || "__root__";
          if (!map[parent]) map[parent] = [];
          map[parent].push(n);
        });
        Object.keys(map).forEach(function (key) {
          map[key].sort(function (a, b) {
            return (a.sortOrder || 0) - (b.sortOrder || 0) || (a.name || "").localeCompare(b.name || "");
          });
        });
        return map;
      }

      function getNodeById(id) {
        return state.nodes.find(function (n) { return n.id === id; });
      }

      function getDescendantIds(rootId) {
        var children = nodeChildrenMap();
        var stack = [rootId];
        var out = new Set();
        while (stack.length) {
          var current = stack.pop();
          out.add(current);
          (children[current] || []).forEach(function (child) {
            if (!out.has(child.id)) stack.push(child.id);
          });
        }
        out.delete(rootId);
        return out;
      }

      function renderTree() {
        if (!state.nodes.length) {
          dom.tree.innerHTML = '<div class="filters-empty">Дерево пустое. Создайте первый раздел кнопкой выше.</div>';
          return;
        }
        var children = nodeChildrenMap();
        var html = [];
        function walk(node, depth) {
          var kids = children[node.id] || [];
          var hasChildren = kids.length > 0;
          var expanded = state.nodeExpanded.has(node.id);
          var counts = state.nodeCounts[node.id] || {};
          var isActive = node.id === state.activeNodeId;
          var toggleIcon = hasChildren
            ? (expanded ? INITIAL_STATE.icons.chevronDown : INITIAL_STATE.icons.chevronRight)
            : "";
          var toggleClass = hasChildren ? "kb-node-row__toggle" : "kb-node-row__toggle kb-node-row__toggle--hidden";
          html.push('<div class="kb-node-row' + (isActive ? " is-active" : "") + '" style="padding-left:' + (depth * 14 + 4) + 'px" data-node-id="' + escapeHtml(node.id) + '">' +
            '<button type="button" class="' + toggleClass + '" data-action="toggle-node" data-node-id="' + escapeHtml(node.id) + '">' + toggleIcon + '</button>' +
            '<span class="kb-node-row__label" data-action="select-node" data-node-id="' + escapeHtml(node.id) + '" title="' + escapeHtml(node.name) + '">' + escapeHtml(node.name) + '</span>' +
            '<span class="kb-node-row__count mono">' + escapeHtml(counts.scopeDocuments || 0) + '</span>' +
            (node.isSystem ? '' : '<button type="button" class="kb-node-row__menu" data-action="node-menu" data-node-id="' + escapeHtml(node.id) + '" aria-label="Меню">' + INITIAL_STATE.icons.moreHorizontal + '</button>') +
            '</div>');
          if (hasChildren && expanded) {
            kids.forEach(function (child) { walk(child, depth + 1); });
          }
        }
        (children.__root__ || []).forEach(function (root) { walk(root, 0); });
        dom.tree.innerHTML = html.join("");
      }

      function updateSummary() {
        var docs = state.documents;
        var totalDocs = docs.length;
        var totalPages = 0;
        var totalChunks = 0;
        docs.forEach(function (d) {
          totalPages += Number(d.page_count || 0);
          totalChunks += Number(d.chunk_count || 0);
        });
        var scope = state.activeNodeId ? (getNodeById(state.activeNodeId) || {}).name : "вся база";
        var html = '<span>' + escapeHtml(scope || "вся база") + '</span>' +
          '<span class="kb-summary__divider">·</span>' +
          '<span><span class="mono">' + totalDocs + (state.documentHasMore ? '+' : '') + '</span> документов</span>' +
          '<span class="kb-summary__divider">·</span>' +
          '<span><span class="mono">' + totalPages + '</span> страниц</span>' +
          '<span class="kb-summary__divider">·</span>' +
          '<span><span class="mono">' + totalChunks + '</span> чанков</span>';
        dom.summary.innerHTML = html;
      }

      function renderNodeSelect() {
        if (!dom.nodeSelect) return;
        var children = nodeChildrenMap();
        var options = ['<option value="">Без раздела</option>'];
        function walk(node, depth) {
          var prefix = "";
          for (var i = 0; i < depth; i++) prefix += "— ";
          var selected = node.id === state.activeNodeId ? " selected" : "";
          options.push('<option value="' + escapeHtml(node.id) + '"' + selected + '>' + escapeHtml(prefix + node.name) + '</option>');
          (children[node.id] || []).forEach(function (child) { walk(child, depth + 1); });
        }
        (children.__root__ || []).forEach(function (root) { walk(root, 0); });
        dom.nodeSelect.innerHTML = options.join("");
      }

      function buildNodeMap() {
        var byId = {};
        state.nodes.forEach(function (n) { byId[n.id] = n; });
        return byId;
      }

      function renderDocuments() {
        var term = state.documentSearch.toLowerCase().trim();
        var byNode = buildNodeMap();
        var docs = state.documents.filter(function (d) {
          if (!term) return true;
          var hay = ((d.title || "") + " " + (d.original_file_name || "") + " " + (d.original_file_path || "")).toLowerCase();
          return hay.indexOf(term) !== -1;
        });
        if (!docs.length) {
          dom.docTableBody.innerHTML = '<tr><td colspan="8"><div class="kb-doc-empty">В этом разделе документов нет. Перетащите файлы сюда или укажите путь к папке выше.</div></td></tr>';
          updateSummary();
          renderBulkBar();
          return;
        }
        var html = docs.map(function (doc) {
          var checked = state.selectedDocIds.has(doc.id) ? "checked" : "";
          var primaryNode = (doc.node_links || []).find(function (l) { return l.is_primary; }) || (doc.node_links || [])[0] || null;
          var primaryNodeName = primaryNode && byNode[primaryNode.node_id] ? byNode[primaryNode.node_id].name : "Без раздела";
          var tags = Array.isArray(doc.categories) ? doc.categories : [];
          var tagsHtml = tags.length
            ? tags.slice(0, 6).map(function (t) { return '<span class="doc-tag">' + escapeHtml(t) + '</span>'; }).join("") + (tags.length > 6 ? '<span class="doc-tag">+' + (tags.length - 6) + '</span>' : '')
            : '<span class="kb-summary__divider">—</span>';
          var chunkCount = Number(doc.chunk_count || 0);
          var chunksCell = chunkCount > 0
            ? String(chunkCount)
            : '<span class="kb-summary__divider">—</span>';
          var lowerName = String(doc.original_file_name || doc.original_file_path || doc.title || "").toLowerCase();
          var isGraphFile = /\.(xlsx|xls|xlsm)$/.test(lowerName);
          var reparseBtn = isGraphFile
            ? '<button type="button" class="kb-doc-action" data-action="reparse-graph" data-doc-id="' + escapeHtml(doc.id) + '" data-doc-title="' + escapeHtml(doc.title || doc.original_file_name || "") + '" title="Перепарсить граф">' + INITIAL_STATE.icons.graph + '</button>'
            : '';
          // Этап 3: «Извлечь знания» — только для текстовых документов
          // (docx/txt/md). Для PDF/XLSX кнопка скрыта (XLSX наполняет граф
          // своим парсером; PDF — вне scope этой итерации).
          var isTextDoc = /\.(docx|txt|md|markdown)$/.test(lowerName);
          var extractBtn = isTextDoc
            ? '<button type="button" class="kb-doc-action" data-action="extract-knowledge" data-doc-id="' + escapeHtml(doc.id) + '" data-doc-title="' + escapeHtml(doc.title || doc.original_file_name || "") + '" title="Извлечь знания (LLM → очередь кандидатов на ревью)">' + INITIAL_STATE.icons.extract + '</button>'
            : '';
          return '<tr data-doc-id="' + escapeHtml(doc.id) + '">' +
            '<td><input type="checkbox" data-action="select-doc" data-doc-id="' + escapeHtml(doc.id) + '" ' + checked + ' style="accent-color:var(--accent)" /></td>' +
            '<td><div class="doc-title" title="' + escapeHtml(doc.title || "") + '">' + escapeHtml(doc.title || doc.original_file_name || "(без названия)") + '</div>' +
            (doc.original_file_path ? '<span class="doc-path">' + escapeHtml(doc.original_file_path) + '</span>' : '') + '</td>' +
            '<td class="doc-pages">' + escapeHtml(doc.page_count || 0) + '</td>' +
            '<td class="doc-chunks">' + chunksCell + '</td>' +
            '<td class="doc-node">' + escapeHtml(primaryNodeName) + '</td>' +
            '<td><div class="doc-tags">' + tagsHtml + '</div></td>' +
            '<td class="doc-date">' + escapeHtml(fmtDate(doc.created_at)) + '</td>' +
            '<td><div class="doc-actions">' +
            '<button type="button" class="kb-doc-action" data-action="rename-doc" data-doc-id="' + escapeHtml(doc.id) + '" title="Переименовать документ">' + INITIAL_STATE.icons.edit + '</button>' +
            '<button type="button" class="kb-doc-action" data-action="open-doc" data-doc-id="' + escapeHtml(doc.id) + '" title="Открыть исходник">' + INITIAL_STATE.icons.externalLink + '</button>' +
            '<button type="button" class="kb-doc-action" data-action="move-doc" data-doc-id="' + escapeHtml(doc.id) + '" title="Переместить в раздел">' + INITIAL_STATE.icons.folder + '</button>' +
            '<button type="button" class="kb-doc-action" data-action="edit-tags" data-doc-id="' + escapeHtml(doc.id) + '" title="Редактировать теги">' + INITIAL_STATE.icons.tag + '</button>' +
            '<button type="button" class="kb-doc-action" data-action="reindex-doc" data-doc-id="' + escapeHtml(doc.id) + '" data-doc-title="' + escapeHtml(doc.title || doc.original_file_name || "") + '" title="Переиндексировать (вкл. OCR)">' + INITIAL_STATE.icons.refresh + '</button>' +
            reparseBtn +
            extractBtn +
            '<button type="button" class="kb-doc-action is-danger" data-action="delete-doc" data-doc-id="' + escapeHtml(doc.id) + '" title="Удалить">' + INITIAL_STATE.icons.trash + '</button>' +
            '</div></td>' +
            '</tr>';
        }).join("");
        dom.docTableBody.innerHTML = html;
        dom.docShowMore.style.display = state.documentHasMore ? "block" : "none";
        updateSummary();
        renderBulkBar();
      }

      function renderBulkBar() {
        var count = state.selectedDocIds.size;
        if (count === 0) {
          dom.docBulkBar.classList.remove("is-active");
        } else {
          dom.docBulkBar.classList.add("is-active");
          dom.docBulkCount.textContent = count;
        }
      }

      function jobsStatusToPill(status) {
        if (["queued", "running", "cancel_requested"].indexOf(status) >= 0) return "running";
        if (status === "completed") return "completed";
        if (["failed", "cancelled"].indexOf(status) >= 0) return "stopped";
        return null;
      }

      function renderJobsToolbar() {
        var pills = [
          { key: "running", label: "Идёт" },
          { key: "completed", label: "Готово" },
          { key: "stopped", label: "Остановлено" },
        ];
        var pillsHtml = pills.map(function (p) {
          var active = state.jobsStatuses.indexOf(p.key) !== -1 ? " is-active" : "";
          return '<button type="button" class="kb-jobs-pill' + active +
            '" data-action="toggle-jobs-pill" data-pill="' + p.key + '">' + p.label + '</button>';
        }).join("");
        var pageSizeOpts = ALLOWED_PAGE_SIZES.map(function (n) {
          var selected = n === state.jobsPageSize ? " selected" : "";
          return '<option value="' + n + '"' + selected + '>' + n + '</option>';
        }).join("");
        return '<div class="kb-jobs-toolbar">' +
          '<div class="kb-jobs-filters">' + pillsHtml + '</div>' +
          '<label class="kb-jobs-pageSize">На странице ' +
          '<select id="kbJobsPageSize">' + pageSizeOpts + '</select>' +
          '</label>' +
          '</div>';
      }

      function renderJobsPagination() {
        var totalPages = Math.max(1, Math.ceil(state.jobsTotal / state.jobsPageSize));
        if (totalPages <= 1) return '';
        var prevDisabled = state.jobsPage <= 1 ? ' disabled' : '';
        var nextDisabled = state.jobsPage >= totalPages ? ' disabled' : '';
        return '<div class="kb-jobs-pagination">' +
          '<button type="button" class="btn btn--ghost" data-action="jobs-page-prev"' + prevDisabled + '>← Назад</button>' +
          '<span>Страница <span class="mono">' + state.jobsPage + '</span> из <span class="mono">' + totalPages + '</span></span>' +
          '<button type="button" class="btn btn--ghost" data-action="jobs-page-next"' + nextDisabled + '>Вперёд →</button>' +
          '</div>';
      }

      function renderJobs() {
        var jobs = state.jobs;
        var active = jobs.filter(function (j) {
          return j.status === "running" || j.status === "queued" || j.status === "cancel_requested";
        });
        if (state.jobsCollapsed) {
          dom.jobsCard.classList.add("is-collapsed");
          if (!state.jobsTotal) {
            dom.jobsCollapsedRow.innerHTML = '<span>Задач нет</span><span></span>';
          } else {
            dom.jobsCollapsedRow.innerHTML =
              '<span><span class="mono">' + active.length + '</span> активных · <span class="mono">' + state.jobsTotal + '</span> всего</span>' +
              '<button type="button" class="btn btn--ghost" id="kbJobsExpand">Развернуть</button>';
            var expandBtn = document.getElementById("kbJobsExpand");
            if (expandBtn) expandBtn.addEventListener("click", function () {
              state.jobsCollapsed = false;
              renderJobs();
            });
          }
          dom.jobsList.innerHTML = "";
          return;
        }
        dom.jobsCard.classList.remove("is-collapsed");
        var listHtml;
        if (!jobs.length) {
          listHtml = '<div class="kb-doc-empty">По текущим фильтрам задач нет.</div>';
        } else {
          listHtml = jobs.map(function (job) {
            var status = job.status || "unknown";
            var phase = job.phase || "";
            var pct = 0;
            if (job.total_items && job.processed_items) {
              pct = Math.min(100, Math.round((Number(job.processed_items) / Math.max(1, Number(job.total_items))) * 100));
            } else if (status === "completed") {
              pct = 100;
            }
            var statusClass = "kb-job__status--" + status;
            // Если есть phase — он точнее статуса (различает awaiting_upload
            // от awaiting_processing внутри status='queued').
            var label;
            if (phase === "awaiting_upload") label = "ждёт загрузки";
            else if (phase === "awaiting_processing") label = "в очереди на индексацию";
            else if (phase === "processing") label = "идёт";
            else if (phase === "done") {
              label = { completed: "готово", failed: "ошибка", cancelled: "остановлено" }[status] || status;
            } else {
              label = {
                queued: "ожидает",
                running: "идёт",
                cancel_requested: "останавливается",
                completed: "готово",
                failed: "ошибка",
                cancelled: "остановлено",
              }[status] || status;
            }
            var statusLabel = label;
            var isPreUpload = status === "queued" && !job.document_id;
            var title = job.original_file_path || job.document_title || job.original_file_name || job.pending_filename || job.job_type || job.id;
            var canCancel = !isPreUpload && ["queued", "running", "cancel_requested"].indexOf(status) >= 0;
            var canRestart = ["failed", "cancelled"].indexOf(status) >= 0 && job.original_file_path;
            var canDelete = isPreUpload || ["queued", "running", "cancel_requested"].indexOf(status) === -1;
            var meta = [];
            if (job.job_type) meta.push('<span>' + escapeHtml(job.job_type) + '</span>');
            if (job.total_items) meta.push('<span class="mono">' + (job.processed_items || 0) + ' / ' + job.total_items + '</span>');
            if (job.progress_message) meta.push('<span>' + escapeHtml(job.progress_message) + '</span>');
            if (job.chunk_count) meta.push('<span class="mono">' + job.chunk_count + ' чанк.</span>');
            if (job.created_at) meta.push('<span>' + escapeHtml(fmtDate(job.created_at)) + '</span>');
            var actionsHtml = '';
            if (canCancel) {
              actionsHtml += '<button type="button" class="btn btn--ghost" data-action="cancel-job" data-job-id="' + escapeHtml(job.id) + '">Отменить</button>';
            }
            if (canRestart) {
              actionsHtml += '<button type="button" class="btn btn--ghost" data-action="restart-job" data-job-id="' + escapeHtml(job.id) + '">Продолжить</button>';
            }
            if (canDelete) {
              actionsHtml += '<button type="button" class="btn btn--danger" data-action="delete-job" data-job-id="' + escapeHtml(job.id) + '" data-job-title="' + escapeHtml(title) + '">Удалить</button>';
            }
            var errorHtml = '';
            if (status === "failed" && job.error_message) {
              errorHtml = '<div class="kb-job__error">' + escapeHtml(job.error_message) + '</div>';
            }
            return '<div class="kb-job" data-job-id="' + escapeHtml(job.id) + '">' +
              '<div class="kb-job__head">' +
              '<div class="kb-job__title" title="' + escapeHtml(title) + '">' + escapeHtml(title) + '</div>' +
              '<span class="kb-job__status ' + statusClass + '">' + statusLabel + '</span>' +
              (actionsHtml ? '<div class="kb-job__actions">' + actionsHtml + '</div>' : '') +
              '</div>' +
              (status === "running" || status === "queued" ? '<div class="kb-job__progress"><div style="width:' + pct + '%"></div></div>' : '') +
              '<div class="kb-job__meta">' + meta.join("") + '</div>' +
              errorHtml +
              '</div>';
          }).join("");
        }
        dom.jobsList.innerHTML = renderJobsToolbar() + listHtml + renderJobsPagination();
      }

      function ensurePollingState() {
        var hasActive = state.jobs.some(function (j) {
          return j.status === "running" || j.status === "queued" || j.status === "cancel_requested";
        });
        if (hasActive && !state.jobsTimer && !document.hidden) {
          state.jobsTimer = setInterval(loadJobs, 3000);
        } else if (!hasActive && state.jobsTimer) {
          clearInterval(state.jobsTimer);
          state.jobsTimer = null;
        }
      }

      function buildJobsUrl() {
        var parts = [];
        parts.push("limit=" + state.jobsPageSize);
        parts.push("offset=" + ((state.jobsPage - 1) * state.jobsPageSize));
        if (state.jobsStatuses.length && state.jobsStatuses.length < 3) {
          parts.push("statuses=" + encodeURIComponent(state.jobsStatuses.join(",")));
        }
        return "/jobs?" + parts.join("&");
      }

      function loadJobs() {
        return api("GET", buildJobsUrl()).then(function (data) {
          state.jobs = data.items || [];
          state.jobsTotal = typeof data.total === "number" ? data.total : state.jobs.length;
          var totalPages = Math.max(1, Math.ceil(state.jobsTotal / state.jobsPageSize));
          if (state.jobsPage > totalPages) {
            state.jobsPage = totalPages;
            return loadJobs();
          }
          renderJobs();
          ensurePollingState();
        }).catch(function (err) {
          dom.jobsList.innerHTML = '<div class="kb-doc-error">Не удалось загрузить задачи: ' + escapeHtml(err.message) + '</div>';
        });
      }

      function loadNodes() {
        return Promise.all([
          api("GET", "/nodes?format=flat&includeInactive=false"),
          api("GET", "/nodes/counts"),
        ]).then(function (results) {
          var nodesPayload = results[0];
          state.nodes = (nodesPayload.items || []).map(function (raw) {
            return {
              id: raw.id,
              name: raw.name,
              parentId: raw.parent_id || raw.parentId || null,
              sortOrder: raw.sort_order ?? raw.sortOrder ?? 0,
              isActive: raw.is_active !== false,
              isSystem: raw.is_system === true,
            };
          }).filter(function (n) { return n.isActive; });
          var unsorted = state.nodes.find(function (n) { return n.isSystem; });
          state.unsortedNodeId = unsorted ? unsorted.id : null;
          state.nodeCounts = (results[1] && results[1].byNodeId) || {};
          if (state.activeNodeId && !getNodeById(state.activeNodeId)) {
            state.activeNodeId = null;
          }
          renderTree();
          renderNodeSelect();
        }).catch(function (err) {
          dom.tree.innerHTML = '<div class="kb-doc-error">Не удалось загрузить дерево: ' + escapeHtml(err.message) + '</div>';
        });
      }

      function refreshNodes(opts) {
        opts = opts || {};
        return loadNodes().then(function () {
          if (opts.reloadDocuments) return loadDocuments({ preserveScroll: true });
        });
      }

      function loadDocuments(opts) {
        opts = opts || {};
        var append = opts.append === true;
        var preserveScroll = opts.preserveScroll === true;
        var savedScrollY = preserveScroll ? window.scrollY : 0;
        if (!append) {
          state.documentOffset = 0;
          state.selectedDocIds = new Set();
        }
        var url;
        if (state.activeNodeId) {
          url = "/documents?nodeId=" + encodeURIComponent(state.activeNodeId) +
            "&includeChildren=" + (state.includeChildren ? "true" : "false") +
            "&limit=" + (state.documentLimit + 1);
        } else {
          url = "/documents?limit=" + (state.documentLimit + 1);
        }
        return api("GET", url).then(function (data) {
          var items = data.items || [];
          state.documentHasMore = items.length > state.documentLimit;
          if (state.documentHasMore) items = items.slice(0, state.documentLimit);
          if (append) {
            state.documents = state.documents.concat(items);
          } else {
            state.documents = items;
          }
          renderDocuments();
          if (preserveScroll) {
            window.scrollTo({ top: savedScrollY, behavior: "instant" });
          }
        }).catch(function (err) {
          dom.docTableBody.innerHTML = '<tr><td colspan="8"><div class="kb-doc-error">Не удалось загрузить документы: ' + escapeHtml(err.message) + '</div></td></tr>';
        });
      }

      function loadTags() {
        return api("GET", "/tags?limit=100").then(function (data) {
          state.existingTags = (data.items || []).map(function (t) { return typeof t === "string" ? t : t.tag; }).filter(Boolean);
        }).catch(function () {
          state.existingTags = [];
        });
      }

      function loadGlobalTags() {
        var body = document.getElementById("kbTagsBody");
        if (body && !state.globalTags.length) {
          body.innerHTML = '<tr><td colspan="3"><div class="kb-doc-empty">Загружается…</div></td></tr>';
        }
        return api("GET", "/tags?limit=500").then(function (data) {
          state.globalTags = (data.items || []).map(function (t) {
            if (typeof t === "string") return { tag: t, count: 0 };
            return { tag: t.tag, count: Number(t.count || 0) };
          });
          renderGlobalTags();
        }).catch(function (err) {
          if (body) body.innerHTML = '<tr><td colspan="3"><div class="kb-doc-error">Не удалось загрузить теги: ' + escapeHtml(err.message) + '</div></td></tr>';
        });
      }

      function renderGlobalTags() {
        var body = document.getElementById("kbTagsBody");
        var countEl = document.getElementById("kbTagsCount");
        if (!body) return;
        var term = (state.globalTagsSearch || "").toLowerCase().trim();
        var rows = state.globalTags.slice();
        if (term) rows = rows.filter(function (t) { return t.tag.toLowerCase().indexOf(term) !== -1; });
        var by = state.globalTagsSort.by;
        var dir = state.globalTagsSort.dir === "asc" ? 1 : -1;
        rows.sort(function (a, b) {
          if (by === "count") {
            if (a.count !== b.count) return (a.count - b.count) * dir;
            return a.tag.localeCompare(b.tag);
          }
          return a.tag.localeCompare(b.tag) * dir;
        });
        if (countEl) {
          countEl.textContent = rows.length === state.globalTags.length
            ? "Всего: " + rows.length
            : "Показано: " + rows.length + " из " + state.globalTags.length;
        }
        if (!rows.length) {
          body.innerHTML = '<tr><td colspan="3"><div class="kb-doc-empty">' + (term ? "Ничего не найдено" : "Тегов пока нет") + '</div></td></tr>';
          return;
        }
        body.innerHTML = rows.map(function (t) {
          var safeTag = escapeHtml(t.tag);
          return '<tr>' +
            '<td><span class="doc-tag">' + safeTag + '</span></td>' +
            '<td class="mono">' + t.count + '</td>' +
            '<td class="doc-actions" style="text-align:right">' +
            '<button type="button" class="kb-doc-action" data-action="global-tag-rename" data-tag-name="' + safeTag + '" title="Переименовать">' + INITIAL_STATE.icons.edit + '</button>' +
            '<button type="button" class="kb-doc-action is-danger" data-action="global-tag-delete" data-tag-name="' + safeTag + '" data-tag-count="' + t.count + '" title="Удалить">' + INITIAL_STATE.icons.trash + '</button>' +
            '</td>' +
            '</tr>';
        }).join("");
      }

      function openGlobalTagRename(oldName) {
        var existing = state.globalTags.find(function (t) { return t.tag === oldName; });
        var count = existing ? existing.count : 0;
        var wrap = document.createElement("div");
        wrap.className = "kb-prompt";
        var label = document.createElement("label");
        label.textContent = "Новое имя для тега «" + oldName + "» (" + count + " док.)";
        label.style.cssText = "font-size:12px;color:var(--text-muted);";
        var input = document.createElement("input");
        input.className = "kb-input";
        input.type = "text";
        input.maxLength = 64;
        input.value = oldName;
        var hint = document.createElement("p");
        hint.style.cssText = "font-size:12px;color:var(--text-muted);margin:0;";
        hint.textContent = "Если тег с новым именем уже есть — теги будут объединены без дубликатов.";
        wrap.appendChild(label);
        wrap.appendChild(input);
        wrap.appendChild(hint);

        function doRename(newName) {
          api("PATCH", "/tags/" + encodeURIComponent(oldName), { newName: newName }).then(function (data) {
            closeModal();
            showToast("Переименовано в «" + newName + "» (документов: " + (data.updatedDocuments || 0) + ")");
            return Promise.all([loadGlobalTags(), loadTags(), loadDocuments({ preserveScroll: true })]);
          }).catch(function (err) { showToast("Не удалось переименовать: " + err.message, "error"); });
        }

        var saveBtn = makeButton("Сохранить", "btn--accent", function () {
          var newName = input.value.trim();
          if (!newName) { showToast("Имя не может быть пустым", "error"); return; }
          if (newName === oldName) { closeModal(); return; }
          var newKey = newName.toLowerCase();
          var oldKey = oldName.toLowerCase();
          var collision = state.globalTags.find(function (t) {
            return t.tag.toLowerCase() === newKey && t.tag.toLowerCase() !== oldKey;
          });
          if (collision) {
            openConfirmModal({
              title: "Объединить теги?",
              bodyHtml: '<p>Тег «<strong>' + escapeHtml(newName) + '</strong>» уже существует (' + collision.count + ' док.). ' +
                'Все документы, у которых есть «<strong>' + escapeHtml(oldName) + '</strong>», получат «<strong>' + escapeHtml(newName) + '</strong>» и потеряют старый. Дубликаты будут схлопнуты.</p>',
              confirmLabel: "Объединить",
              onConfirm: function () { doRename(newName); },
            });
            return;
          }
          doRename(newName);
        });
        var cancelBtn = makeButton("Отмена", "btn--ghost", closeModal);
        openModal("Переименовать тег", wrap, [cancelBtn, saveBtn]);
        setTimeout(function () { input.focus(); input.select(); }, 0);
        input.addEventListener("keydown", function (e) { if (e.key === "Enter") saveBtn.click(); });
      }

      function confirmGlobalTagDelete(tagName, tagCount) {
        var count = Number(tagCount || 0);
        openConfirmModal({
          title: "Удалить тег?",
          bodyHtml: '<p>Удалить тег «<strong>' + escapeHtml(tagName) + '</strong>»? Он исчезнет у <strong>' + count + '</strong> ' +
            pluralRu(count, ["документа", "документов", "документов"]) + '.</p>' +
            '<p style="font-size:12px;color:var(--text-muted);margin:0;">Документы не удаляются, только тег. Действие нельзя отменить.</p>',
          danger: true,
          confirmLabel: "Удалить тег",
          onConfirm: function () {
            api("DELETE", "/tags/" + encodeURIComponent(tagName)).then(function (data) {
              showToast("Тег удалён у " + (data.updatedDocuments || 0) + " документов");
              return Promise.all([loadGlobalTags(), loadTags(), loadDocuments({ preserveScroll: true })]);
            }).catch(function (err) { showToast("Не удалось удалить: " + err.message, "error"); });
          },
        });
      }

      function selectNode(nodeId) {
        state.activeNodeId = nodeId || null;
        state.documentSearch = "";
        if (dom.docSearch) dom.docSearch.value = "";
        renderTree();
        renderNodeSelect();
        loadDocuments();
      }

      function closeMenu() {
        var menu = document.querySelector(".kb-popover");
        if (menu) menu.remove();
      }

      function showNodeMenu(nodeId, anchorRow) {
        closeMenu();
        var node = getNodeById(nodeId);
        if (!node || node.isSystem) return;
        var menu = document.createElement("div");
        menu.className = "kb-popover";
        menu.innerHTML =
          '<button type="button" data-act="rename">Переименовать</button>' +
          '<button type="button" data-act="create-child">Создать вложенный</button>' +
          '<button type="button" class="is-danger" data-act="delete">Удалить</button>';
        anchorRow.appendChild(menu);
        menu.addEventListener("click", function (event) {
          var btn = event.target.closest("button");
          if (!btn) return;
          var act = btn.getAttribute("data-act");
          closeMenu();
          if (act === "rename") promptRenameNode(nodeId);
          else if (act === "create-child") promptCreateNode(nodeId);
          else if (act === "delete") confirmDeleteNode(nodeId);
        });
        setTimeout(function () {
          document.addEventListener("click", closeMenu, { once: true });
        }, 0);
      }

      function openModal(title, body, footer) {
        dom.modalTitle.textContent = title;
        dom.modalBody.innerHTML = "";
        if (typeof body === "string") {
          dom.modalBody.innerHTML = body;
        } else if (body instanceof HTMLElement) {
          dom.modalBody.appendChild(body);
        }
        dom.modalFoot.innerHTML = "";
        (footer || []).forEach(function (btn) { dom.modalFoot.appendChild(btn); });
        dom.modalBackdrop.classList.add("is-open");
      }
      function closeModal() {
        dom.modalBackdrop.classList.remove("is-open");
        dom.modalBody.innerHTML = "";
        dom.modalFoot.innerHTML = "";
      }

      function makeButton(text, cls, onClick) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "btn " + (cls || "");
        b.textContent = text;
        b.addEventListener("click", onClick);
        return b;
      }

      function openConfirmModal(opts) {
        opts = opts || {};
        var wrap = document.createElement("div");
        wrap.className = "kb-prompt";
        if (opts.bodyHtml) wrap.innerHTML = opts.bodyHtml;
        else if (typeof opts.message === "string") {
          var p = document.createElement("p");
          p.style.cssText = "margin:0;";
          p.textContent = opts.message;
          wrap.appendChild(p);
        }
        var cancelBtn = makeButton(opts.cancelLabel || "Отмена", "btn--ghost", closeModal);
        var confirmCls = opts.danger ? "btn--danger" : "btn--accent";
        var confirmBtn = makeButton(opts.confirmLabel || "OK", confirmCls, function () {
          closeModal();
          if (typeof opts.onConfirm === "function") opts.onConfirm();
        });
        openModal(opts.title || "Подтверждение", wrap, [cancelBtn, confirmBtn]);
      }

      function promptCreateNode(parentId) {
        var wrap = document.createElement("div");
        wrap.className = "kb-prompt";
        var label = document.createElement("label");
        label.textContent = parentId ? "Название нового вложенного раздела" : "Название нового раздела";
        label.style.cssText = "font-size:12px;color:var(--text-muted);";
        var input = document.createElement("input");
        input.className = "kb-input";
        input.type = "text";
        input.placeholder = "Например: Документация";
        wrap.appendChild(label);
        wrap.appendChild(input);

        var saveBtn = makeButton("Создать", "btn--accent", function () {
          var name = input.value.trim();
          if (!name) { showToast("Введите название раздела", "error"); return; }
          api("POST", "/nodes", { name: name, parentId: parentId || null }).then(function (data) {
            closeModal();
            return refreshNodes().then(function () {
              if (data && data.node) {
                state.nodeExpanded.add(parentId || data.node.id);
                if (parentId) state.nodeExpanded.add(parentId);
                renderTree();
              }
            });
          }).catch(function (err) { showToast("Не удалось создать: " + err.message, "error"); });
        });
        var cancelBtn = makeButton("Отмена", "btn--ghost", closeModal);
        openModal(parentId ? "Новый вложенный раздел" : "Новый раздел", wrap, [cancelBtn, saveBtn]);
        setTimeout(function () { input.focus(); }, 0);
        input.addEventListener("keydown", function (e) { if (e.key === "Enter") saveBtn.click(); });
      }

      function promptRenameNode(nodeId) {
        var node = getNodeById(nodeId);
        if (!node) return;
        var wrap = document.createElement("div");
        wrap.className = "kb-prompt";
        var label = document.createElement("label");
        label.textContent = "Новое название";
        label.style.cssText = "font-size:12px;color:var(--text-muted);";
        var input = document.createElement("input");
        input.className = "kb-input";
        input.type = "text";
        input.value = node.name;
        wrap.appendChild(label);
        wrap.appendChild(input);

        var saveBtn = makeButton("Сохранить", "btn--accent", function () {
          var name = input.value.trim();
          if (!name) { showToast("Введите название", "error"); return; }
          api("PATCH", "/nodes/" + nodeId, { name: name }).then(function () {
            closeModal();
            return refreshNodes();
          }).catch(function (err) { showToast("Не удалось переименовать: " + err.message, "error"); });
        });
        var cancelBtn = makeButton("Отмена", "btn--ghost", closeModal);
        openModal("Переименовать раздел", wrap, [cancelBtn, saveBtn]);
        setTimeout(function () { input.focus(); input.select(); }, 0);
        input.addEventListener("keydown", function (e) { if (e.key === "Enter") saveBtn.click(); });
      }

      function pluralRu(n, forms) {
        var mod10 = n % 10;
        var mod100 = n % 100;
        if (mod10 === 1 && mod100 !== 11) return forms[0];
        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
        return forms[2];
      }

      function confirmDeleteNode(nodeId) {
        var node = getNodeById(nodeId);
        if (!node) return;
        var descendantIds = getDescendantIds(nodeId);
        var hasChildren = descendantIds.size > 0;
        var counts = state.nodeCounts[nodeId] || {};
        var docCount = Number(counts.scopeDocuments || 0);

        if (hasChildren) {
          var subnodesCount = descendantIds.size;
          var subWord = pluralRu(subnodesCount, ["подраздел", "подраздела", "подразделов"]);
          var docWord = pluralRu(docCount, ["документ", "документа", "документов"]);
          var lines = [
            '<p style="margin:0;">Удалить раздел «<strong>' + escapeHtml(node.name) + '</strong>»?</p>',
            '<p style="margin:0;color:var(--text-muted);font-size:12px;">Это удалит:</p>',
            '<ul style="margin:0;padding-left:20px;font-size:12px;color:var(--text-muted);">',
            '<li><strong>' + subnodesCount + '</strong> ' + subWord + ' (включая все вложенные)</li>',
            (docCount > 0
              ? '<li><strong>' + docCount + '</strong> ' + docWord + ' внутри них — будут перенесены в «Без раздела»</li>'
              : '<li>Документов в этих разделах нет</li>'),
            '</ul>',
            '<p style="margin:0;color:var(--danger);font-size:12px;">Это действие нельзя отменить.</p>',
          ];
          openConfirmModal({
            title: "Удалить раздел и поддерево?",
            bodyHtml: lines.join(""),
            danger: true,
            confirmLabel: "Удалить со всем поддеревом",
            onConfirm: function () {
              api("DELETE", "/nodes/" + encodeURIComponent(nodeId) + "?strategy=move_to_unsorted&cascade=true")
                .then(function (data) {
                  if (state.activeNodeId === nodeId) state.activeNodeId = null;
                  state.nodeExpanded.delete(nodeId);
                  descendantIds.forEach(function (id) {
                    state.nodeExpanded.delete(id);
                    if (state.activeNodeId === id) state.activeNodeId = null;
                  });
                  var movedMsg = data && data.movedDocuments
                    ? " Перенесено документов: " + data.movedDocuments + "."
                    : "";
                  showToast("Раздел и " + subnodesCount + " " + subWord + " удалены." + movedMsg);
                  return refreshNodes({ reloadDocuments: true });
                })
                .catch(function (err) {
                  showToast("Не удалось удалить: " + err.message, "error");
                });
            },
          });
          return;
        }

        var hasDocs = docCount > 0;
        var moveTarget = node.parentId ? "родительский раздел" : "«Без раздела»";
        var bodyHtml =
          '<p style="margin:0;">Удалить раздел «<strong>' + escapeHtml(node.name) + '</strong>»?</p>' +
          (hasDocs
            ? '<p style="font-size:12px;color:var(--text-muted);margin:0;">В разделе ' +
              docCount + ' ' + pluralRu(docCount, ["документ", "документа", "документов"]) +
              '. Они будут перемещены в <strong>' + moveTarget +
              '</strong>. Сами документы и их векторы не удаляются.</p>'
            : '<p style="font-size:12px;color:var(--text-muted);margin:0;">Документов в разделе нет. Раздел будет удалён сразу.</p>');
        openConfirmModal({
          title: "Удалить раздел?",
          bodyHtml: bodyHtml,
          danger: true,
          confirmLabel: hasDocs ? "Удалить и переместить документы" : "Удалить раздел",
          onConfirm: function () {
            var strategy = hasDocs
              ? (node.parentId ? "move_to_parent" : "move_to_unsorted")
              : "block";
            api("DELETE", "/nodes/" + encodeURIComponent(nodeId) + "?strategy=" + strategy)
              .then(function () {
                if (state.activeNodeId === nodeId) state.activeNodeId = null;
                state.nodeExpanded.delete(nodeId);
                showToast("Раздел удалён");
                return refreshNodes({ reloadDocuments: hasDocs });
              })
              .catch(function (err) {
                showToast("Не удалось удалить: " + err.message, "error");
              });
          },
        });
      }

      function openTagsModal(documentId) {
        var doc = state.documents.find(function (d) { return d.id === documentId; });
        if (!doc) return;
        var currentTags = Array.isArray(doc.categories) ? doc.categories.slice() : [];

        var wrap = document.createElement("div");
        wrap.className = "kb-prompt";
        var tagsBox = document.createElement("div");
        tagsBox.className = "kb-tags-edit";
        var inputRow = document.createElement("div");
        inputRow.className = "kb-tag-input-row";
        var input = document.createElement("input");
        input.className = "kb-input";
        input.type = "text";
        input.placeholder = "Новый тег";
        var addBtn = makeButton("Добавить", "btn--accent", function () { addTag(input.value); });
        inputRow.appendChild(input);
        inputRow.appendChild(addBtn);
        var suggestions = document.createElement("div");
        suggestions.className = "kb-tag-suggestions";

        var hint = document.createElement("p");
        hint.style.cssText = "font-size:12px;color:var(--text-muted);margin:0;";
        hint.textContent = "Теги документа — массив строк. Изменения применятся к payload Qdrant.";

        wrap.appendChild(tagsBox);
        wrap.appendChild(inputRow);
        wrap.appendChild(suggestions);
        wrap.appendChild(hint);

        function renderTagsBox() {
          tagsBox.innerHTML = "";
          if (!currentTags.length) {
            tagsBox.innerHTML = '<span style="color:var(--text-muted);font-size:12px;">Тегов пока нет</span>';
          } else {
            currentTags.forEach(function (tag, idx) {
              var chip = document.createElement("span");
              chip.className = "doc-tag";
              chip.innerHTML = escapeHtml(tag) + ' <button type="button" data-idx="' + idx + '" aria-label="Убрать">×</button>';
              tagsBox.appendChild(chip);
            });
            tagsBox.querySelectorAll("button").forEach(function (b) {
              b.addEventListener("click", function () {
                var i = Number(b.getAttribute("data-idx"));
                currentTags.splice(i, 1);
                renderTagsBox();
                renderSuggestions();
              });
            });
          }
        }
        function renderSuggestions() {
          var avail = state.existingTags.filter(function (t) { return currentTags.indexOf(t) === -1; }).slice(0, 12);
          suggestions.innerHTML = avail.length ? '<span style="font-size:11px;color:var(--text-muted)">Из базы:</span>' : '';
          avail.forEach(function (t) {
            var b = document.createElement("button");
            b.type = "button";
            b.textContent = t;
            b.addEventListener("click", function () { addTag(t); });
            suggestions.appendChild(b);
          });
        }
        function parseTagInput(raw) {
          return String(raw || "")
            .split(/[,;\\n]+/)
            .map(function (s) { return s.trim().replace(/^#+/, ""); })
            .filter(function (s) { return s.length > 0 && s.length <= 64; });
        }
        function addTag(raw) {
          var parts = parseTagInput(raw);
          if (!parts.length) return;
          var seen = {};
          currentTags.forEach(function (t) { seen[String(t).toLowerCase()] = true; });
          parts.forEach(function (p) {
            var key = p.toLowerCase();
            if (!seen[key]) {
              currentTags.push(p);
              seen[key] = true;
            }
          });
          input.value = "";
          renderTagsBox();
          renderSuggestions();
        }
        input.addEventListener("keydown", function (e) {
          if (e.key === "Enter") { e.preventDefault(); addBtn.click(); }
        });

        var saveBtn = makeButton("Сохранить", "btn--accent", function () {
          api("PATCH", "/documents/" + documentId, { categories: currentTags }).then(function (data) {
            doc.categories = (data.document && data.document.categories) || currentTags;
            closeModal();
            renderDocuments();
            showToast("Теги сохранены");
            return loadTags();
          }).catch(function (err) { showToast("Не удалось сохранить теги: " + err.message, "error"); });
        });
        var cancelBtn = makeButton("Отмена", "btn--ghost", closeModal);

        renderTagsBox();
        renderSuggestions();
        openModal("Редактирование тегов", wrap, [cancelBtn, saveBtn]);
        setTimeout(function () { input.focus(); }, 0);
      }

      function confirmReindexDocument(documentId, docTitle) {
        openConfirmModal({
          title: "Переиндексировать документ?",
          bodyHtml:
            '<p style="margin:0;">Переиндексировать «<strong>' + escapeHtml(docTitle || documentId) + '</strong>»?</p>' +
            '<ul style="margin:0;padding-left:18px;font-size:12px;color:var(--text-muted);">' +
            '<li>Текущие чанки и векторы документа будут удалены</li>' +
            '<li>Документ обработается заново, включая OCR (если он включён в Настройках)</li>' +
            '<li>Это может занять несколько минут — следите за прогрессом в задачах импорта</li>' +
            '</ul>',
          confirmLabel: "Переиндексировать",
          danger: false,
          onConfirm: function () {
            api("POST", "/documents/" + encodeURIComponent(documentId) + "/reindex", {}).then(function () {
              showToast("Документ поставлен в очередь на переиндексацию");
              state.jobsCollapsed = false;
              setActiveTab("jobs");
              loadJobs();
              refreshNodes({ reloadDocuments: true });
            }).catch(function (err) { showToast("Не удалось переиндексировать: " + err.message, "error"); });
          },
        });
      }

      function confirmReparseGraph(documentId, docTitle) {
        openConfirmModal({
          title: "Перепарсить граф?",
          bodyHtml:
            '<p style="margin:0;">Запустить парсер графа знаний для документа «<strong>' + escapeHtml(docTitle || documentId) + '</strong>»?</p>' +
            '<ul style="margin:0;padding-left:18px;font-size:12px;color:var(--text-muted);">' +
            '<li>Существующие узлы графа обновятся по бизнес-ключу (UPSERT)</li>' +
            '<li>Новые узлы будут созданы</li>' +
            '<li>RAG-индекс и теги документа не затрагиваются</li>' +
            '<li>Применяются текущие профили из <span class="mono">config/graph-parsers.yaml</span></li>' +
            '</ul>',
          confirmLabel: "Перепарсить",
          danger: false,
          onConfirm: function () {
            showToast("Парсер графа запущен…");
            api("POST", "/api/v2/graph/reparse/" + encodeURIComponent(documentId), {}).then(function (data) {
              var report = (data && data.report) || {};
              if (report.ok === false) {
                showToast("Парсер вернул ошибку: " + (report.error || "неизвестно"), "error");
                showGraphReparseDetails(docTitle, report);
                return;
              }
              if (!report.profile_id) {
                showToast("Профиль для этого файла не распознан. Откройте Настройки → Граф знаний и добавьте/настройте профиль.", "warning");
                showGraphReparseDetails(docTitle, report);
                return;
              }
              var s = report.summary || {};
              var totalCreated = 0, totalUpdated = 0;
              Object.keys(s).forEach(function (k) {
                totalCreated += Number(s[k] && s[k].created || 0);
                totalUpdated += Number(s[k] && s[k].updated || 0);
              });
              showToast(
                "Граф обновлён. Профиль: " + report.profile_id +
                ". Создано: " + totalCreated +
                ", обновлено: " + totalUpdated +
                ", связей: " + Number(report.edges_created || 0)
              );
              showGraphReparseDetails(docTitle, report);
            }).catch(function (err) { showToast("Не удалось перепарсить: " + err.message, "error"); });
          },
        });
      }

      // Этап 3: ручной запуск LLM-извлечения случаев. Извлечённое идёт в
      // очередь кандидатов (не в граф). Граф наполняется только после
      // подтверждения на экране «Кандидаты».
      function confirmExtractKnowledge(documentId, docTitle) {
        openConfirmModal({
          title: "Извлечь знания из документа?",
          bodyHtml:
            '<p style="margin:0;">LLM прочитает текст документа «<strong>' + escapeHtml(docTitle || documentId) + '</strong>» и извлечёт из него случаи (оборудование / что произошло / что сделали).</p>' +
            '<ul style="margin:8px 0 0;padding-left:18px;font-size:12px;color:var(--text-muted);">' +
            '<li>Извлечённое — <strong>черновики</strong>: в граф напрямую НЕ попадают</li>' +
            '<li>Случаи складываются в очередь «Кандидаты» (Граф знаний → Кандидаты)</li>' +
            '<li>В граф случай попадёт только после вашего «Подтвердить»</li>' +
            '<li>Текст документа уходит в облако выбранного провайдера; факты переносятся дословно</li>' +
            '<li>Доступно только для текстовых документов (docx / txt / md)</li>' +
            '</ul>',
          confirmLabel: "Извлечь",
          danger: false,
          onConfirm: function () {
            showToast("Извлечение запущено… это может занять до минуты.");
            api("POST", "/api/v2/graph/extract/" + encodeURIComponent(documentId), {}).then(function (data) {
              if (data && data.jobId) {
                pollExtractStatus(data.jobId, docTitle, 0);
              } else {
                showToast("Извлечение запущено.");
              }
            }).catch(function (err) {
              // 409 / ok:false → понятное русское сообщение (выключено,
              // нет провайдера, не тот тип документа и т.п.).
              showToast("Не удалось запустить извлечение: " + err.message, "error");
            });
          },
        });
      }

      function pollExtractStatus(jobId, docTitle, attempt) {
        attempt = attempt || 0;
        if (attempt > 90) {
          showToast("Извлечение выполняется дольше обычного — загляните на экран «Кандидаты» позже.", "warning");
          return;
        }
        api("GET", "/api/v2/graph/extract/status/" + encodeURIComponent(jobId)).then(function (data) {
          var job = (data && data.job) || {};
          if (job.status === "running") {
            setTimeout(function () { pollExtractStatus(jobId, docTitle, attempt + 1); }, 2000);
            return;
          }
          if (job.status === "done") {
            showToast(job.message || ("Извлечено случаев: " + (job.casesFound || 0) + ". Откройте «Граф знаний → Кандидаты» для проверки."));
            return;
          }
          if (job.status === "empty") {
            showToast(job.message || "Случаи в документе не найдены.", "warning");
            return;
          }
          showToast("Извлечение не удалось: " + (job.error || "неизвестная ошибка"), "error");
        }).catch(function (err) {
          showToast("Не удалось получить статус извлечения: " + err.message, "error");
        });
      }

      function showGraphReparseDetails(docTitle, report) {
        var wrap = document.createElement("div");
        wrap.className = "kb-prompt";
        var title = document.createElement("p");
        title.style.cssText = "margin:0;font-size:13px;";
        title.innerHTML = "Отчёт парсера для <strong>" + escapeHtml(docTitle || "(без имени)") + "</strong>";
        wrap.appendChild(title);
        var pre = document.createElement("pre");
        pre.style.cssText = "background:var(--surface-2);padding:8px;border-radius:6px;font-size:11px;max-height:400px;overflow:auto;white-space:pre-wrap;";
        try {
          pre.textContent = JSON.stringify(report, null, 2);
        } catch (e) {
          pre.textContent = String(report);
        }
        wrap.appendChild(pre);
        var closeBtn = makeButton("Закрыть", "btn--ghost", closeModal);
        openModal("Отчёт парсера графа", wrap, [closeBtn]);
      }

      function openRenameModal(documentId) {
        var doc = state.documents.find(function (d) { return d.id === documentId; });
        if (!doc) { showToast("Документ не найден в списке", "error"); return; }
        var wrap = document.createElement("div");
        wrap.className = "kb-prompt";
        var label = document.createElement("label");
        label.textContent = "Имя документа";
        label.style.cssText = "font-size:12px;color:var(--text-muted);";
        var input = document.createElement("input");
        input.className = "kb-input";
        input.type = "text";
        input.maxLength = 255;
        input.value = doc.title || doc.original_file_name || "";
        var hint = document.createElement("p");
        hint.style.cssText = "font-size:12px;color:var(--text-muted);margin:0;";
        hint.textContent = "Меняется только видимое название документа. Файл в data/raw не переименовывается.";
        wrap.appendChild(label);
        wrap.appendChild(input);
        wrap.appendChild(hint);

        var saveBtn = makeButton("Сохранить", "btn--accent", function () {
          var title = input.value.trim();
          if (!title) { showToast("Введите название", "error"); return; }
          if (title.length > 255) { showToast("Не больше 255 символов", "error"); return; }
          api("PATCH", "/documents/" + documentId, { title: title }).then(function (data) {
            var fresh = (data && data.document) || null;
            if (fresh) {
              var idx = state.documents.findIndex(function (d) { return d.id === documentId; });
              if (idx >= 0) state.documents[idx] = Object.assign({}, state.documents[idx], { title: fresh.title });
            }
            closeModal();
            renderDocuments();
            showToast("Документ переименован");
          }).catch(function (err) { showToast("Не удалось переименовать: " + err.message, "error"); });
        });
        var cancelBtn = makeButton("Отмена", "btn--ghost", closeModal);
        openModal("Переименовать документ", wrap, [cancelBtn, saveBtn]);
        setTimeout(function () { input.focus(); input.select(); }, 0);
        input.addEventListener("keydown", function (e) { if (e.key === "Enter") saveBtn.click(); });
      }

      function openMoveModal(documentId) {
        var wrap = document.createElement("div");
        wrap.className = "kb-prompt";
        var label = document.createElement("label");
        label.textContent = "Куда переместить документ";
        label.style.cssText = "font-size:12px;color:var(--text-muted);";
        var select = document.createElement("select");
        select.className = "kb-select";
        var children = nodeChildrenMap();
        var options = ['<option value="">Без раздела</option>'];
        function walk(node, depth) {
          var prefix = "";
          for (var i = 0; i < depth; i++) prefix += "— ";
          options.push('<option value="' + escapeHtml(node.id) + '">' + escapeHtml(prefix + node.name) + '</option>');
          (children[node.id] || []).forEach(function (c) { walk(c, depth + 1); });
        }
        (children.__root__ || []).forEach(function (root) { walk(root, 0); });
        select.innerHTML = options.join("");
        wrap.appendChild(label);
        wrap.appendChild(select);

        var saveBtn = makeButton("Переместить", "btn--accent", function () {
          var nodeId = select.value || state.unsortedNodeId;
          var payload = nodeId ? { nodeIds: [nodeId], primaryNodeId: nodeId } : { nodeIds: [] };
          api("PATCH", "/documents/" + documentId + "/nodes", payload).then(function () {
            closeModal();
            return refreshNodes({ reloadDocuments: true });
          }).catch(function (err) { showToast("Не удалось переместить: " + err.message, "error"); });
        });
        var cancelBtn = makeButton("Отмена", "btn--ghost", closeModal);
        openModal("Переместить в раздел", wrap, [cancelBtn, saveBtn]);
      }

      function openBulkMoveModal() {
        if (state.selectedDocIds.size === 0) return;
        var ids = Array.from(state.selectedDocIds);
        var wrap = document.createElement("div");
        wrap.className = "kb-prompt";
        var info = document.createElement("p");
        info.style.cssText = "margin:0;font-size:13px;";
        info.textContent = "Выбрано документов: " + ids.length;
        var label = document.createElement("label");
        label.textContent = "Целевой раздел";
        label.style.cssText = "font-size:12px;color:var(--text-muted);";
        var select = document.createElement("select");
        select.className = "kb-select";
        var children = nodeChildrenMap();
        var options = ['<option value="">Без раздела</option>'];
        function walk(node, depth) {
          var prefix = "";
          for (var i = 0; i < depth; i++) prefix += "— ";
          options.push('<option value="' + escapeHtml(node.id) + '">' + escapeHtml(prefix + node.name) + '</option>');
          (children[node.id] || []).forEach(function (c) { walk(c, depth + 1); });
        }
        (children.__root__ || []).forEach(function (root) { walk(root, 0); });
        select.innerHTML = options.join("");
        wrap.appendChild(info);
        wrap.appendChild(label);
        wrap.appendChild(select);

        var saveBtn = makeButton("Переместить", "btn--accent", function () {
          var nodeId = select.value || state.unsortedNodeId;
          var payload = nodeId ? { nodeIds: [nodeId], primaryNodeId: nodeId } : { nodeIds: [] };
          var docIds = ids.slice();
          api("POST", "/documents/bulk-link", { documentIds: docIds, mode: "replace", ...payload }).then(function () {
            closeModal();
            state.selectedDocIds = new Set();
            return refreshNodes({ reloadDocuments: true });
          }).catch(function (err) {
            Promise.all(docIds.map(function (id) {
              return api("PATCH", "/documents/" + id + "/nodes", payload);
            })).then(function () {
              closeModal();
              state.selectedDocIds = new Set();
              return refreshNodes({ reloadDocuments: true });
            }).catch(function (err2) { showToast("Ошибка массового перемещения: " + err2.message, "error"); });
          });
        });
        var cancelBtn = makeButton("Отмена", "btn--ghost", closeModal);
        openModal("Переместить выбранные", wrap, [cancelBtn, saveBtn]);
      }

      function confirmDeleteDocuments(ids, { label } = {}) {
        if (!ids || ids.length === 0) return;
        var docs = state.documents.filter(function (d) { return ids.indexOf(d.id) !== -1; });
        var headline;
        if (ids.length === 1) {
          var doc = docs[0];
          var title = doc ? (doc.title || doc.original_file_name || doc.id) : ids[0];
          headline = 'Удалить документ «' + escapeHtml(title) + '»?';
        } else {
          headline = 'Удалить выбранные документы (' + ids.length + ')?';
        }
        var wrap = document.createElement("div");
        wrap.className = "kb-prompt";
        wrap.innerHTML = '<p>' + headline + '</p>' +
          '<p style="font-size:12px;color:var(--text-muted)">Будут удалены векторы из Qdrant и записи из PostgreSQL. Файлы в data/raw не трогаются.</p>';
        var buttonLabel = label || ("Удалить " + ids.length + " док.");
        var deleteBtn = makeButton(buttonLabel, "btn--danger", function () {
          Promise.all(ids.map(function (id) {
            return api("DELETE", "/documents/" + id).catch(function (err) {
              return { ok: false, error: err.message, id: id };
            });
          })).then(function (results) {
            var failed = results.filter(function (r) { return r && r.ok === false; });
            var qdrantWarnings = results.filter(function (r) { return r && r.ok !== false && r.qdrantError; });
            closeModal();
            ids.forEach(function (id) { state.selectedDocIds.delete(id); });
            if (failed.length) {
              showToast("Удалено: " + (ids.length - failed.length) + ", ошибок: " + failed.length, "error");
            } else if (qdrantWarnings.length) {
              var base = ids.length === 1
                ? "Документ удалён из базы."
                : ("Удалено из базы: " + ids.length + ".");
              showToast(
                base + " Qdrant был недоступен — запустите «Пересобрать Qdrant» в Настройках → Обслуживание.",
                "warning"
              );
            } else {
              showToast(ids.length === 1 ? "Документ удалён" : ("Удалено: " + ids.length));
            }
            return refreshNodes({ reloadDocuments: true });
          });
        });
        var cancelBtn = makeButton("Отмена", "btn--ghost", closeModal);
        openModal(ids.length === 1 ? "Удаление документа" : "Удаление документов", wrap, [cancelBtn, deleteBtn]);
      }

      function confirmBulkDelete() {
        if (state.selectedDocIds.size === 0) return;
        confirmDeleteDocuments(Array.from(state.selectedDocIds));
      }

      function uploadFileToJob(jobId, file) {
        var fd = new FormData();
        fd.append("file", file, file.name);
        return new Promise(function (resolve, reject) {
          var xhr = new XMLHttpRequest();
          xhr.open("PUT", "/jobs/" + encodeURIComponent(jobId) + "/upload");
          xhr.onload = function () {
            try {
              var data = JSON.parse(xhr.responseText || "{}");
              if (xhr.status >= 200 && xhr.status < 300 && data.ok !== false) {
                resolve(data);
              } else {
                var err = new Error(data.error || ("HTTP " + xhr.status));
                err.status = xhr.status;
                reject(err);
              }
            } catch (e) {
              var err2 = new Error("Не удалось распарсить ответ");
              err2.status = xhr.status;
              reject(err2);
            }
          };
          xhr.onerror = function () { reject(new Error("Сетевая ошибка")); };
          xhr.send(fd);
        });
      }

      function readConcurrencyLive() {
        // #8.1.c.fix-2: фронт всегда регистрирует задачи последовательно (по одному
        // файлу), потому что реальный параллелизм управляется на бэкенде через
        // indexingSemaphore (см. «Настройки → Сервисы»). Возврат 1 — это размер
        // worker pool на фронте при регистрации очереди, не throughput pipeline.
        return 1;
      }

      function handleFiles(fileList) {
        var files = Array.from(fileList || []);
        if (!files.length) return;
        if (state.uploadInProgress) {
          showToast("Идёт другая загрузка — дождитесь её завершения", "error");
          return;
        }
        state.uploadInProgress = true;
        state.jobsCollapsed = false;
        renderJobs();

        var nodeId = (dom.nodeSelect && dom.nodeSelect.value) || state.activeNodeId || "";
        // #8.1.c.fix-2: всегда true — «лёгкий режим» удалён из UI.
        // API на бэкенде по-прежнему принимает createVisualAssets=false (для curl).
        var createVisualAssets = true;
        var items = files.map(function (file) {
          return {
            filename: file.webkitRelativePath || file.relativePath || file.name,
            size: file.size || 0,
            nodeId: nodeId || null,
            primaryNodeId: nodeId || null,
            createVisualAssets: createVisualAssets,
            categories: [],
          };
        });

        var concurrency = readConcurrencyLive();
        var initialDelayMs = concurrency === 1 ? 500 : 250;
        var perFileDelayMs = 200;

        // eslint-disable-next-line no-console
        console.log("[queue] handleFiles", { files: files.length, concurrency: concurrency, nodeId: nodeId });

        showToast("Регистрируем " + files.length + " задач(и) в очереди…");
        api("POST", "/jobs/queue", { items: items }).then(function (data) {
          var jobs = Array.isArray(data && data.jobs) ? data.jobs : [];
          if (jobs.length !== files.length) {
            showToast("В очередь добавлено " + jobs.length + " из " + files.length, "error");
          }
          loadJobs();
          showToast(
            concurrency === 1
              ? "В очередь: " + jobs.length + ". Загрузка по одному через 0.5 сек — успейте удалить ненужные."
              : "В очередь: " + jobs.length + ". Загрузка пачкой по " + concurrency + "."
          );
          // eslint-disable-next-line no-console
          console.log("[queue] registered", jobs.length, "jobs, status='queued', starting workers in", initialDelayMs, "ms");

          var queue = [];
          for (var i = 0; i < files.length; i += 1) {
            if (jobs[i]) queue.push({ file: files[i], jobId: jobs[i].id });
          }

          var ok = 0;
          var fail = 0;
          var aborted = 0;

          function finalize() {
            var parts = [];
            if (ok) parts.push("отправлено: " + ok);
            if (fail) parts.push("ошибок: " + fail);
            if (aborted) parts.push("отменено: " + aborted);
            showToast(parts.join(", ") || "Готово", fail ? "error" : undefined);
            // eslint-disable-next-line no-console
            console.log("[queue] finalize", { ok: ok, fail: fail, aborted: aborted });
            state.uploadInProgress = false;
            refreshNodes({ reloadDocuments: true });
            loadJobs();
          }

          if (queue.length === 0) {
            finalize();
            return;
          }

          function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

          // Worker pool: каждый воркер тянет задачи .shift() из общей очереди,
          // пока она не опустеет. Между файлами — пауза perFileDelayMs.
          function worker(workerIdx) {
            return (function tick() {
              if (queue.length === 0) return Promise.resolve();
              var task = queue.shift();
              if (!task) return Promise.resolve();
              // eslint-disable-next-line no-console
              console.log("[queue] worker", workerIdx, "→ upload", task.file.name);
              return uploadFileToJob(task.jobId, task.file).then(function () {
                ok += 1;
              }).catch(function (err) {
                if (err && (err.status === 404 || err.status === 409)) {
                  aborted += 1;
                } else {
                  fail += 1;
                  // eslint-disable-next-line no-console
                  console.warn("[queue] upload failed", task.file.name, err);
                }
              }).then(function () {
                loadJobs();
                return sleep(perFileDelayMs).then(tick);
              });
            })();
          }

          sleep(initialDelayMs).then(function () {
            var workersCount = Math.min(concurrency, queue.length);
            // eslint-disable-next-line no-console
            console.log("[queue] launching", workersCount, "workers for", queue.length, "tasks");
            var workers = [];
            for (var w = 0; w < workersCount; w += 1) workers.push(worker(w + 1));
            return Promise.all(workers);
          }).then(finalize, function (err) {
            // eslint-disable-next-line no-console
            console.error("[queue] worker pool fatal", err);
            finalize();
          });
        }).catch(function (err) {
          state.uploadInProgress = false;
          showToast("Не удалось зарегистрировать очередь: " + err.message, "error");
        });
      }

      function importServerPath() {
        var rawPath = (dom.serverPath.value || "").trim();
        if (!rawPath) { showToast("Введите путь к папке на сервере", "error"); return; }
        var body = {
          relativeDir: rawPath,
          // #8.1.c.fix-2: оба параметра жёстко true. Чекбоксы убраны из UI.
          recursive: true,
          createVisualAssets: true,
          categories: [],
        };
        var nodeId = dom.nodeSelect.value || state.activeNodeId || "";
        if (nodeId) { body.nodeIds = [nodeId]; body.primaryNodeId = nodeId; }
        dom.serverImportBtn.disabled = true;
        api("POST", "/documents/ingest-folder-async", body).then(function (data) {
          showToast("Задача создана: " + (data.relativeDir || rawPath));
          dom.serverPath.value = "";
          state.jobsCollapsed = false;
          loadJobs();
        }).catch(function (err) { showToast("Ошибка импорта: " + err.message, "error"); })
          .then(function () { dom.serverImportBtn.disabled = false; });
      }

      function bindEvents() {
        dom.treeNewBtn.addEventListener("click", function () { promptCreateNode(null); });
        dom.tree.addEventListener("click", function (event) {
          var toggleBtn = event.target.closest("[data-action='toggle-node']");
          if (toggleBtn) {
            event.stopPropagation();
            var nid = toggleBtn.getAttribute("data-node-id");
            if (state.nodeExpanded.has(nid)) state.nodeExpanded.delete(nid);
            else state.nodeExpanded.add(nid);
            renderTree();
            return;
          }
          var menuBtn = event.target.closest("[data-action='node-menu']");
          if (menuBtn) {
            event.stopPropagation();
            var row = menuBtn.closest(".kb-node-row");
            showNodeMenu(menuBtn.getAttribute("data-node-id"), row);
            return;
          }
          var labelEl = event.target.closest("[data-action='select-node']");
          if (labelEl) {
            selectNode(labelEl.getAttribute("data-node-id"));
            return;
          }
        });

        dom.dropzone.addEventListener("dragover", function (e) { e.preventDefault(); dom.dropzone.classList.add("is-dragover"); });
        dom.dropzone.addEventListener("dragleave", function () { dom.dropzone.classList.remove("is-dragover"); });
        dom.dropzone.addEventListener("drop", function (e) {
          e.preventDefault();
          dom.dropzone.classList.remove("is-dragover");
          handleFiles(e.dataTransfer.files);
        });
        dom.fileInput.addEventListener("change", function () { handleFiles(dom.fileInput.files); dom.fileInput.value = ""; });
        dom.folderInput.addEventListener("change", function () { handleFiles(dom.folderInput.files); dom.folderInput.value = ""; });
        dom.serverImportBtn.addEventListener("click", importServerPath);
        dom.serverPath.addEventListener("keydown", function (e) { if (e.key === "Enter") importServerPath(); });
        dom.nodeSelect.addEventListener("change", function () { /* used during upload */ });
        // #8.1.c.fix-2: селектор «Параллелизм загрузки» удалён из UI Загрузки.
        // Управление переехало в «Настройки → Сервисы → Параллелизм индексации».

        dom.jobsToggleBtn.addEventListener("click", function () {
          state.jobsCollapsed = !state.jobsCollapsed;
          renderJobs();
        });
        dom.jobsRefreshBtn.addEventListener("click", loadJobs);
        dom.jobsCard.addEventListener("click", function (e) {
          var pillBtn = e.target.closest("[data-action='toggle-jobs-pill']");
          if (pillBtn) {
            var pill = pillBtn.getAttribute("data-pill");
            var idx = state.jobsStatuses.indexOf(pill);
            if (idx === -1) state.jobsStatuses.push(pill);
            else state.jobsStatuses.splice(idx, 1);
            if (state.jobsStatuses.length === 0) {
              state.jobsStatuses = DEFAULT_JOBS_STATUSES.slice();
              showToast("Хотя бы один фильтр должен быть включён", "error");
            }
            saveJobsStatusesToStorage(state.jobsStatuses);
            state.jobsPage = 1;
            loadJobs();
            return;
          }
          var prevBtn = e.target.closest("[data-action='jobs-page-prev']");
          if (prevBtn && !prevBtn.disabled) {
            state.jobsPage = Math.max(1, state.jobsPage - 1);
            loadJobs();
            return;
          }
          var nextBtn = e.target.closest("[data-action='jobs-page-next']");
          if (nextBtn && !nextBtn.disabled) {
            state.jobsPage += 1;
            loadJobs();
            return;
          }
          var cancelBtn = e.target.closest("[data-action='cancel-job']");
          if (cancelBtn) {
            var jid = cancelBtn.getAttribute("data-job-id");
            api("POST", "/jobs/" + jid + "/cancel", {})
              .then(function () { loadJobs(); })
              .catch(function (err) { showToast("Не удалось отменить: " + err.message, "error"); });
            return;
          }
          var restartBtn = e.target.closest("[data-action='restart-job']");
          if (restartBtn) {
            var rid = restartBtn.getAttribute("data-job-id");
            api("POST", "/jobs/" + rid + "/retry", {})
              .then(function () {
                showToast("Повторный импорт поставлен в очередь");
                loadJobs();
              })
              .catch(function (err) { showToast("Не удалось перезапустить: " + err.message, "error"); });
            return;
          }
          var delBtn = e.target.closest("[data-action='delete-job']");
          if (delBtn) {
            var did = delBtn.getAttribute("data-job-id");
            var dtitle = delBtn.getAttribute("data-job-title") || "";
            openConfirmModal({
              title: "Удалить задачу из истории?",
              bodyHtml:
                '<p style="margin:0;">Удалить запись «<strong>' + escapeHtml(dtitle) + '</strong>»?</p>' +
                '<p style="font-size:12px;color:var(--text-muted);margin:0;">Документ и его векторы не затрагиваются — удалится только запись о задаче.</p>',
              danger: true,
              confirmLabel: "Удалить",
              onConfirm: function () {
                api("DELETE", "/jobs/" + encodeURIComponent(did))
                  .then(function () {
                    showToast("Задача удалена из истории");
                    loadJobs();
                  })
                  .catch(function (err) { showToast("Не удалось удалить: " + err.message, "error"); });
              },
            });
            return;
          }
          var pageSizeSel = e.target.closest("#kbJobsPageSize");
          if (pageSizeSel) return;
        });
        dom.jobsCard.addEventListener("change", function (e) {
          var pageSizeSel = e.target.closest("#kbJobsPageSize");
          if (pageSizeSel) {
            var n = Number(pageSizeSel.value);
            if (ALLOWED_PAGE_SIZES.indexOf(n) !== -1) {
              state.jobsPageSize = n;
              saveJobsPageSizeToStorage(n);
              state.jobsPage = 1;
              loadJobs();
            }
          }
        });

        dom.docToggleScope.addEventListener("click", function () {
          state.includeChildren = !state.includeChildren;
          dom.docToggleScope.textContent = state.includeChildren ? "Включая вложенные" : "Только в этом разделе";
          loadDocuments();
        });
        dom.docSearch.addEventListener("input", function () {
          state.documentSearch = dom.docSearch.value;
          renderDocuments();
        });
        dom.addDocBtn.addEventListener("click", function () { dom.dropzone.scrollIntoView({ behavior: "smooth", block: "center" }); });
        dom.docHeaderCheckbox.addEventListener("change", function () {
          if (dom.docHeaderCheckbox.checked) {
            state.selectedDocIds = new Set(state.documents.map(function (d) { return d.id; }));
          } else {
            state.selectedDocIds = new Set();
          }
          renderDocuments();
        });
        dom.docShowMore.addEventListener("click", function () {
          state.documentLimit += 50;
          loadDocuments();
        });
        dom.docBulkMove.addEventListener("click", openBulkMoveModal);
        dom.docBulkDelete.addEventListener("click", confirmBulkDelete);

        dom.docTableBody.addEventListener("click", function (event) {
          var selectCb = event.target.closest("[data-action='select-doc']");
          if (selectCb) {
            var id = selectCb.getAttribute("data-doc-id");
            if (selectCb.checked) state.selectedDocIds.add(id); else state.selectedDocIds.delete(id);
            renderBulkBar();
            return;
          }
          var renameBtn = event.target.closest("[data-action='rename-doc']");
          if (renameBtn) { openRenameModal(renameBtn.getAttribute("data-doc-id")); return; }
          var openBtn = event.target.closest("[data-action='open-doc']");
          if (openBtn) {
            window.open("/documents/" + openBtn.getAttribute("data-doc-id") + "/original", "_blank", "noopener");
            return;
          }
          var moveBtn = event.target.closest("[data-action='move-doc']");
          if (moveBtn) { openMoveModal(moveBtn.getAttribute("data-doc-id")); return; }
          var tagsBtn = event.target.closest("[data-action='edit-tags']");
          if (tagsBtn) { openTagsModal(tagsBtn.getAttribute("data-doc-id")); return; }
          var reindexBtn = event.target.closest("[data-action='reindex-doc']");
          if (reindexBtn) {
            confirmReindexDocument(reindexBtn.getAttribute("data-doc-id"), reindexBtn.getAttribute("data-doc-title") || "");
            return;
          }
          var reparseGraphBtn = event.target.closest("[data-action='reparse-graph']");
          if (reparseGraphBtn) {
            confirmReparseGraph(reparseGraphBtn.getAttribute("data-doc-id"), reparseGraphBtn.getAttribute("data-doc-title") || "");
            return;
          }
          var extractBtn = event.target.closest("[data-action='extract-knowledge']");
          if (extractBtn) {
            confirmExtractKnowledge(extractBtn.getAttribute("data-doc-id"), extractBtn.getAttribute("data-doc-title") || "");
            return;
          }
          var delBtn = event.target.closest("[data-action='delete-doc']");
          if (delBtn) {
            var docId = delBtn.getAttribute("data-doc-id");
            confirmDeleteDocuments([docId], { label: "Удалить" });
            return;
          }
        });

        document.addEventListener("click", function (event) {
          var renameTagBtn = event.target.closest("[data-action='global-tag-rename']");
          if (renameTagBtn) {
            openGlobalTagRename(renameTagBtn.getAttribute("data-tag-name"));
            return;
          }
          var deleteTagBtn = event.target.closest("[data-action='global-tag-delete']");
          if (deleteTagBtn) {
            confirmGlobalTagDelete(
              deleteTagBtn.getAttribute("data-tag-name"),
              Number(deleteTagBtn.getAttribute("data-tag-count") || 0)
            );
            return;
          }
        });

        document.addEventListener("input", function (event) {
          if (event.target && event.target.id === "kbTagsSearch") {
            state.globalTagsSearch = event.target.value || "";
            renderGlobalTags();
          }
        });

        document.addEventListener("click", function (event) {
          var sortHead = event.target.closest("[data-tag-sort]");
          if (!sortHead) return;
          var by = sortHead.getAttribute("data-tag-sort");
          if (state.globalTagsSort.by === by) {
            state.globalTagsSort.dir = state.globalTagsSort.dir === "asc" ? "desc" : "asc";
          } else {
            state.globalTagsSort.by = by;
            state.globalTagsSort.dir = by === "count" ? "desc" : "asc";
          }
          renderGlobalTags();
        });

        dom.modalBackdrop.addEventListener("click", function (e) {
          if (e.target === dom.modalBackdrop) closeModal();
        });
        document.addEventListener("keydown", function (e) {
          if (e.key === "Escape") closeModal();
        });
        document.addEventListener("visibilitychange", function () {
          if (document.hidden && state.jobsTimer) {
            clearInterval(state.jobsTimer);
            state.jobsTimer = null;
          } else if (!document.hidden) {
            loadJobs();
          }
        });
      }

      function setActiveTab(name) {
        var validTabs = ["upload", "jobs", "documents", "tags"];
        if (validTabs.indexOf(name) === -1) name = "upload";
        document.querySelectorAll("[data-kb-tab]").forEach(function (btn) {
          btn.classList.toggle("is-active", btn.getAttribute("data-kb-tab") === name);
        });
        document.querySelectorAll("[data-kb-panel]").forEach(function (panel) {
          panel.classList.toggle("is-active", panel.getAttribute("data-kb-panel") === name);
        });
        try { localStorage.setItem("localrag.knowledge.activeTab", name); } catch (err) {}
        if (name === "tags") loadGlobalTags();
      }

      function bindKnowledgeTabs() {
        var tabs = document.getElementById("kbTabs");
        if (!tabs) return;
        tabs.addEventListener("click", function (event) {
          var btn = event.target.closest("[data-kb-tab]");
          if (!btn) return;
          setActiveTab(btn.getAttribute("data-kb-tab"));
        });
      }

      function bootstrap() {
        renderJobs();
        bindEvents();
        bindKnowledgeTabs();
        var stored = "upload";
        try { stored = localStorage.getItem("localrag.knowledge.activeTab") || "upload"; } catch (err) {}
        setActiveTab(stored);
        loadTags();
        loadNodes().then(loadDocuments).then(loadJobs);
      }

      bootstrap();
    })();
  `;
}

export function renderKnowledgePage({ ICONS, renderLayout }) {
  const headerExtra = `
    <div class="kb-summary" id="kbSummary"><span>База знаний загружается…</span></div>
  `;

  const headerTabs = `
    <nav class="kb-tabs" id="kbTabs" role="tablist" aria-label="Разделы базы знаний">
      <button type="button" class="header-tab is-active" data-kb-tab="upload" role="tab">${ICONS.upload}<span>Загрузка</span></button>
      <button type="button" class="header-tab" data-kb-tab="jobs" role="tab">${ICONS.refresh}<span>Задачи импорта</span></button>
      <button type="button" class="header-tab" data-kb-tab="documents" role="tab">${ICONS.fileText}<span>Документы</span></button>
      <button type="button" class="header-tab" data-kb-tab="tags" role="tab">${ICONS.tag}<span>Теги</span></button>
    </nav>
  `;

  const contextSidebar = `
    <div class="sidebar-context__title">Разделы</div>
    <button type="button" class="btn btn--accent" id="kbTreeNewBtn">${ICONS.plus}<span>Раздел</span></button>
    <div class="kb-tree__body" id="kbTree" style="flex:1;min-height:0;overflow-y:auto;">
      <div class="filters-empty">Дерево загружается…</div>
    </div>
    <div class="sidebar-context__footer">
      <a href="/ui/nodes" target="_blank" rel="noopener">Расширенный редактор →</a>
    </div>
  `;

  const content = `
    <main class="kb-page" id="kbPage">
      <section class="kb-main">
        <div class="kb-tab-panel is-active" data-kb-panel="upload">
        <div class="kb-card" id="kbUploadCard">
          <div class="kb-card__head">
            <div class="kb-card__title">${ICONS.upload}<span>Загрузка</span></div>
          </div>
          <div class="kb-card__body">
            <div class="kb-dropzone" id="kbDropzone">
              <h3>Перетащите файлы или папку</h3>
              <p>PDF, DOCX, XLSX, TXT, MD, CSV — или укажите путь к локальной папке на сервере ниже.</p>
              <div class="kb-dropzone__buttons">
                <label class="btn">${ICONS.fileText}<span>Выбрать файлы</span>
                  <input type="file" id="kbFileInput" multiple />
                </label>
                <label class="btn">${ICONS.folder}<span>Выбрать папку</span>
                  <input type="file" id="kbFolderInput" webkitdirectory directory multiple />
                </label>
              </div>
              <p class="kb-dropzone__hint">Очень большие папки загружайте через серверный путь — это быстрее и не упирается в лимит multipart.</p>
            </div>

            <div class="kb-upload-fields">
              <div>
                <label for="kbServerPath">Путь к локальной папке на сервере (внутри data/raw)</label>
                <input class="kb-input" type="text" id="kbServerPath" placeholder="Например: КС новая/Документация metsoDNA CR" />
              </div>
              <div>
                <label for="kbNodeSelect">Целевой раздел</label>
                <select class="kb-select" id="kbNodeSelect"></select>
              </div>
              <div>
                <button type="button" class="btn btn--accent" id="kbServerImportBtn">${ICONS.upload}<span>Импортировать</span></button>
              </div>
            </div>
          </div>
        </div>
        </div>

        <div class="kb-tab-panel" data-kb-panel="jobs">
        <div class="kb-card is-collapsed" id="kbJobsCard">
          <div class="kb-card__head">
            <div class="kb-card__title">${ICONS.refresh}<span>Задачи импорта</span></div>
            <div style="display:flex;gap:6px;align-items:center;">
              <button type="button" class="btn btn--ghost btn--icon" id="kbJobsRefresh" aria-label="Обновить">${ICONS.refresh}</button>
              <button type="button" class="btn btn--ghost" id="kbJobsToggle">Свернуть/развернуть</button>
            </div>
          </div>
          <div class="kb-card__collapsed-row" id="kbJobsCollapsed"><span>Активных задач нет</span><span></span></div>
          <div class="kb-card__body">
            <div class="kb-jobs-list" id="kbJobsList"></div>
          </div>
        </div>
        </div>

        <div class="kb-tab-panel" data-kb-panel="documents">
        <div class="kb-card">
          <div class="kb-card__head">
            <div class="kb-card__title">${ICONS.fileText}<span>Документы</span></div>
            <button type="button" class="btn btn--accent" id="kbAddDocBtn">${ICONS.plus}<span>Добавить документ</span></button>
          </div>
          <div class="kb-card__body">
            <div class="kb-doc-toolbar">
              <div class="document-search">
                <span class="document-search__icon">${ICONS.search}</span>
                <input class="document-search__input" type="search" id="kbDocSearch" placeholder="Поиск по названию документа" />
              </div>
              <button type="button" class="btn" id="kbDocToggleScope">Включая вложенные</button>
              <div class="kb-doc-toolbar__bulk" id="kbDocBulk">
                <span><span class="mono" id="kbDocBulkCount">0</span> выбрано</span>
                <button type="button" class="btn" id="kbDocBulkMove">Переместить</button>
                <button type="button" class="btn btn--danger" id="kbDocBulkDelete">Удалить выбранные</button>
              </div>
            </div>
            <div style="overflow-x:auto;">
              <table class="kb-doc-table">
                <thead>
                  <tr>
                    <th style="width:32px"><input type="checkbox" id="kbDocSelectAll" style="accent-color:var(--accent)" /></th>
                    <th>Имя</th>
                    <th style="width:80px">Страниц</th>
                    <th style="width:80px">Чанки</th>
                    <th style="width:160px">Раздел</th>
                    <th style="width:220px">Теги</th>
                    <th style="width:110px">Загружен</th>
                    <th style="width:140px;text-align:right">Действия</th>
                  </tr>
                </thead>
                <tbody id="kbDocBody">
                  <tr><td colspan="8"><div class="kb-doc-empty">Документы загружаются…</div></td></tr>
                </tbody>
              </table>
            </div>
            <div class="kb-show-more" id="kbDocShowMore" style="display:none">
              <button type="button" class="btn">Показать ещё 50</button>
            </div>
          </div>
        </div>
        </div>

        <div class="kb-tab-panel" data-kb-panel="tags">
          <div class="kb-card">
            <div class="kb-card__head">
              <div class="kb-card__title">${ICONS.tag}<span>Глобальное управление тегами</span></div>
              <span class="settings-hint">Тут можно переименовать или удалить теги во всех документах сразу</span>
            </div>
            <div class="kb-card__body">
              <p class="kb-tags-intro">
                Добавлять новые теги — только через редактор тегов конкретного
                документа. Здесь можно массово переименовывать (объединять при
                совпадении) и удалять устаревшие теги во всех документах сразу.
              </p>
              <div class="kb-doc-toolbar">
                <div class="document-search">
                  <span class="document-search__icon">${ICONS.search}</span>
                  <input class="document-search__input" type="search" id="kbTagsSearch" placeholder="Поиск тега" />
                </div>
                <span class="settings-hint" id="kbTagsCount"></span>
              </div>
              <div style="overflow-x:auto;">
                <table class="kb-doc-table kb-tags-table">
                  <thead>
                    <tr>
                      <th data-tag-sort="name">Тег</th>
                      <th data-tag-sort="count" style="width:140px">Документов</th>
                      <th style="width:220px;text-align:right">Действия</th>
                    </tr>
                  </thead>
                  <tbody id="kbTagsBody">
                    <tr><td colspan="3"><div class="kb-doc-empty">Список тегов загружается…</div></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="kb-modal-backdrop" id="kbModalBackdrop">
        <div class="kb-modal" role="dialog" aria-modal="true">
          <div class="kb-modal__head">
            <div class="kb-modal__title" id="kbModalTitle">Окно</div>
            <button type="button" class="btn btn--ghost btn--icon" data-action="close-modal" aria-label="Закрыть" onclick="document.getElementById('kbModalBackdrop').classList.remove('is-open')">${ICONS.x}</button>
          </div>
          <div class="kb-modal__body" id="kbModalBody"></div>
          <div class="kb-modal__foot" id="kbModalFoot"></div>
        </div>
      </div>
    </main>
  `;

  const initialState = {
    icons: {
      chevronRight: ICONS.chevronRight,
      chevronDown: ICONS.chevronDown,
      moreHorizontal: ICONS.moreHorizontal,
      externalLink: ICONS.externalLink,
      folder: ICONS.folder,
      tag: ICONS.tag,
      trash: ICONS.trash,
      edit: ICONS.edit,
      refresh: ICONS.refresh,
      graph:
        '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
      extract:
        '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/><path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z"/></svg>',
    },
  };

  const initialStateJson = JSON.stringify(initialState).replace(/</g, "\\u003c");

  return renderLayout({
    activeNav: "knowledge",
    pageTitle: "База знаний",
    pageDocumentTitle: "База знаний — LOCAL-RAG",
    content,
    headerExtra,
    headerTabs,
    contextSidebar,
    pageScript: renderKnowledgeScript(initialStateJson),
    bodyClass: "page-knowledge",
  }).replace("</style>", `${renderKnowledgeCss()}</style>`);
}
