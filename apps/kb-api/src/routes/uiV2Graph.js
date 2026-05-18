// Страница "Граф знаний" /ui/v2/graph.
// Двухпанельный layout: слева дерево групп/узлов, справа карточка.
// Поиск, CRUD, vis-network для визуализации соседей.

function renderGraphPageCss() {
  return `
    .graph-page {
      display: grid;
      grid-template-columns: minmax(320px, 40%) 1fr;
      gap: 12px;
      padding: 12px 18px 18px 18px;
      height: calc(100vh - 64px);
      min-height: 0;
    }
    .graph-stats {
      display: flex;
      gap: 12px;
      align-items: center;
      color: var(--text-muted);
      font-size: 13px;
    }
    .graph-stats__chip {
      background: var(--surface-2);
      border: 1px solid var(--border);
      padding: 2px 10px;
      border-radius: 12px;
    }
    .graph-search-form {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .graph-search-input {
      flex: 1;
      min-width: 220px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 6px 10px;
      border-radius: 8px;
      font-size: 13px;
    }
    .graph-search-input:focus { outline: 2px solid var(--accent); }

    .graph-pane {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }
    .graph-pane__header {
      padding: 10px 12px;
      border-bottom: 1px solid var(--border);
      font-weight: 600;
      font-size: 13px;
      color: var(--text-strong);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .graph-pane__body {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 4px 0;
    }
    .graph-pane__footer {
      border-top: 1px solid var(--border);
      padding: 8px 12px;
      display: flex;
      gap: 8px;
    }

    /* Дерево */
    .tree-node {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px 4px 4px;
      font-size: 13px;
      cursor: pointer;
      border-radius: 6px;
      margin: 1px 6px;
      user-select: none;
      color: var(--text);
    }
    .tree-node:hover { background: var(--surface-hover); }
    .tree-node--active { background: var(--accent-soft); color: var(--text-strong); }
    .tree-node--group { font-weight: 600; }
    .tree-toggle {
      width: 16px;
      height: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: var(--text-muted);
      font-size: 10px;
    }
    .tree-toggle--placeholder { visibility: hidden; }
    .tree-icon {
      width: 18px;
      text-align: center;
      flex-shrink: 0;
      color: var(--text-muted);
    }
    .tree-label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .tree-count {
      color: var(--text-muted);
      font-size: 11px;
      flex-shrink: 0;
    }
    .tree-children {
      margin-left: 18px;
      border-left: 1px dashed var(--border);
    }
    .tree-loading, .tree-empty {
      padding: 6px 12px 6px 28px;
      font-size: 12px;
      color: var(--text-muted);
      font-style: italic;
    }
    .tree-show-more {
      padding: 4px 12px 4px 28px;
      font-size: 12px;
      color: var(--accent);
      cursor: pointer;
    }
    .tree-show-more:hover { text-decoration: underline; }

    /* Поиск */
    .search-results {
      padding: 4px;
    }
    .search-result-item {
      padding: 8px 10px;
      cursor: pointer;
      border-radius: 6px;
      margin: 2px 0;
      font-size: 13px;
    }
    .search-result-item:hover { background: var(--surface-hover); }
    .search-result-item__head {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .search-result-item__name {
      flex: 1;
      color: var(--text-strong);
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .search-result-item__type {
      color: var(--text-muted);
      font-size: 11px;
    }
    .search-result-item__match {
      color: var(--text-muted);
      font-size: 11px;
      margin-top: 2px;
      padding-left: 24px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .search-result-item__match mark {
      background: var(--accent-soft);
      color: var(--text-strong);
      padding: 0 2px;
      border-radius: 3px;
    }

    /* Карточка узла */
    .card-welcome {
      padding: 32px;
      text-align: center;
      color: var(--text-muted);
      font-size: 14px;
    }
    .card-welcome h2 {
      color: var(--text-strong);
      font-size: 18px;
      margin: 0 0 8px 0;
    }
    .card {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
    }
    .card-head {
      padding: 14px 18px;
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }
    .card-head__title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      color: var(--text-strong);
      margin: 0 0 4px 0;
    }
    .card-head__meta {
      color: var(--text-muted);
      font-size: 11px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 4px;
    }
    .card-head__actions {
      margin-top: 10px;
      display: flex;
      gap: 8px;
    }
    .card-tabs {
      display: flex;
      gap: 0;
      border-bottom: 1px solid var(--border);
      padding: 0 12px;
      flex-shrink: 0;
    }
    .card-tab {
      padding: 8px 14px;
      cursor: pointer;
      font-size: 13px;
      color: var(--text-muted);
      border-bottom: 2px solid transparent;
      background: none;
      border-top: none;
      border-left: none;
      border-right: none;
    }
    .card-tab:hover { color: var(--text); }
    .card-tab--active { color: var(--accent); border-bottom-color: var(--accent); }
    .card-body {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 12px 18px;
    }

    .attrs-pre {
      font-family: var(--font-mono, "JetBrains Mono", monospace);
      font-size: 12px;
      background: var(--surface-2);
      padding: 12px;
      border-radius: 8px;
      overflow-x: auto;
      color: var(--text);
      margin: 0;
    }
    .attrs-pre .json-key { color: #93c5fd; }
    .attrs-pre .json-string { color: #fbbf24; }
    .attrs-pre .json-number { color: #34d399; }
    .attrs-pre .json-boolean { color: #f87171; }
    .attrs-pre .json-null { color: var(--text-muted); }

    .edges-section h4 {
      font-size: 12px;
      color: var(--text-muted);
      text-transform: uppercase;
      margin: 12px 0 6px 0;
      font-weight: 600;
      letter-spacing: 0.05em;
    }
    .edge-row {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 8px;
      border-radius: 6px;
      font-size: 13px;
      color: var(--text);
    }
    .edge-row:hover { background: var(--surface-hover); }
    .edge-row__chip {
      background: var(--surface-2);
      padding: 1px 6px;
      border-radius: 4px;
      color: var(--text-muted);
      font-size: 11px;
      font-family: var(--font-mono, monospace);
    }
    .edge-row__link {
      color: var(--accent);
      cursor: pointer;
      font-weight: 500;
    }
    .edge-row__link:hover { text-decoration: underline; }
    .edge-row__icon { width: 18px; text-align: center; color: var(--text-muted); }
    .edge-row__actions { margin-left: auto; opacity: 0; transition: opacity 0.15s; }
    .edge-row:hover .edge-row__actions { opacity: 1; }
    .edge-row__btn-del {
      background: none;
      border: none;
      color: var(--danger);
      cursor: pointer;
      font-size: 14px;
      padding: 2px 6px;
    }

    .source-block {
      background: var(--surface-2);
      padding: 12px;
      border-radius: 8px;
      font-size: 13px;
      color: var(--text);
      line-height: 1.6;
    }
    .source-block strong { color: var(--text-strong); }
    .source-link {
      color: var(--accent);
      cursor: pointer;
      margin-left: 4px;
    }
    .source-link:hover { text-decoration: underline; }

    /* Граф-вокруг (vis-network) */
    .graph-vis {
      width: 100%;
      height: 100%;
      min-height: 400px;
      background: var(--surface-2);
      border-radius: 8px;
      position: relative;
    }
    .graph-vis-fallback {
      padding: 24px;
      text-align: center;
      color: var(--text-muted);
      font-size: 13px;
    }

    /* Модалки */
    .graph-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .graph-modal {
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: 12px;
      padding: 18px;
      width: 520px;
      max-width: calc(100vw - 32px);
      max-height: calc(100vh - 64px);
      overflow-y: auto;
      box-shadow: var(--shadow);
    }
    .graph-modal__title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-strong);
      margin: 0 0 12px 0;
    }
    .graph-modal__row { margin-bottom: 12px; }
    .graph-modal__label {
      display: block;
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 4px;
      font-weight: 500;
    }
    .graph-modal__input,
    .graph-modal__select,
    .graph-modal__textarea {
      width: 100%;
      background: var(--surface-2);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 13px;
      font-family: inherit;
    }
    .graph-modal__textarea {
      font-family: var(--font-mono, "JetBrains Mono", monospace);
      font-size: 12px;
      min-height: 100px;
      resize: vertical;
    }
    .graph-modal__hint {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 4px;
    }
    .graph-modal__error {
      background: rgba(239, 68, 68, 0.1);
      color: var(--danger);
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 12px;
      margin-top: 6px;
    }
    .graph-modal__actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 16px;
    }
    .graph-btn {
      background: var(--surface-2);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 6px 14px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-family: inherit;
    }
    .graph-btn:hover { background: var(--surface-hover); }
    .graph-btn--primary {
      background: var(--accent);
      border-color: var(--accent);
      color: #fff;
    }
    .graph-btn--primary:hover { background: var(--accent-hover); }
    .graph-btn--danger {
      background: var(--danger);
      border-color: var(--danger);
      color: #fff;
    }
    .graph-btn--danger:hover { filter: brightness(1.1); }
    .graph-btn--small {
      padding: 4px 10px;
      font-size: 12px;
    }
    .graph-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    /* Autocomplete */
    .ac-wrap { position: relative; }
    .ac-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: 6px;
      margin-top: 2px;
      max-height: 220px;
      overflow-y: auto;
      z-index: 10;
      box-shadow: var(--shadow);
    }
    .ac-item {
      padding: 6px 10px;
      font-size: 13px;
      cursor: pointer;
    }
    .ac-item:hover, .ac-item--active { background: var(--surface-hover); }

    /* Toast */
    .graph-toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--surface);
      border: 1px solid var(--border-strong);
      box-shadow: var(--shadow);
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      z-index: 1100;
      max-width: 360px;
    }
    .graph-toast--error {
      border-color: var(--danger);
      color: var(--danger);
    }
    .graph-toast--success {
      border-color: var(--success);
      color: var(--success);
    }
  `;
}

