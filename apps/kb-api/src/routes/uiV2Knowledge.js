

export function renderKnowledgePage({ ICONS, renderLayout }) {
  const headerExtra = `
    <div class="kb-summary" id="kbSummary"><span>База знаний загружается…</span></div>
  `;

  const headerTabs = `
    <nav class="kb-tabs" id="kbTabs" role="tablist" aria-label="Разделы базы знаний">
      <button type="button" class="header-tab is-active" data-kb-tab="upload" role="tab">${ICONS.upload}<span>Загрузка</span></button>
      <button type="button" class="header-tab" data-kb-tab="jobs" role="tab">${ICONS.refresh}<span>Задачи импорта</span></button>
      <button type="button" class="header-tab" data-kb-tab="documents" role="tab">${ICONS.fileText}<span>Документы</span></button>
      <button type="button" class="header-tab" data-kb-tab="tags" role="tab">${ICONS.tag}<span>Теги</span></button>
    </nav>
  `;

  const contextSidebar = `
    <div class="sidebar-context__title">Разделы</div>
    <button type="button" class="btn btn--accent" id="kbTreeNewBtn">${ICONS.plus}<span>Раздел</span></button>
    <div class="kb-tree__body" id="kbTree" style="flex:1;min-height:0;overflow-y:auto;">
      <div class="skeleton-list" role="status" aria-label="Дерево загружается"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>
    </div>
    <div class="sidebar-context__footer">
      <a href="/ui/nodes" target="_blank" rel="noopener">Расширенный редактор →</a>
    </div>
  `;

  const content = `
    <main class="kb-page" id="kbPage">
      <section class="kb-main">
        <div class="kb-tab-panel is-active" data-kb-panel="upload">
        <div class="kb-card" id="kbUploadCard">
          <div class="kb-card__head">
            <div class="kb-card__title">${ICONS.upload}<span>Загрузка</span></div>
          </div>
          <div class="kb-card__body">
            <div class="kb-dropzone" id="kbDropzone">
              <h3>Перетащите файлы или папку</h3>
              <p>PDF, DOCX, XLSX, TXT, MD, CSV — или укажите путь к локальной папке на сервере ниже.</p>
              <div class="kb-dropzone__buttons">
                <label class="btn">${ICONS.fileText}<span>Выбрать файлы</span>
                  <input type="file" id="kbFileInput" multiple />
                </label>
                <label class="btn">${ICONS.folder}<span>Выбрать папку</span>
                  <input type="file" id="kbFolderInput" webkitdirectory directory multiple />
                </label>
              </div>
              <p class="kb-dropzone__hint">Очень большие папки загружайте через серверный путь — это быстрее и не упирается в лимит multipart.</p>
            </div>

            <div class="kb-upload-fields">
              <div>
                <label for="kbServerPath">Путь к локальной папке на сервере (внутри data/raw)</label>
                <input class="kb-input" type="text" id="kbServerPath" placeholder="Например: КС новая/Документация metsoDNA CR" />
              </div>
              <div>
                <label for="kbNodeSelect">Целевой раздел</label>
                <select class="kb-select" id="kbNodeSelect"></select>
              </div>
              <div>
                <button type="button" class="btn btn--accent" id="kbServerImportBtn">${ICONS.upload}<span>Импортировать</span></button>
              </div>
            </div>
          </div>
        </div>
        </div>

        <div class="kb-tab-panel" data-kb-panel="jobs">
        <div class="kb-card is-collapsed" id="kbJobsCard">
          <div class="kb-card__head">
            <div class="kb-card__title">${ICONS.refresh}<span>Задачи импорта</span></div>
            <div style="display:flex;gap:6px;align-items:center;">
              <button type="button" class="btn btn--ghost btn--icon" id="kbJobsRefresh" aria-label="Обновить">${ICONS.refresh}</button>
              <button type="button" class="btn btn--ghost" id="kbJobsToggle">Свернуть/развернуть</button>
            </div>
          </div>
          <div class="kb-card__collapsed-row" id="kbJobsCollapsed"><span>Активных задач нет</span><span></span></div>
          <div class="kb-card__body">
            <div class="kb-jobs-list" id="kbJobsList"></div>
          </div>
        </div>
        </div>

        <div class="kb-tab-panel" data-kb-panel="documents">
        <div class="kb-card">
          <div class="kb-card__head">
            <div class="kb-card__title">${ICONS.fileText}<span>Документы</span></div>
            <button type="button" class="btn btn--accent" id="kbAddDocBtn">${ICONS.plus}<span>Добавить документ</span></button>
          </div>
          <div class="kb-card__body">
            <div class="kb-doc-toolbar">
              <div class="document-search">
                <span class="document-search__icon">${ICONS.search}</span>
                <input class="document-search__input" type="search" id="kbDocSearch" placeholder="Поиск по названию документа" />
              </div>
              <button type="button" class="btn" id="kbDocToggleScope">Включая вложенные</button>
              <div class="kb-doc-toolbar__bulk" id="kbDocBulk">
                <span><span class="mono" id="kbDocBulkCount">0</span> выбрано</span>
                <button type="button" class="btn" id="kbDocBulkMove">Переместить</button>
                <button type="button" class="btn btn--danger" id="kbDocBulkDelete">Удалить выбранные</button>
              </div>
            </div>
            <div style="overflow-x:auto;">
              <table class="kb-doc-table">
                <thead>
                  <tr>
                    <th style="width:32px"><input type="checkbox" id="kbDocSelectAll" style="accent-color:var(--accent)" /></th>
                    <th>Имя</th>
                    <th style="width:80px">Страниц</th>
                    <th style="width:80px">Чанки</th>
                    <th style="width:160px">Раздел</th>
                    <th style="width:220px">Теги</th>
                    <th style="width:110px">Загружен</th>
                    <th style="width:140px;text-align:right">Действия</th>
                  </tr>
                </thead>
                <tbody id="kbDocBody">
                  <tr><td colspan="8"><div class="kb-doc-empty">Документы загружаются…</div></td></tr>
                </tbody>
              </table>
            </div>
            <div class="kb-show-more" id="kbDocShowMore" style="display:none">
              <button type="button" class="btn">Показать ещё 50</button>
            </div>
          </div>
        </div>
        </div>

        <div class="kb-tab-panel" data-kb-panel="tags">
          <div class="kb-card">
            <div class="kb-card__head">
              <div class="kb-card__title">${ICONS.tag}<span>Глобальное управление тегами</span></div>
              <span class="settings-hint">Тут можно переименовать или удалить теги во всех документах сразу</span>
            </div>
            <div class="kb-card__body">
              <p class="kb-tags-intro">
                Добавлять новые теги — только через редактор тегов конкретного
                документа. Здесь можно массово переименовывать (объединять при
                совпадении) и удалять устаревшие теги во всех документах сразу.
              </p>
              <div class="kb-doc-toolbar">
                <div class="document-search">
                  <span class="document-search__icon">${ICONS.search}</span>
                  <input class="document-search__input" type="search" id="kbTagsSearch" placeholder="Поиск тега" />
                </div>
                <span class="settings-hint" id="kbTagsCount"></span>
              </div>
              <div style="overflow-x:auto;">
                <table class="kb-doc-table kb-tags-table">
                  <thead>
                    <tr>
                      <th data-tag-sort="name">Тег</th>
                      <th data-tag-sort="count" style="width:140px">Документов</th>
                      <th style="width:220px;text-align:right">Действия</th>
                    </tr>
                  </thead>
                  <tbody id="kbTagsBody">
                    <tr><td colspan="3"><div class="kb-doc-empty">Список тегов загружается…</div></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="kb-modal-backdrop" id="kbModalBackdrop">
        <div class="kb-modal" role="dialog" aria-modal="true">
          <div class="kb-modal__head">
            <div class="kb-modal__title" id="kbModalTitle">Окно</div>
            <button type="button" class="btn btn--ghost btn--icon" data-action="close-modal" aria-label="Закрыть" onclick="document.getElementById('kbModalBackdrop').classList.remove('is-open')">${ICONS.x}</button>
          </div>
          <div class="kb-modal__body" id="kbModalBody"></div>
          <div class="kb-modal__foot" id="kbModalFoot"></div>
        </div>
      </div>
    </main>
  `;

  const initialState = {
    icons: {
      chevronRight: ICONS.chevronRight,
      chevronDown: ICONS.chevronDown,
      moreHorizontal: ICONS.moreHorizontal,
      externalLink: ICONS.externalLink,
      folder: ICONS.folder,
      tag: ICONS.tag,
      trash: ICONS.trash,
      edit: ICONS.edit,
      refresh: ICONS.refresh,
      graph:
        '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
      extract:
        '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/><path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z"/></svg>',
    },
  };

  const initialStateJson = JSON.stringify(initialState).replace(/</g, "\\u003c");

  return renderLayout({
    activeNav: "knowledge",
    pageTitle: "База знаний",
    pageDocumentTitle: "База знаний — LOCAL-RAG",
    content,
    headerExtra,
    headerTabs,
    contextSidebar,
    // CSS/JS страницы — статические файлы (src/assets/uiV2).
    pageScript: `window.__UIV2_STATE__ = ${initialStateJson};`,
    stylesheets: ["/ui/assets/uiV2/knowledge.css"],
    scripts: ["/ui/assets/uiV2/knowledge.js"],
    bodyClass: "page-knowledge",
  });
}
