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
    .settings-tabs {
      display: flex;
      gap: 4px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 8px;
      overflow-x: auto;
      flex-wrap: nowrap;
    }
    .settings-tab {
      border: none;
      background: transparent;
      color: var(--text-muted);
      padding: 10px 14px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .settings-tab:hover { color: var(--text); }
    .settings-tab.is-active {
      color: var(--accent);
      border-bottom-color: var(--accent);
    }
    .settings-tab-panel { display: none; flex-direction: column; gap: 14px; }
    .settings-tab-panel.is-active { display: flex; }
    .settings-field__label-with-help {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .help-tip {
      position: relative;
      display: inline-flex;
      align-items: center;
      cursor: help;
      outline: none;
    }
    .help-tip__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--surface-2);
      color: var(--text-muted);
      font-size: 10px;
      font-weight: 600;
      line-height: 1;
      border: 1px solid var(--border);
    }
    .help-tip:hover .help-tip__icon,
    .help-tip:focus .help-tip__icon {
      background: var(--accent-soft);
      color: var(--accent);
      border-color: var(--accent);
    }
    .help-tip__bubble {
      position: absolute;
      left: 22px;
      right: auto;
      top: -8px;
      width: 240px;
      max-width: calc(100vw - 24px);
      padding: 8px 10px;
      background: var(--surface);
      color: var(--text);
      border: 1px solid var(--border);
      border-radius: 8px;
      box-shadow: var(--shadow);
      font-size: 12px;
      line-height: 1.4;
      z-index: 30;
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-2px);
      transition: opacity 0.12s ease, transform 0.12s ease, visibility 0.12s ease;
    }
    .help-tip--flip .help-tip__bubble {
      left: auto;
      right: 22px;
    }
    .help-tip:hover .help-tip__bubble,
    .help-tip:focus .help-tip__bubble {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
    .diag-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    @media (max-width: 720px) {
      .diag-grid { grid-template-columns: 1fr; }
    }
    .diag-card {
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px 14px;
      background: var(--surface-2);
      display: flex;
      flex-direction: column;
      gap: 4px;
      cursor: pointer;
      transition: background 0.12s ease, border-color 0.12s ease;
    }
    .diag-card:hover { background: var(--surface-hover); }
    .diag-card__head {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .diag-card__dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex: 0 0 auto;
    }
    .diag-card--ok .diag-card__dot { background: var(--success); }
    .diag-card--warning .diag-card__dot { background: #F59E0B; }
    .diag-card--error .diag-card__dot { background: var(--danger); }
    .diag-card--ok { border-color: rgba(16, 185, 129, 0.30); }
    .diag-card--warning { border-color: rgba(245, 158, 11, 0.35); background: rgba(245, 158, 11, 0.06); }
    .diag-card--error { border-color: rgba(239, 68, 68, 0.35); background: rgba(239, 68, 68, 0.06); }
    .diag-card__name {
      font-weight: 600;
      color: var(--text-strong);
      font-size: 13px;
      flex: 1;
      min-width: 0;
    }
    .diag-card__details {
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.4;
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
    .settings-help {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      margin-left: 4px;
      border-radius: 50%;
      border: 1px solid var(--border);
      color: var(--text-muted);
      font-size: 11px;
      font-weight: 600;
      cursor: help;
      vertical-align: middle;
    }
    .settings-help:hover { color: var(--text); border-color: var(--text-muted); }

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

    /* ─── Граф знаний (вкладка) ───────────────────────────────── */
    .graph-subtabs {
      display: inline-flex;
      gap: 4px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 0;
    }
    .graph-subtab {
      border: none;
      background: transparent;
      color: var(--text-muted);
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
    }
    .graph-subtab:hover { color: var(--text); }
    .graph-subtab.is-active { color: var(--accent); border-bottom-color: var(--accent); }
    .graph-subtab-panel { display: none; flex-direction: column; gap: 10px; }
    .graph-subtab-panel.is-active { display: flex; }

    .graph-item-card {
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px 14px;
      background: var(--surface);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .graph-item-card__head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
    }
    .graph-item-card__title {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-strong);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .graph-item-card__desc {
      font-size: 12px;
      color: var(--text-muted);
    }
    .graph-item-card__meta {
      font-size: 11px;
      color: var(--text-muted);
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .graph-item-card__actions {
      display: inline-flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .graph-alias-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .graph-alias-pill {
      font-size: 11px;
      padding: 2px 8px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 999px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .graph-form {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .graph-form__row {
      display: grid;
      grid-template-columns: 180px 1fr;
      gap: 10px;
      align-items: start;
    }
    .graph-form__row > label {
      font-size: 12px;
      color: var(--text-muted);
      padding-top: 6px;
    }
    .graph-form__row > .graph-form__field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .graph-form__hint {
      font-size: 11px;
      color: var(--text-muted);
    }
    .graph-form__error {
      font-size: 12px;
      color: var(--danger);
      background: rgba(239, 68, 68, 0.08);
      border: 1px solid var(--danger);
      border-radius: 6px;
      padding: 6px 10px;
    }
    .graph-form textarea, .graph-form input[type="text"], .graph-form input[type="number"], .graph-form select {
      width: 100%;
      padding: 6px 8px;
      font-size: 13px;
      background: var(--surface-2);
      color: var(--text);
      border: 1px solid var(--border);
      border-radius: 6px;
      font-family: inherit;
    }
    .graph-form textarea.graph-mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px;
    }
    .graph-preview {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 10px 12px;
      font-size: 12px;
      max-height: 320px;
      overflow: auto;
    }
    .graph-preview-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    .graph-preview-table th, .graph-preview-table td {
      padding: 4px 6px;
      border-bottom: 1px solid var(--border);
      text-align: left;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      vertical-align: top;
    }
    .graph-warnings { display:flex; flex-direction:column; gap:4px; margin-top:8px; }
    .graph-warning-item {
      font-size: 12px;
      color: var(--text);
      background: rgba(218, 165, 32, 0.10);
      border-left: 3px solid #d18f00;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .graph-advanced {
      margin-top: 12px;
      padding: 10px 12px;
      border: 1px dashed var(--border);
      border-radius: 8px;
      background: var(--surface-2);
    }
    .graph-advanced > summary {
      cursor: pointer;
      font-size: 13px;
      color: var(--text-muted);
      font-weight: 500;
      list-style: none;
      user-select: none;
    }
    .graph-advanced > summary::before {
      content: "▶";
      display: inline-block;
      margin-right: 6px;
      font-size: 10px;
      transition: transform 0.15s ease;
    }
    .graph-advanced[open] > summary::before { transform: rotate(90deg); }
    .graph-advanced__body {
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .graph-advanced__warn {
      font-size: 12px;
      color: var(--text);
      background: rgba(218, 165, 32, 0.10);
      border-left: 3px solid #d18f00;
      padding: 6px 10px;
      border-radius: 4px;
    }
    .graph-alias-card-actions { display:inline-flex; gap:6px; flex-wrap:wrap; align-items:center; }
    .graph-nodetype-icon {
      font-size: 22px;
      line-height: 1;
      width: 28px;
      text-align: center;
      flex-shrink: 0;
    }
    .graph-nodetype-badge {
      display: inline-block;
      font-size: 11px;
      padding: 1px 7px;
      border-radius: 999px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      color: var(--text-muted);
    }
    .graph-nodetype-badge--custom {
      background: rgba(34, 197, 94, 0.08);
      border-color: rgba(34, 197, 94, 0.35);
      color: var(--text);
    }
    .btn.is-disabled { opacity: 0.55; cursor: not-allowed; }
    .graph-style-radios {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .graph-style-radios > label {
      display: inline-flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 13px;
      cursor: pointer;
    }
    .graph-style-radios > label > input { margin-top: 3px; }
    .graph-template-row {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      padding: 8px 10px;
      background: var(--surface-2);
      border: 1px dashed var(--border);
      border-radius: 6px;
    }
    .graph-form__row > label {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
  `;
}

function renderSettingsScript(initialStateJson, extraScripts = "") {
  return `
    (function () {
      var INITIAL_STATE = ${initialStateJson};
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
        loadBackups();
      }

      bootstrap();
    })();
    ${extraScripts}
  `;
}

function renderGraphTabScript() {
  // Self-contained IIFE for the «Граф знаний» tab. Uses no template literals
  // to keep nesting inside the parent template safe.
  return [
"(function () {",
"  function $(id) { return document.getElementById(id); }",
"  function esc(value) {",
"    if (value === null || value === undefined) return '';",
"    return String(value)",
"      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')",
"      .replace(/\\\"/g, '&quot;').replace(/'/g, '&#39;');",
"  }",
"  function toast(msg, kind) {",
"    var existing = document.querySelector('.toast');",
"    if (existing) existing.remove();",
"    var el = document.createElement('div');",
"    el.className = 'toast' + (kind === 'error' ? ' toast--error' : '');",
"    if (kind === 'warning') { el.style.borderColor = '#d18f00'; el.style.color = '#a86a00'; }",
"    el.textContent = msg;",
"    document.body.appendChild(el);",
"    var ttl = (kind === 'warning' || kind === 'error') ? 8000 : 4200;",
"    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, ttl);",
"  }",
"  function api(method, url, body) {",
"    var opts = { method: method, headers: {} };",
"    if (body !== undefined && !(body instanceof FormData)) {",
"      opts.headers['Content-Type'] = 'application/json';",
"      opts.body = JSON.stringify(body);",
"    } else if (body instanceof FormData) { opts.body = body; }",
"    return fetch(url, opts).then(function (resp) {",
"      return resp.json().then(function (data) {",
"        if (!resp.ok || (data && data.ok === false)) {",
"          var err = new Error((data && (data.error || data.message)) || ('HTTP ' + resp.status));",
"          err.status = resp.status; err.data = data; throw err;",
"        }",
"        return data;",
"      });",
"    });",
"  }",
"  function hint(text) {",
"    // Использует существующий .help-tip widget (CSS + auto-flip уже в общем JS).",
"    return '<span class=\"help-tip\" tabindex=\"0\" aria-label=\"Подсказка\">' +",
"      '<span class=\"help-tip__icon\" aria-hidden=\"true\">?</span>' +",
"      '<span class=\"help-tip__bubble\" role=\"tooltip\">' + esc(text) + '</span></span>';",
"  }",
"  function setBanner(el, msg, kind) {",
"    if (!el) return;",
"    if (!msg) { el.classList.remove('is-visible'); el.innerHTML = ''; return; }",
"    el.classList.add('is-visible');",
"    el.classList.toggle('settings-banner--success', kind === 'success');",
"    el.classList.toggle('settings-banner--error', kind === 'error');",
"    el.innerHTML = '<span>' + esc(msg) + '</span>';",
"  }",
"",
"  // ─── Известные словари заголовков ───────────────────────────",
"  // Используются для автоматического заполнения columns/per_sheet",
"  // после autodetect. Фронтенд-знание: не нужно API для них.",
"  var METSO_KNOWN_HEADERS = {",
"    'looptag': 'loop_tag',",
"    'devicetag': 'device_tag',",
"    'carh_type': 'card_type',",
"    'card_type': 'card_type',",
"    'card type': 'card_type',",
"    'address': 'address',",
"    'station': 'station_code',",
"    'chanel': 'channel_number',",
"    'channel': 'channel_number',",
"    'group type': 'signal_kind_raw',",
"    'наименование': 'description',",
"    'описание': 'description',",
"    'card pins': 'pin_on_card',",
"    'name wire': 'wire_name'",
"  };",
"  var KOYO_KNOWN_HEADERS = {",
"    'tag name': 'tag',",
"    'tag': 'tag',",
"    'позиция': 'position',",
"    'наименование параметра': 'description',",
"    'модуль': 'card_type',",
"    'место': 'card_slot',",
"    'клемма': 'channel_number',",
"    'память': 'signal_address'",
"  };",
"  var KOYO_SHEET_KIND = {",
"    'ai': 'AI', 'ain': 'AI',",
"    'ao': 'AO', 'aout': 'AO',",
"    'di': 'DI', 'din': 'DI',",
"    'do': 'DO', 'dout': 'DO'",
"  };",
"  function buildColumnsFromHeaders(headers) {",
"    var columns = {};",
"    (headers || []).forEach(function (h) {",
"      if (!h) return;",
"      var raw = String(h).trim();",
"      if (!raw) return;",
"      var norm = raw.toLowerCase();",
"      var field = METSO_KNOWN_HEADERS[norm];",
"      if (field && !columns[field]) columns[field] = raw;",
"    });",
"    return columns;",
"  }",
"  function buildPerSheetFromDetection(sheets) {",
"    var perSheet = {};",
"    (sheets || []).forEach(function (sh) {",
"      if (!sh || !sh.has_data) return;",
"      var name = String(sh.name || '');",
"      var kind = KOYO_SHEET_KIND[name.toLowerCase()];",
"      if (!kind) return;",
"      var columns = {};",
"      (sh.sample_header || []).forEach(function (h) {",
"        if (!h) return;",
"        var raw = String(h).trim();",
"        if (!raw) return;",
"        var norm = raw.toLowerCase();",
"        var field = KOYO_KNOWN_HEADERS[norm];",
"        if (field && !columns[field]) columns[field] = raw;",
"      });",
"      perSheet[name] = {",
"        builds: ['station', 'card', 'channel', 'signal'],",
"        signal_kind: kind,",
"        columns: columns",
"      };",
"    });",
"    return perSheet;",
"  }",
"",
"  // ─── Modal helpers ──────────────────────────────────────────",
"  var modal = { backdrop: null, title: null, body: null, foot: null, closeBtn: null };",
"  function ensureModal() {",
"    if (modal.backdrop) return;",
"    modal.backdrop = $('graphModalBackdrop');",
"    modal.title = $('graphModalTitle');",
"    modal.body = $('graphModalBody');",
"    modal.foot = $('graphModalFoot');",
"    modal.closeBtn = $('graphModalCloseBtn');",
"    if (modal.closeBtn) modal.closeBtn.addEventListener('click', closeModal);",
"    if (modal.backdrop) modal.backdrop.addEventListener('click', function (e) {",
"      if (e.target === modal.backdrop) closeModal();",
"    });",
"    document.addEventListener('keydown', function (e) {",
"      if (e.key === 'Escape' && modal.backdrop && modal.backdrop.classList.contains('is-open')) closeModal();",
"    });",
"  }",
"  function openModal(title, bodyEl, buttons) {",
"    ensureModal();",
"    if (!modal.backdrop) return;",
"    modal.title.textContent = title || '';",
"    modal.body.innerHTML = '';",
"    if (typeof bodyEl === 'string') modal.body.innerHTML = bodyEl;",
"    else if (bodyEl) modal.body.appendChild(bodyEl);",
"    modal.foot.innerHTML = '';",
"    (buttons || []).forEach(function (btn) { modal.foot.appendChild(btn); });",
"    modal.backdrop.classList.add('is-open');",
"  }",
"  function closeModal() {",
"    if (modal.backdrop) modal.backdrop.classList.remove('is-open');",
"    if (modal.body) modal.body.innerHTML = '';",
"    if (modal.foot) modal.foot.innerHTML = '';",
"  }",
"  function makeBtn(text, cls, onClick) {",
"    var b = document.createElement('button');",
"    b.type = 'button'; b.className = 'btn ' + (cls || ''); b.textContent = text;",
"    b.addEventListener('click', onClick); return b;",
"  }",
"",
"  // ─── State ──────────────────────────────────────────────────",
"  var state = { loaded: false, profiles: [], aliases: {}, nodeTypes: [] };",
"",
"  // ─── Node types (#8.1.e) ────────────────────────────────────",
"  function loadNodeTypes() {",
"    var listEl = $('graphNodeTypeList');",
"    if (listEl) listEl.innerHTML = '<div class=\"settings-hint\">Загрузка…</div>';",
"    return api('GET', '/api/v2/graph/node-types').then(function (data) {",
"      state.nodeTypes = (data && data.types) || [];",
"      renderNodeTypesList();",
"    }).catch(function (err) {",
"      if (listEl) listEl.innerHTML = '<div class=\"graph-form__error\">Не удалось загрузить типы узлов: ' + esc(err.message) + '</div>';",
"    });",
"  }",
"  function renderNodeTypesList() {",
"    var listEl = $('graphNodeTypeList');",
"    if (!listEl) return;",
"    if (!state.nodeTypes || state.nodeTypes.length === 0) {",
"      listEl.innerHTML = '<div class=\"settings-hint\">Типов узлов нет. Нажмите «Создать тип».</div>';",
"      return;",
"    }",
"    listEl.innerHTML = state.nodeTypes.map(function (t) {",
"      var systemBadge = t.is_builtin ? '<span class=\"graph-nodetype-badge\" title=\"Системный тип, удалить нельзя\">🔒 Системный</span>' : '<span class=\"graph-nodetype-badge graph-nodetype-badge--custom\">Кастомный</span>';",
"      var iconHtml = t.icon ? '<span class=\"graph-nodetype-icon\">' + esc(t.icon) + '</span>' : '';",
"      var deleteAttrs = t.is_builtin",
"        ? 'disabled aria-disabled=\"true\" title=\"Системный тип удалить нельзя\"'",
"        : 'data-graph-action=\"delete-nodetype\" data-id=\"' + esc(t.code) + '\"';",
"      var deleteCls = t.is_builtin ? 'btn btn--ghost is-disabled' : 'btn btn--ghost';",
"      return '<div class=\"graph-item-card\">' +",
"        '<div class=\"graph-item-card__head\">' +",
"          '<div style=\"display:flex;align-items:center;gap:8px;\">' + iconHtml +",
"            '<div>' +",
"              '<div class=\"graph-item-card__title\">' + esc(t.label_ru) + '</div>' +",
"              '<div class=\"graph-item-card__desc\">' + esc(t.description || '') + '</div>' +",
"            '</div>' +",
"          '</div>' +",
"          '<div class=\"graph-item-card__actions\">' +",
"            '<button type=\"button\" class=\"btn btn--ghost\" data-graph-action=\"edit-nodetype\" data-id=\"' + esc(t.code) + '\">Изменить</button>' +",
"            '<button type=\"button\" class=\"' + deleteCls + '\" ' + deleteAttrs + '>Удалить</button>' +",
"          '</div>' +",
"        '</div>' +",
"        '<div class=\"graph-item-card__meta\">' +",
"          '<span class=\"mono\">' + esc(t.code) + '</span>' +",
"          '<span>' + systemBadge + '</span>' +",
"          '<span>Узлов: ' + (t.usage_count || 0) + '</span>' +",
"          '<span>Порядок: ' + (t.sort_order || 100) + '</span>' +",
"        '</div>' +",
"      '</div>';",
"    }).join('');",
"  }",
"  function openNodeTypeEditor(existingType) {",
"    var isEdit = !!existingType;",
"    var data = existingType ? JSON.parse(JSON.stringify(existingType)) : {",
"      code: '', label_ru: '', description: '', icon: '', sort_order: 100, is_builtin: false",
"    };",
"    var wrap = document.createElement('div');",
"    wrap.className = 'graph-form';",
"    var codeReadonly = isEdit ? 'readonly disabled' : '';",
"    var codeHintText = isEdit",
"      ? 'Код типа неизменяем после создания.'",
"      : 'Латиницей с нижним подчёркиванием, как cabinet. Используется в YAML профилей и в БД. Не меняется после создания.';",
"    wrap.innerHTML =",
"      '<div class=\"graph-form__row\"><label>Код ' + hint(codeHintText) + '</label><div class=\"graph-form__field\">' +",
"        '<input type=\"text\" id=\"ntCode\" maxlength=\"64\" placeholder=\"my_type\" ' + codeReadonly + ' />' +",
"        '<span class=\"graph-form__hint\">Только латиница/цифры/_, начинается с буквы. До 64 символов.</span>' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\"><label>Название ' + hint('Русское название типа. Показывается в wizard\\'е парсера, в графе и в статистике.') + '</label><div class=\"graph-form__field\">' +",
"        '<input type=\"text\" id=\"ntLabel\" maxlength=\"128\" placeholder=\"Шкаф\" />' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\"><label>Описание ' + hint('Краткое описание для подсказки рядом с чекбоксом в wizard\\'е.') + '</label><div class=\"graph-form__field\">' +",
"        '<textarea id=\"ntDesc\" rows=\"3\" maxlength=\"2048\" placeholder=\"Шкаф автоматики, корпус с оборудованием.\"></textarea>' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\"><label>Иконка ' + hint('Один emoji-символ для визуального отличия в списках. Пример: 🗄 для шкафа.') + '</label><div class=\"graph-form__field\">' +",
"        '<input type=\"text\" id=\"ntIcon\" maxlength=\"16\" placeholder=\"🗄\" style=\"max-width:120px;\" />' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\"><label>Порядок ' + hint('Целое число для сортировки в списках. Меньше — выше.') + '</label><div class=\"graph-form__field\">' +",
"        '<input type=\"number\" id=\"ntSort\" min=\"1\" max=\"9999\" style=\"max-width:120px;\" />' +",
"      '</div></div>' +",
"      '<div id=\"ntErr\" class=\"graph-form__error\" style=\"display:none\"></div>';",
"    setTimeout(function () {",
"      var c = $('ntCode'); if (c) c.value = data.code || '';",
"      var l = $('ntLabel'); if (l) l.value = data.label_ru || '';",
"      var d = $('ntDesc'); if (d) d.value = data.description || '';",
"      var ic = $('ntIcon'); if (ic) ic.value = data.icon || '';",
"      var s = $('ntSort'); if (s) s.value = (data.sort_order || 100);",
"      if (!isEdit) { var c2 = $('ntCode'); if (c2) c2.focus(); }",
"    }, 0);",
"    var saveBtn = makeBtn('Сохранить', 'btn--accent', function () {",
"      var errEl = $('ntErr');",
"      var code = ($('ntCode').value || '').trim();",
"      var labelRu = ($('ntLabel').value || '').trim();",
"      var description = ($('ntDesc').value || '').trim();",
"      var icon = ($('ntIcon').value || '').trim();",
"      var sortOrder = Number($('ntSort').value) || 100;",
"      if (!isEdit) {",
"        if (!/^[a-z][a-z0-9_]*$/.test(code)) {",
"          errEl.style.display = 'block';",
"          errEl.textContent = 'Код должен начинаться с буквы латиницы и содержать только латиницу, цифры и _';",
"          return;",
"        }",
"      }",
"      if (!labelRu) {",
"        errEl.style.display = 'block';",
"        errEl.textContent = 'Название не может быть пустым';",
"        return;",
"      }",
"      var body = isEdit",
"        ? { label_ru: labelRu, description: description, icon: icon || null, sort_order: sortOrder }",
"        : { code: code, label_ru: labelRu, description: description, icon: icon || undefined, sort_order: sortOrder };",
"      var p = isEdit",
"        ? api('PUT', '/api/v2/graph/node-types/' + encodeURIComponent(data.code), body)",
"        : api('POST', '/api/v2/graph/node-types', body);",
"      p.then(function (res) {",
"        toast((res && res.message) || 'Сохранено');",
"        closeModal();",
"        loadNodeTypes();",
"      }).catch(function (err) {",
"        errEl.style.display = 'block';",
"        errEl.textContent = err.message || 'Не удалось сохранить';",
"      });",
"    });",
"    var cancelBtn = makeBtn('Отмена', 'btn--ghost', closeModal);",
"    openModal(isEdit ? ('Изменение типа узла: ' + data.code) : 'Создание типа узла', wrap, [cancelBtn, saveBtn]);",
"  }",
"  function confirmDeleteNodeType(code) {",
"    var t = state.nodeTypes.find(function (x) { return x.code === code; });",
"    if (!t) return;",
"    if (t.is_builtin) {",
"      toast('Системный тип \"' + code + '\" нельзя удалить.', 'error');",
"      return;",
"    }",
"    var wrap = document.createElement('div');",
"    if ((t.usage_count || 0) > 0) {",
"      wrap.innerHTML =",
"        '<p style=\"margin:0;\">Этот тип используется в <strong>' + t.usage_count + '</strong> узлах. Сначала измените их тип или удалите.</p>' +",
"        '<p class=\"settings-hint\" style=\"margin-top:6px;\">Удаление возможно только если на тип не ссылается ни один активный узел графа.</p>';",
"      var okBtn = makeBtn('Понятно', 'btn--accent', closeModal);",
"      openModal('Нельзя удалить тип \"' + code + '\"', wrap, [okBtn]);",
"      return;",
"    }",
"    wrap.innerHTML = '<p style=\"margin:0;\">Удалить тип узла <strong>' + esc(code) + '</strong>?</p>' +",
"      '<p class=\"settings-hint\" style=\"margin-top:6px;\">Это пользовательский тип. После удаления он исчезнет из wizard\\'а профилей и из списков.</p>';",
"    var cancelBtn = makeBtn('Отмена', 'btn--ghost', closeModal);",
"    var del = makeBtn('Удалить', 'btn--danger', function () {",
"      api('DELETE', '/api/v2/graph/node-types/' + encodeURIComponent(code)).then(function (res) {",
"        toast((res && res.message) || 'Удалено');",
"        closeModal();",
"        loadNodeTypes();",
"      }).catch(function (err) { toast('Не удалось удалить: ' + err.message, 'error'); });",
"    });",
"    openModal('Удалить тип узла?', wrap, [cancelBtn, del]);",
"  }",
"",
"  // ─── Profiles list ──────────────────────────────────────────",
"  function loadProfiles() {",
"    var listEl = $('graphProfileList');",
"    if (listEl) listEl.innerHTML = '<div class=\"settings-hint\">Загрузка…</div>';",
"    return api('GET', '/api/v2/graph/profiles').then(function (data) {",
"      state.profiles = (data && data.profiles) || [];",
"      renderProfilesList();",
"    }).catch(function (err) {",
"      if (listEl) listEl.innerHTML = '<div class=\"graph-form__error\">Не удалось загрузить профили: ' + esc(err.message) + '</div>';",
"    });",
"  }",
"  function renderProfilesList() {",
"    var listEl = $('graphProfileList');",
"    if (!listEl) return;",
"    if (state.profiles.length === 0) {",
"      listEl.innerHTML = '<div class=\"settings-hint\">Профилей пока нет. Нажмите «Создать профиль».</div>';",
"      return;",
"    }",
"    listEl.innerHTML = state.profiles.map(function (p) {",
"      var style = p.per_sheet ? 'koyo-style (per_sheet)' : 'metso-style (один шкаф/лист)';",
"      var matchBits = [];",
"      if (p.match && Array.isArray(p.match.file_extensions)) matchBits.push('ext: ' + p.match.file_extensions.join(', '));",
"      if (p.match && p.match.sheet_name_pattern) matchBits.push('sheet: /' + p.match.sheet_name_pattern + '/');",
"      if (p.match && Array.isArray(p.match.required_sheets)) matchBits.push('требует листы: ' + p.match.required_sheets.join(', '));",
"      return '<div class=\"graph-item-card\">' +",
"        '<div class=\"graph-item-card__head\">' +",
"          '<div>' +",
"            '<div class=\"graph-item-card__title\">' + esc(p.id) + '</div>' +",
"            '<div class=\"graph-item-card__desc\">' + esc(p.description || '') + '</div>' +",
"          '</div>' +",
"          '<div class=\"graph-item-card__actions\">' +",
"            '<button type=\"button\" class=\"btn btn--ghost\" data-graph-action=\"edit-profile\" data-id=\"' + esc(p.id) + '\">Изменить</button>' +",
"            '<button type=\"button\" class=\"btn btn--ghost\" data-graph-action=\"delete-profile\" data-id=\"' + esc(p.id) + '\">Удалить</button>' +",
"          '</div>' +",
"        '</div>' +",
"        '<div class=\"graph-item-card__meta\">' +",
"          '<span>Стиль: ' + esc(style) + '</span>' +",
"          (matchBits.length ? '<span>' + esc(matchBits.join(' · ')) + '</span>' : '') +",
"        '</div>' +",
"      '</div>';",
"    }).join('');",
"  }",
"",
"  // ─── Aliases list (с inline «+ Добавить алиас» в каждой карточке) ─",
"  function loadAliases() {",
"    var listEl = $('graphAliasList');",
"    if (listEl) listEl.innerHTML = '<div class=\"settings-hint\">Загрузка…</div>';",
"    return api('GET', '/api/v2/graph/aliases').then(function (data) {",
"      state.aliases = (data && data.signal_kind) || {};",
"      renderAliasesList();",
"    }).catch(function (err) {",
"      if (listEl) listEl.innerHTML = '<div class=\"graph-form__error\">Не удалось загрузить алиасы: ' + esc(err.message) + '</div>';",
"    });",
"  }",
"  function renderAliasesList() {",
"    var listEl = $('graphAliasList');",
"    if (!listEl) return;",
"    var keys = Object.keys(state.aliases);",
"    if (keys.length === 0) {",
"      listEl.innerHTML = '<div class=\"settings-hint\">Канонических значений пока нет. Раскройте «Расширенные возможности» ниже, чтобы создать первое.</div>';",
"      return;",
"    }",
"    listEl.innerHTML = keys.map(function (k) {",
"      var entry = state.aliases[k] || {};",
"      var aliases = Array.isArray(entry.aliases) ? entry.aliases : [];",
"      var pills = aliases.map(function (a) { return '<span class=\"graph-alias-pill\">' + esc(a) + '</span>'; }).join('');",
"      return '<div class=\"graph-item-card\">' +",
"        '<div class=\"graph-item-card__head\">' +",
"          '<div>' +",
"            '<div class=\"graph-item-card__title\">' + esc(k) + '</div>' +",
"            '<div class=\"graph-item-card__desc\">' + esc(entry.description || '') + '</div>' +",
"          '</div>' +",
"          '<div class=\"graph-alias-card-actions\">' +",
"            '<button type=\"button\" class=\"btn btn--accent\" data-graph-action=\"add-alias\" data-id=\"' + esc(k) + '\">+ Добавить алиас</button>' +",
"            '<button type=\"button\" class=\"btn btn--ghost\" data-graph-action=\"edit-alias\" data-id=\"' + esc(k) + '\">Изменить</button>' +",
"            '<button type=\"button\" class=\"btn btn--ghost\" data-graph-action=\"delete-alias\" data-id=\"' + esc(k) + '\">Удалить</button>' +",
"          '</div>' +",
"        '</div>' +",
"        '<div class=\"graph-alias-pills\">' + pills + '</div>' +",
"      '</div>';",
"    }).join('');",
"  }",
"",
"  // ─── Inline «+ Добавить алиас» (короткий диалог с одним полем) ─",
"  function openAddAliasDialog(canonical) {",
"    var entry = state.aliases[canonical] || { description: '', aliases: [] };",
"    var wrap = document.createElement('div');",
"    wrap.className = 'graph-form';",
"    wrap.innerHTML =",
"      '<p style=\"margin:0;font-size:13px;\">Добавить ещё одну форму написания к <strong>' + esc(canonical) + '</strong> — <span style=\"color:var(--text-muted)\">' + esc(entry.description || '') + '</span></p>' +",
"      '<div class=\"graph-form__row\">' +",
"        '<label>Новый алиас ' + hint('Любая форма написания, которая встречается в XLSX. Регистр и пробелы не важны при сравнении. Пример: «HART current loop», «4-20mA», «Анал.вх».') + '</label>' +",
"        '<div class=\"graph-form__field\">' +",
"          '<input type=\"text\" id=\"addAliasInput\" maxlength=\"128\" placeholder=\"например, HART current loop\" />' +",
"        '</div>' +",
"      '</div>' +",
"      '<p class=\"graph-form__hint\">Уже есть: ' + (entry.aliases.length ? entry.aliases.map(esc).join(', ') : '(пусто)') + '</p>' +",
"      '<div id=\"addAliasErr\" style=\"display:none\" class=\"graph-form__error\"></div>';",
"    setTimeout(function () { var el = $('addAliasInput'); if (el) el.focus(); }, 30);",
"    var saveBtn = makeBtn('Сохранить', 'btn--accent', function () {",
"      var value = ($('addAliasInput').value || '').trim();",
"      var errEl = $('addAliasErr');",
"      if (!value) { errEl.style.display = 'block'; errEl.textContent = 'Введите алиас'; return; }",
"      if (value.length > 128) { errEl.style.display = 'block'; errEl.textContent = 'Не больше 128 символов'; return; }",
"      var existingLc = entry.aliases.map(function (a) { return String(a).toLowerCase(); });",
"      if (existingLc.indexOf(value.toLowerCase()) >= 0) {",
"        errEl.style.display = 'block'; errEl.textContent = 'Такой алиас уже есть.'; return;",
"      }",
"      var newAliases = entry.aliases.slice(); newAliases.push(value);",
"      api('PUT', '/api/v2/graph/aliases/' + encodeURIComponent(canonical), {",
"        description: entry.description || '', aliases: newAliases",
"      }).then(function (res) {",
"        toast('Алиас «' + value + '» добавлен к ' + canonical);",
"        closeModal();",
"        loadAliases();",
"      }).catch(function (err) {",
"        errEl.style.display = 'block'; errEl.textContent = err.message || 'Не удалось сохранить';",
"      });",
"    });",
"    var cancelBtn = makeBtn('Отмена', 'btn--ghost', closeModal);",
"    openModal('+ Добавить алиас в ' + canonical, wrap, [cancelBtn, saveBtn]);",
"    document.addEventListener('keydown', function onKey(e) {",
"      if (e.key === 'Enter' && modal.backdrop && modal.backdrop.classList.contains('is-open') && document.activeElement && document.activeElement.id === 'addAliasInput') {",
"        saveBtn.click(); document.removeEventListener('keydown', onKey);",
"      }",
"    });",
"  }",
"",
"  // ─── Full alias editor (для «Изменить» и «Создать новое каноническое») ─",
"  function openAliasEditor(existingKey) {",
"    var existing = existingKey ? (state.aliases[existingKey] || {}) : {};",
"    var isEdit = !!existingKey;",
"    var wrap = document.createElement('div');",
"    wrap.className = 'graph-form';",
"    wrap.innerHTML =",
"      '<div class=\"graph-form__row\"><label>Каноническое значение ' + hint('Короткий код типа сигнала на латинице. Используется как ключ и пишется в attributes.signal_kind у узлов signal. Пример: AI, AO, RTD, PFC. После создания не меняется.') + '</label><div class=\"graph-form__field\">' +",
"        '<input type=\"text\" id=\"aliasCanonical\" maxlength=\"64\" placeholder=\"AI, AO, DI, …\" />' +",
"        '<span class=\"graph-form__hint\">Только латиница/цифры/_-, до 64 символов.</span>' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\"><label>Описание ' + hint('Человекочитаемое описание типа сигнала. Видно в UI. Пример: «Аналоговый вход 4-20 мА» или «Дискретный выход 24В».') + '</label><div class=\"graph-form__field\">' +",
"        '<input type=\"text\" id=\"aliasDesc\" maxlength=\"256\" placeholder=\"Аналоговый вход 4-20 мА\" />' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\"><label>Алиасы (по одному в строке) ' + hint('Каждая строка — одна форма написания, которая встречается в XLSX. Сравнение нечувствительно к регистру и пробелам. Можно добавлять русские и английские варианты.') + '</label><div class=\"graph-form__field\">' +",
"        '<textarea id=\"aliasList\" class=\"graph-mono\" rows=\"10\" placeholder=\"AI&#10;1AI&#10;Аналоговый вход\"></textarea>' +",
"      '</div></div>' +",
"      '<div id=\"aliasErr\" style=\"display:none\" class=\"graph-form__error\"></div>';",
"    setTimeout(function () {",
"      var k = $('aliasCanonical'); var d = $('aliasDesc'); var a = $('aliasList');",
"      if (k) { k.value = existingKey || ''; if (isEdit) k.disabled = true; }",
"      if (d) d.value = existing.description || '';",
"      if (a) a.value = (Array.isArray(existing.aliases) ? existing.aliases : []).join('\\n');",
"    }, 0);",
"    var saveBtn = makeBtn('Сохранить', 'btn--accent', function () {",
"      var canonical = ($('aliasCanonical').value || '').trim();",
"      var description = ($('aliasDesc').value || '').trim();",
"      var aliases = ($('aliasList').value || '').split(/\\r?\\n/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; });",
"      var errEl = $('aliasErr');",
"      if (!isEdit && !/^[A-Za-z][A-Za-z0-9_-]*$/.test(canonical)) {",
"        errEl.style.display = 'block';",
"        errEl.textContent = 'Канон должен начинаться с буквы латиницы и содержать только буквы, цифры, _ или -';",
"        return;",
"      }",
"      var body = { description: description, aliases: aliases };",
"      var p;",
"      if (isEdit) {",
"        p = api('PUT', '/api/v2/graph/aliases/' + encodeURIComponent(existingKey), body);",
"      } else {",
"        p = api('POST', '/api/v2/graph/aliases', Object.assign({ canonical: canonical }, body));",
"      }",
"      p.then(function (res) {",
"        toast(res.message || 'Сохранено');",
"        closeModal();",
"        loadAliases();",
"      }).catch(function (err) {",
"        errEl.style.display = 'block';",
"        errEl.textContent = err.message || 'Не удалось сохранить';",
"      });",
"    });",
"    var cancelBtn = makeBtn('Отмена', 'btn--ghost', closeModal);",
"    openModal(isEdit ? ('Изменить алиас: ' + existingKey) : 'Новое каноническое значение', wrap, [cancelBtn, saveBtn]);",
"  }",
"",
"  // ─── Защитный диалог перед созданием НОВОГО канонического значения ─",
"  function openCreateCanonicalConfirm() {",
"    var existing = Object.keys(state.aliases);",
"    var wrap = document.createElement('div');",
"    wrap.innerHTML =",
"      '<p style=\"margin:0;\">Создание <strong>нового канонического значения</strong> — редкая операция.</p>' +",
"      '<p style=\"margin:8px 0 0;\">Убедитесь, что нужного типа сигнала <em>нет</em> среди существующих:</p>' +",
"      '<p class=\"settings-hint\" style=\"margin:6px 0;\">' + (existing.length ? existing.map(esc).join(', ') : '(пусто)') + '</p>' +",
"      '<p class=\"settings-hint\" style=\"margin:0;\">Если хотите просто добавить ещё одну форму написания к уже существующему типу — закройте это окно и нажмите кнопку <strong>«+ Добавить алиас»</strong> в карточке нужного значения.</p>';",
"    var cancelBtn = makeBtn('Отмена', 'btn--ghost', closeModal);",
"    var go = makeBtn('Продолжить', 'btn--accent', function () {",
"      closeModal();",
"      openAliasEditor(null);",
"    });",
"    openModal('Создать новое каноническое значение?', wrap, [cancelBtn, go]);",
"  }",
"  function confirmDeleteAlias(canonical) {",
"    var wrap = document.createElement('div');",
"    wrap.innerHTML = '<p style=\"margin:0;\">Удалить каноническое значение <strong>' + esc(canonical) + '</strong> и все его алиасы?</p>' +",
"      '<p class=\"settings-hint\" style=\"margin-top:6px;\">Это не сломает kb-api. Сигналы с этим значением получат signal_kind = null до тех пор, пока не появится новый алиас.</p>';",
"    var cancelBtn = makeBtn('Отмена', 'btn--ghost', closeModal);",
"    var del = makeBtn('Удалить', 'btn--danger', function () {",
"      api('DELETE', '/api/v2/graph/aliases/' + encodeURIComponent(canonical)).then(function (res) {",
"        toast(res.message || 'Удалено');",
"        closeModal();",
"        loadAliases();",
"      }).catch(function (err) { toast('Не удалось удалить: ' + err.message, 'error'); });",
"    });",
"    openModal('Удалить алиас?', wrap, [cancelBtn, del]);",
"  }",
"",
"  // ─── Raw YAML editors ───────────────────────────────────────",
"  function openRawEditor(kind) {",
"    var isProfiles = (kind === 'profiles');",
"    var getUrl = isProfiles ? '/api/v2/graph/profiles/raw' : '/api/v2/graph/aliases/raw';",
"    var validateUrl = isProfiles ? '/api/v2/graph/profiles/raw/validate' : '/api/v2/graph/aliases/raw/validate';",
"    var putUrl = getUrl;",
"    var title = isProfiles ? 'YAML: graph-parsers.yaml' : 'YAML: graph-aliases.yaml';",
"    var wrap = document.createElement('div');",
"    wrap.className = 'graph-form';",
"    wrap.innerHTML =",
"      '<p class=\"graph-form__hint\">Перед каждой записью kb-api создаёт резервную копию в <span class=\"mono\">data/config-backups/</span> (последние 10). После сохранения kb-api сразу подхватит изменения — рестарт не нужен.</p>' +",
"      '<textarea id=\"rawYaml\" class=\"graph-mono\" rows=\"22\" spellcheck=\"false\"></textarea>' +",
"      '<div id=\"rawErr\" class=\"graph-form__error\" style=\"display:none\"></div>' +",
"      '<div id=\"rawOk\" class=\"graph-form__hint\" style=\"color:var(--success); display:none\"></div>';",
"    setTimeout(function () {",
"      api('GET', getUrl).then(function (data) {",
"        var ta = $('rawYaml');",
"        if (ta) ta.value = (data && data.content) || '';",
"      }).catch(function (err) {",
"        var errEl = $('rawErr');",
"        if (errEl) { errEl.style.display = 'block'; errEl.textContent = 'Не удалось загрузить файл: ' + err.message; }",
"      });",
"    }, 0);",
"    var checkBtn = makeBtn('Проверить синтаксис', 'btn--ghost', function () {",
"      var content = ($('rawYaml').value || '');",
"      var errEl = $('rawErr'); var okEl = $('rawOk');",
"      errEl.style.display = 'none'; okEl.style.display = 'none';",
"      api('POST', validateUrl, { content: content }).then(function (res) {",
"        okEl.style.display = 'block';",
"        okEl.textContent = isProfiles",
"          ? ('YAML корректен. Профилей: ' + (res.profiles_count || 0))",
"          : ('YAML корректен. Канонических значений: ' + (res.canonicals_count || 0));",
"      }).catch(function (err) {",
"        errEl.style.display = 'block';",
"        errEl.textContent = err.message || 'Невалидный YAML';",
"      });",
"    });",
"    var saveBtn = makeBtn('Сохранить', 'btn--accent', function () {",
"      var content = ($('rawYaml').value || '');",
"      var errEl = $('rawErr'); var okEl = $('rawOk');",
"      errEl.style.display = 'none'; okEl.style.display = 'none';",
"      api('PUT', putUrl, { content: content }).then(function (res) {",
"        toast(res.message || 'Сохранено');",
"        closeModal();",
"        if (isProfiles) loadProfiles(); else loadAliases();",
"      }).catch(function (err) {",
"        errEl.style.display = 'block';",
"        errEl.textContent = err.message || 'Не удалось сохранить';",
"      });",
"    });",
"    var cancelBtn = makeBtn('Отмена', 'btn--ghost', closeModal);",
"    openModal(title, wrap, [cancelBtn, checkBtn, saveBtn]);",
"  }",
"",
"  // ─── Profile wizard (create / edit) ─────────────────────────",
"  function openProfileEditor(existingProfile) {",
"    var isEdit = !!existingProfile;",
"    var data = existingProfile ? JSON.parse(JSON.stringify(existingProfile)) : {",
"      id: '', description: '',",
"      match: { file_extensions: ['.xlsx'], sheet_name_pattern: '', required_headers: [], required_sheets: [] },",
"      layout: { header_row: 1, data_start_row: 4 },",
"      columns: {},",
"      builds: ['cabinet', 'station', 'card', 'channel', 'signal', 'device'],",
"      cabinet: { source: 'sheet_name', pattern: '', name_template: 'Cabinet {cabinet_code}' },",
"      skip_rows: [],",
"    };",
"    // #8.1.e: подтягиваем актуальный список типов узлов на каждое открытие wizard'а",
"    // — пользователь мог только что добавить новый тип в подвкладке «Типы узлов».",
"    api('GET', '/api/v2/graph/node-types').then(function (res) {",
"      state.nodeTypes = (res && res.types) || state.nodeTypes;",
"      if (typeof renderBuilds === 'function') { try { renderBuilds(); } catch (_) {} }",
"    }).catch(function () {});",
"    var detectedStyle = (data.per_sheet && Object.keys(data.per_sheet).length) ? 'koyo' : 'metso';",
"    var sampleSheets = [];",
"    var wrap = document.createElement('div');",
"    wrap.className = 'graph-form';",
"    wrap.innerHTML =",
"      '<div class=\"graph-form__row\"><label>1. Образец XLSX ' + hint('Прикрепите типовой XLSX (до 5 МБ), и wizard сам определит стиль, предложит маппинг колонок и подскажет regex для имени листа. Опционально — можно заполнить вручную.') + '</label><div class=\"graph-form__field\">' +",
"        '<input type=\"file\" id=\"wzSample\" accept=\".xlsx,.xls,.xlsm\" />' +",
"        '<span class=\"graph-form__hint\" id=\"wzSampleHint\">Опционально. Помогает автодетекту и предпросмотру.</span>' +",
"        '<div class=\"graph-template-row\" id=\"wzTemplateRow\" style=\"display:none\"></div>' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\"><label>2. Стиль профиля ' + hint('Metso: один лист = один шкаф, всё пишется построчно (LOOPTAG, ADDRESS). Koyo: отдельные листы AI/AO/DI/DO. Универсальный: вы сами решаете, какие уровни иерархии создаются и как — для нестандартных задач.') + '</label><div class=\"graph-form__field\">' +",
"        '<div class=\"graph-style-radios\">' +",
"          '<label><input type=\"radio\" name=\"wzStyle\" value=\"metso\" checked /> Metso (один лист = один шкаф)</label>' +",
"          '<label><input type=\"radio\" name=\"wzStyle\" value=\"koyo\" /> Koyo (листы по типам сигналов: AI/AO/DI/DO)</label>' +",
"          '<label><input type=\"radio\" name=\"wzStyle\" value=\"universal\" /> Универсальный (свой набор уровней и маппинга)</label>' +",
"        '</div>' +",
"        '<span class=\"graph-form__hint\" id=\"wzStyleHint\"></span>' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\"><label>3. ID профиля ' + hint('Латиницей с нижним подчёркиванием, как metso_dna_rio. Используется в логах, в graph_report и в attributes.author узлов. После создания не меняется.') + '</label><div class=\"graph-form__field\">' +",
"        '<input type=\"text\" id=\"wzId\" maxlength=\"96\" placeholder=\"my_new_profile\" />' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\"><label>4. Описание ' + hint('Свободный текст, виден в списке профилей. Помогает вспомнить, для каких файлов нужен этот профиль. Можно на русском.') + '</label><div class=\"graph-form__field\">' +",
"        '<input type=\"text\" id=\"wzDesc\" maxlength=\"512\" placeholder=\"Краткое описание формата XLSX\" />' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\" data-style=\"metso koyo universal\"><label>5. match.file_extensions ' + hint('Список расширений файлов (с точкой), через запятую. Если файл не подходит ни под один профиль, парсер графа просто не запускается. Пример: .xlsx, .xlsm') + '</label><div class=\"graph-form__field\">' +",
"        '<input type=\"text\" id=\"wzExt\" placeholder=\".xlsx, .xlsm\" />' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\" data-style=\"metso universal\"><label>match.sheet_name_pattern ' + hint('Регулярное выражение для имени листа. Хотя бы один лист в файле должен под него подойти. Пример: ^_?IO-\\\\d+ — для листов типа _IO-06.') + '</label><div class=\"graph-form__field\">' +",
"        '<input type=\"text\" id=\"wzSheetRe\" placeholder=\"^_?IO-\\\\d+\" />' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\" data-style=\"metso universal\"><label>match.required_headers ' + hint('Подстроки, которые должны встретиться в строке заголовков. Сравнение нечувствительно к регистру и пробелам. Через запятую. Пример: LOOPTAG, ADDRESS, CARH_TYPE.') + '</label><div class=\"graph-form__field\">' +",
"        '<input type=\"text\" id=\"wzReqHeaders\" placeholder=\"LOOPTAG, ADDRESS, CARH_TYPE\" />' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\" data-style=\"koyo universal\"><label>match.required_sheets ' + hint('Все указанные листы должны присутствовать в файле. Через запятую. Используется в koyo-style: AI, AO, DI, DO.') + '</label><div class=\"graph-form__field\">' +",
"        '<input type=\"text\" id=\"wzReqSheets\" placeholder=\"AI, AO, DI, DO\" />' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\" data-style=\"metso koyo universal\"><label>6. layout.header_row / data_start_row ' + hint('Номер строки в Excel с заголовками колонок (header_row) и номер первой строки данных (data_start_row). Считаются от 1, как видно в Excel. Часто 1 и 4 для metso, 3 и 4 для koyo.') + '</label><div class=\"graph-form__field\">' +",
"        '<div style=\"display:flex;gap:8px;\">' +",
"          '<input type=\"number\" id=\"wzHeaderRow\" min=\"1\" max=\"100\" style=\"max-width:120px\" />' +",
"          '<input type=\"number\" id=\"wzDataStart\" min=\"1\" max=\"500\" style=\"max-width:120px\" />' +",
"        '</div>' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\" data-style=\"metso universal\"><label>layout.sheet_filter ' + hint('Опциональный regex для отбора листов, которые парсер должен обработать (отдельный от match.sheet_name_pattern). Например, если в файле есть служебные листы — указать здесь маску только нужных.') + '</label><div class=\"graph-form__field\">' +",
"        '<input type=\"text\" id=\"wzSheetFilter\" placeholder=\"^_?IO-\\\\d+\" />' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\" data-style=\"metso koyo universal\"><label>7. builds ' + hint('Какие уровни иерархии создаёт парсер: object → cabinet → station → card → channel → signal → device. Чем меньше уровней — тем проще граф. Можно убрать, например, device или channel, если они не нужны.') + '</label><div class=\"graph-form__field\">' +",
"        '<div id=\"wzBuilds\" style=\"display:flex;gap:10px;flex-wrap:wrap;\"></div>' +",
"        '<span class=\"graph-form__hint\">В koyo-style уровни задаются внутри per_sheet — этот общий список тогда не используется.</span>' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\" data-style=\"metso universal\" id=\"wzCabinetRow\"><label>8. cabinet (metso) ' + hint('Откуда брать код шкафа. Сейчас поддержан только источник sheet_name: парсер извлекает группу из regex по имени листа. Шаблон имени — c подстановкой {cabinet_code}. Пример: regex ^_?(IO-\\\\d+), template «Cabinet {cabinet_code}».') + '</label><div class=\"graph-form__field\">' +",
"        '<input type=\"text\" id=\"wzCabPattern\" placeholder=\"^_?(IO-\\\\d+)\" />' +",
"        '<input type=\"text\" id=\"wzCabTemplate\" placeholder=\"Cabinet {cabinet_code}\" />' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\" data-style=\"koyo universal\" id=\"wzStationDefRow\"><label>station_default (koyo) ' + hint('В koyo-style на каждый файл — один ПЛК (одна станция). Шаблон station_code обычно {filename_without_ext} — код станции = имя файла без расширения. Шаблон имени — «ПЛК {station_code}».') + '</label><div class=\"graph-form__field\">' +",
"        '<input type=\"text\" id=\"wzStationCode\" placeholder=\"{filename_without_ext}\" />' +",
"        '<input type=\"text\" id=\"wzStationName\" placeholder=\"ПЛК {station_code}\" />' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\" data-style=\"metso universal\"><label>9. columns (JSON) ' + hint('Маппинг внутренних полей парсера на заголовки колонок XLSX. Пример: {\"loop_tag\": \"LOOPTAG\", \"address\": \"ADDRESS\"}. После загрузки образца wizard может заполнить это автоматически.') + '</label><div class=\"graph-form__field\">' +",
"        '<textarea id=\"wzColumns\" class=\"graph-mono\" rows=\"8\" placeholder=\"{\\n  &quot;loop_tag&quot;: &quot;LOOPTAG&quot;,\\n  &quot;address&quot;: &quot;ADDRESS&quot;\\n}\"></textarea>' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\" data-style=\"koyo universal\"><label>per_sheet (JSON, koyo) ' + hint('Для каждого листа — отдельный набор builds, signal_kind и columns. Пример: {\"AI\": {\"builds\": [\"station\",\"card\",\"channel\",\"signal\"], \"signal_kind\": \"AI\", \"columns\": {\"tag\": \"Tag Name\"}}}.') + '</label><div class=\"graph-form__field\">' +",
"        '<textarea id=\"wzPerSheet\" class=\"graph-mono\" rows=\"8\" placeholder=\"{\\n  &quot;AI&quot;: { &quot;builds&quot;: [&quot;station&quot;,&quot;card&quot;,&quot;channel&quot;,&quot;signal&quot;], &quot;signal_kind&quot;: &quot;AI&quot;, &quot;columns&quot;: { &quot;tag&quot;: &quot;Tag Name&quot; } }\\n}\"></textarea>' +",
"      '</div></div>' +",
"      '<div class=\"graph-form__row\" data-style=\"metso koyo universal\"><label>skip_rows (JSON) ' + hint('Условия пропуска строк. Поддержано: loop_tag_empty, loop_tag_matches:<regex>, tag_empty, description_matches:<regex>. Пример: [{\"condition\": \"loop_tag_empty\"}, {\"condition\": \"loop_tag_matches:^Резерв\"}].') + '</label><div class=\"graph-form__field\">' +",
"        '<textarea id=\"wzSkipRows\" class=\"graph-mono\" rows=\"4\" placeholder=\"[{ &quot;condition&quot;: &quot;loop_tag_empty&quot; }]\"></textarea>' +",
"      '</div></div>' +",
"      '<div id=\"wzErr\" class=\"graph-form__error\" style=\"display:none\"></div>' +",
"      '<div id=\"wzPreviewWrap\"></div>';",
"",
"    function getStyle() {",
"      var checked = wrap.querySelector('input[name=\"wzStyle\"]:checked');",
"      return checked ? checked.value : 'metso';",
"    }",
"    function setStyle(value) {",
"      var radios = wrap.querySelectorAll('input[name=\"wzStyle\"]');",
"      radios.forEach(function (r) { r.checked = (r.value === value); });",
"      updateVisibility();",
"    }",
"",
"    // ─── Builds: explicit Set state (single source of truth) ───",
"    // Fixes bug где Apply Template затирал кастомные unchecks: теперь",
"    // checkboxes только отражают buildsState, и buildsState изменяется",
"    // только через явные действия (init / change / setBuildsList).",
"    var buildsState = new Set(Array.isArray(data.builds) ? data.builds : []);",
"    var buildsDirty = false;  // true once user toggled any checkbox",
"    function setBuildsList(items, opts) {",
"      opts = opts || {};",
"      if (buildsDirty && !opts.force) return;  // respect user's manual choices",
"      buildsState = new Set(Array.isArray(items) ? items : []);",
"      renderBuilds();",
"    }",
"    function renderBuilds() {",
"      var style = getStyle();",
"      var box = $('wzBuilds');",
"      if (!box) return;",
"      // Список типов узлов — динамический, из БД через state.nodeTypes.",
"      // Если список ещё не загружен — fallback на builtin кодировки.",
"      var types = (Array.isArray(state.nodeTypes) && state.nodeTypes.length > 0)",
"        ? state.nodeTypes.slice().filter(function (t) { return !t.is_archived; })",
"        : ['object','cabinet','station','card','channel','signal','device'].map(function (c) {",
"            return { code: c, label_ru: c, icon: '', description: '', sort_order: 100, is_archived: false };",
"          });",
"      types.sort(function (a, b) { return (a.sort_order || 100) - (b.sort_order || 100); });",
"      // В metso/koyo-режиме скрываем 'object' (он только для универсального стиля).",
"      // В универсальном — показываем все.",
"      if (style !== 'universal') {",
"        types = types.filter(function (t) { return t.code !== 'object'; });",
"      }",
"      box.innerHTML = types.map(function (t) {",
"        var ck = buildsState.has(t.code) ? 'checked' : '';",
"        var iconPart = t.icon ? (esc(t.icon) + ' ') : '';",
"        var tip = t.description ? hint(t.description) : '';",
"        return '<label style=\"display:inline-flex;align-items:center;gap:4px;\">' +",
"               '<input type=\"checkbox\" data-build=\"' + esc(t.code) + '\" ' + ck + ' />' +",
"               iconPart + esc(t.label_ru || t.code) + tip + '</label>';",
"      }).join('');",
"      box.querySelectorAll('input[type=checkbox]').forEach(function (cb) {",
"        cb.addEventListener('change', function () {",
"          buildsDirty = true;",
"          var b = cb.getAttribute('data-build');",
"          if (cb.checked) buildsState.add(b); else buildsState.delete(b);",
"        });",
"      });",
"    }",
"    function updateVisibility() {",
"      var style = getStyle();",
"      // Спрятать/показать строки по data-style. Если data-style отсутствует — всегда видна.",
"      wrap.querySelectorAll('.graph-form__row[data-style]').forEach(function (row) {",
"        var styles = (row.getAttribute('data-style') || '').split(/\\s+/);",
"        var visible = styles.indexOf(style) >= 0;",
"        row.style.display = visible ? 'grid' : 'none';",
"      });",
"      // Перерендерить чекбоксы builds (набор уровней зависит от стиля)",
"      renderBuilds();",
"    }",
"    function fillFromData() {",
"      setStyle(detectedStyle);",
"      $('wzId').value = data.id || '';",
"      if (isEdit) { $('wzId').disabled = true; }",
"      $('wzDesc').value = data.description || '';",
"      var m = data.match || {};",
"      $('wzExt').value = (m.file_extensions || []).join(', ');",
"      $('wzSheetRe').value = m.sheet_name_pattern || '';",
"      $('wzReqHeaders').value = (m.required_headers || []).join(', ');",
"      $('wzReqSheets').value = (m.required_sheets || []).join(', ');",
"      var l = data.layout || {};",
"      $('wzHeaderRow').value = l.header_row || 1;",
"      $('wzDataStart').value = l.data_start_row || 2;",
"      $('wzSheetFilter').value = l.sheet_filter || '';",
"      var c = data.cabinet || {};",
"      $('wzCabPattern').value = c.pattern || '';",
"      $('wzCabTemplate').value = c.name_template || '';",
"      var sd = data.station_default || {};",
"      $('wzStationCode').value = sd.station_code_template || '';",
"      $('wzStationName').value = sd.name_template || '';",
"      $('wzColumns').value = data.columns && Object.keys(data.columns).length",
"        ? JSON.stringify(data.columns, null, 2) : '';",
"      $('wzPerSheet').value = data.per_sheet ? JSON.stringify(data.per_sheet, null, 2) : '';",
"      $('wzSkipRows').value = Array.isArray(data.skip_rows) && data.skip_rows.length",
"        ? JSON.stringify(data.skip_rows, null, 2) : '';",
"      // Сбросить буfferы builds: при первом отрисовке мы хотим именно data.builds,",
"      // не «то, что осталось в DOM от прошлого открытия».",
"      buildsState = new Set(Array.isArray(data.builds) ? data.builds : []);",
"      buildsDirty = false;",
"      updateVisibility();",
"    }",
"    function parseList(s) { return String(s || '').split(',').map(function (x) { return x.trim(); }).filter(function (x) { return x.length > 0; }); }",
"    function collectPayload() {",
"      var style = getStyle();",
"      var payload = {};",
"      if (!isEdit) payload.id = ($('wzId').value || '').trim();",
"      payload.description = ($('wzDesc').value || '').trim();",
"      payload.match = {};",
"      var ext = parseList($('wzExt').value); if (ext.length) payload.match.file_extensions = ext;",
"      var snp = ($('wzSheetRe').value || '').trim(); if (snp) payload.match.sheet_name_pattern = snp;",
"      var rh = parseList($('wzReqHeaders').value); if (rh.length) payload.match.required_headers = rh;",
"      var rs = parseList($('wzReqSheets').value); if (rs.length) payload.match.required_sheets = rs;",
"      var headerRow = Number($('wzHeaderRow').value) || 1;",
"      var dataStartRow = Number($('wzDataStart').value) || 2;",
"      var sheetFilter = ($('wzSheetFilter').value || '').trim();",
"      payload.layout = { header_row: headerRow, data_start_row: dataStartRow };",
"      if (sheetFilter) payload.layout.sheet_filter = sheetFilter;",
"      // builds — из явного buildsState (а не из DOM), чтобы не зависело от того,",
"      // когда последний раз вызывался renderBuilds / какие чекбоксы есть в DOM.",
"      payload.builds = Array.from(buildsState);",
"      if (style === 'metso' || style === 'universal') {",
"        var cabPattern = ($('wzCabPattern').value || '').trim();",
"        var cabTemplate = ($('wzCabTemplate').value || '').trim();",
"        if (cabPattern || cabTemplate) {",
"          payload.cabinet = { source: 'sheet_name', pattern: cabPattern, name_template: cabTemplate || 'Cabinet {cabinet_code}' };",
"        }",
"      }",
"      if (style === 'koyo' || style === 'universal') {",
"        var sCode = ($('wzStationCode').value || '').trim();",
"        var sName = ($('wzStationName').value || '').trim();",
"        if (sCode || sName) {",
"          payload.station_default = {",
"            station_code_template: sCode || '{filename_without_ext}',",
"            name_template: sName || 'ПЛК {station_code}'",
"          };",
"        }",
"      }",
"      var colTxt = ($('wzColumns').value || '').trim();",
"      if (colTxt) {",
"        try { payload.columns = JSON.parse(colTxt); }",
"        catch (e) { throw new Error('columns: невалидный JSON — ' + e.message); }",
"      }",
"      var psTxt = ($('wzPerSheet').value || '').trim();",
"      if (psTxt) {",
"        try { payload.per_sheet = JSON.parse(psTxt); }",
"        catch (e) { throw new Error('per_sheet: невалидный JSON — ' + e.message); }",
"      }",
"      var skTxt = ($('wzSkipRows').value || '').trim();",
"      if (skTxt) {",
"        try { payload.skip_rows = JSON.parse(skTxt); }",
"        catch (e) { throw new Error('skip_rows: невалидный JSON — ' + e.message); }",
"      }",
"      return payload;",
"    }",
"",
"    setTimeout(fillFromData, 0);",
"    setTimeout(function () {",
"      // ── Подписки ──",
"      wrap.querySelectorAll('input[name=\"wzStyle\"]').forEach(function (r) {",
"        r.addEventListener('change', updateVisibility);",
"      });",
"      // Применить шаблон",
"      function attachTemplateClick(btn, profileId) {",
"        btn.addEventListener('click', function () {",
"          api('GET', '/api/v2/graph/profiles/' + encodeURIComponent(profileId)).then(function (res) {",
"            var raw = res && res.profile;",
"            if (!raw) { toast('Профиль не найден', 'error'); return; }",
"            // #8.1.c.fix-2: deep clone через JSON.parse(JSON.stringify(...)) —",
"            // не делим ссылки с кэшем и гарантированно копируем ВСЕ nested",
"            // (match.required_headers, skip_rows, per_sheet.<sheet>.columns и т.п.).",
"            var src;",
"            try { src = JSON.parse(JSON.stringify(raw)); }",
"            catch (e) { toast('Не удалось клонировать шаблон: ' + e.message, 'error'); return; }",
"            delete src.id;  // id всегда задаёт пользователь, не копируем",
"            applyTemplateToWizard(src, profileId);",
"          }).catch(function (err) { toast('Не удалось применить шаблон: ' + err.message, 'error'); });",
"        });",
"      }",
"      function applyTemplateToWizard(src, profileId) {",
"        // Описание — НЕ перетираем, если пользователь уже что-то ввёл.",
"        if ($('wzDesc') && !$('wzDesc').value) $('wzDesc').value = src.description || '';",
"        var m = src.match || {};",
"        $('wzExt').value = Array.isArray(m.file_extensions) ? m.file_extensions.join(', ') : '';",
"        $('wzSheetRe').value = m.sheet_name_pattern || '';",
"        $('wzReqHeaders').value = Array.isArray(m.required_headers) ? m.required_headers.join(', ') : '';",
"        $('wzReqSheets').value = Array.isArray(m.required_sheets) ? m.required_sheets.join(', ') : '';",
"        var l = src.layout || {};",
"        $('wzHeaderRow').value = Number(l.header_row) || 1;",
"        $('wzDataStart').value = Number(l.data_start_row) || 2;",
"        $('wzSheetFilter').value = l.sheet_filter || '';",
"        var c = src.cabinet || {};",
"        $('wzCabPattern').value = c.pattern || '';",
"        $('wzCabTemplate').value = c.name_template || '';",
"        var sd = src.station_default || {};",
"        $('wzStationCode').value = sd.station_code_template || '';",
"        $('wzStationName').value = sd.name_template || '';",
"        // Nested-объекты идут как JSON в textarea — тут deep clone уже сделан,",
"        // JSON.stringify даст ровно те же ключи/массивы, что и в YAML.",
"        $('wzColumns').value = src.columns && Object.keys(src.columns).length",
"          ? JSON.stringify(src.columns, null, 2) : '';",
"        $('wzPerSheet').value = (src.per_sheet && Object.keys(src.per_sheet).length)",
"          ? JSON.stringify(src.per_sheet, null, 2) : '';",
"        $('wzSkipRows').value = Array.isArray(src.skip_rows) && src.skip_rows.length",
"          ? JSON.stringify(src.skip_rows, null, 2) : '';",
"        // builds: стиль решает по наличию per_sheet (как в metso_dna_rio /",
"        // koyo_directlogic_pro).",
"        var newStyle = (src.per_sheet && Object.keys(src.per_sheet).length) ? 'koyo' : 'metso';",
"        setStyle(newStyle);",
"        // Если пользователь уже трогал чекбоксы builds (buildsDirty=true) —",
"        // setBuildsList НЕ перезатрёт его кастом (см. #8.1.c.fix-patch bug 1).",
"        setBuildsList(Array.isArray(src.builds) ? src.builds : []);",
"        if (buildsDirty) {",
"          toast('Шаблон применён, но ваш кастомный список «builds» сохранён. Сбросьте чекбоксы вручную, если нужно.');",
"        } else {",
"          toast('Поля заполнены из шаблона ' + profileId + '. Допишите свой id и сохраните.');",
"        }",
"      }",
"      // ── Sample upload + autodetect + auto-fill columns/per_sheet ──",
"      var sample = $('wzSample');",
"      if (sample) sample.addEventListener('change', function () {",
"        var f = sample.files && sample.files[0];",
"        if (!f) return;",
"        var fd = new FormData(); fd.append('file', f);",
"        $('wzSampleHint').textContent = 'Анализ файла…';",
"        api('POST', '/api/v2/graph/profiles/detect-style', fd).then(function (res) {",
"          sampleSheets = res.sheets || [];",
"          detectedStyle = res.style || detectedStyle;",
"          setStyle(detectedStyle);",
"          $('wzStyleHint').textContent = 'Автодетект: ' + detectedStyle + '. Листы: ' + sampleSheets.map(function (s) { return s.name; }).join(', ');",
"          // Авто-заполнить columns (metso) / per_sheet (koyo), если поле пустое или {} ",
"          var colsEl = $('wzColumns');",
"          var psEl = $('wzPerSheet');",
"          if (detectedStyle === 'metso' && colsEl && (!colsEl.value.trim() || colsEl.value.trim() === '{}')) {",
"            var hdr = (sampleSheets[0] && sampleSheets[0].sample_header) || [];",
"            var cols = buildColumnsFromHeaders(hdr);",
"            if (Object.keys(cols).length) {",
"              colsEl.value = JSON.stringify(cols, null, 2);",
"            }",
"            // Также проставить sheet_filter и sheet_name_pattern по первому листу.",
"            // Используем single-pass regex чтобы не было double-escape: цифровые группы",
"            // заменяются на \\\\d+, остальные куски — escape'ятся как regex-literals.",
"            var firstSheet = sampleSheets[0] && sampleSheets[0].name;",
"            var suggested = firstSheet ? ('^' + String(firstSheet).replace(/(\\d+)|([^\\d]+)/g, function (_, digits, text) {",
"              return digits ? '\\\\d+' : text.replace(/[.+?()[\\]{}|^$\\\\]/g, '\\\\$&');",
"            })) : '';",
"            if (suggested && !$('wzSheetFilter').value) $('wzSheetFilter').value = suggested;",
"            if (suggested && !$('wzSheetRe').value) $('wzSheetRe').value = suggested;",
"          }",
"          if (detectedStyle === 'koyo' && psEl && (!psEl.value.trim() || psEl.value.trim() === '{}')) {",
"            var ps = buildPerSheetFromDetection(sampleSheets);",
"            if (Object.keys(ps).length) {",
"              psEl.value = JSON.stringify(ps, null, 2);",
"            }",
"            // koyo-style имеет другую структуру листов: заголовки в строке 3, данные с 4.",
"            // Дефолт metso (header_row=1) дал бы парсеру tag_empty x N — поэтому переставляем,",
"            // но только если пользователь не успел отредактировать значения вручную.",
"            var hrEl = $('wzHeaderRow'); var dsEl = $('wzDataStart');",
"            if (hrEl && (!hrEl.value || Number(hrEl.value) === 1)) hrEl.value = 3;",
"            if (dsEl && (!dsEl.value || Number(dsEl.value) === 2)) dsEl.value = 4;",
"            // required_sheets из koyo-листов",
"            if (!$('wzReqSheets').value) {",
"              var koyoNames = Object.keys(ps);",
"              if (koyoNames.length) $('wzReqSheets').value = koyoNames.join(', ');",
"            }",
"          }",
"          // ── Показать кнопки шаблонов ──",
"          var tplRow = $('wzTemplateRow');",
"          if (tplRow) {",
"            tplRow.style.display = 'flex';",
"            tplRow.innerHTML = '<span class=\"graph-form__hint\" style=\"width:100%;\">Быстрый старт — применить значения из существующего профиля (id не копируется):</span>';",
"            var btnM = document.createElement('button'); btnM.type = 'button'; btnM.className = 'btn btn--ghost'; btnM.textContent = 'Применить шаблон metso_dna_rio';",
"            var btnK = document.createElement('button'); btnK.type = 'button'; btnK.className = 'btn btn--ghost'; btnK.textContent = 'Применить шаблон koyo_directlogic_pro';",
"            attachTemplateClick(btnM, 'metso_dna_rio');",
"            attachTemplateClick(btnK, 'koyo_directlogic_pro');",
"            tplRow.appendChild(btnM);",
"            tplRow.appendChild(btnK);",
"          }",
"          $('wzSampleHint').textContent = 'Готово. Стиль: ' + detectedStyle + '. Можно нажать «Проверить профиль» или применить готовый шаблон.';",
"        }).catch(function (err) {",
"          $('wzSampleHint').textContent = 'Не удалось проанализировать файл: ' + err.message;",
"        });",
"      });",
"    }, 0);",
"",
"    function showError(msg) { var e = $('wzErr'); e.style.display = 'block'; e.textContent = msg; }",
"    function clearError() { var e = $('wzErr'); e.style.display = 'none'; e.textContent = ''; }",
"",
"    var testBtn = makeBtn('Проверить профиль', 'btn--ghost', function () {",
"      clearError();",
"      var sample = $('wzSample');",
"      var f = sample && sample.files && sample.files[0];",
"      if (!f) { showError('Прикрепите образец XLSX в разделе 1, чтобы проверить профиль.'); return; }",
"      var payload;",
"      try { payload = collectPayload(); } catch (e) { showError(e.message); return; }",
"      if (!payload.id && isEdit) payload.id = data.id;",
"      var fd = new FormData(); fd.append('file', f); fd.append('profile', JSON.stringify(payload));",
"      var pw = $('wzPreviewWrap'); pw.innerHTML = '<div class=\"settings-hint\">Проверка…</div>';",
"      api('POST', '/api/v2/graph/profiles/test', fd).then(function (res) {",
"        renderPreview(pw, res);",
"      }).catch(function (err) {",
"        pw.innerHTML = '';",
"        showError(err.message || 'Не удалось проверить профиль');",
"      });",
"    });",
"    var saveBtn = makeBtn('Сохранить', 'btn--accent', function () {",
"      clearError();",
"      var payload;",
"      try { payload = collectPayload(); } catch (e) { showError(e.message); return; }",
"      if (isEdit) {",
"        api('PUT', '/api/v2/graph/profiles/' + encodeURIComponent(data.id), payload).then(function (res) {",
"          toast(res.message || 'Профиль обновлён');",
"          closeModal(); loadProfiles();",
"        }).catch(function (err) { showError(err.message); });",
"      } else {",
"        if (!/^[a-z][a-z0-9_]*$/.test(payload.id || '')) {",
"          showError('ID профиля должен быть snake_case латиницей'); return;",
"        }",
"        api('POST', '/api/v2/graph/profiles', payload).then(function (res) {",
"          toast(res.message || 'Профиль создан');",
"          closeModal(); loadProfiles();",
"        }).catch(function (err) { showError(err.message); });",
"      }",
"    });",
"    var cancelBtn = makeBtn('Отмена', 'btn--ghost', closeModal);",
"    openModal(isEdit ? ('Изменить профиль: ' + data.id) : 'Создание профиля парсера', wrap, [cancelBtn, testBtn, saveBtn]);",
"  }",
"",
"  function renderPreview(container, res) {",
"    var s = res.summary || {};",
"    var rows = ['cabinet','station','card','channel','signal','device'].map(function (k) {",
"      var n = (s[k] && s[k].found) || 0;",
"      return '<tr><td>' + k + '</td><td style=\"text-align:right;\">' + n + '</td></tr>';",
"    }).join('');",
"    var warningsHtml = '';",
"    if (Array.isArray(res.warnings) && res.warnings.length > 0) {",
"      warningsHtml = '<div class=\"graph-warnings\">' + res.warnings.map(function (w) {",
"        var examples = (w.examples || []).slice(0, 3).join(', ');",
"        return '<div class=\"graph-warning-item\">' + esc(w.code) + ' (×' + (w.count || 0) + ')' +",
"          (examples ? ': ' + esc(examples) : '') +",
"          (w.hint ? '<br><span class=\"graph-form__hint\">' + esc(w.hint) + '</span>' : '') +",
"          '</div>';",
"      }).join('') + '</div>';",
"    }",
"    var samples = Array.isArray(res.sample_signals) ? res.sample_signals : [];",
"    var samplesHtml = '';",
"    if (samples.length > 0) {",
"      samplesHtml = '<table class=\"graph-preview-table\" style=\"margin-top:8px;\"><thead><tr><th>tag</th><th>kind</th><th>raw</th><th>addr</th><th>chan</th><th>station</th></tr></thead><tbody>' +",
"        samples.map(function (sg) {",
"          return '<tr>' +",
"            '<td>' + esc(sg.tag || '') + '</td>' +",
"            '<td>' + esc(sg.signal_kind || '') + '</td>' +",
"            '<td>' + esc(sg.signal_kind_raw || '') + '</td>' +",
"            '<td>' + esc(sg.address || '') + '</td>' +",
"            '<td>' + esc(sg.channel || '') + '</td>' +",
"            '<td>' + esc(sg.station_code || '') + '</td>' +",
"          '</tr>';",
"        }).join('') +",
"        '</tbody></table>';",
"    }",
"    container.innerHTML = '<div class=\"graph-preview\"><strong>Если бы профиль применили:</strong>' +",
"      '<table class=\"graph-preview-table\"><tbody>' + rows + '</tbody></table>' +",
"      '<div class=\"graph-form__hint\" style=\"margin-top:4px;\">Связей (оценка): ' + (res.edges_estimate || 0) + '</div>' +",
"      warningsHtml + samplesHtml + '</div>';",
"  }",
"",
"  function confirmDeleteProfile(profileId) {",
"    var wrap = document.createElement('div');",
"    wrap.innerHTML = '<p style=\"margin:0;\">Удалить профиль <strong>' + esc(profileId) + '</strong>?</p>' +",
"      '<p class=\"settings-hint\" style=\"margin-top:6px;\">Граф уже импортированных документов не меняется. Файлы, которые подходили под этот профиль, при будущем импорте будут проверяться на остальные профили.</p>';",
"    var cancelBtn = makeBtn('Отмена', 'btn--ghost', closeModal);",
"    var del = makeBtn('Удалить', 'btn--danger', function () {",
"      api('DELETE', '/api/v2/graph/profiles/' + encodeURIComponent(profileId)).then(function (res) {",
"        toast(res.message || 'Удалено');",
"        closeModal(); loadProfiles();",
"      }).catch(function (err) { toast('Не удалось удалить: ' + err.message, 'error'); });",
"    });",
"    openModal('Удалить профиль?', wrap, [cancelBtn, del]);",
"  }",
"",
"  // ─── Subtabs / event wiring ─────────────────────────────────",
"  function setActiveSubtab(name) {",
"    document.querySelectorAll('[data-graph-subtab]').forEach(function (btn) {",
"      btn.classList.toggle('is-active', btn.getAttribute('data-graph-subtab') === name);",
"    });",
"    document.querySelectorAll('[data-graph-subpanel]').forEach(function (panel) {",
"      panel.classList.toggle('is-active', panel.getAttribute('data-graph-subpanel') === name);",
"    });",
"  }",
"  function bindEvents() {",
"    document.addEventListener('click', function (e) {",
"      var subBtn = e.target.closest('[data-graph-subtab]');",
"      if (subBtn) { setActiveSubtab(subBtn.getAttribute('data-graph-subtab')); return; }",
"      var action = e.target.closest('[data-graph-action]');",
"      if (action) {",
"        var name = action.getAttribute('data-graph-action');",
"        var id = action.getAttribute('data-id');",
"        if (name === 'edit-profile') {",
"          var p = state.profiles.find(function (x) { return x.id === id; });",
"          if (p) openProfileEditor(p);",
"        } else if (name === 'delete-profile') {",
"          confirmDeleteProfile(id);",
"        } else if (name === 'add-alias') {",
"          openAddAliasDialog(id);",
"        } else if (name === 'edit-alias') {",
"          openAliasEditor(id);",
"        } else if (name === 'delete-alias') {",
"          confirmDeleteAlias(id);",
"        } else if (name === 'edit-nodetype') {",
"          var nt = state.nodeTypes.find(function (x) { return x.code === id; });",
"          if (nt) openNodeTypeEditor(nt);",
"        } else if (name === 'delete-nodetype') {",
"          confirmDeleteNodeType(id);",
"        }",
"        return;",
"      }",
"    });",
"    var cBtn = $('graphProfileCreateBtn'); if (cBtn) cBtn.addEventListener('click', function () { openProfileEditor(null); });",
"    var rBtn = $('graphProfileRawBtn'); if (rBtn) rBtn.addEventListener('click', function () { openRawEditor('profiles'); });",
"    var pRef = $('graphProfileRefresh'); if (pRef) pRef.addEventListener('click', loadProfiles);",
"    var aBtn = $('graphAliasCreateBtn'); if (aBtn) aBtn.addEventListener('click', openCreateCanonicalConfirm);",
"    var arBtn = $('graphAliasRawBtn'); if (arBtn) arBtn.addEventListener('click', function () { openRawEditor('aliases'); });",
"    var aRef = $('graphAliasRefresh'); if (aRef) aRef.addEventListener('click', loadAliases);",
"    var ntCreate = $('graphNodeTypeCreateBtn'); if (ntCreate) ntCreate.addEventListener('click', function () { openNodeTypeEditor(null); });",
"    var ntRef = $('graphNodeTypeRefresh'); if (ntRef) ntRef.addEventListener('click', loadNodeTypes);",
"  }",
"",
"  window.__graphTabActivate = function () {",
"    if (state.loaded) return;",
"    state.loaded = true;",
"    ensureModal();",
"    bindEvents();",
"    Promise.all([loadProfiles(), loadAliases(), loadNodeTypes()]);",
"  };",
"})();",
""
  ].join("\n");
}

export function renderSettingsPage({ ICONS, renderLayout }) {
  const graphIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>';
  const contextSidebar = `
    <div class="sidebar-context__title">Разделы настроек</div>
    <nav class="settings-anchors" aria-label="Разделы настроек">
      <a class="settings-anchor" href="#" data-settings-tab-link="models">Модели и облако</a>
      <a class="settings-anchor" href="#" data-settings-tab-link="search">Поиск</a>
      <a class="settings-anchor" href="#" data-settings-tab-link="prompt">Системный промпт</a>
      <a class="settings-anchor" href="#" data-settings-tab-link="services">Сервисы</a>
      <a class="settings-anchor" href="#" data-settings-tab-link="diagnostics">Диагностика</a>
      <a class="settings-anchor" href="#" data-settings-tab-link="graph">Граф знаний</a>
      <a class="settings-anchor" href="#" data-settings-tab-link="maintenance">Обслуживание</a>
      <a class="settings-anchor" href="#" data-settings-tab-link="backups">Бэкапы</a>
    </nav>
    <div class="sidebar-context__footer">
      <span>LOCAL-RAG</span>
      <a href="https://github.com/sergeyxmao/local-rag-platform" target="_blank" rel="noopener">GitHub →</a>
    </div>
  `;

  const headerTabs = `
    <nav class="settings-tabs" id="settingsTabs" role="tablist" aria-label="Разделы настроек">
      <button type="button" class="header-tab is-active" data-settings-tab="models" role="tab">${ICONS.settings}<span>Модели и облако</span></button>
      <button type="button" class="header-tab" data-settings-tab="search" role="tab">${ICONS.search}<span>Поиск</span></button>
      <button type="button" class="header-tab" data-settings-tab="prompt" role="tab">${ICONS.fileText}<span>Промпт</span></button>
      <button type="button" class="header-tab" data-settings-tab="services" role="tab">${ICONS.alertCircle}<span>Сервисы</span></button>
      <button type="button" class="header-tab" data-settings-tab="diagnostics" role="tab">${ICONS.check}<span>Диагностика</span></button>
      <button type="button" class="header-tab" data-settings-tab="graph" role="tab">${graphIcon}<span>Граф знаний</span></button>
      <button type="button" class="header-tab" data-settings-tab="maintenance" role="tab">${ICONS.alertCircle}<span>Обслуживание</span></button>
      <button type="button" class="header-tab" data-settings-tab="backups" role="tab">${ICONS.database}<span>Бэкапы</span></button>
    </nav>
  `;

  const content = `
    <main class="settings-page">
      <div class="settings-tab-panel is-active" data-settings-panel="models">
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

      <!-- #8.1.c.fix-2: вся секция с input[type=password] обёрнута в <form>
           autocomplete="off" + onsubmit="return false" — это убирает
           предупреждение «[DOM] Password field is not contained in a form»
           из DevTools (и для статического Add-form, и для динамического
           списка провайдеров с inline-редактированием). -->
      <form class="settings-card" id="section-cloud" autocomplete="off" onsubmit="return false;">
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
          <p class="settings-hint">Ключи хранятся в БД проекта в plaintext (см. <span class="mono">CLOUD_PROVIDER.md</span>). В API возвращаются замаскированными, в логи не пишутся. В чате выбор провайдера — в шапке. Принимаются только латинские/ASCII-символы — кириллица в ключе вызовет понятную ошибку.</p>
        </div>
      </form>

      <div class="settings-card" id="section-generation">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.settings}<span>Длина ответа модели</span></div>
          <span class="settings-hint">Применяется к облачным провайдерам</span>
        </div>
        <div class="settings-card__body">
          <div class="settings-row">
            <div class="settings-field">
              <label for="cfgGenerationMaxTokens">Максимальная длина ответа модели (токенов)</label>
              <input class="settings-input" id="cfgGenerationMaxTokens" type="number" min="256" max="8192" step="1" />
            </div>
            <div class="settings-field" style="justify-content:end">
              <button type="button" class="btn btn--accent" id="cfgGenerationSave" style="align-self:end">${ICONS.check}<span>Сохранить</span></button>
            </div>
          </div>
          <div class="settings-banner" id="cfgGenerationBanner"></div>
          <p class="settings-hint">Сколько токенов модель может потратить на ответ. Для reasoning-моделей (например <span class="mono">deepseek-v4-pro</span>) нужен запас — рассуждение тратит токены из этого лимита, и при низком значении ответ может прийти пустым. Допустимый диапазон <strong>256–8192</strong>, рекомендуется <strong>4096</strong> и выше. Больший лимит — дольше ответ и больше расход токенов облака.</p>
        </div>
      </div>
      </div>

      <div class="settings-tab-panel" data-settings-panel="services">
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

      <div class="settings-card" id="section-ocr">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.fileText}<span>OCR (распознавание сканов)</span></div>
          <span class="settings-hint" id="cfgOcrAvailability">проверяется…</span>
        </div>
        <div class="settings-card__body">
          <label class="settings-toggle">
            <input type="checkbox" id="cfgOcrAutoEmpty" />
            <span>Включить автоматический OCR для PDF-страниц без текста</span>
            <span class="help-tip" tabindex="0" aria-label="Подсказка"><span class="help-tip__icon" aria-hidden="true">?</span><span class="help-tip__bubble" role="tooltip">По умолчанию kb-api сначала пытается извлечь текст из PDF напрямую. Если страница оказалась пустой (например, скан в виде картинки) — на ней запускается OCR через tesseract. Быстро и нужно почти всегда — снимать галочку, только если все ваши PDF гарантированно с цифровым текстом.</span></span>
          </label>
          <label class="settings-toggle">
            <input type="checkbox" id="cfgOcrAll" />
            <span>OCR для всех страниц PDF (медленно)</span>
            <span class="help-tip" tabindex="0" aria-label="Подсказка"><span class="help-tip__icon" aria-hidden="true">?</span><span class="help-tip__bubble" role="tooltip">Включает OCR даже для страниц, где текст уже извлечён напрямую. Полезно для смешанных PDF, где часть текста встроенная, а часть — картинки (схемы, штампы, рукописные пометки на чертежах АСУ ТП). Замедляет импорт в 2–5 раз. С #8.1.c.fix-2 включён по умолчанию — владелец работает в основном со сканами.</span></span>
          </label>
          <div class="settings-banner" id="cfgOcrBanner"></div>
          <div class="settings-actions">
            <button type="button" class="btn btn--accent" id="cfgOcrSave">${ICONS.check}<span>Сохранить</span></button>
          </div>
          <p class="settings-hint">OCR работает локально через <span class="mono">tesseract</span> (rus+eng). Действует только для новых документов; для уже загруженных — кнопка «Переиндексировать» в действиях документа на странице «База знаний → Документы».</p>
        </div>
      </div>

      <div class="settings-card" id="section-indexing">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.refresh}<span>Параллелизм индексации</span></div>
          <span class="settings-hint" id="cfgIndexingStatus"></span>
        </div>
        <div class="settings-card__body">
          <div class="settings-row">
            <div class="settings-field">
              <label for="cfgIndexingConcurrency">Сколько документов обрабатывать одновременно</label>
              <input class="settings-input" id="cfgIndexingConcurrency" type="number" min="1" max="4" step="1" />
            </div>
            <div class="settings-field" style="justify-content:end">
              <button type="button" class="btn btn--accent" id="cfgIndexingSave" style="align-self:end">${ICONS.check}<span>Сохранить</span></button>
            </div>
          </div>
          <div class="settings-banner" id="cfgIndexingBanner"></div>
          <p class="settings-hint">Сколько документов одновременно проходят полный pipeline индексации (text/OCR → chunking → embeddings → Qdrant). На слабом CPU держите <strong>1</strong> — параллельный pipeline конкурирует за CPU, память и канал к Ollama, что замедляет общее время. На мощной машине можно повысить до 2–3. Максимум — 4. Изменения применяются мгновенно, текущие задачи не прерываются.</p>
        </div>
      </div>
      </div>

      <div class="settings-tab-panel" data-settings-panel="diagnostics">
      <div class="settings-card" id="section-diagnostics">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.check}<span>Готовность системы</span></div>
          <button type="button" class="btn btn--accent" id="cfgDiagRun">${ICONS.refresh}<span>Запустить проверки</span></button>
        </div>
        <div class="settings-card__body">
          <div class="settings-banner" id="cfgDiagBanner"></div>
          <p class="settings-hint" id="cfgDiagSummary">Нажмите «Запустить проверки», чтобы пройтись по 15 пунктам готовности.</p>
          <div class="diag-grid" id="cfgDiagList"></div>
        </div>
      </div>
      </div>

      <div class="settings-tab-panel" data-settings-panel="graph">
        <div class="settings-card" id="section-graph">
          <div class="settings-card__head">
            <div class="settings-card__title">${graphIcon}<span>Граф знаний — конфигурация парсера</span></div>
            <span class="settings-hint">Файлы: <span class="mono">config/graph-parsers.yaml</span>, <span class="mono">config/graph-aliases.yaml</span></span>
          </div>
          <div class="settings-card__body" style="gap:14px;">
            <div class="graph-subtabs" role="tablist" aria-label="Подвкладки графа">
              <button type="button" class="graph-subtab is-active" data-graph-subtab="profiles" role="tab">Профили парсера</button>
              <button type="button" class="graph-subtab" data-graph-subtab="aliases" role="tab">Алиасы signal_kind</button>
              <button type="button" class="graph-subtab" data-graph-subtab="nodetypes" role="tab">Типы узлов</button>
            </div>
            <p class="settings-hint">
              Профили решают, как читать XLSX с таблицами сигналов. Алиасы — как нормализовать значения signal_kind
              (AI/AO/DI/DO/RTD/FI/RS). После любого сохранения kb-api автоматически перечитывает YAML — рестарт не нужен.
              Резервные копии хранятся в <span class="mono">data/config-backups/</span> (последние 10).
            </p>

            <div class="graph-subtab-panel is-active" data-graph-subpanel="profiles">
              <div class="settings-actions" style="margin-bottom:8px;">
                <button type="button" class="btn btn--accent" id="graphProfileCreateBtn">${ICONS.plus}<span>Создать профиль</span></button>
                <button type="button" class="btn" id="graphProfileRawBtn">Редактировать YAML напрямую</button>
                <button type="button" class="btn btn--ghost btn--icon" id="graphProfileRefresh" aria-label="Обновить">${ICONS.refresh}</button>
              </div>
              <div class="settings-banner" id="graphProfileBanner"></div>
              <div id="graphProfileList" style="display:flex;flex-direction:column;gap:8px;">
                <div class="settings-hint">Загрузка…</div>
              </div>
            </div>

            <div class="graph-subtab-panel" data-graph-subpanel="aliases">
              <div class="settings-actions" style="margin-bottom:8px;">
                <button type="button" class="btn" id="graphAliasRawBtn">Редактировать YAML напрямую</button>
                <button type="button" class="btn btn--ghost btn--icon" id="graphAliasRefresh" aria-label="Обновить">${ICONS.refresh}</button>
              </div>
              <p class="settings-hint" style="margin:0;">
                Чтобы добавить ещё одну форму написания к уже существующему типу — нажмите
                <strong>«+ Добавить алиас»</strong> прямо в карточке нужного значения (AI/AO/DI/DO/…).
                Создание <em>нового</em> канонического значения — операция редкая, она спрятана в
                «Расширенных возможностях» внизу.
              </p>
              <div class="settings-banner" id="graphAliasBanner"></div>
              <div id="graphAliasList" style="display:flex;flex-direction:column;gap:8px;">
                <div class="settings-hint">Загрузка…</div>
              </div>
              <details class="graph-advanced" id="graphAliasAdvanced">
                <summary>Расширенные возможности</summary>
                <div class="graph-advanced__body">
                  <div class="graph-advanced__warn">
                    Создание нового канонического значения нужно, если вы хотите добавить
                    <strong>новый ТИП сигналов</strong> (например, <span class="mono">PFC</span>,
                    <span class="mono">HART</span> или специфичный для другой предметной области).
                    Обычно нужно добавить алиас к существующему AI/AO/DI/DO выше.
                  </div>
                  <div>
                    <button type="button" class="btn btn--accent" id="graphAliasCreateBtn">${ICONS.plus}<span>Создать новое каноническое значение</span></button>
                  </div>
                </div>
              </details>
            </div>

            <div class="graph-subtab-panel" data-graph-subpanel="nodetypes">
              <div class="settings-actions" style="margin-bottom:8px;">
                <button type="button" class="btn btn--accent" id="graphNodeTypeCreateBtn">${ICONS.plus}<span>Создать тип</span></button>
                <button type="button" class="btn btn--ghost btn--icon" id="graphNodeTypeRefresh" aria-label="Обновить">${ICONS.refresh}</button>
              </div>
              <p class="settings-hint" style="margin:0;">
                Типы узлов используются в графе знаний (поле <span class="mono">graph_nodes.type</span>)
                и в чекбоксах <strong>builds</strong> wizard'а профилей парсера. Системные типы
                (<span class="mono">object</span>, <span class="mono">cabinet</span>, <span class="mono">station</span>,
                <span class="mono">card</span>, <span class="mono">channel</span>, <span class="mono">signal</span>,
                <span class="mono">device</span>) встроены и удалить их нельзя; кастомные —
                добавляйте под свою предметную область. Парсер XLSX пока учитывает только семь
                системных кодов; неизвестные коды попадают в <span class="mono">graph_report.warnings</span>
                под кодом <span class="mono">unknown_node_type</span>.
              </p>
              <div id="graphNodeTypeList" style="display:flex;flex-direction:column;gap:8px;">
                <div class="settings-hint">Загрузка…</div>
              </div>
            </div>
          </div>
        </div>

        <div class="kb-modal-backdrop" id="graphModalBackdrop">
          <div class="kb-modal" role="dialog" aria-modal="true" style="max-width:840px;">
            <div class="kb-modal__head">
              <div class="kb-modal__title" id="graphModalTitle">Окно</div>
              <button type="button" class="btn btn--ghost btn--icon" id="graphModalCloseBtn" aria-label="Закрыть">${ICONS.x}</button>
            </div>
            <div class="kb-modal__body" id="graphModalBody"></div>
            <div class="kb-modal__foot" id="graphModalFoot"></div>
          </div>
        </div>
      </div>

      <div class="settings-tab-panel" data-settings-panel="search">
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

      <div class="settings-card" id="section-reranking">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.search}<span>Reranking — модель оценки релевантности</span></div>
          <span class="settings-hint" id="rerankingStatusHint">проверка…</span>
        </div>
        <div class="settings-card__body">
          <p class="settings-hint">
            Reranker переоценивает кандидатов после semantic+BM25 и возвращает наиболее релевантные.
            Если выбранный режим недоступен (нет ключа, сервис лежит, сеть упала) — автоматически
            используется эвристика, и это видно в бейдже под ответом.
          </p>
          <div class="settings-row settings-row--triple">
            <div class="settings-field">
              <label for="cfgRerankProvider">Режим reranking</label>
              <select class="settings-select" id="cfgRerankProvider">
                <option value="heuristic">Эвристика (без модели, быстро)</option>
                <option value="local">Локальный bge-reranker (приватно, на CPU)</option>
                <option value="jina">Jina API (облако, требует ключ)</option>
              </select>
              <span class="settings-hint" id="cfgRerankProviderHint"></span>
            </div>
            <div class="settings-field">
              <label for="cfgRerankLocalUrl">URL локального reranker-сервиса</label>
              <input type="text" class="settings-input" id="cfgRerankLocalUrl" placeholder="http://localrag-reranker:8090" autocomplete="off" />
              <span class="settings-hint">Дефолт берётся из <span class="mono">RERANKER_LOCAL_URL</span>.</span>
            </div>
            <div class="settings-field">
              <label for="cfgRerankJinaKey">API-ключ Jina</label>
              <input type="password" class="settings-input" id="cfgRerankJinaKey" placeholder="jina_..." autocomplete="off" />
              <span class="settings-hint">Используется только в режиме «Jina». Хранится в БД, при чтении маскируется.</span>
            </div>
          </div>
          <div class="settings-banner settings-banner--warn" id="rerankPrivacyBanner" style="display:none;">
            ⚠️ Режим «Jina» отправляет тексты найденных фрагментов в облачный API. В режимах
            «Локальный» и «Эвристика» документы наружу НЕ отправляются.
          </div>
          <div id="rerankServiceStatus" style="display:flex;flex-direction:column;gap:6px;"></div>
          <div class="settings-actions">
            <button type="button" class="btn btn--accent" id="cfgRerankSave">${ICONS.check}<span>Сохранить</span></button>
            <button type="button" class="btn btn--ghost" id="cfgRerankCheck">Проверить доступность</button>
            <button type="button" class="btn btn--ghost" id="cfgRerankClearJinaKey">Удалить ключ Jina</button>
          </div>
          <div class="settings-banner" id="rerankBanner"></div>
        </div>
      </div>

      <div class="settings-card" id="section-hyde">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.search}<span>HyDE — гипотетический ответ перед поиском</span></div>
          <span class="settings-hint" id="hydeStatus">выкл</span>
        </div>
        <div class="settings-card__body">
          <p class="settings-hint">
            HyDE (Hypothetical Document Embeddings): перед semantic-поиском по вашему вопросу
            генерируется гипотетический параграф документа, и эмбеддинг считается по нему,
            а не по сырому вопросу. Лечит «промах слов» — когда в техдоке термины написаны
            не так, как формулирует пользователь. BM25-поиск по-прежнему идёт по сырому
            вопросу. На каждый запрос — один доп. вызов облачной модели (рекомендуем «flash»),
            +2-5 секунд к ответу. По умолчанию выключен — включайте под конкретные сложные
            запросы. При ошибке/таймауте автоматически делается fallback на сырой вопрос,
            это видно в бейдже «HyDE: fallback» под ответом.
          </p>
          <div class="settings-row settings-row--triple">
            <div class="settings-field">
              <label class="settings-toggle" for="cfgHydeEnabled">
                <input type="checkbox" id="cfgHydeEnabled" /> HyDE включён
              </label>
              <span class="settings-hint">Если выключен — semantic-поиск идёт по сырому вопросу, как раньше.</span>
            </div>
            <div class="settings-field">
              <label for="cfgHydeProviderId">Провайдер для HyDE</label>
              <select class="settings-select" id="cfgHydeProviderId">
                <option value="">— не выбран —</option>
              </select>
              <span class="settings-hint">Любой из «Облачные провайдеры». Рекомендуем быстрый (flash/turbo), не reasoning.</span>
            </div>
            <div class="settings-field">
              <label for="cfgHydeModel">Модель (опционально)</label>
              <input type="text" class="settings-input settings-input--mono" id="cfgHydeModel" placeholder="по умолчанию — модель провайдера" autocomplete="off" />
              <span class="settings-hint">Перебивает модель провайдера. Оставьте пустым, чтобы взять из настроек провайдера.</span>
            </div>
          </div>
          <div class="settings-row">
            <div class="settings-field">
              <label for="cfgHydeMaxTokens">maxTokens</label>
              <input type="number" class="settings-input" id="cfgHydeMaxTokens" min="50" max="2000" />
              <span class="settings-hint">Длина гипотетического параграфа. Рекомендуем 300-500.</span>
            </div>
            <div class="settings-field">
              <label for="cfgHydeTimeoutMs">timeoutMs</label>
              <input type="number" class="settings-input" id="cfgHydeTimeoutMs" min="2000" max="60000" />
              <span class="settings-hint">Таймаут на HyDE-вызов. По истечении — fallback на сырой вопрос.</span>
            </div>
          </div>
          <div class="settings-field">
            <label for="cfgHydePrompt">Промпт HyDE <span class="settings-help" title="Это один из трёх промптов системы. HyDE — срабатывает ПРИ ВОПРОСЕ пользователя: переписывает запрос в гипотетический параграф документа для semantic-поиска. Не путать с промптами контекстного обогащения, которые срабатывают при импорте документа.">?</span></label>
            <textarea class="settings-input settings-input--mono" id="cfgHydePrompt" rows="10"></textarea>
            <span class="settings-hint">Срабатывает при вопросе пользователя — переписывает запрос для поиска (не при импорте).</span>
            <span class="settings-hint" id="cfgHydePromptStatus">значение по умолчанию</span>
          </div>
          <div class="settings-actions">
            <button type="button" class="btn btn--accent" id="cfgHydeSave">${ICONS.check}<span>Сохранить</span></button>
            <button type="button" class="btn btn--ghost" id="cfgHydePromptReset">Сбросить промпт к универсальному</button>
          </div>
          <div class="settings-banner" id="hydeBanner"></div>
        </div>
      </div>

      <div class="settings-card" id="section-contextual-enrichment">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.fileText}<span>Контекстное обогащение чанков (Слой 2)</span></div>
          <span class="settings-hint" id="ceStatus">выкл</span>
        </div>
        <div class="settings-card__body">
          <p class="settings-hint">
            При импорте текстового документа (docx/txt/md) каждый фрагмент обогащается
            облачным LLM: к нему добавляется краткий контекст «где в документе и о чём»,
            теги и краткое описание. В поиск (semantic + BM25) идёт только <b>контекст + текст</b>;
            теги и описание — лишь метаданные для отображения. Текст фрагмента НЕ переписывается.
            Срабатывает ТОЛЬКО при импорте/переимпорте текстовых документов (PDF не затрагивается).
            +1 вызов облачной модели на каждый фрагмент. При ошибке/таймауте/без провайдера —
            фрагмент индексируется без обогащения (graceful fallback). По умолчанию выключено.
          </p>
          <div class="settings-row settings-row--triple">
            <div class="settings-field">
              <label class="settings-toggle" for="cfgCeEnabled">
                <input type="checkbox" id="cfgCeEnabled" /> Обогащение включено
                <span class="settings-help" title="Включает контекстное обогащение фрагментов при импорте. Если выключено — фрагменты индексируются как раньше, без контекста и тегов.">?</span>
              </label>
              <span class="settings-hint">Срабатывает при импорте/переимпорте текстовых документов.</span>
            </div>
            <div class="settings-field">
              <label for="cfgCeProviderId">Провайдер для обогащения <span class="settings-help" title="Какой облачный провайдер (из «Облачные провайдеры») использовать для генерации контекста и тегов при импорте.">?</span></label>
              <select class="settings-select" id="cfgCeProviderId">
                <option value="">— не выбран —</option>
              </select>
              <span class="settings-hint">Рекомендуем быстрый (flash/turbo), не reasoning — вызов идёт на каждый фрагмент.</span>
            </div>
            <div class="settings-field">
              <label for="cfgCeModel">Модель для обогащения <span class="settings-help" title="Перебивает модель провайдера для обогащения. Для обогащения выбирайте быструю flash/turbo-модель — вызов идёт на КАЖДЫЙ фрагмент, reasoning-pro модели будут дорогими и медленными. Выберите из списка-подсказки или впишите свою. Пусто — возьмётся модель провайдера.">?</span></label>
              <input type="text" class="settings-input settings-input--mono" id="cfgCeModel" list="cfgCeModelSuggestions" placeholder="напр. deepseek-v4-flash" autocomplete="off" />
              <datalist id="cfgCeModelSuggestions">
                <option value="deepseek-v4-flash"></option>
                <option value="deepseek-chat"></option>
                <option value="gemini-2.5-flash"></option>
                <option value="gpt-4o-mini"></option>
                <option value="qwen-turbo"></option>
              </datalist>
              <span class="settings-hint">Для обогащения выбирайте быструю flash/turbo-модель — вызов идёт на каждый фрагмент. Выберите из списка или впишите свою; пусто — модель провайдера.</span>
            </div>
          </div>
          <div class="settings-row">
            <div class="settings-field">
              <label for="cfgCeMaxTokens">maxTokens <span class="settings-help" title="Максимальная длина ответа модели на один фрагмент (контекст + теги + описание в JSON). Рекомендуем 800–1500.">?</span></label>
              <input type="number" class="settings-input" id="cfgCeMaxTokens" min="200" max="4000" />
              <span class="settings-hint">Длина ответа модели на фрагмент. Рекомендуем 800–1500.</span>
            </div>
            <div class="settings-field">
              <label for="cfgCeTimeoutMs">timeoutMs <span class="settings-help" title="Таймаут на один вызов обогащения. По истечении — фрагмент индексируется без обогащения (fallback), импорт не падает.">?</span></label>
              <input type="number" class="settings-input" id="cfgCeTimeoutMs" min="5000" max="120000" />
              <span class="settings-hint">Таймаут на вызов. По истечении — fallback без обогащения.</span>
            </div>
          </div>
          <div class="settings-field">
            <label for="cfgCeContextPrompt">Промпт контекста <span class="settings-help" title="Один из трёх промптов системы. ПРОМПТ КОНТЕКСТА — срабатывает ПРИ ИМПОРТЕ документа: добавляет к фрагменту краткий контекст (где в документе и о чём). Идёт в поиск вместе с текстом. Не путать с HyDE (срабатывает при вопросе) и промптом тегов/описания.">?</span></label>
            <textarea class="settings-input settings-input--mono" id="cfgCeContextPrompt" rows="8"></textarea>
            <span class="settings-hint">Срабатывает при импорте документа — добавляет контекст к фрагментам (идёт в поиск).</span>
            <span class="settings-hint" id="cfgCeContextPromptStatus">значение по умолчанию</span>
          </div>
          <div class="settings-field">
            <label for="cfgCeMetaPrompt">Промпт тегов/описания <span class="settings-help" title="Один из трёх промптов системы. ПРОМПТ ТЕГОВ/ОПИСАНИЯ — срабатывает ПРИ ИМПОРТЕ: генерирует теги и краткое описание фрагмента. Это только метаданные для отображения/фильтров — в поиск (вектор и BM25) НЕ идут. Не путать с HyDE и промптом контекста.">?</span></label>
            <textarea class="settings-input settings-input--mono" id="cfgCeMetaPrompt" rows="6"></textarea>
            <span class="settings-hint">Срабатывает при импорте — генерирует теги и описание (метаданные, в поиск не идут).</span>
            <span class="settings-hint" id="cfgCeMetaPromptStatus">значение по умолчанию</span>
          </div>
          <div class="settings-actions">
            <button type="button" class="btn btn--accent" id="cfgCeSave">${ICONS.check}<span>Сохранить</span></button>
            <button type="button" class="btn btn--ghost" id="cfgCeContextPromptReset">Сбросить промпт контекста</button>
            <button type="button" class="btn btn--ghost" id="cfgCeMetaPromptReset">Сбросить промпт тегов/описания</button>
          </div>
          <div class="settings-banner" id="ceBanner"></div>
        </div>
      </div>
      </div>

      <div class="settings-tab-panel" data-settings-panel="prompt">
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
      </div>

      <div class="settings-tab-panel" data-settings-panel="maintenance">
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

      <div class="settings-card" id="section-theme">
        <div class="settings-card__head">
          <div class="settings-card__title">${ICONS.moon}<span>Тема интерфейса</span></div>
          <span class="settings-hint">Личный выбор — в шапке боковой панели</span>
        </div>
        <div class="settings-card__body">
          <div class="settings-row">
            <div class="settings-field">
              <label for="cfgThemeDefault">Тема по умолчанию для новых пользователей</label>
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
      </div>

      <div class="settings-tab-panel" data-settings-panel="backups">
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
    headerTabs,
    contextSidebar,
    pageScript: renderSettingsScript(initialStateJson, renderGraphTabScript()),
    bodyClass: "page-settings",
  }).replace("</style>", `${renderSettingsCss()}</style>`);
}
