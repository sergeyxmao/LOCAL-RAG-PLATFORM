import { renderChatPage } from "./uiV2Chat.js";
import { renderKnowledgePage } from "./uiV2Knowledge.js";
import { renderSettingsPage } from "./uiV2Settings.js";

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
};

const NAV_ITEMS = [
  { key: "chat", href: "/ui/v2/chat", label: "Чат", icon: ICONS.messageCircle },
  {
    key: "knowledge",
    href: "/ui/v2/knowledge",
    label: "База знаний",
    icon: ICONS.database,
  },
  { key: "settings", href: "/ui/v2/settings", label: "Настройки", icon: ICONS.settings },
];

function renderLayoutCss() {
  return `
    *, *::before, *::after { box-sizing: border-box; }
    html { color-scheme: light dark; }
    html[data-theme="dark"] {
      --bg: #0B1220;
      --surface: #131A2A;
      --surface-2: #1A2236;
      --surface-hover: #1F2942;
      --text: #E5E7EB;
      --text-muted: #94A3B8;
      --text-strong: #F8FAFC;
      --accent: #3B82F6;
      --accent-hover: #2563EB;
      --accent-soft: rgba(59, 130, 246, 0.15);
      --success: #10B981;
      --danger: #EF4444;
      --border: rgba(255, 255, 255, 0.08);
      --border-strong: rgba(255, 255, 255, 0.16);
      --shadow: 0 8px 28px rgba(0, 0, 0, 0.4);
      --scroll-thumb: rgba(255, 255, 255, 0.18);
      color-scheme: dark;
    }
    html[data-theme="light"] {
      --bg: #FAFAFA;
      --surface: #FFFFFF;
      --surface-2: #F1F5F9;
      --surface-hover: #E2E8F0;
      --text: #0F172A;
      --text-muted: #475569;
      --text-strong: #020617;
      --accent: #2563EB;
      --accent-hover: #1D4ED8;
      --accent-soft: rgba(37, 99, 235, 0.10);
      --success: #047857;
      --danger: #B91C1C;
      --border: rgba(0, 0, 0, 0.08);
      --border-strong: rgba(0, 0, 0, 0.16);
      --shadow: 0 8px 28px rgba(15, 23, 42, 0.08);
      --scroll-thumb: rgba(15, 23, 42, 0.18);
      color-scheme: light;
    }
    body {
      margin: 0;
      font-family: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: var(--text);
      background: var(--bg);
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }
    code, kbd, samp, .mono, .tag, .id {
      font-family: "JetBrains Mono", ui-monospace, "Consolas", monospace;
      font-size: 0.92em;
    }
    a { color: inherit; text-decoration: none; }
    button { font-family: inherit; cursor: pointer; }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-thumb { background: var(--scroll-thumb); border-radius: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }

    :root {
      --context-sidebar-width: 240px;
    }
    .app-shell {
      display: grid;
      grid-template-columns: 64px var(--context-sidebar-width) 1fr;
      min-height: 100vh;
      transition: grid-template-columns 200ms ease;
    }
    .app-shell.is-resizing {
      transition: none;
      cursor: col-resize;
      user-select: none;
    }
    .app-shell.is-context-collapsed {
      grid-template-columns: 64px 0 1fr;
    }
    .sidebar-icon {
      background: var(--surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 0;
      gap: 6px;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
    }
    .sidebar-context {
      background: var(--surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      padding: 14px 12px;
      gap: 12px;
      position: sticky;
      top: 0;
      height: 100vh;
      min-width: 0;
    }
    .app-shell.is-context-collapsed .sidebar-context {
      padding: 0;
      border-right: none;
      width: 0;
      overflow: hidden;
      visibility: hidden;
    }
    .sidebar-context__inner {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow: hidden;
    }
    .sidebar-context__resizer {
      position: absolute;
      top: 0;
      bottom: 0;
      right: -3px;
      width: 6px;
      cursor: col-resize;
      z-index: 8;
      background: transparent;
      transition: background 0.12s ease;
    }
    .sidebar-context__resizer:hover,
    .app-shell.is-resizing .sidebar-context__resizer {
      background: var(--accent-soft);
    }
    .app-shell.is-context-collapsed .sidebar-context__resizer { display: none; }
    .sidebar-icon__toggle .icon-chevron-right { display: none; }
    .app-shell.is-context-collapsed .sidebar-icon__toggle .icon-chevron-left { display: none; }
    .app-shell.is-context-collapsed .sidebar-icon__toggle .icon-chevron-right { display: inline-flex; }
    .sidebar-context__title {
      font-size: 11px;
      text-transform: uppercase;
      color: var(--text-muted);
      letter-spacing: 0.06em;
      padding: 4px 6px 0;
    }
    .sidebar-context__hint {
      font-size: 11px;
      color: var(--text-muted);
      padding: 4px 6px;
    }
    .sidebar-context__footer {
      margin-top: auto;
      padding: 8px 6px;
      border-top: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 11px;
      color: var(--text-muted);
    }
    .sidebar-context__footer a { color: var(--text-muted); }
    .sidebar-context__footer a:hover { color: var(--accent); }

    .brand-mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: var(--accent);
      color: white;
      font-family: "JetBrains Mono", monospace;
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .nav-icons {
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: center;
      width: 100%;
    }
    .nav-icons__link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      color: var(--text-muted);
      transition: background 0.12s ease, color 0.12s ease;
    }
    .nav-icons__link:hover { background: var(--surface-2); color: var(--text); }
    .nav-icons__link--active {
      background: var(--accent-soft);
      color: var(--accent);
    }
    .sidebar-icon__footer {
      margin-top: auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 6px 0;
      border-top: 1px solid var(--border);
      width: 100%;
    }
    .sidebar-icon__footer .theme-toggle,
    .sidebar-icon__footer .nav-icons__link {
      width: 38px;
      height: 38px;
      border-radius: 10px;
    }

    @media (max-width: 1100px) {
      .sidebar-context { padding: 12px 8px; }
    }
    @media (max-width: 900px) {
      .app-shell { grid-template-columns: 64px 0 1fr; }
      .sidebar-context { display: none; }
      .sidebar-context__resizer { display: none; }
    }
    .nav__group-title {
      font-size: 11px;
      text-transform: uppercase;
      color: var(--text-muted);
      letter-spacing: 0.06em;
      padding: 8px 12px 4px;
    }
    .sidebar__history {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .sidebar__history-list {
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 0 2px;
    }
    .sidebar__history-group-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      padding: 14px 10px 4px;
    }
    .sidebar__history-group-title:first-child { padding-top: 4px; }
    .sidebar__history-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      padding: 8px 10px;
      border-radius: 6px;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 13px;
      transition: background 0.12s ease, color 0.12s ease;
    }
    .sidebar__history-item:hover { background: var(--surface-2); color: var(--text); }
    .sidebar__history-item.is-active {
      background: var(--accent-soft);
      color: var(--accent);
    }
    .sidebar__history-title {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .sidebar__history-date {
      font-family: "JetBrains Mono", monospace;
      font-size: 10px;
      color: var(--text-muted);
      flex: 0 0 auto;
      opacity: 0.85;
    }
    .sidebar__history-item.is-active .sidebar__history-date { color: var(--accent); }
    .sidebar__history-delete {
      background: none;
      border: none;
      color: inherit;
      opacity: 0;
      padding: 4px;
      border-radius: 4px;
      display: inline-flex;
      transition: opacity 0.12s ease, background 0.12s ease;
    }
    .sidebar__history-item:hover .sidebar__history-delete { opacity: 0.7; }
    .sidebar__history-delete:hover { opacity: 1; background: var(--surface-hover); }
    .sidebar__empty {
      padding: 10px 12px;
      color: var(--text-muted);
      font-size: 12px;
    }

    .main {
      display: flex;
      flex-direction: column;
      min-width: 0;
      min-height: 100vh;
    }
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 24px;
      border-bottom: 1px solid var(--border);
      background: var(--surface);
      position: sticky;
      top: 0;
      z-index: 5;
    }
    .page-header {
      flex-wrap: wrap;
      row-gap: 8px;
    }
    .page-header__title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-strong);
      margin: 0;
      flex: 0 0 auto;
    }
    .page-header__tabs {
      display: flex;
      gap: 4px;
      flex: 1 1 auto;
      min-width: 0;
      overflow-x: auto;
      align-items: stretch;
      align-self: stretch;
      margin-bottom: -14px;
      padding-bottom: 0;
    }
    .page-header__tabs .header-tab {
      border: none;
      background: transparent;
      color: var(--text-muted);
      padding: 0 14px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .page-header__tabs .header-tab:hover { color: var(--text); }
    .page-header__tabs .header-tab.is-active {
      color: var(--accent);
      border-bottom-color: var(--accent);
    }
    .page-header__actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--surface-2);
      color: var(--text);
      font-size: 13px;
      transition: background 0.12s ease, border-color 0.12s ease;
    }
    .btn:hover { background: var(--surface-hover); border-color: var(--border-strong); }
    .btn--icon { padding: 8px; }
    .btn--accent {
      background: var(--accent);
      color: white;
      border-color: var(--accent);
    }
    .btn--accent:hover { background: var(--accent-hover); border-color: var(--accent-hover); }
    .btn--ghost {
      background: transparent;
      border-color: transparent;
      color: var(--text-muted);
    }
    .btn--ghost:hover { background: var(--surface-2); color: var(--text); }
    .btn--danger {
      background: transparent;
      border-color: var(--border);
      color: var(--danger);
    }
    .btn--danger:hover { background: var(--surface-2); }
    .btn[disabled] { opacity: 0.55; cursor: not-allowed; }

    .placeholder {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
    }
    .placeholder__card {
      max-width: 520px;
      padding: 32px;
      border-radius: 12px;
      background: var(--surface);
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
      text-align: center;
    }
    .placeholder__card h2 { margin-top: 0; color: var(--text-strong); }
    .placeholder__card p { color: var(--text-muted); margin-bottom: 0; }

    .theme-toggle {
      width: 36px;
      height: 36px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--surface-2);
      color: var(--text);
      transition: background 0.12s ease;
    }
    .theme-toggle:hover { background: var(--surface-hover); }
    html[data-theme="light"] .theme-toggle .icon-moon { display: none; }
    html[data-theme="dark"] .theme-toggle .icon-sun { display: none; }

  `;
}

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

