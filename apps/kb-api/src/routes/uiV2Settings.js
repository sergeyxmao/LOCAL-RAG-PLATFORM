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
        services: null,
        resetArmed: false,
      };

      var dom = {
        cloudName: document.getElementById("cfgCloudName"),
        cloudBaseUrl: document.getElementById("cfgCloudBaseUrl"),
        cloudApiKey: document.getElementById("cfgCloudApiKey"),
        cloudModel: document.getElementById("cfgCloudModel"),
        cloudUseDefault: document.getElementById("cfgCloudUseDefault"),
        cloudTest: document.getElementById("cfgCloudTest"),
        cloudSave: document.getElementById("cfgCloudSave"),
        cloudBanner: document.getElementById("cfgCloudBanner"),
        chatModel: document.getElementById("cfgChatModel"),
        embedModel: document.getElementById("cfgEmbedModel"),
        ollamaUrl: document.getElementById("cfgOllamaUrl"),
        retrievalText: document.getElementById("cfgRetrieval"),
        servicesList: document.getElementById("cfgServices"),
        servicesRefresh: document.getElementById("cfgServicesRefresh"),
        themeSelect: document.getElementById("cfgThemeDefault"),
        themeSave: document.getElementById("cfgThemeSave"),
        themeBanner: document.getElementById("cfgThemeBanner"),
        maintRebuild: document.getElementById("cfgMaintRebuild"),
        maintReset: document.getElementById("cfgMaintReset"),
        maintBanner: document.getElementById("cfgMaintBanner"),
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

      function renderRetrieval() {
        if (!state.retrieval) return;
        var lines = [];
        if (state.retrieval.semantic) lines.push("semantic.top_k: " + (state.retrieval.semantic.top_k ?? "—"));
        if (state.retrieval.lexical) lines.push("lexical.top_k: " + (state.retrieval.lexical.top_k ?? "—"));
        if (state.retrieval.fusion) lines.push("fusion.top_k_final: " + (state.retrieval.fusion.top_k_final ?? "—"));
        dom.retrievalText.value = lines.join("\\n") || "Параметры retrieval не заданы в config/retrieval.yaml";
      }

      function renderCloud() {
        var cp = state.settings && state.settings.cloudProvider;
        if (!cp) return;
        if (!state.cloudDirty) {
          dom.cloudName.value = cp.name || "";
          dom.cloudBaseUrl.value = cp.baseUrl || "";
          dom.cloudModel.value = cp.model || "";
          dom.cloudApiKey.value = cp.apiKey || "";
          dom.cloudUseDefault.checked = cp.useByDefault === true;
        }
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
          state.retrieval = data.retrieval;
          renderModels();
          renderRetrieval();
          renderCloud();
          renderTheme();
        }).catch(function (err) { showToast("Не удалось загрузить настройки: " + err.message, "error"); });
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

      function saveCloud() {
        var apiKeyValue = dom.cloudApiKey.value;
        var stored = state.settings && state.settings.cloudProvider ? state.settings.cloudProvider.apiKey : "";
        var apiKeyToSend = apiKeyValue;
        if (apiKeyValue === stored || (apiKeyValue || "").indexOf("•") !== -1) {
          apiKeyToSend = ""; // server keeps existing
        }
        var payload = {
          name: dom.cloudName.value.trim(),
          baseUrl: dom.cloudBaseUrl.value.trim(),
          model: dom.cloudModel.value.trim(),
          useByDefault: dom.cloudUseDefault.checked,
        };
        if (apiKeyToSend !== "") payload.apiKey = apiKeyToSend;

        dom.cloudSave.disabled = true;
        api("PATCH", "/api/v2/settings/cloudProvider", payload).then(function (data) {
          state.settings.cloudProvider = data.cloudProvider;
          state.cloudDirty = false;
          renderCloud();
          setBanner(dom.cloudBanner, "Настройки облака сохранены.", "success");
          showToast("Настройки облака сохранены");
        }).catch(function (err) {
          setBanner(dom.cloudBanner, "Не удалось сохранить: " + err.message, "error");
        }).then(function () { dom.cloudSave.disabled = false; });
      }

      function testCloud() {
        var apiKeyValue = dom.cloudApiKey.value;
        var payload = {
          baseUrl: dom.cloudBaseUrl.value.trim(),
          model: dom.cloudModel.value.trim(),
        };
        if (apiKeyValue && apiKeyValue.indexOf("•") === -1) payload.apiKey = apiKeyValue;

        dom.cloudTest.disabled = true;
        setBanner(dom.cloudBanner, "Идёт проверка подключения…", "success");
        api("POST", "/api/v2/settings/cloudProvider/test", payload).then(function (data) {
          if (data.ok) {
            setBanner(
              dom.cloudBanner,
              "Облако ответило: «" + (data.response || "") + "» · " + (data.latencyMs || 0) + " мс · модель " + (data.model || payload.model),
              "success"
            );
          } else {
            setBanner(dom.cloudBanner, "Ошибка [" + (data.code || "?") + "]: " + (data.message || "неизвестно"), "error");
          }
        }).catch(function (err) {
          setBanner(dom.cloudBanner, "Сбой проверки: " + err.message, "error");
        }).then(function () { dom.cloudTest.disabled = false; });
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

      function bindEvents() {
        ["input", "change"].forEach(function (ev) {
          [dom.cloudName, dom.cloudBaseUrl, dom.cloudApiKey, dom.cloudModel, dom.cloudUseDefault].forEach(function (el) {
            el.addEventListener(ev, function () { state.cloudDirty = true; });
          });
        });
        dom.cloudSave.addEventListener("click", saveCloud);
        dom.cloudTest.addEventListener("click", testCloud);
        dom.servicesRefresh.addEventListener("click", loadServices);
        dom.themeSave.addEventListener("click", saveTheme);
        dom.maintRebuild.addEventListener("click", triggerRebuild);
        dom.maintReset.addEventListener("click", triggerReset);
      }

      function bootstrap() {
        bindEvents();
        loadSettings();
        loadServices();
      }

      bootstrap();
    })();
  `;
}

export function renderSettingsPage({ ICONS, renderLayout }) {
  const content = `
    <main class="settings-page">
      <div class="settings-card">
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

      <div class="settings-card">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.upload}<span>Облачный ИИ</span></div>
          <span class="settings-hint">OpenAI-совместимый API · подробности — <a href="/docs/CLOUD_PROVIDER.md" style="color:var(--accent)" target="_blank">CLOUD_PROVIDER.md</a></span>
        </div>
        <div class="settings-card__body">
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
          <label class="settings-toggle">
            <input type="checkbox" id="cfgCloudUseDefault" />
            <span>Использовать облако по умолчанию для новых чатов</span>
          </label>
          <div class="settings-banner" id="cfgCloudBanner"></div>
          <div class="settings-actions">
            <button type="button" class="btn" id="cfgCloudTest">${ICONS.check}<span>Проверить подключение</span></button>
            <button type="button" class="btn btn--accent" id="cfgCloudSave">${ICONS.check}<span>Сохранить</span></button>
          </div>
          <p class="settings-hint">Ключ хранится в БД проекта в plaintext (см. предупреждения в <span class="mono">CLOUD_PROVIDER.md</span>). В API возвращается замаскированным, в логи не пишется. В чате выбор «Локально/Облако» — в шапке.</p>
        </div>
      </div>

      <div class="settings-card">
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

      <div class="settings-card">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.search}<span>Поиск</span></div>
          <span class="settings-hint">Источник: <span class="mono">config/retrieval.yaml</span></span>
        </div>
        <div class="settings-card__body">
          <div class="settings-field">
            <label for="cfgRetrieval">Параметры retrieval</label>
            <textarea class="settings-input settings-input--mono" id="cfgRetrieval" rows="3" readonly></textarea>
          </div>
        </div>
      </div>

      <div class="settings-card">
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

      <div class="settings-card">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.alertCircle}<span>Обслуживание</span></div>
        </div>
        <div class="settings-card__body">
          <div class="settings-actions">
            <button type="button" class="btn" id="cfgMaintRebuild">${ICONS.refresh}<span>Пересобрать Qdrant</span></button>
            <span class="settings-hint">Из PostgreSQL без потери документов.</span>
          </div>
          <p class="settings-hint">Бэкап БД сейчас доступен только через PowerShell-скрипты в <span class="mono">scripts/</span>. Подробности — <span class="mono">docs/BACKUP_RESTORE.md</span>.</p>
          <div class="danger-block">
            <div class="danger-block__text">
              <strong>Сброс содержимого.</strong> Удалит ВСЕ документы, чанки, страницы и Qdrant points. Системный раздел и схема сохранятся. Файлы в <span class="mono">data/raw</span> по умолчанию остаются.
            </div>
            <button type="button" class="btn btn--danger" id="cfgMaintReset">${ICONS.trash}<span>Сброс содержимого</span></button>
          </div>
          <div class="settings-banner" id="cfgMaintBanner"></div>
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
    pageScript: renderSettingsScript(initialStateJson),
    bodyClass: "page-settings",
  }).replace("</style>", `${renderSettingsCss()}</style>`);
}
