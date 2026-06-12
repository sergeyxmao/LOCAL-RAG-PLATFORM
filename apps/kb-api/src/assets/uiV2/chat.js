
    (function () {
      var INITIAL_STATE = window.__UIV2_STATE__ || {};
      var state = {
        sessions: [],
        activeSessionId: null,
        messages: [],
        nodes: [],
        nodeCounts: {},
        documents: [],
        selectedNodeIds: new Set(),
        selectedDocumentIds: new Set(),
        selectedTags: new Set(),
        availableTags: [],
        tagsSearchTerm: "",
        nodeExpanded: new Set(),
        filtersOpen: false,
        loadingMessage: false,
        documentSearchTerm: "",
        cloudProvider: { configured: false, name: "Cloud", useByDefault: false },
        cloudProviders: { providers: [], defaultProviderId: null },
        providerMenuOpen: false,
        streamingController: null,
        streamRenderTimer: null,
        expandedSources: {},
      };

      var dom = {
        history: document.getElementById("historyList"),
        newChatBtn: document.getElementById("newChatBtn"),
        modeToggle: document.getElementById("modeToggle"),
        providerPicker: document.getElementById("providerPicker"),
        providerPickerTrigger: document.getElementById("providerPickerTrigger"),
        providerPickerLabel: document.getElementById("providerPickerLabel"),
        providerPickerMenu: document.getElementById("providerPickerMenu"),
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
        documentListCount: document.getElementById("documentListCount"),
        documentSearch: document.getElementById("documentSearch"),
        tagsFilterSelected: document.getElementById("tagsFilterSelected"),
        tagsFilterInput: document.getElementById("tagsFilterInput"),
        tagsFilterSuggest: document.getElementById("tagsFilterSuggest"),
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

      var MARKED_READY = typeof window.marked !== "undefined";
      var PURIFY_READY = typeof window.DOMPurify !== "undefined";
      if (MARKED_READY && window.marked.setOptions) {
        window.marked.setOptions({ breaks: true, gfm: true, mangle: false, headerIds: false });
      }
      function renderMarkdown(text) {
        var raw = String(text == null ? "" : text);
        if (!raw.trim()) return "";
        if (!MARKED_READY || !PURIFY_READY) {
          return escapeHtml(raw).replace(/\n/g, "<br>");
        }
        try {
          var html = window.marked.parse(raw);
          return window.DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
        } catch (err) {
          return escapeHtml(raw).replace(/\n/g, "<br>");
        }
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

      function openConfirmModal({ title, bodyHtml, danger, confirmLabel, cancelLabel, onConfirm }) {
        var backdrop = document.getElementById("chatModalBackdrop");
        var titleEl = document.getElementById("chatModalTitle");
        var bodyEl = document.getElementById("chatModalBody");
        var footEl = document.getElementById("chatModalFoot");
        if (!backdrop || !bodyEl || !footEl) return;
        titleEl.textContent = title || "Подтверждение";
        bodyEl.innerHTML = bodyHtml || "";
        footEl.innerHTML = "";

        var cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.className = "btn btn--ghost";
        cancelBtn.textContent = cancelLabel || "Отмена";
        cancelBtn.addEventListener("click", closeConfirmModal);

        var confirmBtn = document.createElement("button");
        confirmBtn.type = "button";
        confirmBtn.className = "btn " + (danger ? "btn--danger" : "btn--accent");
        confirmBtn.textContent = confirmLabel || "OK";
        confirmBtn.addEventListener("click", function () {
          closeConfirmModal();
          if (typeof onConfirm === "function") onConfirm();
        });

        footEl.appendChild(cancelBtn);
        footEl.appendChild(confirmBtn);
        backdrop.classList.add("is-open");
      }

      function closeConfirmModal() {
        var backdrop = document.getElementById("chatModalBackdrop");
        if (backdrop) backdrop.classList.remove("is-open");
      }

      function confirmDeleteSession(id, title) {
        openConfirmModal({
          title: "Удалить чат?",
          bodyHtml: '<p>Чат «<strong>' + escapeHtml(title || "без названия") + '</strong>» и вся его история будут удалены без возможности восстановления.</p>' +
                    '<p class="text-muted">Сообщения и вложенные источники удалятся каскадом.</p>',
          danger: true,
          confirmLabel: "Удалить чат",
          onConfirm: function () {
            api("DELETE", "/api/v2/chat/sessions/" + id).then(function () {
              state.sessions = state.sessions.filter(function (s) { return s.id !== id; });
              if (state.activeSessionId === id) {
                state.activeSessionId = state.sessions[0] ? state.sessions[0].id : null;
                loadActiveSession();
              } else {
                renderHistory();
              }
              showToast("Чат удалён");
            }).catch(function (err) { showToast("Не удалось удалить: " + err.message, "error"); });
          },
        });
      }

      function api(method, path, body) {
        var opts = { method: method, headers: {} };
        if (body !== undefined) {
          opts.headers["Content-Type"] = "application/json";
          opts.body = JSON.stringify(body);
        }
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

      function startOfDay(d) {
        var x = new Date(d);
        x.setHours(0, 0, 0, 0);
        return x;
      }

      function classifySessionDate(updatedAt) {
        if (!updatedAt) return { group: "Раньше", order: 5 };
        var d = new Date(updatedAt);
        if (isNaN(d.getTime())) return { group: "Раньше", order: 5 };
        var now = new Date();
        var today = startOfDay(now);
        var yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        var weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        var monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 30);
        var dDay = startOfDay(d);
        if (dDay.getTime() === today.getTime()) return { group: "Сегодня", order: 0 };
        if (dDay.getTime() === yesterday.getTime()) return { group: "Вчера", order: 1 };
        if (d >= weekAgo) return { group: "За последние 7 дней", order: 2 };
        if (d >= monthAgo) return { group: "За последние 30 дней", order: 3 };
        return { group: "Раньше", order: 4 };
      }

      function pad2(n) { return n < 10 ? "0" + n : String(n); }

      function formatSessionDate(updatedAt) {
        if (!updatedAt) return "";
        var d = new Date(updatedAt);
        if (isNaN(d.getTime())) return "";
        var now = new Date();
        var isSameDay = d.toDateString() === now.toDateString();
        if (isSameDay) {
          return pad2(d.getHours()) + ":" + pad2(d.getMinutes());
        }
        var sameYear = d.getFullYear() === now.getFullYear();
        if (sameYear) {
          return pad2(d.getDate()) + "." + pad2(d.getMonth() + 1);
        }
        return pad2(d.getDate()) + "." + pad2(d.getMonth() + 1) + "." + String(d.getFullYear()).slice(-2);
      }

      function renderHistory() {
        if (!dom.history) return;
        if (!state.sessions.length) {
          dom.history.innerHTML = '<div class="sidebar__empty">История пуста. Задайте первый вопрос.</div>';
          return;
        }
        var groups = [];
        var byKey = {};
        state.sessions.forEach(function (session) {
          var info = classifySessionDate(session.updatedAt || session.updated_at);
          var key = info.order + ":" + info.group;
          if (!byKey[key]) {
            byKey[key] = { title: info.group, order: info.order, items: [] };
            groups.push(byKey[key]);
          }
          byKey[key].items.push(session);
        });
        groups.sort(function (a, b) { return a.order - b.order; });
        var html = groups.map(function (g) {
          var itemsHtml = g.items.map(function (session) {
            var isActive = session.id === state.activeSessionId ? " is-active" : "";
            var dateStr = formatSessionDate(session.updatedAt || session.updated_at);
            return '<div class="sidebar__history-item' + isActive + '" data-session-id="' + escapeHtml(session.id) + '">' +
              '<span class="sidebar__history-title" title="' + escapeHtml(session.title) + '">' + escapeHtml(session.title) + '</span>' +
              (dateStr ? '<span class="sidebar__history-date">' + escapeHtml(dateStr) + '</span>' : '') +
              '<button type="button" class="sidebar__history-delete" data-action="delete-session" data-session-id="' + escapeHtml(session.id) + '" aria-label="Удалить чат">' +
              INITIAL_STATE.icons.trash +
              '</button></div>';
          }).join("");
          return '<div class="sidebar__history-group-title">' + escapeHtml(g.title) + '</div>' + itemsHtml;
        }).join("");
        dom.history.innerHTML = html;
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
        if (s && s.provider) return s.provider;
        var defaultId = state.cloudProviders.defaultProviderId;
        if (state.cloudProvider.useByDefault && state.cloudProvider.configured && defaultId) {
          return "cloud:" + defaultId;
        }
        return "local";
      }

      function isCloudProviderValue(value) {
        return value === "cloud" || (typeof value === "string" && value.indexOf("cloud:") === 0);
      }

      function findProviderById(id) {
        var list = state.cloudProviders.providers || [];
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === id) return list[i];
        }
        return null;
      }

      function resolveCloudInfo(provider) {
        var list = state.cloudProviders.providers || [];
        if (provider === "cloud") {
          var def = findProviderById(state.cloudProviders.defaultProviderId) || list[0] || null;
          return def;
        }
        if (typeof provider !== "string" || provider.indexOf("cloud:") !== 0) return null;
        var id = provider.slice("cloud:".length);
        var exact = findProviderById(id);
        if (exact) return exact;
        return findProviderById(state.cloudProviders.defaultProviderId) || list[0] || null;
      }

      function describeProvider(provider) {
        if (!isCloudProviderValue(provider)) {
          return { icon: "🔒", label: "Локально", configured: true };
        }
        var info = resolveCloudInfo(provider);
        if (!info || !info.configured) {
          return { icon: "⚡", label: "Облако (не настроено)", configured: false };
        }
        return { icon: "⚡", label: info.name || "Облако", configured: true };
      }

      function renderProviderPicker() {
        if (!dom.providerPickerTrigger) return;
        var current = getActiveProvider();
        var info = describeProvider(current);
        var icon = dom.providerPickerTrigger.querySelector(".provider-picker__icon");
        if (icon) icon.textContent = info.icon;
        if (dom.providerPickerLabel) dom.providerPickerLabel.textContent = info.label;
        dom.providerPickerTrigger.setAttribute(
          "title",
          info.configured ? "Текущий провайдер: " + info.label : "Облако не настроено"
        );
        renderProviderMenu(current);
        renderCloudBanner(current, info);
      }

      function cloudBannerStorageKey(provider) {
        return "localrag.chat.cloudWarnDismissed." + (state.activeSessionId || "_") + "::" + (provider || "");
      }

      function isCloudBannerDismissed(provider) {
        try { return localStorage.getItem(cloudBannerStorageKey(provider)) === "1"; }
        catch (err) { return false; }
      }

      function dismissCloudBanner(provider) {
        try { localStorage.setItem(cloudBannerStorageKey(provider), "1"); } catch (err) {}
      }

      function renderCloudBanner(current, info) {
        if (!dom.cloudBanner) return;
        var shouldShow = isCloudProviderValue(current) && info && info.configured;
        if (!shouldShow || isCloudBannerDismissed(current)) {
          dom.cloudBanner.classList.remove("is-visible");
          dom.cloudBanner.innerHTML = "";
          return;
        }
        dom.cloudBanner.classList.add("is-visible");
        dom.cloudBanner.innerHTML =
          '<span class="cloud-banner__text">⚠ Фрагменты документов уйдут во внешний API (' +
            escapeHtml(info.label) + ').</span>' +
          '<button type="button" class="cloud-banner__close" data-action="dismiss-cloud-banner" aria-label="Скрыть предупреждение">×</button>';
      }

      function renderProviderMenu(currentProvider) {
        if (!dom.providerPickerMenu) return;
        var defaultId = state.cloudProviders.defaultProviderId;
        var providers = state.cloudProviders.providers || [];
        var lines = [];
        providers.forEach(function (p) {
          var providerKey = "cloud:" + p.id;
          var isActive = currentProvider === providerKey ||
            (currentProvider === "cloud" && p.id === defaultId);
          var badge = p.id === defaultId ? '<span class="provider-picker__item-badge">по умолчанию</span>' : '';
          var configured = p.configured === true;
          var disabledAttr = configured ? '' : ' disabled aria-disabled="true"';
          var titleAttr = configured ? '' : ' title="Провайдер не настроен — заполните Base URL, ключ и модель"';
          lines.push(
            '<button type="button" class="provider-picker__item' + (isActive ? ' is-active' : '') +
            '" data-provider-value="' + escapeHtml(providerKey) + '"' + disabledAttr + titleAttr + '>' +
            '<span class="provider-picker__item-check">' + (isActive ? '✓' : '') + '</span>' +
            '<span aria-hidden="true">⚡</span>' +
            '<span class="provider-picker__item-name" title="' + escapeHtml(p.name || "Облако") + '">' + escapeHtml(p.name || "Облако") + '</span>' +
            badge +
            '</button>'
          );
        });
        if (providers.length === 0) {
          lines.push('<div class="provider-picker__empty">Облачные провайдеры не настроены — добавьте их в Настройках.</div>');
        }
        if (providers.length > 0) {
          lines.push('<div class="provider-picker__divider"></div>');
        }
        var localActive = currentProvider === "local";
        lines.push(
          '<button type="button" class="provider-picker__item' + (localActive ? ' is-active' : '') + '" data-provider-value="local">' +
          '<span class="provider-picker__item-check">' + (localActive ? '✓' : '') + '</span>' +
          '<span aria-hidden="true">🔒</span>' +
          '<span class="provider-picker__item-name">Локально (Ollama)</span>' +
          '</button>'
        );
        dom.providerPickerMenu.innerHTML = lines.join("");
      }

      function loadCloudProviderInfo() {
        return Promise.all([
          fetch("/api/v2/settings/cloudProvider").then(function (r) { return r.json(); }).catch(function () { return null; }),
          fetch("/api/v2/settings/cloudProviders").then(function (r) { return r.json(); }).catch(function () { return null; }),
        ]).then(function (results) {
          var legacy = results[0];
          if (legacy && legacy.ok && legacy.cloudProvider) {
            state.cloudProvider = {
              configured: legacy.cloudProvider.configured === true,
              name: legacy.cloudProvider.name || "Cloud",
              useByDefault: legacy.cloudProvider.useByDefault === true,
            };
          } else {
            state.cloudProvider = { configured: false, name: "Cloud", useByDefault: false };
          }
          var list = results[1];
          if (list && list.ok) {
            state.cloudProviders = {
              providers: Array.isArray(list.providers) ? list.providers : [],
              defaultProviderId: list.defaultProviderId || null,
            };
          } else {
            state.cloudProviders = { providers: [], defaultProviderId: null };
          }
        });
      }

      function toggleProviderMenu(open) {
        if (!dom.providerPicker || !dom.providerPickerTrigger) return;
        var nowOpen = typeof open === "boolean" ? open : !state.providerMenuOpen;
        state.providerMenuOpen = nowOpen;
        dom.providerPicker.classList.toggle("is-open", nowOpen);
        dom.providerPickerTrigger.setAttribute("aria-expanded", nowOpen ? "true" : "false");
      }

      function setProvider(provider) {
        if (isCloudProviderValue(provider)) {
          var info = resolveCloudInfo(provider);
          if (!info || !info.configured) {
            showToast("Выбранный провайдер не настроен. Откройте «Настройки».", "error");
            return Promise.resolve();
          }
        }
        if (!state.activeSessionId) {
          return createSession(getActiveMode() || "answer", provider).then(renderProviderPicker);
        }
        var session = getActiveSession();
        if (!session) return Promise.resolve();
        session.provider = provider;
        renderProviderPicker();
        return api("PATCH", "/api/v2/chat/sessions/" + state.activeSessionId, { provider: provider }).then(function (data) {
          var idx = state.sessions.findIndex(function (s) { return s.id === state.activeSessionId; });
          if (idx >= 0) state.sessions[idx] = data.session;
          renderProviderPicker();
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
      }

      function renderFilterSummary() {
        if (!dom.filterSummary) return;
        var nodeCount = state.selectedNodeIds.size;
        var docCount = state.selectedDocumentIds.size;
        var tagCount = state.selectedTags.size;
        if (!nodeCount && !docCount && !tagCount) {
          dom.filterSummary.innerHTML = '<span>Фильтры не заданы — поиск идёт по всей базе.</span>';
          return;
        }
        var chips = [];
        if (nodeCount) chips.push('<span class="filter-summary__chip">' + nodeCount + ' разд.</span>');
        if (docCount) chips.push('<span class="filter-summary__chip">' + docCount + ' док.</span>');
        if (tagCount) chips.push('<span class="filter-summary__chip">' + tagCount + ' тег.</span>');
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

      function normalizeSources(items) {
        if (!Array.isArray(items)) return [];
        return items.map(function (s) {
          if (!s || typeof s !== "object") return s;
          // #8.3: графовый источник. Сохраняем origin и графовые поля как для
          // живого onSources (snake_case), так и для уже сохранённого compact.
          if (s.origin === "graph") {
            return {
              origin: "graph",
              resourceType: "graph_node",
              documentId: null,
              documentName: s.documentName ?? s.title ?? s.graph_type ?? s.graphType ?? "Узел графа",
              graphNodeId: s.graphNodeId ?? s.graph_node_id ?? null,
              graphType: s.graphType ?? s.graph_type ?? null,
              graphAttributes: s.graphAttributes ?? s.graph_attributes ?? {},
              graphRelations: Array.isArray(s.graphRelations) ? s.graphRelations
                : Array.isArray(s.graph_relations) ? s.graph_relations : [],
              snippet: typeof s.text === "string" ? s.text : (s.snippet ?? null),
            };
          }
          if (s.documentName !== undefined || s.assetPreviewUrl !== undefined) {
            return s;
          }
          return {
            documentId: s.document_id ?? s.documentId ?? null,
            documentName: s.title ?? s.document_name ?? s.documentName ?? null,
            sourcePath: s.source_path ?? s.sourcePath ?? null,
            resourceType: s.resource_type ?? s.resourceType ?? null,
            page: s.page_number ?? s.page ?? null,
            chunkIndex: s.chunk_index ?? s.chunkIndex ?? null,
            snippet: typeof s.text === "string" ? s.text : (s.snippet ?? null),
            score: s.score ?? null,
            assetClass: s.asset_class ?? s.assetClass ?? null,
            assetUrl: s.asset_url ?? s.assetUrl ?? null,
            assetPreviewUrl: s.asset_preview_url ?? s.assetPreviewUrl ?? null,
            nodePaths: Array.isArray(s.node_paths) ? s.node_paths : Array.isArray(s.nodePaths) ? s.nodePaths : [],
            signalTags: Array.isArray(s.signal_tags) ? s.signal_tags : Array.isArray(s.signalTags) ? s.signalTags : [],
          };
        });
      }

      function sourceShortLabel(source, idx) {
        if (source.page) return "Страница " + source.page;
        if (source.chunkIndex !== null && source.chunkIndex !== undefined && source.chunkIndex !== "") {
          return "Фрагмент #" + source.chunkIndex;
        }
        var snippet = (source.snippet || "").replace(/\s+/g, " ").trim();
        if (snippet) {
          var head = snippet.split(/[.\n]/)[0] || snippet;
          return head.length > 80 ? head.slice(0, 80) + "…" : head;
        }
        return "Фрагмент " + (idx + 1);
      }

      function sourceLink(source) {
        return source.assetPreviewUrl || source.assetUrl
          || (source.documentId ? "/documents/" + encodeURIComponent(source.documentId) + "/original" : "");
      }

      function sourceTooltip(source, idx) {
        var parts = [];
        var doc = source.documentName || source.sourcePath || ("Документ " + (idx + 1));
        parts.push("Источник " + (idx + 1) + ": " + doc);
        if (source.page) parts.push("страница " + source.page);
        else if (source.chunkIndex !== null && source.chunkIndex !== undefined && source.chunkIndex !== "") {
          parts.push("фрагмент #" + source.chunkIndex);
        }
        return parts.join(", ");
      }

      function pluralRu(n, forms) {
        var mod10 = n % 10;
        var mod100 = n % 100;
        if (mod10 === 1 && mod100 !== 11) return forms[0];
        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
        return forms[2];
      }

      function groupSourcesByDocument(sources) {
        var order = [];
        var byDoc = {};
        sources.forEach(function (src, idx) {
          // #8.3: все графовые источники собираем в одну группу «Граф знаний».
          var isGraph = src && src.origin === "graph";
          var key = isGraph
            ? "__graph__"
            : (src.documentId || src.documentName || src.sourcePath || ("__doc_" + idx));
          if (!byDoc[key]) {
            byDoc[key] = {
              key: key,
              isGraph: isGraph,
              documentId: isGraph ? null : (src.documentId || null),
              documentName: isGraph ? "🕸 Граф знаний" : (src.documentName || src.sourcePath || ("Документ " + (idx + 1))),
              items: [],
            };
            order.push(key);
          }
          byDoc[key].items.push({ source: src, index: idx });
        });
        return order.map(function (k) { return byDoc[k]; });
      }

      function renderSourcesCompact(message) {
        var sources = Array.isArray(message.sources) ? message.sources : [];
        if (!sources.length) return "";
        var groups = groupSourcesByDocument(sources);
        var fragLabel = pluralRu(sources.length, ["фрагмент", "фрагмента", "фрагментов"]);
        var docLabel = pluralRu(groups.length, ["документа", "документов", "документов"]);
        var isOpen = state.expandedSources && state.expandedSources[message.id] === true;
        var groupsHtml = groups.map(function (g) {
          var docHref = g.documentId ? '/documents/' + encodeURIComponent(g.documentId) + '/original' : '#';
          var itemsHtml = g.items.map(function (it) {
            var src = it.source;
            var refNum = it.index + 1;
            // #8.3: графовая карточка — отличаем origin:"graph", ссылка ведёт
            // в раздел графа, добавляем бейдж происхождения.
            if (src && src.origin === "graph") {
              var gLabel = (src.graphType ? src.graphType + ": " : "") + (src.documentName || "Узел графа");
              var gTitle = (src.snippet || gLabel);
              var gHref = "/ui/v2/graph" + (src.graphNodeId ? ("?node=" + encodeURIComponent(src.graphNodeId)) : "");
              return '<div class="sources-compact__item" data-source-index="' + refNum + '"' +
                ' data-href="' + escapeHtml(gHref) + '"' +
                ' id="src-' + escapeHtml(message.id) + '-' + refNum + '">' +
                '<span class="sources-compact__item-index">[' + refNum + ']</span>' +
                '<span class="sources-compact__item-label" title="' + escapeHtml(gTitle) + '">' + escapeHtml(gLabel) + '</span>' +
                '<span class="sources-compact__item-enriched" title="Факт из графа знаний (структурный источник)">🕸 граф</span>' +
                '<a class="sources-compact__item-link" href="' + escapeHtml(gHref) + '" target="_blank" rel="noopener" data-source-link="1">→ в граф</a>' +
                '</div>';
            }
            var label = sourceShortLabel(src, it.index);
            var href = sourceLink(src);
            var enrichTitle = label;
            if (src && src.chunkContext) enrichTitle += "\nКонтекст: " + src.chunkContext;
            if (src && src.chunkSummary) enrichTitle += "\nОписание: " + src.chunkSummary;
            var enrichBadge = (src && (src.chunkContext || src.chunkSummary))
              ? '<span class="sources-compact__item-enriched" title="Фрагмент обогащён контекстом при импорте">✦</span>'
              : '';
            var linkPart = href
              ? '<a class="sources-compact__item-link" href="' + escapeHtml(href) + '" target="_blank" rel="noopener" data-source-link="1">→ открыть</a>'
              : '';
            return '<div class="sources-compact__item" data-source-index="' + refNum + '"' +
              (href ? ' data-href="' + escapeHtml(href) + '"' : '') +
              ' id="src-' + escapeHtml(message.id) + '-' + refNum + '">' +
              '<span class="sources-compact__item-index">[' + refNum + ']</span>' +
              '<span class="sources-compact__item-label" title="' + escapeHtml(enrichTitle) + '">' + escapeHtml(label) + '</span>' +
              enrichBadge +
              linkPart +
              '</div>';
          }).join("");
          var docHeadHtml = g.isGraph
            ? '<span title="Структурные факты из графа знаний">' + escapeHtml(g.documentName) + '</span>'
            : '<a href="' + escapeHtml(docHref) + '" target="_blank" rel="noopener" title="' + escapeHtml(g.documentName) + '">' + escapeHtml(g.documentName) + '</a>';
          return '<div class="sources-compact__group">' +
            '<div class="sources-compact__doc">' +
            docHeadHtml +
            '<span class="sources-compact__count">' + g.items.length + ' / ' + sources.length + '</span>' +
            '</div>' +
            '<div class="sources-compact__items">' + itemsHtml + '</div>' +
            '</div>';
        }).join("");
        return '<div class="sources-compact' + (isOpen ? ' is-open' : '') + '" data-message-id="' + escapeHtml(message.id) + '">' +
          '<div class="sources-compact__header" data-action="toggle-sources">' +
          '<span class="sources-compact__label">ИСТОЧНИКИ · ' + sources.length + ' ' + fragLabel + ' из ' + groups.length + ' ' + docLabel + '</span>' +
          '<span class="sources-compact__toggle">' + (isOpen ? "▴ Скрыть" : "▾ Показать") + '</span>' +
          '</div>' +
          '<div class="sources-compact__body">' + groupsHtml + '</div>' +
          '</div>';
      }

      function decorateRefs(container, sourcesCount, messageId) {
        if (!container || sourcesCount <= 0) return;
        var REF_PATTERN = /\[\s*(?:Источник|Source)?\s*(\d+(?:\s*,\s*\d+)*)\s*\]/g;
        var walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
        var nodes = [];
        var node;
        while ((node = walker.nextNode())) {
          if (node.parentNode && node.parentNode.closest("code, pre, a, .msg__ref")) continue;
          var probe = new RegExp(REF_PATTERN.source);
          if (probe.test(node.textContent)) nodes.push(node);
        }
        function makeRef(n) {
          var sup = document.createElement("sup");
          sup.className = "msg__ref";
          var a = document.createElement("a");
          a.href = "#src-" + messageId + "-" + n;
          a.setAttribute("data-source-index", String(n));
          a.setAttribute("data-message-id", String(messageId));
          a.textContent = "[" + n + "]";
          sup.appendChild(a);
          return sup;
        }
        nodes.forEach(function (textNode) {
          var text = textNode.textContent;
          var frag = document.createDocumentFragment();
          var lastIndex = 0;
          var re = new RegExp(REF_PATTERN.source, "g");
          var match;
          while ((match = re.exec(text)) !== null) {
            if (lastIndex < match.index) {
              frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
            }
            var numbers = String(match[1])
              .split(",")
              .map(function (s) { return parseInt(s.trim(), 10); })
              .filter(function (n) { return Number.isFinite(n) && n >= 1 && n <= sourcesCount; });
            if (numbers.length) {
              numbers.forEach(function (n) { frag.appendChild(makeRef(n)); });
            } else {
              frag.appendChild(document.createTextNode(match[0]));
            }
            lastIndex = match.index + match[0].length;
          }
          if (lastIndex < text.length) {
            frag.appendChild(document.createTextNode(text.slice(lastIndex)));
          }
          textNode.parentNode.replaceChild(frag, textNode);
        });
      }

      function annotateRefsWithTooltips(container, sources) {
        if (!container || !sources || !sources.length) return;
        container.querySelectorAll(".msg__ref a").forEach(function (a) {
          var idx = parseInt(a.getAttribute("data-source-index"), 10);
          if (!Number.isFinite(idx) || idx < 1 || idx > sources.length) return;
          var src = sources[idx - 1];
          a.setAttribute("title", sourceTooltip(src, idx - 1));
        });
      }

      function openSourcesAndHighlight(messageId, refIndex) {
        if (!messageId || !refIndex) return;
        var sel = window.CSS && CSS.escape ? CSS.escape(messageId) : messageId;
        var article = dom.stream.querySelector('article[data-msg-id="' + sel + '"]');
        if (!article) return;
        var block = article.querySelector(".sources-compact");
        if (!block) return;
        if (!block.classList.contains("is-open")) {
          block.classList.add("is-open");
          state.expandedSources[messageId] = true;
          var toggleEl = block.querySelector(".sources-compact__toggle");
          if (toggleEl) toggleEl.textContent = "▴ Скрыть";
        }
        var item = block.querySelector(
          '.sources-compact__item[data-source-index="' + refIndex + '"]'
        );
        if (item) {
          item.scrollIntoView({ behavior: "smooth", block: "nearest" });
          item.classList.remove("is-highlighted");
          void item.offsetWidth;
          item.classList.add("is-highlighted");
          setTimeout(function () { item.classList.remove("is-highlighted"); }, 1500);
        }
      }

      function formatRerankingBadge(info) {
        if (!info || typeof info !== "object") return "";
        if (info.enabled === false) return "";
        var mode = info.mode || info.provider || "heuristic";
        var label = "";
        var title = "";
        if (mode === "jina") {
          label = "reranking: Jina";
          title = "Облачный Jina API. Тексты найденных фрагментов отправлены в облако.";
        } else if (mode === "local") {
          label = "reranking: локальный (" + escapeHtml(info.model || "bge-reranker-base") + ")";
          title = "Локальный reranker-сервис. Документы наружу не отправлялись.";
        } else if (mode === "heuristic-fallback") {
          label = "reranking: эвристика (запасной)";
          title = "Выбранный режим (" + escapeHtml(info.failedProvider || info.provider || "?") + ") недоступен. Использован запасной режим. Причина: " + escapeHtml(info.fallbackReason || "—");
        } else if (mode === "heuristic") {
          label = "reranking: эвристика";
          title = "Режим без модели — взвешенные суммы fusion/semantic/lexical скоров.";
        } else if (mode === "disabled") {
          return "";
        } else {
          label = "reranking: " + escapeHtml(mode);
        }
        var cls = mode === "heuristic-fallback" ? "msg__rerank msg__rerank--warn" : "msg__rerank";
        return '<span class="' + cls + '" title="' + title + '">' + label + '</span>';
      }

      function formatHydeBadge(info) {
        if (!info || typeof info !== "object") return "";
        var label = "";
        var title = "";
        var cls = "msg__hyde";
        if (info.used === true) {
          var ms = typeof info.latencyMs === "number" ? Math.round(info.latencyMs) + " мс" : "";
          var modelLabel = info.model ? escapeHtml(info.model) : "";
          var parts = ["HyDE: использован"];
          if (modelLabel) parts.push(modelLabel);
          if (ms) parts.push(ms);
          label = parts.join(" · ");
          title = "Перед поиском сгенерирован гипотетический параграф документа (" +
            (modelLabel || "облачная модель") + "), эмбеддинг считался по нему. " +
            "Это улучшает semantic-поиск на расплывчатых запросах. BM25 шёл по сырому вопросу.";
          cls += " msg__hyde--used";
        } else {
          var reason = info.reason || "";
          if (reason === "disabled") {
            return "";
          } else if (reason === "no_provider") {
            label = "HyDE: fallback (провайдер не настроен)";
            title = "HyDE включён, но облачный провайдер для HyDE не выбран или у него нет ключа. Поиск выполнен по сырому запросу.";
            cls += " msg__hyde--warn";
          } else if (reason === "no_model") {
            label = "HyDE: fallback (нет модели)";
            title = "HyDE включён, но в настройках не указана модель. Поиск выполнен по сырому запросу.";
            cls += " msg__hyde--warn";
          } else if (reason === "no_prompt") {
            label = "HyDE: fallback (пустой промпт)";
            title = "HyDE включён, но промпт пуст. Поиск выполнен по сырому запросу.";
            cls += " msg__hyde--warn";
          } else if (reason === "short_response") {
            label = "HyDE: fallback (короткий ответ)";
            title = "Модель вернула слишком короткий гипотетический параграф (<50 символов). Поиск выполнен по сырому запросу.";
            cls += " msg__hyde--warn";
          } else if (reason === "error") {
            label = "HyDE: fallback (ошибка)";
            title = "Ошибка при генерации гипотетического параграфа: " + escapeHtml(info.error || "—") +
              ". Поиск выполнен по сырому запросу.";
            cls += " msg__hyde--warn";
          } else {
            return "";
          }
        }
        return '<span class="' + cls + '" title="' + title + '">' + label + '</span>';
      }

      function formatGraphBadge(info) {
        // #8.3: бейдж «граф: N фактов» по образцу HyDE/reranking.
        if (!info || typeof info !== "object") return "";
        if (info.used !== true || !info.count) return "";
        var label = "граф: " + info.count + " " + pluralRu(info.count, ["факт", "факта", "фактов"]);
        var title = "Для структурного вопроса (есть идентификатор-подобный термин) " +
          "найдены точные факты в графе знаний: узел и его прямые связи подмешаны " +
          "в промпт и добавлены в источники с пометкой графа.";
        return '<span class="msg__hyde msg__hyde--used" title="' + escapeHtml(title) + '">' + escapeHtml(label) + '</span>';
      }

      function formatEnrichmentBadge(sources) {
        if (!Array.isArray(sources) || !sources.length) return "";
        var enriched = sources.filter(function (s) {
          return s && (s.chunkContext || s.chunkSummary);
        });
        if (!enriched.length) return "";
        var title = "Найденные фрагменты обогащены контекстом при импорте (Слой 2): " +
          "к тексту добавлено краткое описание места фрагмента в документе. " +
          "Это улучшает и semantic-поиск, и BM25. Обогащено фрагментов: " +
          enriched.length + " из " + sources.length + ".";
        return '<span class="msg__hyde msg__hyde--used" title="' + escapeHtml(title) + '">' +
          'фрагменты обогащены · ' + enriched.length + '/' + sources.length + '</span>';
      }

      function renderMessage(message, opts) {
        opts = opts || {};
        var isUser = message.role === "user";
        var avatar = isUser ? "вы" : "ИИ";
        var contentHtml;
        if (opts.typing) {
          contentHtml = '<div class="msg__bubble"><span class="typing-dots"><span></span><span></span><span></span></span></div>';
        } else if (isUser) {
          contentHtml = '<div class="msg__bubble">' + escapeHtml(message.content) + '</div>';
        } else {
          contentHtml = '<div class="msg__bubble msg__bubble--md">' + renderMarkdown(message.content) + '</div>';
        }
        var sources = Array.isArray(message.sources) ? message.sources : [];
        var sourcesHtml = "";
        if (!isUser && sources.length) {
          sourcesHtml = renderSourcesCompact(message);
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
          var rerankBadge = formatRerankingBadge(meta.reranking);
          if (rerankBadge) metaParts.push(rerankBadge);
          var hydeBadge = formatHydeBadge(meta.hyde);
          if (hydeBadge) metaParts.push(hydeBadge);
          var graphBadge = formatGraphBadge(meta.graph);
          if (graphBadge) metaParts.push(graphBadge);
          var enrichmentBadge = formatEnrichmentBadge(sources);
          if (enrichmentBadge) metaParts.push(enrichmentBadge);
          if (meta.error && meta.error.code) {
            var showSwitch = meta.provider === "cloud" && meta.error.code !== "no_credentials";
            errorHtml = '<div class="msg__error">' +
              '<span>' + escapeHtml(meta.error.message || ("Ошибка: " + meta.error.code)) + '</span>' +
              (showSwitch ? '<button type="button" data-action="switch-to-local" data-msg-id="' + escapeHtml(message.id) + '">Переключиться на локальный ИИ</button>' : '') +
              '</div>';
          }
        }
        var metaHtml = metaParts.length ? '<div class="msg__meta">' + metaParts.join("") + '</div>' : '';
        return '<article class="msg msg--' + (isUser ? "user" : "assistant") + '" data-msg-id="' + escapeHtml(message.id) + '">' +
          '<div class="msg__avatar">' + avatar + '</div>' +
          '<div class="msg__body">' + contentHtml + errorHtml + sourcesHtml + metaHtml + '</div>' +
          '</article>';
      }

      function isStreamNearBottom() {
        var el = dom.stream;
        if (!el) return true;
        return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
      }

      function renderStream() {
        if (state.streamRenderTimer) {
          clearTimeout(state.streamRenderTimer);
          state.streamRenderTimer = null;
        }
        if (!state.activeSessionId) {
          renderEmpty();
          return;
        }
        if (!state.messages.length) {
          renderEmpty();
          return;
        }
        var shouldAutoscroll = isStreamNearBottom();
        var prevScrollTop = dom.stream.scrollTop;
        var html = state.messages.map(function (msg) {
          if (msg.streaming === true && !msg.content) return renderMessage(msg, { typing: true });
          return renderMessage(msg, { streaming: msg.streaming === true });
        }).join("");
        dom.stream.innerHTML = html;
        decorateAllRefs();
        if (shouldAutoscroll) {
          dom.stream.scrollTop = dom.stream.scrollHeight;
        } else {
          dom.stream.scrollTop = prevScrollTop;
        }
      }

      function decorateAllRefs() {
        state.messages.forEach(function (msg) {
          if (msg.role !== "assistant") return;
          var sources = Array.isArray(msg.sources) ? msg.sources : [];
          if (!sources.length) return;
          var article = dom.stream.querySelector('article[data-msg-id="' + (window.CSS && CSS.escape ? CSS.escape(msg.id) : msg.id) + '"]');
          if (!article) return;
          var bubble = article.querySelector(".msg__bubble--md");
          if (bubble) {
            decorateRefs(bubble, sources.length, msg.id);
            annotateRefsWithTooltips(bubble, sources);
          }
        });
      }

      function scheduleStreamRender() {
        if (state.streamRenderTimer) return;
        state.streamRenderTimer = setTimeout(function () {
          state.streamRenderTimer = null;
          renderStream();
        }, 80);
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

      function docTagsOf(doc) {
        if (!doc) return [];
        if (Array.isArray(doc.categories)) return doc.categories;
        if (Array.isArray(doc.tags)) return doc.tags;
        return [];
      }

      function renderDocuments() {
        if (!dom.documentList) return;
        var term = state.documentSearchTerm.toLowerCase().trim();
        var totalAll = state.documents.length;
        var selectedTagSet = state.selectedTags;
        var hasTagFilter = selectedTagSet && selectedTagSet.size > 0;
        var docs = state.documents.filter(function (d) {
          if (term) {
            var hay = ((d.title || "") + " " + (d.source_path || "")).toLowerCase();
            if (hay.indexOf(term) === -1) return false;
          }
          if (hasTagFilter) {
            var tags = docTagsOf(d);
            if (!tags.length) return false;
            var hit = false;
            for (var i = 0; i < tags.length; i++) {
              if (selectedTagSet.has(tags[i])) { hit = true; break; }
            }
            if (!hit) return false;
          }
          return true;
        });

        if (dom.documentListCount) {
          if (hasTagFilter || term) {
            dom.documentListCount.textContent = totalAll > 0
              ? "(" + docs.length + " из " + totalAll + ")"
              : "";
          } else {
            dom.documentListCount.textContent = totalAll > 0 ? "(" + totalAll + ")" : "";
          }
        }

        if (!docs.length) {
          var note;
          if (hasTagFilter) {
            note = "Нет документов с этими тегами.";
          } else if (state.selectedNodeIds.size) {
            note = "В выбранных разделах документов не найдено.";
          } else {
            note = "Выберите раздел, чтобы увидеть документы. Или ищите по всей базе.";
          }
          dom.documentList.innerHTML = '<div class="filters-empty">' + escapeHtml(note) + '</div>';
          return;
        }
        dom.documentList.innerHTML = docs.slice(0, 200).map(function (doc) {
          var selected = state.selectedDocumentIds.has(doc.id) ? "checked" : "";
          var docTitle = doc.title || doc.source_path || doc.id;
          var docHref = "/documents/" + encodeURIComponent(doc.id) + "/original";
          return '<div class="document-row">' +
            '<input type="checkbox" class="node-row__checkbox" data-action="select-document" data-doc-id="' + escapeHtml(doc.id) + '" ' + selected + ' />' +
            '<a class="document-row__label document-row__label--link" href="' + escapeHtml(docHref) + '" target="_blank" rel="noopener" title="' + escapeHtml(docTitle) + '" data-action="open-doc-preview">' + escapeHtml(docTitle) + '</a>' +
            '<span class="document-row__meta mono">' + escapeHtml(doc.asset_count || doc.chunk_count || "") + '</span>' +
            '</div>';
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
          renderProviderPicker();
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
          state.messages = (data.messages || []).map(function (m) {
            if (m && Array.isArray(m.sources)) m.sources = normalizeSources(m.sources);
            return m;
          });
          var session = data.session;
          state.selectedNodeIds = new Set((session.filters && session.filters.nodeIds) || []);
          state.selectedDocumentIds = new Set((session.filters && session.filters.documentIds) || []);
          state.selectedTags = new Set((session.filters && session.filters.tags) || []);
          state.tagsSearchTerm = "";
          if (dom.tagsFilterInput) dom.tagsFilterInput.value = "";
          var idx = state.sessions.findIndex(function (s) { return s.id === state.activeSessionId; });
          if (idx >= 0) state.sessions[idx] = session;
          renderHistory();
          renderModeToggle();
          renderProviderPicker();
          renderFilterSummary();
          renderTagsFilter();
          loadAvailableTags();
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
          filters: { nodeIds: [], documentIds: [], tags: [] },
        };
        if (provider) payload.provider = provider;
        return api("POST", "/api/v2/chat/sessions", payload).then(function (data) {
          state.sessions.unshift(data.session);
          state.activeSessionId = data.session.id;
          state.messages = [];
          state.selectedNodeIds = new Set();
          state.selectedDocumentIds = new Set();
          state.selectedTags = new Set();
          renderHistory();
          renderModeToggle();
          renderProviderPicker();
          renderFilterSummary();
          renderTagsFilter();
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
          tags: Array.from(state.selectedTags),
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
        state.selectedTags = new Set();
        renderNodeTree();
        renderDocuments();
        renderTagsFilter();
      }

      function loadAvailableTags() {
        var nodeIds = Array.from(state.selectedNodeIds);
        var url = nodeIds.length
          ? "/tags?nodeId=" + encodeURIComponent(nodeIds[0]) + "&limit=200"
          : "/tags?limit=200";
        return api("GET", url).then(function (data) {
          state.availableTags = (data.items || []).map(function (t) {
            return typeof t === "string" ? { tag: t, count: 0 } : t;
          });
          renderTagsFilter();
        }).catch(function () {
          state.availableTags = [];
          renderTagsFilter();
        });
      }

      function renderTagsFilter() {
        if (!dom.tagsFilterSelected || !dom.tagsFilterSuggest) return;
        renderDocuments();
        var selected = Array.from(state.selectedTags);
        if (selected.length) {
          dom.tagsFilterSelected.innerHTML = selected.map(function (t) {
            return '<span class="tags-filter__chip">' + escapeHtml(t) +
              '<button type="button" data-action="remove-tag" data-tag="' + escapeHtml(t) + '" aria-label="Убрать тег">×</button>' +
              '</span>';
          }).join("");
        } else {
          dom.tagsFilterSelected.innerHTML = "";
        }
        var term = String(state.tagsSearchTerm || "").toLowerCase().trim();
        var suggestions = state.availableTags.filter(function (t) {
          var tag = (t.tag || "").toLowerCase();
          if (!tag) return false;
          if (state.selectedTags.has(t.tag)) return false;
          if (!term) return true;
          return tag.indexOf(term) !== -1;
        }).slice(0, 30);
        if (suggestions.length) {
          dom.tagsFilterSuggest.innerHTML = suggestions.map(function (t) {
            return '<button type="button" data-action="add-tag" data-tag="' + escapeHtml(t.tag) + '">' +
              escapeHtml(t.tag) +
              (t.count ? ' <span style="opacity:0.6;">·' + escapeHtml(t.count) + '</span>' : '') +
              '</button>';
          }).join("");
        } else {
          dom.tagsFilterSuggest.innerHTML = state.availableTags.length
            ? '<div class="filters-empty">Ничего не найдено.</div>'
            : '<div class="filters-empty">Тегов пока нет.</div>';
        }
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
        while ((sepIndex = buffer.indexOf("\n\n")) >= 0) {
          var rawEvent = buffer.slice(0, sepIndex);
          buffer = buffer.slice(sepIndex + 2);
          var eventName = "message";
          var dataLines = [];
          rawEvent.split("\n").forEach(function (line) {
            if (line.indexOf("event:") === 0) eventName = line.slice(6).trim();
            else if (line.indexOf("data:") === 0) dataLines.push(line.slice(5).replace(/^ /, ""));
          });
          if (dataLines.length > 0) {
            var dataStr = dataLines.join("\n");
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
                    scheduleStreamRender();
                  } else if (evt.event === "sources") {
                    assistant.sources = normalizeSources(evt.data || []);
                    renderStream();
                  } else if (evt.event === "meta") {
                    if (evt.data.userMessageId) {
                      var u = state.messages.find(function (m) { return m.id === tmpUserId; });
                      if (u) u.id = evt.data.userMessageId;
                    }
                  } else if (evt.event === "done") {
                    var newId = evt.data.assistantMessageId || assistant.id;
                    if (newId !== assistant.id && state.expandedSources[assistant.id] !== undefined) {
                      state.expandedSources[newId] = state.expandedSources[assistant.id];
                      delete state.expandedSources[assistant.id];
                    }
                    assistant.id = newId;
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
            var delId = deleteBtn.getAttribute("data-session-id");
            var sess = state.sessions.find(function (s) { return s.id === delId; });
            confirmDeleteSession(delId, sess ? sess.title : "");
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
          loadAvailableTags();
        });
        dom.documentList.addEventListener("change", function (event) {
          var cb = event.target.closest("[data-action='select-document']");
          if (!cb) return;
          var id = cb.getAttribute("data-doc-id");
          if (cb.checked) state.selectedDocumentIds.add(id); else state.selectedDocumentIds.delete(id);
        });
        dom.documentList.addEventListener("click", function (event) {
          var link = event.target.closest("[data-action='open-doc-preview']");
          if (link) event.stopPropagation();
        });
        dom.documentSearch.addEventListener("input", function (event) {
          state.documentSearchTerm = event.target.value;
          renderDocuments();
        });
        if (dom.tagsFilterInput) {
          dom.tagsFilterInput.addEventListener("input", function (event) {
            state.tagsSearchTerm = event.target.value;
            renderTagsFilter();
          });
        }
        if (dom.tagsFilterSuggest) {
          dom.tagsFilterSuggest.addEventListener("click", function (event) {
            var btn = event.target.closest("[data-action='add-tag']");
            if (!btn) return;
            var tag = btn.getAttribute("data-tag");
            if (tag) state.selectedTags.add(tag);
            renderTagsFilter();
          });
        }
        if (dom.tagsFilterSelected) {
          dom.tagsFilterSelected.addEventListener("click", function (event) {
            var btn = event.target.closest("[data-action='remove-tag']");
            if (!btn) return;
            state.selectedTags.delete(btn.getAttribute("data-tag"));
            renderTagsFilter();
          });
        }
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
            return;
          }
          var refLink = event.target.closest(".msg__ref a");
          if (refLink) {
            event.preventDefault();
            var sIdx = parseInt(refLink.getAttribute("data-source-index"), 10);
            var msgId = refLink.getAttribute("data-message-id");
            openSourcesAndHighlight(msgId, sIdx);
            return;
          }
          var srcHeader = event.target.closest(".sources-compact__header");
          if (srcHeader) {
            var block = srcHeader.closest(".sources-compact");
            if (block) {
              var mid = block.getAttribute("data-message-id");
              var nowOpen = !block.classList.contains("is-open");
              block.classList.toggle("is-open", nowOpen);
              state.expandedSources[mid] = nowOpen;
              var toggleEl = srcHeader.querySelector(".sources-compact__toggle");
              if (toggleEl) toggleEl.textContent = nowOpen ? "▴ Скрыть" : "▾ Показать";
            }
            return;
          }
          var srcItem = event.target.closest(".sources-compact__item");
          if (srcItem && !event.target.closest("[data-source-link]")) {
            var href = srcItem.getAttribute("data-href");
            if (href) window.open(href, "_blank", "noopener");
            return;
          }
          var switchBtn = event.target.closest("[data-action='switch-to-local']");
          if (switchBtn) {
            switchToLocalAndRetry();
          }
        });

        if (dom.cloudBanner) {
          dom.cloudBanner.addEventListener("click", function (event) {
            var btn = event.target.closest("[data-action='dismiss-cloud-banner']");
            if (!btn) return;
            dismissCloudBanner(getActiveProvider());
            dom.cloudBanner.classList.remove("is-visible");
            dom.cloudBanner.innerHTML = "";
          });
        }

        if (dom.providerPickerTrigger) {
          dom.providerPickerTrigger.addEventListener("click", function (event) {
            event.stopPropagation();
            toggleProviderMenu();
          });
        }
        if (dom.providerPickerMenu) {
          dom.providerPickerMenu.addEventListener("click", function (event) {
            var btn = event.target.closest("[data-provider-value]");
            if (!btn || btn.disabled) return;
            toggleProviderMenu(false);
            setProvider(btn.getAttribute("data-provider-value"));
          });
        }
        document.addEventListener("click", function (event) {
          if (!state.providerMenuOpen) return;
          if (!dom.providerPicker) return;
          if (dom.providerPicker.contains(event.target)) return;
          toggleProviderMenu(false);
        });
      }

      function bindModal() {
        var backdrop = document.getElementById("chatModalBackdrop");
        if (backdrop) {
          backdrop.addEventListener("click", function (e) {
            if (e.target === backdrop) closeConfirmModal();
          });
        }
        document.addEventListener("keydown", function (e) {
          if (e.key === "Escape") {
            closeConfirmModal();
            if (state.providerMenuOpen) toggleProviderMenu(false);
          }
        });
      }

      function bootstrap() {
        dom.chatPage.classList.add("is-filters-collapsed");
        renderEmpty();
        bindEvents();
        bindModal();
        loadCloudProviderInfo()
          .then(loadSessions)
          .then(loadActiveSession)
          .then(loadNodes)
          .then(loadAvailableTags);
      }

      bootstrap();
    })();
  