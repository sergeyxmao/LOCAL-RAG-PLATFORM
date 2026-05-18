function renderSettingsCss() {
  return `
    .settings-page {
      flex: 1;
      padding: 18px 24px 32px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 14px;
      max-width: 920px;
      width: 100%;
      margin: 0 auto;
    }
    .settings-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
    }
    .settings-card__head {
      padding: 14px 18px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .settings-card__title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-strong);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .settings-card__title svg { color: var(--text-muted); }
    .settings-card__body {
      padding: 16px 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .settings-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .settings-row--triple { grid-template-columns: 1fr 1fr 1fr; }
    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
    }
    .settings-grid .settings-field { gap: 6px; }
    .settings-field .settings-toggle {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      cursor: pointer;
    }
    .settings-banner--warn {
      background: var(--warning-soft, var(--accent-soft));
      color: var(--warning, var(--accent));
      border: 1px solid var(--warning, var(--accent));
    }
    .settings-tabs {
      display: flex;
      gap: 4px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 8px;
      overflow-x: auto;
      flex-wrap: nowrap;
    }
    .settings-tab {
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
    .settings-tab:hover { color: var(--text); }
    .settings-tab.is-active {
      color: var(--accent);
      border-bottom-color: var(--accent);
    }
    .settings-tab-panel { display: none; flex-direction: column; gap: 14px; }
    .settings-tab-panel.is-active { display: flex; }
    .settings-field__label-with-help {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .help-tip {
      position: relative;
      display: inline-flex;
      align-items: center;
      cursor: help;
      outline: none;
    }
    .help-tip__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--surface-2);
      color: var(--text-muted);
      font-size: 10px;
      font-weight: 600;
      line-height: 1;
      border: 1px solid var(--border);
    }
    .help-tip:hover .help-tip__icon,
    .help-tip:focus .help-tip__icon {
      background: var(--accent-soft);
      color: var(--accent);
      border-color: var(--accent);
    }
    .help-tip__bubble {
      position: absolute;
      left: 22px;
      right: auto;
      top: -8px;
      width: 240px;
      max-width: calc(100vw - 24px);
      padding: 8px 10px;
      background: var(--surface);
      color: var(--text);
      border: 1px solid var(--border);
      border-radius: 8px;
      box-shadow: var(--shadow);
      font-size: 12px;
      line-height: 1.4;
      z-index: 30;
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-2px);
      transition: opacity 0.12s ease, transform 0.12s ease, visibility 0.12s ease;
    }
    .help-tip--flip .help-tip__bubble {
      left: auto;
      right: 22px;
    }
    .help-tip:hover .help-tip__bubble,
    .help-tip:focus .help-tip__bubble {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
    .diag-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    @media (max-width: 720px) {
      .diag-grid { grid-template-columns: 1fr; }
    }
    .diag-card {
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px 14px;
      background: var(--surface-2);
      display: flex;
      flex-direction: column;
      gap: 4px;
      cursor: pointer;
      transition: background 0.12s ease, border-color 0.12s ease;
    }
    .diag-card:hover { background: var(--surface-hover); }
    .diag-card__head {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .diag-card__dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex: 0 0 auto;
    }
    .diag-card--ok .diag-card__dot { background: var(--success); }
    .diag-card--warning .diag-card__dot { background: #F59E0B; }
    .diag-card--error .diag-card__dot { background: var(--danger); }
    .diag-card--ok { border-color: rgba(16, 185, 129, 0.30); }
    .diag-card--warning { border-color: rgba(245, 158, 11, 0.35); background: rgba(245, 158, 11, 0.06); }
    .diag-card--error { border-color: rgba(239, 68, 68, 0.35); background: rgba(239, 68, 68, 0.06); }
    .diag-card__name {
      font-weight: 600;
      color: var(--text-strong);
      font-size: 13px;
      flex: 1;
      min-width: 0;
    }
    .diag-card__details {
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.4;
    }
    .settings-anchors { display: flex; flex-direction: column; gap: 2px; }
    .settings-anchor {
      display: block;
      padding: 6px 10px;
      border-radius: 6px;
      color: var(--text-muted);
      font-size: 13px;
      text-decoration: none;
      transition: background 0.12s ease, color 0.12s ease;
    }
    .settings-anchor:hover { background: var(--surface-2); color: var(--text); }
    .settings-anchor:target,
    .settings-anchor:active { color: var(--accent); }
    .settings-card { scroll-margin-top: 16px; }
    .settings-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .settings-field label {
      font-size: 12px;
      color: var(--text-muted);
    }
    .settings-input, .settings-select {
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--surface-2);
      color: var(--text);
      font: inherit;
      outline: none;
    }
    .settings-input:focus, .settings-select:focus {
      border-color: var(--accent);
    }
    .settings-input[readonly] {
      opacity: 0.7;
      cursor: not-allowed;
    }
    .settings-input--mono { font-family: "JetBrains Mono", monospace; font-size: 12.5px; }
    .settings-toggle {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--text);
      font-size: 13px;
      cursor: pointer;
    }
    .settings-toggle input { accent-color: var(--accent); }
    .settings-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
    }
    .settings-hint {
      font-size: 12px;
      color: var(--text-muted);
      margin: 0;
    }
    .settings-hint .mono { font-family: "JetBrains Mono", monospace; }

    .settings-banner {
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 13px;
      display: none;
      gap: 8px;
      align-items: flex-start;
    }
    .settings-banner.is-visible { display: flex; }
    .settings-banner--success {
      background: rgba(16, 185, 129, 0.12);
      color: var(--success);
      border: 1px solid rgba(16, 185, 129, 0.25);
    }
    .settings-banner--error {
      background: rgba(239, 68, 68, 0.12);
      color: var(--danger);
      border: 1px solid rgba(239, 68, 68, 0.25);
    }

    .services-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    .service-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      font-size: 13px;
    }
    .service-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex: 0 0 auto;
    }
    .service-dot--ok { background: var(--success); }
    .service-dot--fail { background: var(--danger); }
    .service-dot--unknown { background: var(--text-muted); opacity: 0.4; }
    .service-row__name {
      flex: 1;
      color: var(--text-strong);
    }
    .service-row__status {
      font-family: "JetBrains Mono", monospace;
      font-size: 11px;
      color: var(--text-muted);
    }

    .danger-block {
      border: 1px solid rgba(239, 68, 68, 0.25);
      background: rgba(239, 68, 68, 0.06);
      border-radius: 8px;
      padding: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .danger-block__text { font-size: 13px; color: var(--text); }
    .danger-block__text strong { color: var(--danger); }

    .provider-card {
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: var(--surface-2);
    }
    .provider-card__head {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .provider-card__name {
      font-weight: 600;
      color: var(--text-strong);
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .provider-card__badge {
      font-size: 11px;
      color: var(--accent);
      background: var(--accent-soft);
      padding: 2px 8px;
      border-radius: 999px;
    }
    .provider-card__badge--warn {
      color: var(--danger);
      background: rgba(239, 68, 68, 0.10);
    }
    .provider-card__meta {
      font-size: 12px;
      color: var(--text-muted);
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .provider-card__meta-row {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .provider-card__actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .provider-card__form {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-top: 8px;
      border-top: 1px dashed var(--border);
    }
    .provider-add-form {
      border: 1px dashed var(--border);
      border-radius: 10px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: var(--surface);
    }

    @media (max-width: 720px) {
      .settings-row, .settings-row--triple { grid-template-columns: 1fr; }
      .services-grid { grid-template-columns: 1fr; }
    }

    /* ─── Граф знаний (вкладка) ───────────────────────────────── */
    .graph-subtabs {
      display: inline-flex;
      gap: 4px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 0;
    }
    .graph-subtab {
      border: none;
      background: transparent;
      color: var(--text-muted);
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
    }
    .graph-subtab:hover { color: var(--text); }
    .graph-subtab.is-active { color: var(--accent); border-bottom-color: var(--accent); }
    .graph-subtab-panel { display: none; flex-direction: column; gap: 10px; }
    .graph-subtab-panel.is-active { display: flex; }

    .graph-item-card {
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px 14px;
      background: var(--surface);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .graph-item-card__head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
    }
    .graph-item-card__title {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-strong);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .graph-item-card__desc {
      font-size: 12px;
      color: var(--text-muted);
    }
    .graph-item-card__meta {
      font-size: 11px;
      color: var(--text-muted);
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .graph-item-card__actions {
      display: inline-flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .graph-alias-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .graph-alias-pill {
      font-size: 11px;
      padding: 2px 8px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 999px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .graph-form {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .graph-form__row {
      display: grid;
      grid-template-columns: 180px 1fr;
      gap: 10px;
      align-items: start;
    }
    .graph-form__row > label {
      font-size: 12px;
      color: var(--text-muted);
      padding-top: 6px;
    }
    .graph-form__row > .graph-form__field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .graph-form__hint {
      font-size: 11px;
      color: var(--text-muted);
    }
    .graph-form__error {
      font-size: 12px;
      color: var(--danger);
      background: rgba(239, 68, 68, 0.08);
      border: 1px solid var(--danger);
      border-radius: 6px;
      padding: 6px 10px;
    }
    .graph-form textarea, .graph-form input[type="text"], .graph-form input[type="number"], .graph-form select {
      width: 100%;
      padding: 6px 8px;
      font-size: 13px;
      background: var(--surface-2);
      color: var(--text);
      border: 1px solid var(--border);
      border-radius: 6px;
      font-family: inherit;
    }
    .graph-form textarea.graph-mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px;
    }
    .graph-preview {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 10px 12px;
      font-size: 12px;
      max-height: 320px;
      overflow: auto;
    }
    .graph-preview-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    .graph-preview-table th, .graph-preview-table td {
      padding: 4px 6px;
      border-bottom: 1px solid var(--border);
      text-align: left;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      vertical-align: top;
    }
    .graph-warnings { display:flex; flex-direction:column; gap:4px; margin-top:8px; }
    .graph-warning-item {
      font-size: 12px;
      color: var(--text);
      background: rgba(218, 165, 32, 0.10);
      border-left: 3px solid #d18f00;
      padding: 4px 8px;
      border-radius: 4px;
    }
  `;
}

