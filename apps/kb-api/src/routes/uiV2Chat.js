// CSS/JS страницы вынесены в src/assets/uiV2/chat.{css,js}, vendor-скрипты
// (marked, dompurify) отдаются маршрутом /ui/assets/vendor/* из node_modules.

export function renderChatPage({ ICONS, renderLayout }) {
  const contextSidebar = `
    <button type="button" class="btn btn--accent" id="newChatBtn">${ICONS.plus}<span>Новый чат</span></button>
    <div class="sidebar-context__title">История</div>
    <div class="sidebar__history">
      <div class="sidebar__history-list" id="historyList">
        <div class="skeleton-list" role="status" aria-label="История загружается"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>
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
            <div class="provider-picker" id="providerPicker">
              <button type="button" class="provider-picker__trigger" id="providerPickerTrigger" aria-haspopup="listbox" aria-expanded="false">
                <span class="provider-picker__icon" aria-hidden="true">🔒</span>
                <span class="provider-picker__label" id="providerPickerLabel">Локально</span>
                <span class="provider-picker__caret" aria-hidden="true">▾</span>
              </button>
              <div class="provider-picker__menu" id="providerPickerMenu" role="listbox" aria-label="Выбор провайдера"></div>
            </div>
          </div>
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
            <div class="node-tree" id="nodeTree"><div class="skeleton-list" role="status" aria-label="Дерево загружается"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div></div>
          </div>
          <div>
            <div class="filters-section__title">Теги</div>
            <div class="tags-filter">
              <div class="tags-filter__selected" id="tagsFilterSelected"></div>
              <div class="document-search">
                <span class="document-search__icon">${ICONS.search}</span>
                <input class="document-search__input" id="tagsFilterInput" type="search" placeholder="Поиск тега" autocomplete="off" />
              </div>
              <div class="tags-filter__suggest" id="tagsFilterSuggest"><div class="filters-empty">Начните вводить или выберите из списка.</div></div>
            </div>
          </div>
          <div class="filters-section filters-section--docs">
            <div class="filters-section__title">
              <span>Документы</span>
              <span class="filters-section__count" id="documentListCount"></span>
            </div>
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
    <div class="chat-modal-backdrop" id="chatModalBackdrop">
      <div class="chat-modal" role="dialog" aria-modal="true">
        <div class="chat-modal__head" id="chatModalTitle">Подтверждение</div>
        <div class="chat-modal__body" id="chatModalBody"></div>
        <div class="chat-modal__foot" id="chatModalFoot"></div>
      </div>
    </div>
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

  const initialStateJson = JSON.stringify(initialState).replace(/</g, "\\u003c");
  return renderLayout({
    activeNav: "chat",
    pageTitle: "Чат",
    pageDocumentTitle: "Чат — LOCAL-RAG",
    content,
    headerExtra,
    contextSidebar,
    // Состояние инлайном до внешних скриптов; CSS/JS страницы — статические
    // файлы (src/assets/uiV2), vendor marked/dompurify — из node_modules.
    pageScript: `window.__UIV2_STATE__ = ${initialStateJson};`,
    stylesheets: ["/ui/assets/uiV2/chat.css"],
    scripts: [
      "/ui/assets/vendor/marked.min.js",
      "/ui/assets/vendor/purify.min.js",
      "/ui/assets/uiV2/chat.js",
    ],
    bodyClass: "page-chat",
  });
}
