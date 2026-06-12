import { renderChatPage } from "./uiV2Chat.js";
import { renderKnowledgePage } from "./uiV2Knowledge.js";
import { renderSettingsPage } from "./uiV2Settings.js";
import { renderGraphPage, renderCandidatesPage } from "./uiV2Graph.js";

export const ICONS = {
  messageCircle:
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22l5.9-2Z"/></svg>',
  database:
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg>',
  settings:
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/><circle cx="12" cy="12" r="3"/></svg>',
  send:
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4Z"/></svg>',
  moon:
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>',
  sun:
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m4.93 19.07 1.41-1.41"/><path d="m17.66 6.34 1.41-1.41"/></svg>',
  filter:
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
  plus:
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
  chevronRight:
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
  chevronDown:
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  search:
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-3.5-3.5"/></svg>',
  x:
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  fileText:
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>',
  externalLink:
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',
  trash:
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  arrowLeft:
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>',
  upload:
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
  folder:
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  tag:
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
  edit:
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>',
  moreHorizontal:
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>',
  refresh:
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>',
  check:
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  alertCircle:
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  chevronLeft:
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  panelLeft:
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>',
  share2:
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
};

const NAV_ITEMS = [
  { key: "chat", href: "/ui/v2/chat", label: "Чат", icon: ICONS.messageCircle },
  {
    key: "knowledge",
    href: "/ui/v2/knowledge",
    label: "База знаний",
    icon: ICONS.database,
  },
  { key: "graph", href: "/ui/v2/graph", label: "Граф знаний", icon: ICONS.share2 },
  { key: "settings", href: "/ui/v2/settings", label: "Настройки", icon: ICONS.settings },
];


function renderThemeBootstrapScript(themeDefault = "dark") {
  const safeDefault = ["dark", "light", "system"].includes(themeDefault) ? themeDefault : "dark";
  return `
    (function () {
      try {
        var stored = localStorage.getItem("localrag.theme");
        if (stored === "light" || stored === "dark") {
          document.documentElement.setAttribute("data-theme", stored);
          return;
        }
        var serverDefault = "${safeDefault}";
        if (serverDefault === "system" && window.matchMedia) {
          var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
        } else {
          document.documentElement.setAttribute("data-theme", serverDefault === "light" ? "light" : "dark");
        }
      } catch (err) {
        document.documentElement.setAttribute("data-theme", "dark");
      }
    })();
  `;
}


function renderIconSidebar({ activeNav }) {
  const linksHtml = NAV_ITEMS.map((item) => {
    const isActive = item.key === activeNav;
    const cls = `nav-icons__link${isActive ? " nav-icons__link--active" : ""}`;
    return `<a class="${cls}" href="${item.href}" title="${escapeAttr(item.label)}" aria-label="${escapeAttr(item.label)}">${item.icon}</a>`;
  }).join("");

  return `
    <aside class="sidebar-icon" aria-label="Главная навигация">
      <a class="brand-mark" href="/ui/v2/chat" title="LOCAL-RAG" aria-label="LOCAL-RAG">LR</a>
      <nav class="nav-icons" aria-label="Разделы">${linksHtml}</nav>
      <button type="button" class="nav-icons__link sidebar-icon__toggle" id="contextSidebarToggle" title="Свернуть/развернуть боковую панель" aria-label="Свернуть/развернуть боковую панель">
        <span class="icon-chevron-left">${ICONS.chevronLeft}</span>
        <span class="icon-chevron-right">${ICONS.chevronRight}</span>
      </button>
      <div class="sidebar-icon__footer">
        <button type="button" class="theme-toggle nav-icons__link" data-action="toggle-theme" title="Переключить тему" aria-label="Переключить тему">
          <span class="icon-sun">${ICONS.sun}</span>
          <span class="icon-moon">${ICONS.moon}</span>
        </button>
        <a class="nav-icons__link" href="/ui/consult?admin=1" title="Старый интерфейс (админ-режим, 1 час)" aria-label="Старый интерфейс">${ICONS.arrowLeft}</a>
      </div>
    </aside>
  `;
}

function renderContextSidebar({ activeNav, contextSidebar = "" }) {
  return `<aside class="sidebar-context" aria-label="Контекстная панель">
    <div class="sidebar-context__inner">${contextSidebar}</div>
    <div class="sidebar-context__resizer" id="contextSidebarResizer" role="separator" aria-orientation="vertical" aria-label="Изменить ширину боковой панели"></div>
  </aside>`;
}