function renderSettingsScript(initialStateJson, extraScripts = "") {
  return `
    (function () {
      var INITIAL_STATE = ${initialStateJson};
      var state = {
        settings: null,
        models: null,
        retrieval: null,
        cloudDraft: null,
        cloudDirty: false,
        providerEditId: null,
        services: null,
        resetArmed: false,
      };

      var dom = {
        cloudName: document.getElementById("cfgCloudName"),
        cloudBaseUrl: document.getElementById("cfgCloudBaseUrl"),
        cloudApiKey: document.getElementById("cfgCloudApiKey"),
        cloudModel: document.getElementById("cfgCloudModel"),
        cloudUseDefault: document.getElementById("cfgCloudUseDefault"),
        cloudBanner: document.getElementById("cfgCloudBanner"),
        cloudList: document.getElementById("cfgCloudList"),
        cloudAddBtn: document.getElementById("cfgCloudAddBtn"),
        cloudAddForm: document.getElementById("cfgCloudAddForm"),
        cloudAddSave: document.getElementById("cfgCloudAddSave"),
        cloudAddCancel: document.getElementById("cfgCloudAddCancel"),
        chatModel: document.getElementById("cfgChatModel"),
        embedModel: document.getElementById("cfgEmbedModel"),
        ollamaUrl: document.getElementById("cfgOllamaUrl"),
        retrievalFields: document.getElementById("retrievalFields"),
        retrievalSave: document.getElementById("retrievalSave"),
        retrievalReset: document.getElementById("retrievalReset"),
        retrievalBanner: document.getElementById("retrievalBanner"),
        promptTemplate: document.getElementById("cfgPromptTemplate"),
        promptSave: document.getElementById("cfgPromptSave"),
        promptReset: document.getElementById("cfgPromptReset"),
        promptBanner: document.getElementById("cfgPromptBanner"),
        promptWarn: document.getElementById("cfgPromptWarn"),
        promptStatus: document.getElementById("promptStatus"),
        servicesList: document.getElementById("cfgServices"),
        diagList: document.getElementById("cfgDiagList"),
        diagSummary: document.getElementById("cfgDiagSummary"),
        diagBanner: document.getElementById("cfgDiagBanner"),
        diagRun: document.getElementById("cfgDiagRun"),
        ocrAutoEmpty: document.getElementById("cfgOcrAutoEmpty"),
        ocrAll: document.getElementById("cfgOcrAll"),
        ocrSave: document.getElementById("cfgOcrSave"),
        ocrBanner: document.getElementById("cfgOcrBanner"),
        ocrAvailability: document.getElementById("cfgOcrAvailability"),
        indexingConcurrency: document.getElementById("cfgIndexingConcurrency"),
        indexingSave: document.getElementById("cfgIndexingSave"),
        indexingBanner: document.getElementById("cfgIndexingBanner"),
        indexingStatus: document.getElementById("cfgIndexingStatus"),
        servicesRefresh: document.getElementById("cfgServicesRefresh"),
        themeSelect: document.getElementById("cfgThemeDefault"),
        themeSave: document.getElementById("cfgThemeSave"),
        themeBanner: document.getElementById("cfgThemeBanner"),
        maintRebuild: document.getElementById("cfgMaintRebuild"),
        maintReset: document.getElementById("cfgMaintReset"),
        maintBanner: document.getElementById("cfgMaintBanner"),
        backupCreate: document.getElementById("cfgBackupCreate"),
        backupRefresh: document.getElementById("cfgBackupRefresh"),
        backupList: document.getElementById("cfgBackupList"),
        backupBanner: document.getElementById("cfgBackupBanner"),
        restoreFile: document.getElementById("cfgRestoreFile"),
        restoreUpload: document.getElementById("cfgRestoreUpload"),
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
        if (body !== undefined) {
          opts.headers["Content-Type"] = "application/json";
          opts.body = JSON.stringify(body);
        }
        return fetch(path, opts).then(function (response) {
          return response.json().then(function (data) {
            if (!response.ok || (data && data.ok === false && method !== "POST")) {
              var error = new Error((data && (data.message || data.error)) || ("HTTP " + response.status));
              error.status = response.status;
              error.data = data;
              throw error;
            }
            return data;
          });
        });
      }

      function setBanner(el, message, kind) {
        if (!el) return;
        if (!message) {
          el.classList.remove("is-visible");
          el.innerHTML = "";
          return;
        }
        el.classList.add("is-visible");
        el.classList.toggle("settings-banner--success", kind === "success");
        el.classList.toggle("settings-banner--error", kind === "error");
        el.innerHTML = '<span>' + escapeHtml(message) + '</span>';
      }

      function renderModels() {
        if (!state.models) return;
        dom.chatModel.value = state.models.chat.model || "";
        dom.embedModel.value = state.models.embedding.model || "";
        dom.ollamaUrl.value = state.models.chat.baseUrl || "";
      }

      var RETRIEVAL_FIELDS = [
        { path: ["semantic", "top_k"], label: "Кандидатов из semantic-поиска", type: "number", min: 1, max: 50, hint: "semantic.top_k",
          help: "Сколько ближайших кандидатов вытащить из векторного поиска (Qdrant). Чем больше — точнее, но медленнее. Типично 8–20." },
        { path: ["bm25", "top_k"], label: "Кандидатов из BM25 (лексический)", type: "number", min: 1, max: 50, hint: "bm25.top_k",
          help: "Сколько кандидатов взять из лексического поиска (Postgres BM25). Дополняет векторный поиск редкими словами и цифрами." },
        { path: ["fusion", "top_k_final"], label: "Итоговых фрагментов в ответ", type: "number", min: 1, max: 30, hint: "fusion.top_k_final",
          help: "Сколько финальных фрагментов попадёт в контекст LLM. Больше — точнее ответ, но больше токенов и медленнее." },
        { path: ["reranking", "enabled"], label: "Re-ranking включён", type: "boolean", hint: "reranking.enabled",
          help: "Если включено, после первичного поиска кандидаты переоцениваются reranker-моделью. Точнее, но медленнее." },
        { path: ["reranking", "candidate_pool"], label: "Пул кандидатов для re-ranking", type: "number", min: 1, max: 100, hint: "reranking.candidate_pool",
          help: "Размер пула для re-ranking. Берётся лучшая часть кандидатов из semantic+bm25 для повторной оценки." },
      ];

      function renderHelpIcon(helpText) {
        if (!helpText) return "";
        return '<span class="help-tip" tabindex="0" aria-label="Подсказка"><span class="help-tip__icon" aria-hidden="true">?</span><span class="help-tip__bubble" role="tooltip">' + escapeHtml(helpText) + '</span></span>';
      }

      function getRetrievalValue(obj, pathArr) {
        var cur = obj;
        for (var i = 0; i < pathArr.length; i++) {
          if (!cur || typeof cur !== "object") return undefined;
          cur = cur[pathArr[i]];
        }
        return cur;
      }

      function setRetrievalValue(obj, pathArr, value) {
        var cur = obj;
        for (var i = 0; i < pathArr.length - 1; i++) {
          if (!cur[pathArr[i]] || typeof cur[pathArr[i]] !== "object") cur[pathArr[i]] = {};
          cur = cur[pathArr[i]];
        }
        cur[pathArr[pathArr.length - 1]] = value;
      }

      function renderRetrieval() {
        if (!dom.retrievalFields) return;
        var data = state.retrieval || {};
        var effective = data.effective || {};
        var defaults = data.defaults || {};
        var html = RETRIEVAL_FIELDS.map(function (f) {
          var defVal = getRetrievalValue(defaults, f.path);
          if (defVal === undefined) return "";
          var curVal = getRetrievalValue(effective, f.path);
          if (curVal === undefined) curVal = defVal;
          var inputId = "rf_" + f.path.join("_");
          var helpHtml = renderHelpIcon(f.help);
          if (f.type === "boolean") {
            var checked = curVal === true ? "checked" : "";
            return '<div class="settings-field">' +
              '<label class="settings-toggle" for="' + inputId + '">' +
              '<input type="checkbox" id="' + inputId + '" data-retrieval-path="' + f.path.join(".") + '" data-retrieval-type="boolean" ' + checked + ' /> ' +
              escapeHtml(f.label) +
              helpHtml +
              '</label>' +
              '<span class="settings-hint mono">' + escapeHtml(f.hint) + ' · по умолчанию: ' + (defVal ? "вкл" : "выкл") + '</span>' +
              '</div>';
          }
          return '<div class="settings-field">' +
            '<label for="' + inputId + '" class="settings-field__label-with-help">' + escapeHtml(f.label) + helpHtml + '</label>' +
            '<input type="number" class="settings-input" id="' + inputId + '" data-retrieval-path="' + f.path.join(".") + '" data-retrieval-type="number" min="' + (f.min || 0) + '" max="' + (f.max || 9999) + '" value="' + escapeHtml(curVal) + '" />' +
            '<span class="settings-hint mono">' + escapeHtml(f.hint) + ' · по умолчанию: ' + escapeHtml(defVal) + '</span>' +
            '</div>';
        }).filter(Boolean).join("");
        dom.retrievalFields.innerHTML = html;
      }

      function collectRetrievalPatch() {
        var patch = {};
        if (!dom.retrievalFields) return patch;
        var inputs = dom.retrievalFields.querySelectorAll("[data-retrieval-path]");
        inputs.forEach(function (el) {
          var pathStr = el.getAttribute("data-retrieval-path");
          var type = el.getAttribute("data-retrieval-type");
          var pathArr = pathStr.split(".");
          if (type === "boolean") {
            setRetrievalValue(patch, pathArr, el.checked);
          } else {
            var n = Number(el.value);
            if (Number.isFinite(n)) setRetrievalValue(patch, pathArr, n);
          }
        });
        return patch;
      }

      function renderSystemPromptCard() {
        if (!dom.promptTemplate || !state.systemPrompt) return;
        var sp = state.systemPrompt;
        if (dom.promptTemplate.value !== sp.template) {
          dom.promptTemplate.value = sp.template || "";
        }
        if (dom.promptStatus) {
          dom.promptStatus.textContent = sp.isCustom ? "переопределён" : "значение по умолчанию";
        }
        validateSystemPromptTextarea();
      }

      function validateSystemPromptTextarea() {
        if (!dom.promptTemplate || !dom.promptWarn) return;
        var text = dom.promptTemplate.value || "";
        var warnings = [];
        if (text.indexOf("{sources}") === -1) {
          warnings.push("⚠ Без {sources} модель не получит контекст документов.");
        }
        if (text.indexOf("{question}") === -1) {
          warnings.push("⚠ Без {question} модель не увидит вопрос пользователя явно.");
        }
        if (text.length > 8000) {
          warnings.push("⚠ Длина шаблона > 8000 символов — может вытеснять источники из контекста модели.");
        }
        if (warnings.length) {
          dom.promptWarn.className = "settings-banner settings-banner--warn";
          dom.promptWarn.textContent = warnings.join(" ");
        } else {
          dom.promptWarn.className = "settings-banner";
          dom.promptWarn.textContent = "";
        }
      }

      function renderCloud() {
        var cp = state.settings && state.settings.cloudProvider;
        if (cp) {
          dom.cloudUseDefault.checked = cp.useByDefault === true;
        }
        renderProvidersList();
      }

      function renderProvidersList() {
        if (!dom.cloudList) return;
        var providers = (state.settings && state.settings.cloudProviders && state.settings.cloudProviders.providers) || [];
        var defaultId = (state.settings && state.settings.cloudProviders && state.settings.cloudProviders.defaultProviderId) || null;
        if (!providers.length) {
          dom.cloudList.innerHTML = '<div class="filters-empty">Облачных провайдеров пока нет. Добавьте первого ниже.</div>';
          return;
        }
        var html = providers.map(function (p) {
          var badge = '';
          if (defaultId === p.id) {
            badge = '<span class="provider-card__badge">по умолчанию</span>';
          } else if (!p.configured) {
            badge = '<span class="provider-card__badge provider-card__badge--warn">не настроен</span>';
          }
          var keyDisplay = p.apiKey ? p.apiKey : '<span style="opacity:0.6">пусто</span>';
          var editForm = state.providerEditId === p.id
            ? renderProviderEditForm(p)
            : '';
          return '<div class="provider-card" data-provider-id="' + escapeHtml(p.id) + '">' +
            '<div class="provider-card__head">' +
              '<span aria-hidden="true">⚡</span>' +
              '<span class="provider-card__name" title="' + escapeHtml(p.name || "") + '">' + escapeHtml(p.name || "(без названия)") + '</span>' +
              badge +
            '</div>' +
            '<div class="provider-card__meta">' +
              '<span class="provider-card__meta-row">Модель: <span class="mono">' + escapeHtml(p.model || "—") + '</span></span>' +
              '<span class="provider-card__meta-row">Base URL: <span class="mono">' + escapeHtml(p.baseUrl || "—") + '</span></span>' +
              '<span class="provider-card__meta-row">Ключ: <span class="mono">' + keyDisplay + '</span></span>' +
            '</div>' +
            '<div class="provider-card__actions">' +
              '<button type="button" class="btn" data-action="provider-test" data-provider-id="' + escapeHtml(p.id) + '">Тест подключения</button>' +
              '<button type="button" class="btn" data-action="provider-edit" data-provider-id="' + escapeHtml(p.id) + '">Редактировать</button>' +
              (defaultId === p.id
                ? ''
                : '<button type="button" class="btn" data-action="provider-default" data-provider-id="' + escapeHtml(p.id) + '">Сделать по умолчанию</button>') +
              '<button type="button" class="btn btn--danger" data-action="provider-delete" data-provider-id="' + escapeHtml(p.id) + '">Удалить</button>' +
            '</div>' +
            editForm +
            '</div>';
        }).join("");
        dom.cloudList.innerHTML = html;
      }

      function renderProviderEditForm(p) {
        return '<div class="provider-card__form" data-edit-form="' + escapeHtml(p.id) + '">' +
          '<div class="settings-row">' +
            '<div class="settings-field">' +
              '<label>Название</label>' +
              '<input class="settings-input" data-edit-field="name" type="text" value="' + escapeHtml(p.name || "") + '" />' +
            '</div>' +
            '<div class="settings-field">' +
              '<label>Модель</label>' +
              '<input class="settings-input settings-input--mono" data-edit-field="model" type="text" value="' + escapeHtml(p.model || "") + '" />' +
            '</div>' +
          '</div>' +
          '<div class="settings-field">' +
            '<label>Base URL</label>' +
            '<input class="settings-input settings-input--mono" data-edit-field="baseUrl" type="text" value="' + escapeHtml(p.baseUrl || "") + '" />' +
          '</div>' +
          '<div class="settings-field">' +
            '<label>API Key (оставьте маску, чтобы не менять)</label>' +
            '<input class="settings-input settings-input--mono" data-edit-field="apiKey" type="password" value="' + escapeHtml(p.apiKey || "") + '" autocomplete="off" />' +
          '</div>' +
          '<div class="settings-actions">' +
            '<button type="button" class="btn btn--ghost" data-action="provider-cancel">Отмена</button>' +
            '<button type="button" class="btn btn--accent" data-action="provider-save" data-provider-id="' + escapeHtml(p.id) + '">Сохранить</button>' +
          '</div>' +
        '</div>';
      }

      function renderTheme() {
        var t = state.settings && state.settings.theme;
        if (!t) return;
        dom.themeSelect.value = t.defaultTheme || "dark";
      }

      function renderServices() {
        if (!state.services) {
          dom.servicesList.innerHTML = '<div class="filters-empty">Загружается…</div>';
          return;
        }
        var rows = [];
        var entries = [
          { key: "kbApi", label: "kb-api" },
          { key: "postgres", label: "PostgreSQL" },
          { key: "qdrant", label: "Qdrant" },
          { key: "ollama", label: "Ollama" },
        ];
        entries.forEach(function (e) {
          var s = state.services[e.key] || {};
          var dotCls = s.ok === true ? "service-dot--ok" : "service-dot--fail";
          var statusText = s.ok === true ? "онлайн" : (s.status ? ("HTTP " + s.status) : (s.error || "недоступен"));
          rows.push(
            '<div class="service-row">' +
              '<span class="service-dot ' + dotCls + '"></span>' +
              '<span class="service-row__name">' + escapeHtml(e.label) + '</span>' +
              '<span class="service-row__status mono">' + escapeHtml(statusText) + '</span>' +
            '</div>'
          );
        });
        dom.servicesList.innerHTML = rows.join("");
      }

      function loadSettings() {
        return api("GET", "/api/v2/settings").then(function (data) {
          state.settings = data.settings;
          state.models = data.models;
          state.retrieval = (data.settings && data.settings.retrieval) || data.retrieval;
          state.systemPrompt = data.settings && data.settings.systemPrompt;
          if (!state.settings.cloudProviders) {
            state.settings.cloudProviders = { providers: [], defaultProviderId: null };
          }
          renderModels();
          renderRetrieval();
          renderCloud();
          renderTheme();
          renderSystemPromptCard();
        }).catch(function (err) { showToast("Не удалось загрузить настройки: " + err.message, "error"); });
      }

      function saveRetrieval() {
        var patch = collectRetrievalPatch();
        setBanner(dom.retrievalBanner, "Сохранение…", "success");
        api("PATCH", "/api/v2/settings/retrieval", patch).then(function (data) {
          state.retrieval = data.retrieval;
          renderRetrieval();
          setBanner(dom.retrievalBanner, "Параметры retrieval сохранены.", "success");
        }).catch(function (err) {
          setBanner(dom.retrievalBanner, "Не удалось сохранить: " + err.message, "error");
        });
      }

      function resetRetrieval() {
        api("DELETE", "/api/v2/settings/retrieval").then(function (data) {
          state.retrieval = data.retrieval;
          renderRetrieval();
          setBanner(dom.retrievalBanner, "Возвращены значения из config/retrieval.yaml.", "success");
        }).catch(function (err) {
          setBanner(dom.retrievalBanner, "Не удалось сбросить: " + err.message, "error");
        });
      }

      function saveSystemPrompt() {
        var template = dom.promptTemplate ? dom.promptTemplate.value : "";
        setBanner(dom.promptBanner, "Сохранение…", "success");
        api("PATCH", "/api/v2/settings/system-prompt", { template: template }).then(function (data) {
          state.systemPrompt = data.systemPrompt;
          renderSystemPromptCard();
          setBanner(dom.promptBanner, "Системный промпт сохранён.", "success");
        }).catch(function (err) {
          setBanner(dom.promptBanner, "Не удалось сохранить: " + err.message, "error");
        });
      }

      function confirmResetSystemPrompt() {
        if (state.systemPrompt && !state.systemPrompt.isCustom) {
          api("DELETE", "/api/v2/settings/system-prompt").then(function (data) {
            state.systemPrompt = data.systemPrompt;
            renderSystemPromptCard();
            setBanner(dom.promptBanner, "Промпт уже соответствует значению по умолчанию.", "success");
          });
          return;
        }
        var ok = window.confirm("Все ваши изменения будут потеряны. Восстановить рабочий промпт по умолчанию?");
        if (!ok) return;
        api("DELETE", "/api/v2/settings/system-prompt").then(function (data) {
          state.systemPrompt = data.systemPrompt;
          renderSystemPromptCard();
          setBanner(dom.promptBanner, "Промпт сброшен к значению по умолчанию.", "success");
        }).catch(function (err) {
          setBanner(dom.promptBanner, "Не удалось сбросить: " + err.message, "error");
        });
      }

      function loadServices() {
        dom.servicesList.innerHTML = '<div class="filters-empty">Проверка сервисов…</div>';
        return api("GET", "/api/v2/settings/services").then(function (data) {
          state.services = data.services;
          renderServices();
        }).catch(function (err) {
          dom.servicesList.innerHTML = '<div class="kb-doc-error">Не удалось проверить сервисы: ' + escapeHtml(err.message) + '</div>';
        });
      }

      function loadIndexing() {
        if (!dom.indexingConcurrency) return;
        return api("GET", "/api/v2/settings/indexing").then(function (data) {
          var n = (data.indexing && Number(data.indexing.concurrency)) || 1;
          dom.indexingConcurrency.value = String(n);
          if (dom.indexingStatus && data.semaphore) {
            var s = data.semaphore;
            dom.indexingStatus.textContent =
              "сейчас: " + s.current + "/" + s.max + " (в ожидании: " + s.waiting + ")";
          }
        }).catch(function (err) {
          if (dom.indexingBanner) setBanner(dom.indexingBanner, "Ошибка загрузки: " + err.message, "error");
        });
      }

      function saveIndexing() {
        if (!dom.indexingConcurrency || !dom.indexingSave) return;
        var n = Number(dom.indexingConcurrency.value);
        if (!Number.isFinite(n) || n < 1 || n > 4) {
          setBanner(dom.indexingBanner, "Значение должно быть от 1 до 4", "error");
          return;
        }
        dom.indexingSave.disabled = true;
        api("PATCH", "/api/v2/settings/indexing", { concurrency: n }).then(function (data) {
          setBanner(dom.indexingBanner, "Сохранено. Применяется к новым задачам.", "success");
          return loadIndexing();
        }).catch(function (err) {
          setBanner(dom.indexingBanner, "Не удалось сохранить: " + err.message, "error");
        }).then(function () { dom.indexingSave.disabled = false; });
      }

      function loadOcr() {
        if (!dom.ocrAutoEmpty) return;
        return api("GET", "/api/v2/settings/ocr").then(function (data) {
          if (data.ocr) {
            dom.ocrAutoEmpty.checked = data.ocr.autoOcrEmptyPages !== false;
            dom.ocrAll.checked = data.ocr.ocrAll === true;
          }
          if (dom.ocrAvailability) {
            dom.ocrAvailability.textContent = data.available
              ? "tesseract доступен"
              : "tesseract недоступен — OCR работать не будет";
          }
        }).catch(function (err) {
          if (dom.ocrAvailability) dom.ocrAvailability.textContent = "не удалось получить статус";
          if (dom.ocrBanner) setBanner(dom.ocrBanner, "Ошибка: " + err.message, "error");
        });
      }

      function saveOcr() {
        if (!dom.ocrAutoEmpty || !dom.ocrSave) return;
        dom.ocrSave.disabled = true;
        api("PATCH", "/api/v2/settings/ocr", {
          autoOcrEmptyPages: dom.ocrAutoEmpty.checked,
          ocrAll: dom.ocrAll.checked,
        }).then(function () {
          setBanner(dom.ocrBanner, "Настройки OCR сохранены.", "success");
        }).catch(function (err) {
          setBanner(dom.ocrBanner, "Не удалось сохранить: " + err.message, "error");
        }).then(function () { dom.ocrSave.disabled = false; });
      }

      function runDiagnostics() {
        if (!dom.diagList) return;
        if (dom.diagRun) dom.diagRun.disabled = true;
        dom.diagList.innerHTML = '<div class="filters-empty" style="grid-column:1/-1">Запускаем проверки…</div>';
        setBanner(dom.diagBanner, "", null);
        api("POST", "/api/v2/diagnostics", {}).then(function (data) {
          var checks = Array.isArray(data.checks) ? data.checks : [];
          var summary = data.summary || { ok: 0, warnings: 0, errors: 0, total: checks.length };
          dom.diagSummary.innerHTML = "Готово: <strong>" + summary.ok + "</strong> OK, " +
            "<strong>" + summary.warnings + "</strong> требуют внимания, " +
            "<strong>" + summary.errors + "</strong> с ошибками. Всего: " + summary.total + ".";
          dom.diagList.innerHTML = checks.map(function (c) {
            var status = c.status === "error" || c.status === "warning" ? c.status : "ok";
            return '<div class="diag-card diag-card--' + status + '" data-check-id="' + escapeHtml(c.id || "") + '">' +
              '<div class="diag-card__head">' +
                '<span class="diag-card__dot"></span>' +
                '<span class="diag-card__name">' + escapeHtml(c.name || c.id || "") + '</span>' +
              '</div>' +
              '<div class="diag-card__details">' + escapeHtml(c.details || "") + '</div>' +
              '</div>';
          }).join("");
        }).catch(function (err) {
          setBanner(dom.diagBanner, "Не удалось запустить проверки: " + err.message, "error");
          dom.diagList.innerHTML = "";
        }).then(function () {
          if (dom.diagRun) dom.diagRun.disabled = false;
        });
      }

      function saveUseDefault() {
        var stored = state.settings && state.settings.cloudProvider ? state.settings.cloudProvider : {};
        api("PATCH", "/api/v2/settings/cloudProvider", { useByDefault: dom.cloudUseDefault.checked }).then(function (data) {
          state.settings.cloudProvider = data.cloudProvider;
          setBanner(dom.cloudBanner, dom.cloudUseDefault.checked
            ? "Новые чаты будут открываться на провайдере по умолчанию."
            : "Новые чаты будут открываться на локальной модели.", "success");
        }).catch(function (err) {
          setBanner(dom.cloudBanner, "Не удалось сохранить: " + err.message, "error");
          dom.cloudUseDefault.checked = stored.useByDefault === true;
        });
      }

      function openAddProviderForm() {
        if (!dom.cloudAddForm) return;
        dom.cloudName.value = "";
        dom.cloudModel.value = "";
        dom.cloudBaseUrl.value = "";
        dom.cloudApiKey.value = "";
        dom.cloudAddForm.style.display = "flex";
        if (dom.cloudAddBtn) dom.cloudAddBtn.style.display = "none";
        setTimeout(function () { dom.cloudName.focus(); }, 0);
      }

      function closeAddProviderForm() {
        if (!dom.cloudAddForm) return;
        dom.cloudAddForm.style.display = "none";
        if (dom.cloudAddBtn) dom.cloudAddBtn.style.display = "";
      }

      function addProvider() {
        var payload = {
          name: dom.cloudName.value.trim(),
          baseUrl: dom.cloudBaseUrl.value.trim(),
          model: dom.cloudModel.value.trim(),
          apiKey: dom.cloudApiKey.value,
        };
        if (!payload.name || !payload.baseUrl || !payload.apiKey || !payload.model) {
          setBanner(dom.cloudBanner, "Заполните все поля: название, Base URL, ключ, модель.", "error");
          return;
        }
        dom.cloudAddSave.disabled = true;
        api("POST", "/api/v2/settings/cloudProviders", payload).then(function () {
          setBanner(dom.cloudBanner, "Провайдер «" + payload.name + "» добавлен.", "success");
          showToast("Провайдер добавлен");
          closeAddProviderForm();
          return loadCloudProviders();
        }).catch(function (err) {
          setBanner(dom.cloudBanner, "Не удалось добавить: " + err.message, "error");
        }).then(function () { dom.cloudAddSave.disabled = false; });
      }

      function loadCloudProviders() {
        return api("GET", "/api/v2/settings/cloudProviders").then(function (data) {
          if (!state.settings) state.settings = {};
          state.settings.cloudProviders = { providers: data.providers || [], defaultProviderId: data.defaultProviderId || null };
          renderProvidersList();
        });
      }

      function startEditProvider(id) {
        state.providerEditId = id;
        renderProvidersList();
      }

      function cancelEditProvider() {
        state.providerEditId = null;
        renderProvidersList();
      }

      function collectEditFormValues(formEl) {
        var fields = formEl.querySelectorAll("[data-edit-field]");
        var values = {};
        fields.forEach(function (input) {
          values[input.getAttribute("data-edit-field")] = input.value;
        });
        return values;
      }

      function saveProviderEdit(id) {
        var formEl = dom.cloudList.querySelector('[data-edit-form="' + id + '"]');
        if (!formEl) return;
        var v = collectEditFormValues(formEl);
        var payload = {
          name: (v.name || "").trim(),
          baseUrl: (v.baseUrl || "").trim(),
          model: (v.model || "").trim(),
        };
        if (v.apiKey !== undefined && v.apiKey !== null && v.apiKey.indexOf("•") === -1 && v.apiKey.trim() !== "") {
          payload.apiKey = v.apiKey;
        }
        api("PATCH", "/api/v2/settings/cloudProviders/" + encodeURIComponent(id), payload).then(function () {
          state.providerEditId = null;
          setBanner(dom.cloudBanner, "Провайдер обновлён.", "success");
          showToast("Сохранено");
          return loadCloudProviders();
        }).catch(function (err) {
          setBanner(dom.cloudBanner, "Не удалось сохранить: " + err.message, "error");
        });
      }

      function deleteProvider(id) {
        var providers = (state.settings.cloudProviders && state.settings.cloudProviders.providers) || [];
        var target = providers.find(function (p) { return p.id === id; });
        var name = target ? (target.name || "провайдер") : "провайдер";
        if (!window.confirm("Удалить провайдера «" + name + "»? Действие необратимо.")) return;
        api("DELETE", "/api/v2/settings/cloudProviders/" + encodeURIComponent(id)).then(function () {
          setBanner(dom.cloudBanner, "Провайдер удалён.", "success");
          return loadCloudProviders();
        }).catch(function (err) {
          var msg = err.message || "неизвестная ошибка";
          if (err.status === 409) {
            setBanner(dom.cloudBanner, msg, "error");
          } else {
            setBanner(dom.cloudBanner, "Не удалось удалить: " + msg, "error");
          }
        });
      }

      function setDefaultProvider(id) {
        api("PATCH", "/api/v2/settings/cloudProviders/default", { providerId: id }).then(function () {
          setBanner(dom.cloudBanner, "Провайдер по умолчанию обновлён.", "success");
          return loadCloudProviders();
        }).catch(function (err) {
          setBanner(dom.cloudBanner, "Не удалось сменить дефолт: " + err.message, "error");
        });
      }

      function testProvider(id) {
        setBanner(dom.cloudBanner, "Идёт проверка подключения…", "success");
        api("POST", "/api/v2/settings/cloudProviders/" + encodeURIComponent(id) + "/test", {}).then(function (data) {
          if (data.ok) {
            setBanner(
              dom.cloudBanner,
              "Облако ответило: «" + (data.response || "") + "» · " + (data.latencyMs || 0) + " мс · модель " + (data.model || ""),
              "success"
            );
          } else {
            setBanner(dom.cloudBanner, "Ошибка [" + (data.code || "?") + "]: " + (data.message || "неизвестно"), "error");
          }
        }).catch(function (err) {
          setBanner(dom.cloudBanner, "Сбой проверки: " + err.message, "error");
        });
      }

      function saveTheme() {
        var theme = dom.themeSelect.value;
        dom.themeSave.disabled = true;
        api("PATCH", "/api/v2/settings/theme", { defaultTheme: theme }).then(function (data) {
          state.settings.theme = data.theme;
          setBanner(dom.themeBanner, "Тема по умолчанию сохранена. Применится для пользователей без личного выбора.", "success");
        }).catch(function (err) {
          setBanner(dom.themeBanner, "Не удалось сохранить: " + err.message, "error");
        }).then(function () { dom.themeSave.disabled = false; });
      }

      function triggerRebuild() {
        if (!confirm("Запустить пересборку Qdrant из PostgreSQL? Векторы будут пересозданы, существующие документы не удалятся.")) return;
        dom.maintRebuild.disabled = true;
        setBanner(dom.maintBanner, "Запуск пересборки…", "success");
        api("POST", "/admin/rebuild-qdrant", { confirm: "REBUILD_QDRANT", dryRun: false }).then(function (data) {
          var msg = data.queued ? "Пересборка поставлена в очередь. ID задачи: " + (data.jobId || "—") : (data.message || "Готово");
          setBanner(dom.maintBanner, msg, "success");
        }).catch(function (err) {
          setBanner(dom.maintBanner, "Не удалось запустить пересборку: " + err.message, "error");
        }).then(function () { dom.maintRebuild.disabled = false; });
      }

      function triggerReset() {
        var word = prompt("Это удалит ВСЕ документы, чанки и индексы Qdrant. Введите слово УДАЛИТЬ для подтверждения:");
        if (word !== "УДАЛИТЬ") {
          setBanner(dom.maintBanner, "Сброс отменён — слово подтверждения не совпало.", "error");
          return;
        }
        if (!confirm("Точно сбросить? Это необратимо.")) return;
        dom.maintReset.disabled = true;
        setBanner(dom.maintBanner, "Идёт сброс содержимого…", "success");
        api("POST", "/admin/reset-content", { confirm: "RESET_LOCAL_RAG_CONTENT", force: true }).then(function (data) {
          setBanner(dom.maintBanner, data.message || "База очищена.", "success");
        }).catch(function (err) {
          setBanner(dom.maintBanner, "Не удалось выполнить сброс: " + err.message, "error");
        }).then(function () { dom.maintReset.disabled = false; });
      }

      function fmtBytes(bytes) {
        var n = Number(bytes) || 0;
        var units = ["Б", "КБ", "МБ", "ГБ"];
        var i = 0;
        while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
        return (i === 0 ? Math.round(n) : n.toFixed(1)) + " " + units[i];
      }

      function escapeAttr(value) {
        return escapeHtml(value);
      }

      function renderBackupList(items) {
        if (!items || !items.length) {
          dom.backupList.innerHTML = '<div class="filters-empty">Бэкапов пока нет.</div>';
          return;
        }
        dom.backupList.innerHTML = items.map(function (b) {
          return '<div class="service-row">' +
            '<span class="service-row__name mono">' + escapeHtml(b.filename) + '</span>' +
            '<span class="service-row__status mono">' + fmtBytes(b.size) + ' · ' + escapeHtml((b.createdAt || "").replace("T", " ").slice(0, 16)) + '</span>' +
            '<a class="btn btn--ghost" href="/api/v2/backups/' + encodeURIComponent(b.filename) + '/download" target="_blank">Скачать</a>' +
            '<button type="button" class="btn btn--ghost" data-action="restore-backup" data-name="' + escapeAttr(b.filename) + '">Восстановить</button>' +
            '<button type="button" class="btn btn--danger" data-action="delete-backup" data-name="' + escapeAttr(b.filename) + '">Удалить</button>' +
            '</div>';
        }).join("");
      }

      function loadBackups() {
        return api("GET", "/api/v2/backups").then(function (data) {
          renderBackupList(data.backups || []);
        }).catch(function (err) {
          dom.backupList.innerHTML = '<div class="kb-doc-error">Не удалось загрузить список: ' + escapeHtml(err.message) + '</div>';
        });
      }

      function createBackup() {
        dom.backupCreate.disabled = true;
        setBanner(dom.backupBanner, "Идёт создание бэкапа…", "success");
        api("POST", "/api/v2/backups", {}).then(function (data) {
          setBanner(dom.backupBanner, "Бэкап создан: " + data.filename + " · " + fmtBytes(data.size) + " · за " + (data.durationMs || 0) + " мс", "success");
          return loadBackups();
        }).catch(function (err) {
          setBanner(dom.backupBanner, "Не удалось создать бэкап: " + err.message, "error");
        }).then(function () { dom.backupCreate.disabled = false; });
      }

      function deleteBackup(filename) {
        if (!confirm("Удалить бэкап «" + filename + "»?")) return;
        api("DELETE", "/api/v2/backups/" + encodeURIComponent(filename)).then(function () {
          setBanner(dom.backupBanner, "Бэкап удалён: " + filename, "success");
          return loadBackups();
        }).catch(function (err) {
          setBanner(dom.backupBanner, "Не удалось удалить: " + err.message, "error");
        });
      }

      function waitForKbApiThenReload() {
        var attempts = 0;
        var maxAttempts = 30; // ~30 секунд
        function tick() {
          attempts++;
          fetch("/health", { cache: "no-store" }).then(function (r) {
            if (r.ok) {
              window.location.reload();
            } else if (attempts < maxAttempts) {
              setTimeout(tick, 1000);
            } else {
              setBanner(dom.backupBanner, "kb-api не отвечает после восстановления. Проверьте контейнер и обновите страницу вручную.", "error");
            }
          }).catch(function () {
            if (attempts < maxAttempts) setTimeout(tick, 1000);
            else setBanner(dom.backupBanner, "kb-api не отвечает после восстановления. Проверьте контейнер и обновите страницу вручную.", "error");
          });
        }
        setTimeout(tick, 1500);
      }

      function restoreBackup(filename) {
        var word = prompt("Восстановление перезапишет ВСЮ PostgreSQL. Введите слово ВОССТАНОВИТЬ:");
        if (word !== "ВОССТАНОВИТЬ") {
          setBanner(dom.backupBanner, "Восстановление отменено — слово подтверждения не совпало.", "error");
          return;
        }
        if (!confirm("Точно восстановить из «" + filename + "»? Текущие данные будут заменены.")) return;
        setBanner(dom.backupBanner, "Идёт восстановление…", "success");
        api("POST", "/api/v2/backups/" + encodeURIComponent(filename) + "/restore", { confirm: "ВОССТАНОВИТЬ" }).then(function (data) {
          setBanner(dom.backupBanner, "База восстановлена за " + (data.durationMs || 0) + " мс. kb-api перезапускается, страница обновится автоматически…", "success");
          waitForKbApiThenReload();
        }).catch(function (err) {
          setBanner(dom.backupBanner, "Не удалось восстановить: " + err.message, "error");
        });
      }

      function restoreFromUpload() {
        var file = dom.restoreFile.files && dom.restoreFile.files[0];
        if (!file) { setBanner(dom.backupBanner, "Выберите файл .sql или .sql.gz", "error"); return; }
        if (!/\.(sql|sql\.gz|gz)$/i.test(file.name)) {
          setBanner(dom.backupBanner, "Поддерживаются только .sql и .sql.gz файлы", "error");
          return;
        }
        var word = prompt("Восстановление перезапишет ВСЮ PostgreSQL. Введите слово ВОССТАНОВИТЬ:");
        if (word !== "ВОССТАНОВИТЬ") {
          setBanner(dom.backupBanner, "Восстановление отменено — слово подтверждения не совпало.", "error");
          return;
        }
        if (!confirm("Точно восстановить из «" + file.name + "»? Текущие данные будут заменены.")) return;
        setBanner(dom.backupBanner, "Загрузка файла и восстановление…", "success");
        var fd = new FormData();
        fd.append("file", file, file.name);
        fd.append("confirm", "ВОССТАНОВИТЬ");
        fetch("/api/v2/backups/restore-upload", { method: "POST", body: fd }).then(function (r) {
          return r.json().then(function (data) {
            if (!r.ok || data.ok === false) throw new Error(data.error || ("HTTP " + r.status));
            setBanner(dom.backupBanner, "База восстановлена. kb-api перезапускается, страница обновится автоматически…", "success");
            waitForKbApiThenReload();
          });
        }).catch(function (err) {
          setBanner(dom.backupBanner, "Не удалось восстановить из файла: " + err.message, "error");
        });
      }

      function adjustHelpTip(tip) {
        if (!tip) return;
        var bubble = tip.querySelector(".help-tip__bubble");
        if (!bubble) return;
        // Сбросить flip, замерить с нейтральной позицией
        tip.classList.remove("help-tip--flip");
        var rect = tip.getBoundingClientRect();
        var bubbleWidth = bubble.offsetWidth || 240;
        // Если справа от иконки не помещается (с запасом 12px) — флипнуть влево
        if (rect.left + 22 + bubbleWidth + 12 > window.innerWidth) {
          tip.classList.add("help-tip--flip");
        }
      }

      function bindHelpTipAutoFlip() {
        document.addEventListener("mouseenter", function (event) {
          var tip = event.target && event.target.closest && event.target.closest(".help-tip");
          if (tip) adjustHelpTip(tip);
        }, true);
        document.addEventListener("focusin", function (event) {
          var tip = event.target && event.target.closest && event.target.closest(".help-tip");
          if (tip) adjustHelpTip(tip);
        });
      }

      function bindEvents() {
        dom.cloudUseDefault.addEventListener("change", saveUseDefault);
        if (dom.cloudAddBtn) dom.cloudAddBtn.addEventListener("click", openAddProviderForm);
        if (dom.cloudAddCancel) dom.cloudAddCancel.addEventListener("click", closeAddProviderForm);
        if (dom.cloudAddSave) dom.cloudAddSave.addEventListener("click", addProvider);
        if (dom.cloudList) {
          dom.cloudList.addEventListener("click", function (event) {
            var btn = event.target.closest("[data-action]");
            if (!btn) return;
            var action = btn.getAttribute("data-action");
            var providerId = btn.getAttribute("data-provider-id");
            if (action === "provider-edit") startEditProvider(providerId);
            else if (action === "provider-cancel") cancelEditProvider();
            else if (action === "provider-save") saveProviderEdit(providerId);
            else if (action === "provider-delete") deleteProvider(providerId);
            else if (action === "provider-default") setDefaultProvider(providerId);
            else if (action === "provider-test") testProvider(providerId);
          });
        }
        dom.servicesRefresh.addEventListener("click", loadServices);
        if (dom.diagRun) dom.diagRun.addEventListener("click", runDiagnostics);
        if (dom.ocrSave) dom.ocrSave.addEventListener("click", saveOcr);
        if (dom.indexingSave) dom.indexingSave.addEventListener("click", saveIndexing);
        dom.themeSave.addEventListener("click", saveTheme);
        dom.maintRebuild.addEventListener("click", triggerRebuild);
        dom.maintReset.addEventListener("click", triggerReset);
        dom.backupCreate.addEventListener("click", createBackup);
        dom.backupRefresh.addEventListener("click", loadBackups);
        dom.restoreUpload.addEventListener("click", restoreFromUpload);
        dom.backupList.addEventListener("click", function (event) {
          var del = event.target.closest("[data-action='delete-backup']");
          if (del) { deleteBackup(del.getAttribute("data-name")); return; }
          var res = event.target.closest("[data-action='restore-backup']");
          if (res) { restoreBackup(res.getAttribute("data-name")); return; }
        });
        if (dom.retrievalSave) dom.retrievalSave.addEventListener("click", saveRetrieval);
        if (dom.retrievalReset) dom.retrievalReset.addEventListener("click", resetRetrieval);
        if (dom.promptSave) dom.promptSave.addEventListener("click", saveSystemPrompt);
        if (dom.promptReset) dom.promptReset.addEventListener("click", confirmResetSystemPrompt);
        if (dom.promptTemplate) dom.promptTemplate.addEventListener("input", validateSystemPromptTextarea);
      }

      function setActiveSettingsTab(name) {
        var valid = ["models", "search", "prompt", "services", "diagnostics", "graph", "maintenance", "backups"];
        if (valid.indexOf(name) === -1) name = "models";
        document.querySelectorAll("[data-settings-tab]").forEach(function (btn) {
          btn.classList.toggle("is-active", btn.getAttribute("data-settings-tab") === name);
        });
        document.querySelectorAll("[data-settings-panel]").forEach(function (panel) {
          panel.classList.toggle("is-active", panel.getAttribute("data-settings-panel") === name);
        });
        try { localStorage.setItem("localrag.settings.activeTab", name); } catch (err) {}
        if (name === "graph" && typeof window.__graphTabActivate === "function") {
          window.__graphTabActivate();
        }
      }

      function bindSettingsTabs() {
        var tabs = document.getElementById("settingsTabs");
        if (tabs) {
          tabs.addEventListener("click", function (event) {
            var btn = event.target.closest("[data-settings-tab]");
            if (!btn) return;
            setActiveSettingsTab(btn.getAttribute("data-settings-tab"));
          });
        }
        document.addEventListener("click", function (event) {
          var link = event.target.closest("[data-settings-tab-link]");
          if (!link) return;
          event.preventDefault();
          setActiveSettingsTab(link.getAttribute("data-settings-tab-link"));
        });
      }

      function bootstrap() {
        bindEvents();
        bindSettingsTabs();
        bindHelpTipAutoFlip();
        var stored = "models";
        try { stored = localStorage.getItem("localrag.settings.activeTab") || "models"; } catch (err) {}
        setActiveSettingsTab(stored);
        loadSettings();
        loadServices();
        loadOcr();
        loadIndexing();
        loadBackups();
      }

      bootstrap();
    })();
    ${extraScripts}
  `;
}

