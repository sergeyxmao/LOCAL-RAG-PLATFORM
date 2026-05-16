function renderChatCss() {
  return `
    .chat-page {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 320px;
      min-height: 0;
    }
    .chat-page.is-filters-collapsed { grid-template-columns: 1fr 0; }
    .chat-page__main {
      display: flex;
      flex-direction: column;
      min-width: 0;
      min-height: 0;
    }
    .chat-mode-row {
      padding: 12px 24px;
      border-bottom: 1px solid var(--border);
      background: var(--surface);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .chat-mode-toggle {
      display: inline-flex;
      background: var(--surface-2);
      border-radius: 8px;
      padding: 4px;
      gap: 2px;
    }
    .chat-mode-toggle__btn {
      border: none;
      background: transparent;
      color: var(--text-muted);
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      transition: background 0.12s ease, color 0.12s ease;
    }
    .chat-mode-toggle__btn.is-active {
      background: var(--surface);
      color: var(--text-strong);
      box-shadow: 0 1px 2px rgba(0,0,0,0.06);
    }
    html[data-theme="dark"] .chat-mode-toggle__btn.is-active {
      background: var(--accent-soft);
      color: var(--accent);
    }
    .chat-mode-hint {
      font-size: 12px;
      color: var(--text-muted);
    }
    .chat-mode-hint .mono { color: var(--text); }
    .chat-mode-row__group {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .provider-toggle {
      display: inline-flex;
      background: var(--surface-2);
      border-radius: 8px;
      padding: 4px;
      gap: 2px;
    }
    .provider-toggle__btn {
      border: none;
      background: transparent;
      color: var(--text-muted);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      display: inline-flex;
      gap: 6px;
      align-items: center;
      cursor: pointer;
    }
    .provider-toggle__btn.is-active {
      background: var(--surface);
      color: var(--text-strong);
      box-shadow: 0 1px 2px rgba(0,0,0,0.06);
    }
    html[data-theme="dark"] .provider-toggle__btn.is-active {
      background: var(--accent-soft);
      color: var(--accent);
    }
    .provider-toggle__btn[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .cloud-banner {
      margin: 8px 24px 0;
      padding: 8px 12px;
      border-radius: 8px;
      background: rgba(245, 158, 11, 0.10);
      color: #B45309;
      border: 1px solid rgba(245, 158, 11, 0.25);
      font-size: 12px;
      display: none;
      align-items: center;
      gap: 6px;
    }
    html[data-theme="dark"] .cloud-banner {
      color: #FCD34D;
      background: rgba(245, 158, 11, 0.10);
      border-color: rgba(245, 158, 11, 0.30);
    }
    .cloud-banner.is-visible { display: flex; }
    .msg__error {
      margin-top: 6px;
      padding: 8px 10px;
      border-radius: 8px;
      background: rgba(239, 68, 68, 0.10);
      color: var(--danger);
      border: 1px solid rgba(239, 68, 68, 0.30);
      font-size: 13px;
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }
    .msg__error button {
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 4px 10px;
      border-radius: 6px;
      font: inherit;
      font-size: 12px;
      cursor: pointer;
    }
    .msg__error button:hover { background: var(--surface-2); }
    .filter-summary {
      font-size: 12px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .filter-summary__chip {
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--surface-2);
      color: var(--text);
      font-family: "JetBrains Mono", monospace;
      font-size: 11px;
    }

    .chat-stream {
      flex: 1;
      overflow-y: auto;
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .chat-empty {
      margin: auto;
      max-width: 480px;
      text-align: center;
      color: var(--text-muted);
    }
    .chat-empty h2 {
      color: var(--text-strong);
      margin: 0 0 8px;
    }
    .chat-empty__hints {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: stretch;
    }
    .chat-empty__hint {
      padding: 10px 14px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      text-align: left;
      color: var(--text);
      cursor: pointer;
      transition: background 0.12s ease, border-color 0.12s ease;
    }
    .chat-empty__hint:hover { background: var(--surface-2); border-color: var(--border-strong); }

    .msg {
      display: flex;
      gap: 10px;
      max-width: min(820px, 96%);
    }
    .msg--user {
      align-self: flex-end;
      flex-direction: row-reverse;
    }
    .msg__avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      flex: 0 0 28px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--surface-2);
      color: var(--text-muted);
      margin-top: 2px;
      font-size: 12px;
      font-family: "JetBrains Mono", monospace;
    }
    .msg--user .msg__avatar {
      background: var(--accent);
      color: white;
    }
    .msg__body {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
      max-width: 100%;
    }
    .msg__bubble {
      padding: 10px 14px;
      border-radius: 12px;
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--text);
      white-space: pre-wrap;
      word-wrap: break-word;
      line-height: 1.55;
    }
    .msg--user .msg__bubble {
      background: var(--accent);
      color: white;
      border-color: var(--accent);
    }
    .msg__meta {
      font-size: 11px;
      color: var(--text-muted);
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }
    .msg__meta .mono { font-family: "JetBrains Mono", monospace; }

    .typing-dots {
      display: inline-flex;
      gap: 4px;
      padding: 6px 4px;
    }
    .typing-dots span {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--text-muted);
      animation: typing 1.2s infinite ease-in-out;
    }
    .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
    .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes typing {
      0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
      40% { opacity: 1; transform: translateY(-2px); }
    }

    .sources {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 4px;
    }
    .sources__title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
    }
    .source-card {
      display: flex;
      gap: 8px;
      padding: 8px 10px;
      border-radius: 8px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      align-items: flex-start;
      font-size: 12px;
    }
    .source-card__icon {
      color: var(--accent);
      flex: 0 0 auto;
      margin-top: 2px;
    }
    .source-card__main { flex: 1; min-width: 0; }
    .source-card__title {
      color: var(--text-strong);
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .source-card__title .mono { color: var(--text-muted); font-size: 11px; }
    .source-card__snippet {
      color: var(--text-muted);
      margin-top: 2px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .source-card__snippet.is-expanded {
      -webkit-line-clamp: unset;
      overflow: visible;
    }
    .source-card__toggle {
      background: none;
      border: none;
      color: var(--accent);
      font-size: 11px;
      padding: 2px 0;
    }
    .source-card__link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--accent);
      font-size: 11px;
    }

    .composer {
      border-top: 1px solid var(--border);
      padding: 14px 24px;
      background: var(--surface);
    }
    .composer__inner {
      display: flex;
      align-items: flex-end;
      gap: 10px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 8px 8px 8px 14px;
      max-width: 920px;
      margin: 0 auto;
    }
    .composer__inner:focus-within {
      border-color: var(--accent);
      box-shadow: 0 0 0 2px var(--accent-soft);
    }
    .composer__textarea {
      flex: 1;
      border: none;
      background: transparent;
      color: var(--text);
      font: inherit;
      resize: none;
      max-height: 156px;
      min-height: 22px;
      outline: none;
      padding: 4px 0;
    }
    .composer__textarea::placeholder { color: var(--text-muted); }
    .composer__send {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: none;
      background: var(--accent);
      color: white;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background 0.12s ease, opacity 0.12s ease;
    }
    .composer__send:hover:not([disabled]) { background: var(--accent-hover); }
    .composer__send[disabled] { opacity: 0.55; cursor: not-allowed; }
    .composer__hint {
      max-width: 920px;
      margin: 6px auto 0;
      color: var(--text-muted);
      font-size: 11px;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .filters-panel {
      border-left: 1px solid var(--border);
      background: var(--surface);
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
      transition: width 0.18s ease;
    }
    .chat-page.is-filters-collapsed .filters-panel { display: none; }
    .filters-panel__head {
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .filters-panel__title { font-weight: 600; color: var(--text-strong); }
    .filters-panel__body {
      padding: 12px 16px;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .filters-section__title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      margin-bottom: 8px;
    }
    .node-tree {
      display: flex;
      flex-direction: column;
      gap: 2px;
      max-height: 320px;
      overflow-y: auto;
      padding-right: 4px;
    }
    .node-row {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 6px;
      border-radius: 6px;
      font-size: 13px;
    }
    .node-row:hover { background: var(--surface-2); }
    .node-row__toggle {
      width: 18px;
      height: 18px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      background: transparent;
      border: none;
    }
    .node-row__toggle--hidden { visibility: hidden; }
    .node-row__checkbox {
      width: 16px;
      height: 16px;
      accent-color: var(--accent);
    }
    .node-row__label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .node-row__count {
      font-family: "JetBrains Mono", monospace;
      font-size: 11px;
      color: var(--text-muted);
    }
    .node-row__indeterminate { color: var(--accent); font-family: monospace; }

    .document-search {
      position: relative;
    }
    .document-search__input {
      width: 100%;
      padding: 8px 10px 8px 30px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--surface-2);
      color: var(--text);
      font: inherit;
      outline: none;
    }
    .document-search__input:focus { border-color: var(--accent); }
    .document-search__icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
    }
    .document-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
      max-height: 260px;
      overflow-y: auto;
      margin-top: 8px;
    }
    .document-row {
      display: flex;
      gap: 6px;
      align-items: center;
      padding: 6px 4px;
      border-radius: 6px;
      font-size: 13px;
    }
    .document-row:hover { background: var(--surface-2); }
    .document-row__label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .document-row__meta {
      font-family: "JetBrains Mono", monospace;
      font-size: 11px;
      color: var(--text-muted);
    }
    .filters-empty { color: var(--text-muted); font-size: 12px; padding: 8px 0; }

    .filters-panel__footer {
      padding: 12px 16px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }

    .toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--surface);
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
      padding: 10px 16px;
      border-radius: 8px;
      color: var(--text);
      font-size: 13px;
      z-index: 999;
      max-width: 80vw;
    }
    .toast--error { border-color: var(--danger); color: var(--danger); }

    @media (max-width: 1100px) {
      .chat-page { grid-template-columns: 1fr; }
      .filters-panel {
        position: fixed;
        top: 0;
        right: 0;
        width: 340px;
        height: 100vh;
        z-index: 30;
        box-shadow: var(--shadow);
        transform: translateX(100%);
        transition: transform 0.2s ease;
      }
      .chat-page.is-filters-open .filters-panel { transform: translateX(0); }
      .chat-page.is-filters-collapsed .filters-panel { display: flex; }
    }
  `;
}

