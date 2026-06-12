
(function() {
  "use strict";

  var state = {
    runs: [],
    activeJobId: null,
    candidates: [],
    filter: "pending",
    selected: new Set(),
  };

  var elRuns = document.getElementById("runsContainer");
  var elList = document.getElementById("candList");
  var elTitle = document.getElementById("candPaneTitle");
  var elFilter = document.getElementById("candFilter");
  var elBatchbar = document.getElementById("candBatchbar");
  var elSelCount = document.getElementById("candSelCount");

  // ===== Утилиты =====
  function escHtml(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function escAttr(s) { return escHtml(s); }

  function toast(msg, type) {
    var root = document.getElementById("toastRoot");
    var t = document.createElement("div");
    t.className = "graph-toast" + (type ? " graph-toast--" + type : "");
    t.textContent = msg;
    root.appendChild(t);
    setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 4000);
  }

  function apiGet(url) {
    return fetch(url).then(function(r) { return r.json(); }).then(function(d) {
      if (!d.ok) throw new Error(d.error || "Ошибка запроса");
      return d;
    });
  }
  function apiPost(url, body) {
    var init = { method: "POST" };
    if (body !== undefined && body !== null) {
      init.headers = { "Content-Type": "application/json" };
      init.body = JSON.stringify(body);
    }
    return fetch(url, init).then(function(r) { return r.json(); }).then(function(d) {
      if (!d.ok) throw new Error(d.error || "Ошибка запроса");
      return d;
    });
  }
  function apiPatch(url, body) {
    return fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(function(r) { return r.json(); }).then(function(d) {
      if (!d.ok) throw new Error(d.error || "Ошибка запроса");
      return d;
    });
  }

  function openModal(html, opts) {
    opts = opts || {};
    var root = document.getElementById("modalRoot");
    root.innerHTML = "";
    var overlay = document.createElement("div");
    overlay.className = "graph-modal-overlay";
    var modal = document.createElement("div");
    modal.className = "graph-modal";
    modal.innerHTML = html;
    overlay.appendChild(modal);
    overlay.addEventListener("click", function(e) { if (e.target === overlay) closeModal(); });
    root.appendChild(overlay);
    if (typeof opts.onMount === "function") opts.onMount(modal);
  }
  function closeModal() {
    var root = document.getElementById("modalRoot");
    root.innerHTML = "";
  }
  function showModalError(errEl, msg) {
    if (!errEl) return;
    errEl.textContent = msg;
    errEl.style.display = "block";
  }

  function formatDateTime(s) {
    if (!s) return "";
    var d = new Date(s);
    if (isNaN(d.getTime())) return s;
    var pad = function(n) { return n < 10 ? "0" + n : "" + n; };
    return pad(d.getDate()) + "." + pad(d.getMonth() + 1) + "." + d.getFullYear() +
      " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  function statusLabel(st) {
    if (st === "approved") return "в графе";
    if (st === "rejected") return "отклонён";
    return "на ревью";
  }
  function confText(c) {
    if (c === null || c === undefined) return "уверенность: —";
    var n = Number(c);
    if (isNaN(n)) return "уверенность: —";
    return "уверенность: " + n.toFixed(2);
  }

  // ===== Левая панель: запуски извлечения =====
  function loadRuns(preselectJobId) {
    return apiGet("/api/v2/graph/candidates/runs?limit=200").then(function(d) {
      state.runs = d.items || [];
      renderRuns();
      var target = preselectJobId || state.activeJobId;
      if (!target && state.runs.length) target = state.runs[0].extractionJobId;
      if (target) selectRun(target);
    }).catch(function(err) {
      elRuns.innerHTML = '<div class="cand-empty">Не удалось загрузить запуски: ' + escHtml(err.message) + '</div>';
    });
  }

  function renderRuns() {
    if (!state.runs.length) {
      elRuns.innerHTML = '<div class="cand-empty">Запусков извлечения пока нет.<br/>Нажмите «Извлечь знания» у текстового документа в Базе знаний.</div>';
      return;
    }
    var html = state.runs.map(function(r) {
      var title = r.documentTitle || r.documentFileName || "Документ без названия";
      var active = r.extractionJobId === state.activeJobId ? " cand-run--active" : "";
      return '<div class="cand-run' + active + '" data-job="' + escAttr(r.extractionJobId) + '">' +
        '<div class="cand-run__title">' + escHtml(title) + '</div>' +
        '<div class="cand-run__meta">' +
          '<span class="cand-pill cand-pill--pending">на ревью: ' + (r.pending || 0) + '</span>' +
          '<span class="cand-pill cand-pill--approved">в графе: ' + (r.approved || 0) + '</span>' +
          '<span class="cand-pill cand-pill--rejected">откл.: ' + (r.rejected || 0) + '</span>' +
        '</div>' +
        '<div class="cand-run__meta" style="margin-top:4px;">' + escHtml(formatDateTime(r.createdAt)) + '</div>' +
      '</div>';
    }).join("");
    elRuns.innerHTML = html;
  }

  function selectRun(jobId) {
    state.activeJobId = jobId;
    state.selected = new Set();
    renderRuns();
    loadCandidates();
  }

  // ===== Правая панель: кандидаты выбранного запуска =====
  function loadCandidates() {
    if (!state.activeJobId) return;
    var url = "/api/v2/graph/candidates?extractionJobId=" + encodeURIComponent(state.activeJobId) + "&limit=1000";
    if (state.filter === "pending") url += "&status=pending";
    elList.innerHTML = '<div class="cand-empty">Загрузка…</div>';
    return apiGet(url).then(function(d) {
      state.candidates = d.items || [];
      renderCandidates();
    }).catch(function(err) {
      elList.innerHTML = '<div class="cand-empty">Не удалось загрузить кандидатов: ' + escHtml(err.message) + '</div>';
    });
  }

  function renderField(label, value, meta) {
    var metaHtml = meta ? ' <span class="cand-meta">' + escHtml(meta) + '</span>' : '';
    var val = value ? escHtml(value) : '<span class="cand-meta">—</span>';
    return '<div class="cand-field"><div class="cand-field__label">' + escHtml(label) + '</div>' +
      '<div class="cand-field__val">' + val + metaHtml + '</div></div>';
  }

  function renderCandidates() {
    var run = null;
    for (var i = 0; i < state.runs.length; i++) {
      if (state.runs[i].extractionJobId === state.activeJobId) { run = state.runs[i]; break; }
    }
    elTitle.textContent = run
      ? ("Кандидаты — " + (run.documentTitle || run.documentFileName || ""))
      : "Кандидаты";

    if (!state.candidates.length) {
      elList.innerHTML = state.filter === "pending"
        ? '<div class="cand-empty">Непроверенных кандидатов нет.</div>'
        : '<div class="cand-empty">Кандидатов нет.</div>';
      updateBatchbar();
      return;
    }

    var html = state.candidates.map(function(c) {
      var cp = c.casePayload || {};
      var eq = cp.equipment || {};
      var fa = cp.fault || {};
      var so = cp.solution || {};
      var isPending = c.status === "pending";
      var cardCls = "cand-card" + (c.status === "approved" ? " cand-card--approved" : (c.status === "rejected" ? " cand-card--rejected" : ""));

      var eqMeta = [];
      if (eq.model) eqMeta.push("модель: " + eq.model);
      if (eq.location) eqMeta.push("место: " + eq.location);

      var head = '<div class="cand-card__head">';
      if (isPending) {
        head += '<label class="cand-check"><input type="checkbox" data-act="sel" data-id="' + escAttr(c.id) + '"' + (state.selected.has(c.id) ? ' checked' : '') + '/></label>';
      }
      head += '<span class="cand-badge cand-badge--conf">' + escHtml(confText(c.confidence)) + '</span>';
      var stCls = c.status === "approved" ? " cand-badge--approved" : (c.status === "rejected" ? " cand-badge--rejected" : "");
      head += '<span class="cand-badge' + stCls + '">' + escHtml(statusLabel(c.status)) + '</span>';
      head += '</div>';

      var grid = '<div class="cand-grid">' +
        renderField("🔧 Оборудование", eq.name || "", eqMeta.join(" · ")) +
        renderField("⚠️ Что произошло", fa.text || "", fa.date ? ("дата: " + fa.date) : "") +
        renderField("✅ Что сделали", so.text || "", so.date ? ("дата: " + so.date) : "") +
        renderField("📍 Объект", cp.object || "", "") +
      '</div>';

      var quote = cp.source_quote
        ? '<div class="cand-quote">«' + escHtml(cp.source_quote) + '»</div>'
        : '';

      var actions = '';
      if (isPending) {
        actions = '<div class="cand-actions">' +
          '<button class="graph-btn graph-btn--primary graph-btn--small" data-act="approve" data-id="' + escAttr(c.id) + '" title="Перенести случай в граф (создаст узлы/связи, author=agent:llm-extraction)">Подтвердить</button>' +
          '<button class="graph-btn graph-btn--small" data-act="edit" data-id="' + escAttr(c.id) + '" title="Поправить поля случая перед подтверждением">Править</button>' +
          '<button class="graph-btn graph-btn--small" data-act="reject" data-id="' + escAttr(c.id) + '" title="Отклонить: в граф не попадёт, останется в очереди как rejected (для аудита)">Отклонить</button>' +
          '<span class="hint" data-tip="Подтвердить — перенос в граф. Править — поправить поля. Отклонить — пометить rejected, в граф не идёт. Дубль оборудования по имени не создаётся (привяжется к существующему).">?</span>' +
        '</div>';
      }

      return '<div class="' + cardCls + '" data-id="' + escAttr(c.id) + '">' + head + grid + quote + actions + '</div>';
    }).join("");
    elList.innerHTML = html;
    updateBatchbar();
  }

  function updateBatchbar() {
    var n = state.selected.size;
    elSelCount.textContent = "Выбрано: " + n;
    if (n > 0) elBatchbar.classList.add("is-active");
    else elBatchbar.classList.remove("is-active");
  }

  // ===== Действия =====
  function approveOne(id) {
    return apiPost("/api/v2/graph/candidates/" + encodeURIComponent(id) + "/approve", {});
  }
  function rejectOne(id) {
    return apiPost("/api/v2/graph/candidates/" + encodeURIComponent(id) + "/reject", {});
  }

  function doApprove(id) {
    approveOne(id).then(function(res) {
      var parts = [];
      if (res.created && res.created.equipment) parts.push("оборудование");
      parts.push("неисправность");
      if (res.created && res.created.solution) parts.push("решение");
      if (res.created && res.created.object) parts.push("объект");
      toast("Перенесено в граф: " + parts.join(" / "), "success");
      state.selected.delete(id);
      afterChange();
    }).catch(function(err) {
      toast("Не удалось подтвердить: " + err.message, "error");
    });
  }
  function doReject(id) {
    rejectOne(id).then(function() {
      toast("Случай отклонён", "success");
      state.selected.delete(id);
      afterChange();
    }).catch(function(err) {
      toast("Не удалось отклонить: " + err.message, "error");
    });
  }

  function afterChange() {
    // Перезагружаем кандидатов текущего запуска и счётчики запусков.
    loadCandidates();
    apiGet("/api/v2/graph/candidates/runs?limit=200").then(function(d) {
      state.runs = d.items || [];
      renderRuns();
    }).catch(function() {});
  }

  function batchApprove() {
    var ids = Array.from(state.selected);
    if (!ids.length) return;
    if (!window.confirm("Подтвердить " + ids.length + " случаев и перенести в граф?")) return;
    apiPost("/api/v2/graph/candidates/approve", { ids: ids }).then(function(res) {
      var ok = (res.approved || []).length;
      var fail = (res.failed || []).length;
      toast("Подтверждено: " + ok + (fail ? (", с ошибкой: " + fail) : ""), fail ? "error" : "success");
      state.selected = new Set();
      afterChange();
    }).catch(function(err) {
      toast("Не удалось подтвердить пачку: " + err.message, "error");
    });
  }
  function batchReject() {
    var ids = Array.from(state.selected);
    if (!ids.length) return;
    if (!window.confirm("Отклонить " + ids.length + " случаев?")) return;
    apiPost("/api/v2/graph/candidates/reject", { ids: ids }).then(function(res) {
      var ok = (res.rejected || []).length;
      toast("Отклонено: " + ok, "success");
      state.selected = new Set();
      afterChange();
    }).catch(function(err) {
      toast("Не удалось отклонить пачку: " + err.message, "error");
    });
  }

  // ===== Правка =====
  function findCandidate(id) {
    for (var i = 0; i < state.candidates.length; i++) {
      if (state.candidates[i].id === id) return state.candidates[i];
    }
    return null;
  }

  function openEditModal(id) {
    var c = findCandidate(id);
    if (!c) return;
    var cp = c.casePayload || {};
    var eq = cp.equipment || {};
    var fa = cp.fault || {};
    var so = cp.solution || {};
    var confVal = (c.confidence === null || c.confidence === undefined) ? "" : String(c.confidence);
    var html = '<h3 class="graph-modal__title">✏️ Править случай</h3>' +
      '<div class="graph-modal__row"><label class="graph-modal__label">Оборудование <span style="color:var(--danger);">*</span></label>' +
        '<input class="graph-modal__input" id="edEquip" value="' + escAttr(eq.name || "") + '"/></div>' +
      '<div class="graph-modal__row"><label class="graph-modal__label">Модель</label>' +
        '<input class="graph-modal__input" id="edModel" value="' + escAttr(eq.model || "") + '"/></div>' +
      '<div class="graph-modal__row"><label class="graph-modal__label">Место</label>' +
        '<input class="graph-modal__input" id="edLocation" value="' + escAttr(eq.location || "") + '"/></div>' +
      '<div class="graph-modal__row"><label class="graph-modal__label">Объект / площадка</label>' +
        '<input class="graph-modal__input" id="edObject" value="' + escAttr(cp.object || "") + '"/></div>' +
      '<div class="graph-modal__row"><label class="graph-modal__label">Что произошло <span style="color:var(--danger);">*</span></label>' +
        '<textarea class="graph-modal__textarea" id="edFault">' + escHtml(fa.text || "") + '</textarea></div>' +
      '<div class="graph-modal__row"><label class="graph-modal__label">Дата неисправности (YYYY-MM-DD)</label>' +
        '<input class="graph-modal__input" id="edFaultDate" placeholder="2026-05-10" value="' + escAttr(fa.date || "") + '"/></div>' +
      '<div class="graph-modal__row"><label class="graph-modal__label">Что сделали</label>' +
        '<textarea class="graph-modal__textarea" id="edSolution">' + escHtml(so.text || "") + '</textarea></div>' +
      '<div class="graph-modal__row"><label class="graph-modal__label">Дата решения (YYYY-MM-DD)</label>' +
        '<input class="graph-modal__input" id="edSolutionDate" placeholder="2026-05-12" value="' + escAttr(so.date || "") + '"/></div>' +
      '<div class="graph-modal__row"><label class="graph-modal__label">Уверенность (0..1)</label>' +
        '<input class="graph-modal__input" type="number" min="0" max="1" step="0.05" id="edConf" value="' + escAttr(confVal) + '"/></div>' +
      '<div class="graph-modal__error" id="edError" style="display:none;"></div>' +
      '<div class="graph-modal__actions">' +
        '<button class="graph-btn" id="edCancel">Отмена</button>' +
        '<button class="graph-btn graph-btn--primary" id="edSave">Сохранить</button>' +
      '</div>';
    openModal(html, { onMount: function() {
      document.getElementById("edCancel").addEventListener("click", closeModal);
      document.getElementById("edSave").addEventListener("click", function() { submitEdit(id); });
    }});
  }

  function submitEdit(id) {
    var errEl = document.getElementById("edError");
    errEl.style.display = "none";
    var name = document.getElementById("edEquip").value.trim();
    var faultText = document.getElementById("edFault").value.trim();
    if (!name) { showModalError(errEl, "Укажите оборудование"); return; }
    if (!faultText) { showModalError(errEl, "Заполните «Что произошло»"); return; }
    var confRaw = document.getElementById("edConf").value.trim();
    var confidence = confRaw === "" ? null : Number(confRaw);
    if (confidence !== null && (isNaN(confidence) || confidence < 0 || confidence > 1)) {
      showModalError(errEl, "Уверенность должна быть числом от 0 до 1"); return;
    }
    var casePayload = {
      equipment: {
        name: name,
        model: document.getElementById("edModel").value.trim() || null,
        location: document.getElementById("edLocation").value.trim() || null,
      },
      fault: {
        text: faultText,
        date: document.getElementById("edFaultDate").value.trim() || null,
      },
      solution: {
        text: document.getElementById("edSolution").value.trim() || null,
        date: document.getElementById("edSolutionDate").value.trim() || null,
      },
      object: document.getElementById("edObject").value.trim() || null,
    };
    var c = findCandidate(id);
    if (c && c.casePayload && c.casePayload.source_quote) {
      casePayload.source_quote = c.casePayload.source_quote;
    }
    var body = { casePayload: casePayload };
    if (confidence !== null) body.confidence = confidence;
    apiPatch("/api/v2/graph/candidates/" + encodeURIComponent(id), body).then(function() {
      toast("Кандидат сохранён", "success");
      closeModal();
      loadCandidates();
    }).catch(function(err) {
      showModalError(errEl, err.message);
    });
  }

  // ===== События =====
  elList.addEventListener("click", function(e) {
    var btn = e.target.closest("[data-act]");
    if (!btn) return;
    var act = btn.getAttribute("data-act");
    var id = btn.getAttribute("data-id");
    if (act === "sel") {
      if (btn.checked) state.selected.add(id); else state.selected.delete(id);
      updateBatchbar();
      return;
    }
    if (act === "approve") { doApprove(id); return; }
    if (act === "reject") { doReject(id); return; }
    if (act === "edit") { openEditModal(id); return; }
  });

  elRuns.addEventListener("click", function(e) {
    var run = e.target.closest("[data-job]");
    if (!run) return;
    selectRun(run.getAttribute("data-job"));
  });

  elFilter.addEventListener("change", function() {
    state.filter = elFilter.value;
    state.selected = new Set();
    loadCandidates();
  });
  document.getElementById("btnRefreshRuns").addEventListener("click", function() { loadRuns(); });
  document.getElementById("btnBatchApprove").addEventListener("click", batchApprove);
  document.getElementById("btnBatchReject").addEventListener("click", batchReject);

  // ===== Init =====
  function getQueryParam(name) {
    var m = new RegExp("[?&]" + name + "=([^&]+)").exec(window.location.search);
    return m ? decodeURIComponent(m[1]) : null;
  }
  loadRuns(getQueryParam("job"));
})();
  