function renderHeader({ pageTitle, headerExtra = "", headerTabs = "" }) {
  return `
    <header class="page-header">
      <h1 class="page-header__title">${pageTitle}</h1>
      ${headerTabs ? `<div class="page-header__tabs">${headerTabs}</div>` : ""}
      <div class="page-header__actions">
        ${headerExtra}
      </div>
    </header>
  `;
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderLayout({
  activeNav,
  pageTitle,
  pageDocumentTitle,
  content,
  headerExtra = "",
  headerTabs = "",
  sidebarExtra = "",
  contextSidebar = "",
  bodyClass = "",
  pageScript = "",
  stylesheets = [],
  scripts = [],
  themeDefault = "dark",
}) {
  const documentTitle = pageDocumentTitle || `${pageTitle} — LOCAL-RAG`;
  const finalContextSidebar = contextSidebar || sidebarExtra || "";
  // CSS/JS вынесены в статические файлы (src/assets/uiV2, маршрут
  // /ui/assets/* в uiAssets.js): HTML страниц похудел в разы, браузер
  // кэширует общие файлы между страницами.
  const stylesheetLinks = stylesheets
    .map((href) => `  <link rel="stylesheet" href="${escapeAttr(href)}">`)
    .join("\n");
  const scriptTags = scripts
    .map((src) => `  <script src="${escapeAttr(src)}"></script>`)
    .join("\n");

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeAttr(documentTitle)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <!-- Неблокирующая загрузка шрифтов: офлайн страница рендерится сразу на системных шрифтах. -->
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"></noscript>
  <link rel="stylesheet" href="/ui/assets/uiV2/layout.css">
${stylesheetLinks}
  <script>${renderThemeBootstrapScript(themeDefault)}</script>
</head>
<body class="${escapeAttr(bodyClass)}">
  <div class="app-shell">
    ${renderIconSidebar({ activeNav })}
    ${renderContextSidebar({ activeNav, contextSidebar: finalContextSidebar })}
    <div class="main">
      ${renderHeader({ pageTitle, headerExtra, headerTabs })}
      ${content}
    </div>
  </div>
  <script src="/ui/assets/uiV2/common.js"></script>
  ${pageScript ? `<script>${pageScript}</script>` : ""}
${scriptTags}
</body>
</html>`;
}

function renderPlaceholderPage({ activeNav, pageTitle, heading, body }) {
  const content = `
    <main class="placeholder">
      <div class="placeholder__card">
        <h2>${heading}</h2>
        <p>${body}</p>
      </div>
    </main>
  `;
  return renderLayout({ activeNav, pageTitle, content });
}

async function resolveThemeDefault(app, request) {
  if (!app.appSettingsService) return "dark";
  try {
    const theme = await app.appSettingsService.getTheme();
    return theme.defaultTheme;
  } catch (error) {
    request.log.warn({ err: error }, "Не удалось получить дефолтную тему");
    return "dark";
  }
}

export async function uiV2Routes(app) {
  app.get("/ui/v2", async (_request, reply) => {
    reply.redirect("/ui/v2/chat", 302);
  });

  app.get("/ui/v2/chat", async (request, reply) => {
    reply.type("text/html; charset=utf-8");
    const themeDefault = await resolveThemeDefault(app, request);
    return renderChatPage({
      ICONS,
      renderLayout: (opts) => renderLayout({ ...opts, themeDefault }),
    });
  });

  app.get("/ui/v2/knowledge", async (request, reply) => {
    reply.type("text/html; charset=utf-8");
    const themeDefault = await resolveThemeDefault(app, request);
    return renderKnowledgePage({
      ICONS,
      renderLayout: (opts) => renderLayout({ ...opts, themeDefault }),
    });
  });

  app.get("/ui/v2/settings", async (request, reply) => {
    reply.type("text/html; charset=utf-8");
    const themeDefault = await resolveThemeDefault(app, request);
    return renderSettingsPage({
      ICONS,
      renderLayout: (opts) => renderLayout({ ...opts, themeDefault }),
    });
  });

  app.get("/ui/v2/graph", async (request, reply) => {
    reply.type("text/html; charset=utf-8");
    const themeDefault = await resolveThemeDefault(app, request);
    let stats = { totalActiveNodes: 0, totalEdges: 0 };
    try {
      stats = await app.graphService.getStats();
    } catch (err) {
      request.log.warn({ err }, "Не удалось получить stats для /ui/v2/graph");
    }
    return renderGraphPage({
      ICONS,
      renderLayout: (opts) => renderLayout({ ...opts, themeDefault }),
      stats,
    });
  });

  app.get("/ui/v2/graph/candidates", async (request, reply) => {
    reply.type("text/html; charset=utf-8");
    const themeDefault = await resolveThemeDefault(app, request);
    return renderCandidatesPage({
      ICONS,
      renderLayout: (opts) => renderLayout({ ...opts, themeDefault }),
    });
  });
}