function renderChatStateJson(initialState) {
  return JSON.stringify(initialState).replace(/</g, "\\u003c");
}

function renderChatScript(initialStateJson) {
  return `
    (function () {
      var INITIAL_STATE = ${initialStateJson};
      var state = {
        sessions: [],
        activeSessionId: null,
        messages: [],
        nodes: [],
        nodeCounts: {},
        documents: [],
        selectedNodeIds: new Set(),
        selectedDocumentIds: new Set(),
        nodeExpanded: new Set(),
        filtersOpen: false,
        loadingMessage: false,
        documentSearchTerm: "",
        cloudProvider: { configured: false, name: "Cloud", useByDefault: false },
        streamingController: null,
      };

      var dom = {
        history: document.getElementById("historyList"),
        newChatBtn: document.getElementById("newChatBtn"),
        modeToggle: document.getElementById("modeToggle"),
        modeHint: document.getElementById("modeHint"),
        providerToggle: document.getElementById("providerToggle"),
        cloudBanner: document.getElementById("cloudBanner"),
        filterSummary: document.getElementById("filterSummary"),
        stream: document.getElementById("chatStream"),
        textarea: document.getElementById("composerInput"),
        sendBtn: document.getElementById("composerSend"),
        filtersBtn: document.getElementById("filtersBtn"),
        filtersPanel: document.getElementById("filtersPanel"),
        closeFiltersBtn: document.getElementById("closeFiltersBtn"),
        nodeTree: document.getElementById("nodeTree"),
        documentList: document.getElementById("documentList"),
        documentSearch: document.getElementById("documentSearch"),
        resetFiltersBtn: document.getElementById("resetFiltersBtn"),
        applyFiltersBtn: document.getElementById("applyFiltersBtn"),
        chatPage: document.getElementById("chatPage"),
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
        var opts = { method: method, headers: { "Content-Type": "application/json" } };
        if (body !== undefined) opts.body = JSON.stringify(body);
        return fetch(path, opts).then(function (response) {
          return response.json().then(function (data) {
            if (!response.ok || (data && data.ok === false)) {
              var error = new Error((data && data.error) || ("HTTP " + response.status));
              error.status = response.status;
              throw error;
            }
            return data;
          });
        });
      }

      function fmtTime(value) {
        if (!value) return "";
        try {
          var d = new Date(value);
          return d.toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
        } catch (err) { return ""; }
      }

      function renderHistory() {
        if (!dom.history) return;
        if (!state.sessions.length) {
          dom.history.innerHTML = '<div class="sidebar__empty">История пуста. Задайте первый вопрос.</div>';
          return;
        }
        dom.history.innerHTML = state.sessions.map(function (session) {
          var isActive = session.id === state.activeSessionId ? " is-active" : "";
          return '<div class="sidebar__history-item' + isActive + '" data-session-id="' + escapeHtml(session.id) + '">' +
            '<span class="sidebar__history-title" title="' + escapeHtml(session.title) + '">' + escapeHtml(session.title) + '</span>' +
            '<button type="button" class="sidebar__history-delete" data-action="delete-session" data-session-id="' + escapeHtml(session.id) + '" aria-label="Удалить чат">' +
            INITIAL_STATE.icons.trash +
            '</button></div>';
        }).join("");
      }

      function getActiveSession() {
        return state.sessions.find(function (s) { return s.id === state.activeSessionId; }) || null;
      }

      function getActiveMode() {
        var s = getActiveSession();
        return s ? s.mode : "answer";
      }

      function getActiveProvider() {
        var s = getActiveSession();
        return (s && s.provider) || (state.cloudProvider.useByDefault && state.cloudProvider.configured ? "cloud" : "local");
      }

      function renderProviderToggle() {
        if (!dom.providerToggle) return;
        var current = getActiveProvider();
        var configured = state.cloudProvider.configured;
        var name = state.cloudProvider.name || "Cloud";
        var localBtn = dom.providerToggle.querySelector('[data-provider="local"]');
        var cloudBtn = dom.providerToggle.querySelector('[data-provider="cloud"]');
        if (localBtn) localBtn.classList.toggle("is-active", current === "local");
        if (cloudBtn) {
          cloudBtn.classList.toggle("is-active", current === "cloud");
          cloudBtn.disabled = !configured;
          cloudBtn.title = configured ? ("Облако: " + name) : "Настройте облако в разделе Настройки";
          var labelSpan = cloudBtn.querySelector(".provider-toggle__name");
          if (labelSpan) labelSpan.textContent = name;
        }
        if (dom.cloudBanner) {
          if (current === "cloud" && configured) {
            dom.cloudBanner.classList.add("is-visible");
            dom.cloudBanner.innerHTML = "Фрагменты документов уйдут во внешний API (" + escapeHtml(name) + ").";
          } else {
            dom.cloudBanner.classList.remove("is-visible");
            dom.cloudBanner.innerHTML = "";
          }
        }
      }

      function loadCloudProviderInfo() {
        return fetch("/api/v2/settings/cloudProvider").then(function (r) {
          return r.json().then(function (data) {
            if (data && data.ok && data.cloudProvider) {
              state.cloudProvider = {
                configured: data.cloudProvider.configured === true,
                name: data.cloudProvider.name || "Cloud",
                useByDefault: data.cloudProvider.useByDefault === true,
              };
            }
          });
        }).catch(function () {
          state.cloudProvider = { configured: false, name: "Cloud", useByDefault: false };
        });
      }

      function setProvider(provider) {
        if (provider === "cloud" && !state.cloudProvider.configured) {
          showToast("Облако не настроено. Откройте раздел Настройки.", "error");
          return Promise.resolve();
        }
        if (!state.activeSessionId) {
          return createSession(getActiveMode() || "answer", provider).then(renderProviderToggle);
        }
        var session = getActiveSession();
        if (!session) return Promise.resolve();
        session.provider = provider;
        renderProviderToggle();
        return api("PATCH", "/api/v2/chat/sessions/" + state.activeSessionId, { provider: provider }).then(function (data) {
          var idx = state.sessions.findIndex(function (s) { return s.id === state.activeSessionId; });
          if (idx >= 0) state.sessions[idx] = data.session;
          renderProviderToggle();
        }).catch(function (err) {
          showToast("Не удалось сохранить выбор провайдера: " + err.message, "error");
        });
      }

      function renderModeToggle() {
        if (!dom.modeToggle) return;
        var mode = getActiveMode();
        dom.modeToggle.querySelectorAll(".chat-mode-toggle__btn").forEach(function (btn) {
          btn.classList.toggle("is-active", btn.getAttribute("data-mode") === mode);
        });
        if (dom.modeHint) {
          dom.modeHint.innerHTML = mode === "pages"
            ? 'Режим: <span class="mono">найти страницы</span> — без ответа ИИ, только страницы документов.'
            : 'Режим: <span class="mono">ответ ИИ</span> — модель ответит по найденным источникам.';
        }
      }

      function renderFilterSummary() {
        if (!dom.filterSummary) return;
        var nodeCount = state.selectedNodeIds.size;
        var docCount = state.selectedDocumentIds.size;
        if (!nodeCount && !docCount) {
          dom.filterSummary.innerHTML = '<span>Фильтры не заданы — поиск идёт по всей базе.</span>';
          return;
        }
        var chips = [];
        if (nodeCount) chips.push('<span class="filter-summary__chip">' + nodeCount + ' разд.</span>');
        if (docCount) chips.push('<span class="filter-summary__chip">' + docCount + ' док.</span>');
        dom.filterSummary.innerHTML = '<span>Активные фильтры:</span>' + chips.join("");
      }

      function renderEmpty() {
        var hints = [
          "Какие документы есть в базе?",
          "Найди страницы со схемами по уровню",
          "Что делает функциональный блок XYZ?",
        ];
        var hintsHtml = hints.map(function (text) {
          return '<button type="button" class="chat-empty__hint" data-hint="' + escapeHtml(text) + '">' + escapeHtml(text) + '</button>';
        }).join("");
        dom.stream.innerHTML = '<div class="chat-empty">' +
          '<h2>Задайте первый вопрос</h2>' +
          '<p>Локальный консультант ответит по вашим документам. Старая база уже подключена — фильтры в правой панели позволяют сузить поиск.</p>' +
          '<div class="chat-empty__hints">' + hintsHtml + '</div>' +
          '</div>';
      }

      function renderSource(source, index) {
        var title = source.documentName || source.sourcePath || "Источник " + (index + 1);
        var pageBadge = source.page ? '<span class="mono">стр. ' + escapeHtml(source.page) + '</span>' : '';
        var snippet = (source.snippet || "").replace(/\\s+/g, " ").trim();
        var snippetHtml = snippet
          ? '<div class="source-card__snippet">' + escapeHtml(snippet) + '</div>'
          : '';
        var link = source.assetUrl
          ? '<a class="source-card__link" href="' + escapeHtml(source.assetUrl) + '" target="_blank" rel="noopener">Открыть' + INITIAL_STATE.icons.externalLink + '</a>'
          : '';
        return '<div class="source-card">' +
          '<span class="source-card__icon">' + INITIAL_STATE.icons.fileText + '</span>' +
          '<div class="source-card__main">' +
          '<div class="source-card__title"><span>' + escapeHtml(title) + '</span>' + pageBadge + link + '</div>' +
          snippetHtml +
          '</div></div>';
      }

      function renderMessage(message, opts) {
        opts = opts || {};
        var isUser = message.role === "user";
        var avatar = isUser ? "вы" : "ИИ";
        var contentHtml;
        if (opts.typing) {
          contentHtml = '<div class="msg__bubble"><span class="typing-dots"><span></span><span></span><span></span></span></div>';
        } else {
          contentHtml = '<div class="msg__bubble">' + escapeHtml(message.content) + '</div>';
        }
        var sources = Array.isArray(message.sources) ? message.sources : [];
        var sourcesHtml = "";
        if (!isUser && sources.length) {
          sourcesHtml = '<div class="sources">' +
            '<div class="sources__title">Источники (' + sources.length + ')</div>' +
            sources.map(renderSource).join("") + '</div>';
        }
        var metaParts = [];
        if (message.createdAt) metaParts.push('<span class="mono">' + fmtTime(message.createdAt) + '</span>');
        var errorHtml = "";
        if (!isUser && message.metadata) {
          var meta = message.metadata;
          if (meta.model) metaParts.push('<span class="mono">' + escapeHtml(meta.model) + '</span>');
          else if (meta.mode) metaParts.push('<span>' + escapeHtml(meta.mode) + '</span>');
          if (meta.provider === "cloud" && (typeof meta.tokensIn === "number" || typeof meta.tokensOut === "number")) {
            metaParts.push('<span class="mono">' + (meta.tokensIn || 0) + ' in / ' + (meta.tokensOut || 0) + ' out</span>');
          }
          if (typeof meta.durationMs === "number") {
            metaParts.push('<span class="mono">' + Math.round(meta.durationMs) + ' мс</span>');
          }
          if (meta.error && meta.error.code) {
            var showSwitch = meta.provider === "cloud" && meta.error.code !== "no_credentials";
            errorHtml = '<div class="msg__error">' +
              '<span>' + escapeHtml(meta.error.message || ("Ошибка: " + meta.error.code)) + '</span>' +
              (showSwitch ? '<button type="button" data-action="switch-to-local" data-msg-id="' + escapeHtml(message.id) + '">Переключиться на локальный ИИ</button>' : '') +
              '</div>';
          }
        }
        var metaHtml = metaParts.length ? '<div class="msg__meta">' + metaParts.join("") + '</div>' : '';
        return '<article class="msg msg--' + (isUser ? "user" : "assistant") + '">' +
          '<div class="msg__avatar">' + avatar + '</div>' +
          '<div class="msg__body">' + contentHtml + errorHtml + sourcesHtml + metaHtml + '</div>' +
          '</article>';
      }

      function renderStream() {
        if (!state.activeSessionId) {
          renderEmpty();
          return;
        }
        if (!state.messages.length) {
          renderEmpty();
          return;
        }
        var html = state.messages.map(function (msg) {
          if (msg.streaming === true && !msg.content) return renderMessage(msg, { typing: true });
          return renderMessage(msg, { streaming: msg.streaming === true });
        }).join("");
        dom.stream.innerHTML = html;
        dom.stream.scrollTop = dom.stream.scrollHeight;
      }

      function autoresizeTextarea() {
        var el = dom.textarea;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 156) + "px";
      }

      function setSendDisabled(disabled) {
        dom.sendBtn.disabled = disabled;
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

      function getNodeSelectionState(nodeId) {
        if (state.selectedNodeIds.has(nodeId)) return "full";
        var descendants = getDescendantIds(nodeId);
        var anySelected = false;
        descendants.forEach(function (id) { if (state.selectedNodeIds.has(id)) anySelected = true; });
        return anySelected ? "indeterminate" : "none";
      }

      function toggleNodeSelection(nodeId, checked) {
        var descendants = getDescendantIds(nodeId);
        if (checked) {
          state.selectedNodeIds.add(nodeId);
          descendants.forEach(function (id) { state.selectedNodeIds.add(id); });
        } else {
          state.selectedNodeIds.delete(nodeId);
          descendants.forEach(function (id) { state.selectedNodeIds.delete(id); });
        }
        var current = getNodeById(nodeId);
        while (current && current.parentId) {
          var parent = getNodeById(current.parentId);
          if (!parent) break;
          var siblings = getDescendantIds(parent.id);
          var allSelected = true;
          siblings.forEach(function (id) { if (!state.selectedNodeIds.has(id)) allSelected = false; });
          if (allSelected && siblings.size > 0) {
            state.selectedNodeIds.add(parent.id);
          } else {
            state.selectedNodeIds.delete(parent.id);
          }
          current = parent;
        }
      }

      function renderNodeTree() {
        if (!dom.nodeTree) return;
        if (!state.nodes.length) {
          dom.nodeTree.innerHTML = '<div class="filters-empty">Дерево разделов пока пустое.</div>';
          return;
        }
        var children = nodeChildrenMap();
        var html = [];
        function walk(node, depth) {
          var kids = children[node.id] || [];
          var hasChildren = kids.length > 0;
          var expanded = state.nodeExpanded.has(node.id);
          var selectionState = getNodeSelectionState(node.id);
          var counts = state.nodeCounts[node.id] || { scopeDocuments: 0 };
          var toggleIcon = hasChildren
            ? (expanded ? INITIAL_STATE.icons.chevronDown : INITIAL_STATE.icons.chevronRight)
            : "";
          var toggleClass = hasChildren
            ? "node-row__toggle"
            : "node-row__toggle node-row__toggle--hidden";
          var indeterminateMark = selectionState === "indeterminate"
            ? '<span class="node-row__indeterminate">─</span>'
            : '';
          html.push('<div class="node-row" style="padding-left:' + (depth * 14 + 4) + 'px" data-node-id="' + escapeHtml(node.id) + '">' +
            '<button type="button" class="' + toggleClass + '" data-action="toggle-node" data-node-id="' + escapeHtml(node.id) + '">' + toggleIcon + '</button>' +
            '<input type="checkbox" class="node-row__checkbox" data-action="select-node" data-node-id="' + escapeHtml(node.id) + '" ' +
            (selectionState === "full" ? "checked" : "") + ' />' +
            indeterminateMark +
            '<span class="node-row__label" title="' + escapeHtml(node.name) + '">' + escapeHtml(node.name) + '</span>' +
            '<span class="node-row__count mono">' + escapeHtml(counts.scopeDocuments || 0) + '</span>' +
            '</div>');
          if (hasChildren && expanded) {
            kids.forEach(function (child) { walk(child, depth + 1); });
          }
        }
        (children.__root__ || []).forEach(function (root) { walk(root, 0); });
        dom.nodeTree.innerHTML = html.join("");
      }

      function renderDocuments() {
        if (!dom.documentList) return;
        var term = state.documentSearchTerm.toLowerCase().trim();
        var docs = state.documents.filter(function (d) {
          if (!term) return true;
          var hay = ((d.title || "") + " " + (d.source_path || "")).toLowerCase();
          return hay.indexOf(term) !== -1;
        });
        if (!docs.length) {
          var note = state.selectedNodeIds.size
            ? "В выбранных разделах документов не найдено."
            : "Выберите раздел, чтобы увидеть документы. Или ищите по всей базе.";
          dom.documentList.innerHTML = '<div class="filters-empty">' + note + '</div>';
          return;
        }
        dom.documentList.innerHTML = docs.slice(0, 200).map(function (doc) {
          var selected = state.selectedDocumentIds.has(doc.id) ? "checked" : "";
          return '<label class="document-row">' +
            '<input type="checkbox" class="node-row__checkbox" data-action="select-document" data-doc-id="' + escapeHtml(doc.id) + '" ' + selected + ' />' +
            '<span class="document-row__label" title="' + escapeHtml(doc.title || doc.source_path || doc.id) + '">' + escapeHtml(doc.title || doc.source_path || doc.id) + '</span>' +
            '<span class="document-row__meta mono">' + escapeHtml(doc.asset_count || doc.chunk_count || "") + '</span>' +
            '</label>';
        }).join("");
      }

      function ensureSessionFromInitial() {
        if (!state.activeSessionId && state.sessions.length) {
          state.activeSessionId = state.sessions[0].id;
        }
      }

      function loadSessions() {
        return api("GET", "/api/v2/chat/sessions").then(function (data) {
          state.sessions = data.sessions || [];
          ensureSessionFromInitial();
          renderHistory();
          renderModeToggle();
          renderProviderToggle();
          renderFilterSummary();
        });
      }

      function loadActiveSession() {
        if (!state.activeSessionId) {
          state.messages = [];
          renderStream();
          return Promise.resolve();
        }
        return api("GET", "/api/v2/chat/sessions/" + state.activeSessionId).then(function (data) {
          state.messages = data.messages || [];
          var session = data.session;
          state.selectedNodeIds = new Set((session.filters && session.filters.nodeIds) || []);
          state.selectedDocumentIds = new Set((session.filters && session.filters.documentIds) || []);
          var idx = state.sessions.findIndex(function (s) { return s.id === state.activeSessionId; });
          if (idx >= 0) state.sessions[idx] = session;
          renderHistory();
          renderModeToggle();
          renderProviderToggle();
          renderFilterSummary();
          renderStream();
          renderNodeTree();
          renderDocuments();
        });
      }

      function loadNodes() {
        return Promise.all([
          api("GET", "/nodes?format=flat"),
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
            };
          }).filter(function (n) { return n.isActive; });
          state.nodeCounts = (results[1] && results[1].byNodeId) || {};
          renderNodeTree();
        }).catch(function (err) {
          state.nodes = [];
          state.nodeCounts = {};
          dom.nodeTree.innerHTML = '<div class="filters-empty">Не удалось загрузить дерево разделов: ' + escapeHtml(err.message) + '</div>';
        });
      }

      function loadDocuments() {
        var promise;
        if (state.selectedNodeIds.size === 0) {
          promise = api("GET", "/documents?limit=200");
        } else {
          var firstNode = Array.from(state.selectedNodeIds)[0];
          promise = api("GET", "/documents?nodeId=" + encodeURIComponent(firstNode) + "&includeChildren=true&limit=200");
        }
        return promise.then(function (data) {
          state.documents = data.items || [];
          renderDocuments();
        }).catch(function (err) {
          state.documents = [];
          dom.documentList.innerHTML = '<div class="filters-empty">Не удалось загрузить документы: ' + escapeHtml(err.message) + '</div>';
        });
      }

      function createSession(mode, provider) {
        var payload = {
          title: "Новый чат",
          mode: mode || "answer",
          filters: { nodeIds: [], documentIds: [] },
        };
        if (provider) payload.provider = provider;
        return api("POST", "/api/v2/chat/sessions", payload).then(function (data) {
          state.sessions.unshift(data.session);
          state.activeSessionId = data.session.id;
          state.messages = [];
          state.selectedNodeIds = new Set();
          state.selectedDocumentIds = new Set();
          renderHistory();
          renderModeToggle();
          renderProviderToggle();
          renderFilterSummary();
          renderStream();
        });
      }

      function setMode(mode) {
        if (!state.activeSessionId) {
          return createSession(mode);
        }
        var session = getActiveSession();
        if (!session || session.mode === mode) {
          session.mode = mode;
          renderModeToggle();
          return Promise.resolve();
        }
        return api("PATCH", "/api/v2/chat/sessions/" + state.activeSessionId, { mode: mode }).then(function (data) {
          var idx = state.sessions.findIndex(function (s) { return s.id === state.activeSessionId; });
          if (idx >= 0) state.sessions[idx] = data.session;
          renderModeToggle();
        });
      }

      function applyFilters() {
        if (!state.activeSessionId) {
          return createSession("answer").then(applyFilters);
        }
        var filters = {
          nodeIds: Array.from(state.selectedNodeIds),
          documentIds: Array.from(state.selectedDocumentIds),
        };
        return api("PATCH", "/api/v2/chat/sessions/" + state.activeSessionId, { filters: filters }).then(function (data) {
          var idx = state.sessions.findIndex(function (s) { return s.id === state.activeSessionId; });
          if (idx >= 0) state.sessions[idx] = data.session;
          renderFilterSummary();
          showToast("Фильтры применены");
        }).catch(function (err) {
          showToast("Не удалось сохранить фильтры: " + err.message, "error");
        });
      }

      function resetFilters() {
        state.selectedNodeIds = new Set();
        state.selectedDocumentIds = new Set();
        renderNodeTree();
        renderDocuments();
      }

      function setComposerStreaming(streaming) {
        state.streamingController = streaming || null;
        dom.sendBtn.disabled = false;
        if (streaming) {
          dom.sendBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>';
          dom.sendBtn.setAttribute("aria-label", "Остановить");
          dom.sendBtn.title = "Остановить генерацию";
        } else {
          dom.sendBtn.innerHTML = INITIAL_STATE.icons.send || '↑';
          dom.sendBtn.setAttribute("aria-label", "Отправить");
          dom.sendBtn.title = "Отправить";
        }
      }

      function parseSseChunk(buffer) {
        var events = [];
        var sepIndex;
        while ((sepIndex = buffer.indexOf("\\n\\n")) >= 0) {
          var rawEvent = buffer.slice(0, sepIndex);
          buffer = buffer.slice(sepIndex + 2);
          var eventName = "message";
          var dataLines = [];
          rawEvent.split("\\n").forEach(function (line) {
            if (line.indexOf("event:") === 0) eventName = line.slice(6).trim();
            else if (line.indexOf("data:") === 0) dataLines.push(line.slice(5).replace(/^ /, ""));
          });
          if (dataLines.length > 0) {
            var dataStr = dataLines.join("\\n");
            var parsed;
            try { parsed = JSON.parse(dataStr); } catch (err) { parsed = null; }
            events.push({ event: eventName, data: parsed });
          }
        }
        return { events: events, rest: buffer };
      }

      function sendMessage() {
        if (state.streamingController) {
          try { state.streamingController.abort(); } catch (err) {}
          return;
        }
        var content = dom.textarea.value.trim();
        if (!content) return;
        var ensureSession = state.activeSessionId
          ? Promise.resolve()
          : createSession(getActiveMode() || "answer");
        ensureSession.then(function () {
          var sessionId = state.activeSessionId;
          var tmpUserId = "tmp-" + Date.now();
          state.messages.push({
            id: tmpUserId,
            role: "user",
            content: content,
            createdAt: new Date().toISOString(),
            sources: [],
          });
          var assistant = {
            id: "stream-" + Date.now(),
            role: "assistant",
            content: "",
            createdAt: new Date().toISOString(),
            sources: [],
            metadata: { provider: getActiveProvider() },
            streaming: true,
          };
          state.messages.push(assistant);
          dom.textarea.value = "";
          autoresizeTextarea();
          renderStream();

          var controller = new AbortController();
          setComposerStreaming(controller);

          fetch("/api/v2/chat/sessions/" + sessionId + "/messages/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: content }),
            signal: controller.signal,
          }).then(function (response) {
            if (!response.ok) throw new Error("HTTP " + response.status);
            var reader = response.body.getReader();
            var decoder = new TextDecoder();
            var buffer = "";
            function pump() {
              return reader.read().then(function (result) {
                if (result.done) return;
                buffer += decoder.decode(result.value, { stream: true });
                var parsed = parseSseChunk(buffer);
                buffer = parsed.rest;
                parsed.events.forEach(function (evt) {
                  if (!evt.data) return;
                  if (evt.event === "token") {
                    assistant.content += evt.data.text || "";
                    renderStream();
                  } else if (evt.event === "sources") {
                    assistant.sources = evt.data || [];
                    renderStream();
                  } else if (evt.event === "meta") {
                    if (evt.data.userMessageId) {
                      var u = state.messages.find(function (m) { return m.id === tmpUserId; });
                      if (u) u.id = evt.data.userMessageId;
                    }
                  } else if (evt.event === "done") {
                    assistant.id = evt.data.assistantMessageId || assistant.id;
                    if (evt.data.metadata) assistant.metadata = evt.data.metadata;
                    assistant.streaming = false;
                  } else if (evt.event === "error") {
                    assistant.metadata = Object.assign({}, assistant.metadata, { mode: "error", error: evt.data });
                    if (!assistant.content) assistant.content = evt.data.message || "Ошибка";
                    assistant.streaming = false;
                  }
                });
                return pump();
              });
            }
            return pump();
          }).then(function () {
            assistant.streaming = false;
            setComposerStreaming(null);
            renderStream();
            loadSessions();
          }).catch(function (err) {
            assistant.streaming = false;
            if (err.name === "AbortError") {
              if (!assistant.content) assistant.content = "(прервано пользователем)";
              assistant.metadata = Object.assign({}, assistant.metadata, { aborted: true });
            } else {
              assistant.metadata = Object.assign({}, assistant.metadata, { mode: "error", error: { code: "network", message: err.message } });
              if (!assistant.content) assistant.content = "Сбой соединения: " + err.message;
              showToast("Сбой стрима: " + err.message, "error");
            }
            setComposerStreaming(null);
            renderStream();
          });
        });
      }

      function switchToLocalAndRetry() {
        if (!state.activeSessionId) return;
        var lastUser = null;
        for (var i = state.messages.length - 1; i >= 0; i--) {
          if (state.messages[i].role === "user") { lastUser = state.messages[i]; break; }
        }
        setProvider("local").then(function () {
          if (lastUser) {
            dom.textarea.value = lastUser.content;
            autoresizeTextarea();
            sendMessage();
          }
        });
      }

      function openFilters() {
        state.filtersOpen = true;
        dom.chatPage.classList.remove("is-filters-collapsed");
        dom.chatPage.classList.add("is-filters-open");
        loadDocuments();
      }

      function closeFilters() {
        state.filtersOpen = false;
        dom.chatPage.classList.add("is-filters-collapsed");
        dom.chatPage.classList.remove("is-filters-open");
      }

      function bindEvents() {
        dom.modeToggle.addEventListener("click", function (event) {
          var btn = event.target.closest("[data-mode]");
          if (!btn) return;
          setMode(btn.getAttribute("data-mode"));
        });
        dom.newChatBtn.addEventListener("click", function () {
          createSession(getActiveMode() || "answer");
        });
        dom.history.addEventListener("click", function (event) {
          var deleteBtn = event.target.closest("[data-action='delete-session']");
          if (deleteBtn) {
            event.stopPropagation();
            var id = deleteBtn.getAttribute("data-session-id");
            if (!confirm("Удалить этот чат?")) return;
            api("DELETE", "/api/v2/chat/sessions/" + id).then(function () {
              state.sessions = state.sessions.filter(function (s) { return s.id !== id; });
              if (state.activeSessionId === id) {
                state.activeSessionId = state.sessions[0] ? state.sessions[0].id : null;
                loadActiveSession();
              } else {
                renderHistory();
              }
            }).catch(function (err) { showToast("Не удалось удалить: " + err.message, "error"); });
            return;
          }
          var item = event.target.closest("[data-session-id]");
          if (!item) return;
          var id = item.getAttribute("data-session-id");
          if (state.activeSessionId === id) return;
          state.activeSessionId = id;
          loadActiveSession();
        });
        dom.filtersBtn.addEventListener("click", function () {
          if (state.filtersOpen) closeFilters(); else openFilters();
        });
        dom.closeFiltersBtn.addEventListener("click", closeFilters);
        dom.nodeTree.addEventListener("click", function (event) {
          var toggleBtn = event.target.closest("[data-action='toggle-node']");
          if (toggleBtn) {
            var nodeId = toggleBtn.getAttribute("data-node-id");
            if (state.nodeExpanded.has(nodeId)) {
              state.nodeExpanded.delete(nodeId);
            } else {
              state.nodeExpanded.add(nodeId);
            }
            renderNodeTree();
            return;
          }
        });
        dom.nodeTree.addEventListener("change", function (event) {
          var cb = event.target.closest("[data-action='select-node']");
          if (!cb) return;
          var nodeId = cb.getAttribute("data-node-id");
          toggleNodeSelection(nodeId, cb.checked);
          renderNodeTree();
          loadDocuments();
        });
        dom.documentList.addEventListener("change", function (event) {
          var cb = event.target.closest("[data-action='select-document']");
          if (!cb) return;
          var id = cb.getAttribute("data-doc-id");
          if (cb.checked) state.selectedDocumentIds.add(id); else state.selectedDocumentIds.delete(id);
        });
        dom.documentSearch.addEventListener("input", function (event) {
          state.documentSearchTerm = event.target.value;
          renderDocuments();
        });
        dom.applyFiltersBtn.addEventListener("click", applyFilters);
        dom.resetFiltersBtn.addEventListener("click", resetFilters);
        dom.textarea.addEventListener("input", autoresizeTextarea);
        dom.textarea.addEventListener("keydown", function (event) {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
          }
        });
        dom.sendBtn.addEventListener("click", sendMessage);
        dom.stream.addEventListener("click", function (event) {
          var hint = event.target.closest("[data-hint]");
          if (hint) {
            dom.textarea.value = hint.getAttribute("data-hint");
            autoresizeTextarea();
            dom.textarea.focus();
            return;
          }
          var snippetToggle = event.target.closest(".source-card__toggle");
          if (snippetToggle) {
            var sib = snippetToggle.previousElementSibling;
            if (sib) sib.classList.toggle("is-expanded");
          }
          var switchBtn = event.target.closest("[data-action='switch-to-local']");
          if (switchBtn) {
            switchToLocalAndRetry();
          }
        });

        if (dom.providerToggle) {
          dom.providerToggle.addEventListener("click", function (event) {
            var btn = event.target.closest("[data-provider]");
            if (!btn || btn.disabled) return;
            setProvider(btn.getAttribute("data-provider"));
          });
        }
      }

      function bootstrap() {
        dom.chatPage.classList.add("is-filters-collapsed");
        renderEmpty();
        bindEvents();
        loadCloudProviderInfo().then(loadSessions).then(loadActiveSession).then(loadNodes);
      }

      bootstrap();
    })();
  `;
}