function renderGraphTabScript() {
  // Self-contained IIFE for the «Граф знаний» tab. Uses no template literals
  // to keep nesting inside the parent template safe.
  return [
"(function () {",
"  function $(id) { return document.getElementById(id); }",
"  function esc(value) {",
"    if (value === null || value === undefined) return '';",
"    return String(value)",
"      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')",
"      .replace(/\\\"/g, '&quot;').replace(/'/g, '&#39;');",
"  }",
"  function toast(msg, kind) {",
"    var existing = document.querySelector('.toast');",
"    if (existing) existing.remove();",
"    var el = document.createElement('div');",
"    el.className = 'toast' + (kind === 'error' ? ' toast--error' : '');",
"    if (kind === 'warning') { el.style.borderColor = '#d18f00'; el.style.color = '#a86a00'; }",
"    el.textContent = msg;",
"    document.body.appendChild(el);",
"    var ttl = (kind === 'warning' || kind === 'error') ? 8000 : 4200;",
"    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, ttl);",
"  }",
"  function api(method, url, body) {",
"    var opts = { method: method, headers: {} };",
"    if (body !== undefined && !(body instanceof FormData)) {",
"      opts.headers['Content-Type'] = 'application/json';",
"      opts.body = JSON.stringify(body);",
"    } else if (body instanceof FormData) { opts.body = body; }",
"    return fetch(url, opts).then(function (resp) {",
"      return resp.json().then(function (data) {",
"        if (!resp.ok || (data && data.ok === false)) {",
"          var err = new Error((data && (data.error || data.message)) || ('HTTP ' + resp.status));",
"          err.status = resp.status; err.data = data; throw err;",
"        }",
"        return data;",
"      });",
"    });",
"  }",
"  function setBanner(el, msg, kind) {",
"    if (!el) return;",
"    if (!msg) { el.classList.remove('is-visible'); el.innerHTML = ''; return; }",
"    el.classList.add('is-visible');",
"    el.classList.toggle('settings-banner--success', kind === 'success');",
"    el.classList.toggle('settings-banner--error', kind === 'error');",
"    el.innerHTML = '<span>' + esc(msg) + '</span>';",
"  }",
"",
"  // ─── Modal helpers (independent backdrop within graph tab) ───",
"  var modal = {",
"    backdrop: null, title: null, body: null, foot: null, closeBtn: null,",
"  };",
"  function ensureModal() {",
"    if (modal.backdrop) return;",
"    modal.backdrop = $('graphModalBackdrop');",
"    modal.title = $('graphModalTitle');",
"    modal.body = $('graphModalBody');",
"    modal.foot = $('graphModalFoot');",
"    modal.closeBtn = $('graphModalCloseBtn');",
"    if (modal.closeBtn) modal.closeBtn.addEventListener('click', closeModal);",
"    if (modal.backdrop) modal.backdrop.addEventListener('click', function (e) {",
"      if (e.target === modal.backdrop) closeModal();",
"    });",
"    document.addEventListener('keydown', function (e) {",
"      if (e.key === 'Escape' && modal.backdrop && modal.backdrop.classList.contains('is-open')) closeModal();",
"    });",
"  }",
"  function openModal(title, bodyEl, buttons) {",
"    ensureModal();",
"    if (!modal.backdrop) return;",
"    modal.title.textContent = title || '';",
"    modal.body.innerHTML = '';",
"    if (typeof bodyEl === 'string') modal.body.innerHTML = bodyEl;",
"    else if (bodyEl) modal.body.appendChild(bodyEl);",
"    modal.foot.innerHTML = '';",
"    (buttons || []).forEach(function (btn) { modal.foot.appendChild(btn); });",
"    modal.backdrop.classList.add('is-open');",
"  }",
"  function closeModal() {",
"    if (modal.backdrop) modal.backdrop.classList.remove('is-open');",
"    if (modal.body) modal.body.innerHTML = '';",
"    if (modal.foot) modal.foot.innerHTML = '';",
"  }",
"  function makeBtn(text, cls, onClick) {",
"    var b = document.createElement('button');",
"    b.type = 'button'; b.className = 'btn ' + (cls || ''); b.textContent = text;",
"    b.addEventListener('click', onClick); return b;",
"  }",
"",
"  // ─── State ───────────────────────────────────────────────────",
"  var state = { loaded: false, profiles: [], aliases: {} };",
"",
"  // ─── Profiles list ───────────────────────────────────────────",
"  function loadProfiles() {",
"    var listEl = $('graphProfileList');",
"    if (listEl) listEl.innerHTML = '<div class=\"settings-hint\">Загрузка…</div>';",
"    return api('GET', '/api/v2/graph/profiles').then(function (data) {",
"      state.profiles = (data && data.profiles) || [];",
"      renderProfilesList();",
"    }).catch(function (err) {",
"      if (listEl) listEl.innerHTML = '<div class=\"graph-form__error\">Не удалось загрузить профили: ' + esc(err.message) + '</div>';",
"    });",
"  }",
"  function renderProfilesList() {",
"    var listEl = $('graphProfileList');",
"    if (!listEl) return;",
"    if (state.profiles.length === 0) {",
"      listEl.innerHTML = '<div class=\"settings-hint\">Профилей пока нет. Нажмите «Создать профиль».</div>';",
"      return;",
"    }",
"    listEl.innerHTML = state.profiles.map(function (p) {",
"      var style = p.per_sheet ? 'koyo-style (per_sheet)' : 'metso-style (один шкаф/лист)';",
"      var matchBits = [];",
"      if (p.match && Array.isArray(p.match.file_extensions)) matchBits.push('ext: ' + p.match.file_extensions.join(', '));",
"      if (p.match && p.match.sheet_name_pattern) matchBits.push('sheet: /' + p.match.sheet_name_pattern + '/');",
"      if (p.match && Array.isArray(p.match.required_sheets)) matchBits.push('требует листы: ' + p.match.required_sheets.join(', '));",
"      return '<div class=\"graph-item-card\">' +",
"        '<div class=\"graph-item-card__head\">' +",
"          '<div>' +",
"            '<div class=\"graph-item-card__title\">' + esc(p.id) + '</div>' +",
"            '<div class=\"graph-item-card__desc\">' + esc(p.description || '') + '</div>' +",
"          '</div>' +",
"          '<div class=\"graph-item-card__actions\">' +",
"            '<button type=\"button\" class=\"btn btn--ghost\" data-graph-action=\"edit-profile\" data-id=\"' + esc(p.id) + '\">Изменить</button>' +",
"            '<button type=\"button\" class=\"btn btn--ghost\" data-graph-action=\"delete-profile\" data-id=\"' + esc(p.id) + '\">Удалить</button>' +",
"          '</div>' +",
"        '</div>' +",
"        '<div class=\"graph-item-card__meta\">' +",
"          '<span>Стиль: ' + esc(style) + '</span>' +",
"          (matchBits.length ? '<span>' + esc(matchBits.join(' · ')) + '</span>' : '') +",
"        '</div>' +",
"      '</div>';",
"    }).join('');",
"  }",
"",
"  // ─── Aliases list ────────────────────────────────────────────",
"  function loadAliases() {",
"    var listEl = $('graphAliasList');",
"    if (listEl) listEl.innerHTML = '<div class=\"settings-hint\">Загрузка…</div>';",
"    return api('GET', '/api/v2/graph/aliases').then(function (data) {",
"      state.aliases = (data && data.signal_kind) || {};",
"      renderAliasesList();",
"    }).catch(function (err) {",
"      if (listEl) listEl.innerHTML = '<div class=\"graph-form__error\">Не удалось загрузить алиасы: ' + esc(err.message) + '</div>';",
"    });",
"  }",
"  function renderAliasesList() {",
"    var listEl = $('graphAliasList');",
"    if (!listEl) return;",
"    var keys = Object.keys(state.aliases);",
"    if (keys.length === 0) {",
"      listEl.innerHTML = '<div class=\"settings-hint\">Канонических значений пока нет. Нажмите «Добавить значение».</div>';",
"      return;",
"    }",
"    listEl.innerHTML = keys.map(function (k) {",
"      var entry = state.aliases[k] || {};",
"      var aliases = Array.isArray(entry.aliases) ? entry.aliases : [];",
"      var pills = aliases.map(function (a) { return '<span class=\"graph-alias-pill\">' + esc(a) + '</span>'; }).join('');",
"      return '<div class=\"graph-item-card\">' +",
"        '<div class=\"graph-item-card__head\">' +",
"          '<div>' +",
"            '<div class=\"graph-item-card__title\">' + esc(k) + '</div>' +",
"            '<div class=\"graph-item-card__desc\">' + esc(entry.description || '') + '</div>' +",
"          '</div>' +",
"          '<div class=\"graph-item-card__actions\">' +",
"            '<button type=\"button\" class=\"btn btn--ghost\" data-graph-action=\"edit-alias\" data-id=\"' + esc(k) + '\">Изменить</button>' +",
"            '<button type=\"button\" class=\"btn btn--ghost\" data-graph-action=\"delete-alias\" data-id=\"' + esc(k) + '\">Удалить</button>' +",
"          '</div>' +",
"        '</div>' +",
"        '<div class=\"graph-alias-pills\">' + pills + '</div>' +",
"      '</div>';",
"    }).join('');",
"  }",
"",
"  // ─── Alias editor ───────────────────────────────────────────",
"  function openAliasEditor(existingKey) {",
"    var existing = existingKey ? (state.aliases[existingKey] || {}) : {};",
"    var isEdit = !!existingKey;",
"    var wrap = document.createElement('div');",
"    wrap.className = 'graph-form';",
"    wrap.innerHTML =",
"      '<div class=\"graph-form__row\"><label>Каноническое значение</label><div class=\"graph-form__field\">' +",
"        '<input type=\"text\" id=\"aliasCanonical\" maxlength=\"64\" placeholder=\"AI, AO, DI, …\" />' +",
"        '<span class=\"graph-form__hint\">Только латиница/цифры/_-, до 64 символов. Не меняется при редактировании.</span>' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\"><label>Описание</label><div class=\"graph-form__field\">' +",
"        '<input type=\"text\" id=\"aliasDesc\" maxlength=\"256\" placeholder=\"Аналоговый вход 4-20 мА\" />' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\"><label>Алиасы (по одному в строке)</label><div class=\"graph-form__field\">' +",
"        '<textarea id=\"aliasList\" class=\"graph-mono\" rows=\"10\" placeholder=\"AI&#10;1AI&#10;Аналоговый вход\"></textarea>' +",
"        '<span class=\"graph-form__hint\">Каждая строка — одна форма написания. Сравнение нечувствительно к регистру и пробелам.</span>' +",
"      '</div></div>' +",
"      '<div id=\"aliasErr\" style=\"display:none\" class=\"graph-form__error\"></div>';",
"    setTimeout(function () {",
"      var k = $('aliasCanonical'); var d = $('aliasDesc'); var a = $('aliasList');",
"      if (k) { k.value = existingKey || ''; if (isEdit) k.disabled = true; }",
"      if (d) d.value = existing.description || '';",
"      if (a) a.value = (Array.isArray(existing.aliases) ? existing.aliases : []).join('\\n');",
"    }, 0);",
"    var saveBtn = makeBtn('Сохранить', 'btn--accent', function () {",
"      var canonical = ($('aliasCanonical').value || '').trim();",
"      var description = ($('aliasDesc').value || '').trim();",
"      var aliases = ($('aliasList').value || '').split(/\\r?\\n/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; });",
"      var errEl = $('aliasErr');",
"      if (!isEdit && !/^[A-Za-z][A-Za-z0-9_-]*$/.test(canonical)) {",
"        errEl.style.display = 'block';",
"        errEl.textContent = 'Канон должен начинаться с буквы латиницы и содержать только буквы, цифры, _ или -';",
"        return;",
"      }",
"      var body = { description: description, aliases: aliases };",
"      var p;",
"      if (isEdit) {",
"        p = api('PUT', '/api/v2/graph/aliases/' + encodeURIComponent(existingKey), body);",
"      } else {",
"        p = api('POST', '/api/v2/graph/aliases', Object.assign({ canonical: canonical }, body));",
"      }",
"      p.then(function (res) {",
"        toast(res.message || 'Сохранено');",
"        closeModal();",
"        loadAliases();",
"      }).catch(function (err) {",
"        errEl.style.display = 'block';",
"        errEl.textContent = err.message || 'Не удалось сохранить';",
"      });",
"    });",
"    var cancelBtn = makeBtn('Отмена', 'btn--ghost', closeModal);",
"    openModal(isEdit ? ('Изменить алиас: ' + existingKey) : 'Новое каноническое значение', wrap, [cancelBtn, saveBtn]);",
"  }",
"  function confirmDeleteAlias(canonical) {",
"    var wrap = document.createElement('div');",
"    wrap.innerHTML = '<p style=\"margin:0;\">Удалить каноническое значение <strong>' + esc(canonical) + '</strong> и все его алиасы?</p>' +",
"      '<p class=\"settings-hint\" style=\"margin-top:6px;\">Это не сломает kb-api. Сигналы с этим значением получат signal_kind = null до тех пор, пока не появится новый алиас.</p>';",
"    var cancelBtn = makeBtn('Отмена', 'btn--ghost', closeModal);",
"    var del = makeBtn('Удалить', 'btn--danger', function () {",
"      api('DELETE', '/api/v2/graph/aliases/' + encodeURIComponent(canonical)).then(function (res) {",
"        toast(res.message || 'Удалено');",
"        closeModal();",
"        loadAliases();",
"      }).catch(function (err) { toast('Не удалось удалить: ' + err.message, 'error'); });",
"    });",
"    openModal('Удалить алиас?', wrap, [cancelBtn, del]);",
"  }",
"",
"  // ─── Raw YAML editors ────────────────────────────────────────",
"  function openRawEditor(kind) {",
"    var isProfiles = (kind === 'profiles');",
"    var getUrl = isProfiles ? '/api/v2/graph/profiles/raw' : '/api/v2/graph/aliases/raw';",
"    var validateUrl = isProfiles ? '/api/v2/graph/profiles/raw/validate' : '/api/v2/graph/aliases/raw/validate';",
"    var putUrl = getUrl;",
"    var title = isProfiles ? 'YAML: graph-parsers.yaml' : 'YAML: graph-aliases.yaml';",
"    var wrap = document.createElement('div');",
"    wrap.className = 'graph-form';",
"    wrap.innerHTML =",
"      '<p class=\"graph-form__hint\">Перед каждой записью kb-api создаёт резервную копию в <span class=\"mono\">data/config-backups/</span> (последние 10). После сохранения kb-api сразу подхватит изменения — рестарт не нужен.</p>' +",
"      '<textarea id=\"rawYaml\" class=\"graph-mono\" rows=\"22\" spellcheck=\"false\"></textarea>' +",
"      '<div id=\"rawErr\" class=\"graph-form__error\" style=\"display:none\"></div>' +",
"      '<div id=\"rawOk\" class=\"graph-form__hint\" style=\"color:var(--success); display:none\"></div>';",
"    setTimeout(function () {",
"      api('GET', getUrl).then(function (data) {",
"        var ta = $('rawYaml');",
"        if (ta) ta.value = (data && data.content) || '';",
"      }).catch(function (err) {",
"        var errEl = $('rawErr');",
"        if (errEl) { errEl.style.display = 'block'; errEl.textContent = 'Не удалось загрузить файл: ' + err.message; }",
"      });",
"    }, 0);",
"    var checkBtn = makeBtn('Проверить синтаксис', 'btn--ghost', function () {",
"      var content = ($('rawYaml').value || '');",
"      var errEl = $('rawErr'); var okEl = $('rawOk');",
"      errEl.style.display = 'none'; okEl.style.display = 'none';",
"      api('POST', validateUrl, { content: content }).then(function (res) {",
"        okEl.style.display = 'block';",
"        okEl.textContent = isProfiles",
"          ? ('YAML корректен. Профилей: ' + (res.profiles_count || 0))",
"          : ('YAML корректен. Канонических значений: ' + (res.canonicals_count || 0));",
"      }).catch(function (err) {",
"        errEl.style.display = 'block';",
"        errEl.textContent = err.message || 'Невалидный YAML';",
"      });",
"    });",
"    var saveBtn = makeBtn('Сохранить', 'btn--accent', function () {",
"      var content = ($('rawYaml').value || '');",
"      var errEl = $('rawErr'); var okEl = $('rawOk');",
"      errEl.style.display = 'none'; okEl.style.display = 'none';",
"      api('PUT', putUrl, { content: content }).then(function (res) {",
"        toast(res.message || 'Сохранено');",
"        closeModal();",
"        if (isProfiles) loadProfiles(); else loadAliases();",
"      }).catch(function (err) {",
"        errEl.style.display = 'block';",
"        errEl.textContent = err.message || 'Не удалось сохранить';",
"      });",
"    });",
"    var cancelBtn = makeBtn('Отмена', 'btn--ghost', closeModal);",
"    openModal(title, wrap, [cancelBtn, checkBtn, saveBtn]);",
"  }",
"",
"  // ─── Profile wizard (create / edit) ─────────────────────────",
"  function openProfileEditor(existingProfile) {",
"    var isEdit = !!existingProfile;",
"    var data = existingProfile ? JSON.parse(JSON.stringify(existingProfile)) : {",
"      id: '', description: '',",
"      match: { file_extensions: ['.xlsx'], sheet_name_pattern: '', required_headers: [], required_sheets: [] },",
"      layout: { header_row: 1, data_start_row: 4 },",
"      columns: {},",
"      builds: ['cabinet', 'station', 'card', 'channel', 'signal', 'device'],",
"      cabinet: { source: 'sheet_name', pattern: '', name_template: 'Cabinet {cabinet_code}' },",
"      skip_rows: [],",
"    };",
"    var detectedStyle = (data.per_sheet && Object.keys(data.per_sheet).length) ? 'koyo' : 'metso';",
"    var sampleSheets = [];",
"    var wrap = document.createElement('div');",
"    wrap.className = 'graph-form';",
"    wrap.innerHTML =",
"      '<div class=\"graph-form__row\"><label>1. Образец XLSX <span class=\"graph-form__hint\">(до 5 МБ)</span></label><div class=\"graph-form__field\">' +",
"        '<input type=\"file\" id=\"wzSample\" accept=\".xlsx,.xls,.xlsm\" />' +",
"        '<span class=\"graph-form__hint\" id=\"wzSampleHint\">Опционально. Помогает автодетекту и предпросмотру.</span>' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\"><label>2. Стиль профиля</label><div class=\"graph-form__field\">' +",
"        '<select id=\"wzStyle\">' +",
"          '<option value=\"metso\">metso-style (один лист = один шкаф)</option>' +",
"          '<option value=\"koyo\">koyo-style (листы по типам сигналов AI/AO/DI/DO)</option>' +",
"        '</select>' +",
"        '<span class=\"graph-form__hint\" id=\"wzStyleHint\"></span>' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\"><label>3. ID профиля</label><div class=\"graph-form__field\">' +",
"        '<input type=\"text\" id=\"wzId\" maxlength=\"96\" placeholder=\"my_new_profile\" />' +",
"        '<span class=\"graph-form__hint\">snake_case латиницей. ID не меняется при редактировании.</span>' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\"><label>4. Описание</label><div class=\"graph-form__field\">' +",
"        '<input type=\"text\" id=\"wzDesc\" maxlength=\"512\" placeholder=\"Краткое описание формата XLSX\" />' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\"><label>5. Условия match.file_extensions</label><div class=\"graph-form__field\">' +",
"        '<input type=\"text\" id=\"wzExt\" placeholder=\".xlsx, .xlsm\" />' +",
"        '<span class=\"graph-form__hint\">Через запятую, с точкой.</span>' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\"><label>match.sheet_name_pattern</label><div class=\"graph-form__field\">' +",
"        '<input type=\"text\" id=\"wzSheetRe\" placeholder=\"^_?IO-\\\\d+\" />' +",
"        '<span class=\"graph-form__hint\">Regex, должен совпасть хотя бы с одним листом. Опционально.</span>' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\"><label>match.required_headers</label><div class=\"graph-form__field\">' +",
"        '<input type=\"text\" id=\"wzReqHeaders\" placeholder=\"LOOPTAG, ADDRESS, CARH_TYPE\" />' +",
"        '<span class=\"graph-form__hint\">Через запятую. Сравнивается без учёта регистра и пробелов.</span>' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\"><label>match.required_sheets</label><div class=\"graph-form__field\">' +",
"        '<input type=\"text\" id=\"wzReqSheets\" placeholder=\"AI, AO, DI, DO\" />' +",
"        '<span class=\"graph-form__hint\">Все указанные листы должны присутствовать.</span>' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\"><label>6. layout.header_row / data_start_row</label><div class=\"graph-form__field\">' +",
"        '<div style=\"display:flex;gap:8px;\">' +",
"          '<input type=\"number\" id=\"wzHeaderRow\" min=\"1\" max=\"100\" style=\"max-width:120px\" />' +",
"          '<input type=\"number\" id=\"wzDataStart\" min=\"1\" max=\"500\" style=\"max-width:120px\" />' +",
"        '</div>' +",
"        '<span class=\"graph-form__hint\">Номера строк в Excel (1-indexed).</span>' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\"><label>7. builds</label><div class=\"graph-form__field\">' +",
"        '<div id=\"wzBuilds\" style=\"display:flex;gap:10px;flex-wrap:wrap;\"></div>' +",
"        '<span class=\"graph-form__hint\">Какие уровни иерархии создавать.</span>' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\" id=\"wzCabinetRow\"><label>8. cabinet (metso)</label><div class=\"graph-form__field\">' +",
"        '<input type=\"text\" id=\"wzCabPattern\" placeholder=\"^_?(IO-\\\\d+)\" />' +",
"        '<input type=\"text\" id=\"wzCabTemplate\" placeholder=\"Cabinet {cabinet_code}\" />' +",
"        '<span class=\"graph-form__hint\">Regex и шаблон имени шкафа на основе имени листа.</span>' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\"><label>9. columns (JSON)</label><div class=\"graph-form__field\">' +",
"        '<textarea id=\"wzColumns\" class=\"graph-mono\" rows=\"8\" placeholder=\"{\\n  &quot;loop_tag&quot;: &quot;LOOPTAG&quot;,\\n  &quot;address&quot;: &quot;ADDRESS&quot;\\n}\"></textarea>' +",
"        '<span class=\"graph-form__hint\">Маппинг внутренних полей парсера на заголовки колонок XLSX (metso-style).</span>' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\"><label>per_sheet (JSON, koyo)</label><div class=\"graph-form__field\">' +",
"        '<textarea id=\"wzPerSheet\" class=\"graph-mono\" rows=\"8\" placeholder=\"{\\n  &quot;AI&quot;: { &quot;builds&quot;: [&quot;station&quot;,&quot;card&quot;,&quot;channel&quot;,&quot;signal&quot;], &quot;signal_kind&quot;: &quot;AI&quot;, &quot;columns&quot;: { &quot;tag&quot;: &quot;Tag Name&quot; } }\\n}\"></textarea>' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\"><label>skip_rows (JSON)</label><div class=\"graph-form__field\">' +",
"        '<textarea id=\"wzSkipRows\" class=\"graph-mono\" rows=\"4\" placeholder=\"[{ &quot;condition&quot;: &quot;loop_tag_empty&quot; }]\"></textarea>' +",
"      '</div></div>' +",
"      '<div id=\"wzErr\" class=\"graph-form__error\" style=\"display:none\"></div>' +",
"      '<div id=\"wzPreviewWrap\"></div>';",
"",
"    function fillFromData() {",
"      $('wzStyle').value = detectedStyle;",
"      $('wzId').value = data.id || '';",
"      if (isEdit) { $('wzId').disabled = true; }",
"      $('wzDesc').value = data.description || '';",
"      var m = data.match || {};",
"      $('wzExt').value = (m.file_extensions || []).join(', ');",
"      $('wzSheetRe').value = m.sheet_name_pattern || '';",
"      $('wzReqHeaders').value = (m.required_headers || []).join(', ');",
"      $('wzReqSheets').value = (m.required_sheets || []).join(', ');",
"      var l = data.layout || {};",
"      $('wzHeaderRow').value = l.header_row || 1;",
"      $('wzDataStart').value = l.data_start_row || 2;",
"      var allBuilds = ['cabinet','station','card','channel','signal','device'];",
"      var selected = new Set(Array.isArray(data.builds) ? data.builds : []);",
"      $('wzBuilds').innerHTML = allBuilds.map(function (b) {",
"        var ck = selected.has(b) ? 'checked' : '';",
"        return '<label style=\"display:inline-flex;align-items:center;gap:4px;\"><input type=\"checkbox\" data-build=\"' + b + '\" ' + ck + ' />' + b + '</label>';",
"      }).join('');",
"      var c = data.cabinet || {};",
"      $('wzCabPattern').value = c.pattern || '';",
"      $('wzCabTemplate').value = c.name_template || '';",
"      $('wzColumns').value = JSON.stringify(data.columns || {}, null, 2);",
"      $('wzPerSheet').value = data.per_sheet ? JSON.stringify(data.per_sheet, null, 2) : '';",
"      $('wzSkipRows').value = JSON.stringify(Array.isArray(data.skip_rows) ? data.skip_rows : [], null, 2);",
"      toggleStyleRows();",
"    }",
"    function toggleStyleRows() {",
"      var style = $('wzStyle').value;",
"      $('wzCabinetRow').style.display = style === 'metso' ? 'grid' : 'none';",
"    }",
"    function parseList(s) { return String(s || '').split(',').map(function (x) { return x.trim(); }).filter(function (x) { return x.length > 0; }); }",
"    function collectPayload() {",
"      var payload = {};",
"      if (!isEdit) payload.id = ($('wzId').value || '').trim();",
"      payload.description = ($('wzDesc').value || '').trim();",
"      payload.match = {};",
"      var ext = parseList($('wzExt').value); if (ext.length) payload.match.file_extensions = ext;",
"      var snp = ($('wzSheetRe').value || '').trim(); if (snp) payload.match.sheet_name_pattern = snp;",
"      var rh = parseList($('wzReqHeaders').value); if (rh.length) payload.match.required_headers = rh;",
"      var rs = parseList($('wzReqSheets').value); if (rs.length) payload.match.required_sheets = rs;",
"      payload.layout = { header_row: Number($('wzHeaderRow').value) || 1, data_start_row: Number($('wzDataStart').value) || 2 };",
"      payload.builds = Array.from(document.querySelectorAll('#wzBuilds input[type=checkbox]:checked')).map(function (cb) { return cb.getAttribute('data-build'); });",
"      var style = $('wzStyle').value;",
"      if (style === 'metso') {",
"        var cabPattern = ($('wzCabPattern').value || '').trim();",
"        var cabTemplate = ($('wzCabTemplate').value || '').trim();",
"        if (cabPattern || cabTemplate) {",
"          payload.cabinet = { source: 'sheet_name', pattern: cabPattern, name_template: cabTemplate || 'Cabinet {cabinet_code}' };",
"        }",
"      }",
"      var colTxt = ($('wzColumns').value || '').trim();",
"      if (colTxt) {",
"        try { payload.columns = JSON.parse(colTxt); }",
"        catch (e) { throw new Error('columns: невалидный JSON — ' + e.message); }",
"      }",
"      var psTxt = ($('wzPerSheet').value || '').trim();",
"      if (psTxt) {",
"        try { payload.per_sheet = JSON.parse(psTxt); }",
"        catch (e) { throw new Error('per_sheet: невалидный JSON — ' + e.message); }",
"      }",
"      var skTxt = ($('wzSkipRows').value || '').trim();",
"      if (skTxt) {",
"        try { payload.skip_rows = JSON.parse(skTxt); }",
"        catch (e) { throw new Error('skip_rows: невалидный JSON — ' + e.message); }",
"      }",
"      return payload;",
"    }",
"",
"    setTimeout(fillFromData, 0);",
"    setTimeout(function () {",
"      var styleSel = $('wzStyle');",
"      if (styleSel) styleSel.addEventListener('change', toggleStyleRows);",
"      var sample = $('wzSample');",
"      if (sample) sample.addEventListener('change', function () {",
"        var f = sample.files && sample.files[0];",
"        if (!f) return;",
"        var fd = new FormData(); fd.append('file', f);",
"        $('wzSampleHint').textContent = 'Анализ файла…';",
"        api('POST', '/api/v2/graph/profiles/detect-style', fd).then(function (res) {",
"          sampleSheets = res.sheets || [];",
"          detectedStyle = res.style || detectedStyle;",
"          $('wzStyle').value = detectedStyle;",
"          $('wzStyleHint').textContent = 'Автодетект: ' + detectedStyle + '. Листы: ' + sampleSheets.map(function (s) { return s.name; }).join(', ');",
"          if (sampleSheets.length === 1 && (!$('wzColumns').value || $('wzColumns').value === '{}')) {",
"            var hdr = sampleSheets[0].sample_header || [];",
"            var map = {}; hdr.forEach(function (h) { if (h && String(h).trim()) map[String(h).trim()] = String(h).trim(); });",
"            // do not overwrite; only fill if user hasn't edited",
"          }",
"          toggleStyleRows();",
"          $('wzSampleHint').textContent = 'Готово. Можно нажать «Проверить профиль».';",
"        }).catch(function (err) {",
"          $('wzSampleHint').textContent = 'Не удалось проанализировать файл: ' + err.message;",
"        });",
"      });",
"    }, 0);",
"",
"    function showError(msg) { var e = $('wzErr'); e.style.display = 'block'; e.textContent = msg; }",
"    function clearError() { var e = $('wzErr'); e.style.display = 'none'; e.textContent = ''; }",
"",
"    var testBtn = makeBtn('Проверить профиль', 'btn--ghost', function () {",
"      clearError();",
"      var sample = $('wzSample');",
"      var f = sample && sample.files && sample.files[0];",
"      if (!f) { showError('Прикрепите образец XLSX в разделе 1, чтобы проверить профиль.'); return; }",
"      var payload;",
"      try { payload = collectPayload(); } catch (e) { showError(e.message); return; }",
"      if (!payload.id && isEdit) payload.id = data.id;",
"      var fd = new FormData(); fd.append('file', f); fd.append('profile', JSON.stringify(payload));",
"      var pw = $('wzPreviewWrap'); pw.innerHTML = '<div class=\"settings-hint\">Проверка…</div>';",
"      api('POST', '/api/v2/graph/profiles/test', fd).then(function (res) {",
"        renderPreview(pw, res);",
"      }).catch(function (err) {",
"        pw.innerHTML = '';",
"        showError(err.message || 'Не удалось проверить профиль');",
"      });",
"    });",
"    var saveBtn = makeBtn('Сохранить', 'btn--accent', function () {",
"      clearError();",
"      var payload;",
"      try { payload = collectPayload(); } catch (e) { showError(e.message); return; }",
"      if (isEdit) {",
"        api('PUT', '/api/v2/graph/profiles/' + encodeURIComponent(data.id), payload).then(function (res) {",
"          toast(res.message || 'Профиль обновлён');",
"          closeModal(); loadProfiles();",
"        }).catch(function (err) { showError(err.message); });",
"      } else {",
"        if (!/^[a-z][a-z0-9_]*$/.test(payload.id || '')) {",
"          showError('ID профиля должен быть snake_case латиницей'); return;",
"        }",
"        api('POST', '/api/v2/graph/profiles', payload).then(function (res) {",
"          toast(res.message || 'Профиль создан');",
"          closeModal(); loadProfiles();",
"        }).catch(function (err) { showError(err.message); });",
"      }",
"    });",
"    var cancelBtn = makeBtn('Отмена', 'btn--ghost', closeModal);",
"    openModal(isEdit ? ('Изменить профиль: ' + data.id) : 'Создание профиля парсера', wrap, [cancelBtn, testBtn, saveBtn]);",
"  }",
"",
"  function renderPreview(container, res) {",
"    var s = res.summary || {};",
"    var rows = ['cabinet','station','card','channel','signal','device'].map(function (k) {",
"      var n = (s[k] && s[k].found) || 0;",
"      return '<tr><td>' + k + '</td><td style=\"text-align:right;\">' + n + '</td></tr>';",
"    }).join('');",
"    var warningsHtml = '';",
"    if (Array.isArray(res.warnings) && res.warnings.length > 0) {",
"      warningsHtml = '<div class=\"graph-warnings\">' + res.warnings.map(function (w) {",
"        var examples = (w.examples || []).slice(0, 3).join(', ');",
"        return '<div class=\"graph-warning-item\">' + esc(w.code) + ' (×' + (w.count || 0) + ')' +",
"          (examples ? ': ' + esc(examples) : '') +",
"          (w.hint ? '<br><span class=\"graph-form__hint\">' + esc(w.hint) + '</span>' : '') +",
"          '</div>';",
"      }).join('') + '</div>';",
"    }",
"    var samples = Array.isArray(res.sample_signals) ? res.sample_signals : [];",
"    var samplesHtml = '';",
"    if (samples.length > 0) {",
"      samplesHtml = '<table class=\"graph-preview-table\" style=\"margin-top:8px;\"><thead><tr><th>tag</th><th>kind</th><th>raw</th><th>addr</th><th>chan</th><th>station</th></tr></thead><tbody>' +",
"        samples.map(function (sg) {",
"          return '<tr>' +",
"            '<td>' + esc(sg.tag || '') + '</td>' +",
"            '<td>' + esc(sg.signal_kind || '') + '</td>' +",
"            '<td>' + esc(sg.signal_kind_raw || '') + '</td>' +",
"            '<td>' + esc(sg.address || '') + '</td>' +",
"            '<td>' + esc(sg.channel || '') + '</td>' +",
"            '<td>' + esc(sg.station_code || '') + '</td>' +",
"          '</tr>';",
"        }).join('') +",
"        '</tbody></table>';",
"    }",
"    container.innerHTML = '<div class=\"graph-preview\"><strong>Если бы профиль применили:</strong>' +",
"      '<table class=\"graph-preview-table\"><tbody>' + rows + '</tbody></table>' +",
"      '<div class=\"graph-form__hint\" style=\"margin-top:4px;\">Связей (оценка): ' + (res.edges_estimate || 0) + '</div>' +",
"      warningsHtml + samplesHtml + '</div>';",
"  }",
"",
"  function confirmDeleteProfile(profileId) {",
"    var wrap = document.createElement('div');",
"    wrap.innerHTML = '<p style=\"margin:0;\">Удалить профиль <strong>' + esc(profileId) + '</strong>?</p>' +",
"      '<p class=\"settings-hint\" style=\"margin-top:6px;\">Граф уже импортированных документов не меняется. Файлы, которые подходили под этот профиль, при будущем импорте будут проверяться на остальные профили.</p>';",
"    var cancelBtn = makeBtn('Отмена', 'btn--ghost', closeModal);",
"    var del = makeBtn('Удалить', 'btn--danger', function () {",
"      api('DELETE', '/api/v2/graph/profiles/' + encodeURIComponent(profileId)).then(function (res) {",
"        toast(res.message || 'Удалено');",
"        closeModal(); loadProfiles();",
"      }).catch(function (err) { toast('Не удалось удалить: ' + err.message, 'error'); });",
"    });",
"    openModal('Удалить профиль?', wrap, [cancelBtn, del]);",
"  }",
"",
"  // ─── Subtabs / event wiring ──────────────────────────────────",
"  function setActiveSubtab(name) {",
"    document.querySelectorAll('[data-graph-subtab]').forEach(function (btn) {",
"      btn.classList.toggle('is-active', btn.getAttribute('data-graph-subtab') === name);",
"    });",
"    document.querySelectorAll('[data-graph-subpanel]').forEach(function (panel) {",
"      panel.classList.toggle('is-active', panel.getAttribute('data-graph-subpanel') === name);",
"    });",
"  }",
"  function bindEvents() {",
"    document.addEventListener('click', function (e) {",
"      var subBtn = e.target.closest('[data-graph-subtab]');",
"      if (subBtn) { setActiveSubtab(subBtn.getAttribute('data-graph-subtab')); return; }",
"      var action = e.target.closest('[data-graph-action]');",
"      if (action) {",
"        var name = action.getAttribute('data-graph-action');",
"        var id = action.getAttribute('data-id');",
"        if (name === 'edit-profile') {",
"          var p = state.profiles.find(function (x) { return x.id === id; });",
"          if (p) openProfileEditor(p);",
"        } else if (name === 'delete-profile') {",
"          confirmDeleteProfile(id);",
"        } else if (name === 'edit-alias') {",
"          openAliasEditor(id);",
"        } else if (name === 'delete-alias') {",
"          confirmDeleteAlias(id);",
"        }",
"        return;",
"      }",
"    });",
"    var cBtn = $('graphProfileCreateBtn'); if (cBtn) cBtn.addEventListener('click', function () { openProfileEditor(null); });",
"    var rBtn = $('graphProfileRawBtn'); if (rBtn) rBtn.addEventListener('click', function () { openRawEditor('profiles'); });",
"    var pRef = $('graphProfileRefresh'); if (pRef) pRef.addEventListener('click', loadProfiles);",
"    var aBtn = $('graphAliasCreateBtn'); if (aBtn) aBtn.addEventListener('click', function () { openAliasEditor(null); });",
"    var arBtn = $('graphAliasRawBtn'); if (arBtn) arBtn.addEventListener('click', function () { openRawEditor('aliases'); });",
"    var aRef = $('graphAliasRefresh'); if (aRef) aRef.addEventListener('click', loadAliases);",
"  }",
"",
"  window.__graphTabActivate = function () {",
"    if (state.loaded) return;",
"    state.loaded = true;",
"    ensureModal();",
"    bindEvents();",
"    Promise.all([loadProfiles(), loadAliases()]);",
"  };",
"})();",
""
  ].join("\n");
}

