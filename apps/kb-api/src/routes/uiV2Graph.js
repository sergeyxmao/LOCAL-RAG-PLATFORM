// Страница "Граф знаний" /ui/v2/graph.
// Двухпанельный layout: слева дерево групп/узлов, справа карточка.
// Поиск, CRUD, vis-network для визуализации соседей.


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
          <button class="graph-btn graph-btn--primary" id="btnRecordCase">📝 Записать случай</button>
          <button class="graph-btn" id="btnCreateNode">+ Создать узел</button>
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
  // Этап 3: ссылка на экран ревью кандидатов LLM-извлечения.
  var candidatesLinkHtml = `
    <a class="graph-btn graph-btn--small" href="/ui/v2/graph/candidates" title="Очередь кандидатов из LLM-извлечения: проверить и перенести в граф">🔬 Кандидаты</a>
  `;
  var headerExtra = searchHtml + statsHtml + candidatesLinkHtml;
  var content = `
    ${renderGraphPageHtml()}
  `;
  // CSS/JS страницы — статические файлы (src/assets/uiV2).
  return renderLayout({
    activeNav: "graph",
    pageTitle: "Граф знаний",
    pageDocumentTitle: "Граф знаний — LOCAL-RAG",
    content,
    headerExtra,
    stylesheets: ["/ui/assets/uiV2/graph.css"],
    scripts: ["/ui/assets/uiV2/graph.js"],
  });
}

// ====================================================================
// Этап 3: экран ревью кандидатов LLM-извлечения («Граф знаний → Кандидаты»)
// Отдельный раздел графа (/ui/v2/graph/candidates). Слева — запуски
// извлечения по документам; справа — карточки случаев целиком (оборудование
// + неисправность + решение + объект + цитата-обоснование + confidence) с
// действиями Подтвердить / Править / Отклонить (поштучно и пачкой).
// Переиспользует дизайн-токены и стили графа (renderGraphPageCss).
// ====================================================================


function renderCandidatesPageHtml() {
  var tipFilter = "«Только на ревью» — непроверенные черновики. «Все» — включая уже подтверждённые (в графе) и отклонённые (для аудита).";
  var tipBatch = "Действие сразу для всех отмеченных галочкой случаев. Подтверждение переносит их в граф, отклонение — помечает rejected (в граф не идут).";
  return `
    <div class="cand-page">
      <div class="graph-pane">
        <div class="graph-pane__header">
          <span>Запуски извлечения</span>
          <button class="graph-btn graph-btn--small" id="btnRefreshRuns" title="Обновить список">↻</button>
        </div>
        <div class="graph-pane__body cand-runs" id="runsContainer">
          <div class="skeleton-list" role="status" aria-label="Запуски загружаются"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>
        </div>
        <div class="graph-pane__footer">
          <a class="graph-btn" href="/ui/v2/graph">← К графу</a>
        </div>
      </div>
      <div class="graph-pane">
        <div class="graph-pane__header">
          <span id="candPaneTitle">Кандидаты</span>
          <span class="cand-toolbar">
            <label class="cand-meta">Показывать:
              <select id="candFilter" class="graph-modal__select cand-select">
                <option value="pending">только на ревью</option>
                <option value="all">все</option>
              </select>
            </label>
            <span class="hint" data-tip="${escapeAttrSafe(tipFilter)}">?</span>
          </span>
        </div>
        <div class="graph-pane__body">
          <div class="cand-batchbar" id="candBatchbar">
            <span id="candSelCount">Выбрано: 0</span>
            <button class="graph-btn graph-btn--primary graph-btn--small" id="btnBatchApprove">Подтвердить выбранные</button>
            <button class="graph-btn graph-btn--small" id="btnBatchReject">Отклонить выбранные</button>
            <span class="hint" data-tip="${escapeAttrSafe(tipBatch)}">?</span>
          </div>
          <div class="cand-list" id="candList">
            <div class="cand-empty">Выберите запуск извлечения в списке слева.</div>
          </div>
        </div>
      </div>
    </div>
    <div id="modalRoot"></div>
    <div id="toastRoot"></div>
  `;
}

// Серверная эскейп-функция для значений в HTML-атрибутах статической разметки.
function escapeAttrSafe(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}


export function renderCandidatesPage({ ICONS, renderLayout }) {
  var content = `
    ${renderCandidatesPageHtml()}
  `;
  // candidates.css включает и стили графа (бывший renderGraphPageCss),
  // и стили экрана кандидатов — как в исходном inline-варианте.
  return renderLayout({
    activeNav: "graph",
    pageTitle: "Граф знаний — Кандидаты",
    pageDocumentTitle: "Кандидаты извлечения — LOCAL-RAG",
    content,
    stylesheets: ["/ui/assets/uiV2/candidates.css"],
    scripts: ["/ui/assets/uiV2/candidates.js"],
  });
}

export default renderGraphPage;
