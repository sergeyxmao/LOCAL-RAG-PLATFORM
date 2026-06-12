
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
  var elBtnRecordCase = document.getElementById("btnRecordCase");

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
    // Если тела нет — НЕ выставляем Content-Type, иначе Fastify
    // реджектит запрос ошибкой "Body cannot be empty when content-type
    // is set to 'application/json'". Это касается POST /hard-delete и
    // других endpoint'ов без тела.
    var init = { method: "POST" };
    if (body !== undefined && body !== null) {
      init.headers = { "Content-Type": "application/json" };
      init.body = JSON.stringify(body);
    }
    return fetch(url, init).then(function(r) { return r.json(); }).then(function(d) {
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

  // ================== UI-словарь типов связей ==================
  // EDGE_TYPE_LABELS — это словарь только для UI. В БД остаются
  // английские коды (installed_in, has_channel, ...). Кастомные
  // коды отображаются как есть.
  var EDGE_TYPE_LABELS = {
    "installed_in":  { label_ru: "Установлен в",    icon: "📥" },
    "has_channel":   { label_ru: "Содержит канал",  icon: "🔗" },
    "connected_to":  { label_ru: "Подключён к",     icon: "🔌" },
    "measures":      { label_ru: "Измеряет",        icon: "🌡" },
    "described_in":  { label_ru: "Описан в",        icon: "📄" },
    "relates_to":    { label_ru: "Относится к",     icon: "🧩" },
    "resolves":      { label_ru: "Устраняет",       icon: "🛠" },
    "located_at":    { label_ru: "Находится на",    icon: "📍" }
  };

  function relationLabel(code) {
    var meta = EDGE_TYPE_LABELS[code];
    if (!meta) return code;
    return meta.icon + " " + meta.label_ru;
  }

  function relationLabelFull(code) {
    var meta = EDGE_TYPE_LABELS[code];
    if (!meta) return code;
    return meta.icon + " " + meta.label_ru + " (" + code + ")";
  }

  // ================== Confidence ==================
  function formatEdgeConfidence(confidence) {
    if (confidence === null || confidence === undefined || confidence >= 0.95) return "";
    if (confidence >= 0.5) return '<span class="conf-warn">⚠️ Возможно</span>';
    return '<span class="conf-warn">⚠️ Сомнительно</span>';
  }

  // ================== Визуальный редактор атрибутов ==================
  function formatValueForInput(v) {
    if (v === null) return "null";
    if (typeof v === "boolean") return v ? "true" : "false";
    return String(v);
  }

  function parseValueForJson(s) {
    if (s === "true") return true;
    if (s === "false") return false;
    if (s === "null") return null;
    if (/^-?\d+$/.test(s)) return parseInt(s, 10);
    if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s);
    return s;
  }

  function addAttrRow(listEl, key, value) {
    var row = document.createElement("div");
    row.className = "kv-row";
    row.innerHTML =
      '<input class="kv-key" placeholder="Ключ" value="' + escAttr(key || "") + '"/>' +
      '<input class="kv-value" placeholder="Значение" value="' + escAttr(value || "") + '"/>' +
      '<button type="button" class="kv-remove" title="Удалить параметр">×</button>';
    row.querySelector(".kv-remove").onclick = function() {
      row.remove();
      updateAttrEmptyHint(listEl);
    };
    listEl.appendChild(row);
    updateAttrEmptyHint(listEl);
  }

  function updateAttrEmptyHint(listEl) {
    var empty = listEl.querySelector(".kv-empty");
    var hasRows = listEl.querySelectorAll(".kv-row").length > 0;
    if (!hasRows && !empty) {
      var e = document.createElement("div");
      e.className = "kv-empty";
      e.textContent = "Параметров пока нет. Нажмите «+ Добавить параметр».";
      listEl.appendChild(e);
    } else if (hasRows && empty) {
      empty.remove();
    }
  }

  function fillAttrsVisual(listEl, attrs) {
    listEl.innerHTML = "";
    var entries = Object.entries(attrs || {});
    if (entries.length === 0) {
      updateAttrEmptyHint(listEl);
      return;
    }
    for (var i = 0; i < entries.length; i++) {
      addAttrRow(listEl, entries[i][0], formatValueForInput(entries[i][1]));
    }
  }

  function collectAttrsFromVisual(listEl) {
    var rows = listEl.querySelectorAll(".kv-row");
    var result = {};
    for (var i = 0; i < rows.length; i++) {
      var k = rows[i].querySelector(".kv-key").value.trim();
      var v = rows[i].querySelector(".kv-value").value;
      if (!k) continue;
      result[k] = parseValueForJson(v);
    }
    return result;
  }

  // Переключение режима визуального редактора атрибутов в модалке.
  // prefix — уникальный префикс id'ов ("modalNode" или "modalEdit").
  // Возвращает true при успехе, false при ошибке валидации JSON.
  function switchAttrsMode(prefix, mode) {
    var visual = document.getElementById(prefix + "AttrsVisual");
    var json = document.getElementById(prefix + "AttrsJson");
    var error = document.getElementById(prefix + "AttrsError");
    var list = document.getElementById(prefix + "AttrsList");
    error.style.display = "none";

    if (mode === "json") {
      var obj = collectAttrsFromVisual(list);
      json.value = JSON.stringify(obj, null, 2);
      visual.style.display = "none";
      json.style.display = "block";
    } else {
      var parsed;
      try {
        parsed = JSON.parse((json.value || "{}").trim() || "{}");
        if (typeof parsed !== "object" || Array.isArray(parsed) || parsed === null) {
          throw new Error("JSON должен быть объектом, не массивом");
        }
      } catch (e) {
        error.textContent = "Некорректный JSON: " + e.message;
        error.style.display = "block";
        return false;
      }
      fillAttrsVisual(list, parsed);
      json.style.display = "none";
      visual.style.display = "block";
    }

    var toggleWrap = document.getElementById(prefix + "AttrsModeToggle");
    if (toggleWrap) {
      var btns = toggleWrap.querySelectorAll(".kv-mode-btn");
      for (var i = 0; i < btns.length; i++) {
        btns[i].classList.toggle("active", btns[i].dataset.mode === mode);
      }
    }
    return true;
  }

  // Считать атрибуты из активного режима (визуального или JSON).
  // При ошибке JSON показывает её в errEl и возвращает null.
  function collectAttrsFromActiveMode(prefix, errEl) {
    var visual = document.getElementById(prefix + "AttrsVisual");
    var json = document.getElementById(prefix + "AttrsJson");
    var visualOpen = visual && visual.style.display !== "none";
    if (visualOpen) {
      return collectAttrsFromVisual(document.getElementById(prefix + "AttrsList"));
    }
    try {
      var raw = (json.value || "").trim();
      var obj = raw ? JSON.parse(raw) : {};
      if (typeof obj !== "object" || Array.isArray(obj) || obj === null) {
        if (errEl) showModalError(errEl, "Атрибуты должны быть JSON-объектом");
        return null;
      }
      return obj;
    } catch (e) {
      if (errEl) showModalError(errEl, "Некорректный JSON: " + e.message);
      return null;
    }
  }

  // Привязка обработчиков к табам режимов и кнопке "+ Добавить параметр".
  // Возвращает функцию для повторной инициализации списка.
  function setupAttrsEditor(prefix, initialAttrs) {
    var listEl = document.getElementById(prefix + "AttrsList");
    var addBtn = document.getElementById(prefix + "AttrsAddBtn");
    var toggleWrap = document.getElementById(prefix + "AttrsModeToggle");
    fillAttrsVisual(listEl, initialAttrs || {});
    addBtn.addEventListener("click", function() { addAttrRow(listEl, "", ""); });
    var btns = toggleWrap.querySelectorAll(".kv-mode-btn");
    for (var i = 0; i < btns.length; i++) {
      (function(btn) {
        btn.addEventListener("click", function() {
          if (btn.classList.contains("active")) return;
          switchAttrsMode(prefix, btn.dataset.mode);
        });
      })(btns[i]);
    }
  }

  // HTML визуального редактора атрибутов (для модалок Создать/Редактировать).
  // prefix — уникальный префикс id'ов.
  function renderAttrsEditorHtml(prefix, tipText) {
    return '<div class="graph-modal__row">' +
      '<label class="graph-modal__label">Атрибуты' +
        '<span class="hint" data-tip="' + escAttr(tipText) + '">?</span>' +
      '</label>' +
      '<div class="kv-mode-toggle" id="' + prefix + 'AttrsModeToggle">' +
        '<button type="button" class="kv-mode-btn active" data-mode="visual">Визуально</button>' +
        '<button type="button" class="kv-mode-btn" data-mode="json">Как JSON</button>' +
      '</div>' +
      '<div class="kv-visual" id="' + prefix + 'AttrsVisual">' +
        '<div class="kv-list" id="' + prefix + 'AttrsList"></div>' +
        '<button type="button" class="kv-add-btn" id="' + prefix + 'AttrsAddBtn">+ Добавить параметр</button>' +
      '</div>' +
      '<textarea class="graph-modal__textarea" id="' + prefix + 'AttrsJson" ' +
        'style="display:none;" ' +
        'placeholder="{&quot;cabinet_code&quot;: &quot;KS-3&quot;}">{}</textarea>' +
      '<div class="graph-modal__error" id="' + prefix + 'AttrsError" style="display:none;"></div>' +
    '</div>';
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
    var hasAttrs = Object.keys(attrs).length > 0;

    if (hasAttrs) {
      // Переключатель режима (Таблица / JSON)
      var toggleWrap = el("div", { className: "attrs-mode-toggle" });
      var btnTable = el("button", { className: "attrs-mode-btn active", dataset: { mode: "table" } }, "Таблица");
      var btnJson = el("button", { className: "attrs-mode-btn", dataset: { mode: "json" } }, "JSON");
      toggleWrap.appendChild(btnTable);
      toggleWrap.appendChild(btnJson);
      container.appendChild(toggleWrap);

      var tableWrap = el("div", { className: "attrs-table", id: "cardAttrsTable" });
      var rowsHtml = Object.entries(attrs).map(function(e) {
        return '<tr><td class="attr-key">' + escHtml(e[0]) +
          '</td><td class="attr-val">' + escHtml(formatValueForInput(e[1])) + '</td></tr>';
      }).join("");
      tableWrap.innerHTML = "<table>" + rowsHtml + "</table>";
      container.appendChild(tableWrap);

      var jsonWrap = el("pre", { className: "attrs-pre", id: "cardAttrsJson", style: "display:none;", innerHTML: prettyJson(attrs) });
      container.appendChild(jsonWrap);

      btnTable.addEventListener("click", function() {
        tableWrap.style.display = "";
        jsonWrap.style.display = "none";
        btnTable.classList.add("active");
        btnJson.classList.remove("active");
      });
      btnJson.addEventListener("click", function() {
        tableWrap.style.display = "none";
        jsonWrap.style.display = "block";
        btnJson.classList.add("active");
        btnTable.classList.remove("active");
      });
    } else {
      container.appendChild(el("div", { className: "card-welcome" }, "У узла нет атрибутов."));
    }

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
      .replace(/: (-?\d+(?:\.\d+)?)/g, ': <span class="json-number">$1</span>');
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
    var relLabel = relationLabel(edge.relation);
    if (direction === "incoming") {
      // other --[relation]--> current
      row.appendChild(el("span", { className: "edge-row__icon" }, otherTypeInfo.icon));
      var lnk1 = el("span", { className: "edge-row__link", title: edge.otherNode.name }, edge.otherNode.name);
      lnk1.addEventListener("click", function() { selectNode(edge.otherNode.id); });
      row.appendChild(lnk1);
      row.appendChild(el("span", { className: "edge-row__chip", title: edge.relation }, "—[" + relLabel + "]→"));
      row.appendChild(el("span", { className: "edge-row__icon" }, currentTypeInfo.icon));
      row.appendChild(el("span", null, currentNode.name));
    } else {
      // current --[relation]--> other
      row.appendChild(el("span", { className: "edge-row__icon" }, currentTypeInfo.icon));
      row.appendChild(el("span", null, currentNode.name));
      row.appendChild(el("span", { className: "edge-row__chip", title: edge.relation }, "—[" + relLabel + "]→"));
      row.appendChild(el("span", { className: "edge-row__icon" }, otherTypeInfo.icon));
      var lnk2 = el("span", { className: "edge-row__link", title: edge.otherNode.name }, edge.otherNode.name);
      lnk2.addEventListener("click", function() { selectNode(edge.otherNode.id); });
      row.appendChild(lnk2);
    }
    // Индикатор уверенности (только если confidence < 0.95)
    var confHtml = formatEdgeConfidence(edge.confidence);
    if (confHtml) {
      var confWrap = document.createElement("span");
      confWrap.innerHTML = confHtml;
      while (confWrap.firstChild) row.appendChild(confWrap.firstChild);
    }
    var actions = el("div", { className: "edge-row__actions" });
    var btn = el("button", { className: "edge-row__btn-del", title: "Удалить связь" }, "×");
    btn.addEventListener("click", function(e) {
      e.stopPropagation();
      if (confirm("Удалить связь \"" + relLabel + "\"?")) {
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
          label: relationLabel(e.relation),
          title: e.relation,
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
    var tipType = "Категория узла в графе: Шкаф, ПЛК, Плата и так далее. Список редактируется в Настройки → Граф знаний → Типы узлов.";
    var tipName = "Короткое название узла. Например: Шкаф KS-3, ПЛК DP01, Сигнал KS_T2B1.";
    var tipAttrs = "Произвольные параметры узла. Для шкафа — cabinet_code, для сигнала — tag, address. Добавьте только те, которые важны для вашей задачи.";
    var tipParent = "Узел-родитель в иерархии. Если выбран — автоматически создаётся связь по правилам HIERARCHY_RULES (для встроенных типов АСУ ТП). Кастомные типы — связь создаётся вручную после.";
    var html = '<h3 class="graph-modal__title">Новый узел</h3>' +
      '<div class="graph-modal__row">' +
        '<label class="graph-modal__label">Тип' +
          '<span class="hint" data-tip="' + escAttr(tipType) + '">?</span>' +
        '</label>' +
        '<select class="graph-modal__select" id="modalNodeType">' + typesOptions + '</select>' +
      '</div>' +
      '<div class="graph-modal__row">' +
        '<label class="graph-modal__label">Имя <span style="color:var(--danger);">*</span>' +
          '<span class="hint" data-tip="' + escAttr(tipName) + '">?</span>' +
        '</label>' +
        '<input class="graph-modal__input" id="modalNodeName" placeholder="например: Шкаф KS-3"/>' +
      '</div>' +
      renderAttrsEditorHtml("modalNode", tipAttrs) +
      '<div class="graph-modal__row ac-wrap">' +
        '<label class="graph-modal__label">Родитель (опционально)' +
          '<span class="hint" data-tip="' + escAttr(tipParent) + '">?</span>' +
        '</label>' +
        '<input class="graph-modal__input" id="modalNodeParent" placeholder="Начните вводить имя или ID существующего узла"/>' +
        '<input type="hidden" id="modalNodeParentId" value="">' +
        '<div class="ac-dropdown" id="modalNodeParentAc" style="display:none;"></div>' +
      '</div>' +
      '<div class="graph-modal__error" id="modalNodeError" style="display:none;"></div>' +
      '<div class="graph-modal__actions">' +
        '<button class="graph-btn" id="modalNodeCancel">Отмена</button>' +
        '<button class="graph-btn graph-btn--primary" id="modalNodeSave">Создать</button>' +
      '</div>';
    openModal(html, { onMount: function() {
      setupAutocomplete("modalNodeParent", "modalNodeParentId", "modalNodeParentAc");
      setupAttrsEditor("modalNode", {});
      document.getElementById("modalNodeCancel").addEventListener("click", closeModal);
      document.getElementById("modalNodeSave").addEventListener("click", submitCreateNode);
    }});
  }

  async function submitCreateNode() {
    var type = document.getElementById("modalNodeType").value;
    var name = document.getElementById("modalNodeName").value.trim();
    var parentId = document.getElementById("modalNodeParentId").value;
    var errEl = document.getElementById("modalNodeError");
    errEl.style.display = "none";
    if (!name) { showModalError(errEl, "Имя не может быть пустым"); return; }
    var attrs = collectAttrsFromActiveMode("modalNode", errEl);
    if (attrs === null) return;
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
      toast("Узел \"" + created.node.name + "\" создан", "success");
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
    var tipType = "Категория узла. Не меняется после создания — это потребовало бы пересборки всех связей.";
    var tipName = "Короткое название узла. Например: Шкаф KS-3, ПЛК DP01, Сигнал KS_T2B1.";
    var tipAttrs = "Произвольные параметры узла. Для шкафа — cabinet_code, для сигнала — tag, address. Добавьте только те, которые важны для вашей задачи.";
    var tipDesc = "Свободный текст-комментарий к узлу. Можно использовать для пометок: история создания, особенности, TODO.";
    var html = '<h3 class="graph-modal__title">Редактировать узел</h3>' +
      '<div class="graph-modal__row">' +
        '<label class="graph-modal__label">Тип' +
          '<span class="hint" data-tip="' + escAttr(tipType) + '">?</span>' +
        '</label>' +
        '<input class="graph-modal__input" value="' + escAttr(node.type) + '" disabled/>' +
      '</div>' +
      '<div class="graph-modal__row">' +
        '<label class="graph-modal__label">Имя' +
          '<span class="hint" data-tip="' + escAttr(tipName) + '">?</span>' +
        '</label>' +
        '<input class="graph-modal__input" id="modalEditName" value="' + escAttr(node.name) + '"/>' +
      '</div>' +
      renderAttrsEditorHtml("modalEdit", tipAttrs) +
      '<div class="graph-modal__row">' +
        '<label class="graph-modal__label">Описание' +
          '<span class="hint" data-tip="' + escAttr(tipDesc) + '">?</span>' +
        '</label>' +
        '<textarea class="graph-modal__textarea" id="modalEditDescription" style="min-height:60px;">' + escHtml(node.description || "") + '</textarea>' +
      '</div>' +
      '<div class="graph-modal__error" id="modalEditError" style="display:none;"></div>' +
      '<div class="graph-modal__actions">' +
        '<button class="graph-btn" id="modalEditCancel">Отмена</button>' +
        '<button class="graph-btn graph-btn--primary" id="modalEditSave">Сохранить</button>' +
      '</div>';
    openModal(html, { onMount: function() {
      setupAttrsEditor("modalEdit", node.attributes || {});
      document.getElementById("modalEditCancel").addEventListener("click", closeModal);
      document.getElementById("modalEditSave").addEventListener("click", function() { submitEditNode(node.id); });
    }});
  }

  async function submitEditNode(nodeId) {
    var name = document.getElementById("modalEditName").value.trim();
    var description = document.getElementById("modalEditDescription").value;
    var errEl = document.getElementById("modalEditError");
    errEl.style.display = "none";
    if (!name) { showModalError(errEl, "Имя не может быть пустым"); return; }
    var attrs = collectAttrsFromActiveMode("modalEdit", errEl);
    if (attrs === null) return;
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
    var tipCascade = "При установке будут удалены ВСЕ потомки этого узла (ПЛК → платы → каналы и так далее). Без галочки потомки останутся в графе, но без связи с этим узлом (станут сиротами в своей типовой группе).";
    var html = '<h3 class="graph-modal__title">Удалить узел</h3>' +
      '<div style="font-size: 14px; color: var(--text); margin-bottom: 12px;">' +
        'Вы действительно хотите удалить узел <strong>' + escHtml(node.name) + '</strong>?' +
      '</div>' +
      (hasDesc
        ? '<div class="graph-modal__row">' +
          '<label style="display:flex;gap:8px;align-items:center;font-size:13px;cursor:pointer;">' +
            '<input type="checkbox" id="modalDeleteCascade"/>' +
            '<span>Удалить также <strong>' + descendantsCount + ' потомков</strong> (каскадно по дереву).' +
              '<span class="hint" data-tip="' + escAttr(tipCascade) + '">?</span>' +
            '</span>' +
          '</label>' +
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
      // POST /hard-delete без тела — Fastify реджектит запросы с
      // Content-Type: application/json и пустым телом. apiPost
      // (после фикса в #8.2.hotfix) больше не выставляет Content-Type
      // если тело не передано — это решает баг "Body cannot be empty".
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
    var tipTarget = "Целевой узел связи. Связь идёт ОТ текущего узла К другому. Например: сигнал → канал, плата → ПЛК.";
    var tipRelation = "Какая связь между узлами. Выберите из списка или введите свой код для кастомных доменов.";
    var tipConfidence = "Насколько вы уверены, что эта связь правильна. Для ручного создания обычно — Точно. Если связь предположительная — Возможно или Сомнительно.";
    // Опции datalist с русскими подписями (browser показывает label рядом с value)
    var relationOptions = "";
    var codes = Object.keys(EDGE_TYPE_LABELS);
    for (var ri = 0; ri < codes.length; ri++) {
      var code = codes[ri];
      var meta = EDGE_TYPE_LABELS[code];
      relationOptions += '<option value="' + escAttr(code) + '">' + escHtml(meta.icon + " " + meta.label_ru) + '</option>';
    }
    var html = '<h3 class="graph-modal__title">Новая связь</h3>' +
      '<div class="graph-modal__row">' +
        '<label class="graph-modal__label">От</label>' +
        '<input class="graph-modal__input" value="' + escAttr(fromNode.name) + '" disabled/>' +
      '</div>' +
      '<div class="graph-modal__row ac-wrap">' +
        '<label class="graph-modal__label">К <span style="color:var(--danger);">*</span>' +
          '<span class="hint" data-tip="' + escAttr(tipTarget) + '">?</span>' +
        '</label>' +
        '<input class="graph-modal__input" id="modalEdgeTarget" placeholder="Начните вводить имя или ID узла"/>' +
        '<input type="hidden" id="modalEdgeTargetId" value="">' +
        '<div class="ac-dropdown" id="modalEdgeTargetAc" style="display:none;"></div>' +
      '</div>' +
      '<div class="graph-modal__row">' +
        '<label class="graph-modal__label">Тип связи <span style="color:var(--danger);">*</span>' +
          '<span class="hint" data-tip="' + escAttr(tipRelation) + '">?</span>' +
        '</label>' +
        '<input class="graph-modal__input" id="modalEdgeRelation" list="edgeRelationList" placeholder="например: Установлен в"/>' +
        '<datalist id="edgeRelationList">' + relationOptions + '</datalist>' +
      '</div>' +
      '<details class="graph-modal__advanced">' +
        '<summary>Расширенные настройки</summary>' +
        '<div class="graph-modal__row">' +
          '<label class="graph-modal__label">Уверенность в связи' +
            '<span class="hint" data-tip="' + escAttr(tipConfidence) + '">?</span>' +
          '</label>' +
          '<select class="graph-modal__select" id="modalEdgeConfidence">' +
            '<option value="1.0" selected>Точно (по умолчанию)</option>' +
            '<option value="0.6">Возможно</option>' +
            '<option value="0.3">Сомнительно</option>' +
            '<option value="custom">Своё значение…</option>' +
          '</select>' +
          '<input class="graph-modal__input" id="modalEdgeConfidenceCustom" ' +
            'type="number" min="0" max="1" step="0.05" value="1.0" ' +
            'style="display:none; margin-top:8px;"/>' +
        '</div>' +
      '</details>' +
      '<div class="graph-modal__error" id="modalEdgeError" style="display:none;"></div>' +
      '<div class="graph-modal__actions">' +
        '<button class="graph-btn" id="modalEdgeCancel">Отмена</button>' +
        '<button class="graph-btn graph-btn--primary" id="modalEdgeSave">Создать</button>' +
      '</div>';
    openModal(html, { onMount: function() {
      setupAutocomplete("modalEdgeTarget", "modalEdgeTargetId", "modalEdgeTargetAc");
      var selEl = document.getElementById("modalEdgeConfidence");
      var customEl = document.getElementById("modalEdgeConfidenceCustom");
      selEl.addEventListener("change", function() {
        if (selEl.value === "custom") {
          customEl.style.display = "block";
          customEl.focus();
        } else {
          customEl.style.display = "none";
        }
      });
      document.getElementById("modalEdgeCancel").addEventListener("click", closeModal);
      document.getElementById("modalEdgeSave").addEventListener("click", function() { submitCreateEdge(fromNode); });
    }});
  }

  function getEdgeConfidence() {
    var selEl = document.getElementById("modalEdgeConfidence");
    var customEl = document.getElementById("modalEdgeConfidenceCustom");
    if (selEl.value === "custom") {
      var v = parseFloat(customEl.value);
      if (isNaN(v)) return 1.0;
      if (v < 0) return 0;
      if (v > 1) return 1;
      return v;
    }
    return parseFloat(selEl.value);
  }

  async function submitCreateEdge(fromNode) {
    var targetId = document.getElementById("modalEdgeTargetId").value;
    var relation = document.getElementById("modalEdgeRelation").value.trim();
    var errEl = document.getElementById("modalEdgeError");
    errEl.style.display = "none";
    if (!targetId) { showModalError(errEl, "Выберите целевой узел из списка"); return; }
    if (!relation) { showModalError(errEl, "Укажите тип связи"); return; }
    var conf = getEdgeConfidence();
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

  // ================== Память инженера: «Записать случай» ==================
  // Автокомплит, отфильтрованный по типу узла (equipment / object).
  // Использует существующий generic-список узлов с фильтром по type
  // и nameSearch. Позволяет ввести новое имя (тогда hidden id пустой).
  function setupTypedAutocomplete(inputId, hiddenInputId, dropdownId, type) {
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
        apiGet("/api/v2/graph/nodes?type=" + encodeURIComponent(type) +
          "&nameSearch=" + encodeURIComponent(q) + "&limit=10").then(function(data) {
          var results = data.items || [];
          if (results.length === 0) { dropdown.style.display = "none"; return; }
          dropdown.innerHTML = "";
          for (var i = 0; i < results.length; i++) {
            (function(n) {
              var tInfo = getTypeLabel(n.type);
              var item = el("div", { className: "ac-item" }, tInfo.icon + " " + n.name);
              item.addEventListener("click", function() {
                input.value = n.name;
                hidden.value = n.id;
                dropdown.style.display = "none";
              });
              dropdown.appendChild(item);
            })(results[i]);
          }
          dropdown.style.display = "";
        }).catch(function() { dropdown.style.display = "none"; });
      }, 250);
    });
    input.addEventListener("blur", function() {
      setTimeout(function() { dropdown.style.display = "none"; }, 200);
    });
  }

  function todayIso() {
    var d = new Date();
    var pad = function(n) { return n < 10 ? "0" + n : "" + n; };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function openRecordCaseModal() {
    var tipEquip = "Что обслуживали: датчик, насос, кабель, автомат. Если такое оборудование уже есть в памяти — выберите из подсказки, иначе будет создано новое.";
    var tipObject = "Где находится оборудование: установка, площадка, объект. Опционально.";
    var tipFault = "Что произошло: суть неисправности или отказа. Обязательное поле.";
    var tipSolution = "Что сделали для устранения. Опционально — если решение пока неизвестно.";
    var html = '<h3 class="graph-modal__title">📝 Записать случай</h3>' +
      '<div class="graph-modal__row ac-wrap">' +
        '<label class="graph-modal__label">Оборудование <span style="color:var(--danger);">*</span>' +
          '<span class="hint" data-tip="' + escAttr(tipEquip) + '">?</span>' +
        '</label>' +
        '<input class="graph-modal__input" id="caseEquip" placeholder="например: Метран-150"/>' +
        '<input type="hidden" id="caseEquipId" value="">' +
        '<div class="ac-dropdown" id="caseEquipAc" style="display:none;"></div>' +
      '</div>' +
      '<div class="graph-modal__row">' +
        '<label class="graph-modal__label">Модель (опционально)</label>' +
        '<input class="graph-modal__input" id="caseEquipModel" placeholder="например: Метран-150-CG"/>' +
      '</div>' +
      '<div class="graph-modal__row">' +
        '<label class="graph-modal__label">Место (опционально)</label>' +
        '<input class="graph-modal__input" id="caseEquipLocation" placeholder="например: насосная №2"/>' +
      '</div>' +
      '<div class="graph-modal__row ac-wrap">' +
        '<label class="graph-modal__label">Объект / площадка (опционально)' +
          '<span class="hint" data-tip="' + escAttr(tipObject) + '">?</span>' +
        '</label>' +
        '<input class="graph-modal__input" id="caseObject" placeholder="например: КНС-6 ЦППД-4"/>' +
        '<input type="hidden" id="caseObjectId" value="">' +
        '<div class="ac-dropdown" id="caseObjectAc" style="display:none;"></div>' +
      '</div>' +
      '<div class="graph-modal__row">' +
        '<label class="graph-modal__label">Что произошло <span style="color:var(--danger);">*</span>' +
          '<span class="hint" data-tip="' + escAttr(tipFault) + '">?</span>' +
        '</label>' +
        '<textarea class="graph-modal__textarea" id="caseFault" placeholder="например: дрейф нуля"></textarea>' +
      '</div>' +
      '<div class="graph-modal__row">' +
        '<label class="graph-modal__label">Что сделали (опционально)' +
          '<span class="hint" data-tip="' + escAttr(tipSolution) + '">?</span>' +
        '</label>' +
        '<textarea class="graph-modal__textarea" id="caseSolution" placeholder="например: продувка импульсной линии"></textarea>' +
      '</div>' +
      '<div class="graph-modal__row">' +
        '<label class="graph-modal__label">Дата</label>' +
        '<input class="graph-modal__input" type="date" id="caseDate" value="' + escAttr(todayIso()) + '"/>' +
      '</div>' +
      '<div class="graph-modal__row">' +
        '<label class="graph-modal__label">Связанный документ (опционально)</label>' +
        '<select class="graph-modal__select" id="caseDocument"><option value="">— без документа —</option></select>' +
      '</div>' +
      '<div class="graph-modal__error" id="caseError" style="display:none;"></div>' +
      '<div class="graph-modal__actions">' +
        '<button class="graph-btn" id="caseCancel">Отмена</button>' +
        '<button class="graph-btn graph-btn--primary" id="caseSave">Записать</button>' +
      '</div>';
    openModal(html, { onMount: function() {
      setupTypedAutocomplete("caseEquip", "caseEquipId", "caseEquipAc", "equipment");
      setupTypedAutocomplete("caseObject", "caseObjectId", "caseObjectAc", "object");
      loadDocumentsIntoSelect("caseDocument");
      document.getElementById("caseCancel").addEventListener("click", closeModal);
      document.getElementById("caseSave").addEventListener("click", submitRecordCase);
    }});
  }

  function loadDocumentsIntoSelect(selectId) {
    var sel = document.getElementById(selectId);
    if (!sel) return;
    // Эндпоинт /documents отвечает { items: [...] } без поля ok,
    // поэтому используем обычный fetch, а не apiGet.
    fetch("/documents?limit=200").then(function(r) { return r.json(); }).then(function(data) {
      var items = (data && data.items) || [];
      for (var i = 0; i < items.length; i++) {
        var doc = items[i];
        var title = doc.title || doc.original_file_name || ("Документ " + doc.id);
        var opt = document.createElement("option");
        opt.value = doc.id;
        opt.textContent = title;
        sel.appendChild(opt);
      }
    }).catch(function() { /* документы опциональны — молча игнорируем */ });
  }

  async function submitRecordCase() {
    var errEl = document.getElementById("caseError");
    errEl.style.display = "none";
    var saveBtn = document.getElementById("caseSave");

    var equipId = document.getElementById("caseEquipId").value;
    var equipName = document.getElementById("caseEquip").value.trim();
    var faultText = document.getElementById("caseFault").value.trim();

    if (!equipId && !equipName) {
      showModalError(errEl, "Укажите оборудование"); return;
    }
    if (!faultText) {
      showModalError(errEl, "Заполните «Что произошло»"); return;
    }

    var body = { faultText: faultText };
    if (equipId) body.equipmentId = equipId; else body.equipmentName = equipName;
    var model = document.getElementById("caseEquipModel").value.trim();
    if (model) body.equipmentModel = model;
    var location = document.getElementById("caseEquipLocation").value.trim();
    if (location) body.equipmentLocation = location;
    var objectId = document.getElementById("caseObjectId").value;
    var objectName = document.getElementById("caseObject").value.trim();
    if (objectId) body.objectId = objectId; else if (objectName) body.objectName = objectName;
    var solutionText = document.getElementById("caseSolution").value.trim();
    if (solutionText) body.solutionText = solutionText;
    var date = document.getElementById("caseDate").value;
    if (date) body.date = date;
    var documentId = document.getElementById("caseDocument").value;
    if (documentId) body.documentId = documentId;

    saveBtn.disabled = true;
    var origText = saveBtn.textContent;
    saveBtn.textContent = "Сохранение…";
    try {
      var res = await apiPost("/api/v2/graph/case", body);
      var parts = [];
      if (res.created && res.created.equipment) parts.push("оборудование");
      parts.push("неисправность");
      if (res.created && res.created.solution) parts.push("решение");
      if (res.created && res.created.object) parts.push("объект");
      toast("Создано: " + parts.join(" / "), "success");
      closeModal();
      await loadRoots();
      if (res.nodes && res.nodes.fault) selectNode(res.nodes.fault.id);
    } catch (err) {
      saveBtn.disabled = false;
      saveBtn.textContent = origText;
      showModalError(errEl, err.message);
    }
  }

  // ================== Init ==================
  function init() {
    setupSearch();
    elBtnCreate.addEventListener("click", openCreateNodeModal);
    elBtnRecordCase.addEventListener("click", openRecordCaseModal);
    loadRoots();
  }
  init();
})();
  