function renderCommonScript() {
  return `
    (function () {
      function applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        try { localStorage.setItem("localrag.theme", theme); } catch (err) {}
      }
      window.LocalRagTheme = {
        get current() {
          return document.documentElement.getAttribute("data-theme") || "dark";
        },
        toggle() {
          var next = this.current === "dark" ? "light" : "dark";
          applyTheme(next);
          return next;
        },
        set(theme) { applyTheme(theme); },
      };
      document.addEventListener("click", function (event) {
        var trigger = event.target.closest && event.target.closest("[data-action='toggle-theme']");
        if (!trigger) return;
        window.LocalRagTheme.toggle();
      });

      // Context sidebar: resize + collapse
      var MIN_WIDTH = 180;
      var MAX_WIDTH = 480;
      var DEFAULT_WIDTH = 240;
      var STORAGE_WIDTH = "localrag.sidebar.width";
      var STORAGE_COLLAPSED = "localrag.sidebar.collapsed";
      var shell = document.querySelector(".app-shell");
      var resizer = document.getElementById("contextSidebarResizer");
      var toggleBtn = document.getElementById("contextSidebarToggle");

      function readStoredWidth() {
        try {
          var raw = localStorage.getItem(STORAGE_WIDTH);
          if (!raw) return DEFAULT_WIDTH;
          var n = Number(raw);
          if (!Number.isFinite(n)) return DEFAULT_WIDTH;
          return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Math.round(n)));
        } catch (err) { return DEFAULT_WIDTH; }
      }
      function writeStoredWidth(width) {
        try { localStorage.setItem(STORAGE_WIDTH, String(width)); } catch (err) {}
      }
      function readStoredCollapsed() {
        try { return localStorage.getItem(STORAGE_COLLAPSED) === "true"; } catch (err) { return false; }
      }
      function writeStoredCollapsed(value) {
        try { localStorage.setItem(STORAGE_COLLAPSED, value ? "true" : "false"); } catch (err) {}
      }
      function applyWidth(width) {
        document.documentElement.style.setProperty("--context-sidebar-width", width + "px");
      }
      function applyCollapsed(collapsed) {
        if (!shell) return;
        shell.classList.toggle("is-context-collapsed", collapsed === true);
      }

      applyWidth(readStoredWidth());
      applyCollapsed(readStoredCollapsed());

      if (resizer && shell) {
        var dragStartX = 0;
        var dragStartWidth = 0;
        function onMouseMove(event) {
          var delta = event.clientX - dragStartX;
          var next = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, dragStartWidth + delta));
          applyWidth(next);
        }
        function onMouseUp() {
          if (!shell.classList.contains("is-resizing")) return;
          shell.classList.remove("is-resizing");
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
          var current = getComputedStyle(document.documentElement).getPropertyValue("--context-sidebar-width");
          var px = parseInt(current, 10);
          if (Number.isFinite(px)) writeStoredWidth(px);
        }
        resizer.addEventListener("mousedown", function (event) {
          if (shell.classList.contains("is-context-collapsed")) return;
          event.preventDefault();
          dragStartX = event.clientX;
          var current = getComputedStyle(document.documentElement).getPropertyValue("--context-sidebar-width");
          var px = parseInt(current, 10);
          dragStartWidth = Number.isFinite(px) ? px : DEFAULT_WIDTH;
          shell.classList.add("is-resizing");
          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
        });
      }

      if (toggleBtn) {
        toggleBtn.addEventListener("click", function () {
          var nowCollapsed = !shell.classList.contains("is-context-collapsed");
          applyCollapsed(nowCollapsed);
          writeStoredCollapsed(nowCollapsed);
        });
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
  themeDefault = "dark",
}) {
  const documentTitle = pageDocumentTitle || `${pageTitle} — LOCAL-RAG`;
  const finalContextSidebar = contextSidebar || sidebarExtra || "";

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeAttr(documentTitle)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
  <style>${renderLayoutCss()}</style>
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
  <script>${renderCommonScript()}</script>
  ${pageScript ? `<script>${pageScript}</script>` : ""}
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
    reply.redirect(302, "/ui/v2/chat");
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
}