function renderGraphPageHtml() {
  return `
    <div class="graph-page" id="graphPage">
      <div class="graph-pane" id="leftPane">
        <div class="graph-pane__header">
          <span id="leftPaneTitle">Дерево узлов</span>
          <button class="graph-btn graph-btn--small" id="btnClearSearch" style="display:none;">× Очистить поиск</button>
        </div>
        <div class="graph-pane__body" id="treeContainer">
          <div class="tree-loading">Загрузка дерева…</div>
        </div>
        <div class="graph-pane__footer">
          <button class="graph-btn graph-btn--primary" id="btnCreateNode">+ Создать узел</button>
        </div>
      </div>
      <div class="graph-pane" id="rightPane">
        <div class="graph-pane__body" id="cardContainer">
          <div class="card-welcome">
            <h2>Граф знаний</h2>
            <p>Выберите узел в дереве слева, чтобы увидеть его карточку.<br/>
               Или воспользуйтесь поиском в шапке страницы.</p>
          </div>
        </div>
      </div>
    </div>
    <div id="modalRoot"></div>
    <div id="toastRoot"></div>
  `;
}

function renderGraphPageScript() {
  // ВСЁ внутри IIFE, отделено от глобальной области. Используем var/function
  // (а не const/let) только там где нужно для широкой совместимости.
  // В реальности браузер новый, можно использовать ES2020.
  return `
(function() {
  "use strict";

  var state = {
    selectedNodeId: null,
    activeTab: "attrs",
    searchActive: false,
    treeRoots: [],
    expanded: new Set(),    // ids of expanded groups (type codes) + node uuids
    typeLabels: {},         // code -> { label_ru, icon }
    nodeTypes: [],          // полный список типов из API
    typeOffsets: {},        // pagination per group type
  };

  var elTree = document.getElementById("treeContainer");
  var elCard = document.getElementById("cardContainer");
  var elClearSearch = document.getElementById("btnClearSearch");
  var elBtnCreate = document.getElementById("btnCreateNode");

  var visNetwork = null;
  var visLoadPromise = null;

  // ================== Утилиты ==================
  function escHtml(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function escAttr(s) { return escHtml(s); }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (k === "className") node.className = attrs[k];
        else if (k === "innerHTML") node.innerHTML = attrs[k];
        else if (k === "onClick") node.addEventListener("click", attrs[k]);
        else if (k === "dataset") {
          for (var dk in attrs.dataset) node.dataset[dk] = attrs.dataset[dk];
        } else if (k.indexOf("on") === 0) {
          node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        } else node.setAttribute(k, attrs[k]);
      }
    }
    if (children) {
      if (typeof children === "string") node.textContent = children;
      else if (Array.isArray(children)) {
        for (var i = 0; i < children.length; i++) {
          if (children[i] === null || children[i] === undefined) continue;
          if (typeof children[i] === "string") node.appendChild(document.createTextNode(children[i]));
          else node.appendChild(children[i]);
        }
      } else node.appendChild(children);
    }
    return node;
  }

  function toast(msg, type) {
    var root = document.getElementById("toastRoot");
    var t = el("div", { className: "graph-toast" + (type ? " graph-toast--" + type : "") }, msg);
    root.appendChild(t);
    setTimeout(function() { t.remove(); }, 4000);
  }

  function apiGet(url) {
    return fetch(url).then(function(r) { return r.json(); }).then(function(d) {
      if (!d.ok) throw new Error(d.error || ("Ошибка запроса: " + url));
      return d;
    });
  }
  function apiPost(url, body) {
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    }).then(function(r) { return r.json(); }).then(function(d) {
      if (!d.ok) throw new Error(d.error || ("Ошибка запроса: " + url));
      return d;
    });
  }
  function apiPatch(url, body) {
    return fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(function(r) { return r.json(); }).then(function(d) {
      if (!d.ok) throw new Error(d.error || ("Ошибка запроса: " + url));
      return d;
    });
  }
  function apiDelete(url) {
    return fetch(url, { method: "DELETE" }).then(function(r) { return r.json(); }).then(function(d) {
      if (!d.ok) throw new Error(d.error || ("Ошибка запроса: " + url));
      return d;
    });
  }

  function formatDateTime(s) {
    if (!s) return "";
    var d = new Date(s);
    if (isNaN(d.getTime())) return s;
    var pad = function(n) { return n < 10 ? "0" + n : "" + n; };
    return pad(d.getDate()) + "." + pad(d.getMonth() + 1) + "." + d.getFullYear() +
      " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  function getTypeLabel(code) {
    var t = state.typeLabels[code];
    if (t) return { icon: t.icon || "•", label: t.label_ru || code };
    return { icon: "•", label: code };
  }

  // ================== Дерево ==================
  async function loadRoots() {
    elTree.innerHTML = '<div class="tree-loading">Загрузка дерева…</div>';
    try {
      var data = await apiGet("/api/v2/graph/tree/roots");
      state.treeRoots = data.roots || [];
      state.typeLabels = {};
      for (var i = 0; i < state.treeRoots.length; i++) {
        var r = state.treeRoots[i];
        state.typeLabels[r.code] = { label_ru: r.label_ru, icon: r.icon };
      }
      renderTreeRoots();
      // Параллельно подтягиваем полный список типов для модалок
      apiGet("/api/v2/graph/node-types").then(function(td) {
        state.nodeTypes = td.types || [];
      }).catch(function() {});
    } catch (err) {
      elTree.innerHTML = '<div class="tree-loading">Ошибка загрузки: ' + escHtml(err.message) + '</div>';
    }
  }

  function renderTreeRoots() {
    elTree.innerHTML = "";
    var visible = state.treeRoots.filter(function(r) { return r.count > 0 || r.is_builtin; });
    if (visible.length === 0) {
      elTree.innerHTML = '<div class="tree-empty">Граф пуст. Загрузите XLSX-документ или создайте узел вручную.</div>';
      return;
    }
    for (var i = 0; i < visible.length; i++) {
      var r = visible[i];
      elTree.appendChild(renderGroupRow(r));
    }
  }

  function renderGroupRow(root) {
    var wrap = el("div", { className: "tree-group", dataset: { groupType: root.code } });
    var isOpen = state.expanded.has("group:" + root.code);
    var row = el("div", { className: "tree-node tree-node--group" });
    var toggle = el("span", { className: "tree-toggle" }, isOpen ? "▼" : "▶");
    var icon = el("span", { className: "tree-icon" }, root.icon || "•");
    var label = el("span", { className: "tree-label" }, root.label_ru || root.code);
    var count = el("span", { className: "tree-count" }, "(" + root.count + ")");
    row.appendChild(toggle);
    row.appendChild(icon);
    row.appendChild(label);
    row.appendChild(count);
    row.addEventListener("click", function() {
      if (state.expanded.has("group:" + root.code)) {
        state.expanded.delete("group:" + root.code);
      } else {
        state.expanded.add("group:" + root.code);
      }
      renderTreeRoots();
    });
    wrap.appendChild(row);
    if (isOpen && root.count > 0) {
      var childrenWrap = el("div", { className: "tree-children", dataset: { groupChildren: root.code } });
      childrenWrap.innerHTML = '<div class="tree-loading">Загрузка…</div>';
      wrap.appendChild(childrenWrap);
      loadGroupChildren(root.code, 0, childrenWrap);
    } else if (isOpen && root.count === 0) {
      wrap.appendChild(el("div", { className: "tree-empty" }, "пусто"));
    }
    return wrap;
  }

  async function loadGroupChildren(typeCode, offset, container) {
    try {
      var data = await apiGet("/api/v2/graph/tree/by-type/" + encodeURIComponent(typeCode) +
        "?limit=50&offset=" + offset);
      var append = offset > 0;
      if (!append) container.innerHTML = "";
      // Убираем кнопку "Показать ещё" если она есть, перед добавлением новых элементов
      var oldBtn = container.querySelector(".tree-show-more");
      if (oldBtn) oldBtn.remove();
      var items = data.items || [];
      if (items.length === 0 && !append) {
        container.appendChild(el("div", { className: "tree-empty" }, "пусто"));
        return;
      }
      for (var i = 0; i < items.length; i++) {
        container.appendChild(renderNodeRow(items[i], typeCode));
      }
      if (data.hasMore) {
        var btn = el("div", { className: "tree-show-more" }, "Показать ещё 100 →");
        btn.addEventListener("click", function() {
          btn.textContent = "Загрузка…";
          loadGroupChildren(typeCode, offset + 50 + 50, container);
        });
        container.appendChild(btn);
      }
    } catch (err) {
      container.innerHTML = '<div class="tree-loading">Ошибка: ' + escHtml(err.message) + '</div>';
    }
  }

  function renderNodeRow(node, fromTypeCode) {
    var wrap = el("div", { className: "tree-subtree", dataset: { nodeId: node.id } });
    var isExpanded = state.expanded.has("node:" + node.id);
    var isActive = state.selectedNodeId === node.id;
    var row = el("div", { className: "tree-node" + (isActive ? " tree-node--active" : "") });
    var tInfo = getTypeLabel(node.type);
    if (node.hasChildren) {
      var toggle = el("span", { className: "tree-toggle" }, isExpanded ? "▼" : "▶");
      toggle.addEventListener("click", function(e) {
        e.stopPropagation();
        if (state.expanded.has("node:" + node.id)) {
          state.expanded.delete("node:" + node.id);
        } else {
          state.expanded.add("node:" + node.id);
        }
        // Перерисовываем только эту строку (проще — перезагрузить всё)
        // Чтобы не терять текущую страницу группы, перерисуем всё:
        renderTreeRoots();
      });
      row.appendChild(toggle);
    } else {
      row.appendChild(el("span", { className: "tree-toggle tree-toggle--placeholder" }, "·"));
    }
    row.appendChild(el("span", { className: "tree-icon" }, tInfo.icon));
    row.appendChild(el("span", { className: "tree-label", title: node.name }, node.name));
    row.addEventListener("click", function() {
      selectNode(node.id);
    });
    wrap.appendChild(row);
    if (isExpanded) {
      var childWrap = el("div", { className: "tree-children" });
      childWrap.innerHTML = '<div class="tree-loading">Загрузка…</div>';
      wrap.appendChild(childWrap);
      loadNodeChildren(node.id, childWrap);
    }
    return wrap;
  }

  async function loadNodeChildren(nodeId, container) {
    try {
      var data = await apiGet("/api/v2/graph/tree/children/" + nodeId);
      container.innerHTML = "";
      var items = data.items || [];
      if (items.length === 0) {
        container.appendChild(el("div", { className: "tree-empty" }, "нет потомков"));
        return;
      }
      for (var i = 0; i < items.length; i++) {
        container.appendChild(renderNodeRow(items[i]));
      }
    } catch (err) {
      container.innerHTML = '<div class="tree-loading">Ошибка: ' + escHtml(err.message) + '</div>';
    }
  }

  // ================== Карточка узла ==================
  async function selectNode(nodeId) {
    state.selectedNodeId = nodeId;
    // Обновим подсветку в дереве: проще всего перерисовать видимое.
    if (!state.searchActive) {
      renderTreeRoots();
    } else {
      // оставляем результаты поиска как есть, но всё равно подсветим
      var prevActive = elTree.querySelectorAll(".search-result-item--active");
      for (var i = 0; i < prevActive.length; i++) prevActive[i].classList.remove("search-result-item--active");
      var match = elTree.querySelector('[data-result-id="' + nodeId + '"]');
      if (match) match.classList.add("search-result-item--active");
    }

    elCard.innerHTML = '<div class="card-welcome"><p>Загрузка карточки…</p></div>';
    try {
      var data = await apiGet("/api/v2/graph/nodes/" + nodeId + "/full");
      renderCard(data);
    } catch (err) {
      elCard.innerHTML = '<div class="card-welcome"><p style="color: var(--danger);">Ошибка: ' + escHtml(err.message) + '</p></div>';
    }
  }

  function renderCard(data) {
    var node = data.node;
    var tInfo = getTypeLabel(node.type);
    elCard.innerHTML = "";
    var cardEl = el("div", { className: "card" });

    // Шапка
    var head = el("div", { className: "card-head" });
    var title = el("h2", { className: "card-head__title" });
    title.appendChild(el("span", { className: "tree-icon" }, tInfo.icon));
    title.appendChild(document.createTextNode(node.name));
    head.appendChild(title);

    var metaParts = [];
    metaParts.push(tInfo.label);
    metaParts.push("ID " + node.id.slice(0, 8));
    if (node.createdAt) metaParts.push("создан " + formatDateTime(node.createdAt));
    if (node.author) metaParts.push("автор " + node.author);
    head.appendChild(el("div", { className: "card-head__meta", innerHTML: metaParts.map(escHtml).join(" · ") }));

    var actions = el("div", { className: "card-head__actions" });
    var btnEdit = el("button", { className: "graph-btn graph-btn--small" }, "Изменить");
    btnEdit.addEventListener("click", function() { openEditNodeModal(node); });
    actions.appendChild(btnEdit);
    var btnDel = el("button", { className: "graph-btn graph-btn--small graph-btn--danger" }, "Удалить");
    btnDel.addEventListener("click", function() { openDeleteNodeModal(node, data.descendantsCount); });
    actions.appendChild(btnDel);
    head.appendChild(actions);
    cardEl.appendChild(head);

    // Табы
    var tabs = el("div", { className: "card-tabs" });
    var tabKeys = [
      { key: "attrs", label: "Атрибуты" },
      { key: "edges", label: "Связи (" + (data.incoming.length + data.outgoing.length) + ")" },
      { key: "source", label: "Источник" },
      { key: "graph", label: "Граф вокруг" },
    ];
    for (var i = 0; i < tabKeys.length; i++) {
      (function(tk) {
        var t = el("button", { className: "card-tab" + (state.activeTab === tk.key ? " card-tab--active" : ""), dataset: { tab: tk.key } }, tk.label);
        t.addEventListener("click", function() {
          state.activeTab = tk.key;
          renderCardBody(data);
          var prev = tabs.querySelectorAll(".card-tab--active");
          for (var j = 0; j < prev.length; j++) prev[j].classList.remove("card-tab--active");
          t.classList.add("card-tab--active");
        });
        tabs.appendChild(t);
      })(tabKeys[i]);
    }
    cardEl.appendChild(tabs);

    var body = el("div", { className: "card-body", id: "cardBody" });
    cardEl.appendChild(body);

    elCard.appendChild(cardEl);
    renderCardBody(data);
  }

  function renderCardBody(data) {
    var body = document.getElementById("cardBody");
    if (!body) return;
    body.innerHTML = "";
    if (state.activeTab === "attrs") {
      renderAttrsTab(body, data.node);
    } else if (state.activeTab === "edges") {
      renderEdgesTab(body, data);
    } else if (state.activeTab === "source") {
      renderSourceTab(body, data);
    } else if (state.activeTab === "graph") {
      renderGraphTab(body, data.node);
    }
  }

  function renderAttrsTab(container, node) {
    var attrs = node.attributes || {};
    if (Object.keys(attrs).length === 0) {
      container.appendChild(el("div", { className: "card-welcome" }, "У узла нет атрибутов."));
      return;
    }
    var pre = el("pre", { className: "attrs-pre", innerHTML: prettyJson(attrs) });
    container.appendChild(pre);
    if (node.description) {
      container.appendChild(el("h4", { style: "margin: 16px 0 6px 0; color: var(--text-muted); text-transform: uppercase; font-size: 12px;" }, "Описание"));
      container.appendChild(el("div", { style: "font-size: 13px; color: var(--text); line-height: 1.5;" }, node.description));
    }
  }

  function prettyJson(obj) {
    var json = JSON.stringify(obj, null, 2);
    // Лёгкая подсветка
    return escHtml(json)
      .replace(/&quot;([^&]*?)&quot;:/g, '<span class="json-key">&quot;$1&quot;</span>:')
      .replace(/: &quot;([^&]*?)&quot;/g, ': <span class="json-string">&quot;$1&quot;</span>')
      .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
      .replace(/: null/g, ': <span class="json-null">null</span>')
      .replace(/: (-?\\d+(?:\\.\\d+)?)/g, ': <span class="json-number">$1</span>');
  }

  function renderEdgesTab(container, data) {
    // Входящие: другие узлы → этот
    var inSection = el("div", { className: "edges-section" });
    inSection.appendChild(el("h4", null, "Входящие (" + data.incoming.length + ")"));
    if (data.incoming.length === 0) {
      inSection.appendChild(el("div", { className: "card-welcome", style: "padding: 8px 0;" }, "нет входящих связей"));
    } else {
      for (var i = 0; i < data.incoming.length; i++) {
        inSection.appendChild(renderEdgeRow(data.incoming[i], "incoming", data.node));
      }
    }
    container.appendChild(inSection);

    var outSection = el("div", { className: "edges-section", style: "margin-top: 18px;" });
    outSection.appendChild(el("h4", null, "Исходящие (" + data.outgoing.length + ")"));
    if (data.outgoing.length === 0) {
      outSection.appendChild(el("div", { className: "card-welcome", style: "padding: 8px 0;" }, "нет исходящих связей"));
    } else {
      for (var i = 0; i < data.outgoing.length; i++) {
        outSection.appendChild(renderEdgeRow(data.outgoing[i], "outgoing", data.node));
      }
    }
    container.appendChild(outSection);

    var addBtnWrap = el("div", { style: "margin-top: 18px;" });
    var addBtn = el("button", { className: "graph-btn graph-btn--small" }, "+ Добавить связь");
    addBtn.addEventListener("click", function() { openCreateEdgeModal(data.node); });
    addBtnWrap.appendChild(addBtn);
    container.appendChild(addBtnWrap);
  }

  function renderEdgeRow(edge, direction, currentNode) {
    var row = el("div", { className: "edge-row" });
    var otherTypeInfo = getTypeLabel(edge.otherNode.type);
    var currentTypeInfo = getTypeLabel(currentNode.type);
    if (direction === "incoming") {
      // other --[relation]--> current
      row.appendChild(el("span", { className: "edge-row__icon" }, otherTypeInfo.icon));
      var lnk1 = el("span", { className: "edge-row__link", title: edge.otherNode.name }, edge.otherNode.name);
      lnk1.addEventListener("click", function() { selectNode(edge.otherNode.id); });
      row.appendChild(lnk1);
      row.appendChild(el("span", { className: "edge-row__chip" }, "—" + edge.relation + "→"));
      row.appendChild(el("span", { className: "edge-row__icon" }, currentTypeInfo.icon));
      row.appendChild(el("span", null, currentNode.name));
    } else {
      // current --[relation]--> other
      row.appendChild(el("span", { className: "edge-row__icon" }, currentTypeInfo.icon));
      row.appendChild(el("span", null, currentNode.name));
      row.appendChild(el("span", { className: "edge-row__chip" }, "—" + edge.relation + "→"));
      row.appendChild(el("span", { className: "edge-row__icon" }, otherTypeInfo.icon));
      var lnk2 = el("span", { className: "edge-row__link", title: edge.otherNode.name }, edge.otherNode.name);
      lnk2.addEventListener("click", function() { selectNode(edge.otherNode.id); });
      row.appendChild(lnk2);
    }
    var actions = el("div", { className: "edge-row__actions" });
    var btn = el("button", { className: "edge-row__btn-del", title: "Удалить связь" }, "×");
    btn.addEventListener("click", function(e) {
      e.stopPropagation();
      if (confirm("Удалить связь \\"" + edge.relation + "\\"?")) {
        apiDelete("/api/v2/graph/edges/" + edge.edgeId).then(function() {
          toast("Связь удалена", "success");
          selectNode(currentNode.id);
        }).catch(function(err) {
          toast("Ошибка: " + err.message, "error");
        });
      }
    });
    actions.appendChild(btn);
    row.appendChild(actions);
    return row;
  }

  function renderSourceTab(container, data) {
    var src = data.source;
    var block = el("div", { className: "source-block" });
    if (src.document) {
      block.innerHTML = "<strong>Документ:</strong> " + escHtml(src.document.title || src.document.id) + "<br/>";
      if (src.sheet) block.innerHTML += "<strong>Лист XLSX:</strong> " + escHtml(src.sheet) + "<br/>";
      if (src.row) block.innerHTML += "<strong>Строка XLSX:</strong> " + escHtml(String(src.row)) + "<br/>";
      if (src.pageNumber) block.innerHTML += "<strong>Страница PDF:</strong> " + escHtml(String(src.pageNumber)) + "<br/>";
      block.innerHTML += '<a class="source-link" href="/ui/v2/knowledge?docId=' + escAttr(src.document.id) + '">Открыть документ в БЗ →</a>';
    } else {
      block.innerHTML = "<strong>Создан вручную через UI.</strong><br/>" +
        "Автор: " + escHtml(src.author || "—") + "<br/>" +
        "Дата: " + escHtml(formatDateTime(src.createdAt) || "—");
    }
    container.appendChild(block);
  }

  function renderGraphTab(container, node) {
    container.style.padding = "0";
    var visContainer = el("div", { className: "graph-vis", id: "graphVisContainer" });
    container.appendChild(visContainer);
    ensureVisLoaded().then(function() {
      renderVisNetwork(node.id);
    }).catch(function() {
      visContainer.innerHTML = '<div class="graph-vis-fallback">Не удалось загрузить vis-network (нет интернета или CDN недоступен).<br/>Используйте таб «Связи» для просмотра соседей.</div>';
    });
  }

  function ensureVisLoaded() {
    if (typeof window.vis !== "undefined" && window.vis.Network) return Promise.resolve();
    if (visLoadPromise) return visLoadPromise;
    visLoadPromise = new Promise(function(resolve, reject) {
      var script = document.createElement("script");
      script.src = "https://unpkg.com/vis-network@9.1.6/standalone/umd/vis-network.min.js";
      script.onload = function() { resolve(); };
      script.onerror = function() { reject(new Error("Не удалось загрузить vis-network")); };
      document.head.appendChild(script);
    });
    return visLoadPromise;
  }

  async function renderVisNetwork(nodeId) {
    try {
      var data = await apiGet("/api/v2/graph/nodes/" + nodeId + "/neighbors?depth=1");
      var container = document.getElementById("graphVisContainer");
      if (!container) return;
      var typeColors = {
        object: "#a78bfa", cabinet: "#60a5fa", station: "#f59e0b",
        card: "#34d399", channel: "#22d3ee", signal: "#f87171", device: "#fbbf24",
      };
      var visNodes = data.nodes.map(function(n) {
        var tInfo = getTypeLabel(n.type);
        return {
          id: n.id,
          label: (tInfo.icon || "") + " " + n.name,
          color: {
            background: n.id === nodeId ? "#3B82F6" : (typeColors[n.type] || "#64748b"),
            border: n.id === nodeId ? "#1d4ed8" : "rgba(0,0,0,0.2)",
          },
          font: { color: "#fff", size: 13 },
          shape: "box",
          margin: 8,
        };
      });
      var visEdges = data.edges.map(function(e) {
        return {
          id: e.id,
          from: e.source,
          to: e.target,
          label: e.relation,
          arrows: "to",
          color: { color: "rgba(148,163,184,0.6)" },
          font: { size: 10, color: "#94a3b8", strokeWidth: 0 },
        };
      });
      var network = new window.vis.Network(container, {
        nodes: new window.vis.DataSet(visNodes),
        edges: new window.vis.DataSet(visEdges),
      }, {
        physics: { stabilization: { iterations: 100 } },
        interaction: { hover: true, tooltipDelay: 200 },
        nodes: { borderWidth: 2, shadow: false },
        edges: { smooth: { type: "continuous" } },
      });
      network.on("selectNode", function(params) {
        if (params.nodes.length === 1 && params.nodes[0] !== nodeId) {
          selectNode(params.nodes[0]);
        }
      });
      visNetwork = network;
    } catch (err) {
      var cn = document.getElementById("graphVisContainer");
      if (cn) cn.innerHTML = '<div class="graph-vis-fallback">Ошибка: ' + escHtml(err.message) + '</div>';
    }
  }

  // ================== Поиск ==================
  var searchTimer = null;
  function setupSearch() {
    var input = document.getElementById("graphSearchInput");
    if (!input) return;
    input.addEventListener("input", function() {
      clearTimeout(searchTimer);
      var v = input.value.trim();
      searchTimer = setTimeout(function() {
        if (v.length === 0) {
          exitSearch();
        } else {
          runSearch(v);
        }
      }, 300);
    });
    elClearSearch.addEventListener("click", function() {
      input.value = "";
      exitSearch();
    });
  }

  async function runSearch(q) {
    state.searchActive = true;
    elClearSearch.style.display = "";
    document.getElementById("leftPaneTitle").textContent = "Результаты поиска";
    elTree.innerHTML = '<div class="tree-loading">Поиск…</div>';
    try {
      var data = await apiGet("/api/v2/graph/search?q=" + encodeURIComponent(q) + "&limit=100");
      renderSearchResults(data.results || [], q);
    } catch (err) {
      elTree.innerHTML = '<div class="tree-loading">Ошибка: ' + escHtml(err.message) + '</div>';
    }
  }

  function renderSearchResults(results, q) {
    elTree.innerHTML = "";
    if (results.length === 0) {
      elTree.innerHTML = '<div class="tree-empty">Ничего не найдено по запросу "' + escHtml(q) + '".</div>';
      return;
    }
    var wrap = el("div", { className: "search-results" });
    var qLow = q.toLowerCase();
    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      var tInfo = getTypeLabel(r.node.type);
      var item = el("div", {
        className: "search-result-item" + (state.selectedNodeId === r.node.id ? " search-result-item--active" : ""),
        dataset: { resultId: r.node.id }
      });
      var head = el("div", { className: "search-result-item__head" });
      head.appendChild(el("span", { className: "tree-icon" }, tInfo.icon));
      head.appendChild(el("span", { className: "search-result-item__name", title: r.node.name }, r.node.name));
      head.appendChild(el("span", { className: "search-result-item__type" }, tInfo.label));
      item.appendChild(head);
      if (r.matchedField && r.matchedField !== "name") {
        var matchHtml = "по " + escHtml(r.matchedField) + ": " + highlightMatch(r.matchedValue || "", qLow);
        item.appendChild(el("div", { className: "search-result-item__match", innerHTML: matchHtml }));
      }
      (function(id) {
        item.addEventListener("click", function() { selectNode(id); });
      })(r.node.id);
      wrap.appendChild(item);
    }
    elTree.appendChild(wrap);
  }

  function highlightMatch(value, qLow) {
    var v = String(value);
    var low = v.toLowerCase();
    var idx = low.indexOf(qLow);
    if (idx === -1) return escHtml(v);
    return escHtml(v.slice(0, idx)) + "<mark>" + escHtml(v.slice(idx, idx + qLow.length)) + "</mark>" + escHtml(v.slice(idx + qLow.length));
  }

  function exitSearch() {
    state.searchActive = false;
    elClearSearch.style.display = "none";
    document.getElementById("leftPaneTitle").textContent = "Дерево узлов";
    renderTreeRoots();
  }

  // ================== Модалки CRUD ==================
  function openModal(html, opts) {
    var root = document.getElementById("modalRoot");
    root.innerHTML = "";
    var overlay = el("div", { className: "graph-modal-overlay" });
    var modal = el("div", { className: "graph-modal", innerHTML: html });
    overlay.appendChild(modal);
    overlay.addEventListener("click", function(e) {
      if (e.target === overlay) closeModal();
    });
    root.appendChild(overlay);
    if (opts && opts.onMount) opts.onMount(modal);
  }
  function closeModal() {
    var root = document.getElementById("modalRoot");
    root.innerHTML = "";
  }

  function openCreateNodeModal() {
    var typesOptions = state.nodeTypes.filter(function(t) { return !t.is_archived; }).map(function(t) {
      return '<option value="' + escAttr(t.code) + '">' + escHtml((t.icon || "") + " " + t.label_ru) + '</option>';
    }).join("");
    var html = '<h3 class="graph-modal__title">Новый узел</h3>' +
      '<div class="graph-modal__row">' +
        '<label class="graph-modal__label">Тип</label>' +
        '<select class="graph-modal__select" id="modalNodeType">' + typesOptions + '</select>' +
        '<div class="graph-modal__hint">Тип определяет место узла в дереве (для встроенных типов).</div>' +
      '</div>' +
      '<div class="graph-modal__row">' +
        '<label class="graph-modal__label">Имя <span style="color:var(--danger);">*</span></label>' +
        '<input class="graph-modal__input" id="modalNodeName" placeholder="например: Шкаф KS-3"/>' +
      '</div>' +
      '<div class="graph-modal__row">' +
        '<label class="graph-modal__label">Атрибуты (JSON)</label>' +
        '<textarea class="graph-modal__textarea" id="modalNodeAttrs" placeholder=\'{"cabinet_code": "KS-3"}\'>{}</textarea>' +
        '<div class="graph-modal__hint">Свободные ключ-значение пары. Обязателен валидный JSON.</div>' +
      '</div>' +
      '<div class="graph-modal__row ac-wrap">' +
        '<label class="graph-modal__label">Родитель (опционально)</label>' +
        '<input class="graph-modal__input" id="modalNodeParent" placeholder="Начните вводить имя или ID существующего узла"/>' +
        '<input type="hidden" id="modalNodeParentId" value="">' +
        '<div class="ac-dropdown" id="modalNodeParentAc" style="display:none;"></div>' +
        '<div class="graph-modal__hint">Если выбран — автоматически создаётся иерархическая связь по HIERARCHY_RULES (только для встроенных типов).</div>' +
      '</div>' +
      '<div class="graph-modal__error" id="modalNodeError" style="display:none;"></div>' +
      '<div class="graph-modal__actions">' +
        '<button class="graph-btn" id="modalNodeCancel">Отмена</button>' +
        '<button class="graph-btn graph-btn--primary" id="modalNodeSave">Создать</button>' +
      '</div>';
    openModal(html, { onMount: function() {
      setupAutocomplete("modalNodeParent", "modalNodeParentId", "modalNodeParentAc");
      document.getElementById("modalNodeCancel").addEventListener("click", closeModal);
      document.getElementById("modalNodeSave").addEventListener("click", submitCreateNode);
    }});
  }

  async function submitCreateNode() {
    var type = document.getElementById("modalNodeType").value;
    var name = document.getElementById("modalNodeName").value.trim();
    var attrsRaw = document.getElementById("modalNodeAttrs").value.trim();
    var parentId = document.getElementById("modalNodeParentId").value;
    var errEl = document.getElementById("modalNodeError");
    errEl.style.display = "none";
    if (!name) { showModalError(errEl, "Имя не может быть пустым"); return; }
    var attrs = {};
    if (attrsRaw) {
      try { attrs = JSON.parse(attrsRaw); } catch (e) {
        showModalError(errEl, "Некорректный JSON атрибутов: " + e.message); return;
      }
      if (typeof attrs !== "object" || Array.isArray(attrs) || attrs === null) {
        showModalError(errEl, "Атрибуты должны быть JSON-объектом"); return;
      }
    }
    try {
      var created = await apiPost("/api/v2/graph/nodes", { type: type, name: name, attributes: attrs });
      // Если выбран родитель — создаём связь по HIERARCHY_RULES (если возможно)
      if (parentId) {
        try {
          var hierarchy = await getHierarchyForParent(parentId, type);
          if (hierarchy) {
            await apiPost("/api/v2/graph/edges", buildEdgePayload(hierarchy, created.node.id, parentId));
          } else {
            toast("Узел создан, но автоматическую иерархическую связь не удалось создать: HIERARCHY_RULES для этой пары не определены. Свяжите вручную через таб «Связи».", "error");
          }
        } catch (e) {
          toast("Узел создан, но связь не создана: " + e.message, "error");
        }
      }
      toast("Узел \\"" + created.node.name + "\\" создан", "success");
      closeModal();
      await loadRoots();
      selectNode(created.node.id);
    } catch (err) {
      showModalError(errEl, err.message);
    }
  }

  // Зеркало серверного HIERARCHY_RULES (для построения связи parent⇄child
  // после создания узла из модалки).
  var CLIENT_HIERARCHY_RULES = [
    { parent: "object",  child: "cabinet", relation: "installed_in", direction: "forward" },
    { parent: "cabinet", child: "station", relation: "installed_in", direction: "forward" },
    { parent: "station", child: "card",    relation: "installed_in", direction: "forward" },
    { parent: "card",    child: "channel", relation: "has_channel",  direction: "backward" },
    { parent: "channel", child: "signal",  relation: "connected_to", direction: "forward" },
    { parent: "signal",  child: "device",  relation: "measures",     direction: "backward" },
  ];
  async function getHierarchyForParent(parentId, childType) {
    var parentData = await apiGet("/api/v2/graph/nodes/" + parentId + "/full");
    var parentType = parentData.node.type;
    return CLIENT_HIERARCHY_RULES.find(function(r) { return r.parent === parentType && r.child === childType; });
  }
  function buildEdgePayload(rule, childId, parentId) {
    if (rule.direction === "forward") {
      // child --[relation]--> parent
      return { sourceNodeId: childId, targetNodeId: parentId, relation: rule.relation };
    } else {
      // parent --[relation]--> child
      return { sourceNodeId: parentId, targetNodeId: childId, relation: rule.relation };
    }
  }

  function openEditNodeModal(node) {
    var html = '<h3 class="graph-modal__title">Редактировать узел</h3>' +
      '<div class="graph-modal__row">' +
        '<label class="graph-modal__label">Тип</label>' +
        '<input class="graph-modal__input" value="' + escAttr(node.type) + '" disabled/>' +
        '<div class="graph-modal__hint">Тип неизменяем (требует более инвазивных операций).</div>' +
      '</div>' +
      '<div class="graph-modal__row">' +
        '<label class="graph-modal__label">Имя</label>' +
        '<input class="graph-modal__input" id="modalEditName" value="' + escAttr(node.name) + '"/>' +
      '</div>' +
      '<div class="graph-modal__row">' +
        '<label class="graph-modal__label">Атрибуты (JSON)</label>' +
        '<textarea class="graph-modal__textarea" id="modalEditAttrs">' + escHtml(JSON.stringify(node.attributes || {}, null, 2)) + '</textarea>' +
      '</div>' +
      '<div class="graph-modal__row">' +
        '<label class="graph-modal__label">Описание</label>' +
        '<textarea class="graph-modal__textarea" id="modalEditDescription" style="min-height:60px;">' + escHtml(node.description || "") + '</textarea>' +
      '</div>' +
      '<div class="graph-modal__error" id="modalEditError" style="display:none;"></div>' +
      '<div class="graph-modal__actions">' +
        '<button class="graph-btn" id="modalEditCancel">Отмена</button>' +
        '<button class="graph-btn graph-btn--primary" id="modalEditSave">Сохранить</button>' +
      '</div>';
    openModal(html, { onMount: function() {
      document.getElementById("modalEditCancel").addEventListener("click", closeModal);
      document.getElementById("modalEditSave").addEventListener("click", function() { submitEditNode(node.id); });
    }});
  }

  async function submitEditNode(nodeId) {
    var name = document.getElementById("modalEditName").value.trim();
    var attrsRaw = document.getElementById("modalEditAttrs").value.trim();
    var description = document.getElementById("modalEditDescription").value;
    var errEl = document.getElementById("modalEditError");
    errEl.style.display = "none";
    if (!name) { showModalError(errEl, "Имя не может быть пустым"); return; }
    var attrs;
    try { attrs = attrsRaw ? JSON.parse(attrsRaw) : {}; } catch (e) {
      showModalError(errEl, "Некорректный JSON: " + e.message); return;
    }
    if (typeof attrs !== "object" || Array.isArray(attrs) || attrs === null) {
      showModalError(errEl, "Атрибуты должны быть JSON-объектом"); return;
    }
    try {
      await apiPatch("/api/v2/graph/nodes/" + nodeId, {
        name: name,
        attributes: attrs,
        description: description || null,
      });
      toast("Узел обновлён", "success");
      closeModal();
      selectNode(nodeId);
    } catch (err) {
      showModalError(errEl, err.message);
    }
  }

  function openDeleteNodeModal(node, descendantsCount) {
    var hasDesc = descendantsCount > 0;
    var html = '<h3 class="graph-modal__title">Удалить узел</h3>' +
      '<div style="font-size: 14px; color: var(--text); margin-bottom: 12px;">' +
        'Вы действительно хотите удалить узел <strong>' + escHtml(node.name) + '</strong>?' +
      '</div>' +
      (hasDesc
        ? '<div class="graph-modal__row">' +
          '<label style="display:flex;gap:8px;align-items:center;font-size:13px;cursor:pointer;">' +
            '<input type="checkbox" id="modalDeleteCascade"/>' +
            '<span>Удалить также <strong>' + descendantsCount + ' потомков</strong> (каскадно по дереву).</span>' +
          '</label>' +
          '<div class="graph-modal__hint">Без галочки — потомки останутся как сироты в дереве (они не исчезнут, но потеряют связь с этим узлом).</div>' +
        '</div>'
        : '<div class="graph-modal__hint">У этого узла нет потомков по дереву.</div>') +
      '<div class="graph-modal__error" id="modalDeleteError" style="display:none;"></div>' +
      '<div class="graph-modal__actions">' +
        '<button class="graph-btn" id="modalDeleteCancel">Отмена</button>' +
        '<button class="graph-btn graph-btn--danger" id="modalDeleteSubmit">Удалить</button>' +
      '</div>';
    openModal(html, { onMount: function() {
      document.getElementById("modalDeleteCancel").addEventListener("click", closeModal);
      document.getElementById("modalDeleteSubmit").addEventListener("click", function() { submitDeleteNode(node); });
    }});
  }

  async function submitDeleteNode(node) {
    var cb = document.getElementById("modalDeleteCascade");
    var cascade = cb ? cb.checked : false;
    var errEl = document.getElementById("modalDeleteError");
    errEl.style.display = "none";
    try {
      var res = await apiPost("/api/v2/graph/nodes/" + node.id + "/hard-delete?cascade=" + (cascade ? "true" : "false"));
      toast("Удалено узлов: " + res.deletedCount, "success");
      closeModal();
      state.selectedNodeId = null;
      elCard.innerHTML = '<div class="card-welcome"><p>Узел удалён.</p></div>';
      await loadRoots();
    } catch (err) {
      showModalError(errEl, err.message);
    }
  }

  function openCreateEdgeModal(fromNode) {
    var html = '<h3 class="graph-modal__title">Новая связь</h3>' +
      '<div class="graph-modal__row">' +
        '<label class="graph-modal__label">От</label>' +
        '<input class="graph-modal__input" value="' + escAttr(fromNode.name) + '" disabled/>' +
      '</div>' +
      '<div class="graph-modal__row ac-wrap">' +
        '<label class="graph-modal__label">К <span style="color:var(--danger);">*</span></label>' +
        '<input class="graph-modal__input" id="modalEdgeTarget" placeholder="Начните вводить имя или ID узла"/>' +
        '<input type="hidden" id="modalEdgeTargetId" value="">' +
        '<div class="ac-dropdown" id="modalEdgeTargetAc" style="display:none;"></div>' +
      '</div>' +
      '<div class="graph-modal__row">' +
        '<label class="graph-modal__label">Тип связи <span style="color:var(--danger);">*</span></label>' +
        '<input class="graph-modal__input" id="modalEdgeRelation" list="edgeRelationList" placeholder="например: installed_in"/>' +
        '<datalist id="edgeRelationList">' +
          '<option value="installed_in"></option>' +
          '<option value="has_channel"></option>' +
          '<option value="connected_to"></option>' +
          '<option value="measures"></option>' +
          '<option value="described_in"></option>' +
        '</datalist>' +
      '</div>' +
      '<div class="graph-modal__row">' +
        '<label class="graph-modal__label">Confidence (0.0 — 1.0)</label>' +
        '<input class="graph-modal__input" id="modalEdgeConfidence" value="1.0" type="number" min="0" max="1" step="0.01"/>' +
      '</div>' +
      '<div class="graph-modal__error" id="modalEdgeError" style="display:none;"></div>' +
      '<div class="graph-modal__actions">' +
        '<button class="graph-btn" id="modalEdgeCancel">Отмена</button>' +
        '<button class="graph-btn graph-btn--primary" id="modalEdgeSave">Создать</button>' +
      '</div>';
    openModal(html, { onMount: function() {
      setupAutocomplete("modalEdgeTarget", "modalEdgeTargetId", "modalEdgeTargetAc");
      document.getElementById("modalEdgeCancel").addEventListener("click", closeModal);
      document.getElementById("modalEdgeSave").addEventListener("click", function() { submitCreateEdge(fromNode); });
    }});
  }

  async function submitCreateEdge(fromNode) {
    var targetId = document.getElementById("modalEdgeTargetId").value;
    var relation = document.getElementById("modalEdgeRelation").value.trim();
    var conf = parseFloat(document.getElementById("modalEdgeConfidence").value);
    var errEl = document.getElementById("modalEdgeError");
    errEl.style.display = "none";
    if (!targetId) { showModalError(errEl, "Выберите целевой узел из списка"); return; }
    if (!relation) { showModalError(errEl, "Укажите тип связи"); return; }
    if (isNaN(conf) || conf < 0 || conf > 1) conf = 1.0;
    try {
      await apiPost("/api/v2/graph/edges", {
        sourceNodeId: fromNode.id,
        targetNodeId: targetId,
        relation: relation,
        confidence: conf,
      });
      toast("Связь создана", "success");
      closeModal();
      selectNode(fromNode.id);
    } catch (err) {
      showModalError(errEl, err.message);
    }
  }

  function showModalError(errEl, msg) {
    errEl.style.display = "";
    errEl.textContent = msg;
  }

  // ================== Autocomplete для поиска узлов ==================
  function setupAutocomplete(inputId, hiddenInputId, dropdownId) {
    var input = document.getElementById(inputId);
    var hidden = document.getElementById(hiddenInputId);
    var dropdown = document.getElementById(dropdownId);
    var timer = null;

    input.addEventListener("input", function() {
      hidden.value = "";
      clearTimeout(timer);
      var q = input.value.trim();
      if (q.length < 2) { dropdown.style.display = "none"; return; }
      timer = setTimeout(function() {
        apiGet("/api/v2/graph/search?q=" + encodeURIComponent(q) + "&limit=20").then(function(data) {
          var results = data.results || [];
          if (results.length === 0) { dropdown.style.display = "none"; return; }
          dropdown.innerHTML = "";
          for (var i = 0; i < results.length; i++) {
            (function(r) {
              var tInfo = getTypeLabel(r.node.type);
              var item = el("div", { className: "ac-item" }, tInfo.icon + " " + r.node.name + " · " + tInfo.label);
              item.addEventListener("click", function() {
                input.value = r.node.name;
                hidden.value = r.node.id;
                dropdown.style.display = "none";
              });
              dropdown.appendChild(item);
            })(results[i]);
          }
          dropdown.style.display = "";
        });
      }, 250);
    });
    input.addEventListener("blur", function() {
      setTimeout(function() { dropdown.style.display = "none"; }, 200);
    });
  }

  // ================== Init ==================
  function init() {
    setupSearch();
    elBtnCreate.addEventListener("click", openCreateNodeModal);
    loadRoots();
  }
  init();
})();
  `;
}

export function renderGraphPage({ ICONS, renderLayout, stats }) {
  var totalNodes = stats?.totalActiveNodes ?? 0;
  var totalEdges = stats?.totalEdges ?? 0;
  var statsHtml = `
    <div class="graph-stats">
      <span class="graph-stats__chip">${totalNodes} узлов</span>
      <span class="graph-stats__chip">${totalEdges} связей</span>
    </div>
  `;
  var searchHtml = `
    <div class="graph-search-form">
      <input class="graph-search-input" id="graphSearchInput" placeholder="🔍 Поиск по тегам, именам, атрибутам…"/>
    </div>
  `;
  var headerExtra = searchHtml + statsHtml;
  var content = `
    <style>${renderGraphPageCss()}</style>
    ${renderGraphPageHtml()}
  `;
  return renderLayout({
    activeNav: "graph",
    pageTitle: "Граф знаний",
    pageDocumentTitle: "Граф знаний — LOCAL-RAG",
    content,
    headerExtra,
    pageScript: renderGraphPageScript(),
  });
}

export default renderGraphPage;
