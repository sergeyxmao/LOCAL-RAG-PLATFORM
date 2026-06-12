
    (function () {
      var INITIAL_STATE = window.__UIV2_STATE__ || {};
      var state = {
        settings: null,
        models: null,
        retrieval: null,
        reranking: null,
        rerankingDefaults: null,
        rerankingStatus: null,
        hyde: null,
        enrichment: null,
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
        rerankProvider: document.getElementById("cfgRerankProvider"),
        rerankProviderHint: document.getElementById("cfgRerankProviderHint"),
        rerankLocalUrl: document.getElementById("cfgRerankLocalUrl"),
        rerankJinaKey: document.getElementById("cfgRerankJinaKey"),
        rerankSave: document.getElementById("cfgRerankSave"),
        rerankCheck: document.getElementById("cfgRerankCheck"),
        rerankClearKey: document.getElementById("cfgRerankClearJinaKey"),
        rerankBanner: document.getElementById("rerankBanner"),
        rerankServiceStatus: document.getElementById("rerankServiceStatus"),
        rerankStatusHint: document.getElementById("rerankingStatusHint"),
        rerankPrivacyBanner: document.getElementById("rerankPrivacyBanner"),
        hydeEnabled: document.getElementById("cfgHydeEnabled"),
        hydeProviderId: document.getElementById("cfgHydeProviderId"),
        hydeModel: document.getElementById("cfgHydeModel"),
        hydeMaxTokens: document.getElementById("cfgHydeMaxTokens"),
        hydeTimeoutMs: document.getElementById("cfgHydeTimeoutMs"),
        hydePrompt: document.getElementById("cfgHydePrompt"),
        hydePromptStatus: document.getElementById("cfgHydePromptStatus"),
        hydeStatus: document.getElementById("hydeStatus"),
        hydeSave: document.getElementById("cfgHydeSave"),
        hydePromptReset: document.getElementById("cfgHydePromptReset"),
        hydeBanner: document.getElementById("hydeBanner"),
        ceEnabled: document.getElementById("cfgCeEnabled"),
        ceProviderId: document.getElementById("cfgCeProviderId"),
        ceModel: document.getElementById("cfgCeModel"),
        ceMaxTokens: document.getElementById("cfgCeMaxTokens"),
        ceTimeoutMs: document.getElementById("cfgCeTimeoutMs"),
        ceContextPrompt: document.getElementById("cfgCeContextPrompt"),
        ceContextPromptStatus: document.getElementById("cfgCeContextPromptStatus"),
        ceMetaPrompt: document.getElementById("cfgCeMetaPrompt"),
        ceMetaPromptStatus: document.getElementById("cfgCeMetaPromptStatus"),
        ceStatus: document.getElementById("ceStatus"),
        ceSave: document.getElementById("cfgCeSave"),
        ceContextPromptReset: document.getElementById("cfgCeContextPromptReset"),
        ceMetaPromptReset: document.getElementById("cfgCeMetaPromptReset"),
        ceBanner: document.getElementById("ceBanner"),
        keEnabled: document.getElementById("cfgKeEnabled"),
        keProviderId: document.getElementById("cfgKeProviderId"),
        keModel: document.getElementById("cfgKeModel"),
        keMaxTokens: document.getElementById("cfgKeMaxTokens"),
        keTimeoutMs: document.getElementById("cfgKeTimeoutMs"),
        kePrompt: document.getElementById("cfgKePrompt"),
        kePromptStatus: document.getElementById("cfgKePromptStatus"),
        keStatus: document.getElementById("keStatus"),
        keSave: document.getElementById("cfgKeSave"),
        kePromptReset: document.getElementById("cfgKePromptReset"),
        keBanner: document.getElementById("keBanner"),
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
        generationMaxTokens: document.getElementById("cfgGenerationMaxTokens"),
        generationSave: document.getElementById("cfgGenerationSave"),
        generationBanner: document.getElementById("cfgGenerationBanner"),
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
        if (text.indexOf("{graph_facts}") === -1) {
          warnings.push("ℹ Шаблон не содержит {graph_facts}. Структурные факты из графа будут автоматически добавлены в конец промпта — для контроля их размещения добавьте плейсхолдер вручную.");
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
        renderHydeProvidersDropdown();
        renderCeProvidersDropdown();
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
          { key: "reranker", label: "Reranker (локальный)" },
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

      function rerankerProviderHint(provider) {
        if (provider === "jina") return "Jina API: точно, но фрагменты уходят в облако. Требует API-ключ.";
        if (provider === "local") return "Локальный bge-reranker-base на CPU: приватно, ~0.3–1.5 с на запрос на слабом ноутбуке.";
        return "Эвристика: без модели — взвешенные суммы fusion/semantic/lexical скоров. Самый быстрый режим. Используется как fallback.";
      }

      function renderRerankingForm() {
        if (!dom.rerankProvider) return;
        var data = state.reranking || {};
        var provider = data.provider || "heuristic";
        dom.rerankProvider.value = provider;
        if (dom.rerankProviderHint) {
          dom.rerankProviderHint.textContent = rerankerProviderHint(provider);
        }
        if (dom.rerankLocalUrl) {
          dom.rerankLocalUrl.value = data.localUrl || (state.rerankingDefaults && state.rerankingDefaults.localUrl) || "";
          dom.rerankLocalUrl.placeholder = (state.rerankingDefaults && state.rerankingDefaults.localUrl) || "http://localrag-reranker:8090";
        }
        if (dom.rerankJinaKey) {
          dom.rerankJinaKey.value = data.jinaApiKey || "";
        }
        if (dom.rerankPrivacyBanner) {
          dom.rerankPrivacyBanner.style.display = provider === "jina" ? "" : "none";
        }
      }

      function renderRerankingStatus() {
        if (!dom.rerankServiceStatus) return;
        var status = state.rerankingStatus;
        if (!status) {
          dom.rerankServiceStatus.innerHTML = '<div class="settings-hint">Статус сервисов будет проверен после «Сохранить» или «Проверить доступность».</div>';
          if (dom.rerankStatusHint) dom.rerankStatusHint.textContent = "статус не проверен";
          return;
        }
        var local = status.services && status.services.local ? status.services.local : { ok: false };
        var jina = status.services && status.services.jina ? status.services.jina : { ok: false, configured: false };
        var localBadge = local.ok
          ? '<span class="service-dot service-dot--ok"></span> Локальный reranker: доступен'
          : '<span class="service-dot service-dot--fail"></span> Локальный reranker: ' + escapeHtml(local.error || ("HTTP " + (local.status || "?")));
        var localExtra = local.details
          ? ' <span class="settings-hint mono">' + escapeHtml(local.details.model || "") + (local.details.modelLoaded ? " (загружена)" : " (модель ещё грузится)") + '</span>'
          : "";
        var jinaBadge;
        if (!jina.configured) {
          jinaBadge = '<span class="service-dot service-dot--fail"></span> Jina: ключ не задан';
        } else if (jina.ok) {
          jinaBadge = '<span class="service-dot service-dot--ok"></span> Jina: ключ принят, сеть доступна';
        } else {
          jinaBadge = '<span class="service-dot service-dot--fail"></span> Jina: ' + escapeHtml(jina.error || jina.code || "недоступен");
        }
        dom.rerankServiceStatus.innerHTML =
          '<div class="service-row">' + localBadge + localExtra + '</div>' +
          '<div class="service-row">' + jinaBadge + '</div>';
        if (dom.rerankStatusHint) {
          var current = status.provider || "heuristic";
          if (current === "local") {
            dom.rerankStatusHint.textContent = local.ok ? "режим: локальный — доступен" : "режим: локальный — НЕДОСТУПЕН (будет fallback)";
          } else if (current === "jina") {
            dom.rerankStatusHint.textContent = jina.ok ? "режим: Jina — доступен" : "режим: Jina — НЕДОСТУПЕН (будет fallback)";
          } else {
            dom.rerankStatusHint.textContent = "режим: эвристика";
          }
        }
      }

      function loadReranking() {
        return api("GET", "/api/v2/settings/reranking").then(function (data) {
          state.reranking = data.reranking || { provider: "heuristic", localUrl: "", jinaApiKey: "" };
          state.rerankingDefaults = data.defaults || {};
          renderRerankingForm();
        }).catch(function (err) {
          setBanner(dom.rerankBanner, "Не удалось загрузить настройки reranking: " + err.message, "error");
        });
      }

      function checkRerankingStatus() {
        return api("GET", "/api/v2/settings/reranking/status").then(function (data) {
          state.rerankingStatus = data;
          renderRerankingStatus();
        }).catch(function (err) {
          state.rerankingStatus = null;
          if (dom.rerankServiceStatus) {
            dom.rerankServiceStatus.innerHTML = '<div class="kb-doc-error">Не удалось проверить статус: ' + escapeHtml(err.message) + '</div>';
          }
        });
      }

      function saveReranking() {
        if (!dom.rerankProvider) return;
        var payload = {
          provider: dom.rerankProvider.value,
          localUrl: dom.rerankLocalUrl ? dom.rerankLocalUrl.value : "",
        };
        var rawKey = dom.rerankJinaKey ? dom.rerankJinaKey.value : "";
        if (rawKey && rawKey.indexOf("•••••") === -1 && rawKey.trim() !== "") {
          payload.jinaApiKey = rawKey;
        }
        if (dom.rerankSave) dom.rerankSave.disabled = true;
        setBanner(dom.rerankBanner, "Сохранение…", "success");
        api("PATCH", "/api/v2/settings/reranking", payload).then(function (data) {
          state.reranking = data.reranking;
          renderRerankingForm();
          setBanner(dom.rerankBanner, "Настройки reranking сохранены.", "success");
          return checkRerankingStatus();
        }).catch(function (err) {
          setBanner(dom.rerankBanner, "Не удалось сохранить: " + err.message, "error");
        }).then(function () {
          if (dom.rerankSave) dom.rerankSave.disabled = false;
        });
      }

      function clearJinaKey() {
        if (!window.confirm("Удалить сохранённый Jina-ключ?")) return;
        api("PATCH", "/api/v2/settings/reranking", { clearJinaApiKey: true }).then(function (data) {
          state.reranking = data.reranking;
          renderRerankingForm();
          setBanner(dom.rerankBanner, "Ключ Jina удалён.", "success");
          return checkRerankingStatus();
        }).catch(function (err) {
          setBanner(dom.rerankBanner, "Не удалось удалить ключ: " + err.message, "error");
        });
      }

      function onRerankProviderChange() {
        if (dom.rerankProviderHint) {
          dom.rerankProviderHint.textContent = rerankerProviderHint(dom.rerankProvider.value);
        }
        if (dom.rerankPrivacyBanner) {
          dom.rerankPrivacyBanner.style.display = dom.rerankProvider.value === "jina" ? "" : "none";
        }
      }

      function renderHydeProvidersDropdown() {
        if (!dom.hydeProviderId) return;
        var providers = (state.settings && state.settings.cloudProviders && state.settings.cloudProviders.providers) || [];
        var current = state.hyde && state.hyde.providerId ? state.hyde.providerId : "";
        var options = ['<option value="">— не выбран —</option>'];
        providers.forEach(function (p) {
          var label = (p.name || "(без названия)") + (p.model ? " · " + p.model : "");
          options.push('<option value="' + escapeHtml(p.id) + '">' + escapeHtml(label) + '</option>');
        });
        dom.hydeProviderId.innerHTML = options.join("");
        dom.hydeProviderId.value = current;
      }

      function renderHyde() {
        if (!dom.hydeEnabled || !state.hyde) return;
        var h = state.hyde;
        dom.hydeEnabled.checked = h.enabled === true;
        renderHydeProvidersDropdown();
        if (dom.hydeModel) dom.hydeModel.value = h.model || "";
        if (dom.hydeMaxTokens) dom.hydeMaxTokens.value = h.maxTokens || 400;
        if (dom.hydeTimeoutMs) dom.hydeTimeoutMs.value = h.timeoutMs || 15000;
        if (dom.hydePrompt && dom.hydePrompt.value !== h.prompt) {
          dom.hydePrompt.value = h.prompt || "";
        }
        if (dom.hydePromptStatus) {
          dom.hydePromptStatus.textContent = h.isCustomPrompt
            ? "переопределён"
            : "значение по умолчанию";
        }
        if (dom.hydeStatus) {
          dom.hydeStatus.textContent = h.enabled ? "включён" : "выкл";
        }
      }

      function loadHyde() {
        return api("GET", "/api/v2/settings/hyde").then(function (data) {
          state.hyde = data.hyde || null;
          renderHyde();
        }).catch(function (err) {
          if (dom.hydeBanner) setBanner(dom.hydeBanner, "Не удалось загрузить настройки HyDE: " + err.message, "error");
        });
      }

      function saveHyde() {
        if (!dom.hydeEnabled) return;
        var payload = {
          enabled: dom.hydeEnabled.checked === true,
          providerId: dom.hydeProviderId ? dom.hydeProviderId.value : "",
          model: dom.hydeModel ? dom.hydeModel.value : "",
          maxTokens: dom.hydeMaxTokens ? Number(dom.hydeMaxTokens.value) : 400,
          timeoutMs: dom.hydeTimeoutMs ? Number(dom.hydeTimeoutMs.value) : 15000,
          prompt: dom.hydePrompt ? dom.hydePrompt.value : "",
        };
        if (payload.enabled && !payload.providerId) {
          setBanner(dom.hydeBanner, "Выберите облачного провайдера для HyDE.", "error");
          return;
        }
        if (dom.hydeSave) dom.hydeSave.disabled = true;
        setBanner(dom.hydeBanner, "Сохранение…", "success");
        api("PATCH", "/api/v2/settings/hyde", payload).then(function (data) {
          state.hyde = data.hyde;
          renderHyde();
          setBanner(dom.hydeBanner, "Настройки HyDE сохранены.", "success");
        }).catch(function (err) {
          setBanner(dom.hydeBanner, "Не удалось сохранить: " + err.message, "error");
        }).then(function () {
          if (dom.hydeSave) dom.hydeSave.disabled = false;
        });
      }

      function resetHydePrompt() {
        if (state.hyde && !state.hyde.isCustomPrompt) {
          api("DELETE", "/api/v2/settings/hyde/prompt").then(function (data) {
            state.hyde = data.hyde;
            renderHyde();
            setBanner(dom.hydeBanner, "Промпт уже соответствует значению по умолчанию.", "success");
          });
          return;
        }
        if (!window.confirm("Восстановить универсальный промпт HyDE? Все ваши изменения будут потеряны.")) return;
        api("DELETE", "/api/v2/settings/hyde/prompt").then(function (data) {
          state.hyde = data.hyde;
          renderHyde();
          setBanner(dom.hydeBanner, "Промпт HyDE сброшен к универсальному.", "success");
        }).catch(function (err) {
          setBanner(dom.hydeBanner, "Не удалось сбросить: " + err.message, "error");
        });
      }

      // --- Контекстное обогащение чанков (Слой 2) ---
      function renderCeProvidersDropdown() {
        if (!dom.ceProviderId) return;
        var providers = (state.settings && state.settings.cloudProviders && state.settings.cloudProviders.providers) || [];
        var current = state.enrichment && state.enrichment.providerId ? state.enrichment.providerId : "";
        var options = ['<option value="">— не выбран —</option>'];
        providers.forEach(function (p) {
          var label = (p.name || "(без названия)") + (p.model ? " · " + p.model : "");
          options.push('<option value="' + escapeHtml(p.id) + '">' + escapeHtml(label) + '</option>');
        });
        dom.ceProviderId.innerHTML = options.join("");
        dom.ceProviderId.value = current;
      }

      function renderEnrichment() {
        if (!dom.ceEnabled || !state.enrichment) return;
        var e = state.enrichment;
        dom.ceEnabled.checked = e.enabled === true;
        renderCeProvidersDropdown();
        if (dom.ceModel) dom.ceModel.value = e.model || "";
        if (dom.ceMaxTokens) dom.ceMaxTokens.value = e.maxTokens || 1500;
        if (dom.ceTimeoutMs) dom.ceTimeoutMs.value = e.timeoutMs || 30000;
        if (dom.ceContextPrompt && dom.ceContextPrompt.value !== e.contextPrompt) {
          dom.ceContextPrompt.value = e.contextPrompt || "";
        }
        if (dom.ceMetaPrompt && dom.ceMetaPrompt.value !== e.metaPrompt) {
          dom.ceMetaPrompt.value = e.metaPrompt || "";
        }
        if (dom.ceContextPromptStatus) {
          dom.ceContextPromptStatus.textContent = e.isCustomContextPrompt
            ? "изменён вами" : "значение по умолчанию";
        }
        if (dom.ceMetaPromptStatus) {
          dom.ceMetaPromptStatus.textContent = e.isCustomMetaPrompt
            ? "изменён вами" : "значение по умолчанию";
        }
        if (dom.ceStatus) {
          dom.ceStatus.textContent = e.enabled ? "включено" : "выкл";
        }
      }

      function loadEnrichment() {
        return api("GET", "/api/v2/settings/contextual-enrichment").then(function (data) {
          state.enrichment = data.contextualEnrichment || null;
          renderEnrichment();
        }).catch(function (err) {
          if (dom.ceBanner) setBanner(dom.ceBanner, "Не удалось загрузить настройки обогащения: " + err.message, "error");
        });
      }

      function saveEnrichment() {
        if (!dom.ceEnabled) return;
        var payload = {
          enabled: dom.ceEnabled.checked === true,
          providerId: dom.ceProviderId ? dom.ceProviderId.value : "",
          model: dom.ceModel ? dom.ceModel.value : "",
          maxTokens: dom.ceMaxTokens ? Number(dom.ceMaxTokens.value) : 1500,
          timeoutMs: dom.ceTimeoutMs ? Number(dom.ceTimeoutMs.value) : 30000,
          contextPrompt: dom.ceContextPrompt ? dom.ceContextPrompt.value : "",
          metaPrompt: dom.ceMetaPrompt ? dom.ceMetaPrompt.value : "",
        };
        if (payload.enabled && !payload.providerId) {
          setBanner(dom.ceBanner, "Выберите облачного провайдера для обогащения.", "error");
          return;
        }
        if (dom.ceSave) dom.ceSave.disabled = true;
        setBanner(dom.ceBanner, "Сохранение…", "success");
        api("PATCH", "/api/v2/settings/contextual-enrichment", payload).then(function (data) {
          state.enrichment = data.contextualEnrichment;
          renderEnrichment();
          setBanner(dom.ceBanner, "Настройки обогащения сохранены. Применятся при следующем импорте/переимпорте.", "success");
        }).catch(function (err) {
          setBanner(dom.ceBanner, "Не удалось сохранить: " + err.message, "error");
        }).then(function () {
          if (dom.ceSave) dom.ceSave.disabled = false;
        });
      }

      function resetEnrichmentPrompt(which) {
        var label = which === "context" ? "промпт контекста" : "промпт тегов/описания";
        if (!window.confirm("Восстановить " + label + " к универсальному? Ваши изменения будут потеряны.")) return;
        api("DELETE", "/api/v2/settings/contextual-enrichment/prompt/" + which).then(function (data) {
          state.enrichment = data.contextualEnrichment;
          renderEnrichment();
          setBanner(dom.ceBanner, "Промпт сброшен к универсальному.", "success");
        }).catch(function (err) {
          setBanner(dom.ceBanner, "Не удалось сбросить: " + err.message, "error");
        });
      }

      // --- Извлечение знаний из документов (Этап 3) ---
      function renderKeProvidersDropdown() {
        if (!dom.keProviderId) return;
        var providers = (state.settings && state.settings.cloudProviders && state.settings.cloudProviders.providers) || [];
        var current = state.knowledgeExtraction && state.knowledgeExtraction.providerId ? state.knowledgeExtraction.providerId : "";
        var options = ['<option value="">— не выбран —</option>'];
        providers.forEach(function (p) {
          var label = (p.name || "(без названия)") + (p.model ? " · " + p.model : "");
          options.push('<option value="' + escapeHtml(p.id) + '">' + escapeHtml(label) + '</option>');
        });
        dom.keProviderId.innerHTML = options.join("");
        dom.keProviderId.value = current;
      }

      function renderKnowledgeExtraction() {
        if (!dom.keEnabled || !state.knowledgeExtraction) return;
        var k = state.knowledgeExtraction;
        dom.keEnabled.checked = k.enabled === true;
        renderKeProvidersDropdown();
        if (dom.keModel) dom.keModel.value = k.model || "";
        if (dom.keMaxTokens) dom.keMaxTokens.value = k.maxTokens || 2000;
        if (dom.keTimeoutMs) dom.keTimeoutMs.value = k.timeoutMs || 60000;
        if (dom.kePrompt && dom.kePrompt.value !== k.prompt) {
          dom.kePrompt.value = k.prompt || "";
        }
        if (dom.kePromptStatus) {
          dom.kePromptStatus.textContent = k.isCustomPrompt ? "изменён вами" : "значение по умолчанию";
        }
        if (dom.keStatus) {
          dom.keStatus.textContent = k.enabled ? "включено" : "выкл";
        }
      }

      function loadKnowledgeExtraction() {
        return api("GET", "/api/v2/settings/knowledge-extraction").then(function (data) {
          state.knowledgeExtraction = data.knowledgeExtraction || null;
          renderKnowledgeExtraction();
        }).catch(function (err) {
          if (dom.keBanner) setBanner(dom.keBanner, "Не удалось загрузить настройки извлечения: " + err.message, "error");
        });
      }

      function saveKnowledgeExtraction() {
        if (!dom.keEnabled) return;
        var payload = {
          enabled: dom.keEnabled.checked === true,
          providerId: dom.keProviderId ? dom.keProviderId.value : "",
          model: dom.keModel ? dom.keModel.value : "",
          maxTokens: dom.keMaxTokens ? Number(dom.keMaxTokens.value) : 2000,
          timeoutMs: dom.keTimeoutMs ? Number(dom.keTimeoutMs.value) : 60000,
          prompt: dom.kePrompt ? dom.kePrompt.value : "",
        };
        if (payload.enabled && !payload.providerId) {
          setBanner(dom.keBanner, "Выберите облачного провайдера для извлечения знаний.", "error");
          return;
        }
        if (dom.keSave) dom.keSave.disabled = true;
        setBanner(dom.keBanner, "Сохранение…", "success");
        api("PATCH", "/api/v2/settings/knowledge-extraction", payload).then(function (data) {
          state.knowledgeExtraction = data.knowledgeExtraction;
          renderKnowledgeExtraction();
          setBanner(dom.keBanner, "Настройки извлечения сохранены. Применятся при следующем запуске «Извлечь знания».", "success");
        }).catch(function (err) {
          setBanner(dom.keBanner, "Не удалось сохранить: " + err.message, "error");
        }).then(function () {
          if (dom.keSave) dom.keSave.disabled = false;
        });
      }

      function resetKnowledgeExtractionPrompt() {
        if (!window.confirm("Восстановить универсальный промпт извлечения? Ваши изменения будут потеряны.")) return;
        api("DELETE", "/api/v2/settings/knowledge-extraction/prompt").then(function (data) {
          state.knowledgeExtraction = data.knowledgeExtraction;
          renderKnowledgeExtraction();
          setBanner(dom.keBanner, "Промпт извлечения сброшен к универсальному.", "success");
        }).catch(function (err) {
          setBanner(dom.keBanner, "Не удалось сбросить: " + err.message, "error");
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

      function loadGeneration() {
        if (!dom.generationMaxTokens) return;
        return api("GET", "/api/v2/settings/generation").then(function (data) {
          var n = (data.generation && Number(data.generation.maxTokens)) || 4096;
          dom.generationMaxTokens.value = String(n);
        }).catch(function (err) {
          if (dom.generationBanner) setBanner(dom.generationBanner, "Ошибка загрузки: " + err.message, "error");
        });
      }

      function saveGeneration() {
        if (!dom.generationMaxTokens || !dom.generationSave) return;
        var n = Number(dom.generationMaxTokens.value);
        if (!Number.isFinite(n) || n < 256 || n > 8192) {
          setBanner(dom.generationBanner, "Значение должно быть от 256 до 8192", "error");
          return;
        }
        dom.generationSave.disabled = true;
        api("PATCH", "/api/v2/settings/generation", { maxTokens: Math.trunc(n) }).then(function () {
          setBanner(dom.generationBanner, "Сохранено. Применяется к новым ответам облачных моделей.", "success");
          return loadGeneration();
        }).catch(function (err) {
          setBanner(dom.generationBanner, "Не удалось сохранить: " + err.message, "error");
        }).then(function () { dom.generationSave.disabled = false; });
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
        if (!/.(sql|sql.gz|gz)$/i.test(file.name)) {
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
        if (dom.generationSave) dom.generationSave.addEventListener("click", saveGeneration);
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
        if (dom.rerankSave) dom.rerankSave.addEventListener("click", saveReranking);
        if (dom.rerankCheck) dom.rerankCheck.addEventListener("click", checkRerankingStatus);
        if (dom.rerankClearKey) dom.rerankClearKey.addEventListener("click", clearJinaKey);
        if (dom.rerankProvider) dom.rerankProvider.addEventListener("change", onRerankProviderChange);
        if (dom.promptSave) dom.promptSave.addEventListener("click", saveSystemPrompt);
        if (dom.promptReset) dom.promptReset.addEventListener("click", confirmResetSystemPrompt);
        if (dom.promptTemplate) dom.promptTemplate.addEventListener("input", validateSystemPromptTextarea);
        if (dom.hydeSave) dom.hydeSave.addEventListener("click", saveHyde);
        if (dom.hydePromptReset) dom.hydePromptReset.addEventListener("click", resetHydePrompt);
        if (dom.ceSave) dom.ceSave.addEventListener("click", saveEnrichment);
        if (dom.ceContextPromptReset) dom.ceContextPromptReset.addEventListener("click", function () { resetEnrichmentPrompt("context"); });
        if (dom.ceMetaPromptReset) dom.ceMetaPromptReset.addEventListener("click", function () { resetEnrichmentPrompt("meta"); });
        if (dom.keSave) dom.keSave.addEventListener("click", saveKnowledgeExtraction);
        if (dom.kePromptReset) dom.kePromptReset.addEventListener("click", resetKnowledgeExtractionPrompt);
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
        loadGeneration();
        loadReranking().then(checkRerankingStatus);
        loadHyde();
        loadEnrichment();
        loadKnowledgeExtraction();
        loadBackups();
      }

      bootstrap();
    })();
    (function () {
  function $(id) { return document.getElementById(id); }
  function esc(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function toast(msg, kind) {
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();
    var el = document.createElement('div');
    var kindClass = kind === 'error' ? ' toast--error' : kind === 'warning' ? ' toast--warning' : '';
    el.className = 'toast' + kindClass;
    el.textContent = msg;
    document.body.appendChild(el);
    var ttl = (kind === 'warning' || kind === 'error') ? 8000 : 4200;
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, ttl);
  }
  function api(method, url, body) {
    var opts = { method: method, headers: {} };
    if (body !== undefined && !(body instanceof FormData)) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    } else if (body instanceof FormData) { opts.body = body; }
    return fetch(url, opts).then(function (resp) {
      return resp.json().then(function (data) {
        if (!resp.ok || (data && data.ok === false)) {
          var err = new Error((data && (data.error || data.message)) || ('HTTP ' + resp.status));
          err.status = resp.status; err.data = data; throw err;
        }
        return data;
      });
    });
  }
  function hint(text) {
    // Использует существующий .help-tip widget (CSS + auto-flip уже в общем JS).
    return '<span class="help-tip" tabindex="0" aria-label="Подсказка">' +
      '<span class="help-tip__icon" aria-hidden="true">?</span>' +
      '<span class="help-tip__bubble" role="tooltip">' + esc(text) + '</span></span>';
  }
  function setBanner(el, msg, kind) {
    if (!el) return;
    if (!msg) { el.classList.remove('is-visible'); el.innerHTML = ''; return; }
    el.classList.add('is-visible');
    el.classList.toggle('settings-banner--success', kind === 'success');
    el.classList.toggle('settings-banner--error', kind === 'error');
    el.innerHTML = '<span>' + esc(msg) + '</span>';
  }

  // ─── Известные словари заголовков ───────────────────────────
  // Используются для автоматического заполнения columns/per_sheet
  // после autodetect. Фронтенд-знание: не нужно API для них.
  var METSO_KNOWN_HEADERS = {
    'looptag': 'loop_tag',
    'devicetag': 'device_tag',
    'carh_type': 'card_type',
    'card_type': 'card_type',
    'card type': 'card_type',
    'address': 'address',
    'station': 'station_code',
    'chanel': 'channel_number',
    'channel': 'channel_number',
    'group type': 'signal_kind_raw',
    'наименование': 'description',
    'описание': 'description',
    'card pins': 'pin_on_card',
    'name wire': 'wire_name'
  };
  var KOYO_KNOWN_HEADERS = {
    'tag name': 'tag',
    'tag': 'tag',
    'позиция': 'position',
    'наименование параметра': 'description',
    'модуль': 'card_type',
    'место': 'card_slot',
    'клемма': 'channel_number',
    'память': 'signal_address'
  };
  var KOYO_SHEET_KIND = {
    'ai': 'AI', 'ain': 'AI',
    'ao': 'AO', 'aout': 'AO',
    'di': 'DI', 'din': 'DI',
    'do': 'DO', 'dout': 'DO'
  };
  function buildColumnsFromHeaders(headers) {
    var columns = {};
    (headers || []).forEach(function (h) {
      if (!h) return;
      var raw = String(h).trim();
      if (!raw) return;
      var norm = raw.toLowerCase();
      var field = METSO_KNOWN_HEADERS[norm];
      if (field && !columns[field]) columns[field] = raw;
    });
    return columns;
  }
  function buildPerSheetFromDetection(sheets) {
    var perSheet = {};
    (sheets || []).forEach(function (sh) {
      if (!sh || !sh.has_data) return;
      var name = String(sh.name || '');
      var kind = KOYO_SHEET_KIND[name.toLowerCase()];
      if (!kind) return;
      var columns = {};
      (sh.sample_header || []).forEach(function (h) {
        if (!h) return;
        var raw = String(h).trim();
        if (!raw) return;
        var norm = raw.toLowerCase();
        var field = KOYO_KNOWN_HEADERS[norm];
        if (field && !columns[field]) columns[field] = raw;
      });
      perSheet[name] = {
        builds: ['station', 'card', 'channel', 'signal'],
        signal_kind: kind,
        columns: columns
      };
    });
    return perSheet;
  }

  // ─── Modal helpers ──────────────────────────────────────────
  var modal = { backdrop: null, title: null, body: null, foot: null, closeBtn: null };
  function ensureModal() {
    if (modal.backdrop) return;
    modal.backdrop = $('graphModalBackdrop');
    modal.title = $('graphModalTitle');
    modal.body = $('graphModalBody');
    modal.foot = $('graphModalFoot');
    modal.closeBtn = $('graphModalCloseBtn');
    if (modal.closeBtn) modal.closeBtn.addEventListener('click', closeModal);
    if (modal.backdrop) modal.backdrop.addEventListener('click', function (e) {
      if (e.target === modal.backdrop) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.backdrop && modal.backdrop.classList.contains('is-open')) closeModal();
    });
  }
  function openModal(title, bodyEl, buttons) {
    ensureModal();
    if (!modal.backdrop) return;
    modal.title.textContent = title || '';
    modal.body.innerHTML = '';
    if (typeof bodyEl === 'string') modal.body.innerHTML = bodyEl;
    else if (bodyEl) modal.body.appendChild(bodyEl);
    modal.foot.innerHTML = '';
    (buttons || []).forEach(function (btn) { modal.foot.appendChild(btn); });
    modal.backdrop.classList.add('is-open');
  }
  function closeModal() {
    if (modal.backdrop) modal.backdrop.classList.remove('is-open');
    if (modal.body) modal.body.innerHTML = '';
    if (modal.foot) modal.foot.innerHTML = '';
  }
  function makeBtn(text, cls, onClick) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'btn ' + (cls || ''); b.textContent = text;
    b.addEventListener('click', onClick); return b;
  }

  // ─── State ──────────────────────────────────────────────────
  var state = { loaded: false, profiles: [], aliases: {}, nodeTypes: [] };

  // ─── Node types (#8.1.e) ────────────────────────────────────
  function loadNodeTypes() {
    var listEl = $('graphNodeTypeList');
    if (listEl) listEl.innerHTML = '<div class="settings-hint">Загрузка…</div>';
    return api('GET', '/api/v2/graph/node-types').then(function (data) {
      state.nodeTypes = (data && data.types) || [];
      renderNodeTypesList();
    }).catch(function (err) {
      if (listEl) listEl.innerHTML = '<div class="graph-form__error">Не удалось загрузить типы узлов: ' + esc(err.message) + '</div>';
    });
  }
  function renderNodeTypesList() {
    var listEl = $('graphNodeTypeList');
    if (!listEl) return;
    if (!state.nodeTypes || state.nodeTypes.length === 0) {
      listEl.innerHTML = '<div class="settings-hint">Типов узлов нет. Нажмите «Создать тип».</div>';
      return;
    }
    listEl.innerHTML = state.nodeTypes.map(function (t) {
      var systemBadge = t.is_builtin ? '<span class="graph-nodetype-badge" title="Системный тип, удалить нельзя">🔒 Системный</span>' : '<span class="graph-nodetype-badge graph-nodetype-badge--custom">Кастомный</span>';
      var iconHtml = t.icon ? '<span class="graph-nodetype-icon">' + esc(t.icon) + '</span>' : '';
      var deleteAttrs = t.is_builtin
        ? 'disabled aria-disabled="true" title="Системный тип удалить нельзя"'
        : 'data-graph-action="delete-nodetype" data-id="' + esc(t.code) + '"';
      var deleteCls = t.is_builtin ? 'btn btn--ghost is-disabled' : 'btn btn--ghost';
      return '<div class="graph-item-card">' +
        '<div class="graph-item-card__head">' +
          '<div style="display:flex;align-items:center;gap:8px;">' + iconHtml +
            '<div>' +
              '<div class="graph-item-card__title">' + esc(t.label_ru) + '</div>' +
              '<div class="graph-item-card__desc">' + esc(t.description || '') + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="graph-item-card__actions">' +
            '<button type="button" class="btn btn--ghost" data-graph-action="edit-nodetype" data-id="' + esc(t.code) + '">Изменить</button>' +
            '<button type="button" class="' + deleteCls + '" ' + deleteAttrs + '>Удалить</button>' +
          '</div>' +
        '</div>' +
        '<div class="graph-item-card__meta">' +
          '<span class="mono">' + esc(t.code) + '</span>' +
          '<span>' + systemBadge + '</span>' +
          '<span>Узлов: ' + (t.usage_count || 0) + '</span>' +
          '<span>Порядок: ' + (t.sort_order || 100) + '</span>' +
        '</div>' +
      '</div>';
    }).join('');
  }
  function openNodeTypeEditor(existingType) {
    var isEdit = !!existingType;
    var data = existingType ? JSON.parse(JSON.stringify(existingType)) : {
      code: '', label_ru: '', description: '', icon: '', sort_order: 100, is_builtin: false
    };
    var wrap = document.createElement('div');
    wrap.className = 'graph-form';
    var codeReadonly = isEdit ? 'readonly disabled' : '';
    var codeHintText = isEdit
      ? 'Код типа неизменяем после создания.'
      : 'Латиницей с нижним подчёркиванием, как cabinet. Используется в YAML профилей и в БД. Не меняется после создания.';
    wrap.innerHTML =
      '<div class="graph-form__row"><label>Код ' + hint(codeHintText) + '</label><div class="graph-form__field">' +
        '<input type="text" id="ntCode" maxlength="64" placeholder="my_type" ' + codeReadonly + ' />' +
        '<span class="graph-form__hint">Только латиница/цифры/_, начинается с буквы. До 64 символов.</span>' +
      '</div></div>' +
      '<div class="graph-form__row"><label>Название ' + hint('Русское название типа. Показывается в wizard\'е парсера, в графе и в статистике.') + '</label><div class="graph-form__field">' +
        '<input type="text" id="ntLabel" maxlength="128" placeholder="Шкаф" />' +
      '</div></div>' +
      '<div class="graph-form__row"><label>Описание ' + hint('Краткое описание для подсказки рядом с чекбоксом в wizard\'е.') + '</label><div class="graph-form__field">' +
        '<textarea id="ntDesc" rows="3" maxlength="2048" placeholder="Шкаф автоматики, корпус с оборудованием."></textarea>' +
      '</div></div>' +
      '<div class="graph-form__row"><label>Иконка ' + hint('Один emoji-символ для визуального отличия в списках. Пример: 🗄 для шкафа.') + '</label><div class="graph-form__field">' +
        '<input type="text" id="ntIcon" maxlength="16" placeholder="🗄" style="max-width:120px;" />' +
      '</div></div>' +
      '<div class="graph-form__row"><label>Порядок ' + hint('Целое число для сортировки в списках. Меньше — выше.') + '</label><div class="graph-form__field">' +
        '<input type="number" id="ntSort" min="1" max="9999" style="max-width:120px;" />' +
      '</div></div>' +
      '<div id="ntErr" class="graph-form__error" style="display:none"></div>';
    setTimeout(function () {
      var c = $('ntCode'); if (c) c.value = data.code || '';
      var l = $('ntLabel'); if (l) l.value = data.label_ru || '';
      var d = $('ntDesc'); if (d) d.value = data.description || '';
      var ic = $('ntIcon'); if (ic) ic.value = data.icon || '';
      var s = $('ntSort'); if (s) s.value = (data.sort_order || 100);
      if (!isEdit) { var c2 = $('ntCode'); if (c2) c2.focus(); }
    }, 0);
    var saveBtn = makeBtn('Сохранить', 'btn--accent', function () {
      var errEl = $('ntErr');
      var code = ($('ntCode').value || '').trim();
      var labelRu = ($('ntLabel').value || '').trim();
      var description = ($('ntDesc').value || '').trim();
      var icon = ($('ntIcon').value || '').trim();
      var sortOrder = Number($('ntSort').value) || 100;
      if (!isEdit) {
        if (!/^[a-z][a-z0-9_]*$/.test(code)) {
          errEl.style.display = 'block';
          errEl.textContent = 'Код должен начинаться с буквы латиницы и содержать только латиницу, цифры и _';
          return;
        }
      }
      if (!labelRu) {
        errEl.style.display = 'block';
        errEl.textContent = 'Название не может быть пустым';
        return;
      }
      var body = isEdit
        ? { label_ru: labelRu, description: description, icon: icon || null, sort_order: sortOrder }
        : { code: code, label_ru: labelRu, description: description, icon: icon || undefined, sort_order: sortOrder };
      var p = isEdit
        ? api('PUT', '/api/v2/graph/node-types/' + encodeURIComponent(data.code), body)
        : api('POST', '/api/v2/graph/node-types', body);
      p.then(function (res) {
        toast((res && res.message) || 'Сохранено');
        closeModal();
        loadNodeTypes();
      }).catch(function (err) {
        errEl.style.display = 'block';
        errEl.textContent = err.message || 'Не удалось сохранить';
      });
    });
    var cancelBtn = makeBtn('Отмена', 'btn--ghost', closeModal);
    openModal(isEdit ? ('Изменение типа узла: ' + data.code) : 'Создание типа узла', wrap, [cancelBtn, saveBtn]);
  }
  function confirmDeleteNodeType(code) {
    var t = state.nodeTypes.find(function (x) { return x.code === code; });
    if (!t) return;
    if (t.is_builtin) {
      toast('Системный тип "' + code + '" нельзя удалить.', 'error');
      return;
    }
    var wrap = document.createElement('div');
    if ((t.usage_count || 0) > 0) {
      wrap.innerHTML =
        '<p style="margin:0;">Этот тип используется в <strong>' + t.usage_count + '</strong> узлах. Сначала измените их тип или удалите.</p>' +
        '<p class="settings-hint" style="margin-top:6px;">Удаление возможно только если на тип не ссылается ни один активный узел графа.</p>';
      var okBtn = makeBtn('Понятно', 'btn--accent', closeModal);
      openModal('Нельзя удалить тип "' + code + '"', wrap, [okBtn]);
      return;
    }
    wrap.innerHTML = '<p style="margin:0;">Удалить тип узла <strong>' + esc(code) + '</strong>?</p>' +
      '<p class="settings-hint" style="margin-top:6px;">Это пользовательский тип. После удаления он исчезнет из wizard\'а профилей и из списков.</p>';
    var cancelBtn = makeBtn('Отмена', 'btn--ghost', closeModal);
    var del = makeBtn('Удалить', 'btn--danger', function () {
      api('DELETE', '/api/v2/graph/node-types/' + encodeURIComponent(code)).then(function (res) {
        toast((res && res.message) || 'Удалено');
        closeModal();
        loadNodeTypes();
      }).catch(function (err) { toast('Не удалось удалить: ' + err.message, 'error'); });
    });
    openModal('Удалить тип узла?', wrap, [cancelBtn, del]);
  }

  // ─── Profiles list ──────────────────────────────────────────
  function loadProfiles() {
    var listEl = $('graphProfileList');
    if (listEl) listEl.innerHTML = '<div class="settings-hint">Загрузка…</div>';
    return api('GET', '/api/v2/graph/profiles').then(function (data) {
      state.profiles = (data && data.profiles) || [];
      renderProfilesList();
    }).catch(function (err) {
      if (listEl) listEl.innerHTML = '<div class="graph-form__error">Не удалось загрузить профили: ' + esc(err.message) + '</div>';
    });
  }
  function renderProfilesList() {
    var listEl = $('graphProfileList');
    if (!listEl) return;
    if (state.profiles.length === 0) {
      listEl.innerHTML = '<div class="settings-hint">Профилей пока нет. Нажмите «Создать профиль».</div>';
      return;
    }
    listEl.innerHTML = state.profiles.map(function (p) {
      var style = p.per_sheet ? 'koyo-style (per_sheet)' : 'metso-style (один шкаф/лист)';
      var matchBits = [];
      if (p.match && Array.isArray(p.match.file_extensions)) matchBits.push('ext: ' + p.match.file_extensions.join(', '));
      if (p.match && p.match.sheet_name_pattern) matchBits.push('sheet: /' + p.match.sheet_name_pattern + '/');
      if (p.match && Array.isArray(p.match.required_sheets)) matchBits.push('требует листы: ' + p.match.required_sheets.join(', '));
      return '<div class="graph-item-card">' +
        '<div class="graph-item-card__head">' +
          '<div>' +
            '<div class="graph-item-card__title">' + esc(p.id) + '</div>' +
            '<div class="graph-item-card__desc">' + esc(p.description || '') + '</div>' +
          '</div>' +
          '<div class="graph-item-card__actions">' +
            '<button type="button" class="btn btn--ghost" data-graph-action="edit-profile" data-id="' + esc(p.id) + '">Изменить</button>' +
            '<button type="button" class="btn btn--ghost" data-graph-action="delete-profile" data-id="' + esc(p.id) + '">Удалить</button>' +
          '</div>' +
        '</div>' +
        '<div class="graph-item-card__meta">' +
          '<span>Стиль: ' + esc(style) + '</span>' +
          (matchBits.length ? '<span>' + esc(matchBits.join(' · ')) + '</span>' : '') +
        '</div>' +
      '</div>';
    }).join('');
  }

  // ─── Aliases list (с inline «+ Добавить алиас» в каждой карточке) ─
  function loadAliases() {
    var listEl = $('graphAliasList');
    if (listEl) listEl.innerHTML = '<div class="settings-hint">Загрузка…</div>';
    return api('GET', '/api/v2/graph/aliases').then(function (data) {
      state.aliases = (data && data.signal_kind) || {};
      renderAliasesList();
    }).catch(function (err) {
      if (listEl) listEl.innerHTML = '<div class="graph-form__error">Не удалось загрузить алиасы: ' + esc(err.message) + '</div>';
    });
  }
  function renderAliasesList() {
    var listEl = $('graphAliasList');
    if (!listEl) return;
    var keys = Object.keys(state.aliases);
    if (keys.length === 0) {
      listEl.innerHTML = '<div class="settings-hint">Канонических значений пока нет. Раскройте «Расширенные возможности» ниже, чтобы создать первое.</div>';
      return;
    }
    listEl.innerHTML = keys.map(function (k) {
      var entry = state.aliases[k] || {};
      var aliases = Array.isArray(entry.aliases) ? entry.aliases : [];
      var pills = aliases.map(function (a) { return '<span class="graph-alias-pill">' + esc(a) + '</span>'; }).join('');
      return '<div class="graph-item-card">' +
        '<div class="graph-item-card__head">' +
          '<div>' +
            '<div class="graph-item-card__title">' + esc(k) + '</div>' +
            '<div class="graph-item-card__desc">' + esc(entry.description || '') + '</div>' +
          '</div>' +
          '<div class="graph-alias-card-actions">' +
            '<button type="button" class="btn btn--accent" data-graph-action="add-alias" data-id="' + esc(k) + '">+ Добавить алиас</button>' +
            '<button type="button" class="btn btn--ghost" data-graph-action="edit-alias" data-id="' + esc(k) + '">Изменить</button>' +
            '<button type="button" class="btn btn--ghost" data-graph-action="delete-alias" data-id="' + esc(k) + '">Удалить</button>' +
          '</div>' +
        '</div>' +
        '<div class="graph-alias-pills">' + pills + '</div>' +
      '</div>';
    }).join('');
  }

  // ─── Inline «+ Добавить алиас» (короткий диалог с одним полем) ─
  function openAddAliasDialog(canonical) {
    var entry = state.aliases[canonical] || { description: '', aliases: [] };
    var wrap = document.createElement('div');
    wrap.className = 'graph-form';
    wrap.innerHTML =
      '<p style="margin:0;font-size:13px;">Добавить ещё одну форму написания к <strong>' + esc(canonical) + '</strong> — <span style="color:var(--text-muted)">' + esc(entry.description || '') + '</span></p>' +
      '<div class="graph-form__row">' +
        '<label>Новый алиас ' + hint('Любая форма написания, которая встречается в XLSX. Регистр и пробелы не важны при сравнении. Пример: «HART current loop», «4-20mA», «Анал.вх».') + '</label>' +
        '<div class="graph-form__field">' +
          '<input type="text" id="addAliasInput" maxlength="128" placeholder="например, HART current loop" />' +
        '</div>' +
      '</div>' +
      '<p class="graph-form__hint">Уже есть: ' + (entry.aliases.length ? entry.aliases.map(esc).join(', ') : '(пусто)') + '</p>' +
      '<div id="addAliasErr" style="display:none" class="graph-form__error"></div>';
    setTimeout(function () { var el = $('addAliasInput'); if (el) el.focus(); }, 30);
    var saveBtn = makeBtn('Сохранить', 'btn--accent', function () {
      var value = ($('addAliasInput').value || '').trim();
      var errEl = $('addAliasErr');
      if (!value) { errEl.style.display = 'block'; errEl.textContent = 'Введите алиас'; return; }
      if (value.length > 128) { errEl.style.display = 'block'; errEl.textContent = 'Не больше 128 символов'; return; }
      var existingLc = entry.aliases.map(function (a) { return String(a).toLowerCase(); });
      if (existingLc.indexOf(value.toLowerCase()) >= 0) {
        errEl.style.display = 'block'; errEl.textContent = 'Такой алиас уже есть.'; return;
      }
      var newAliases = entry.aliases.slice(); newAliases.push(value);
      api('PUT', '/api/v2/graph/aliases/' + encodeURIComponent(canonical), {
        description: entry.description || '', aliases: newAliases
      }).then(function (res) {
        toast('Алиас «' + value + '» добавлен к ' + canonical);
        closeModal();
        loadAliases();
      }).catch(function (err) {
        errEl.style.display = 'block'; errEl.textContent = err.message || 'Не удалось сохранить';
      });
    });
    var cancelBtn = makeBtn('Отмена', 'btn--ghost', closeModal);
    openModal('+ Добавить алиас в ' + canonical, wrap, [cancelBtn, saveBtn]);
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Enter' && modal.backdrop && modal.backdrop.classList.contains('is-open') && document.activeElement && document.activeElement.id === 'addAliasInput') {
        saveBtn.click(); document.removeEventListener('keydown', onKey);
      }
    });
  }

  // ─── Full alias editor (для «Изменить» и «Создать новое каноническое») ─
  function openAliasEditor(existingKey) {
    var existing = existingKey ? (state.aliases[existingKey] || {}) : {};
    var isEdit = !!existingKey;
    var wrap = document.createElement('div');
    wrap.className = 'graph-form';
    wrap.innerHTML =
      '<div class="graph-form__row"><label>Каноническое значение ' + hint('Короткий код типа сигнала на латинице. Используется как ключ и пишется в attributes.signal_kind у узлов signal. Пример: AI, AO, RTD, PFC. После создания не меняется.') + '</label><div class="graph-form__field">' +
        '<input type="text" id="aliasCanonical" maxlength="64" placeholder="AI, AO, DI, …" />' +
        '<span class="graph-form__hint">Только латиница/цифры/_-, до 64 символов.</span>' +
      '</div></div>' +
      '<div class="graph-form__row"><label>Описание ' + hint('Человекочитаемое описание типа сигнала. Видно в UI. Пример: «Аналоговый вход 4-20 мА» или «Дискретный выход 24В».') + '</label><div class="graph-form__field">' +
        '<input type="text" id="aliasDesc" maxlength="256" placeholder="Аналоговый вход 4-20 мА" />' +
      '</div></div>' +
      '<div class="graph-form__row"><label>Алиасы (по одному в строке) ' + hint('Каждая строка — одна форма написания, которая встречается в XLSX. Сравнение нечувствительно к регистру и пробелам. Можно добавлять русские и английские варианты.') + '</label><div class="graph-form__field">' +
        '<textarea id="aliasList" class="graph-mono" rows="10" placeholder="AI&#10;1AI&#10;Аналоговый вход"></textarea>' +
      '</div></div>' +
      '<div id="aliasErr" style="display:none" class="graph-form__error"></div>';
    setTimeout(function () {
      var k = $('aliasCanonical'); var d = $('aliasDesc'); var a = $('aliasList');
      if (k) { k.value = existingKey || ''; if (isEdit) k.disabled = true; }
      if (d) d.value = existing.description || '';
      if (a) a.value = (Array.isArray(existing.aliases) ? existing.aliases : []).join('\n');
    }, 0);
    var saveBtn = makeBtn('Сохранить', 'btn--accent', function () {
      var canonical = ($('aliasCanonical').value || '').trim();
      var description = ($('aliasDesc').value || '').trim();
      var aliases = ($('aliasList').value || '').split(/\r?\n/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; });
      var errEl = $('aliasErr');
      if (!isEdit && !/^[A-Za-z][A-Za-z0-9_-]*$/.test(canonical)) {
        errEl.style.display = 'block';
        errEl.textContent = 'Канон должен начинаться с буквы латиницы и содержать только буквы, цифры, _ или -';
        return;
      }
      var body = { description: description, aliases: aliases };
      var p;
      if (isEdit) {
        p = api('PUT', '/api/v2/graph/aliases/' + encodeURIComponent(existingKey), body);
      } else {
        p = api('POST', '/api/v2/graph/aliases', Object.assign({ canonical: canonical }, body));
      }
      p.then(function (res) {
        toast(res.message || 'Сохранено');
        closeModal();
        loadAliases();
      }).catch(function (err) {
        errEl.style.display = 'block';
        errEl.textContent = err.message || 'Не удалось сохранить';
      });
    });
    var cancelBtn = makeBtn('Отмена', 'btn--ghost', closeModal);
    openModal(isEdit ? ('Изменить алиас: ' + existingKey) : 'Новое каноническое значение', wrap, [cancelBtn, saveBtn]);
  }

  // ─── Защитный диалог перед созданием НОВОГО канонического значения ─
  function openCreateCanonicalConfirm() {
    var existing = Object.keys(state.aliases);
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<p style="margin:0;">Создание <strong>нового канонического значения</strong> — редкая операция.</p>' +
      '<p style="margin:8px 0 0;">Убедитесь, что нужного типа сигнала <em>нет</em> среди существующих:</p>' +
      '<p class="settings-hint" style="margin:6px 0;">' + (existing.length ? existing.map(esc).join(', ') : '(пусто)') + '</p>' +
      '<p class="settings-hint" style="margin:0;">Если хотите просто добавить ещё одну форму написания к уже существующему типу — закройте это окно и нажмите кнопку <strong>«+ Добавить алиас»</strong> в карточке нужного значения.</p>';
    var cancelBtn = makeBtn('Отмена', 'btn--ghost', closeModal);
    var go = makeBtn('Продолжить', 'btn--accent', function () {
      closeModal();
      openAliasEditor(null);
    });
    openModal('Создать новое каноническое значение?', wrap, [cancelBtn, go]);
  }
  function confirmDeleteAlias(canonical) {
    var wrap = document.createElement('div');
    wrap.innerHTML = '<p style="margin:0;">Удалить каноническое значение <strong>' + esc(canonical) + '</strong> и все его алиасы?</p>' +
      '<p class="settings-hint" style="margin-top:6px;">Это не сломает kb-api. Сигналы с этим значением получат signal_kind = null до тех пор, пока не появится новый алиас.</p>';
    var cancelBtn = makeBtn('Отмена', 'btn--ghost', closeModal);
    var del = makeBtn('Удалить', 'btn--danger', function () {
      api('DELETE', '/api/v2/graph/aliases/' + encodeURIComponent(canonical)).then(function (res) {
        toast(res.message || 'Удалено');
        closeModal();
        loadAliases();
      }).catch(function (err) { toast('Не удалось удалить: ' + err.message, 'error'); });
    });
    openModal('Удалить алиас?', wrap, [cancelBtn, del]);
  }

  // ─── Raw YAML editors ───────────────────────────────────────
  function openRawEditor(kind) {
    var isProfiles = (kind === 'profiles');
    var getUrl = isProfiles ? '/api/v2/graph/profiles/raw' : '/api/v2/graph/aliases/raw';
    var validateUrl = isProfiles ? '/api/v2/graph/profiles/raw/validate' : '/api/v2/graph/aliases/raw/validate';
    var putUrl = getUrl;
    var title = isProfiles ? 'YAML: graph-parsers.yaml' : 'YAML: graph-aliases.yaml';
    var wrap = document.createElement('div');
    wrap.className = 'graph-form';
    wrap.innerHTML =
      '<p class="graph-form__hint">Перед каждой записью kb-api создаёт резервную копию в <span class="mono">data/config-backups/</span> (последние 10). После сохранения kb-api сразу подхватит изменения — рестарт не нужен.</p>' +
      '<textarea id="rawYaml" class="graph-mono" rows="22" spellcheck="false"></textarea>' +
      '<div id="rawErr" class="graph-form__error" style="display:none"></div>' +
      '<div id="rawOk" class="graph-form__hint" style="color:var(--success); display:none"></div>';
    setTimeout(function () {
      api('GET', getUrl).then(function (data) {
        var ta = $('rawYaml');
        if (ta) ta.value = (data && data.content) || '';
      }).catch(function (err) {
        var errEl = $('rawErr');
        if (errEl) { errEl.style.display = 'block'; errEl.textContent = 'Не удалось загрузить файл: ' + err.message; }
      });
    }, 0);
    var checkBtn = makeBtn('Проверить синтаксис', 'btn--ghost', function () {
      var content = ($('rawYaml').value || '');
      var errEl = $('rawErr'); var okEl = $('rawOk');
      errEl.style.display = 'none'; okEl.style.display = 'none';
      api('POST', validateUrl, { content: content }).then(function (res) {
        okEl.style.display = 'block';
        okEl.textContent = isProfiles
          ? ('YAML корректен. Профилей: ' + (res.profiles_count || 0))
          : ('YAML корректен. Канонических значений: ' + (res.canonicals_count || 0));
      }).catch(function (err) {
        errEl.style.display = 'block';
        errEl.textContent = err.message || 'Невалидный YAML';
      });
    });
    var saveBtn = makeBtn('Сохранить', 'btn--accent', function () {
      var content = ($('rawYaml').value || '');
      var errEl = $('rawErr'); var okEl = $('rawOk');
      errEl.style.display = 'none'; okEl.style.display = 'none';
      api('PUT', putUrl, { content: content }).then(function (res) {
        toast(res.message || 'Сохранено');
        closeModal();
        if (isProfiles) loadProfiles(); else loadAliases();
      }).catch(function (err) {
        errEl.style.display = 'block';
        errEl.textContent = err.message || 'Не удалось сохранить';
      });
    });
    var cancelBtn = makeBtn('Отмена', 'btn--ghost', closeModal);
    openModal(title, wrap, [cancelBtn, checkBtn, saveBtn]);
  }

  // ─── Profile wizard (create / edit) ─────────────────────────
  function openProfileEditor(existingProfile) {
    var isEdit = !!existingProfile;
    var data = existingProfile ? JSON.parse(JSON.stringify(existingProfile)) : {
      id: '', description: '',
      match: { file_extensions: ['.xlsx'], sheet_name_pattern: '', required_headers: [], required_sheets: [] },
      layout: { header_row: 1, data_start_row: 4 },
      columns: {},
      builds: ['cabinet', 'station', 'card', 'channel', 'signal', 'device'],
      cabinet: { source: 'sheet_name', pattern: '', name_template: 'Cabinet {cabinet_code}' },
      skip_rows: [],
    };
    // #8.1.e: подтягиваем актуальный список типов узлов на каждое открытие wizard'а
    // — пользователь мог только что добавить новый тип в подвкладке «Типы узлов».
    api('GET', '/api/v2/graph/node-types').then(function (res) {
      state.nodeTypes = (res && res.types) || state.nodeTypes;
      if (typeof renderBuilds === 'function') { try { renderBuilds(); } catch (_) {} }
    }).catch(function () {});
    var detectedStyle = (data.per_sheet && Object.keys(data.per_sheet).length) ? 'koyo' : 'metso';
    var sampleSheets = [];
    var wrap = document.createElement('div');
    wrap.className = 'graph-form';
    wrap.innerHTML =
      '<div class="graph-form__row"><label>1. Образец XLSX ' + hint('Прикрепите типовой XLSX (до 5 МБ), и wizard сам определит стиль, предложит маппинг колонок и подскажет regex для имени листа. Опционально — можно заполнить вручную.') + '</label><div class="graph-form__field">' +
        '<input type="file" id="wzSample" accept=".xlsx,.xls,.xlsm" />' +
        '<span class="graph-form__hint" id="wzSampleHint">Опционально. Помогает автодетекту и предпросмотру.</span>' +
        '<div class="graph-template-row" id="wzTemplateRow" style="display:none"></div>' +
      '</div></div>' +
      '<div class="graph-form__row"><label>2. Стиль профиля ' + hint('Metso: один лист = один шкаф, всё пишется построчно (LOOPTAG, ADDRESS). Koyo: отдельные листы AI/AO/DI/DO. Универсальный: вы сами решаете, какие уровни иерархии создаются и как — для нестандартных задач.') + '</label><div class="graph-form__field">' +
        '<div class="graph-style-radios">' +
          '<label><input type="radio" name="wzStyle" value="metso" checked /> Metso (один лист = один шкаф)</label>' +
          '<label><input type="radio" name="wzStyle" value="koyo" /> Koyo (листы по типам сигналов: AI/AO/DI/DO)</label>' +
          '<label><input type="radio" name="wzStyle" value="universal" /> Универсальный (свой набор уровней и маппинга)</label>' +
        '</div>' +
        '<span class="graph-form__hint" id="wzStyleHint"></span>' +
      '</div></div>' +
      '<div class="graph-form__row"><label>3. ID профиля ' + hint('Латиницей с нижним подчёркиванием, как metso_dna_rio. Используется в логах, в graph_report и в attributes.author узлов. После создания не меняется.') + '</label><div class="graph-form__field">' +
        '<input type="text" id="wzId" maxlength="96" placeholder="my_new_profile" />' +
      '</div></div>' +
      '<div class="graph-form__row"><label>4. Описание ' + hint('Свободный текст, виден в списке профилей. Помогает вспомнить, для каких файлов нужен этот профиль. Можно на русском.') + '</label><div class="graph-form__field">' +
        '<input type="text" id="wzDesc" maxlength="512" placeholder="Краткое описание формата XLSX" />' +
      '</div></div>' +
      '<div class="graph-form__row" data-style="metso koyo universal"><label>5. match.file_extensions ' + hint('Список расширений файлов (с точкой), через запятую. Если файл не подходит ни под один профиль, парсер графа просто не запускается. Пример: .xlsx, .xlsm') + '</label><div class="graph-form__field">' +
        '<input type="text" id="wzExt" placeholder=".xlsx, .xlsm" />' +
      '</div></div>' +
      '<div class="graph-form__row" data-style="metso universal"><label>match.sheet_name_pattern ' + hint('Регулярное выражение для имени листа. Хотя бы один лист в файле должен под него подойти. Пример: ^_?IO-\\d+ — для листов типа _IO-06.') + '</label><div class="graph-form__field">' +
        '<input type="text" id="wzSheetRe" placeholder="^_?IO-\\d+" />' +
      '</div></div>' +
      '<div class="graph-form__row" data-style="metso universal"><label>match.required_headers ' + hint('Подстроки, которые должны встретиться в строке заголовков. Сравнение нечувствительно к регистру и пробелам. Через запятую. Пример: LOOPTAG, ADDRESS, CARH_TYPE.') + '</label><div class="graph-form__field">' +
        '<input type="text" id="wzReqHeaders" placeholder="LOOPTAG, ADDRESS, CARH_TYPE" />' +
      '</div></div>' +
      '<div class="graph-form__row" data-style="koyo universal"><label>match.required_sheets ' + hint('Все указанные листы должны присутствовать в файле. Через запятую. Используется в koyo-style: AI, AO, DI, DO.') + '</label><div class="graph-form__field">' +
        '<input type="text" id="wzReqSheets" placeholder="AI, AO, DI, DO" />' +
      '</div></div>' +
      '<div class="graph-form__row" data-style="metso koyo universal"><label>6. layout.header_row / data_start_row ' + hint('Номер строки в Excel с заголовками колонок (header_row) и номер первой строки данных (data_start_row). Считаются от 1, как видно в Excel. Часто 1 и 4 для metso, 3 и 4 для koyo.') + '</label><div class="graph-form__field">' +
        '<div style="display:flex;gap:8px;">' +
          '<input type="number" id="wzHeaderRow" min="1" max="100" style="max-width:120px" />' +
          '<input type="number" id="wzDataStart" min="1" max="500" style="max-width:120px" />' +
        '</div>' +
      '</div></div>' +
      '<div class="graph-form__row" data-style="metso universal"><label>layout.sheet_filter ' + hint('Опциональный regex для отбора листов, которые парсер должен обработать (отдельный от match.sheet_name_pattern). Например, если в файле есть служебные листы — указать здесь маску только нужных.') + '</label><div class="graph-form__field">' +
        '<input type="text" id="wzSheetFilter" placeholder="^_?IO-\\d+" />' +
      '</div></div>' +
      '<div class="graph-form__row" data-style="metso koyo universal"><label>7. builds ' + hint('Какие уровни иерархии создаёт парсер: object → cabinet → station → card → channel → signal → device. Чем меньше уровней — тем проще граф. Можно убрать, например, device или channel, если они не нужны.') + '</label><div class="graph-form__field">' +
        '<div id="wzBuilds" style="display:flex;gap:10px;flex-wrap:wrap;"></div>' +
        '<span class="graph-form__hint">В koyo-style уровни задаются внутри per_sheet — этот общий список тогда не используется.</span>' +
      '</div></div>' +
      '<div class="graph-form__row" data-style="metso universal" id="wzCabinetRow"><label>8. cabinet (metso) ' + hint('Откуда брать код шкафа. Сейчас поддержан только источник sheet_name: парсер извлекает группу из regex по имени листа. Шаблон имени — c подстановкой {cabinet_code}. Пример: regex ^_?(IO-\\d+), template «Cabinet {cabinet_code}».') + '</label><div class="graph-form__field">' +
        '<input type="text" id="wzCabPattern" placeholder="^_?(IO-\\d+)" />' +
        '<input type="text" id="wzCabTemplate" placeholder="Cabinet {cabinet_code}" />' +
      '</div></div>' +
      '<div class="graph-form__row" data-style="koyo universal" id="wzStationDefRow"><label>station_default (koyo) ' + hint('В koyo-style на каждый файл — один ПЛК (одна станция). Шаблон station_code обычно {filename_without_ext} — код станции = имя файла без расширения. Шаблон имени — «ПЛК {station_code}».') + '</label><div class="graph-form__field">' +
        '<input type="text" id="wzStationCode" placeholder="{filename_without_ext}" />' +
        '<input type="text" id="wzStationName" placeholder="ПЛК {station_code}" />' +
      '</div></div>' +
      '<div class="graph-form__row" data-style="metso universal"><label>9. columns (JSON) ' + hint('Маппинг внутренних полей парсера на заголовки колонок XLSX. Пример: {"loop_tag": "LOOPTAG", "address": "ADDRESS"}. После загрузки образца wizard может заполнить это автоматически.') + '</label><div class="graph-form__field">' +
        '<textarea id="wzColumns" class="graph-mono" rows="8" placeholder="{\n  &quot;loop_tag&quot;: &quot;LOOPTAG&quot;,\n  &quot;address&quot;: &quot;ADDRESS&quot;\n}"></textarea>' +
      '</div></div>' +
      '<div class="graph-form__row" data-style="koyo universal"><label>per_sheet (JSON, koyo) ' + hint('Для каждого листа — отдельный набор builds, signal_kind и columns. Пример: {"AI": {"builds": ["station","card","channel","signal"], "signal_kind": "AI", "columns": {"tag": "Tag Name"}}}.') + '</label><div class="graph-form__field">' +
        '<textarea id="wzPerSheet" class="graph-mono" rows="8" placeholder="{\n  &quot;AI&quot;: { &quot;builds&quot;: [&quot;station&quot;,&quot;card&quot;,&quot;channel&quot;,&quot;signal&quot;], &quot;signal_kind&quot;: &quot;AI&quot;, &quot;columns&quot;: { &quot;tag&quot;: &quot;Tag Name&quot; } }\n}"></textarea>' +
      '</div></div>' +
      '<div class="graph-form__row" data-style="metso koyo universal"><label>skip_rows (JSON) ' + hint('Условия пропуска строк. Поддержано: loop_tag_empty, loop_tag_matches:<regex>, tag_empty, description_matches:<regex>. Пример: [{"condition": "loop_tag_empty"}, {"condition": "loop_tag_matches:^Резерв"}].') + '</label><div class="graph-form__field">' +
        '<textarea id="wzSkipRows" class="graph-mono" rows="4" placeholder="[{ &quot;condition&quot;: &quot;loop_tag_empty&quot; }]"></textarea>' +
      '</div></div>' +
      '<div id="wzErr" class="graph-form__error" style="display:none"></div>' +
      '<div id="wzPreviewWrap"></div>';

    function getStyle() {
      var checked = wrap.querySelector('input[name="wzStyle"]:checked');
      return checked ? checked.value : 'metso';
    }
    function setStyle(value) {
      var radios = wrap.querySelectorAll('input[name="wzStyle"]');
      radios.forEach(function (r) { r.checked = (r.value === value); });
      updateVisibility();
    }

    // ─── Builds: explicit Set state (single source of truth) ───
    // Fixes bug где Apply Template затирал кастомные unchecks: теперь
    // checkboxes только отражают buildsState, и buildsState изменяется
    // только через явные действия (init / change / setBuildsList).
    var buildsState = new Set(Array.isArray(data.builds) ? data.builds : []);
    var buildsDirty = false;  // true once user toggled any checkbox
    function setBuildsList(items, opts) {
      opts = opts || {};
      if (buildsDirty && !opts.force) return;  // respect user's manual choices
      buildsState = new Set(Array.isArray(items) ? items : []);
      renderBuilds();
    }
    function renderBuilds() {
      var style = getStyle();
      var box = $('wzBuilds');
      if (!box) return;
      // Список типов узлов — динамический, из БД через state.nodeTypes.
      // Если список ещё не загружен — fallback на builtin кодировки.
      var types = (Array.isArray(state.nodeTypes) && state.nodeTypes.length > 0)
        ? state.nodeTypes.slice().filter(function (t) { return !t.is_archived; })
        : ['object','cabinet','station','card','channel','signal','device'].map(function (c) {
            return { code: c, label_ru: c, icon: '', description: '', sort_order: 100, is_archived: false };
          });
      types.sort(function (a, b) { return (a.sort_order || 100) - (b.sort_order || 100); });
      // В metso/koyo-режиме скрываем 'object' (он только для универсального стиля).
      // В универсальном — показываем все.
      if (style !== 'universal') {
        types = types.filter(function (t) { return t.code !== 'object'; });
      }
      box.innerHTML = types.map(function (t) {
        var ck = buildsState.has(t.code) ? 'checked' : '';
        var iconPart = t.icon ? (esc(t.icon) + ' ') : '';
        var tip = t.description ? hint(t.description) : '';
        return '<label style="display:inline-flex;align-items:center;gap:4px;">' +
               '<input type="checkbox" data-build="' + esc(t.code) + '" ' + ck + ' />' +
               iconPart + esc(t.label_ru || t.code) + tip + '</label>';
      }).join('');
      box.querySelectorAll('input[type=checkbox]').forEach(function (cb) {
        cb.addEventListener('change', function () {
          buildsDirty = true;
          var b = cb.getAttribute('data-build');
          if (cb.checked) buildsState.add(b); else buildsState.delete(b);
        });
      });
    }
    function updateVisibility() {
      var style = getStyle();
      // Спрятать/показать строки по data-style. Если data-style отсутствует — всегда видна.
      wrap.querySelectorAll('.graph-form__row[data-style]').forEach(function (row) {
        var styles = (row.getAttribute('data-style') || '').split(/\s+/);
        var visible = styles.indexOf(style) >= 0;
        row.style.display = visible ? 'grid' : 'none';
      });
      // Перерендерить чекбоксы builds (набор уровней зависит от стиля)
      renderBuilds();
    }
    function fillFromData() {
      setStyle(detectedStyle);
      $('wzId').value = data.id || '';
      if (isEdit) { $('wzId').disabled = true; }
      $('wzDesc').value = data.description || '';
      var m = data.match || {};
      $('wzExt').value = (m.file_extensions || []).join(', ');
      $('wzSheetRe').value = m.sheet_name_pattern || '';
      $('wzReqHeaders').value = (m.required_headers || []).join(', ');
      $('wzReqSheets').value = (m.required_sheets || []).join(', ');
      var l = data.layout || {};
      $('wzHeaderRow').value = l.header_row || 1;
      $('wzDataStart').value = l.data_start_row || 2;
      $('wzSheetFilter').value = l.sheet_filter || '';
      var c = data.cabinet || {};
      $('wzCabPattern').value = c.pattern || '';
      $('wzCabTemplate').value = c.name_template || '';
      var sd = data.station_default || {};
      $('wzStationCode').value = sd.station_code_template || '';
      $('wzStationName').value = sd.name_template || '';
      $('wzColumns').value = data.columns && Object.keys(data.columns).length
        ? JSON.stringify(data.columns, null, 2) : '';
      $('wzPerSheet').value = data.per_sheet ? JSON.stringify(data.per_sheet, null, 2) : '';
      $('wzSkipRows').value = Array.isArray(data.skip_rows) && data.skip_rows.length
        ? JSON.stringify(data.skip_rows, null, 2) : '';
      // Сбросить буfferы builds: при первом отрисовке мы хотим именно data.builds,
      // не «то, что осталось в DOM от прошлого открытия».
      buildsState = new Set(Array.isArray(data.builds) ? data.builds : []);
      buildsDirty = false;
      updateVisibility();
    }
    function parseList(s) { return String(s || '').split(',').map(function (x) { return x.trim(); }).filter(function (x) { return x.length > 0; }); }
    function collectPayload() {
      var style = getStyle();
      var payload = {};
      if (!isEdit) payload.id = ($('wzId').value || '').trim();
      payload.description = ($('wzDesc').value || '').trim();
      payload.match = {};
      var ext = parseList($('wzExt').value); if (ext.length) payload.match.file_extensions = ext;
      var snp = ($('wzSheetRe').value || '').trim(); if (snp) payload.match.sheet_name_pattern = snp;
      var rh = parseList($('wzReqHeaders').value); if (rh.length) payload.match.required_headers = rh;
      var rs = parseList($('wzReqSheets').value); if (rs.length) payload.match.required_sheets = rs;
      var headerRow = Number($('wzHeaderRow').value) || 1;
      var dataStartRow = Number($('wzDataStart').value) || 2;
      var sheetFilter = ($('wzSheetFilter').value || '').trim();
      payload.layout = { header_row: headerRow, data_start_row: dataStartRow };
      if (sheetFilter) payload.layout.sheet_filter = sheetFilter;
      // builds — из явного buildsState (а не из DOM), чтобы не зависело от того,
      // когда последний раз вызывался renderBuilds / какие чекбоксы есть в DOM.
      payload.builds = Array.from(buildsState);
      if (style === 'metso' || style === 'universal') {
        var cabPattern = ($('wzCabPattern').value || '').trim();
        var cabTemplate = ($('wzCabTemplate').value || '').trim();
        if (cabPattern || cabTemplate) {
          payload.cabinet = { source: 'sheet_name', pattern: cabPattern, name_template: cabTemplate || 'Cabinet {cabinet_code}' };
        }
      }
      if (style === 'koyo' || style === 'universal') {
        var sCode = ($('wzStationCode').value || '').trim();
        var sName = ($('wzStationName').value || '').trim();
        if (sCode || sName) {
          payload.station_default = {
            station_code_template: sCode || '{filename_without_ext}',
            name_template: sName || 'ПЛК {station_code}'
          };
        }
      }
      var colTxt = ($('wzColumns').value || '').trim();
      if (colTxt) {
        try { payload.columns = JSON.parse(colTxt); }
        catch (e) { throw new Error('columns: невалидный JSON — ' + e.message); }
      }
      var psTxt = ($('wzPerSheet').value || '').trim();
      if (psTxt) {
        try { payload.per_sheet = JSON.parse(psTxt); }
        catch (e) { throw new Error('per_sheet: невалидный JSON — ' + e.message); }
      }
      var skTxt = ($('wzSkipRows').value || '').trim();
      if (skTxt) {
        try { payload.skip_rows = JSON.parse(skTxt); }
        catch (e) { throw new Error('skip_rows: невалидный JSON — ' + e.message); }
      }
      return payload;
    }

    setTimeout(fillFromData, 0);
    setTimeout(function () {
      // ── Подписки ──
      wrap.querySelectorAll('input[name="wzStyle"]').forEach(function (r) {
        r.addEventListener('change', updateVisibility);
      });
      // Применить шаблон
      function attachTemplateClick(btn, profileId) {
        btn.addEventListener('click', function () {
          api('GET', '/api/v2/graph/profiles/' + encodeURIComponent(profileId)).then(function (res) {
            var raw = res && res.profile;
            if (!raw) { toast('Профиль не найден', 'error'); return; }
            // #8.1.c.fix-2: deep clone через JSON.parse(JSON.stringify(...)) —
            // не делим ссылки с кэшем и гарантированно копируем ВСЕ nested
            // (match.required_headers, skip_rows, per_sheet.<sheet>.columns и т.п.).
            var src;
            try { src = JSON.parse(JSON.stringify(raw)); }
            catch (e) { toast('Не удалось клонировать шаблон: ' + e.message, 'error'); return; }
            delete src.id;  // id всегда задаёт пользователь, не копируем
            applyTemplateToWizard(src, profileId);
          }).catch(function (err) { toast('Не удалось применить шаблон: ' + err.message, 'error'); });
        });
      }
      function applyTemplateToWizard(src, profileId) {
        // Описание — НЕ перетираем, если пользователь уже что-то ввёл.
        if ($('wzDesc') && !$('wzDesc').value) $('wzDesc').value = src.description || '';
        var m = src.match || {};
        $('wzExt').value = Array.isArray(m.file_extensions) ? m.file_extensions.join(', ') : '';
        $('wzSheetRe').value = m.sheet_name_pattern || '';
        $('wzReqHeaders').value = Array.isArray(m.required_headers) ? m.required_headers.join(', ') : '';
        $('wzReqSheets').value = Array.isArray(m.required_sheets) ? m.required_sheets.join(', ') : '';
        var l = src.layout || {};
        $('wzHeaderRow').value = Number(l.header_row) || 1;
        $('wzDataStart').value = Number(l.data_start_row) || 2;
        $('wzSheetFilter').value = l.sheet_filter || '';
        var c = src.cabinet || {};
        $('wzCabPattern').value = c.pattern || '';
        $('wzCabTemplate').value = c.name_template || '';
        var sd = src.station_default || {};
        $('wzStationCode').value = sd.station_code_template || '';
        $('wzStationName').value = sd.name_template || '';
        // Nested-объекты идут как JSON в textarea — тут deep clone уже сделан,
        // JSON.stringify даст ровно те же ключи/массивы, что и в YAML.
        $('wzColumns').value = src.columns && Object.keys(src.columns).length
          ? JSON.stringify(src.columns, null, 2) : '';
        $('wzPerSheet').value = (src.per_sheet && Object.keys(src.per_sheet).length)
          ? JSON.stringify(src.per_sheet, null, 2) : '';
        $('wzSkipRows').value = Array.isArray(src.skip_rows) && src.skip_rows.length
          ? JSON.stringify(src.skip_rows, null, 2) : '';
        // builds: стиль решает по наличию per_sheet (как в metso_dna_rio /
        // koyo_directlogic_pro).
        var newStyle = (src.per_sheet && Object.keys(src.per_sheet).length) ? 'koyo' : 'metso';
        setStyle(newStyle);
        // Если пользователь уже трогал чекбоксы builds (buildsDirty=true) —
        // setBuildsList НЕ перезатрёт его кастом (см. #8.1.c.fix-patch bug 1).
        setBuildsList(Array.isArray(src.builds) ? src.builds : []);
        if (buildsDirty) {
          toast('Шаблон применён, но ваш кастомный список «builds» сохранён. Сбросьте чекбоксы вручную, если нужно.');
        } else {
          toast('Поля заполнены из шаблона ' + profileId + '. Допишите свой id и сохраните.');
        }
      }
      // ── Sample upload + autodetect + auto-fill columns/per_sheet ──
      var sample = $('wzSample');
      if (sample) sample.addEventListener('change', function () {
        var f = sample.files && sample.files[0];
        if (!f) return;
        var fd = new FormData(); fd.append('file', f);
        $('wzSampleHint').textContent = 'Анализ файла…';
        api('POST', '/api/v2/graph/profiles/detect-style', fd).then(function (res) {
          sampleSheets = res.sheets || [];
          detectedStyle = res.style || detectedStyle;
          setStyle(detectedStyle);
          $('wzStyleHint').textContent = 'Автодетект: ' + detectedStyle + '. Листы: ' + sampleSheets.map(function (s) { return s.name; }).join(', ');
          // Авто-заполнить columns (metso) / per_sheet (koyo), если поле пустое или {} 
          var colsEl = $('wzColumns');
          var psEl = $('wzPerSheet');
          if (detectedStyle === 'metso' && colsEl && (!colsEl.value.trim() || colsEl.value.trim() === '{}')) {
            var hdr = (sampleSheets[0] && sampleSheets[0].sample_header) || [];
            var cols = buildColumnsFromHeaders(hdr);
            if (Object.keys(cols).length) {
              colsEl.value = JSON.stringify(cols, null, 2);
            }
            // Также проставить sheet_filter и sheet_name_pattern по первому листу.
            // Используем single-pass regex чтобы не было double-escape: цифровые группы
            // заменяются на \\d+, остальные куски — escape'ятся как regex-literals.
            var firstSheet = sampleSheets[0] && sampleSheets[0].name;
            var suggested = firstSheet ? ('^' + String(firstSheet).replace(/(\d+)|([^\d]+)/g, function (_, digits, text) {
              return digits ? '\\d+' : text.replace(/[.+?()[\]{}|^$\\]/g, '\\$&');
            })) : '';
            if (suggested && !$('wzSheetFilter').value) $('wzSheetFilter').value = suggested;
            if (suggested && !$('wzSheetRe').value) $('wzSheetRe').value = suggested;
          }
          if (detectedStyle === 'koyo' && psEl && (!psEl.value.trim() || psEl.value.trim() === '{}')) {
            var ps = buildPerSheetFromDetection(sampleSheets);
            if (Object.keys(ps).length) {
              psEl.value = JSON.stringify(ps, null, 2);
            }
            // koyo-style имеет другую структуру листов: заголовки в строке 3, данные с 4.
            // Дефолт metso (header_row=1) дал бы парсеру tag_empty x N — поэтому переставляем,
            // но только если пользователь не успел отредактировать значения вручную.
            var hrEl = $('wzHeaderRow'); var dsEl = $('wzDataStart');
            if (hrEl && (!hrEl.value || Number(hrEl.value) === 1)) hrEl.value = 3;
            if (dsEl && (!dsEl.value || Number(dsEl.value) === 2)) dsEl.value = 4;
            // required_sheets из koyo-листов
            if (!$('wzReqSheets').value) {
              var koyoNames = Object.keys(ps);
              if (koyoNames.length) $('wzReqSheets').value = koyoNames.join(', ');
            }
          }
          // ── Показать кнопки шаблонов ──
          var tplRow = $('wzTemplateRow');
          if (tplRow) {
            tplRow.style.display = 'flex';
            tplRow.innerHTML = '<span class="graph-form__hint" style="width:100%;">Быстрый старт — применить значения из существующего профиля (id не копируется):</span>';
            var btnM = document.createElement('button'); btnM.type = 'button'; btnM.className = 'btn btn--ghost'; btnM.textContent = 'Применить шаблон metso_dna_rio';
            var btnK = document.createElement('button'); btnK.type = 'button'; btnK.className = 'btn btn--ghost'; btnK.textContent = 'Применить шаблон koyo_directlogic_pro';
            attachTemplateClick(btnM, 'metso_dna_rio');
            attachTemplateClick(btnK, 'koyo_directlogic_pro');
            tplRow.appendChild(btnM);
            tplRow.appendChild(btnK);
          }
          $('wzSampleHint').textContent = 'Готово. Стиль: ' + detectedStyle + '. Можно нажать «Проверить профиль» или применить готовый шаблон.';
        }).catch(function (err) {
          $('wzSampleHint').textContent = 'Не удалось проанализировать файл: ' + err.message;
        });
      });
    }, 0);

    function showError(msg) { var e = $('wzErr'); e.style.display = 'block'; e.textContent = msg; }
    function clearError() { var e = $('wzErr'); e.style.display = 'none'; e.textContent = ''; }

    var testBtn = makeBtn('Проверить профиль', 'btn--ghost', function () {
      clearError();
      var sample = $('wzSample');
      var f = sample && sample.files && sample.files[0];
      if (!f) { showError('Прикрепите образец XLSX в разделе 1, чтобы проверить профиль.'); return; }
      var payload;
      try { payload = collectPayload(); } catch (e) { showError(e.message); return; }
      if (!payload.id && isEdit) payload.id = data.id;
      var fd = new FormData(); fd.append('file', f); fd.append('profile', JSON.stringify(payload));
      var pw = $('wzPreviewWrap'); pw.innerHTML = '<div class="settings-hint">Проверка…</div>';
      api('POST', '/api/v2/graph/profiles/test', fd).then(function (res) {
        renderPreview(pw, res);
      }).catch(function (err) {
        pw.innerHTML = '';
        showError(err.message || 'Не удалось проверить профиль');
      });
    });
    var saveBtn = makeBtn('Сохранить', 'btn--accent', function () {
      clearError();
      var payload;
      try { payload = collectPayload(); } catch (e) { showError(e.message); return; }
      if (isEdit) {
        api('PUT', '/api/v2/graph/profiles/' + encodeURIComponent(data.id), payload).then(function (res) {
          toast(res.message || 'Профиль обновлён');
          closeModal(); loadProfiles();
        }).catch(function (err) { showError(err.message); });
      } else {
        if (!/^[a-z][a-z0-9_]*$/.test(payload.id || '')) {
          showError('ID профиля должен быть snake_case латиницей'); return;
        }
        api('POST', '/api/v2/graph/profiles', payload).then(function (res) {
          toast(res.message || 'Профиль создан');
          closeModal(); loadProfiles();
        }).catch(function (err) { showError(err.message); });
      }
    });
    var cancelBtn = makeBtn('Отмена', 'btn--ghost', closeModal);
    openModal(isEdit ? ('Изменить профиль: ' + data.id) : 'Создание профиля парсера', wrap, [cancelBtn, testBtn, saveBtn]);
  }

  function renderPreview(container, res) {
    var s = res.summary || {};
    var rows = ['cabinet','station','card','channel','signal','device'].map(function (k) {
      var n = (s[k] && s[k].found) || 0;
      return '<tr><td>' + k + '</td><td style="text-align:right;">' + n + '</td></tr>';
    }).join('');
    var warningsHtml = '';
    if (Array.isArray(res.warnings) && res.warnings.length > 0) {
      warningsHtml = '<div class="graph-warnings">' + res.warnings.map(function (w) {
        var examples = (w.examples || []).slice(0, 3).join(', ');
        return '<div class="graph-warning-item">' + esc(w.code) + ' (×' + (w.count || 0) + ')' +
          (examples ? ': ' + esc(examples) : '') +
          (w.hint ? '<br><span class="graph-form__hint">' + esc(w.hint) + '</span>' : '') +
          '</div>';
      }).join('') + '</div>';
    }
    var samples = Array.isArray(res.sample_signals) ? res.sample_signals : [];
    var samplesHtml = '';
    if (samples.length > 0) {
      samplesHtml = '<table class="graph-preview-table" style="margin-top:8px;"><thead><tr><th>tag</th><th>kind</th><th>raw</th><th>addr</th><th>chan</th><th>station</th></tr></thead><tbody>' +
        samples.map(function (sg) {
          return '<tr>' +
            '<td>' + esc(sg.tag || '') + '</td>' +
            '<td>' + esc(sg.signal_kind || '') + '</td>' +
            '<td>' + esc(sg.signal_kind_raw || '') + '</td>' +
            '<td>' + esc(sg.address || '') + '</td>' +
            '<td>' + esc(sg.channel || '') + '</td>' +
            '<td>' + esc(sg.station_code || '') + '</td>' +
          '</tr>';
        }).join('') +
        '</tbody></table>';
    }
    container.innerHTML = '<div class="graph-preview"><strong>Если бы профиль применили:</strong>' +
      '<table class="graph-preview-table"><tbody>' + rows + '</tbody></table>' +
      '<div class="graph-form__hint" style="margin-top:4px;">Связей (оценка): ' + (res.edges_estimate || 0) + '</div>' +
      warningsHtml + samplesHtml + '</div>';
  }

  function confirmDeleteProfile(profileId) {
    var wrap = document.createElement('div');
    wrap.innerHTML = '<p style="margin:0;">Удалить профиль <strong>' + esc(profileId) + '</strong>?</p>' +
      '<p class="settings-hint" style="margin-top:6px;">Граф уже импортированных документов не меняется. Файлы, которые подходили под этот профиль, при будущем импорте будут проверяться на остальные профили.</p>';
    var cancelBtn = makeBtn('Отмена', 'btn--ghost', closeModal);
    var del = makeBtn('Удалить', 'btn--danger', function () {
      api('DELETE', '/api/v2/graph/profiles/' + encodeURIComponent(profileId)).then(function (res) {
        toast(res.message || 'Удалено');
        closeModal(); loadProfiles();
      }).catch(function (err) { toast('Не удалось удалить: ' + err.message, 'error'); });
    });
    openModal('Удалить профиль?', wrap, [cancelBtn, del]);
  }

  // ─── Subtabs / event wiring ─────────────────────────────────
  function setActiveSubtab(name) {
    document.querySelectorAll('[data-graph-subtab]').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-graph-subtab') === name);
    });
    document.querySelectorAll('[data-graph-subpanel]').forEach(function (panel) {
      panel.classList.toggle('is-active', panel.getAttribute('data-graph-subpanel') === name);
    });
  }
  function bindEvents() {
    document.addEventListener('click', function (e) {
      var subBtn = e.target.closest('[data-graph-subtab]');
      if (subBtn) { setActiveSubtab(subBtn.getAttribute('data-graph-subtab')); return; }
      var action = e.target.closest('[data-graph-action]');
      if (action) {
        var name = action.getAttribute('data-graph-action');
        var id = action.getAttribute('data-id');
        if (name === 'edit-profile') {
          var p = state.profiles.find(function (x) { return x.id === id; });
          if (p) openProfileEditor(p);
        } else if (name === 'delete-profile') {
          confirmDeleteProfile(id);
        } else if (name === 'add-alias') {
          openAddAliasDialog(id);
        } else if (name === 'edit-alias') {
          openAliasEditor(id);
        } else if (name === 'delete-alias') {
          confirmDeleteAlias(id);
        } else if (name === 'edit-nodetype') {
          var nt = state.nodeTypes.find(function (x) { return x.code === id; });
          if (nt) openNodeTypeEditor(nt);
        } else if (name === 'delete-nodetype') {
          confirmDeleteNodeType(id);
        }
        return;
      }
    });
    var cBtn = $('graphProfileCreateBtn'); if (cBtn) cBtn.addEventListener('click', function () { openProfileEditor(null); });
    var rBtn = $('graphProfileRawBtn'); if (rBtn) rBtn.addEventListener('click', function () { openRawEditor('profiles'); });
    var pRef = $('graphProfileRefresh'); if (pRef) pRef.addEventListener('click', loadProfiles);
    var aBtn = $('graphAliasCreateBtn'); if (aBtn) aBtn.addEventListener('click', openCreateCanonicalConfirm);
    var arBtn = $('graphAliasRawBtn'); if (arBtn) arBtn.addEventListener('click', function () { openRawEditor('aliases'); });
    var aRef = $('graphAliasRefresh'); if (aRef) aRef.addEventListener('click', loadAliases);
    var ntCreate = $('graphNodeTypeCreateBtn'); if (ntCreate) ntCreate.addEventListener('click', function () { openNodeTypeEditor(null); });
    var ntRef = $('graphNodeTypeRefresh'); if (ntRef) ntRef.addEventListener('click', loadNodeTypes);
  }

  window.__graphTabActivate = function () {
    if (state.loaded) return;
    state.loaded = true;
    ensureModal();
    bindEvents();
    Promise.all([loadProfiles(), loadAliases(), loadNodeTypes()]);
  };
})();

  