export function renderChatPage({ ICONS, renderLayout }) {
  const sidebarExtra = `
    <div class="nav__group-title">История</div>
    <button type="button" class="btn" id="newChatBtn">${ICONS.plus}<span>Новый чат</span></button>
    <div class="sidebar__history">
      <div class="sidebar__history-list" id="historyList">
        <div class="sidebar__empty">История загружается…</div>
      </div>
    </div>
  `;

  const headerExtra = `
    <button type="button" class="btn" id="filtersBtn">${ICONS.filter}<span>Фильтры</span></button>
  `;

  const content = `
    <main class="chat-page" id="chatPage">
      <section class="chat-page__main">
        <div class="chat-mode-row">
          <div class="chat-mode-row__group">
            <div class="chat-mode-toggle" id="modeToggle" role="tablist" aria-label="Режим работы">
              <button type="button" class="chat-mode-toggle__btn is-active" data-mode="answer">Ответ ИИ</button>
              <button type="button" class="chat-mode-toggle__btn" data-mode="pages">Найти страницы</button>
            </div>
            <div class="provider-toggle" id="providerToggle" role="tablist" aria-label="Провайдер модели">
              <button type="button" class="provider-toggle__btn is-active" data-provider="local" title="Локальная Ollama"><span aria-hidden="true">🔒</span><span>Локально</span></button>
              <button type="button" class="provider-toggle__btn" data-provider="cloud" title="Облачный провайдер"><span aria-hidden="true">⚡</span><span class="provider-toggle__name">Облако</span></button>
            </div>
          </div>
          <div class="chat-mode-hint" id="modeHint">Режим: <span class="mono">ответ ИИ</span></div>
        </div>
        <div class="cloud-banner" id="cloudBanner"></div>
        <div class="chat-mode-row" style="border-top:none;padding-top:0;padding-bottom:10px;">
          <div class="filter-summary" id="filterSummary"><span>Фильтры не заданы — поиск идёт по всей базе.</span></div>
        </div>
        <div class="chat-stream" id="chatStream"></div>
        <div class="composer">
          <div class="composer__inner">
            <textarea id="composerInput" class="composer__textarea" rows="1" placeholder="Спросите по вашим документам… (Enter — отправить, Shift+Enter — перенос строки)"></textarea>
            <button type="button" class="composer__send" id="composerSend" aria-label="Отправить">${ICONS.send}</button>
          </div>
          <div class="composer__hint">
            <span><span class="mono">Enter</span> — отправить</span>
            <span><span class="mono">Shift+Enter</span> — перенос строки</span>
          </div>
        </div>
      </section>
      <aside class="filters-panel" id="filtersPanel" aria-label="Фильтры базы">
        <div class="filters-panel__head">
          <div class="filters-panel__title">Фильтры</div>
          <button type="button" class="btn btn--ghost btn--icon" id="closeFiltersBtn" aria-label="Закрыть фильтры">${ICONS.x}</button>
        </div>
        <div class="filters-panel__body">
          <div>
            <div class="filters-section__title">Разделы базы знаний</div>
            <div class="node-tree" id="nodeTree"><div class="filters-empty">Дерево загружается…</div></div>
          </div>
          <div>
            <div class="filters-section__title">Документы</div>
            <div class="document-search">
              <span class="document-search__icon">${ICONS.search}</span>
              <input class="document-search__input" id="documentSearch" type="search" placeholder="Поиск по названию документа" />
            </div>
            <div class="document-list" id="documentList"><div class="filters-empty">Выберите раздел или начните поиск.</div></div>
          </div>
        </div>
        <div class="filters-panel__footer">
          <button type="button" class="btn btn--ghost" id="resetFiltersBtn">Сбросить</button>
          <button type="button" class="btn btn--accent" id="applyFiltersBtn">Применить</button>
        </div>
      </aside>
    </main>
  `;

  const initialState = {
    icons: {
      fileText: ICONS.fileText,
      externalLink: ICONS.externalLink,
      trash: ICONS.trash,
      chevronRight: ICONS.chevronRight,
      chevronDown: ICONS.chevronDown,
      send: ICONS.send,
    },
  };

  return renderLayout({
    activeNav: "chat",
    pageTitle: "Чат",
    pageDocumentTitle: "Чат — LOCAL-RAG",
    content,
    headerExtra,
    sidebarExtra,
    pageScript: `${renderChatScript(renderChatStateJson(initialState))}`,
    bodyClass: "page-chat",
  }).replace("</style>", `${renderChatCss()}</style>`);
}