export function renderSettingsPage({ ICONS, renderLayout }) {
  const graphIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>';
  const contextSidebar = `
    <div class="sidebar-context__title">Разделы настроек</div>
    <nav class="settings-anchors" aria-label="Разделы настроек">
      <a class="settings-anchor" href="#" data-settings-tab-link="models">Модели и облако</a>
      <a class="settings-anchor" href="#" data-settings-tab-link="search">Поиск</a>
      <a class="settings-anchor" href="#" data-settings-tab-link="prompt">Системный промпт</a>
      <a class="settings-anchor" href="#" data-settings-tab-link="services">Сервисы</a>
      <a class="settings-anchor" href="#" data-settings-tab-link="diagnostics">Диагностика</a>
      <a class="settings-anchor" href="#" data-settings-tab-link="graph">Граф знаний</a>
      <a class="settings-anchor" href="#" data-settings-tab-link="maintenance">Обслуживание</a>
      <a class="settings-anchor" href="#" data-settings-tab-link="backups">Бэкапы</a>
    </nav>
    <div class="sidebar-context__footer">
      <span>LOCAL-RAG</span>
      <a href="https://github.com/sergeyxmao/local-rag-platform" target="_blank" rel="noopener">GitHub →</a>
    </div>
  `;

  const headerTabs = `
    <nav class="settings-tabs" id="settingsTabs" role="tablist" aria-label="Разделы настроек">
      <button type="button" class="header-tab is-active" data-settings-tab="models" role="tab">${ICONS.settings}<span>Модели и облако</span></button>
      <button type="button" class="header-tab" data-settings-tab="search" role="tab">${ICONS.search}<span>Поиск</span></button>
      <button type="button" class="header-tab" data-settings-tab="prompt" role="tab">${ICONS.fileText}<span>Промпт</span></button>
      <button type="button" class="header-tab" data-settings-tab="services" role="tab">${ICONS.alertCircle}<span>Сервисы</span></button>
      <button type="button" class="header-tab" data-settings-tab="diagnostics" role="tab">${ICONS.check}<span>Диагностика</span></button>
      <button type="button" class="header-tab" data-settings-tab="graph" role="tab">${graphIcon}<span>Граф знаний</span></button>
      <button type="button" class="header-tab" data-settings-tab="maintenance" role="tab">${ICONS.alertCircle}<span>Обслуживание</span></button>
      <button type="button" class="header-tab" data-settings-tab="backups" role="tab">${ICONS.database}<span>Бэкапы</span></button>
    </nav>
  `;

  const content = `
    <main class="settings-page">
      <div class="settings-tab-panel is-active" data-settings-panel="models">
      <div class="settings-card" id="section-models">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.settings}<span>Модели</span></div>
          <span class="settings-hint">Источник: <span class="mono">config/models.yaml</span></span>
        </div>
        <div class="settings-card__body">
          <div class="settings-row">
            <div class="settings-field">
              <label for="cfgChatModel">Чат-модель</label>
              <input class="settings-input settings-input--mono" id="cfgChatModel" type="text" readonly />
            </div>
            <div class="settings-field">
              <label for="cfgEmbedModel">Embedding-модель</label>
              <input class="settings-input settings-input--mono" id="cfgEmbedModel" type="text" readonly />
            </div>
          </div>
          <div class="settings-field">
            <label for="cfgOllamaUrl">Базовый URL Ollama</label>
            <input class="settings-input settings-input--mono" id="cfgOllamaUrl" type="text" readonly />
          </div>
          <p class="settings-hint">Модели и эмбеддинги задаются в файле <span class="mono">config/models.yaml</span> и переменных окружения. Редактирование через UI отключено намеренно — это снижает риск рассинхронизации между UI и контейнером.</p>
        </div>
      </div>

      <div class="settings-card" id="section-cloud">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.upload}<span>Облачные провайдеры</span></div>
          <span class="settings-hint">OpenAI-совместимый API · подробности — <a href="/docs/CLOUD_PROVIDER.md" style="color:var(--accent)" target="_blank">CLOUD_PROVIDER.md</a></span>
        </div>
        <div class="settings-card__body">
          <div class="settings-banner" id="cfgCloudBanner"></div>
          <div id="cfgCloudList" style="display:flex;flex-direction:column;gap:10px;">
            <div class="filters-empty">Загрузка списка провайдеров…</div>
          </div>
          <label class="settings-toggle">
            <input type="checkbox" id="cfgCloudUseDefault" />
            <span>Использовать облако по умолчанию для новых чатов</span>
          </label>
          <div class="settings-actions">
            <button type="button" class="btn btn--accent" id="cfgCloudAddBtn">${ICONS.plus}<span>Добавить провайдера</span></button>
          </div>
          <div class="provider-add-form" id="cfgCloudAddForm" style="display:none">
            <div class="settings-row">
              <div class="settings-field">
                <label for="cfgCloudName">Название провайдера</label>
                <input class="settings-input" id="cfgCloudName" type="text" placeholder="Например: DeepSeek" />
              </div>
              <div class="settings-field">
                <label for="cfgCloudModel">Модель</label>
                <input class="settings-input settings-input--mono" id="cfgCloudModel" type="text" placeholder="Например: deepseek-chat" />
              </div>
            </div>
            <div class="settings-field">
              <label for="cfgCloudBaseUrl">Base URL</label>
              <input class="settings-input settings-input--mono" id="cfgCloudBaseUrl" type="text" placeholder="https://api.deepseek.com" />
            </div>
            <div class="settings-field">
              <label for="cfgCloudApiKey">API Key</label>
              <input class="settings-input settings-input--mono" id="cfgCloudApiKey" type="password" placeholder="sk-..." autocomplete="off" />
            </div>
            <div class="settings-actions">
              <button type="button" class="btn btn--ghost" id="cfgCloudAddCancel">Отмена</button>
              <button type="button" class="btn btn--accent" id="cfgCloudAddSave">${ICONS.check}<span>Добавить</span></button>
            </div>
          </div>
          <p class="settings-hint">Ключи хранятся в БД проекта в plaintext (см. <span class="mono">CLOUD_PROVIDER.md</span>). В API возвращаются замаскированными, в логи не пишутся. В чате выбор провайдера — в шапке.</p>
        </div>
      </div>
      </div>

      <div class="settings-tab-panel" data-settings-panel="services">
      <div class="settings-card" id="section-services">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.alertCircle}<span>Сервисы</span></div>
          <button type="button" class="btn btn--ghost" id="cfgServicesRefresh">${ICONS.refresh}<span>Обновить</span></button>
        </div>
        <div class="settings-card__body">
          <div class="services-grid" id="cfgServices">
            <div class="filters-empty">Проверка сервисов…</div>
          </div>
        </div>
      </div>

      <div class="settings-card" id="section-ocr">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.fileText}<span>OCR (распознавание сканов)</span></div>
          <span class="settings-hint" id="cfgOcrAvailability">проверяется…</span>
        </div>
        <div class="settings-card__body">
          <label class="settings-toggle">
            <input type="checkbox" id="cfgOcrAutoEmpty" />
            <span>Включить автоматический OCR для PDF-страниц без текста</span>
          </label>
          <label class="settings-toggle">
            <input type="checkbox" id="cfgOcrAll" />
            <span>OCR для всех страниц PDF (медленно)</span>
          </label>
          <div class="settings-banner" id="cfgOcrBanner"></div>
          <div class="settings-actions">
            <button type="button" class="btn btn--accent" id="cfgOcrSave">${ICONS.check}<span>Сохранить</span></button>
          </div>
          <p class="settings-hint">OCR работает локально через <span class="mono">tesseract</span> (rus+eng). Действует только для новых документов; для уже загруженных — кнопка «Переиндексировать» в действиях документа на странице «База знаний → Документы».</p>
        </div>
      </div>

      <div class="settings-card" id="section-indexing">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.refresh}<span>Параллелизм индексации</span></div>
          <span class="settings-hint" id="cfgIndexingStatus"></span>
        </div>
        <div class="settings-card__body">
          <div class="settings-row">
            <div class="settings-field">
              <label for="cfgIndexingConcurrency">Сколько документов обрабатывать одновременно</label>
              <input class="settings-input" id="cfgIndexingConcurrency" type="number" min="1" max="4" step="1" />
            </div>
            <div class="settings-field" style="justify-content:end">
              <button type="button" class="btn btn--accent" id="cfgIndexingSave" style="align-self:end">${ICONS.check}<span>Сохранить</span></button>
            </div>
          </div>
          <div class="settings-banner" id="cfgIndexingBanner"></div>
          <p class="settings-hint">Сколько документов одновременно проходят полный pipeline индексации (text/OCR → chunking → embeddings → Qdrant). На слабом CPU держите <strong>1</strong> — параллельный pipeline конкурирует за CPU, память и канал к Ollama, что замедляет общее время. На мощной машине можно повысить до 2–3. Максимум — 4. Изменения применяются мгновенно, текущие задачи не прерываются.</p>
        </div>
      </div>
      </div>

      <div class="settings-tab-panel" data-settings-panel="diagnostics">
      <div class="settings-card" id="section-diagnostics">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.check}<span>Готовность системы</span></div>
          <button type="button" class="btn btn--accent" id="cfgDiagRun">${ICONS.refresh}<span>Запустить проверки</span></button>
        </div>
        <div class="settings-card__body">
          <div class="settings-banner" id="cfgDiagBanner"></div>
          <p class="settings-hint" id="cfgDiagSummary">Нажмите «Запустить проверки», чтобы пройтись по 15 пунктам готовности.</p>
          <div class="diag-grid" id="cfgDiagList"></div>
        </div>
      </div>
      </div>

      <div class="settings-tab-panel" data-settings-panel="graph">
        <div class="settings-card" id="section-graph">
          <div class="settings-card__head">
            <div class="settings-card__title">${graphIcon}<span>Граф знаний — конфигурация парсера</span></div>
            <span class="settings-hint">Файлы: <span class="mono">config/graph-parsers.yaml</span>, <span class="mono">config/graph-aliases.yaml</span></span>
          </div>
          <div class="settings-card__body" style="gap:14px;">
            <div class="graph-subtabs" role="tablist" aria-label="Подвкладки графа">
              <button type="button" class="graph-subtab is-active" data-graph-subtab="profiles" role="tab">Профили парсера</button>
              <button type="button" class="graph-subtab" data-graph-subtab="aliases" role="tab">Алиасы signal_kind</button>
            </div>
            <p class="settings-hint">
              Профили решают, как читать XLSX с таблицами сигналов. Алиасы — как нормализовать значения signal_kind
              (AI/AO/DI/DO/RTD/FI/RS). После любого сохранения kb-api автоматически перечитывает YAML — рестарт не нужен.
              Резервные копии хранятся в <span class="mono">data/config-backups/</span> (последние 10).
            </p>

            <div class="graph-subtab-panel is-active" data-graph-subpanel="profiles">
              <div class="settings-actions" style="margin-bottom:8px;">
                <button type="button" class="btn btn--accent" id="graphProfileCreateBtn">${ICONS.plus}<span>Создать профиль</span></button>
                <button type="button" class="btn" id="graphProfileRawBtn">Редактировать YAML напрямую</button>
                <button type="button" class="btn btn--ghost btn--icon" id="graphProfileRefresh" aria-label="Обновить">${ICONS.refresh}</button>
              </div>
              <div class="settings-banner" id="graphProfileBanner"></div>
              <div id="graphProfileList" style="display:flex;flex-direction:column;gap:8px;">
                <div class="settings-hint">Загрузка…</div>
              </div>
            </div>

            <div class="graph-subtab-panel" data-graph-subpanel="aliases">
              <div class="settings-actions" style="margin-bottom:8px;">
                <button type="button" class="btn btn--accent" id="graphAliasCreateBtn">${ICONS.plus}<span>Добавить значение</span></button>
                <button type="button" class="btn" id="graphAliasRawBtn">Редактировать YAML напрямую</button>
                <button type="button" class="btn btn--ghost btn--icon" id="graphAliasRefresh" aria-label="Обновить">${ICONS.refresh}</button>
              </div>
              <div class="settings-banner" id="graphAliasBanner"></div>
              <div id="graphAliasList" style="display:flex;flex-direction:column;gap:8px;">
                <div class="settings-hint">Загрузка…</div>
              </div>
            </div>
          </div>
        </div>

        <div class="kb-modal-backdrop" id="graphModalBackdrop">
          <div class="kb-modal" role="dialog" aria-modal="true" style="max-width:840px;">
            <div class="kb-modal__head">
              <div class="kb-modal__title" id="graphModalTitle">Окно</div>
              <button type="button" class="btn btn--ghost btn--icon" id="graphModalCloseBtn" aria-label="Закрыть">${ICONS.x}</button>
            </div>
            <div class="kb-modal__body" id="graphModalBody"></div>
            <div class="kb-modal__foot" id="graphModalFoot"></div>
          </div>
        </div>
      </div>

      <div class="settings-tab-panel" data-settings-panel="search">
      <div class="settings-card" id="section-retrieval">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.search}<span>Поиск (retrieval)</span></div>
          <span class="settings-hint">База: <span class="mono">config/retrieval.yaml</span></span>
        </div>
        <div class="settings-card__body">
          <div class="settings-grid" id="retrievalFields"></div>
          <div class="settings-actions">
            <button type="button" class="btn btn--accent" id="retrievalSave">${ICONS.check}<span>Сохранить</span></button>
            <button type="button" class="btn btn--ghost" id="retrievalReset">Сбросить к значениям из файла</button>
          </div>
          <div class="settings-banner" id="retrievalBanner"></div>
          <p class="settings-hint">Значения из YAML — базовые. Изменения в UI сохраняются в БД и переопределяют файл. Применяются к следующему запросу.</p>
        </div>
      </div>
      </div>

      <div class="settings-tab-panel" data-settings-panel="prompt">
      <div class="settings-card" id="section-prompt">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.fileText}<span>Системный промпт</span></div>
          <span class="settings-hint" id="promptStatus"></span>
        </div>
        <div class="settings-card__body">
          <div class="settings-field">
            <label for="cfgPromptTemplate">Шаблон промпта</label>
            <textarea class="settings-input settings-input--mono" id="cfgPromptTemplate" rows="14"></textarea>
            <div class="settings-banner" id="cfgPromptWarn"></div>
          </div>
          <div class="settings-actions">
            <button type="button" class="btn btn--accent" id="cfgPromptSave">${ICONS.check}<span>Сохранить</span></button>
            <button type="button" class="btn btn--ghost" id="cfgPromptReset">Восстановить по умолчанию</button>
          </div>
          <div class="settings-banner" id="cfgPromptBanner"></div>
          <p class="settings-hint">Доступные плейсхолдеры:</p>
          <ul class="settings-hint" style="margin:0;padding-left:18px;">
            <li><span class="mono">{sources}</span> — найденные фрагменты документов</li>
            <li><span class="mono">{question}</span> — текущий вопрос пользователя</li>
            <li><span class="mono">{history}</span> — последние сообщения чата (для контекста)</li>
          </ul>
        </div>
      </div>
      </div>

      <div class="settings-tab-panel" data-settings-panel="maintenance">
      <div class="settings-card" id="section-maintenance">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.alertCircle}<span>Обслуживание</span></div>
        </div>
        <div class="settings-card__body">
          <div class="settings-actions">
            <button type="button" class="btn" id="cfgMaintRebuild">${ICONS.refresh}<span>Пересобрать Qdrant</span></button>
            <span class="settings-hint">Из PostgreSQL без потери документов.</span>
          </div>
          <div class="danger-block">
            <div class="danger-block__text">
              <strong>Сброс содержимого.</strong> Удалит ВСЕ документы, чанки, страницы и Qdrant points. Системный раздел и схема сохранятся. Файлы в <span class="mono">data/raw</span> по умолчанию остаются.
            </div>
            <button type="button" class="btn btn--danger" id="cfgMaintReset">${ICONS.trash}<span>Сброс содержимого</span></button>
          </div>
          <div class="settings-banner" id="cfgMaintBanner"></div>
        </div>
      </div>

      <div class="settings-card" id="section-theme">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.moon}<span>Тема интерфейса</span></div>
          <span class="settings-hint">Личный выбор — в шапке боковой панели</span>
        </div>
        <div class="settings-card__body">
          <div class="settings-row">
            <div class="settings-field">
              <label for="cfgThemeDefault">Тема по умолчанию для новых пользователей</label>
              <select class="settings-select" id="cfgThemeDefault">
                <option value="dark">Тёмная</option>
                <option value="light">Светлая</option>
                <option value="system">Системная</option>
              </select>
            </div>
            <div class="settings-field" style="justify-content:end">
              <button type="button" class="btn btn--accent" id="cfgThemeSave" style="align-self:end">${ICONS.check}<span>Сохранить</span></button>
            </div>
          </div>
          <div class="settings-banner" id="cfgThemeBanner"></div>
          <p class="settings-hint">Применяется к пользователям без личного выбора темы. Личный выбор хранится в <span class="mono">localStorage.localrag.theme</span> и не перезаписывается.</p>
        </div>
      </div>
      </div>

      <div class="settings-tab-panel" data-settings-panel="backups">
      <div class="settings-card" id="section-backups">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.database}<span>Бэкапы</span></div>
          <div style="display:flex;gap:6px;align-items:center;">
            <button type="button" class="btn btn--ghost btn--icon" id="cfgBackupRefresh" aria-label="Обновить">${ICONS.refresh}</button>
            <button type="button" class="btn btn--accent" id="cfgBackupCreate">${ICONS.plus}<span>Создать бэкап</span></button>
          </div>
        </div>
        <div class="settings-card__body">
          <p class="settings-hint">
            <strong>Включает:</strong> PostgreSQL (документы, чанки, knowledge_nodes, чаты, настройки).
            <strong>НЕ включает:</strong> Qdrant (vector store) и файлы в <span class="mono">data/raw</span>.
            После восстановления может потребоваться «Пересобрать Qdrant», если бэкап старше текущих индексов.
          </p>
          <div class="settings-banner" id="cfgBackupBanner"></div>
          <div id="cfgBackupList" style="display:flex;flex-direction:column;gap:6px;"></div>
          <div class="settings-row" style="border-top:1px solid var(--border);padding-top:12px;">
            <div class="settings-field">
              <label for="cfgRestoreFile">Восстановить из файла (.sql или .sql.gz)</label>
              <input class="settings-input" id="cfgRestoreFile" type="file" accept=".sql,.gz,.sql.gz" />
            </div>
            <div class="settings-field" style="justify-content:end">
              <button type="button" class="btn btn--danger" id="cfgRestoreUpload" style="align-self:end">${ICONS.upload}<span>Восстановить из файла</span></button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </main>
  `;

  const initialState = { icons: {} };
  const initialStateJson = JSON.stringify(initialState).replace(/</g, "\\u003c");

  return renderLayout({
    activeNav: "settings",
    pageTitle: "Настройки",
    pageDocumentTitle: "Настройки — LOCAL-RAG",
    content,
    headerTabs,
    contextSidebar,
    pageScript: renderSettingsScript(initialStateJson, renderGraphTabScript()),
    bodyClass: "page-settings",
  }).replace("</style>", `${renderSettingsCss()}</style>`);
}
