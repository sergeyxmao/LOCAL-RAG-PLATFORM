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
  `;
}

function renderSettingsScript(initialStateJson) {
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
        { path: ["semantic", "top_k"], label: "Кандидатов из semantic-поиска", type: "number", min: 1, max: 50, hint: "semantic.top_k" },
        { path: ["bm25", "top_k"], label: "Кандидатов из BM25 (лексический)", type: "number", min: 1, max: 50, hint: "bm25.top_k" },
        { path: ["fusion", "top_k_final"], label: "Итоговых фрагментов в ответ", type: "number", min: 1, max: 30, hint: "fusion.top_k_final" },
        { path: ["reranking", "enabled"], label: "Re-ranking включён", type: "boolean", hint: "reranking.enabled" },
        { path: ["reranking", "candidate_pool"], label: "Пул кандидатов для re-ranking", type: "number", min: 1, max: 100, hint: "reranking.candidate_pool" },
      ];

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
          if (f.type === "boolean") {
            var checked = curVal === true ? "checked" : "";
            return '<div class="settings-field">' +
              '<label class="settings-toggle" for="' + inputId + '">' +
              '<input type="checkbox" id="' + inputId + '" data-retrieval-path="' + f.path.join(".") + '" data-retrieval-type="boolean" ' + checked + ' /> ' +
              escapeHtml(f.label) +
              '</label>' +
              '<span class="settings-hint mono">' + escapeHtml(f.hint) + ' · по умолчанию: ' + (defVal ? "вкл" : "выкл") + '</span>' +
              '</div>';
          }
          return '<div class="settings-field">' +
            '<label for="' + inputId + '">' + escapeHtml(f.label) + '</label>' +
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

      function bootstrap() {
        bindEvents();
        loadSettings();
        loadServices();
        loadBackups();
      }

      bootstrap();
    })();
  `;
}

export function renderSettingsPage({ ICONS, renderLayout }) {
  const contextSidebar = `
    <div class="sidebar-context__title">Разделы настроек</div>
    <nav class="settings-anchors" aria-label="Якоря настроек">
      <a class="settings-anchor" href="#section-models">Модели</a>
      <a class="settings-anchor" href="#section-cloud">Облачный ИИ</a>
      <a class="settings-anchor" href="#section-services">Сервисы</a>
      <a class="settings-anchor" href="#section-retrieval">Поиск</a>
      <a class="settings-anchor" href="#section-theme">Внешний вид</a>
      <a class="settings-anchor" href="#section-prompt">Системный промпт</a>
      <a class="settings-anchor" href="#section-maintenance">Обслуживание</a>
      <a class="settings-anchor" href="#section-backups">Бэкапы</a>
    </nav>
    <div class="sidebar-context__footer">
      <span>LOCAL-RAG</span>
      <a href="https://github.com/sergeyxmao/local-rag-platform" target="_blank" rel="noopener">GitHub →</a>
    </div>
  `;

  const content = `
    <main class="settings-page">
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

      <div class="settings-card" id="section-theme">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.moon}<span>Внешний вид</span></div>
        </div>
        <div class="settings-card__body">
          <div class="settings-row">
            <div class="settings-field">
              <label for="cfgThemeDefault">Тема по умолчанию</label>
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
    </main>
  `;

  const initialState = { icons: {} };
  const initialStateJson = JSON.stringify(initialState).replace(/</g, "\\u003c");

  return renderLayout({
    activeNav: "settings",
    pageTitle: "Настройки",
    pageDocumentTitle: "Настройки — LOCAL-RAG",
    content,
    contextSidebar,
    pageScript: renderSettingsScript(initialStateJson),
    bodyClass: "page-settings",
  }).replace("</style>", `${renderSettingsCss()}</style>`);
}
