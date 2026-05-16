function renderKnowledgeCss() {
  return `
    .kb-page {
      flex: 1;
      display: grid;
      grid-template-columns: 280px 1fr;
      min-height: 0;
    }
    .kb-tree {
      background: var(--surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    .kb-tree__head {
      padding: 14px 16px 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border);
    }
    .kb-tree__head .filters-section__title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
    }
    .kb-tree__body {
      flex: 1;
      overflow-y: auto;
      padding: 8px 8px 4px;
    }
    .kb-tree__footer {
      padding: 10px 16px;
      border-top: 1px solid var(--border);
    }
    .kb-tree__footer a {
      color: var(--text-muted);
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .kb-tree__footer a:hover { color: var(--accent); }

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
    .kb-doc-table .doc-pages, .kb-doc-table .doc-chunks {
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
    .kb-doc-action.is-armed {
      color: var(--danger);
      border-color: var(--danger);
      background: var(--accent-soft);
    }
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
      .kb-page { grid-template-columns: 240px 1fr; }
      .kb-upload-fields { grid-template-columns: 1fr; }
    }
    @media (max-width: 760px) {
      .kb-page { grid-template-columns: 1fr; }
      .kb-tree { display: none; }
    }
  `;
}

function renderKnowledgeScript(initialStateJson) {
  return `
    (function () {
      var INITIAL_STATE = ${initialStateJson};
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
        jobsCollapsed: true,
        jobsTimer: null,
        existingTags: [],
        unsortedNodeId: null,
        deleteArmed: {},
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
        lightModeChk: document.getElementById("kbLightMode"),
        recursiveChk: document.getElementById("kbRecursive"),
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
        el.textContent = message;
        document.body.appendChild(el);
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 4200);
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
          dom.docTableBody.innerHTML = '<tr><td colspan="7"><div class="kb-doc-empty">В этом разделе документов нет. Перетащите файлы сюда или укажите путь к папке выше.</div></td></tr>';
          updateSummary();
          renderBulkBar();
          return;
        }
        var html = docs.map(function (doc) {
          var checked = state.selectedDocIds.has(doc.id) ? "checked" : "";
          var armed = state.deleteArmed[doc.id] ? " is-armed" : "";
          var primaryNode = (doc.node_links || []).find(function (l) { return l.is_primary; }) || (doc.node_links || [])[0] || null;
          var primaryNodeName = primaryNode && byNode[primaryNode.node_id] ? byNode[primaryNode.node_id].name : "Без раздела";
          var tags = Array.isArray(doc.categories) ? doc.categories : [];
          var tagsHtml = tags.length
            ? tags.slice(0, 6).map(function (t) { return '<span class="doc-tag">' + escapeHtml(t) + '</span>'; }).join("") + (tags.length > 6 ? '<span class="doc-tag">+' + (tags.length - 6) + '</span>' : '')
            : '<span class="kb-summary__divider">—</span>';
          return '<tr data-doc-id="' + escapeHtml(doc.id) + '">' +
            '<td><input type="checkbox" data-action="select-doc" data-doc-id="' + escapeHtml(doc.id) + '" ' + checked + ' style="accent-color:var(--accent)" /></td>' +
            '<td><div class="doc-title" title="' + escapeHtml(doc.title || "") + '">' + escapeHtml(doc.title || doc.original_file_name || "(без названия)") + '</div>' +
            (doc.original_file_path ? '<span class="doc-path">' + escapeHtml(doc.original_file_path) + '</span>' : '') + '</td>' +
            '<td class="doc-pages">' + escapeHtml(doc.page_count || 0) + '</td>' +
            '<td class="doc-node">' + escapeHtml(primaryNodeName) + '</td>' +
            '<td><div class="doc-tags">' + tagsHtml + '</div></td>' +
            '<td class="doc-chunks">' + escapeHtml(fmtDate(doc.created_at)) + '</td>' +
            '<td><div class="doc-actions">' +
            '<button type="button" class="kb-doc-action" data-action="open-doc" data-doc-id="' + escapeHtml(doc.id) + '" title="Открыть исходник">' + INITIAL_STATE.icons.externalLink + '</button>' +
            '<button type="button" class="kb-doc-action" data-action="move-doc" data-doc-id="' + escapeHtml(doc.id) + '" title="Переместить в раздел">' + INITIAL_STATE.icons.folder + '</button>' +
            '<button type="button" class="kb-doc-action" data-action="edit-tags" data-doc-id="' + escapeHtml(doc.id) + '" title="Редактировать теги">' + INITIAL_STATE.icons.tag + '</button>' +
            '<button type="button" class="kb-doc-action is-danger' + armed + '" data-action="delete-doc" data-doc-id="' + escapeHtml(doc.id) + '" title="' + (armed ? "Точно удалить?" : "Удалить") + '">' + INITIAL_STATE.icons.trash + '</button>' +
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

      function renderJobs() {
        var jobs = state.jobs;
        var active = jobs.filter(function (j) {
          return j.status === "running" || j.status === "queued" || j.status === "cancel_requested";
        });
        if (state.jobsCollapsed) {
          dom.jobsCard.classList.add("is-collapsed");
          if (!jobs.length) {
            dom.jobsCollapsedRow.innerHTML = '<span>Активных задач нет</span><span></span>';
          } else {
            dom.jobsCollapsedRow.innerHTML =
              '<span><span class="mono">' + active.length + '</span> активных · <span class="mono">' + (jobs.length - active.length) + '</span> завершено</span>' +
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
        if (!jobs.length) {
          dom.jobsList.innerHTML = '<div class="kb-doc-empty">Активных задач нет.</div>';
          return;
        }
        var html = jobs.slice(0, 20).map(function (job) {
          var status = job.status || "unknown";
          var pct = 0;
          if (job.total_items && job.processed_items) {
            pct = Math.min(100, Math.round((Number(job.processed_items) / Math.max(1, Number(job.total_items))) * 100));
          } else if (status === "completed") {
            pct = 100;
          }
          var statusClass = "kb-job__status--" + status;
          var statusLabel = {
            queued: "ожидает",
            running: "идёт",
            cancel_requested: "останавливается",
            completed: "готово",
            failed: "ошибка",
            cancelled: "остановлено",
          }[status] || status;
          var title = job.original_file_path || job.job_type || job.id;
          var canCancel = ["queued", "running", "cancel_requested"].indexOf(status) >= 0;
          var meta = [];
          if (job.job_type) meta.push('<span>' + escapeHtml(job.job_type) + '</span>');
          if (job.total_items) meta.push('<span class="mono">' + (job.processed_items || 0) + ' / ' + job.total_items + '</span>');
          if (job.progress_message) meta.push('<span>' + escapeHtml(job.progress_message) + '</span>');
          if (job.created_at) meta.push('<span>' + escapeHtml(fmtDate(job.created_at)) + '</span>');
          return '<div class="kb-job" data-job-id="' + escapeHtml(job.id) + '">' +
            '<div class="kb-job__head">' +
            '<div class="kb-job__title" title="' + escapeHtml(title) + '">' + escapeHtml(title) + '</div>' +
            '<span class="kb-job__status ' + statusClass + '">' + statusLabel + '</span>' +
            (canCancel ? '<button type="button" class="btn btn--ghost" data-action="cancel-job" data-job-id="' + escapeHtml(job.id) + '">Отменить</button>' : '') +
            '</div>' +
            (status === "running" || status === "queued" ? '<div class="kb-job__progress"><div style="width:' + pct + '%"></div></div>' : '') +
            '<div class="kb-job__meta">' + meta.join("") + '</div>' +
            '</div>';
        }).join("");
        dom.jobsList.innerHTML = html;
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

      function loadJobs() {
        return api("GET", "/jobs?limit=20").then(function (data) {
          state.jobs = data.items || [];
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
          renderTree();
          renderNodeSelect();
        }).catch(function (err) {
          dom.tree.innerHTML = '<div class="kb-doc-error">Не удалось загрузить дерево: ' + escapeHtml(err.message) + '</div>';
        });
      }

      function loadDocuments(opts) {
        opts = opts || {};
        var append = opts.append === true;
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
        }).catch(function (err) {
          dom.docTableBody.innerHTML = '<tr><td colspan="7"><div class="kb-doc-error">Не удалось загрузить документы: ' + escapeHtml(err.message) + '</div></td></tr>';
        });
      }

      function loadTags() {
        return api("GET", "/tags?limit=100").then(function (data) {
          state.existingTags = (data.items || []).map(function (t) { return typeof t === "string" ? t : t.tag; }).filter(Boolean);
        }).catch(function () {
          state.existingTags = [];
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
            return loadNodes().then(function () {
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
            return loadNodes();
          }).catch(function (err) { showToast("Не удалось переименовать: " + err.message, "error"); });
        });
        var cancelBtn = makeButton("Отмена", "btn--ghost", closeModal);
        openModal("Переименовать раздел", wrap, [cancelBtn, saveBtn]);
        setTimeout(function () { input.focus(); input.select(); }, 0);
        input.addEventListener("keydown", function (e) { if (e.key === "Enter") saveBtn.click(); });
      }

      function confirmDeleteNode(nodeId) {
        var node = getNodeById(nodeId);
        if (!node) return;
        var hasChildren = getDescendantIds(nodeId).size > 0;
        if (hasChildren) {
          showToast("Сначала удалите вложенные разделы через расширенный редактор", "error");
          return;
        }
        var counts = state.nodeCounts[nodeId] || {};
        var docCount = Number(counts.scopeDocuments || 0);
        var wrap = document.createElement("div");
        wrap.className = "kb-prompt";
        wrap.innerHTML = '<p>Удалить раздел «<strong>' + escapeHtml(node.name) + '</strong>»?</p>' +
          (docCount > 0
            ? '<p style="font-size:12px;color:var(--text-muted)">В разделе ' + docCount + ' документ(ов). Они будут перемещены в <strong>' + (node.parentId ? "родительский раздел" : "«Без раздела»") + '</strong>. Сами документы и их векторы не удаляются.</p>'
            : '<p style="font-size:12px;color:var(--text-muted)">Документов в разделе нет. Раздел будет удалён сразу.</p>');
        var deleteBtn = makeButton(docCount > 0 ? "Удалить и переместить документы" : "Удалить", "btn--danger", function () {
          var strategy = docCount > 0
            ? (node.parentId ? "move_to_parent" : "move_to_unsorted")
            : "block";
          api("DELETE", "/nodes/" + nodeId + "?strategy=" + strategy).then(function () {
            closeModal();
            if (state.activeNodeId === nodeId) state.activeNodeId = null;
            return loadNodes().then(function () { return loadDocuments(); });
          }).catch(function (err) { showToast("Не удалось удалить: " + err.message, "error"); });
        });
        var cancelBtn = makeButton("Отмена", "btn--ghost", closeModal);
        openModal("Удалить раздел", wrap, [cancelBtn, deleteBtn]);
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
        function addTag(raw) {
          var v = String(raw || "").trim().replace(/^#+/, "");
          if (!v) return;
          if (currentTags.indexOf(v) !== -1) { input.value = ""; return; }
          currentTags.push(v);
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
            return loadDocuments();
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
            return loadDocuments();
          }).catch(function (err) {
            Promise.all(docIds.map(function (id) {
              return api("PATCH", "/documents/" + id + "/nodes", payload);
            })).then(function () {
              closeModal();
              state.selectedDocIds = new Set();
              return loadDocuments();
            }).catch(function (err2) { showToast("Ошибка массового перемещения: " + err2.message, "error"); });
          });
        });
        var cancelBtn = makeButton("Отмена", "btn--ghost", closeModal);
        openModal("Переместить выбранные", wrap, [cancelBtn, saveBtn]);
      }

      function confirmBulkDelete() {
        if (state.selectedDocIds.size === 0) return;
        var ids = Array.from(state.selectedDocIds);
        var wrap = document.createElement("div");
        wrap.className = "kb-prompt";
        wrap.innerHTML = '<p>Удалить выбранные документы (' + ids.length + ')?</p>' +
          '<p style="font-size:12px;color:var(--text-muted)">Будут удалены векторы из Qdrant и записи из PostgreSQL. Файлы в data/raw не трогаются.</p>';
        var deleteBtn = makeButton("Удалить " + ids.length + " док.", "btn--danger", function () {
          Promise.all(ids.map(function (id) { return api("DELETE", "/documents/" + id).catch(function (err) { return { ok: false, error: err.message, id: id }; }); }))
            .then(function (results) {
              var failed = results.filter(function (r) { return r && r.ok === false; });
              closeModal();
              state.selectedDocIds = new Set();
              if (failed.length) showToast("Удалено: " + (ids.length - failed.length) + ", ошибок: " + failed.length, "error");
              else showToast("Удалено: " + ids.length);
              return loadDocuments();
            });
        });
        var cancelBtn = makeButton("Отмена", "btn--ghost", closeModal);
        openModal("Удаление документов", wrap, [cancelBtn, deleteBtn]);
      }

      function uploadFileViaMultipart(file, relativePath) {
        var fd = new FormData();
        fd.append("file", file, file.name);
        fd.append("title", file.name);
        if (relativePath) fd.append("title", relativePath);
        fd.append("categories", JSON.stringify([]));
        var nodeId = dom.nodeSelect.value || state.activeNodeId || "";
        if (nodeId) {
          fd.append("nodeIds", JSON.stringify([nodeId]));
          fd.append("primaryNodeId", nodeId);
        }
        return new Promise(function (resolve, reject) {
          var xhr = new XMLHttpRequest();
          xhr.open("POST", "/documents/upload");
          xhr.onload = function () {
            try {
              var data = JSON.parse(xhr.responseText || "{}");
              if (xhr.status >= 200 && xhr.status < 300 && data.ok !== false) resolve(data);
              else reject(new Error(data.error || ("HTTP " + xhr.status)));
            } catch (e) { reject(e); }
          };
          xhr.onerror = function () { reject(new Error("Сетевая ошибка")); };
          xhr.send(fd);
        });
      }

      function handleFiles(fileList) {
        var files = Array.from(fileList || []);
        if (!files.length) return;
        showToast("Загрузка " + files.length + " файла(ов)…");
        state.jobsCollapsed = false;
        renderJobs();
        var results = [];
        var processed = 0;
        files.forEach(function (file) {
          var rel = file.webkitRelativePath || file.relativePath || file.name;
          uploadFileViaMultipart(file, rel).then(function (data) {
            results.push({ ok: true, file: file.name, data: data });
          }).catch(function (err) {
            results.push({ ok: false, file: file.name, error: err.message });
          }).then(function () {
            processed++;
            if (processed === files.length) {
              var ok = results.filter(function (r) { return r.ok; }).length;
              var fail = results.length - ok;
              if (fail) showToast("Загружено: " + ok + ", ошибок: " + fail, fail ? "error" : undefined);
              else showToast("Все файлы загружены: " + ok);
              loadDocuments();
              loadJobs();
              loadNodes();
            }
          });
        });
      }

      function importServerPath() {
        var rawPath = (dom.serverPath.value || "").trim();
        if (!rawPath) { showToast("Введите путь к папке на сервере", "error"); return; }
        var body = {
          relativeDir: rawPath,
          recursive: dom.recursiveChk.checked,
          createVisualAssets: !dom.lightModeChk.checked,
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

        dom.jobsToggleBtn.addEventListener("click", function () {
          state.jobsCollapsed = !state.jobsCollapsed;
          renderJobs();
        });
        dom.jobsRefreshBtn.addEventListener("click", loadJobs);
        dom.jobsCard.addEventListener("click", function (e) {
          var cancelBtn = e.target.closest("[data-action='cancel-job']");
          if (cancelBtn) {
            var jid = cancelBtn.getAttribute("data-job-id");
            api("POST", "/jobs/" + jid + "/cancel", {}).then(function () { loadJobs(); }).catch(function (err) { showToast("Не удалось отменить: " + err.message, "error"); });
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
          var openBtn = event.target.closest("[data-action='open-doc']");
          if (openBtn) {
            window.open("/documents/" + openBtn.getAttribute("data-doc-id") + "/original", "_blank", "noopener");
            return;
          }
          var moveBtn = event.target.closest("[data-action='move-doc']");
          if (moveBtn) { openMoveModal(moveBtn.getAttribute("data-doc-id")); return; }
          var tagsBtn = event.target.closest("[data-action='edit-tags']");
          if (tagsBtn) { openTagsModal(tagsBtn.getAttribute("data-doc-id")); return; }
          var delBtn = event.target.closest("[data-action='delete-doc']");
          if (delBtn) {
            var docId = delBtn.getAttribute("data-doc-id");
            if (state.deleteArmed[docId]) {
              clearTimeout(state.deleteArmed[docId]);
              delete state.deleteArmed[docId];
              api("DELETE", "/documents/" + docId).then(function () {
                state.documents = state.documents.filter(function (d) { return d.id !== docId; });
                renderDocuments();
                showToast("Документ удалён");
                loadNodes();
              }).catch(function (err) { showToast("Не удалось удалить: " + err.message, "error"); });
            } else {
              state.deleteArmed[docId] = setTimeout(function () { delete state.deleteArmed[docId]; renderDocuments(); }, 3000);
              renderDocuments();
              showToast("Нажмите ещё раз в течение 3 секунд для удаления");
            }
            return;
          }
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

      function bootstrap() {
        renderJobs();
        bindEvents();
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

  const content = `
    <main class="kb-page" id="kbPage">
      <aside class="kb-tree" aria-label="Дерево разделов">
        <div class="kb-tree__head">
          <div class="filters-section__title">Разделы</div>
          <button type="button" class="btn btn--accent" id="kbTreeNewBtn">${ICONS.plus}<span>Раздел</span></button>
        </div>
        <div class="kb-tree__body" id="kbTree">
          <div class="filters-empty">Дерево загружается…</div>
        </div>
        <div class="kb-tree__footer">
          <a href="/ui/nodes">Расширенный редактор дерева →</a>
        </div>
      </aside>

      <section class="kb-main">
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

            <div class="kb-upload-options">
              <label><input type="checkbox" id="kbLightMode" checked /> Лёгкий режим (без превью страниц)</label>
              <label><input type="checkbox" id="kbRecursive" checked /> Включая вложенные папки</label>
            </div>
          </div>
        </div>

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
                    <th style="width:160px">Раздел</th>
                    <th style="width:220px">Теги</th>
                    <th style="width:110px">Загружен</th>
                    <th style="width:140px;text-align:right">Действия</th>
                  </tr>
                </thead>
                <tbody id="kbDocBody">
                  <tr><td colspan="7"><div class="kb-doc-empty">Документы загружаются…</div></td></tr>
                </tbody>
              </table>
            </div>
            <div class="kb-show-more" id="kbDocShowMore" style="display:none">
              <button type="button" class="btn">Показать ещё 50</button>
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
    },
  };

  const initialStateJson = JSON.stringify(initialState).replace(/</g, "\\u003c");

  return renderLayout({
    activeNav: "knowledge",
    pageTitle: "База знаний",
    pageDocumentTitle: "База знаний — LOCAL-RAG",
    content,
    headerExtra,
    pageScript: renderKnowledgeScript(initialStateJson),
    bodyClass: "page-knowledge",
  }).replace("</style>", `${renderKnowledgeCss()}</style>`);
}
