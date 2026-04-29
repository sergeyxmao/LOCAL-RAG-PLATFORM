import { renderNodesHtml } from "./uiNodes.js";

function renderConsultantHtml() {
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Консультант по документам</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f4f6f8;
      --panel: #ffffff;
      --panel-2: #f8fafb;
      --text: #18212b;
      --muted: #687482;
      --accent: #176b87;
      --accent-2: #0f8a63;
      --line: #dbe2e8;
      --ok: #15845f;
      --shadow: 0 16px 38px rgba(25, 35, 45, 0.08);
      --radius: 8px;
    }

    * { box-sizing: border-box; }
    html, body { min-height: 100%; }
    body {
      margin: 0;
      font-family: "Segoe UI", Tahoma, sans-serif;
      background: var(--bg);
      color: var(--text);
      letter-spacing: 0;
    }
    .app-frame {
      min-height: 100vh;
      display: grid;
      grid-template-rows: auto 1fr;
    }
    .topbar {
      min-height: 58px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      padding: 0 22px;
      border-bottom: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.94);
      position: sticky;
      top: 0;
      z-index: 5;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 220px;
      font-weight: 700;
      color: var(--text);
      text-decoration: none;
    }
    .brand-mark {
      width: 28px;
      height: 28px;
      border-radius: 7px;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, #113a4a, #24a07b);
      color: #fff;
      font-size: 13px;
      font-weight: 800;
    }
    .shell {
      width: 100%;
      padding: 14px;
    }
    .main-nav {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .nav-link {
      color: #26323e;
      text-decoration: none;
      min-height: 34px;
      padding: 7px 11px;
      border-radius: 7px;
      border: 1px solid var(--line);
      background: #fff;
      display: inline-flex;
      align-items: center;
    }
    .nav-link.active {
      border-color: transparent;
      background: var(--text);
      color: #fff;
    }
    .workspace {
      --library-width: clamp(300px, 18vw, 360px);
      display: grid;
      grid-template-columns: var(--library-width) 8px minmax(0, 1fr);
      gap: 10px;
      height: calc(100vh - 86px);
      min-height: 620px;
      transition: grid-template-columns 0.18s ease;
    }
    body.left-collapsed .workspace {
      grid-template-columns: 48px 0 minmax(0, 1fr);
    }
    .workspace-resizer {
      cursor: col-resize;
      border-radius: 999px;
      min-width: 8px;
      min-height: 0;
      align-self: stretch;
      position: relative;
    }
    .workspace-resizer::before {
      content: "";
      position: absolute;
      inset: 8px 2px;
      border-radius: 999px;
      background: transparent;
      transition: background 0.12s ease;
    }
    .workspace-resizer:hover::before,
    body.resizing-library .workspace-resizer::before {
      background: #bfd0da;
    }
    body.left-collapsed .workspace-resizer {
      display: none;
    }
    .left-rail,
    .query-panel,
    .answer-sheet,
    .source-strip {
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: var(--panel);
      box-shadow: var(--shadow);
    }
    .left-rail {
      display: grid;
      grid-template-rows: auto 1fr;
      overflow: hidden;
      min-height: 0;
    }
    .rail-head,
    .section-head {
      padding: 14px;
      border-bottom: 1px solid var(--line);
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
    }
    .rail-head h2,
    .section-head h2,
    .answer-sheet h2 {
      margin: 0;
      font-size: 18px;
    }
    .panel-toggle {
      width: 32px;
      min-width: 32px;
      min-height: 32px;
      padding: 0;
      border: 1px solid var(--line);
      border-radius: 7px;
      background: var(--panel-2);
      color: #26323e;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      line-height: 1;
    }
    .rail-body {
      padding: 14px;
      display: grid;
      grid-template-rows: auto auto minmax(0, 1fr);
      gap: 14px;
      align-content: stretch;
      overflow: hidden;
      min-height: 0;
    }
    .library-note,
    .hint {
      color: var(--muted);
      font-size: 13px;
      line-height: 1.45;
    }
    .work-main {
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      gap: 14px;
      min-width: 0;
      min-height: 0;
    }
    .query-panel {
      padding: 12px 14px;
    }
    .question-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      margin-bottom: 7px;
    }
    .question-label {
      margin: 0;
      color: var(--text);
      font-size: 18px;
      font-weight: 800;
      line-height: 1.25;
    }
    .filter-grid {
      display: grid;
      grid-template-columns: 190px 190px minmax(180px, 1fr) 180px 120px;
      gap: 12px;
      align-items: end;
      margin-top: 12px;
    }
    .hidden-filters {
      display: none;
    }
    .consult-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 14px;
      min-height: 0;
      transition: grid-template-columns 0.18s ease;
    }
    body.sources-collapsed .consult-grid {
      grid-template-columns: minmax(0, 1fr) 48px;
    }
    .answer-sheet {
      padding: 0;
      overflow: hidden;
      min-height: 0;
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
    }
    .answer-head {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      margin-bottom: 0;
      padding: 12px 14px;
      border-bottom: 1px solid var(--line);
    }
    .view-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }
    .view-tab {
      width: auto;
      min-height: 34px;
      border: 1px solid var(--line);
      border-radius: 7px;
      background: var(--panel-2);
      color: #26323e;
      padding: 7px 12px;
    }
    .view-tab.active {
      border-color: transparent;
      background: var(--text);
      color: #fff;
    }
    .tab-panel {
      display: none;
      min-height: 0;
      overflow: auto;
      padding: 18px;
    }
    .tab-panel.active {
      display: block;
    }
    .tab-panel.sources-active {
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      gap: 12px;
      overflow: hidden;
    }
    .source-strip {
      overflow: hidden;
      display: grid;
      grid-template-rows: auto 1fr;
      min-height: 0;
    }
    .source-list {
      padding: 12px;
      overflow: auto;
    }
    .source-panel-head {
      display: grid;
      gap: 4px;
      padding: 12px;
      border: 1px solid #d7e6ed;
      border-radius: 7px;
      background: #f6fbfd;
    }
    .source-panel-head h2,
    .source-panel-head p {
      margin: 0;
    }
    .source-panel-head p {
      color: var(--muted);
      font-size: 13px;
      line-height: 1.45;
    }
    #sourcesPanel .source-list {
      padding: 0;
    }
    .source-title-block {
      min-width: 0;
    }
    .source-caption {
      margin-top: 4px;
      color: var(--muted);
      font-size: 12px;
      line-height: 1.4;
    }
    label {
      display: block;
      font-size: 12px;
      color: var(--muted);
      margin-bottom: 5px;
    }
    input, textarea, button, select {
      width: 100%;
      border-radius: 7px;
      border: 1px solid var(--line);
      background: #fff;
      color: var(--text);
      font: inherit;
    }
    input, textarea, select {
      min-height: 36px;
      padding: 8px 10px;
    }
    textarea {
      min-height: 62px;
      resize: vertical;
      line-height: 1.5;
    }
    button {
      min-height: 38px;
      padding: 8px 12px;
      cursor: pointer;
      background: var(--text);
      color: #fff;
      border: none;
      font-weight: 600;
    }
    button.secondary {
      border: 1px solid var(--line);
      background: var(--panel-2);
      color: #26323e;
    }
    button:disabled {
      cursor: wait;
      opacity: 0.62;
    }
    .actions {
      display: flex;
      gap: 10px;
      margin-top: 0;
      width: auto;
      flex-shrink: 0;
    }
    .actions button {
      width: auto;
      min-width: 150px;
      white-space: nowrap;
    }
    .status {
      margin-top: 12px;
      color: var(--muted);
      min-height: 20px;
      font-size: 13px;
    }
    .status.ok {
      color: var(--ok);
    }
    .answer {
      white-space: pre-wrap;
      line-height: 1.6;
    }
    .summary {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      min-height: 24px;
    }
    .summary button {
      width: auto;
      border: 1px solid var(--line);
      background: #eefaff;
      color: var(--accent);
      border-radius: 7px;
      padding: 6px 10px;
      cursor: pointer;
      min-height: 30px;
      font-size: 12px;
    }
    .result {
      padding: 12px;
      border-radius: 7px;
      border: 1px solid var(--line);
      background: #fff;
      margin-bottom: 10px;
    }
    .source-card-head {
      display: grid;
      gap: 6px;
      margin-bottom: 8px;
    }
    .result h3 {
      margin: 0;
      font-size: 15px;
      line-height: 1.3;
      overflow-wrap: anywhere;
    }
    .source-meta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
      margin-bottom: 8px;
    }
    .source-page,
    .source-kind {
      border: 1px solid #c9d5de;
      border-radius: 999px;
      color: #394653;
      background: var(--panel-2);
      padding: 3px 7px;
      font-size: 12px;
      white-space: nowrap;
    }
    .source-kind {
      border-color: #bde3f0;
      background: #eefaff;
      color: #075976;
    }
    .meta,
    .source-path {
      color: var(--muted);
      font-size: 13px;
      line-height: 1.5;
      margin-bottom: 10px;
    }
    .source-path {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .source-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      margin-bottom: 8px;
    }
    .source-link,
    .doc-card-button {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      border: 1px solid #b9ded0;
      border-radius: 7px;
      background: #eaf8f1;
      color: #0d6f4f;
      padding: 4px 8px;
      font-size: 12px;
      font-weight: 650;
      text-decoration: none;
      width: auto;
    }
    .source-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 8px;
    }
    .source-reason {
      border-left: 3px solid #b9ded0;
      background: #f3fbf7;
      color: #2f4454;
      border-radius: 7px;
      padding: 8px 10px;
      font-size: 13px;
      line-height: 1.45;
      margin-bottom: 8px;
    }
    .excerpt-label {
      color: var(--muted);
      font-size: 12px;
      font-weight: 750;
      margin: 4px 0 6px;
    }
    .excerpt {
      border: 1px solid var(--line);
      border-radius: 7px;
      background: #fbfcfd;
      line-height: 1.55;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      padding: 10px;
      font-size: 14px;
    }
    .source-full {
      margin-top: 8px;
    }
    .source-full summary {
      cursor: pointer;
      color: var(--accent);
      font-size: 13px;
      font-weight: 650;
    }
    .source-full .excerpt {
      margin-top: 8px;
    }
    .link {
      color: var(--accent);
      text-decoration: none;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      padding: 3px 8px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: var(--panel-2);
      color: #394653;
      margin-right: 6px;
      margin-bottom: 6px;
      font-size: 12px;
    }
    .empty-state {
      border: 1px dashed #c9d5de;
      border-radius: 7px;
      padding: 14px;
      background: #fbfdfe;
      color: var(--muted);
    }
    .loading-state {
      border-style: solid;
      background: #f4fafc;
    }
    .empty-state strong {
      color: var(--text);
    }
    .library-actions {
      display: grid;
      gap: 10px;
    }
    .scope-panel {
      border: 1px solid #cbe7f0;
      border-radius: 7px;
      background: #f3fbfe;
      padding: 10px;
      display: grid;
      gap: 8px;
    }
    .scope-status {
      color: #0f5d78;
      font-size: 12px;
      line-height: 1.35;
      overflow-wrap: anywhere;
    }
    .scope-toggle {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #394653;
      font-size: 13px;
      margin: 0;
    }
    .scope-toggle input {
      width: 16px;
      min-height: 16px;
      padding: 0;
    }
    .library-counter {
      display: inline-flex;
      width: fit-content;
      gap: 8px;
      align-items: center;
      color: #0f5d78;
      background: #eefaff;
      border: 1px solid #cbe7f0;
      border-radius: 999px;
      padding: 4px 9px;
      font-size: 13px;
      line-height: 1.35;
      margin-top: 6px;
      font-weight: 650;
    }
    .selection-label {
      color: var(--muted);
      font-size: 12px;
    }
    .library-action-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 112px;
      gap: 8px;
      align-items: center;
    }
    .all-docs-btn,
    .apply-docs-btn {
      min-height: 38px;
    }
    .document-selection-status {
      display: none;
      min-height: 34px;
      border: 1px solid var(--line);
      border-radius: 7px;
      background: var(--panel-2);
      color: var(--muted);
      padding: 7px 9px;
      font-size: 12px;
      line-height: 1.35;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .all-docs-btn.active,
    .doc-pick.selected {
      border-color: #8fc7d7;
      background: #eefaff;
      color: #26323e;
    }
    .document-results {
      display: grid;
      gap: 8px;
      max-height: none;
      overflow: auto;
      min-height: 0;
      align-content: start;
      padding-right: 2px;
    }
    .document-results.compact {
      max-height: none;
    }
    .doc-pick {
      width: 100%;
      text-align: left;
      border: 1px solid var(--line);
      border-radius: 7px;
      background: #fff;
      color: var(--text);
      padding: 9px 10px;
      min-height: auto;
      font-weight: 600;
      cursor: default;
    }
    .doc-pick.applied {
      border-color: #b9ded0;
      background: #f4fbf7;
    }
    .doc-pick-head {
      display: block;
    }
    .doc-pick-title {
      display: block;
      width: 100%;
      overflow-wrap: anywhere;
      line-height: 1.25;
    }
    .doc-pick-action,
    .doc-open-action {
      min-width: 74px;
      width: auto;
      min-height: 26px;
      padding: 4px 8px;
      border: 1px solid var(--line);
      background: var(--panel-2);
      color: #26323e;
      font-size: 12px;
      flex-shrink: 0;
    }
    .doc-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
      margin-top: 9px;
    }
    .doc-open-action {
      border-color: #b9ded0;
      background: #eaf8f1;
      color: #0d6f4f;
    }
    .doc-open-action:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
    .doc-pick.selected .doc-pick-action,
    .doc-pick.applied .doc-pick-action {
      border-color: #8fc7d7;
      background: #fff;
    }
    .doc-pick small {
      display: block;
      margin-top: 4px;
      color: var(--muted);
      font-weight: 400;
      line-height: 1.35;
    }
    .doc-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
      margin-top: 0;
      color: var(--muted);
      font-size: 12px;
      font-weight: 400;
    }
    .doc-page-badge {
      border: 1px solid #c9d5de;
      border-radius: 999px;
      background: var(--panel-2);
      color: #394653;
      padding: 2px 7px;
    }
    .doc-node-line,
    .source-node-line {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
      margin-top: 8px;
      color: var(--muted);
      font-size: 12px;
      font-weight: 500;
    }
    .source-node-line {
      margin-top: 0;
      margin-bottom: 8px;
    }
    .doc-node-badge {
      display: inline-flex;
      align-items: center;
      border: 1px solid #cbe7f0;
      border-radius: 999px;
      background: #f3fbfe;
      color: #0f5d78;
      padding: 2px 7px;
      max-width: 100%;
      overflow-wrap: anywhere;
    }
    .doc-node-badge.primary {
      border-color: #b9ded0;
      background: #eaf8f1;
      color: #0d6f4f;
      font-weight: 700;
    }
    .doc-tags,
    .active-tag-row,
    .tag-cloud {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }
    .doc-tags {
      margin-top: 8px;
    }
    .tag-pill,
    .tag-button {
      width: auto;
      min-height: 24px;
      border: 1px solid #cbe7f0;
      border-radius: 999px;
      background: #eefaff;
      color: #0f5d78;
      padding: 3px 8px;
      font-size: 12px;
      font-weight: 650;
      white-space: nowrap;
    }
    .tag-button {
      cursor: pointer;
    }
    .tag-button.selected {
      border-color: #176b87;
      background: #176b87;
      color: #fff;
    }
    .doc-tag-edit {
      width: auto;
      min-width: 34px;
      min-height: 26px;
      border: 1px solid #cbe7f0;
      background: #f3fbfe;
      color: #0f5d78;
      padding: 3px 8px;
      font-size: 13px;
    }
    .question-tools {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .tag-panel-btn {
      width: auto;
      min-height: 34px;
      border: 1px solid #cbe7f0;
      background: #eefaff;
      color: #0f5d78;
      padding: 6px 10px;
      font-weight: 800;
      white-space: nowrap;
    }
    .active-tag-row {
      margin-top: 8px;
      min-height: 0;
    }
    .tag-draft-summary {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
      margin-bottom: 14px;
      color: var(--muted);
      font-size: 13px;
      font-weight: 600;
    }
    .clear-tag-btn {
      width: auto;
      min-height: 24px;
      border: 1px solid var(--line);
      background: var(--panel-2);
      color: #26323e;
      padding: 3px 8px;
      font-size: 12px;
    }
    .tag-modal {
      position: fixed;
      inset: 0;
      display: none;
      place-items: center;
      background: rgba(10, 18, 26, 0.46);
      z-index: 45;
      padding: 22px;
    }
    .tag-modal.open {
      display: grid;
    }
    .tag-dialog {
      width: min(720px, 94vw);
      max-height: min(720px, 86vh);
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 24px 70px rgba(5, 15, 25, 0.26);
      display: grid;
      grid-template-rows: auto 1fr auto;
      overflow: hidden;
    }
    .tag-dialog-head {
      padding: 12px 14px;
      border-bottom: 1px solid var(--line);
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
    }
    .tag-dialog-head h2 {
      margin: 0;
      font-size: 18px;
    }
    .tag-dialog-close {
      width: auto;
      min-height: 30px;
      border: 1px solid var(--line);
      background: var(--panel-2);
      color: #26323e;
      padding: 5px 9px;
    }
    .tag-dialog-body {
      overflow: auto;
      padding: 14px;
      display: grid;
      gap: 12px;
    }
    .tag-dialog-foot {
      padding: 12px 14px;
      border-top: 1px solid var(--line);
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      background: #fff;
    }
    .tag-dialog-foot button {
      width: auto;
      min-height: 34px;
      padding: 7px 12px;
    }
    .tag-group {
      display: grid;
      gap: 7px;
    }
    .tag-group-title {
      font-weight: 800;
      color: var(--muted);
    }
    .preview-modal {
      position: fixed;
      inset: 0;
      display: none;
      place-items: center;
      background: rgba(10, 18, 26, 0.58);
      z-index: 50;
      padding: 24px;
    }
    .preview-modal.open {
      display: grid;
    }
    .preview-dialog {
      width: min(1120px, 92vw);
      height: min(820px, 88vh);
      min-width: 520px;
      min-height: 360px;
      resize: both;
      overflow: hidden;
      border: 1px solid #b8c6d1;
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 24px 70px rgba(5, 15, 25, 0.32);
      display: grid;
      grid-template-rows: auto 1fr auto;
    }
    .preview-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 12px;
      border-bottom: 1px solid var(--line);
      background: var(--panel-2);
    }
    .preview-title {
      min-width: 0;
      font-weight: 700;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .preview-controls {
      display: flex;
      gap: 7px;
      align-items: center;
      flex-shrink: 0;
    }
    .preview-controls button {
      width: auto;
      min-width: 36px;
      min-height: 30px;
      padding: 5px 9px;
      border: 1px solid var(--line);
      background: #fff;
      color: #26323e;
    }
    .preview-stage {
      position: relative;
      overflow: hidden;
      background: #1d252d;
      cursor: grab;
      touch-action: none;
    }
    .preview-stage.dragging {
      cursor: grabbing;
    }
    .preview-image {
      position: absolute;
      left: 50%;
      top: 50%;
      max-width: 92%;
      max-height: 92%;
      transform-origin: center center;
      user-select: none;
      -webkit-user-drag: none;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
      background: #fff;
    }
    .preview-foot {
      min-height: 34px;
      padding: 8px 12px;
      border-top: 1px solid var(--line);
      color: var(--muted);
      background: #fff;
      font-size: 13px;
    }
    .selected-documents-panel {
      border: 1px solid #b9ded0;
      border-radius: 7px;
      background: #f4fbf7;
      padding: 10px;
      display: grid;
      gap: 8px;
    }
    .selected-documents-list {
      display: grid;
      gap: 7px;
    }
    .selected-doc-row {
      display: grid;
      gap: 2px;
      border-top: 1px solid #d5eadf;
      padding-top: 7px;
    }
    .selected-doc-row:first-child {
      border-top: 0;
      padding-top: 0;
    }
    .selected-doc-name {
      font-weight: 650;
      font-size: 13px;
      line-height: 1.35;
      overflow-wrap: anywhere;
    }
    .selected-doc-path {
      color: var(--muted);
      font-size: 12px;
      overflow-wrap: anywhere;
      line-height: 1.35;
    }
    body.left-collapsed .left-rail {
      min-width: 0;
    }
    body.left-collapsed .left-rail .rail-head {
      padding: 8px;
      justify-content: center;
    }
    body.left-collapsed .left-rail .rail-title,
    body.left-collapsed .left-rail .rail-body,
    body.sources-collapsed .source-strip .source-title,
    body.sources-collapsed .source-strip .source-caption,
    body.sources-collapsed .source-strip .source-list {
      display: none;
    }
    body.sources-collapsed .source-strip .section-head {
      padding: 8px;
      justify-content: center;
      border-bottom: 0;
    }
    @media (max-width: 1180px) {
      .topbar {
        align-items: flex-start;
        flex-direction: column;
        padding: 12px;
      }
      .workspace,
      .consult-grid,
      .filter-grid {
        grid-template-columns: 1fr;
      }
      .workspace-resizer {
        display: none;
      }
      body.left-collapsed .workspace,
      body.sources-collapsed .consult-grid {
        grid-template-columns: 1fr;
      }
      .left-rail {
        max-height: none;
      }
      body.left-collapsed .left-rail .rail-title,
      body.left-collapsed .left-rail .rail-body,
      body.sources-collapsed .source-strip .source-title,
      body.sources-collapsed .source-strip .source-caption,
      body.sources-collapsed .source-strip .source-list {
        display: block;
      }
      .actions {
        width: 100%;
        max-width: none;
      }
      .preview-dialog {
        width: 94vw;
        height: 82vh;
        min-width: 0;
      }
      .question-row {
        align-items: stretch;
        flex-direction: column;
      }
    }
    @media (max-width: 720px) {
      .shell {
        padding: 10px;
      }
      .main-nav {
        width: 100%;
        overflow-x: auto;
        flex-wrap: nowrap;
      }
    }
  </style>
</head>
<body>
  <div class="app-frame">
    <header class="topbar">
      <a class="brand" href="/ui/consult"><span class="brand-mark">LR</span><span>LOCAL-RAG-PLATFORM</span></a>
      <nav class="main-nav">
        <a class="nav-link active" href="/ui/consult">Консультант</a>
        <a class="nav-link" href="/ui/ingest">Загрузка документов</a>
        <a class="nav-link" href="/ui/nodes">Разделы базы</a>
        <a class="nav-link" href="/ui/jobs">Админ / состояние базы</a>
        <a class="nav-link" href="/ui/pages-search">Поиск по страницам PDF</a>
      </nav>
    </header>

    <main class="shell">
      <section id="workspace" class="workspace">
        <aside class="left-rail">
            <div class="rail-head">
              <div class="rail-title">
                <h2>Библиотека документов</h2>
                <div id="libraryCounter" class="library-counter">Документы загружаются</div>
              </div>
              <button id="leftPanelToggle" class="panel-toggle" type="button" title="Свернуть библиотеку" aria-label="Свернуть библиотеку">‹</button>
          </div>
          <div class="rail-body">
            <div class="scope-panel">
              <div>
                <label for="nodeSelect">Рабочий раздел</label>
                <select id="nodeSelect">
                  <option value="">Разделы загружаются</option>
                </select>
              </div>
              <label class="scope-toggle" for="includeChildren">
                <input id="includeChildren" type="checkbox" checked />
                <span>Раздел и вложенные</span>
              </label>
              <div id="scopeStatus" class="scope-status">Контекст раздела загружается.</div>
            </div>
            <div class="library-actions">
              <div class="library-action-row">
                <button id="allDocumentsBtn" class="all-docs-btn active" type="button">Все в разделе</button>
                <button id="applyDocumentsBtn" class="apply-docs-btn" type="button" disabled>Применить</button>
              </div>
              <div>
                <label for="documentSearch">Поиск по названию документа</label>
                <input id="documentSearch" type="search" placeholder="Например: функциональные блоки" />
              </div>
            </div>
            <div id="libraryStatusText" class="hint"></div>
            <div id="documentSearchResults" class="document-results"></div>
          </div>
        </aside>
        <div id="libraryResizer" class="workspace-resizer" role="separator" aria-orientation="vertical" aria-label="Изменить ширину библиотеки документов" title="Потяните, чтобы изменить ширину библиотеки"></div>

        <section class="work-main">
          <section class="query-panel">
            <div class="question-row">
              <div class="question-tools">
                <label class="question-label" for="question">Задайте вопрос:</label>
                <button id="tagPanelBtn" class="tag-panel-btn" type="button">Теги #</button>
              </div>
              <div class="actions">
                <button id="searchBtn" class="secondary" type="button">Найти источники</button>
                <button id="askBtn">Ответить</button>
              </div>
            </div>
            <div>
              <textarea id="question" placeholder="Например: какие функциональные блоки описаны в этом документе и где смотреть содержание?">Какие разделы и функциональные блоки описаны в документе?</textarea>
            </div>
            <div id="activeTagRow" class="active-tag-row"></div>
            <div class="hidden-filters" aria-hidden="true">
              <div id="documentSelectionStatus" class="document-selection-status">Фильтр по документам не применён.</div>
              <div id="selectedDocumentsPanel" class="selected-documents-panel" hidden>
                <div id="selectedDocumentsList" class="selected-documents-list"></div>
              </div>
              <select id="documentId">
                <option value="">Все документы</option>
              </select>
              <select id="scope">
                <option value="all">Все источники</option>
                <option value="chunks">Только текст</option>
                <option value="assets">Только PDF-страницы</option>
              </select>
              <select id="assetClass">
                <option value="all">Все</option>
                <option value="title">Титулы</option>
                <option value="contents">Содержание</option>
                <option value="changelog">Изменения</option>
                <option value="legal">Юридические</option>
                <option value="signals">Сигналы/теги</option>
                <option value="table">Таблицы</option>
                <option value="scheme">Схемы</option>
                <option value="screen">Экраны</option>
                <option value="text">Текст</option>
              </select>
              <select id="engineeringTopic">
                <option value="all">Все темы</option>
              </select>
              <input id="signalTag" value="" />
              <input id="limit" type="number" min="1" max="10" value="4" />
              <div id="summary" class="summary"></div>
              <div id="topics" class="summary"></div>
              <div id="signalTags" class="summary"></div>
              <div id="selectedDocumentCard"></div>
              <div id="selectedDocumentTitle"></div>
              <div id="selectedDocumentPath"></div>
              <button id="resetDocumentBtn" type="button"></button>
            </div>
            <div id="status" class="status"></div>
          </section>

          <section class="consult-grid">
            <article class="answer-sheet">
              <div class="answer-head">
                <div class="view-tabs" role="tablist" aria-label="Область результата">
                  <button id="answerTab" class="view-tab active" type="button" role="tab" aria-selected="true" aria-controls="answerPanel">Ответ</button>
                  <button id="sourcesTab" class="view-tab" type="button" role="tab" aria-selected="false" aria-controls="sourcesPanel">Источники ответа</button>
                </div>
              </div>
              <div id="answerPanel" class="tab-panel active" role="tabpanel" aria-labelledby="answerTab">
                <div id="answer" class="answer">Ответ ещё не запрашивался</div>
              </div>
              <div id="sourcesPanel" class="tab-panel" role="tabpanel" aria-labelledby="sourcesTab">
                <div class="source-panel-head">
                  <h2>Источники ответа</h2>
                  <p>Документы, страницы и фрагменты, на которых будет строиться ответ. Если источник не тот, ответ тоже будет ненадёжным.</p>
                </div>
                <div id="results" class="source-list">
                  <div class="result empty-state"><strong>Источники появятся после вопроса</strong><br />Здесь будут документы и страницы, по которым можно проверить будущий ответ.</div>
                </div>
              </div>
            </article>
          </section>
        </section>
      </section>
    </main>
  </div>

  <div id="previewModal" class="preview-modal" aria-hidden="true">
    <div class="preview-dialog" role="dialog" aria-modal="true" aria-labelledby="previewTitle">
      <div class="preview-head">
        <div id="previewTitle" class="preview-title">Предпросмотр</div>
        <div class="preview-controls">
          <button id="previewPrevBtn" type="button" title="Предыдущая страница">‹</button>
          <button id="previewNextBtn" type="button" title="Следующая страница">›</button>
          <button id="previewZoomOutBtn" type="button" title="Уменьшить">−</button>
          <button id="previewZoomResetBtn" type="button" title="Сбросить масштаб">100%</button>
          <button id="previewZoomInBtn" type="button" title="Увеличить">+</button>
          <button id="previewCloseBtn" type="button" title="Закрыть">Закрыть</button>
        </div>
      </div>
      <div id="previewStage" class="preview-stage">
        <img id="previewImage" class="preview-image" alt="Предпросмотр страницы документа" />
      </div>
      <div id="previewStatus" class="preview-foot">Загрузка предпросмотра...</div>
    </div>
  </div>

  <div id="tagModal" class="tag-modal" aria-hidden="true">
    <div class="tag-dialog" role="dialog" aria-modal="true" aria-labelledby="tagModalTitle">
      <div class="tag-dialog-head">
        <h2 id="tagModalTitle">Теги документов</h2>
        <button id="tagModalCloseBtn" class="tag-dialog-close" type="button">Закрыть</button>
      </div>
      <div id="tagModalBody" class="tag-dialog-body"></div>
      <div class="tag-dialog-foot">
        <button id="tagResetBtn" class="tag-dialog-close" type="button">Сбросить</button>
        <button id="tagApplyBtn" type="button">Применить</button>
      </div>
    </div>
  </div>

  <script>
    const questionEl = document.getElementById("question");
    const limitEl = document.getElementById("limit");
    const documentIdEl = document.getElementById("documentId");
    const scopeEl = document.getElementById("scope");
    const assetClassEl = document.getElementById("assetClass");
    const engineeringTopicEl = document.getElementById("engineeringTopic");
    const signalTagEl = document.getElementById("signalTag");
    const statusEl = document.getElementById("status");
    const summaryEl = document.getElementById("summary");
    const topicsEl = document.getElementById("topics");
    const signalTagsEl = document.getElementById("signalTags");
    const answerEl = document.getElementById("answer");
    const resultsEl = document.getElementById("results");
    const askBtn = document.getElementById("askBtn");
    const searchBtn = document.getElementById("searchBtn");
    const workspaceEl = document.getElementById("workspace");
    const leftPanelToggle = document.getElementById("leftPanelToggle");
    const libraryResizer = document.getElementById("libraryResizer");
    const answerTab = document.getElementById("answerTab");
    const sourcesTab = document.getElementById("sourcesTab");
    const answerPanel = document.getElementById("answerPanel");
    const sourcesPanel = document.getElementById("sourcesPanel");
    const allDocumentsBtn = document.getElementById("allDocumentsBtn");
    const documentSearchEl = document.getElementById("documentSearch");
    const libraryStatusTextEl = document.getElementById("libraryStatusText");
    const documentSearchResultsEl = document.getElementById("documentSearchResults");
    const libraryCounterEl = document.getElementById("libraryCounter");
    const resetDocumentBtn = document.getElementById("resetDocumentBtn");
    const applyDocumentsBtn = document.getElementById("applyDocumentsBtn");
    const documentSelectionStatusEl = document.getElementById("documentSelectionStatus");
    const selectedDocumentsPanelEl = document.getElementById("selectedDocumentsPanel");
    const selectedDocumentsListEl = document.getElementById("selectedDocumentsList");
    const nodeSelectEl = document.getElementById("nodeSelect");
    const includeChildrenEl = document.getElementById("includeChildren");
    const scopeStatusEl = document.getElementById("scopeStatus");
    const previewModalEl = document.getElementById("previewModal");
    const previewTitleEl = document.getElementById("previewTitle");
    const previewStageEl = document.getElementById("previewStage");
    const previewImageEl = document.getElementById("previewImage");
    const previewStatusEl = document.getElementById("previewStatus");
    const previewPrevBtn = document.getElementById("previewPrevBtn");
    const previewNextBtn = document.getElementById("previewNextBtn");
    const previewZoomOutBtn = document.getElementById("previewZoomOutBtn");
    const previewZoomResetBtn = document.getElementById("previewZoomResetBtn");
    const previewZoomInBtn = document.getElementById("previewZoomInBtn");
    const previewCloseBtn = document.getElementById("previewCloseBtn");
    const tagPanelBtn = document.getElementById("tagPanelBtn");
    const activeTagRowEl = document.getElementById("activeTagRow");
    const tagModalEl = document.getElementById("tagModal");
    const tagModalBodyEl = document.getElementById("tagModalBody");
    const tagModalCloseBtn = document.getElementById("tagModalCloseBtn");
    const tagApplyBtn = document.getElementById("tagApplyBtn");
    const tagResetBtn = document.getElementById("tagResetBtn");
    let documents = [];
    let knowledgeNodes = [];
    let currentNodeId = "";
    let currentIncludeChildren = true;
    let draftDocumentIds = new Set();
    let appliedDocumentIds = [];
    let activeTags = new Set();
    let tagDraftTags = new Set();
    let scopedTags = [];
    let previewItems = [];
    let previewIndex = 0;
    let previewZoom = 1;
    let previewPanX = 0;
    let previewPanY = 0;
    let previewDrag = null;
    let libraryResizeState = null;

    const LIBRARY_WIDTH_KEY = "kb.consult.libraryWidth";
    const LIBRARY_MIN_WIDTH = 260;
    const LIBRARY_MAX_WIDTH = 560;

    const assetClassLabels = {
      all: "Все",
      title: "Титул",
      contents: "Содержание",
      changelog: "Изменения",
      legal: "Юридическая",
      signals: "Сигналы/теги",
      table: "Таблица",
      scheme: "Схема",
      screen: "Экран",
      text: "Текст",
      empty: "Пустая",
      unknown: "Не определено",
    };

    const methodLabels = {
      semantic: "Смысловой",
      lexical: "Точный",
      browse: "Просмотр",
    };

    const modeLabels = {
      llm: "ответ модели",
      "fallback-source-snippet": "быстрый ответ по источнику",
      "fallback-empty": "источники не найдены",
      "no-sources": "источники не найдены",
    };

    function setStatus(text, ok = false) {
      statusEl.textContent = text;
      statusEl.className = ok ? "status ok" : "status";
    }

    function setBusy(isBusy) {
      askBtn.disabled = isBusy;
      searchBtn.disabled = isBusy;
    }

    function setActiveConsultTab(tabName) {
      const showSources = tabName === "sources";
      answerTab.classList.toggle("active", !showSources);
      sourcesTab.classList.toggle("active", showSources);
      answerTab.setAttribute("aria-selected", String(!showSources));
      sourcesTab.setAttribute("aria-selected", String(showSources));
      answerPanel.classList.toggle("active", !showSources);
      sourcesPanel.classList.toggle("active", showSources);
      sourcesPanel.classList.toggle("sources-active", showSources);
    }

    function clampLibraryWidth(value) {
      const maxByWindow = Math.max(LIBRARY_MIN_WIDTH, Math.min(LIBRARY_MAX_WIDTH, window.innerWidth - 620));
      return Math.max(LIBRARY_MIN_WIDTH, Math.min(maxByWindow, Number(value) || LIBRARY_MIN_WIDTH));
    }

    function setLibraryWidth(value, persist = true) {
      const width = clampLibraryWidth(value);
      workspaceEl.style.setProperty("--library-width", width + "px");
      if (persist) {
        localStorage.setItem(LIBRARY_WIDTH_KEY, String(width));
      }
    }

    function restoreLibraryWidth() {
      const saved = Number(localStorage.getItem(LIBRARY_WIDTH_KEY) || 0);
      if (saved > 0) {
        setLibraryWidth(saved, false);
      }
    }

    function startLibraryResize(event) {
      if (document.body.classList.contains("left-collapsed")) {
        return;
      }

      libraryResizeState = {
        pointerId: event.pointerId,
        left: workspaceEl.getBoundingClientRect().left,
      };
      document.body.classList.add("resizing-library");
      libraryResizer.setPointerCapture(event.pointerId);
      event.preventDefault();
    }

    function moveLibraryResize(event) {
      if (!libraryResizeState || event.pointerId !== libraryResizeState.pointerId) {
        return;
      }

      setLibraryWidth(event.clientX - libraryResizeState.left);
    }

    function stopLibraryResize(event) {
      if (!libraryResizeState || event.pointerId !== libraryResizeState.pointerId) {
        return;
      }

      libraryResizeState = null;
      document.body.classList.remove("resizing-library");
      try {
        libraryResizer.releasePointerCapture(event.pointerId);
      } catch (_error) {
        // Захват мог уже сняться браузером.
      }
    }

    function renderLoadingState(target, title, text) {
      target.innerHTML = (
        '<div class="empty-state loading-state"><strong>' +
        escapeHtml(title) +
        '</strong><br />' +
        escapeHtml(text) +
        '</div>'
      );
    }

    function translateAssetClass(value) {
      return assetClassLabels[value] || value || "Не определено";
    }

    function translateMethod(value) {
      return methodLabels[value] || value || "Неизвестно";
    }

    function translateMode(value) {
      return modeLabels[value] || value || "неизвестно";
    }

    function translateSourceKind(item) {
      const raw = String(item.page_type || item.asset_type || item.asset_class || "").trim();
      if (raw) {
        return assetClassLabels[raw] || raw;
      }

      return item.page_number != null ? "PDF-страница" : "Текстовый фрагмент";
    }

    function normalizeSourceExcerpt(value) {
      return String(value ?? "")
        .replace(/\\r\\n/g, "\\n")
        .replace(/[ \\t]+/g, " ")
        .replace(/\\n{3,}/g, "\\n\\n")
        .trim();
    }

    function clipSourceExcerpt(value, limit = 900) {
      const text = normalizeSourceExcerpt(value);
      if (text.length <= limit) {
        return text;
      }

      const clipped = text.slice(0, limit);
      const boundary = Math.max(
        clipped.lastIndexOf(". "),
        clipped.lastIndexOf("; "),
        clipped.lastIndexOf(" ")
      );
      const end = boundary > Math.floor(limit * 0.65) ? boundary : limit;
      return clipped.slice(0, end).trim() + "...";
    }

    function renderSourceReason(item) {
      const methods = safeArray(item.methods)
        .map((method) => translateMethod(method))
        .filter(Boolean);
      const methodText = methods.length
        ? "Почему показано: " + methods.join(" + ").toLowerCase() + " поиск."
        : "Почему показано: фрагмент попал в лучшие результаты по текущему запросу.";
      const pageText = item.page_number != null
        ? " Можно открыть предпросмотр и сверить страницу PDF."
        : "";
      return '<div class="source-reason">' + escapeHtml(methodText + pageText) + '</div>';
    }

    function safeArray(value) {
      return Array.isArray(value) ? value.filter(Boolean) : [];
    }

    function basenameFromPath(value) {
      if (!value) {
        return "";
      }
      const normalized = String(value).replace(/\\\\/g, "/");
      const parts = normalized.split("/");
      return parts[parts.length - 1] || normalized;
    }

    function escapeHtml(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    function getDocumentDisplayName(item) {
      return (
        item.original_file_name ||
        basenameFromPath(item.original_file_path) ||
        item.title ||
        item.id
      );
    }

    function formatNumber(value) {
      return new Intl.NumberFormat("ru-RU").format(Number(value || 0));
    }

    function getDocumentPageCount(item) {
      return Number(item.page_count ?? item.pageCount ?? 0);
    }

    function getDocumentNodeLinks(item) {
      const links = item?.node_links ?? item?.nodeLinks ?? [];
      const directLinks = Array.isArray(links) ? links.filter((link) => link && link.name) : [];
      if (directLinks.length > 0) {
        return directLinks;
      }

      const node = currentNode();
      if (!node?.isSystem) {
        return [];
      }

      return [{
        node_id: node.id,
        name: node.name,
        type_label: node.typeLabel || "Системный",
        color: node.color,
        is_primary: true,
        is_system: true,
      }];
    }

    function getDocumentNodeNames(item) {
      return getDocumentNodeLinks(item).map((link) => String(link.name || "").trim()).filter(Boolean);
    }

    function renderDocumentNodeLine(item) {
      const links = getDocumentNodeLinks(item);
      if (!links.length) {
        return "";
      }

      const primary = links.find((link) => link.is_primary === true || link.isPrimary === true) || links[0];
      const others = links.filter((link) => String(link.node_id ?? link.nodeId) !== String(primary.node_id ?? primary.nodeId));
      const primaryLabel = (primary.type_label || primary.typeLabel)
        ? String(primary.type_label || primary.typeLabel) + ": " + primary.name
        : primary.name;
      const otherLabels = others.slice(0, 3).map((link) => link.name);
      const extra = Math.max(0, others.length - otherLabels.length);

      return (
        '<div class="doc-node-line">' +
        '<span class="doc-node-badge primary">' + escapeHtml(primaryLabel) + '</span>' +
        (otherLabels.length
          ? '<span>Также в:</span>' + otherLabels.map((name) => '<span class="doc-node-badge">' + escapeHtml(name) + '</span>').join("")
          : "") +
        (extra > 0 ? '<span class="doc-node-badge">+' + extra + '</span>' : "") +
        '</div>'
      );
    }

    function renderSourceNodeLine(item) {
      const paths = safeArray(item.node_paths || item.nodePaths)
        .map((path) => String(path).trim())
        .filter(Boolean)
        .slice(0, 3);
      if (!paths.length) {
        return "";
      }

      return (
        '<div class="source-node-line">' +
        '<span>Раздел:</span>' +
        paths.map((path) => '<span class="doc-node-badge">' + escapeHtml(path) + '</span>').join("") +
        '</div>'
      );
    }

    function flattenNodeTree(items, depth = 0) {
      return (Array.isArray(items) ? items : []).flatMap((item) => {
        const current = { ...item, depth };
        return [current, ...flattenNodeTree(item.children || [], depth + 1)];
      });
    }

    function currentNode() {
      return knowledgeNodes.find((item) => String(item.id) === String(currentNodeId)) || null;
    }

    function readScopeFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const urlNodeId = params.get("nodeId") || "";
      const urlIncludeChildren = params.get("includeChildren");

      return {
        nodeId: urlNodeId,
        includeChildren:
          urlIncludeChildren === null
            ? true
            : ["1", "true", "yes", "on", "да"].includes(urlIncludeChildren.toLowerCase()),
      };
    }

    function hasScopeInUrl() {
      const params = new URLSearchParams(window.location.search);
      return params.has("nodeId") || params.has("includeChildren");
    }

    async function readSavedUiScope() {
      try {
        const response = await fetch("/ui/state");
        const data = await response.json();
        if (!response.ok || data.ok !== true) {
          return null;
        }
        const state = data.state || {};
        return {
          nodeId: state.currentNodeId || "",
          includeChildren: state.includeChildren !== false,
        };
      } catch (error) {
        return null;
      }
    }

    async function resolveInitialScope() {
      const urlScope = readScopeFromUrl();
      if (hasScopeInUrl()) {
        return urlScope;
      }
      return (await readSavedUiScope()) || urlScope;
    }

    async function saveUiScope() {
      try {
        await fetch("/ui/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentNodeId: currentNodeId || null,
            includeChildren: currentIncludeChildren,
          }),
        });
      } catch (error) {
        console.warn("Не удалось сохранить контекст UI", error);
      }
    }

    function syncScopeUrl() {
      const url = new URL(window.location.href);
      if (currentNodeId) {
        url.searchParams.set("nodeId", currentNodeId);
      } else {
        url.searchParams.delete("nodeId");
      }
      url.searchParams.set("includeChildren", String(currentIncludeChildren));
      window.history.replaceState({}, "", url);
    }

    function syncIncludeChildrenControl() {
      const node = currentNode();
      const label = includeChildrenEl.closest(".scope-toggle") || includeChildrenEl.parentElement;
      const systemScope = node?.isSystem === true;
      if (systemScope) {
        currentIncludeChildren = false;
        includeChildrenEl.checked = false;
      }
      includeChildrenEl.disabled = systemScope;
      if (label) {
        label.hidden = systemScope;
      }
    }

    function renderScopeStatus() {
      const node = currentNode();
      if (!node) {
        scopeStatusEl.textContent = "Раздел не выбран. Поиск идёт по всей базе.";
        return;
      }

      const counts = node.counts || {};
      const docs = formatNumber(counts.scopeDocuments ?? counts.directDocuments ?? 0);
      const pages = formatNumber(counts.scopePages ?? 0);
      scopeStatusEl.textContent = (
        "Текущий контекст: " +
        node.name +
        " · " +
        docs +
        " документов" +
        (Number(counts.scopePages || 0) > 0 ? " · " + pages + " страниц" : "")
      );
    }

    function populateNodeSelect() {
      if (!knowledgeNodes.length) {
        nodeSelectEl.innerHTML = '<option value="">Все разделы</option>';
        nodeSelectEl.value = "";
        renderScopeStatus();
        return;
      }

      nodeSelectEl.innerHTML = knowledgeNodes
        .map((item) => {
          const prefix = item.depth > 0 ? Array(item.depth + 1).join("— ") : "";
          const counts = item.counts || {};
          const docs = Number(counts.scopeDocuments ?? counts.directDocuments ?? 0);
          const label = prefix + item.name + " (" + docs + ")";
          return '<option value="' + escapeHtml(item.id) + '">' + escapeHtml(label) + '</option>';
        })
        .join("");
      nodeSelectEl.value = currentNodeId;
      includeChildrenEl.checked = currentIncludeChildren;
      syncIncludeChildrenControl();
      renderScopeStatus();
    }

    const tagAliases = new Map([
      ["met-o", "metso"],
    ]);

    function normalizeTag(value) {
      const normalized = String(value || "").trim().replace(/^#+/, "").replace(/\s+/g, "-");
      return tagAliases.get(normalized.toLowerCase()) || normalized;
    }

    function parseHashTags(value) {
      return String(value || "")
        .split(",")
        .map(normalizeTag)
        .filter(Boolean)
        .filter((tag, index, array) => array.findIndex((candidate) => candidate.toLowerCase() === tag.toLowerCase()) === index);
    }

    function getDocumentTags(item) {
      return Array.isArray(item.categories)
        ? item.categories.map(normalizeTag).filter(Boolean)
        : [];
    }

    function tagMatchesDocument(item, tag) {
      const normalized = normalizeTag(tag).toLowerCase();
      return getDocumentTags(item).some((candidate) => candidate.toLowerCase() === normalized);
    }

    function documentMatchesAnyTag(item, tags) {
      const normalizedTags = Array.from(tags || [])
        .map((tag) => normalizeTag(tag).toLowerCase())
        .filter(Boolean);
      if (!normalizedTags.length) {
        return true;
      }
      return getDocumentTags(item).some((candidate) => normalizedTags.includes(candidate.toLowerCase()));
    }

    function getAllTags() {
      if (scopedTags.length > 0) {
        return scopedTags;
      }

      const counts = new Map();
      documents.forEach((item) => {
        getDocumentTags(item).forEach((tag) => {
          const key = tag.toLowerCase();
          const existing = counts.get(key) || { tag, count: 0 };
          existing.count += 1;
          counts.set(key, existing);
        });
      });
      return Array.from(counts.values()).sort((a, b) => a.tag.localeCompare(b.tag, "ru"));
    }

    function renderLibraryCounter() {
      const documentCount = documents.length;
      const pageCount = documents.reduce((sum, item) => sum + getDocumentPageCount(item), 0);
      libraryCounterEl.textContent = formatNumber(documentCount) + " документов" + (
        pageCount > 0 ? "  " + formatNumber(pageCount) + " страниц" : ""
      );
    }

    function getDocumentMeta(item) {
      const meta = [];
      const pageCount = getDocumentPageCount(item);
      if (pageCount > 0) {
        meta.push(formatNumber(pageCount) + " стр.");
      }

      return meta;
    }

    function compactPath(value) {
      if (!value) {
        return "Источник не указан";
      }
      const normalized = String(value).replace(/\\\\/g, "/");
      const parts = normalized.split("/").filter(Boolean);
      if (parts.length <= 3) {
        return normalized;
      }
      return ".../" + parts.slice(-3).join("/");
    }

    function findDocumentById(documentId) {
      return documents.find((item) => String(item.id) === String(documentId));
    }

    function appliedDocumentSet() {
      return new Set(appliedDocumentIds.map((id) => String(id)));
    }

    function hasDraftChanges() {
      const applied = appliedDocumentSet();
      if (draftDocumentIds.size !== applied.size) {
        return true;
      }

      return Array.from(draftDocumentIds).some((id) => !applied.has(id));
    }

    function documentMatchesQuery(item, query) {
      const text = [
        getDocumentDisplayName(item),
        item.original_file_path,
        item.title,
        item.id,
        getDocumentTags(item).join(" "),
        getDocumentNodeNames(item).join(" "),
      ].filter(Boolean).join(" ").toLowerCase();
      return text.includes(query);
    }

    function syncDocumentSelect() {
      documentIdEl.value = appliedDocumentIds.length === 1 ? appliedDocumentIds[0] : "";
    }

    function renderSelectedDocumentsPanel() {
      if (appliedDocumentIds.length === 0) {
        selectedDocumentsPanelEl.hidden = true;
        selectedDocumentsListEl.innerHTML = "";
        return;
      }

      selectedDocumentsPanelEl.hidden = false;
      selectedDocumentsListEl.innerHTML = appliedDocumentIds
        .map((id) => findDocumentById(id))
        .filter(Boolean)
        .map((item) => (
          '<div class="selected-doc-row">' +
          '<div class="selected-doc-name">' + escapeHtml(getDocumentDisplayName(item)) + '</div>' +
          '<div class="selected-doc-path">' + escapeHtml(compactPath(item.original_file_path || item.title || item.id)) + '</div>' +
          renderDocumentNodeLine(item) +
          '</div>'
        ))
        .join("");
    }

    function renderDocumentFilterState() {
      const draftCount = draftDocumentIds.size;
      const appliedCount = appliedDocumentIds.length;
      const changed = hasDraftChanges();

      allDocumentsBtn.classList.toggle("active", appliedCount === 0 && draftCount === 0);
      applyDocumentsBtn.disabled = draftCount === 0 || !changed;

      if (appliedCount === 0 && draftCount === 0) {
        documentSelectionStatusEl.textContent = "Фильтр по документам не применён.";
      } else if (changed) {
        documentSelectionStatusEl.textContent = "Выбрано к применению: " + draftCount;
      } else {
        documentSelectionStatusEl.textContent = "Применено документов: " + appliedCount;
      }

      renderSelectedDocumentsPanel();
      renderActiveTagRow();
    }

    function renderActiveTagRow() {
      if (activeTags.size === 0) {
        activeTagRowEl.innerHTML = "";
        return;
      }

      activeTagRowEl.innerHTML = (
        Array.from(activeTags).map((tag) => '<span class="tag-pill">#' + escapeHtml(tag) + '</span>').join("") +
        '<span class="hint">По выбранным тегам: документов ' + appliedDocumentIds.length + '</span>' +
        '<button id="clearTagFilterBtn" class="clear-tag-btn" type="button">Сбросить #</button>'
      );
      document.getElementById("clearTagFilterBtn")?.addEventListener("click", clearTagFilter);
    }

    function renderTagModalBody() {
      const tags = getAllTags();
      if (!tags.length) {
        tagModalBodyEl.innerHTML = '<div class="empty-state">Теги пока не добавлены. Добавьте #теги при загрузке или через кнопку # у документа.</div>';
      } else {
        const groups = new Map();
        tags.forEach((item) => {
          const letter = item.tag.slice(0, 1).toUpperCase() || "#";
          if (!groups.has(letter)) {
            groups.set(letter, []);
          }
          groups.get(letter).push(item);
        });
        const draftTags = Array.from(tagDraftTags);
        const draftSummary = '<div class="tag-draft-summary">' + (
          draftTags.length > 0
            ? 'Выбрано: ' + draftTags.map((tag) => '<span class="tag-pill">#' + escapeHtml(tag) + '</span>').join("")
            : 'Выбрано: нет'
        ) + '</div>';
        tagModalBodyEl.innerHTML = draftSummary + Array.from(groups.entries())
          .map(([letter, items]) => (
            '<div class="tag-group">' +
              '<div class="tag-group-title">' + escapeHtml(letter) + '</div>' +
              '<div class="tag-cloud">' +
                items.map((item) => {
                  const selected = tagDraftTags.has(normalizeTag(item.tag)) ? " selected" : "";
                  return '<button class="tag-button' + selected + '" type="button" data-tag-filter="' + escapeHtml(item.tag) + '">#' + escapeHtml(item.tag) + ' <span>(' + item.count + ')</span></button>';
                }).join("") +
              '</div>' +
            '</div>'
          ))
          .join("");
      }
    }

    function openTagModal() {
      tagDraftTags = new Set(activeTags);
      renderTagModalBody();
      tagModalEl.classList.add("open");
      tagModalEl.setAttribute("aria-hidden", "false");
    }

    function closeTagModal() {
      tagModalEl.classList.remove("open");
      tagModalEl.setAttribute("aria-hidden", "true");
    }

    function applySelectedTags(tags) {
      activeTags = new Set(Array.from(tags || []).map(normalizeTag).filter(Boolean));
      if (activeTags.size === 0) {
        clearTagFilter();
        return;
      }
      const ids = documents
        .filter((item) => documentMatchesAnyTag(item, activeTags))
        .map((item) => String(item.id));
      draftDocumentIds = new Set(ids);
      appliedDocumentIds = ids;
      syncDocumentSelect();
      documentSearchEl.value = "";
      closeTagModal();
      renderDocumentFilterState();
      renderDocumentSearchResults();
      loadDocumentSummary();
      setStatus("Применён фильтр по тегам: " + Array.from(activeTags).map((tag) => "#" + tag).join(", ") + ". Документов: " + ids.length, true);
    }

    function applyTagFilter(tag) {
      applySelectedTags(new Set([normalizeTag(tag)]));
    }

    function clearTagFilter() {
      activeTags = new Set();
      tagDraftTags = new Set();
      clearDocumentFilter();
      if (tagModalEl.classList.contains("open")) {
        renderTagModalBody();
      }
      setStatus("Фильтр по тегу сброшен.", true);
    }

    function clearDocumentFilter() {
      activeTags = new Set();
      draftDocumentIds = new Set();
      appliedDocumentIds = [];
      documentIdEl.value = "";
      documentSearchEl.value = "";
      renderDocumentFilterState();
      renderDocumentSearchResults();
      loadDocumentSummary();
    }

    function toggleDraftDocument(documentId) {
      const id = String(documentId || "");
      if (!id) {
        return;
      }

      if (draftDocumentIds.has(id)) {
        draftDocumentIds.delete(id);
      } else {
        draftDocumentIds.add(id);
      }

      renderDocumentFilterState();
      renderDocumentSearchResults();
    }

    function applyDocumentFilter() {
      activeTags = new Set();
      appliedDocumentIds = Array.from(draftDocumentIds);
      syncDocumentSelect();
      documentSearchEl.value = "";
      renderDocumentFilterState();
      renderDocumentSearchResults();
      loadDocumentSummary();
    }

    function renderDocumentSearchResults() {
      const query = documentSearchEl.value.trim().toLowerCase();
      const applied = appliedDocumentSet();

      if (!documents.length) {
        libraryStatusTextEl.textContent = "Документы пока не загружены.";
        documentSearchResultsEl.classList.remove("compact");
        documentSearchResultsEl.innerHTML = "";
        renderDocumentFilterState();
        return;
      }

      let visibleDocuments = [];
      let statusText = "";
      let compact = false;

      if (query) {
        visibleDocuments = documents
          .filter((item) => documentMatchesQuery(item, query))
          .slice(0, 20);
        statusText = visibleDocuments.length
          ? "Найдено: " + visibleDocuments.length + ". Отметьте нужные документы."
          : "Документы по этому запросу не найдены.";
      } else if (appliedDocumentIds.length > 0) {
        visibleDocuments = appliedDocumentIds
          .map((id) => findDocumentById(id))
          .filter(Boolean);
        statusText = activeTags.size > 0
          ? "Применён фильтр по тегам: " + appliedDocumentIds.length + ". Агент ищет только по документам с выбранными #тегами."
          : "Применено документов: " + appliedDocumentIds.length + ". Агент ищет только по выбранным документам.";
        compact = true;
      } else {
        visibleDocuments = documents;
        statusText = "";
        compact = true;
      }

      libraryStatusTextEl.textContent = statusText;
      documentSearchResultsEl.classList.toggle("compact", compact);

      if (!visibleDocuments.length) {
        documentSearchResultsEl.innerHTML = '<div class="empty-state">Список пуст.</div>';
        renderDocumentFilterState();
        return;
      }

      documentSearchResultsEl.innerHTML = visibleDocuments.map((item) => {
        const id = String(item.id);
        const name = getDocumentDisplayName(item);
        const meta = getDocumentMeta(item);
        const tags = getDocumentTags(item);
        const nodeHtml = renderDocumentNodeLine(item);
        const selected = draftDocumentIds.has(id);
        const appliedClass = applied.has(id) ? " applied" : "";
        const selectedClass = selected ? " selected" : "";
        const actionText = selected ? "Выбран" : "Выбрать";
        const metaHtml = meta.length
          ? '<span class="doc-meta">' + meta.map((part) => '<span class="doc-page-badge">' + escapeHtml(part) + '</span>').join("") + '</span>'
          : "";
        const tagsHtml = tags.length
          ? '<div class="doc-tags">' + tags.map((tag) => '<button class="tag-button" type="button" data-tag-filter="' + escapeHtml(tag) + '">#' + escapeHtml(tag) + '</button>').join("") + '</div>'
          : "";
        const canOpen = getDocumentPageCount(item) > 0;
        return (
          '<div class="doc-pick' + selectedClass + appliedClass + '" data-document-id="' + escapeHtml(id) + '">' +
          '<div class="doc-pick-head">' +
          '<div class="doc-pick-title">' + escapeHtml(name) + '</div>' +
          nodeHtml +
          '<div class="doc-actions">' +
          '<button type="button" class="doc-open-action" data-document-open-id="' + escapeHtml(id) + '"' + (canOpen ? "" : " disabled") + '>Открыть</button>' +
          '<button type="button" class="doc-pick-action" data-document-select-id="' + escapeHtml(id) + '">' + actionText + '</button>' +
          '<button type="button" class="doc-tag-edit" data-document-tag-id="' + escapeHtml(id) + '" title="Изменить теги этого документа">Теги</button>' +
          metaHtml +
          '</div>' +
          tagsHtml +
          '</div>' +
          '</div>'
        );
      }).join("");

      documentSearchResultsEl.querySelectorAll("button[data-document-select-id]").forEach((button) => {
        button.addEventListener("click", () => {
          toggleDraftDocument(button.dataset.documentSelectId);
        });
      });

      documentSearchResultsEl.querySelectorAll("button[data-document-open-id]").forEach((button) => {
        button.addEventListener("click", () => {
          openDocumentPreview(button.dataset.documentOpenId);
        });
      });

      documentSearchResultsEl.querySelectorAll("button[data-document-tag-id]").forEach((button) => {
        button.addEventListener("click", () => {
          editDocumentTags(button.dataset.documentTagId);
        });
      });

      documentSearchResultsEl.querySelectorAll("button[data-tag-filter]").forEach((button) => {
        button.addEventListener("click", () => {
          applyTagFilter(button.dataset.tagFilter);
        });
      });

      renderDocumentFilterState();
    }

    function buildDisplayTitle(item) {
      const sourceName = item.source_file_name || basenameFromPath(item.source_path) || "";
      const title = item.title || sourceName || "Без названия";
      return String(title).replace(/\\s+-\\s+Страница\\s+\\d+\\s*$/i, "");
    }

    function renderResults(items) {
      if (!items || items.length === 0) {
        resultsEl.innerHTML = "<div class=\\"result empty-state\\"><strong>Источники не найдены.</strong><br />По текущему вопросу и фильтрам база не дала подходящих фрагментов. Попробуйте уточнить запрос или выбрать другой документ.</div>";
        return;
      }

      resultsEl.innerHTML = items.map((item, index) => {
        const assetUrl = item.asset_url || item.asset_preview_url || "";
        const page = item.page_number ?? "-";
        const displayTitle = buildDisplayTitle(item);
        const excerpt = normalizeSourceExcerpt(item.textExcerpt || item.text || "");
        const shortExcerpt = clipSourceExcerpt(excerpt);
        const kindLabel = translateSourceKind(item);
        const pageLabel = page !== "-"
          ? '<span class="source-page">стр. ' + escapeHtml(page) + '</span>'
          : "";
        const kindBadge = kindLabel
          ? '<span class="source-kind">' + escapeHtml(kindLabel) + '</span>'
          : "";
        const metaHtml = pageLabel || kindBadge
          ? '<div class="source-meta-row">' + pageLabel + kindBadge + '</div>'
          : "";
        const previewButton = assetUrl
          ? '<button class="source-link" type="button" data-preview-url="' + escapeHtml(assetUrl) + '" data-preview-doc-id="' + escapeHtml(item.document_id || "") + '" data-preview-page="' + escapeHtml(page) + '" data-preview-title="' + escapeHtml(displayTitle) + '">Открыть предпросмотр</button>'
          : "";
        const actionsHtml = previewButton
          ? '<div class="source-actions">' + previewButton + '</div>'
          : "";
        const nodeHtml = renderSourceNodeLine(item);
        const fullExcerptHtml = shortExcerpt !== excerpt
          ? '<details class="source-full"><summary>Показать фрагмент полностью</summary><div class="excerpt">' + escapeHtml(excerpt) + '</div></details>'
          : "";
        return \`
          <div class="result">
            <div class="source-card-head">
              <h3>[\${index + 1}] \${escapeHtml(displayTitle)}</h3>
            </div>
            \${metaHtml}
            \${actionsHtml}
            \${nodeHtml}
            \${renderSourceReason(item)}
            <div class="excerpt-label">Фрагмент из базы</div>
            <div class="excerpt">\${escapeHtml(shortExcerpt || "Фрагмент пустой.")}</div>
            \${fullExcerptHtml}
          </div>
        \`;
      }).join("");

      resultsEl.querySelectorAll("button[data-preview-url]").forEach((button) => {
        button.addEventListener("click", () => {
          const documentId = button.dataset.previewDocId || "";
          const page = Number(button.dataset.previewPage || 0);
          if (documentId) {
            openDocumentPreview(documentId, page);
            return;
          }

          openPreviewItems([
            {
              url: button.dataset.previewUrl,
              title: button.dataset.previewTitle || "Предпросмотр источника",
              page: page || null,
            },
          ]);
        });
      });
    }

    function normalizePreviewItems(items) {
      return (Array.isArray(items) ? items : [])
        .filter((item) => item && item.url)
        .map((item) => ({
          url: item.url,
          title: item.title || "Страница документа",
          page: Number(item.page ?? item.page_number ?? 0) || null,
        }))
        .sort((a, b) => (a.page || 0) - (b.page || 0));
    }

    function updatePreviewTransform() {
      previewImageEl.style.transform = (
        "translate(calc(-50% + " + previewPanX + "px), calc(-50% + " + previewPanY + "px)) scale(" + previewZoom + ")"
      );
      previewZoomResetBtn.textContent = Math.round(previewZoom * 100) + "%";
    }

    function resetPreviewView() {
      previewZoom = 1;
      previewPanX = 0;
      previewPanY = 0;
      updatePreviewTransform();
    }

    function renderPreviewPage() {
      const item = previewItems[previewIndex];
      if (!item) {
        previewTitleEl.textContent = "Предпросмотр недоступен";
        previewImageEl.removeAttribute("src");
        previewStatusEl.textContent = "Для этого документа страницы предпросмотра не найдены.";
        previewPrevBtn.disabled = true;
        previewNextBtn.disabled = true;
        return;
      }

      previewTitleEl.textContent = item.title;
      previewImageEl.src = item.url;
      previewStatusEl.textContent = (
        "Страница " + (item.page || previewIndex + 1) + " из " + previewItems.length + ". Масштаб: колесо мыши или кнопки +/-. Перемещение: зажмите левую кнопку мыши."
      );
      previewPrevBtn.disabled = previewIndex <= 0;
      previewNextBtn.disabled = previewIndex >= previewItems.length - 1;
      resetPreviewView();
    }

    function openPreviewItems(items, startPage = null) {
      previewItems = normalizePreviewItems(items);
      if (startPage) {
        const foundIndex = previewItems.findIndex((item) => Number(item.page) === Number(startPage));
        previewIndex = foundIndex >= 0 ? foundIndex : 0;
      } else {
        previewIndex = 0;
      }

      previewModalEl.classList.add("open");
      previewModalEl.setAttribute("aria-hidden", "false");
      renderPreviewPage();
    }

    async function openDocumentPreview(documentId, startPage = null) {
      const documentItem = findDocumentById(documentId);
      previewModalEl.classList.add("open");
      previewModalEl.setAttribute("aria-hidden", "false");
      previewTitleEl.textContent = documentItem ? getDocumentDisplayName(documentItem) : "Предпросмотр документа";
      previewStatusEl.textContent = "Загружаю страницы документа...";
      previewImageEl.removeAttribute("src");

      try {
        const response = await fetch("/documents/" + documentId + "/assets");
        const data = await response.json();
        const items = normalizePreviewItems(data.assets?.items || []);
        if (!items.length) {
          previewItems = [];
          previewIndex = 0;
          renderPreviewPage();
          return;
        }

        openPreviewItems(items, startPage);
      } catch (error) {
        previewItems = [];
        previewIndex = 0;
        previewTitleEl.textContent = "Не удалось открыть документ";
        previewStatusEl.textContent = error.message;
        previewPrevBtn.disabled = true;
        previewNextBtn.disabled = true;
      }
    }

    function closePreviewModal() {
      previewModalEl.classList.remove("open");
      previewModalEl.setAttribute("aria-hidden", "true");
      previewImageEl.removeAttribute("src");
      previewDrag = null;
    }

    function changePreviewPage(delta) {
      const nextIndex = previewIndex + delta;
      if (nextIndex < 0 || nextIndex >= previewItems.length) {
        return;
      }

      previewIndex = nextIndex;
      renderPreviewPage();
    }

    function changePreviewZoom(delta) {
      previewZoom = Math.min(5, Math.max(0.4, previewZoom + delta));
      updatePreviewTransform();
    }

    function renderAnswer(text) {
      if (!text) {
        answerEl.innerHTML = "Пустой ответ.";
        return;
      }

      const lines = String(text)
        .split("\\n")
        .filter((line) => {
          const trimmed = line.trim();
          return (
            trimmed &&
            !trimmed.startsWith("Вопрос:") &&
            !trimmed.startsWith("Страница:") &&
            !trimmed.startsWith("Тип страницы:") &&
            !trimmed.startsWith("Лучшая страница:") &&
            !trimmed.startsWith("Лучший тип страницы:") &&
            !trimmed.startsWith("Ссылка на страницу:") &&
            !trimmed.startsWith("Ссылка на предпросмотр:") &&
            !trimmed.startsWith("Статус модели:")
          );
        })
        .map((line) => line
          .replace(/^Лучший источник говорит:\\s*/, "")
          .replace(/^Лучшая страница:/, "Страница:")
          .replace(/^Лучший тип страницы:/, "Тип страницы:")
        );

      if (lines[0]?.startsWith("Быстрый запасной ответ")) {
        lines.shift();
      }

      answerEl.innerHTML = escapeHtml(lines.join("\\n")).replace(/\\n/g, "<br />");
    }

    function renderSummary(items) {
      if (!items || items.length === 0) {
        summaryEl.innerHTML = "";
        return;
      }

      summaryEl.innerHTML = items
        .map((item) => (
          '<button type="button" data-asset-class="' + item.assetClass + '">' +
          translateAssetClass(item.assetClass) + ': ' + item.count +
          '</button>'
        ))
        .join("");

      summaryEl.querySelectorAll("button[data-asset-class]").forEach((button) => {
        button.addEventListener("click", () => {
          assetClassEl.value = button.dataset.assetClass;
        });
      });
    }

    function renderTopics(items) {
      if (!items || items.length === 0) {
        topicsEl.innerHTML = "";
        engineeringTopicEl.innerHTML = '<option value="all">Все темы</option>';
        return;
      }

      engineeringTopicEl.innerHTML = ['<option value="all">Все темы</option>']
        .concat(items.map((item) => (
          '<option value="' + item.topic + '">' + item.topic + " (" + item.count + ")</option>"
        )))
        .join("");

      topicsEl.innerHTML = items
        .map((item) => (
          '<button type="button" data-engineering-topic="' + item.topic + '">' +
          item.topic + ': ' + item.count +
          '</button>'
        ))
        .join("");

      topicsEl.querySelectorAll("button[data-engineering-topic]").forEach((button) => {
        button.addEventListener("click", () => {
          engineeringTopicEl.value = button.dataset.engineeringTopic;
        });
      });
    }

    function renderSignalTags(items) {
      if (!items || items.length === 0) {
        signalTagsEl.innerHTML = "";
        return;
      }

      signalTagsEl.innerHTML = items
        .map((item) => (
          '<button type="button" data-signal-tag="' + item.tag + '">' +
          item.tag + ': ' + item.count +
          '</button>'
        ))
        .join("");

      signalTagsEl.querySelectorAll("button[data-signal-tag]").forEach((button) => {
        button.addEventListener("click", () => {
          signalTagEl.value = button.dataset.signalTag;
        });
      });
    }

    async function postJson(url, body) {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || ("HTTP " + response.status));
      }
      return data;
    }

    async function patchDocument(documentId, body) {
      const response = await fetch("/documents/" + encodeURIComponent(documentId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || ("HTTP " + response.status));
      }
      return data;
    }

    async function editDocumentTags(documentId) {
      const item = findDocumentById(documentId);
      if (!item) {
        return;
      }

      const current = getDocumentTags(item).map((tag) => "#" + tag).join(", ");
      const rawValue = window.prompt("Теги документа через запятую", current);
      if (rawValue === null) {
        return;
      }

      try {
        const tags = parseHashTags(rawValue);
        const data = await patchDocument(documentId, { categories: tags });
        const syncWarning = data.qdrantSync?.ok === false
          ? " Qdrant сейчас недоступен, но для поиска по точному тегу изменения уже сохранены в PostgreSQL."
          : "";
        setStatus(
          "Теги документа обновлены: " + (tags.length ? tags.map((tag) => "#" + tag).join(", ") : "нет тегов") + "." + syncWarning,
          true
        );
        await loadDocuments();
        await loadScopedTags();
      } catch (error) {
        setStatus("Не удалось обновить теги: " + error.message);
      }
    }

    async function loadNodes() {
      const requestedScope = await resolveInitialScope();
      const response = await fetch("/nodes?format=tree");
      const data = await response.json();
      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || "Не удалось загрузить разделы");
      }

      knowledgeNodes = flattenNodeTree(data.items || []);
      const requestedExists = knowledgeNodes.some(
        (item) => String(item.id) === String(requestedScope.nodeId)
      );
      const systemNode = knowledgeNodes.find((item) => item.isSystem === true);
      const fallbackNode = systemNode || knowledgeNodes[0] || null;

      currentNodeId = requestedExists ? requestedScope.nodeId : (fallbackNode?.id || "");
      currentIncludeChildren = requestedScope.includeChildren;
      populateNodeSelect();
      syncScopeUrl();
    }

    async function loadDocuments() {
      try {
        const params = new URLSearchParams();
        if (currentNodeId) {
          params.set("nodeId", currentNodeId);
          params.set("includeChildren", String(currentIncludeChildren));
        }

        const response = await fetch("/documents" + (params.toString() ? "?" + params.toString() : ""));
        const data = await response.json();
        const items = Array.isArray(data.items) ? data.items : [];
        documents = items;
        await loadScopedTags();
        const availableIds = new Set(items.map((item) => String(item.id)));
        appliedDocumentIds = appliedDocumentIds.filter((id) => availableIds.has(String(id)));
        renderLibraryCounter();
        const options = ['<option value="">Все документы</option>']
          .concat(items.map((item) => {
            const displayName = getDocumentDisplayName(item);
            const label = displayName + " [" + item.id + "]";
            return '<option value="' + escapeHtml(item.id) + '">' + escapeHtml(label) + '</option>';
          }))
          .join("");
        documentIdEl.innerHTML = options;
        draftDocumentIds = new Set(appliedDocumentIds);
        syncDocumentSelect();
        renderDocumentFilterState();
        renderDocumentSearchResults();
      } catch (error) {
        setStatus("Не удалось загрузить список документов: " + error.message);
        libraryCounterEl.textContent = "Документы недоступны";
        libraryStatusTextEl.textContent = "Не удалось загрузить список документов.";
      }
    }

    async function loadScopedTags() {
      const params = new URLSearchParams();
      if (currentNodeId) {
        params.set("nodeId", currentNodeId);
        params.set("includeChildren", String(currentIncludeChildren));
      }
      params.set("limit", "300");

      try {
        const response = await fetch("/tags?" + params.toString());
        const data = await response.json();
        if (!response.ok || data.ok !== true) {
          throw new Error(data.error || "Не удалось загрузить теги");
        }

        scopedTags = Array.isArray(data.items)
          ? Array.from(
              data.items
                .map((item) => ({
                  tag: normalizeTag(item.tag),
                  count: Number(item.count || 0),
                }))
                .filter((item) => item.tag)
                .reduce((acc, item) => {
                  const key = item.tag.toLowerCase();
                  const existing = acc.get(key) || { tag: item.tag, count: 0 };
                  existing.count += item.count;
                  acc.set(key, existing);
                  return acc;
                }, new Map())
                .values()
            )
          : [];
        tagPanelBtn.title = scopedTags.length
          ? "Теги текущего раздела: " + scopedTags.length
          : "В текущем разделе теги не найдены";
      } catch (error) {
        scopedTags = [];
        tagPanelBtn.title = "Теги будут собраны из загруженного списка документов";
      }

      if (tagModalEl.classList.contains("open")) {
        renderTagModalBody();
      }
    }

    async function loadDocumentSummary() {
      const documentId = appliedDocumentIds.length === 1 ? appliedDocumentIds[0] : null;
      if (!documentId) {
        renderSummary([]);
        renderTopics([]);
        renderSignalTags([]);
        return;
      }

      try {
        const response = await fetch("/documents/" + documentId + "/assets");
        const data = await response.json();
        renderSummary(data.assets?.byType || []);
        renderTopics(data.assets?.byTopic || []);
        renderSignalTags(data.assets?.bySignalTag || []);
      } catch (error) {
        setStatus("Не удалось загрузить сводку документа: " + error.message);
      }
    }

    function buildPayload() {
      const documentIds = appliedDocumentIds.slice();
      return {
        limit: Number(limitEl.value || 4),
        scope: scopeEl.value || "all",
        assetClass: assetClassEl.value || "all",
        engineeringTopic: engineeringTopicEl.value || "all",
        signalTag: signalTagEl.value.trim() || "all",
        documentId: documentIds.length === 1 ? documentIds[0] : null,
        documentIds,
        selectedTags: Array.from(activeTags),
        nodeId: currentNodeId || null,
        includeChildren: currentIncludeChildren,
      };
    }

    async function applyNodeScope() {
      currentNodeId = nodeSelectEl.value || "";
      currentIncludeChildren = includeChildrenEl.checked;
      syncIncludeChildrenControl();
      activeTags = new Set();
      tagDraftTags = new Set();
      appliedDocumentIds = [];
      draftDocumentIds = new Set();
      documentIdEl.value = "";
      documentSearchEl.value = "";
      renderScopeStatus();
      syncScopeUrl();
      await saveUiScope();
      await loadDocuments();
      await loadDocumentSummary();
      const node = currentNode();
      setStatus("Рабочий раздел применён: " + (node?.name || "вся база"), true);
    }

    async function runSearch() {
      const query = questionEl.value.trim();
      if (!query) {
        setStatus("Введите вопрос или поисковый запрос.");
        return;
      }

      setStatus("Ищу подходящие источники...");
      setBusy(true);
      renderLoadingState(resultsEl, "Ищу источники", "Проверяю локальную базу и подбираю релевантные фрагменты.");
      answerEl.textContent = "Ответ не запрашивался. Сейчас выполняется поиск источников.";
      setActiveConsultTab("sources");
      try {
        const data = await postJson("/search", {
          query,
          ...buildPayload(),
        });
        renderResults(data.items || []);
        answerEl.innerHTML = '<div class="empty-state"><strong>Сейчас показаны только источники.</strong><br />Проверьте документы и страницы справа. Если они подходят, нажмите «Ответить» — модель соберёт ответ именно по этим фрагментам.</div>';
        setStatus("Источники найдены: " + (data.items?.length || 0) + ". Это ещё не ответ.", true);
      } catch (error) {
        setStatus("Ошибка поиска: " + error.message);
        resultsEl.innerHTML = '<div class="result empty-state"><strong>Не удалось выполнить поиск.</strong><br />' + escapeHtml(error.message) + '</div>';
      } finally {
        setBusy(false);
      }
    }

    async function runAsk() {
      const question = questionEl.value.trim();
      if (!question) {
        setStatus("Введите вопрос.");
        return;
      }

      setStatus("Строю ответ по найденным источникам...");
      setBusy(true);
      renderLoadingState(answerEl, "Готовлю ответ", "Сначала ищу источники, затем собираю краткий ответ по найденным фрагментам.");
      renderLoadingState(resultsEl, "Ищу источники", "Источники появятся здесь после завершения поиска.");
      setActiveConsultTab("answer");
      try {
        const data = await postJson("/ask", {
          question,
          ...buildPayload(),
        });
        renderAnswer(data.answer);
        renderResults(data.sources || []);
        setStatus("Ответ готов. Режим: " + translateMode(data.mode), true);
      } catch (error) {
        setStatus("Ошибка ответа: " + error.message);
        answerEl.innerHTML = '<div class="empty-state"><strong>Не удалось получить ответ.</strong><br />' + escapeHtml(error.message) + '</div>';
        resultsEl.innerHTML = '<div class="result empty-state"><strong>Источники не обновлены.</strong><br />Попробуйте повторить вопрос позже.</div>';
      } finally {
        setBusy(false);
      }
    }

    askBtn.addEventListener("click", runAsk);
    searchBtn.addEventListener("click", runSearch);
    answerTab.addEventListener("click", () => setActiveConsultTab("answer"));
    sourcesTab.addEventListener("click", () => setActiveConsultTab("sources"));
    allDocumentsBtn.addEventListener("click", clearDocumentFilter);
    tagPanelBtn.addEventListener("click", openTagModal);
    tagModalCloseBtn.addEventListener("click", closeTagModal);
    tagModalEl.addEventListener("click", (event) => {
      if (event.target === tagModalEl) {
        closeTagModal();
      }
    });
    tagModalBodyEl.addEventListener("click", (event) => {
      const tagButton = event.target.closest("button[data-tag-filter]");
      if (tagButton) {
        const tag = normalizeTag(tagButton.dataset.tagFilter);
        if (tagDraftTags.has(tag)) {
          tagDraftTags.delete(tag);
        } else {
          tagDraftTags.add(tag);
        }
        renderTagModalBody();
      }
    });
    tagApplyBtn.addEventListener("click", () => {
      applySelectedTags(tagDraftTags);
    });
    tagResetBtn.addEventListener("click", clearTagFilter);
    applyDocumentsBtn.addEventListener("click", applyDocumentFilter);
    resetDocumentBtn.addEventListener("click", clearDocumentFilter);
    documentSearchEl.addEventListener("input", renderDocumentSearchResults);
    nodeSelectEl.addEventListener("change", applyNodeScope);
    includeChildrenEl.addEventListener("change", applyNodeScope);
    documentIdEl.addEventListener("change", () => {
      const value = documentIdEl.value || "";
      appliedDocumentIds = value ? [value] : [];
      draftDocumentIds = new Set(appliedDocumentIds);
      renderDocumentFilterState();
      renderDocumentSearchResults();
      loadDocumentSummary();
    });
    leftPanelToggle.addEventListener("click", () => {
      const collapsed = document.body.classList.toggle("left-collapsed");
      leftPanelToggle.textContent = collapsed ? "›" : "‹";
      leftPanelToggle.title = collapsed ? "Развернуть библиотеку" : "Свернуть библиотеку";
      leftPanelToggle.setAttribute("aria-label", leftPanelToggle.title);
    });
    libraryResizer.addEventListener("pointerdown", startLibraryResize);
    libraryResizer.addEventListener("pointermove", moveLibraryResize);
    libraryResizer.addEventListener("pointerup", stopLibraryResize);
    libraryResizer.addEventListener("pointercancel", stopLibraryResize);
    libraryResizer.addEventListener("dblclick", () => {
      localStorage.removeItem(LIBRARY_WIDTH_KEY);
      workspaceEl.style.removeProperty("--library-width");
    });
    window.addEventListener("resize", () => {
      const saved = Number(localStorage.getItem(LIBRARY_WIDTH_KEY) || 0);
      if (saved > 0) {
        setLibraryWidth(saved, false);
      }
    });
    previewCloseBtn.addEventListener("click", closePreviewModal);
    previewPrevBtn.addEventListener("click", () => changePreviewPage(-1));
    previewNextBtn.addEventListener("click", () => changePreviewPage(1));
    previewZoomOutBtn.addEventListener("click", () => changePreviewZoom(-0.2));
    previewZoomInBtn.addEventListener("click", () => changePreviewZoom(0.2));
    previewZoomResetBtn.addEventListener("click", resetPreviewView);
    previewModalEl.addEventListener("click", (event) => {
      if (event.target === previewModalEl) {
        closePreviewModal();
      }
    });
    previewStageEl.addEventListener("wheel", (event) => {
      event.preventDefault();
      changePreviewZoom(event.deltaY > 0 ? -0.12 : 0.12);
    }, { passive: false });
    previewStageEl.addEventListener("pointerdown", (event) => {
      previewDrag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        panX: previewPanX,
        panY: previewPanY,
      };
      previewStageEl.classList.add("dragging");
      previewStageEl.setPointerCapture(event.pointerId);
    });
    previewStageEl.addEventListener("pointermove", (event) => {
      if (!previewDrag || previewDrag.pointerId !== event.pointerId) {
        return;
      }

      previewPanX = previewDrag.panX + event.clientX - previewDrag.startX;
      previewPanY = previewDrag.panY + event.clientY - previewDrag.startY;
      updatePreviewTransform();
    });
    previewStageEl.addEventListener("pointerup", (event) => {
      if (previewDrag?.pointerId === event.pointerId) {
        previewDrag = null;
        previewStageEl.classList.remove("dragging");
      }
    });
    document.addEventListener("keydown", (event) => {
      if (!previewModalEl.classList.contains("open")) {
        return;
      }

      if (event.key === "Escape") {
        closePreviewModal();
      } else if (event.key === "ArrowLeft") {
        changePreviewPage(-1);
      } else if (event.key === "ArrowRight") {
        changePreviewPage(1);
      }
    });
    restoreLibraryWidth();
    (async () => {
      try {
        await loadNodes();
      } catch (error) {
        setStatus("Не удалось загрузить разделы: " + error.message);
        scopeStatusEl.textContent = "Разделы недоступны. Поиск будет выполнен без ограничения разделом.";
      }
      await loadDocuments();
    })();
  </script>
</body>
</html>`;
}

function renderPagesSearchHtml() {
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Поиск по страницам PDF</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f4f6f8;
      --panel: #ffffff;
      --panel-2: #f8fafb;
      --text: #111c29;
      --muted: #607083;
      --line: #d4dde7;
      --line-soft: #e6edf3;
      --accent: #127b85;
      --accent-soft: #e8f7f8;
      --ok: #007a50;
      --ok-soft: #e6f7ef;
      --warn: #a86400;
      --warn-soft: #fff6e6;
      --shadow: 0 18px 50px rgba(17, 28, 41, 0.08);
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: "Segoe UI", Tahoma, sans-serif;
      background: var(--bg);
      color: var(--text);
    }

    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      padding: 14px 22px;
      background: var(--panel);
      border-bottom: 1px solid var(--line);
      position: sticky;
      top: 0;
      z-index: 5;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 800;
      white-space: nowrap;
      color: var(--text);
      text-decoration: none;
    }

    .brand-mark {
      width: 30px;
      height: 30px;
      display: inline-grid;
      place-items: center;
      border-radius: 8px;
      background: linear-gradient(135deg, #127b85, #1f9d72);
      color: #fff;
      font-size: 13px;
    }

    .nav {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .nav a {
      color: var(--text);
      text-decoration: none;
      padding: 10px 14px;
      border-radius: 7px;
      border: 1px solid var(--line);
      background: var(--panel);
      line-height: 1;
    }

    .nav a.active {
      background: #14202c;
      border-color: #14202c;
      color: #fff;
    }

    .wrap {
      max-width: 1500px;
      margin: 0 auto;
      padding: 18px 24px 24px;
    }

    h1 {
      margin: 0 0 6px;
      font-size: 24px;
      line-height: 1.2;
    }

    h2 {
      margin: 0;
      font-size: 18px;
    }

    .lead {
      margin: 0;
      color: var(--muted);
      line-height: 1.45;
    }

    .panel {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      margin-bottom: 18px;
      box-shadow: var(--shadow);
      overflow: hidden;
    }

    .panel-head {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 18px;
      align-items: start;
      padding: 18px 22px;
      border-bottom: 1px solid var(--line);
    }

    .panel-body {
      padding: 18px 22px 22px;
    }

    .row {
      display: grid;
      grid-template-columns: minmax(260px, 1.4fr) minmax(220px, 1fr) 160px 170px 170px 100px;
      gap: 12px;
      align-items: end;
    }

    .scope-row {
      display: grid;
      grid-template-columns: minmax(240px, 340px) auto minmax(220px, 1fr);
      gap: 12px;
      align-items: end;
      padding: 14px;
      margin-bottom: 14px;
      border: 1px solid #cfe7ea;
      border-radius: 8px;
      background: #f1fafb;
    }

    .scope-toggle {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-height: 44px;
      margin: 0;
      color: var(--text);
      line-height: 1.25;
      white-space: nowrap;
    }

    .scope-toggle input {
      width: 16px;
      height: 16px;
      margin: 0;
      padding: 0;
      flex: 0 0 auto;
    }

    .scope-status {
      align-self: center;
      color: #0d6270;
      font-size: 13px;
      line-height: 1.45;
    }

    label {
      display: block;
      font-size: 13px;
      color: var(--muted);
      margin-bottom: 8px;
    }

    input, textarea, button {
      width: 100%;
      border-radius: 7px;
      border: 1px solid var(--line);
      background: var(--panel);
      color: var(--text);
      font: inherit;
    }

    input, textarea {
      padding: 12px 14px;
    }

    textarea {
      min-height: 96px;
      resize: vertical;
      line-height: 1.5;
    }

    button {
      padding: 12px 14px;
      cursor: pointer;
      background: #14202c;
      border-color: #14202c;
      color: #fff;
      font-weight: 600;
    }

    button.secondary {
      background: var(--panel);
      border-color: var(--line);
      color: var(--text);
    }

    .actions {
      display: flex;
      gap: 10px;
      margin-top: 14px;
    }

    .status {
      margin-top: 12px;
      color: var(--muted);
      min-height: 20px;
    }

    .answer {
      white-space: pre-wrap;
      line-height: 1.6;
    }

    .summary {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }

    .hint {
      color: var(--muted);
      font-size: 13px;
      margin-top: 10px;
      line-height: 1.5;
    }

    .summary button {
      width: auto;
      border: 1px solid var(--line);
      background: var(--accent-soft);
      color: var(--accent);
      border-radius: 999px;
      padding: 6px 10px;
      cursor: pointer;
    }

    .workspace {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 420px;
      gap: 18px;
      align-items: start;
    }

    .results-list {
      display: grid;
      gap: 10px;
    }

    .result {
      padding: 14px;
      border-radius: 8px;
      border: 1px solid var(--line);
      background: var(--panel);
    }

    .result-head {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 10px;
      align-items: start;
      margin-bottom: 8px;
    }

    .result h3 {
      margin: 0;
      font-size: 16px;
      line-height: 1.3;
      word-break: break-word;
    }

    .meta {
      color: var(--muted);
      font-size: 13px;
      line-height: 1.5;
      margin-bottom: 8px;
    }

    .excerpt {
      line-height: 1.55;
      color: #1c2a39;
    }

    .link {
      color: var(--accent);
      text-decoration: none;
      font-weight: 700;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      padding: 3px 8px;
      border-radius: 999px;
      background: var(--accent-soft);
      border: 1px solid #bde3e7;
      color: var(--accent);
      font-size: 12px;
      line-height: 1.2;
      white-space: nowrap;
    }

    .pill.page {
      color: #314456;
      background: #f2f6f9;
      border-color: var(--line);
    }

    .pill.warn {
      color: var(--warn);
      background: var(--warn-soft);
      border-color: #ffd89b;
    }

    .pill-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 8px 0;
    }

    .ok {
      color: var(--ok);
    }

    select {
      width: 100%;
      border-radius: 7px;
      border: 1px solid var(--line);
      background: var(--panel);
      color: var(--text);
      font: inherit;
      padding: 12px 14px;
    }

    .empty-state {
      border: 1px dashed #c8d5e1;
      border-radius: 8px;
      background: var(--panel-2);
      color: var(--muted);
      padding: 18px;
      line-height: 1.45;
    }

    .side-panel {
      position: sticky;
      top: 86px;
    }

    .answer {
      min-height: 160px;
      color: #1c2a39;
    }

    @media (max-width: 800px) {
      .topbar {
        align-items: flex-start;
        flex-direction: column;
      }

      .nav {
        justify-content: flex-start;
      }

      .wrap {
        padding: 12px;
      }

      .panel-head {
        grid-template-columns: 1fr;
      }

      .row {
        grid-template-columns: 1fr;
      }

      .scope-row {
        grid-template-columns: 1fr;
      }

      .scope-toggle {
        min-height: auto;
        white-space: normal;
      }

      .workspace {
        grid-template-columns: 1fr;
      }

      .actions {
        flex-direction: column;
      }

      .side-panel {
        position: static;
      }
    }
  </style>
</head>
<body>
  <header class="topbar">
    <a class="brand" href="/ui/consult"><span class="brand-mark">LR</span><span>LOCAL-RAG-PLATFORM</span></a>
    <nav class="nav" aria-label="Главная навигация">
      <a href="/ui/consult">Консультант</a>
      <a href="/ui/ingest">Загрузка документов</a>
      <a href="/ui/nodes">Разделы базы</a>
      <a href="/ui/jobs">Админ / состояние базы</a>
      <a class="active" href="/ui/pages-search">Поиск по страницам PDF</a>
    </nav>
  </header>
  <div class="wrap">
    <div class="panel">
      <div class="panel-head">
        <div>
          <h1>Поиск по страницам PDF</h1>
          <p class="lead">Ищите конкретные страницы, схемы, таблицы, содержания и сигналы внутри PDF-документов.</p>
        </div>
        <button id="searchBtn" type="button">Найти страницы</button>
      </div>
      <div class="panel-body">
        <div class="scope-row">
          <div>
            <label for="nodeSelect">Рабочий раздел</label>
            <select id="nodeSelect">
              <option value="">Разделы загружаются</option>
            </select>
          </div>
          <label class="scope-toggle" for="includeChildren">
            <input id="includeChildren" type="checkbox" checked />
            <span>Раздел и вложенные</span>
          </label>
          <div id="scopeStatus" class="scope-status">Контекст раздела загружается.</div>
        </div>
        <div class="row">
          <div>
            <label for="query">Запрос</label>
            <input id="query" value="АРХИВНЫЕ СВЕДЕНИЯ ОБ ИЗМЕНЕНИЯХ В ДОКУМЕНТАЦИИ" />
          </div>
          <div>
            <label for="documentId">Документ</label>
            <select id="documentId">
              <option value="">Все документы</option>
            </select>
          </div>
          <div>
            <label for="assetClass">Тип страниц</label>
            <select id="assetClass">
              <option value="all">Все</option>
              <option value="title">Титулы</option>
              <option value="contents">Содержание</option>
              <option value="changelog">Изменения</option>
              <option value="legal">Юридические</option>
              <option value="signals">Сигналы/теги</option>
              <option value="table">Таблицы</option>
              <option value="scheme">Схемы</option>
              <option value="screen">Экраны</option>
              <option value="text">Текст</option>
            </select>
          </div>
          <div>
            <label for="engineeringTopic">Инженерная тема</label>
            <select id="engineeringTopic">
              <option value="all">Все темы</option>
            </select>
          </div>
          <div>
            <label for="signalTag">Сигнал / тег</label>
            <input id="signalTag" placeholder="Например, LIT-101" />
          </div>
          <div>
            <label for="limit">Лимит</label>
            <input id="limit" type="number" min="1" max="10" value="3" />
          </div>
        </div>
        <div class="actions">
          <button id="browseBtn" class="secondary" type="button">Показать страницы типа</button>
          <button id="visualSearchBtn" class="secondary" type="button">Визуальный поиск</button>
          <button id="askBtn" class="secondary" type="button">Спросить по страницам</button>
          <button id="reclassifyBtn" class="secondary" type="button">Обновить классификацию</button>
        </div>
        <div class="actions">
          <input id="pagesToBuild" placeholder="Страницы для preview/OCR: 1-5, 12" />
          <select id="ocrMode">
            <option value="off">OCR выкл.</option>
            <option value="try">OCR если доступен</option>
            <option value="require">OCR обязателен</option>
          </select>
          <label class="scope-toggle" for="createPreview">
            <input id="createPreview" type="checkbox" checked />
            <span>Preview</span>
          </label>
          <button id="rebuildVisualBtn" class="secondary" type="button">Создать preview/OCR</button>
        </div>
        <div id="status" class="status"></div>
        <div class="hint">Для preview/OCR сначала выберите PDF и укажите страницы. OCR запускается только локальной командой tesseract, если она установлена в контейнере.</div>
        <div id="summary" class="summary"></div>
        <div id="topics" class="summary"></div>
        <div id="signalTags" class="summary"></div>
      </div>
    </div>

    <div class="workspace">
      <div class="panel">
        <div class="panel-head">
          <h2>Найденные страницы</h2>
        </div>
        <div class="panel-body">
          <div id="results" class="results-list"><div class="empty-state">Пока пусто. Выполните поиск или выберите тип страниц.</div></div>
        </div>
      </div>

      <aside class="panel side-panel">
        <div class="panel-head">
          <h2>Ответ по страницам</h2>
        </div>
        <div class="panel-body">
          <div id="answer" class="answer">Ответ ещё не запрашивался. Нажмите «Спросить по страницам».</div>
        </div>
      </aside>
    </div>
  </div>

  <script>
    const queryEl = document.getElementById("query");
    const limitEl = document.getElementById("limit");
    const documentIdEl = document.getElementById("documentId");
    const nodeSelectEl = document.getElementById("nodeSelect");
    const includeChildrenEl = document.getElementById("includeChildren");
    const scopeStatusEl = document.getElementById("scopeStatus");
    const assetClassEl = document.getElementById("assetClass");
    const engineeringTopicEl = document.getElementById("engineeringTopic");
    const signalTagEl = document.getElementById("signalTag");
    const statusEl = document.getElementById("status");
    const summaryEl = document.getElementById("summary");
    const resultsEl = document.getElementById("results");
    const answerEl = document.getElementById("answer");
    const searchBtn = document.getElementById("searchBtn");
    const browseBtn = document.getElementById("browseBtn");
    const visualSearchBtn = document.getElementById("visualSearchBtn");
    const askBtn = document.getElementById("askBtn");
    const reclassifyBtn = document.getElementById("reclassifyBtn");
    const rebuildVisualBtn = document.getElementById("rebuildVisualBtn");
    const pagesToBuildEl = document.getElementById("pagesToBuild");
    const ocrModeEl = document.getElementById("ocrMode");
    const createPreviewEl = document.getElementById("createPreview");
    const topicsEl = document.getElementById("topics");
    const signalTagsEl = document.getElementById("signalTags");
    let knowledgeNodes = [];
    let currentNodeId = "";
    let currentIncludeChildren = true;
    const assetClassLabels = {
      all: "Все",
      title: "Титул",
      contents: "Содержание",
      changelog: "Изменения",
      legal: "Юридическая",
      signals: "Сигналы/теги",
      table: "Таблица",
      scheme: "Схема",
      screen: "Экран",
      text: "Текст",
      empty: "Пустая",
      unknown: "Не определено",
    };
    const methodLabels = {
      semantic: "Смысловой",
      lexical: "Точный",
      browse: "Просмотр",
    };
    const modeLabels = {
      llm: "ответ модели",
      "fallback-source-snippet": "быстрый ответ по источнику",
      "fallback-empty": "источники не найдены",
    };

    function setStatus(text, ok = false) {
      statusEl.textContent = text;
      statusEl.className = ok ? "status ok" : "status";
    }

    function translateAssetClass(value) {
      return assetClassLabels[value] || value || "Не определено";
    }

    function translateMethod(value) {
      return methodLabels[value] || value || "Неизвестно";
    }

    function translateMode(value) {
      return modeLabels[value] || value || "неизвестно";
    }

    function safeArray(value) {
      return Array.isArray(value) ? value.filter(Boolean) : [];
    }

    function basenameFromPath(value) {
      if (!value) {
        return "";
      }
      const normalized = String(value).replace(/\\\\/g, "/");
      const parts = normalized.split("/");
      return parts[parts.length - 1] || normalized;
    }

    function localizePageTitle(title) {
      return String(title || "")
        .replace(/ - Page (\\d+)$/i, " - Страница $1")
        .replace(/^PDF Page (\\d+)$/i, "Страница $1");
    }

    function buildDisplayTitle(item) {
      const page = item.page_number ?? null;
      const sourceName =
        item.source_file_name ||
        basenameFromPath(item.source_path) ||
        "";

      if (sourceName && typeof page === "number") {
        return sourceName + " - Страница " + page;
      }

      if (typeof page === "number" && item.title) {
        return localizePageTitle(item.title);
      }

      if (item.title) {
        return localizePageTitle(item.title);
      }

      return "Без названия";
    }

    function compactPath(value) {
      if (!value) {
        return "";
      }

      const normalized = String(value).replace(/\\\\/g, "/");
      const parts = normalized.split("/").filter(Boolean);
      if (parts.length <= 3) {
        return normalized;
      }

      return ".../" + parts.slice(-3).join("/");
    }

    function escapeHtml(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    function formatNumber(value) {
      return new Intl.NumberFormat("ru-RU").format(Number(value || 0));
    }

    function flattenNodeTree(items, depth = 0) {
      return (Array.isArray(items) ? items : []).flatMap((item) => {
        const current = { ...item, depth };
        return [current, ...flattenNodeTree(item.children || [], depth + 1)];
      });
    }

    function currentNode() {
      return knowledgeNodes.find((item) => String(item.id) === String(currentNodeId)) || null;
    }

    function readScopeFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const urlNodeId = params.get("nodeId") || "";
      const urlIncludeChildren = params.get("includeChildren");

      return {
        nodeId: urlNodeId,
        includeChildren:
          urlIncludeChildren === null
            ? true
            : ["1", "true", "yes", "on", "да"].includes(urlIncludeChildren.toLowerCase()),
      };
    }

    function hasScopeInUrl() {
      const params = new URLSearchParams(window.location.search);
      return params.has("nodeId") || params.has("includeChildren");
    }

    async function readSavedUiScope() {
      try {
        const response = await fetch("/ui/state");
        const data = await response.json();
        if (!response.ok || data.ok !== true) {
          return null;
        }
        const state = data.state || {};
        return {
          nodeId: state.currentNodeId || "",
          includeChildren: state.includeChildren !== false,
        };
      } catch (error) {
        return null;
      }
    }

    async function resolveInitialScope() {
      const urlScope = readScopeFromUrl();
      if (hasScopeInUrl()) {
        return urlScope;
      }
      return (await readSavedUiScope()) || urlScope;
    }

    async function saveUiScope() {
      try {
        await fetch("/ui/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentNodeId: currentNodeId || null,
            includeChildren: currentIncludeChildren,
          }),
        });
      } catch (error) {
        console.warn("Не удалось сохранить контекст UI", error);
      }
    }

    function syncScopeUrl() {
      const url = new URL(window.location.href);
      if (currentNodeId) {
        url.searchParams.set("nodeId", currentNodeId);
      } else {
        url.searchParams.delete("nodeId");
      }
      url.searchParams.set("includeChildren", String(currentIncludeChildren));
      window.history.replaceState({}, "", url);
    }

    function syncIncludeChildrenControl() {
      const node = currentNode();
      const label = includeChildrenEl.closest(".scope-toggle") || includeChildrenEl.parentElement;
      const systemScope = node?.isSystem === true;
      if (systemScope) {
        currentIncludeChildren = false;
        includeChildrenEl.checked = false;
      }
      includeChildrenEl.disabled = systemScope;
      if (label) {
        label.hidden = systemScope;
      }
    }

    function renderScopeStatus() {
      const node = currentNode();
      if (!node) {
        scopeStatusEl.textContent = "Раздел не выбран. Поиск страниц идёт по всей базе.";
        return;
      }

      const counts = node.counts || {};
      const docs = formatNumber(counts.scopeDocuments ?? counts.directDocuments ?? 0);
      const pages = formatNumber(counts.scopePages ?? 0);
      scopeStatusEl.textContent = (
        "Текущий контекст: " +
        node.name +
        " · " +
        docs +
        " документов" +
        (Number(counts.scopePages || 0) > 0 ? " · " + pages + " страниц" : "")
      );
    }

    function populateNodeSelect() {
      if (!knowledgeNodes.length) {
        nodeSelectEl.innerHTML = '<option value="">Все разделы</option>';
        nodeSelectEl.value = "";
        renderScopeStatus();
        return;
      }

      nodeSelectEl.innerHTML = knowledgeNodes
        .map((item) => {
          const prefix = item.depth > 0 ? Array(item.depth + 1).join("— ") : "";
          const counts = item.counts || {};
          const docs = Number(counts.scopeDocuments ?? counts.directDocuments ?? 0);
          const label = prefix + item.name + " (" + docs + ")";
          return '<option value="' + escapeHtml(item.id) + '">' + escapeHtml(label) + '</option>';
        })
        .join("");
      nodeSelectEl.value = currentNodeId;
      includeChildrenEl.checked = currentIncludeChildren;
      syncIncludeChildrenControl();
      renderScopeStatus();
    }

    function renderResults(items) {
      if (!items || items.length === 0) {
        resultsEl.innerHTML = "<div class=\\"empty-state\\">Страницы не найдены. Попробуйте уточнить запрос, выбрать другой тип страниц или снять фильтр документа.</div>";
        return;
      }

      resultsEl.innerHTML = items.map((item) => {
        const assetUrl = item.asset_url || item.asset_preview_url || "";
        const page = item.page_number ?? "-";
        const displayTitle = buildDisplayTitle(item);
        const assetClass = item.asset_class
          ? "<span class=\\"pill\\">" + escapeHtml(translateAssetClass(item.asset_class)) + "</span>"
          : "";
        const methods = Array.isArray(item.methods)
          ? item.methods.slice(0, 3)
              .map((m) => "<span class=\\"pill\\">" + escapeHtml(translateMethod(m)) + "</span>")
              .join("")
          : "";
        const topics = safeArray(item.engineeringTopics || item.engineering_topics)
          .slice(0, 4)
          .map((topic) => "<span class=\\"pill\\">" + escapeHtml(topic) + "</span>")
          .join("");
        const signals = safeArray(item.signalTags || item.signal_tags)
          .slice(0, 6)
          .map((tag) => "<span class=\\"pill\\">" + escapeHtml(tag) + "</span>")
          .join("");
        const confidence = item.confidence || item.asset_confidence
          ? "<span class=\\"pill warn\\">Уверенность: " + escapeHtml(item.confidence || item.asset_confidence) + "</span>"
          : "";
        const ocrStatus = item.ocrStatus || item.metadata?.ocrStatus || "";
        const ocr = ocrStatus && ocrStatus !== "off"
          ? "<span class=\\"pill\\">OCR: " + escapeHtml(ocrStatus) + "</span>"
          : "";
        const excerpt = item.textExcerpt || item.text || "";
        const source = compactPath(item.source_path || "");
        return \`
          <div class="result">
            <div class="result-head">
              <h3>\${escapeHtml(displayTitle)}</h3>
              <span class="pill page">стр. \${escapeHtml(page)}</span>
            </div>
            <div class="meta">
              \${source ? "Источник: " + escapeHtml(source) + "<br />" : ""}
              \${assetUrl ? '<a class="link" href="' + escapeHtml(assetUrl) + '" target="_blank" rel="noopener">Открыть предпросмотр страницы</a>' : ""}
            </div>
            <div class="pill-row">\${assetClass}\${confidence}\${ocr}\${methods}\${topics}\${signals}</div>
            <div class="excerpt">\${escapeHtml(excerpt)}</div>
          </div>
        \`;
      }).join("");
    }

    function renderSummary(items) {
      if (!items || items.length === 0) {
        summaryEl.innerHTML = "";
        return;
      }

      summaryEl.innerHTML = items
        .map((item) => (
          '<button type="button" data-asset-class="' + item.assetClass + '">' +
          translateAssetClass(item.assetClass) + ': ' + item.count +
          '</button>'
        ))
        .join("");

      summaryEl.querySelectorAll("button[data-asset-class]").forEach((button) => {
        button.addEventListener("click", async () => {
          assetClassEl.value = button.dataset.assetClass;
          await runBrowseByType();
        });
      });
    }

    function renderTopics(items) {
      if (!items || items.length === 0) {
        topicsEl.innerHTML = "";
        engineeringTopicEl.innerHTML = '<option value="all">Все темы</option>';
        return;
      }

      engineeringTopicEl.innerHTML = ['<option value="all">Все темы</option>']
        .concat(
          items.map((item) => (
            '<option value="' + item.topic + '">' + item.topic + " (" + item.count + ")</option>"
          ))
        )
        .join("");

      topicsEl.innerHTML = items
        .map((item) => (
          '<button type="button" data-engineering-topic="' + item.topic + '">' +
          item.topic + ': ' + item.count +
          "</button>"
        ))
        .join("");

      topicsEl.querySelectorAll("button[data-engineering-topic]").forEach((button) => {
        button.addEventListener("click", async () => {
          engineeringTopicEl.value = button.dataset.engineeringTopic;
          await runBrowseByType();
        });
      });
    }

    function renderSignalTags(items) {
      if (!items || items.length === 0) {
        signalTagsEl.innerHTML = "";
        return;
      }

      signalTagsEl.innerHTML = items
        .map((item) => (
          '<button type="button" data-signal-tag="' + item.tag + '">' +
          item.tag + ': ' + item.count +
          "</button>"
        ))
        .join("");

      signalTagsEl.querySelectorAll("button[data-signal-tag]").forEach((button) => {
        button.addEventListener("click", async () => {
          signalTagEl.value = button.dataset.signalTag;
          await runBrowseByType();
        });
      });
    }

    async function postJson(url, body) {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || ("HTTP " + response.status));
      }
      return response.json();
    }

    async function loadNodes() {
      const requestedScope = await resolveInitialScope();
      const response = await fetch("/nodes?format=tree");
      const data = await response.json();
      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || "Не удалось загрузить разделы");
      }

      knowledgeNodes = flattenNodeTree(data.items || []);
      const requestedExists = knowledgeNodes.some(
        (item) => String(item.id) === String(requestedScope.nodeId)
      );
      const systemNode = knowledgeNodes.find((item) => item.isSystem === true);
      const fallbackNode = systemNode || knowledgeNodes[0] || null;

      currentNodeId = requestedExists ? requestedScope.nodeId : (fallbackNode?.id || "");
      currentIncludeChildren = requestedScope.includeChildren;
      populateNodeSelect();
      syncScopeUrl();
    }

    async function loadDocuments() {
      try {
        const params = new URLSearchParams();
        if (currentNodeId) {
          params.set("nodeId", currentNodeId);
          params.set("includeChildren", String(currentIncludeChildren));
        }

        const selectedDocumentId = documentIdEl.value || "";
        const response = await fetch("/documents" + (params.toString() ? "?" + params.toString() : ""));
        const data = await response.json();
        const items = Array.isArray(data.items) ? data.items : [];
        const availableIds = new Set(items.map((item) => String(item.id)));
        const options = ['<option value="">Все документы</option>']
          .concat(items.map((item) => {
            const displayName =
              item.original_file_name ||
              basenameFromPath(item.original_file_path) ||
              item.title ||
              item.id;
            const label = displayName + " [" + item.id + "]";
            return '<option value="' + item.id + '">' + label + '</option>';
          }))
          .join("");
        documentIdEl.innerHTML = options;
        documentIdEl.value = availableIds.has(String(selectedDocumentId)) ? selectedDocumentId : "";
        renderScopeStatus();
      } catch (error) {
        setStatus("Не удалось загрузить список документов: " + error.message);
      }
    }

    async function loadDocumentSummary() {
      const documentId = documentIdEl.value || null;
      if (!documentId) {
        renderSummary([]);
        renderTopics([]);
        renderSignalTags([]);
        return;
      }

      try {
        const response = await fetch("/documents/" + documentId + "/assets");
        const data = await response.json();
        renderSummary(data.assets?.byType || []);
        renderTopics(data.assets?.byTopic || []);
        renderSignalTags(data.assets?.bySignalTag || []);
      } catch (error) {
        setStatus("Не удалось загрузить сводку документа: " + error.message);
      }
    }

    function buildPagePayload(base) {
      return {
        ...base,
        nodeId: currentNodeId || null,
        includeChildren: currentIncludeChildren,
      };
    }

    async function applyNodeScope() {
      currentNodeId = nodeSelectEl.value || "";
      currentIncludeChildren = includeChildrenEl.checked;
      syncIncludeChildrenControl();
      documentIdEl.value = "";
      renderSummary([]);
      renderTopics([]);
      renderSignalTags([]);
      renderScopeStatus();
      syncScopeUrl();
      await saveUiScope();
      await loadDocuments();
      resultsEl.innerHTML = '<div class="empty-state">Контекст раздела изменён. Выполните поиск или выберите документ для просмотра страниц.</div>';
      answerEl.textContent = "Ответ не обновлялся. Нажмите «Спросить по страницам».";
      const node = currentNode();
      setStatus("Рабочий раздел применён: " + (node?.name || "вся база"), true);
    }

    async function runSearch() {
      const query = queryEl.value.trim();
      const limit = Number(limitEl.value || 3);
      const documentId = documentIdEl.value || null;
      const assetClass = assetClassEl.value || "all";
      const engineeringTopic = engineeringTopicEl.value || "all";
      const signalTag = signalTagEl.value.trim() || "all";
      if (!query) {
        setStatus("Введите запрос.");
        return;
      }

      answerEl.textContent = "Ответ не обновлялся. Чтобы получить интерпретацию найденных страниц, нажмите «Спросить по страницам».";
      setStatus("Ищу страницы...");
      resultsEl.innerHTML = '<div class="empty-state">Ищу страницы в локальной базе...</div>';
      try {
        const data = await postJson("/search/pages", buildPagePayload({
          query,
          limit,
          assetClass,
          engineeringTopic,
          signalTag,
          documentId,
        }));
        renderResults(data.items || []);
        const count = data.items?.length || 0;
        setStatus("Готово. Найдено страниц: " + count, true);
      } catch (error) {
        setStatus("Ошибка поиска: " + error.message);
      }
    }

    async function runVisualSearch() {
      const query = queryEl.value.trim();
      const limit = Number(limitEl.value || 3);
      const documentId = documentIdEl.value || null;
      const assetClass = assetClassEl.value || "all";
      const engineeringTopic = engineeringTopicEl.value || "all";
      const signalTag = signalTagEl.value.trim() || "all";
      if (!query) {
        setStatus("Введите запрос.");
        return;
      }

      answerEl.textContent = "Ответ не обновлялся. Сейчас показан визуальный поиск по PDF-страницам.";
      setStatus("Ищу схемы, экраны, таблицы и страницы сигналов...");
      resultsEl.innerHTML = '<div class="empty-state">Ищу визуальные PDF-страницы в локальной базе...</div>';
      try {
        const data = await postJson("/search/visual", buildPagePayload({
          query,
          limit,
          assetClass,
          engineeringTopic,
          signalTag,
          documentId,
        }));
        renderResults(data.items || []);
        const count = data.items?.length || 0;
        setStatus("Готово. Визуальных страниц найдено: " + count, true);
      } catch (error) {
        setStatus("Ошибка визуального поиска: " + error.message);
      }
    }

    async function runBrowseByType() {
      const documentId = documentIdEl.value || null;
      const assetClass = assetClassEl.value || "all";
      const engineeringTopic = engineeringTopicEl.value || "all";
      const signalTag = signalTagEl.value.trim() || "all";
      if (!documentId) {
        setStatus("Сначала выберите документ.");
        return;
      }

      answerEl.textContent = "Ответ не обновлялся. Это режим просмотра страниц по типу.";
      setStatus("Загружаю страницы выбранного типа...");
      resultsEl.innerHTML = '<div class="empty-state">Загружаю страницы выбранного документа...</div>';
      try {
        const response = await fetch(
          "/documents/" +
            documentId +
            "/assets/browse?assetClass=" +
            encodeURIComponent(assetClass) +
            "&engineeringTopic=" +
            encodeURIComponent(engineeringTopic) +
            "&signalTag=" +
            encodeURIComponent(signalTag)
        );
        const data = await response.json();
        const items = Array.isArray(data.items)
          ? data.items.map((item) => ({
              page_number: item.page,
              title: item.title,
              text: item.text,
              textExcerpt: item.textExcerpt,
              source_path: data.originalFilePath || data.title,
              source_file_name: data.originalFileName || "",
              asset_class: item.assetClass,
              confidence: item.confidence,
              engineeringTopics: item.engineeringTopics,
              signalTags: item.signalTags,
              metadata: item.metadata,
              ocrStatus: item.metadata?.ocrStatus || item.ocrStatus,
              asset_url: item.url,
              asset_preview_url: item.url || (item.page ? "/documents/" + data.documentId + "/pages/" + item.page + "/preview" : null),
              methods: ["browse"],
            }))
          : [];
        renderResults(items);
        renderSummary(data.byType || []);
        renderTopics(data.byTopic || []);
        renderSignalTags(data.bySignalTag || []);
        setStatus("Готово. Страниц этого типа: " + (data.totalItems || 0), true);
      } catch (error) {
        setStatus("Ошибка просмотра: " + error.message);
      }
    }

    async function runReclassify() {
      const documentId = documentIdEl.value || null;
      if (!documentId) {
        setStatus("Сначала выберите документ.");
        return;
      }

      setStatus("Обновляю классификацию страниц...");
      try {
        const data = await postJson("/documents/" + documentId + "/reclassify-assets", {});
        renderSummary(data.byType || []);
        renderTopics(data.byTopic || []);
        renderSignalTags(data.bySignalTag || []);
        setStatus("Классификация обновлена. Страниц обработано: " + (data.updated || 0), true);
      } catch (error) {
        setStatus("Ошибка пере-классификации: " + error.message);
      }
    }

    async function runRebuildVisualAssets() {
      const documentId = documentIdEl.value || null;
      if (!documentId) {
        setStatus("Сначала выберите PDF-документ.");
        return;
      }

      setStatus("Создаю preview/OCR для выбранных страниц...");
      resultsEl.innerHTML = '<div class="empty-state">Обрабатываю выбранные страницы PDF...</div>';
      try {
        const data = await postJson("/documents/" + documentId + "/rebuild-visual-assets", {
          pages: pagesToBuildEl.value.trim(),
          maxPages: 20,
          createPreview: createPreviewEl.checked,
          ocrMode: ocrModeEl.value || "off",
        });
        const items = Array.isArray(data.items)
          ? data.items.map((item) => ({
              page_number: item.page,
              title: item.title,
              text: item.text,
              textExcerpt: item.textExcerpt,
              source_path: data.title,
              asset_class: item.assetClass,
              confidence: item.confidence,
              engineeringTopics: item.engineeringTopics,
              signalTags: item.signalTags,
              metadata: item.metadata,
              ocrStatus: item.metadata?.ocrStatus || item.ocrStatus,
              asset_url: item.url,
              asset_preview_url: item.url || (item.page ? "/documents/" + data.documentId + "/pages/" + item.page + "/preview" : null),
              methods: ["browse"],
            }))
          : [];
        renderResults(items);
        renderSummary(data.byType || []);
        renderTopics(data.byTopic || []);
        renderSignalTags(data.bySignalTag || []);
        setStatus("Preview/OCR обновлены. Страниц обработано: " + (data.updated || 0), true);
      } catch (error) {
        setStatus("Ошибка preview/OCR: " + error.message);
      }
    }

    async function runAsk() {
      const question = queryEl.value.trim();
      const limit = Number(limitEl.value || 3);
      const documentId = documentIdEl.value || null;
      const assetClass = assetClassEl.value || "all";
      const engineeringTopic = engineeringTopicEl.value || "all";
      const signalTag = signalTagEl.value.trim() || "all";
      if (!question) {
        setStatus("Введите вопрос.");
        return;
      }

      setStatus("Строю ответ по страницам...");
      answerEl.textContent = "Готовлю ответ по найденным страницам...";
      resultsEl.innerHTML = '<div class="empty-state">Ищу страницы для ответа...</div>';
      try {
        const data = await postJson("/ask/pages", buildPagePayload({
          question,
          limit,
          assetClass,
          engineeringTopic,
          signalTag,
          documentId,
        }));
        answerEl.textContent = data.answer || "Пустой ответ.";
        renderResults(data.sources || []);
        setStatus("Ответ готов. Режим: " + translateMode(data.mode), true);
      } catch (error) {
        setStatus("Ошибка ответа: " + error.message);
      }
    }

    searchBtn.addEventListener("click", runSearch);
    browseBtn.addEventListener("click", runBrowseByType);
    visualSearchBtn.addEventListener("click", runVisualSearch);
    askBtn.addEventListener("click", runAsk);
    reclassifyBtn.addEventListener("click", runReclassify);
    rebuildVisualBtn.addEventListener("click", runRebuildVisualAssets);
    documentIdEl.addEventListener("change", loadDocumentSummary);
    nodeSelectEl.addEventListener("change", applyNodeScope);
    includeChildrenEl.addEventListener("change", applyNodeScope);
    (async () => {
      try {
        await loadNodes();
      } catch (error) {
        setStatus("Не удалось загрузить разделы: " + error.message);
        scopeStatusEl.textContent = "Разделы недоступны. Поиск страниц будет выполнен без ограничения разделом.";
      }
      await loadDocuments();
    })();
  </script>
</body>
</html>`;
}

function renderIngestHtml() {
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Загрузка документов</title>
  <style>
    :root {
      color-scheme: light;
      --font: "Segoe UI", Arial, sans-serif;
      --bg: #f4f6f8;
      --panel: #ffffff;
      --panel-2: #f8fafb;
      --ink: #18212b;
      --muted: #687482;
      --line: #dbe2e8;
      --accent: #176b87;
      --accent-2: #0f8a63;
      --warn: #b46a11;
      --danger: #b64343;
      --ok: #15845f;
      --shadow: 0 16px 38px rgba(25, 35, 45, 0.08);
      --radius: 8px;
    }

    * { box-sizing: border-box; }
    html, body { height: 100%; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: var(--font);
      letter-spacing: 0;
      overflow: hidden;
    }

    a { color: inherit; text-decoration: none; }
    button, input, select, textarea { font: inherit; }
    button { cursor: pointer; }
    .app-frame { height: 100vh; display: grid; grid-template-rows: auto minmax(0, 1fr); }
    .topbar {
      height: 58px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      padding: 0 22px;
      border-bottom: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(12px);
      position: sticky;
      top: 0;
      z-index: 5;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 220px;
      font-weight: 700;
      color: var(--text);
      text-decoration: none;
    }
    .brand-mark {
      width: 28px;
      height: 28px;
      border-radius: 7px;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, #113a4a, #24a07b);
      color: #fff;
      font-size: 13px;
      font-weight: 800;
    }

    .main-nav,
    .filter-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .nav-link,
    .btn {
      border: 1px solid var(--line);
      background: #fff;
      border-radius: 7px;
      min-height: 34px;
      padding: 7px 11px;
      color: #26323e;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      white-space: nowrap;
    }

    .nav-link.active,
    .btn.primary {
      border-color: transparent;
      background: var(--ink);
      color: #fff;
    }

    .btn.soft { background: var(--panel-2); }
    .btn.good {
      border-color: #b9ded0;
      background: #eaf8f1;
      color: #0d6f4f;
    }
    .btn.warn {
      border-color: #f0cf97;
      background: #fff6e7;
      color: #8c520c;
    }
    .btn.danger {
      border-color: #efb7b7;
      background: #fff0f0;
      color: #9b3030;
    }

    .shell {
      width: min(1680px, 100%);
      margin: 0 auto;
      padding: 18px;
      height: calc(100vh - 58px);
      min-height: 0;
      overflow: hidden;
    }

    .workspace {
      display: grid;
      grid-template-columns: 320px minmax(0, 1fr);
      gap: 14px;
      height: 100%;
      min-height: 0;
      align-items: stretch;
    }

    .left-rail {
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: #fff;
      display: grid;
      grid-template-rows: auto 1fr;
      overflow: hidden;
      min-height: 0;
    }

    .rail-head,
    .section-head {
      padding: 14px;
      border-bottom: 1px solid var(--line);
    }

    .rail-head h2,
    .section-head h2,
    .panel h2 {
      margin: 0;
      font-size: 18px;
    }

    .doc-list,
    .queue {
      overflow: auto;
      padding: 10px;
      display: grid;
      gap: 8px;
      align-content: start;
    }

    .doc-item,
    .queue-item,
    .metric-row {
      border: 1px solid var(--line);
      border-radius: 7px;
      background: #fff;
      padding: 10px;
    }

    button.doc-item {
      width: 100%;
      text-align: left;
      color: var(--ink);
      cursor: pointer;
    }

    .doc-item.active {
      border-color: #8fc7d7;
      background: #eefaff;
    }

    .doc-title,
    .task-title {
      font-weight: 650;
      margin-bottom: 5px;
    }

    .meta-line {
      display: flex;
      align-items: center;
      gap: 7px;
      flex-wrap: wrap;
      color: var(--muted);
      font-size: 12px;
    }

    .status {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      border-radius: 999px;
      padding: 3px 8px;
      font-size: 12px;
      border: 1px solid var(--line);
      background: var(--panel-2);
      color: #394653;
      white-space: nowrap;
    }

    .status.ok {
      border-color: #b9ded0;
      background: #eaf8f1;
      color: var(--ok);
    }

    .status.warn {
      border-color: #f0cf97;
      background: #fff6e7;
      color: var(--warn);
    }

    .status.bad {
      border-color: #efb7b7;
      background: #fff0f0;
      color: var(--danger);
    }

    .work-main {
      display: grid;
      gap: 14px;
      min-width: 0;
      min-height: 0;
      align-content: start;
    }

    .workspace > .work-main {
      overflow: hidden;
      align-content: stretch;
    }

    .upload-grid {
      display: grid;
      grid-template-columns: minmax(560px, 1fr) 430px;
      gap: 14px;
      align-items: stretch;
      height: 100%;
      min-height: 0;
    }

    .upload-grid > .work-main {
      overflow: auto;
      align-content: start;
      padding-right: 2px;
    }

    .upload-grid > aside.work-main {
      overflow: hidden;
      align-content: stretch;
    }

    .panel {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
    }

    .panel-body {
      padding: 12px;
      display: grid;
      gap: 10px;
      align-content: start;
      min-height: 0;
    }

    .left-rail .rail-head {
      padding: 12px 14px;
    }

    .left-rail .panel-body {
      overflow: auto;
      gap: 8px;
      padding: 10px;
    }

    .left-rail .explain-box {
      padding: 8px 9px;
      font-size: 12px;
    }

    .dedupe-note {
      color: var(--muted);
      font-size: 12px;
      line-height: 1.35;
    }

    .rail-section {
      border-top: 1px solid var(--line);
      padding-top: 10px;
      display: grid;
      gap: 8px;
    }

    .rail-section:first-child {
      border-top: 0;
      padding-top: 0;
    }

    .rail-section-title {
      margin: 0;
      font-size: 14px;
      font-weight: 750;
    }

    .dedupe-result {
      display: none;
    }

    .dedupe-result.has-content {
      display: grid;
      gap: 8px;
    }

    .dedupe-result {
      max-height: 380px;
      overflow: auto;
      font-family: var(--font);
      font-size: 12px;
      white-space: normal;
      line-height: 1.35;
    }

    .dedupe-group {
      border: 1px solid var(--line);
      border-radius: 7px;
      background: #fff;
      padding: 8px;
      display: grid;
      gap: 7px;
    }

    .dedupe-group-title {
      font-weight: 750;
      color: var(--ink);
    }

    .dedupe-document {
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #fbfdfe;
      padding: 7px;
      display: grid;
      gap: 6px;
    }

    .dedupe-document.keep {
      border-color: #b9ded0;
      background: #f4fffb;
    }

    .dedupe-document-title {
      font-weight: 650;
      color: var(--ink);
      word-break: break-word;
    }

    .dedupe-document-path {
      color: var(--muted);
      word-break: break-word;
    }

    .dedupe-actions {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .left-rail .compact-actions {
      gap: 8px;
    }

    .left-rail .btn {
      min-height: 34px;
      padding: 7px 9px;
    }

    .left-rail .input {
      min-height: 34px;
      padding: 7px 9px;
    }

    .left-rail .result-box {
      max-height: 140px;
    }

    .dropzone {
      min-height: 270px;
      padding: 24px;
      display: grid;
      place-items: center;
      text-align: center;
      border: 1px dashed var(--line);
      border-radius: var(--radius);
      background: linear-gradient(180deg, #ffffff, #f5fbfd);
      box-shadow: var(--shadow);
    }

    .dropzone.dragover {
      border-color: #8fc7d7;
      background: linear-gradient(180deg, #f3fbfe, #eefaff);
    }

    .dropzone.has-selection {
      min-height: calc(100vh - 116px);
      align-items: start;
      place-items: stretch;
    }

    .dropzone h1 {
      margin: 0 0 8px;
      font-size: 28px;
      line-height: 1.15;
    }

    .upload-intro {
      max-width: 760px;
      margin: 0 auto;
    }

    .format-line {
      color: var(--muted);
      line-height: 1.45;
      margin: 0 auto;
      max-width: 780px;
    }

    .upload-steps {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      margin-top: 16px;
      text-align: left;
    }

    .upload-step {
      border: 1px solid var(--line);
      border-radius: 7px;
      background: rgba(255, 255, 255, 0.78);
      padding: 10px;
      min-height: 72px;
    }

    .upload-step strong {
      display: block;
      margin-bottom: 5px;
      font-size: 13px;
    }

    .upload-step span {
      color: var(--muted);
      font-size: 12px;
      line-height: 1.35;
    }

    .muted {
      color: var(--muted);
      line-height: 1.45;
    }

    .settings-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 10px;
    }

    .field label,
    .option-line {
      display: block;
      font-size: 12px;
      color: var(--muted);
      margin-bottom: 5px;
    }

    .input {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 7px;
      background: #fff;
      min-height: 36px;
      padding: 8px 10px;
      color: var(--ink);
    }

    .option-line {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
    }

    .option-line input {
      width: auto;
      margin: 0;
    }

    .compact-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .tab-row {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }

    .tab-button {
      border: 1px solid var(--line);
      border-radius: 7px;
      background: var(--panel-2);
      min-height: 36px;
      padding: 8px 10px;
      color: #26323e;
      font-weight: 650;
    }

    .tab-button.active {
      border-color: transparent;
      background: var(--ink);
      color: #fff;
    }

    .tab-panel {
      display: grid;
      gap: 10px;
      align-content: start;
      min-height: 0;
      overflow: auto;
    }

    .tab-panel[hidden] {
      display: none;
    }

    .primary-actions {
      justify-content: center;
      margin-top: 14px;
    }

    .selection-summary {
      margin-top: 12px;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.45;
    }

    .selected-files {
      border: 1px solid var(--line);
      border-radius: 7px;
      background: #fbfdfe;
      padding: 10px;
      display: grid;
      gap: 8px;
      text-align: left;
    }

    .selected-files strong {
      display: block;
      margin-bottom: 3px;
    }

    .selected-files-head,
    .queue-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .selected-file-list {
      display: grid;
      gap: 6px;
      max-height: 170px;
      overflow: auto;
    }

    .dropzone.has-selection .selected-file-list {
      height: clamp(260px, calc(100vh - 420px), 620px);
      max-height: none;
      min-height: 220px;
    }

    .selected-file-row {
      border: 1px solid var(--line);
      border-radius: 7px;
      background: #fff;
      padding: 7px 8px;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
      align-items: start;
    }

    .selected-file-main {
      min-width: 0;
      display: grid;
      gap: 5px;
    }

    .selected-file-name {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 13px;
      color: var(--ink);
    }

    .selected-file-title-input {
      min-height: 28px;
      padding: 5px 7px;
      font-size: 13px;
    }

    .selected-file-tags-input {
      min-height: 28px;
      padding: 5px 7px;
      font-size: 13px;
      border-color: #cbe7f0;
      background: #f8fdff;
    }

    .selected-file-tools {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .mini-btn {
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--panel-2);
      color: #26323e;
      min-height: 26px;
      padding: 4px 8px;
      white-space: nowrap;
    }

    .mini-btn.danger {
      border-color: #efb7b7;
      background: #fff0f0;
      color: #9b3030;
    }

    .advanced-box {
      border: 1px solid var(--line);
      border-radius: 7px;
      background: #fff;
      overflow: hidden;
    }

    .advanced-box summary {
      cursor: pointer;
      padding: 10px 12px;
      font-weight: 700;
    }

    .advanced-box-body {
      border-top: 1px solid var(--line);
      padding: 12px;
      display: grid;
      gap: 10px;
    }

    .explain-box {
      border: 1px solid #cbe7f0;
      border-radius: 7px;
      background: #f3fbfe;
      color: #234354;
      padding: 10px;
      font-size: 13px;
      line-height: 1.45;
    }

    .scope-panel {
      border: 1px solid #cbe7f0;
      border-radius: 7px;
      background: #f3fbfe;
      padding: 10px;
      margin-top: 14px;
      text-align: left;
      max-width: 100%;
    }

    .scope-grid {
      display: grid;
      grid-template-columns: minmax(180px, 1fr) auto;
      gap: 10px;
      align-items: end;
    }

    .scope-grid > * {
      min-width: 0;
    }

    .scope-grid label {
      display: block;
      font-size: 12px;
      color: var(--muted);
      margin-bottom: 5px;
    }

    .scope-toggle {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-height: 36px;
      margin: 0;
      color: #394653;
      font-size: 13px;
      white-space: nowrap;
    }

    .scope-toggle input {
      width: 16px;
      height: 16px;
      margin: 0;
      padding: 0;
      flex: 0 0 auto;
    }

    .scope-status {
      grid-column: 1 / -1;
      align-self: center;
      color: #0f5d78;
      font-size: 12px;
      line-height: 1.35;
      overflow-wrap: anywhere;
    }

    .node-multi-select {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 7px;
      margin-top: 2px;
    }

    .node-choice {
      border: 1px solid #cbe7f0;
      border-radius: 7px;
      background: rgba(255, 255, 255, 0.78);
      padding: 7px 8px;
      display: flex;
      align-items: flex-start;
      gap: 8px;
      min-width: 0;
      color: #26323e;
      font-size: 12px;
      line-height: 1.3;
    }

    .node-choice input {
      width: 15px;
      height: 15px;
      margin: 1px 0 0;
      padding: 0;
      flex: 0 0 auto;
    }

    .node-choice span {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    .jobs-list {
      display: grid;
      gap: 9px;
      align-content: start;
    }

    .queue-empty {
      border: 1px dashed #c9d5de;
      border-radius: 7px;
      padding: 12px;
      color: var(--muted);
      background: #fbfdfe;
      line-height: 1.45;
    }

    .queue-item.local {
      border-color: #f0cf97;
      background: #fffdf7;
    }

    .queue-item.local.cancelled {
      border-color: #efb7b7;
      background: #fff6f6;
    }

    .queue-item.running-now {
      border-color: #9ed8ca;
      background: #f4fffb;
    }

    .metric-value {
      font-size: 24px;
      font-weight: 750;
    }

    .progress {
      height: 8px;
      border-radius: 999px;
      background: #edf2f4;
      overflow: hidden;
      margin-top: 8px;
    }

    .progress span {
      display: block;
      height: 100%;
      background: linear-gradient(90deg, #176b87, #24a07b);
    }

    .result-box {
      white-space: pre-wrap;
      line-height: 1.5;
      font-family: Consolas, "Cascadia Code", monospace;
      font-size: 12px;
      max-height: 170px;
      overflow: auto;
    }

    #queuePanel {
      height: 100%;
      min-height: 0;
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      overflow: hidden;
    }

    #queuePanel > .panel-body {
      grid-template-rows: auto minmax(0, 1fr);
      overflow: hidden;
    }

    .danger-zone {
      border-color: #efb7b7;
      background: #fff2f2;
    }

    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .field-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
      align-items: end;
    }

    .hidden-status {
      min-height: 18px;
      font-size: 12px;
      color: var(--muted);
    }

    .hidden-status.ok { color: var(--ok); }
    .hidden-status.warn { color: var(--warn); }

    @media (max-width: 1180px) {
      body {
        overflow: auto;
      }

      .app-frame,
      .shell,
      .workspace,
      .upload-grid {
        height: auto;
      }

      .shell,
      .workspace > .work-main,
      .upload-grid > .work-main,
      .upload-grid > aside.work-main {
        overflow: visible;
      }

      .workspace,
      .upload-grid {
        grid-template-columns: 1fr;
      }

      .left-rail {
        max-height: none;
      }

      #queuePanel {
        height: auto;
      }
    }

    @media (max-width: 720px) {
      .topbar {
        height: auto;
        padding: 12px;
        align-items: flex-start;
        flex-direction: column;
      }

      .main-nav,
      .filter-row {
        width: 100%;
        overflow-x: auto;
        justify-content: flex-start;
      }

      .shell {
        padding: 10px;
      }

      .settings-grid,
      .compact-actions,
      .field-row,
      .scope-grid {
        grid-template-columns: 1fr;
      }

      .scope-toggle {
        min-height: auto;
        white-space: normal;
      }

      .upload-steps {
        grid-template-columns: 1fr;
      }

      .dropzone h1 {
        font-size: 23px;
      }
    }
  </style>
</head>
<body>
  <div class="app-frame">
    <header class="topbar">
      <a class="brand" href="/ui/consult"><span class="brand-mark">LR</span><span>LOCAL-RAG-PLATFORM</span></a>
      <nav class="main-nav">
        <a class="nav-link" href="/ui/consult">Консультант</a>
        <a class="nav-link active" href="/ui/ingest">Загрузка документов</a>
        <a class="nav-link" href="/ui/nodes">Разделы базы</a>
        <a class="nav-link" href="/ui/jobs">Админ / состояние базы</a>
        <a class="nav-link" href="/ui/pages-search">Поиск по страницам PDF</a>
      </nav>
    </header>

    <main class="shell">
      <section class="workspace upload-layout">
        <aside class="left-rail">
          <div class="rail-head">
            <h2>Документы</h2>
            <div class="meta-line"><span class="status ok">локальная база</span></div>
          </div>
          <div class="panel-body">
            <div class="rail-section">
              <h3 class="rail-section-title">Переименовать</h3>
              <div class="field">
                <label for="renameDocumentSelect">Документ</label>
                <select id="renameDocumentSelect" class="input">
                  <option value="">Загрузка списка...</option>
                </select>
              </div>
              <div class="field">
                <label for="renameDocumentTitle">Новое название</label>
                <input id="renameDocumentTitle" class="input" placeholder="Название документа" />
              </div>
              <div class="compact-actions">
                <button id="renamePreviewBtn" class="btn soft" type="button">Просмотр</button>
                <button id="renameDocumentBtn" class="btn good" type="button">Переименовать</button>
              </div>
              <div id="renameStatus" class="hidden-status"></div>
            </div>

            <div class="rail-section">
              <h3 class="rail-section-title">Дубли</h3>
              <input id="dedupePathPrefix" type="hidden" value="" />
              <div id="dedupeStatus" class="hidden-status"></div>
              <button id="previewDuplicatesBtn" class="btn soft" type="button">Поиск дублей</button>
              <button id="dedupeRefreshBtn" class="visually-hidden" type="button">Обновить</button>
              <button id="dedupeBtn" class="btn danger" type="button">Удалить лишние</button>
              <div id="dedupeResult" class="queue-item result-box dedupe-result"></div>
            </div>
          </div>
        </aside>

        <section class="work-main">
          <div class="upload-grid">
            <div class="work-main">
              <section id="upload" class="dropzone">
                <div class="upload-intro">
                  <h1>Перетащите документы или папку сюда</h1>
                  <p class="format-line">PDF, DOCX, TXT/MD, XLSX/CSV, изображения, фото страниц и сканы. Можно выбрать один файл, несколько файлов или папку.</p>
                  <input id="filePicker" class="visually-hidden" type="file" multiple accept=".pdf,.docx,.txt,.md,.csv,.xlsx,.xls,image/*" />
                  <input id="folderPicker" class="visually-hidden" type="file" webkitdirectory directory multiple />
                  <div class="scope-panel">
                    <div class="scope-grid">
                      <div>
                        <label for="nodeSelect">Рабочий раздел</label>
                        <select id="nodeSelect" class="input">
                          <option value="">Разделы загружаются</option>
                        </select>
                      </div>
                      <label class="scope-toggle" for="includeChildren">
                        <input id="includeChildren" type="checkbox" checked />
                        <span>Раздел и вложенные</span>
                      </label>
                      <div id="scopeStatus" class="scope-status">Контекст раздела загружается.</div>
                      <div id="nodeMultiSelect" class="node-multi-select"></div>
                    </div>
                  </div>
                  <div class="filter-row primary-actions">
                    <button id="selectFilePathBtn" class="btn primary" type="button">Выбрать файлы</button>
                    <button id="selectFolderPathBtn" class="btn soft" type="button">Выбрать папку</button>
                    <button id="uploadSelectedBtn" class="btn warn" type="button" disabled>Загрузить выбранное</button>
                  </div>
                  <div id="selectionInfo" class="selection-summary">Файлы ещё не выбраны.</div>
                  <div id="fileStatus" class="hidden-status"></div>
                  <div class="upload-steps">
                    <div class="upload-step"><strong>1. Выберите</strong><span>Файл, несколько файлов или папку с документами.</span></div>
                    <div class="upload-step"><strong>2. Запустите</strong><span>Нажмите «Загрузить выбранное», задача появится справа.</span></div>
                    <div class="upload-step"><strong>3. Проверьте</strong><span>Прогресс, ошибки и историю смотрите в правой панели.</span></div>
                  </div>
                </div>
              </section>

              <div class="visually-hidden" aria-hidden="true">
                <input id="relativeDir" value="КС новая/Документация metsoDNA CR/2 Функциональные блоки" />
                <div id="folderStatus"></div>
                <input id="relativePath" type="hidden" value="" />
                <input id="fileCategories" type="hidden" value="" />
                <input id="folderCategories" type="hidden" value="" />
                <input id="recursive" type="checkbox" checked hidden />
                <input id="fileCreateVisualAssets" type="checkbox" checked hidden />
                <input id="folderCreateVisualAssets" type="checkbox" hidden />
                <input id="fileForce" type="checkbox" hidden />
                <input id="folderForce" type="checkbox" hidden />
                <button id="ingestFileBtn" type="button">Загрузить файл сейчас</button>
                <button id="ingestFolderBtn" type="button">Загрузить папку сейчас</button>
                <button id="ingestFileAsyncBtn" type="button">Файл в фон</button>
                <button id="ingestFolderAsyncBtn" type="button">Папка в фон</button>
              </div>
            </div>

            <aside class="work-main">
              <section id="queuePanel" class="panel">
                <div class="section-head"><h2 id="sidePanelTitle">Очередь загрузки</h2></div>
                <div class="panel-body">
                  <div class="tab-row" role="tablist" aria-label="Разделы статусов импорта">
                    <button id="queueTabBtn" class="tab-button active" type="button">Очередь</button>
                    <button id="historyTabBtn" class="tab-button" type="button">История</button>
                    <button id="ocrTabBtn" class="tab-button" type="button">OCR</button>
                  </div>
                  <div id="queueTabPanel" class="tab-panel">
                    <div class="filter-row">
                      <button id="jobsRefreshBtn" class="btn soft" type="button">Обновить</button>
                      <button id="cancelAllJobsBtn" class="btn danger" type="button">Отменить всё</button>
                      <a id="jobsFullLink" class="btn soft" href="/ui/jobs">Открыть все задачи</a>
                    </div>
                    <div id="jobsList" class="jobs-list">
                      <div class="queue-empty">Задачи загружаются...</div>
                    </div>
                    <div id="result" class="hidden-status"></div>
                  </div>

                  <div id="historyTabPanel" class="tab-panel" hidden>
                    <div class="filter-row">
                      <button id="historyRefreshBtn" class="btn soft" type="button">Обновить</button>
                      <a id="historyFullLink" class="btn soft" href="/ui/jobs">Открыть полную историю</a>
                    </div>
                    <div id="historyList" class="jobs-list">
                      <div class="queue-empty">История загружается...</div>
                    </div>
                  </div>

                  <div id="ocrTabPanel" class="tab-panel" hidden>
                    <div class="explain-box">
                      OCR подключён как локальный точечный режим для выбранных PDF-страниц. Откройте «Поиск по страницам PDF», выберите документ, укажите страницы и режим OCR.
                    </div>
                    <div class="queue-empty">
                      Для сканов используется только локальная команда tesseract, если она установлена в контейнере. Без неё система всё равно создаёт preview и индексирует извлекаемый текст PDF.
                    </div>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </section>
      </section>
    </main>
  </div>

  <script>
    const relativePathEl = document.getElementById("relativePath");
    const fileCategoriesEl = document.getElementById("fileCategories");
    const relativeDirEl = document.getElementById("relativeDir");
    const folderCategoriesEl = document.getElementById("folderCategories");
    const recursiveEl = document.getElementById("recursive");
    const fileCreateVisualAssetsEl = document.getElementById("fileCreateVisualAssets");
    const folderCreateVisualAssetsEl = document.getElementById("folderCreateVisualAssets");
    const fileForceEl = document.getElementById("fileForce");
    const folderForceEl = document.getElementById("folderForce");
    const fileStatusEl = document.getElementById("fileStatus");
    const folderStatusEl = document.getElementById("folderStatus");
    const resultEl = document.getElementById("result");
    const renameDocumentSelectEl = document.getElementById("renameDocumentSelect");
    const renameDocumentTitleEl = document.getElementById("renameDocumentTitle");
    const renameDocumentBtn = document.getElementById("renameDocumentBtn");
    const renamePreviewBtn = document.getElementById("renamePreviewBtn");
    const renameStatusEl = document.getElementById("renameStatus");
    const dedupePathPrefixEl = document.getElementById("dedupePathPrefix");
    const dedupeStatusEl = document.getElementById("dedupeStatus");
    const dedupeResultEl = document.getElementById("dedupeResult");
    const ingestFileBtn = document.getElementById("ingestFileBtn");
    const ingestFileAsyncBtn = document.getElementById("ingestFileAsyncBtn");
    const ingestFolderBtn = document.getElementById("ingestFolderBtn");
    const ingestFolderAsyncBtn = document.getElementById("ingestFolderAsyncBtn");
    const previewDuplicatesBtn = document.getElementById("previewDuplicatesBtn");
    const dedupeBtn = document.getElementById("dedupeBtn");
    const dedupeRefreshBtn = document.getElementById("dedupeRefreshBtn");
    const jobsRefreshBtn = document.getElementById("jobsRefreshBtn");
    const cancelAllJobsBtn = document.getElementById("cancelAllJobsBtn");
    const selectFilePathBtn = document.getElementById("selectFilePathBtn");
    const selectFolderPathBtn = document.getElementById("selectFolderPathBtn");
    const filePickerEl = document.getElementById("filePicker");
    const folderPickerEl = document.getElementById("folderPicker");
    const uploadSelectedBtn = document.getElementById("uploadSelectedBtn");
    const selectionInfoEl = document.getElementById("selectionInfo");
    const dropzoneEl = document.getElementById("upload");
    const jobsListEl = document.getElementById("jobsList");
    const historyListEl = document.getElementById("historyList");
    const sidePanelTitleEl = document.getElementById("sidePanelTitle");
    const queueTabBtn = document.getElementById("queueTabBtn");
    const historyTabBtn = document.getElementById("historyTabBtn");
    const ocrTabBtn = document.getElementById("ocrTabBtn");
    const queueTabPanel = document.getElementById("queueTabPanel");
    const historyTabPanel = document.getElementById("historyTabPanel");
    const ocrTabPanel = document.getElementById("ocrTabPanel");
    const historyRefreshBtn = document.getElementById("historyRefreshBtn");
    const jobsFullLink = document.getElementById("jobsFullLink");
    const historyFullLink = document.getElementById("historyFullLink");
    const nodeSelectEl = document.getElementById("nodeSelect");
    const includeChildrenEl = document.getElementById("includeChildren");
    const scopeStatusEl = document.getElementById("scopeStatus");
    const nodeMultiSelectEl = document.getElementById("nodeMultiSelect");
    let selectedFiles = [];
    let localUploadQueue = [];
    let uploadAbortController = null;
    let uploadCancelled = false;
    let currentUploadId = null;
    let documents = [];
    let activeSideTab = "queue";
    let knowledgeNodes = [];
    let currentNodeId = "";
    let currentIncludeChildren = true;
    let additionalUploadNodeIds = new Set();
    const legacyLocalQueueStorageKeys = ["kb.ingest.localUploadQueue.v1"];
    const localQueueStorageKey = "kb.ingest.localUploadQueue.v2";
    let lastDuplicateData = null;
    const dedupeKeepByGroup = new Map();

    function normalizeCategory(value) {
      const normalized = String(value || "").trim().replace(/^#+/, "").replace(/\s+/g, "-");
      return normalized.toLowerCase() === "met-o" ? "metso" : normalized;
    }

    function parseCategories(value) {
      return String(value || "")
        .split(",")
        .map(normalizeCategory)
        .filter(Boolean);
    }

    function setStatus(element, text, tone = "") {
      element.textContent = text;
      element.className = tone ? "hidden-status " + tone : "hidden-status";
    }

    function formatBytes(bytes) {
      const value = Number(bytes || 0);
      if (value >= 1024 * 1024) {
        return (value / 1024 / 1024).toFixed(1) + " МБ";
      }
      if (value >= 1024) {
        return Math.round(value / 1024) + " КБ";
      }
      return value + " Б";
    }

    function jobStatusLabel(status) {
      const labels = {
        queued: "ожидает",
        running: "выполняется",
        completed: "готово",
        failed: "ошибка",
        cancelled: "остановлено",
        cancel_requested: "остановка",
      };
      return labels[status] || status || "неизвестно";
    }

    function jobStatusClass(status) {
      if (status === "completed") {
        return "ok";
      }
      if (status === "failed" || status === "cancelled") {
        return "bad";
      }
      if (status === "queued" || status === "cancel_requested") {
        return "warn";
      }
      return "ok";
    }

    function formatJobDate(value) {
      if (!value) {
        return "";
      }
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return "";
      }
      return date.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    function escapeHtml(value) {
      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function formatNumber(value) {
      return new Intl.NumberFormat("ru-RU").format(Number(value || 0));
    }

    function flattenNodeTree(items, depth = 0) {
      return (Array.isArray(items) ? items : []).flatMap((item) => {
        const current = { ...item, depth };
        return [current, ...flattenNodeTree(item.children || [], depth + 1)];
      });
    }

    function currentNode() {
      return knowledgeNodes.find((item) => String(item.id) === String(currentNodeId)) || null;
    }

    function readScopeFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const urlNodeId = params.get("nodeId") || "";
      const urlIncludeChildren = params.get("includeChildren");

      return {
        nodeId: urlNodeId,
        includeChildren:
          urlIncludeChildren === null
            ? true
            : ["1", "true", "yes", "on", "да"].includes(urlIncludeChildren.toLowerCase()),
      };
    }

    function hasScopeInUrl() {
      const params = new URLSearchParams(window.location.search);
      return params.has("nodeId") || params.has("includeChildren");
    }

    async function readSavedUiScope() {
      try {
        const response = await fetch("/ui/state");
        const data = await response.json();
        if (!response.ok || data.ok !== true) {
          return null;
        }
        const state = data.state || {};
        return {
          nodeId: state.currentNodeId || "",
          includeChildren: state.includeChildren !== false,
        };
      } catch (error) {
        return null;
      }
    }

    async function resolveInitialScope() {
      const urlScope = readScopeFromUrl();
      if (hasScopeInUrl()) {
        return urlScope;
      }
      return (await readSavedUiScope()) || urlScope;
    }

    async function saveUiScope() {
      try {
        await fetch("/ui/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentNodeId: currentNodeId || null,
            includeChildren: currentIncludeChildren,
          }),
        });
      } catch (error) {
        console.warn("Не удалось сохранить контекст UI", error);
      }
    }

    function syncScopeUrl() {
      const url = new URL(window.location.href);
      if (currentNodeId) {
        url.searchParams.set("nodeId", currentNodeId);
      } else {
        url.searchParams.delete("nodeId");
      }
      url.searchParams.set("includeChildren", String(currentIncludeChildren));
      window.history.replaceState({}, "", url);
    }

    function syncIncludeChildrenControl() {
      const node = currentNode();
      const label = includeChildrenEl.closest(".scope-toggle") || includeChildrenEl.parentElement;
      const systemScope = node?.isSystem === true;
      if (systemScope) {
        currentIncludeChildren = false;
        includeChildrenEl.checked = false;
      }
      includeChildrenEl.disabled = systemScope;
      if (label) {
        label.hidden = systemScope;
      }
    }

    function selectedUploadNodeIds() {
      const knownIds = new Set(knowledgeNodes.map((item) => String(item.id)));
      const ids = [];
      if (currentNodeId && knownIds.has(String(currentNodeId))) {
        ids.push(String(currentNodeId));
      }
      for (const nodeId of additionalUploadNodeIds) {
        const normalized = String(nodeId);
        if (knownIds.has(normalized) && !ids.includes(normalized)) {
          ids.push(normalized);
        }
      }
      return ids;
    }

    function selectedUploadNodeNames() {
      const byId = new Map(knowledgeNodes.map((item) => [String(item.id), item]));
      return selectedUploadNodeIds()
        .map((nodeId) => byId.get(String(nodeId))?.name)
        .filter(Boolean);
    }

    function renderScopeStatus() {
      const node = currentNode();
      if (!node) {
        scopeStatusEl.textContent = "Раздел не выбран. Новые документы попадут в раздел по умолчанию.";
        return;
      }

      const counts = node.counts || {};
      const docs = formatNumber(counts.scopeDocuments ?? counts.directDocuments ?? 0);
      const pages = formatNumber(counts.scopePages ?? 0);
      const extraCount = Math.max(0, selectedUploadNodeNames().length - 1);
      scopeStatusEl.textContent = (
        "Новые документы будут привязаны к: " +
        node.name +
        (extraCount > 0 ? " (основной) + ещё " + extraCount + " раздел(а)" : "") +
        " · " +
        docs +
        " документов" +
        (Number(counts.scopePages || 0) > 0 ? " · " + pages + " страниц" : "")
      );
    }

    function syncScopeLinks() {
      const url = new URL("/ui/jobs", window.location.origin);
      if (currentNodeId) {
        url.searchParams.set("nodeId", currentNodeId);
        url.searchParams.set("includeChildren", String(currentIncludeChildren));
      }
      jobsFullLink.href = url.pathname + url.search;
      historyFullLink.href = url.pathname + url.search;
    }

    function renderUploadNodeChoices() {
      if (!knowledgeNodes.length) {
        nodeMultiSelectEl.innerHTML = "";
        return;
      }

      nodeMultiSelectEl.innerHTML = knowledgeNodes
        .map((item) => {
          const nodeId = String(item.id);
          const isPrimary = nodeId === String(currentNodeId);
          const checked = isPrimary || additionalUploadNodeIds.has(nodeId);
          const prefix = item.depth > 0 ? Array(item.depth + 1).join("— ") : "";
          const counts = item.counts || {};
          const docs = Number(counts.scopeDocuments ?? counts.directDocuments ?? 0);
          const label = prefix + item.name + " (" + docs + ")";
          return '<label class="node-choice">'
            + '<input type="checkbox" data-upload-node-id="' + escapeHtml(nodeId) + '"'
            + (checked ? " checked" : "")
            + (isPrimary ? " disabled" : "")
            + " />"
            + '<span>' + escapeHtml(label) + (isPrimary ? " · основной" : "") + '</span>'
            + '</label>';
        })
        .join("");
    }

    function populateNodeSelect() {
      if (!knowledgeNodes.length) {
        nodeSelectEl.innerHTML = '<option value="">Разделы недоступны</option>';
        nodeSelectEl.value = "";
        renderUploadNodeChoices();
        renderScopeStatus();
        syncScopeLinks();
        return;
      }

      nodeSelectEl.innerHTML = knowledgeNodes
        .map((item) => {
          const prefix = item.depth > 0 ? Array(item.depth + 1).join("— ") : "";
          const counts = item.counts || {};
          const docs = Number(counts.scopeDocuments ?? counts.directDocuments ?? 0);
          const label = prefix + item.name + " (" + docs + ")";
          return '<option value="' + escapeHtml(item.id) + '">' + escapeHtml(label) + '</option>';
        })
        .join("");
      nodeSelectEl.value = currentNodeId;
      includeChildrenEl.checked = currentIncludeChildren;
      syncIncludeChildrenControl();
      renderUploadNodeChoices();
      renderScopeStatus();
      syncScopeLinks();
    }

    async function loadNodes() {
      const requestedScope = await resolveInitialScope();
      const response = await fetch("/nodes?format=tree");
      const data = await response.json();
      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || "Не удалось загрузить разделы");
      }

      knowledgeNodes = flattenNodeTree(data.items || []);
      const requestedExists = knowledgeNodes.some(
        (item) => String(item.id) === String(requestedScope.nodeId)
      );
      const systemNode = knowledgeNodes.find((item) => item.isSystem === true);
      const fallbackNode = systemNode || knowledgeNodes[0] || null;

      currentNodeId = requestedExists ? requestedScope.nodeId : (fallbackNode?.id || "");
      currentIncludeChildren = requestedScope.includeChildren;
      additionalUploadNodeIds = new Set();
      populateNodeSelect();
      syncScopeUrl();
    }

    function selectedNodePayload() {
      const nodeIds = selectedUploadNodeIds();
      if (!nodeIds.length) {
        return {};
      }

      return {
        nodeIds,
        primaryNodeId: nodeIds[0],
      };
    }

    function addScopeToFormData(formData) {
      const payload = selectedNodePayload();
      if (!payload.nodeIds) {
        return;
      }

      formData.append("nodeIds", JSON.stringify(payload.nodeIds));
      formData.append("primaryNodeId", payload.primaryNodeId);
    }

    function scopedJobsUrl(statusMode, limit) {
      const params = new URLSearchParams();
      params.set("statusMode", statusMode);
      params.set("limit", String(limit));
      if (currentNodeId) {
        params.set("nodeId", currentNodeId);
        params.set("includeChildren", String(currentIncludeChildren));
      }
      return "/jobs?" + params.toString();
    }

    function scopedDocumentsUrl() {
      const params = new URLSearchParams();
      if (currentNodeId) {
        params.set("nodeId", currentNodeId);
        params.set("includeChildren", String(currentIncludeChildren));
      }
      return "/documents" + (params.toString() ? "?" + params.toString() : "");
    }

    async function applyNodeScope() {
      currentNodeId = nodeSelectEl.value || "";
      currentIncludeChildren = includeChildrenEl.checked;
      syncIncludeChildrenControl();
      additionalUploadNodeIds = new Set();
      renderScopeStatus();
      syncScopeUrl();
      await saveUiScope();
      syncScopeLinks();
      await loadDocumentsForRename();
      if (activeSideTab === "history") {
        await loadHistoryJobs();
      } else {
        await loadQueueJobs();
      }
      setStatus(fileStatusEl, "Рабочий раздел применён: " + (currentNode()?.name || "по умолчанию"), "ok");
    }

    function basenameFromPath(value) {
      const normalized = String(value || "").replace(/\\\\/g, "/");
      const parts = normalized.split("/");
      return parts[parts.length - 1] || normalized;
    }

    function getDocumentDisplayName(item) {
      return item.title || item.original_file_name || basenameFromPath(item.original_file_path) || item.id;
    }

    function formatShortDate(value) {
      if (!value) {
        return "";
      }
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return "";
      }
      return date.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    function makeUploadId() {
      return "upload-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
    }

    function getFileLabel(item) {
      const file = item.file || item;
      return file.webkitRelativePath || file.name || item.name || "Файл";
    }

    function getUploadTitle(item) {
      return String(item.title || item.file?.name || item.name || "Файл").trim();
    }

    function parseHashTags(value) {
      return String(value || "")
        .split(",")
        .map((tag) => tag.trim().replace(/^#+/, ""))
        .filter(Boolean)
        .map((tag) => tag.replace(/\s+/g, "-"))
        .filter((tag, index, array) => array.findIndex((candidate) => candidate.toLowerCase() === tag.toLowerCase()) === index);
    }

    function formatHashTags(value) {
      const tags = Array.isArray(value) ? value : parseHashTags(value);
      return tags.map((tag) => "#" + tag).join(", ");
    }

    function renderSelectedFiles() {
      uploadSelectedBtn.disabled = selectedFiles.length === 0;
      dropzoneEl.classList.toggle("has-selection", selectedFiles.length > 0);
      if (selectedFiles.length === 0) {
        selectionInfoEl.textContent = "Файлы ещё не выбраны.";
        uploadSelectedBtn.textContent = "Загрузить выбранное";
        return;
      }

      const totalBytes = selectedFiles.reduce((sum, item) => sum + (item.file.size || 0), 0);
      const rows = selectedFiles
        .map((item) => (
          '<div class="selected-file-row">' +
            '<div class="selected-file-main">' +
              '<div class="selected-file-name" title="' + escapeHtml(getFileLabel(item)) + '">' + escapeHtml(getFileLabel(item)) + '</div>' +
              '<input class="input selected-file-title-input" data-upload-id="' + escapeHtml(item.id) + '" value="' + escapeHtml(getUploadTitle(item)) + '" aria-label="Название в базе" />' +
              '<input class="input selected-file-tags-input" data-upload-id="' + escapeHtml(item.id) + '" value="' + escapeHtml(formatHashTags(item.tags || [])) + '" placeholder="#теги через запятую" aria-label="Теги документа" />' +
            '</div>' +
            '<div class="selected-file-tools">' +
              '<button class="mini-btn preview-selected-file-btn" type="button" data-upload-id="' + escapeHtml(item.id) + '">Предпросмотр</button>' +
              '<button class="mini-btn danger remove-selected-file-btn" type="button" data-upload-id="' + escapeHtml(item.id) + '">Убрать</button>' +
            '</div>' +
          '</div>'
        ))
        .join("");

      selectionInfoEl.innerHTML =
        '<div class="selected-files">' +
          '<div class="selected-files-head">' +
            '<strong>Выбрано: ' + selectedFiles.length + " файл(ов), " + formatBytes(totalBytes) + '</strong>' +
            '<button id="clearSelectedFilesBtn" class="mini-btn" type="button">Очистить</button>' +
          '</div>' +
          '<div class="selected-file-list">' + rows + '</div>' +
        '</div>';
      uploadSelectedBtn.textContent = "Загрузить " + selectedFiles.length + " файл(ов)";
    }

    function renderDocumentOptions() {
      if (!documents.length) {
        renameDocumentSelectEl.innerHTML = '<option value="">Документы не найдены</option>';
        renameDocumentTitleEl.value = "";
        return;
      }

      renameDocumentSelectEl.innerHTML = documents
        .map((item) => '<option value="' + escapeHtml(item.id) + '">' + escapeHtml(getDocumentDisplayName(item)) + '</option>')
        .join("");
      syncRenameTitle();
    }

    function syncRenameTitle() {
      const documentId = renameDocumentSelectEl.value;
      const item = documents.find((documentItem) => String(documentItem.id) === String(documentId));
      renameDocumentTitleEl.value = item ? getDocumentDisplayName(item) : "";
    }

    async function loadDocumentsForRename() {
      try {
        const response = await fetch(scopedDocumentsUrl());
        const data = await response.json();
        documents = Array.isArray(data.items) ? data.items : [];
        renderDocumentOptions();
      } catch (error) {
        renameDocumentSelectEl.innerHTML = '<option value="">Не удалось загрузить</option>';
        setStatus(renameStatusEl, "Не удалось загрузить список документов: " + error.message, "warn");
      }
    }

    function setSelectedFiles(files) {
      selectedFiles = Array.from(files || [])
        .filter((file) => file && file.name)
        .map((file) => ({
          id: makeUploadId(),
          file,
          title: file.name || "Файл",
          tags: [],
        }));
      renderSelectedFiles();
      if (selectedFiles.length > 0) {
        setStatus(fileStatusEl, "Проверьте список файлов. Лишние можно убрать перед загрузкой.", "warn");
      } else {
        setStatus(fileStatusEl, "");
      }
    }

    function removeSelectedFile(uploadId) {
      selectedFiles = selectedFiles.filter((item) => item.id !== uploadId);
      renderSelectedFiles();
      if (selectedFiles.length === 0) {
        setStatus(fileStatusEl, "Файлы ещё не выбраны.");
      }
    }

    function updateSelectedFileTitle(uploadId, title) {
      const item = selectedFiles.find((selectedItem) => selectedItem.id === uploadId);
      if (!item) {
        return;
      }
      item.title = String(title || "").trim() || item.file.name || "Файл";
    }

    function updateSelectedFileTags(uploadId, value) {
      const item = selectedFiles.find((selectedItem) => selectedItem.id === uploadId);
      if (!item) {
        return;
      }
      item.tags = parseHashTags(value);
    }

    function previewSelectedFile(uploadId) {
      const item = selectedFiles.find((selectedItem) => selectedItem.id === uploadId);
      if (!item || !item.file) {
        setStatus(fileStatusEl, "Файл для предпросмотра не найден.", "warn");
        return;
      }

      const url = URL.createObjectURL(item.file);
      const previewWindow = window.open(url, "_blank", "noopener");
      if (!previewWindow) {
        URL.revokeObjectURL(url);
        setStatus(fileStatusEl, "Браузер заблокировал предпросмотр. Разрешите всплывающие окна для этой страницы.", "warn");
        return;
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      setStatus(fileStatusEl, "Предпросмотр открыт во вкладке браузера.", "ok");
    }

    async function postUpload(item, signal = null) {
      const file = item.file;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", getUploadTitle(item));
      formData.append("categories", JSON.stringify(parseHashTags(item.tags || "")));
      addScopeToFormData(formData);
      const response = await fetch("/documents/upload", {
        method: "POST",
        body: formData,
        signal,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || ("HTTP " + response.status));
      }
      return data;
    }

    function localStatusLabel(status) {
      const labels = {
        waiting: "ожидает",
        uploading: "загружается",
        done: "готово",
        cancelled: "отменено",
        error: "ошибка",
        lost: "выберите заново",
      };
      return labels[status] || status || "ожидает";
    }

    function localStatusClass(status) {
      if (status === "done") {
        return "ok";
      }
      if (status === "cancelled" || status === "error" || status === "lost") {
        return "bad";
      }
      return "warn";
    }

    function saveLocalQueueSnapshot() {
      try {
        const snapshot = localUploadQueue
          .filter((item) => ["waiting", "uploading"].includes(item.status))
          .map((item) => ({
            id: item.id,
            name: item.name,
            status: item.status,
            message: item.message,
            documentId: item.documentId || null,
            restored: Boolean(item.restored),
            savedAt: Date.now(),
          }));
        localStorage.setItem(localQueueStorageKey, JSON.stringify(snapshot));
      } catch (error) {
        // Local storage is only a UI convenience.
      }
    }

    function restoreLocalQueueSnapshot() {
      try {
        legacyLocalQueueStorageKeys.forEach((key) => {
          localStorage.removeItem(key);
        });
        const snapshot = JSON.parse(localStorage.getItem(localQueueStorageKey) || "[]");
        if (!Array.isArray(snapshot)) {
          return;
        }
        localUploadQueue = snapshot
          .filter((item) => item && item.name && item.status !== "done")
          .slice(0, 20)
          .map((item) => ({
            id: item.id || makeUploadId(),
            name: item.name,
            status: "lost",
            message: "Файл нужно выбрать заново: после обновления страницы браузер больше не отдаёт доступ к локальному файлу.",
            documentId: item.documentId || null,
            restored: true,
          }));
      } catch (error) {
        localUploadQueue = [];
      }
    }

    function queueStatusRank(status) {
      const ranks = {
        running: 0,
        cancel_requested: 1,
        uploading: 2,
        queued: 3,
        waiting: 4,
        failed: 5,
        error: 5,
        lost: 5,
        cancelled: 6,
        completed: 7,
        done: 8,
      };
      return ranks[status] ?? 9;
    }

    function sortServerJobs(items) {
      return (items || [])
        .slice()
        .sort((a, b) => queueStatusRank(a.status) - queueStatusRank(b.status));
    }

    function sortLocalJobs(items) {
      return (items || [])
        .slice()
        .sort((a, b) => queueStatusRank(a.status) - queueStatusRank(b.status));
    }

    function renderLocalUploadItems() {
      saveLocalQueueSnapshot();
      return sortLocalJobs(localUploadQueue)
        .filter((item) => item.status !== "done")
        .map((item) => (
          '<div class="queue-item local ' + escapeHtml(item.status) + '">' +
            '<div class="queue-actions">' +
              '<div class="task-title">' + escapeHtml(item.name) + '</div>' +
              (["waiting", "uploading"].includes(item.status) && !item.restored
                ? '<button class="mini-btn danger cancel-local-upload-btn" type="button" data-upload-id="' + escapeHtml(item.id) + '">Отменить</button>'
                : '') +
              (item.status === "lost"
                ? '<button class="mini-btn dismiss-local-upload-btn" type="button" data-upload-id="' + escapeHtml(item.id) + '">Убрать</button>'
                : '') +
            '</div>' +
            '<div class="meta-line"><span class="status ' + localStatusClass(item.status) + '">' + escapeHtml(localStatusLabel(item.status)) + '</span><span>выбранная папка</span></div>' +
            (item.message ? '<p class="muted">' + escapeHtml(item.message) + '</p>' : '') +
          '</div>'
        ))
        .join("");
    }

    function renderQueueView(serverItems = []) {
      const localHtml = renderLocalUploadItems();
      const sortedServerItems = sortServerJobs(serverItems);
      const runningServerItems = sortedServerItems.filter((item) => ["running", "cancel_requested"].includes(item.status));
      const otherServerItems = sortedServerItems.filter((item) => !["running", "cancel_requested"].includes(item.status));
      const serverHtml = buildJobCards(runningServerItems) + localHtml + buildJobCards(otherServerItems);
      if (!serverHtml) {
        jobsListEl.innerHTML =
          '<div class="queue-empty">Активных задач сейчас нет. Новая загрузка появится здесь автоматически.</div>';
        return;
      }
      jobsListEl.innerHTML = serverHtml;
    }

    async function uploadSelectedFiles() {
      if (selectedFiles.length === 0) {
        setStatus(fileStatusEl, "Сначала выберите файл или папку.", "warn");
        return;
      }

      const batch = selectedFiles.slice();
      localUploadQueue = batch.map((item) => ({
        id: item.id,
        file: item.file,
        name: getUploadTitle(item),
        title: getUploadTitle(item),
        tags: item.tags || [],
        status: "waiting",
        message: "Ожидает загрузки",
        documentId: null,
      }));
      selectedFiles = [];
      renderSelectedFiles();
      uploadCancelled = false;
      currentUploadId = null;
      setSideTab("queue");
      renderQueueView([]);
      uploadSelectedBtn.disabled = true;
      setStatus(fileStatusEl, "Идёт загрузка выбранных файлов...");
      const uploaded = [];
      try {
        for (let index = 0; index < batch.length; index += 1) {
          const item = localUploadQueue[index];
          if (!item || item.status === "cancelled" || uploadCancelled) {
            if (item && item.status !== "cancelled") {
              item.status = "cancelled";
              item.message = "Отменено";
            }
            renderQueueView([]);
            continue;
          }

          item.status = "uploading";
          item.message = "Отправляется в базу";
          currentUploadId = item.id;
          uploadAbortController = new AbortController();
          renderQueueView([]);
          setStatus(fileStatusEl, "Загружаю " + (index + 1) + " из " + batch.length + ": " + item.file.name);
          const data = await postUpload(item, uploadAbortController.signal);
          item.status = "done";
          item.message = data.skipped ? "Уже был в базе" : "Загружено";
          item.documentId = data.documentId || data.document?.id || null;
          uploaded.push({
            name: item.name,
            skipped: Boolean(data.skipped),
            documentId: item.documentId,
          });
          currentUploadId = null;
          uploadAbortController = null;
          saveLocalQueueSnapshot();
          await loadQueueJobs();
        }
        renderResult({ ok: true, uploaded });
        setStatus(fileStatusEl, "Готово. Загружено файлов: " + uploaded.length, "ok");
        await loadQueueJobs();
      } catch (error) {
        const currentItem = localUploadQueue.find((item) => item.id === currentUploadId);
        if (currentItem) {
          currentItem.status = uploadAbortController?.signal?.aborted ? "cancelled" : "error";
          currentItem.message = uploadAbortController?.signal?.aborted ? "Отменено" : error.message;
        }
        currentUploadId = null;
        uploadAbortController = null;
        saveLocalQueueSnapshot();
        renderQueueView([]);
        setStatus(fileStatusEl, uploadCancelled ? "Загрузка отменена." : "Ошибка загрузки: " + error.message, "warn");
      } finally {
        uploadSelectedBtn.disabled = selectedFiles.length === 0;
      }
    }

    function buildJobCards(items) {
      if (!items.length) {
        return "";
      }

      return items.map((item) => {
        const total = Number(item.total_items || 0);
        const processed = Number(item.processed_items || 0);
        const progress = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;
        const title = item.document_title || item.original_file_path || item.id;
        const canCancel = ["queued", "running", "cancel_requested"].includes(item.status);
        const runningClass = item.status === "running" ? " running-now" : "";
        const eventDate = formatJobDate(item.finished_at || item.started_at || item.created_at);
        return (
          '<div class="queue-item' + runningClass + '">' +
          '<div class="queue-actions">' +
          '<div class="task-title">' + escapeHtml(title) + '</div>' +
          (canCancel ? '<button class="mini-btn danger cancel-job-btn" type="button" data-job-id="' + escapeHtml(item.id) + '">Отменить</button>' : '') +
          '</div>' +
          '<div class="meta-line"><span class="status ' + jobStatusClass(item.status) + '">' + escapeHtml(jobStatusLabel(item.status)) + '</span><span>' + escapeHtml(item.job_type || "импорт") + '</span><span>' + processed + "/" + total + '</span>' + (eventDate ? '<span>' + escapeHtml(eventDate) + '</span>' : '') + '</div>' +
          '<div class="progress"><span style="width:' + progress + '%;"></span></div>' +
          (item.progress_message ? '<p class="muted">' + escapeHtml(item.progress_message) + '</p>' : '') +
          (item.error_message ? '<p class="muted">Ошибка: ' + escapeHtml(item.error_message) + '</p>' : '') +
          '</div>'
        );
      }).join("");
    }

    function renderJobs(items, targetEl = jobsListEl, emptyText = "В очереди пока нет задач. После запуска импорта они появятся здесь.") {
      const html = buildJobCards(sortServerJobs(items || []));
      if (!html) {
        targetEl.innerHTML = '<div class="queue-empty">' + escapeHtml(emptyText) + '</div>';
        return;
      }

      targetEl.innerHTML = html;
    }

    async function loadJobs(targetEl = jobsListEl, options = {}) {
      const limit = options.limit || 5;
      const statusMode = options.statusMode || "active";
      const emptyText = options.emptyText || "В очереди пока нет задач. После запуска импорта они появятся здесь.";
      try {
        const response = await fetch(scopedJobsUrl(statusMode, limit));
        const data = await response.json();
        const items = Array.isArray(data.items) ? data.items : [];
        if (targetEl === jobsListEl) {
          renderQueueView(items);
        } else {
          renderJobs(items, targetEl, emptyText);
        }
      } catch (error) {
        targetEl.innerHTML = '<div class="queue-empty">Не удалось загрузить список задач: ' + escapeHtml(error.message) + '</div>';
      }
    }

    async function loadQueueJobs() {
      await loadJobs(jobsListEl, {
        limit: 5,
        statusMode: "active",
        emptyText: "Активных задач сейчас нет. Новая загрузка появится здесь автоматически.",
      });
    }

    async function loadHistoryJobs() {
      await loadJobs(historyListEl, {
        limit: 20,
        statusMode: "history",
        emptyText: "Завершённых или остановленных задач пока нет.",
      });
    }

    function setSideTab(tabName) {
      activeSideTab = tabName;
      const isQueue = tabName === "queue";
      const isHistory = tabName === "history";
      const isOcr = tabName === "ocr";
      queueTabBtn.classList.toggle("active", isQueue);
      historyTabBtn.classList.toggle("active", isHistory);
      ocrTabBtn.classList.toggle("active", isOcr);
      queueTabPanel.hidden = !isQueue;
      historyTabPanel.hidden = !isHistory;
      ocrTabPanel.hidden = !isOcr;
      sidePanelTitleEl.textContent = isHistory
        ? "История загрузки"
        : isOcr
          ? "Настройки OCR"
          : "Очередь загрузки";

      if (isQueue) {
        loadQueueJobs();
      } else if (isHistory) {
        loadHistoryJobs();
      }
    }

    function renderDuplicatePreview(data) {
      const groups = Array.isArray(data.groups) ? data.groups : [];
      lastDuplicateData = data;
      dedupeResultEl.classList.add("has-content");
      if (groups.length === 0) {
        dedupeResultEl.innerHTML = '<div class="queue-empty">Дубли не найдены.</div>';
        return;
      }

      dedupeResultEl.innerHTML = groups
        .map((group, index) => {
          const groupKey = group.keepDocumentId || group.fileName || String(index);
          const keepDocumentId = dedupeKeepByGroup.get(groupKey) || group.keepDocumentId;
          dedupeKeepByGroup.set(groupKey, keepDocumentId);
          const items = Array.isArray(group.items) ? group.items : [];
          const rows = items.map((item) => {
            const isKeep = String(item.id) === String(keepDocumentId);
            return (
              '<div class="dedupe-document ' + (isKeep ? 'keep' : '') + '">' +
                '<div class="dedupe-document-title">' + escapeHtml(item.title || group.fileName || item.id) + '</div>' +
                '<div class="dedupe-document-path">' + escapeHtml(item.originalFilePath || "") + '</div>' +
                '<div class="meta-line">' +
                  (isKeep ? '<span class="status ok">оставить</span>' : '<span class="status warn">дубль</span>') +
                  '<span>чанков: ' + Number(item.chunkCount || 0) + '</span>' +
                  (item.createdAt ? '<span>' + escapeHtml(formatShortDate(item.createdAt)) + '</span>' : '') +
                '</div>' +
                '<div class="dedupe-actions">' +
                  '<button class="mini-btn preview-duplicate-btn" type="button" data-document-id="' + escapeHtml(item.id) + '">Просмотр</button>' +
                  '<button class="mini-btn keep-duplicate-btn" type="button" data-group-key="' + escapeHtml(groupKey) + '" data-document-id="' + escapeHtml(item.id) + '">Оставить</button>' +
                  '<button class="mini-btn danger delete-duplicate-btn" type="button" data-document-id="' + escapeHtml(item.id) + '">Удалить</button>' +
                '</div>' +
              '</div>'
            );
          }).join("");
          return (
            '<div class="dedupe-group">' +
              '<div class="dedupe-group-title">' + (index + 1) + '. ' + escapeHtml(group.fileName || "Группа дублей") + '</div>' +
              '<div class="meta-line"><span>документов: ' + items.length + '</span><span>оставить один</span></div>' +
              rows +
            '</div>'
          );
        })
        .join("");
    }

    async function postJson(url, body) {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || ("HTTP " + response.status));
      }
      return data;
    }

    async function deleteDocument(documentId) {
      if (!documentId) {
        return null;
      }

      const response = await fetch("/documents/" + encodeURIComponent(documentId) + "?removeStoredFile=true", {
        method: "DELETE",
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || ("HTTP " + response.status));
      }
      return data;
    }

    async function cleanupUploadedBatchDocuments() {
      const documentIds = Array.from(
        new Set(localUploadQueue.map((item) => item.documentId).filter(Boolean))
      );
      if (!documentIds.length) {
        return 0;
      }

      const results = await Promise.allSettled(documentIds.map((documentId) => deleteDocument(documentId)));
      return results.filter((result) => result.status === "fulfilled").length;
    }

    async function previewDocument(documentId, statusTargetEl = dedupeStatusEl) {
      if (!documentId) {
        return;
      }

      const originalUrl = "/documents/" + encodeURIComponent(documentId) + "/original";
      const previewWindow = window.open("about:blank", "_blank");
      if (previewWindow) {
        previewWindow.opener = null;
        previewWindow.document.title = "Открытие документа";
        previewWindow.document.body.innerHTML = "<p style='font-family:Segoe UI,Arial,sans-serif'>Открываю исходный документ...</p>";
      }

      try {
        const response = await fetch("/documents/" + encodeURIComponent(documentId) + "/open-local", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.error || ("HTTP " + response.status));
        }

        if (data?.opened) {
          previewWindow?.close();
          setStatus(statusTargetEl, "Исходный документ открыт в программе Windows по умолчанию.", "ok");
          return;
        }

        if (data?.helperUrl && data?.token && data?.path) {
          try {
            const helperResponse = await fetch(data.helperUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                token: data.token,
                path: data.path,
              }),
            });
            if (helperResponse.ok) {
              previewWindow?.close();
              setStatus(statusTargetEl, "Исходный документ открыт через локальный Windows-helper.", "ok");
              return;
            }
          } catch (helperError) {
            // Helper не установлен или недоступен; ниже откроем браузерный fallback.
          }
        }

        const targetUrl = data?.fallbackUrl || originalUrl;
        if (previewWindow) {
          previewWindow.location.href = targetUrl;
        } else {
          window.open(targetUrl, "_blank", "noopener");
        }
        setStatus(statusTargetEl, data?.message || "Открыт полный исходный файл.", "ok");
      } catch (error) {
        if (previewWindow) {
          previewWindow.location.href = originalUrl;
        }
        setStatus(statusTargetEl, "Не удалось открыть через Windows. Открываю полный файл в браузере: " + error.message, "warn");
      }
    }

    async function previewRenameDocument() {
      const documentId = renameDocumentSelectEl.value;
      if (!documentId) {
        setStatus(renameStatusEl, "Выберите документ.", "warn");
        return;
      }
      await previewDocument(documentId, renameStatusEl);
    }

    async function deleteDuplicateDocument(documentId) {
      if (!documentId) {
        return;
      }
      const confirmed = window.confirm("Удалить этот документ из базы и Qdrant?");
      if (!confirmed) {
        setStatus(dedupeStatusEl, "Удаление отменено.", "warn");
        return;
      }

      setStatus(dedupeStatusEl, "Удаляю выбранный дубль...");
      try {
        const data = await deleteDocument(documentId);
        setStatus(
          dedupeStatusEl,
          "Удалено документов: " + (data.removedDocuments || 0) + ", векторов: " + (data.removedVectors || 0),
          "ok"
        );
        await refreshDuplicatePreview();
        await loadDocumentsForRename();
      } catch (error) {
        setStatus(dedupeStatusEl, "Ошибка удаления: " + error.message, "warn");
      }
    }

    function getDuplicateDocumentsToRemove() {
      const groups = Array.isArray(lastDuplicateData?.groups) ? lastDuplicateData.groups : [];
      return groups.flatMap((group, index) => {
        const groupKey = group.keepDocumentId || group.fileName || String(index);
        const keepDocumentId = dedupeKeepByGroup.get(groupKey) || group.keepDocumentId;
        return (group.items || []).filter((item) => String(item.id) !== String(keepDocumentId));
      });
    }

    async function refreshDuplicatePreview() {
      const pathPrefix = dedupePathPrefixEl.value.trim();
      const response = await fetch(
        "/documents/duplicates?pathPrefix=" + encodeURIComponent(pathPrefix)
      );
      const data = await response.json();
      renderDuplicatePreview(data);
      setStatus(dedupeStatusEl, "Проверка завершена. Групп дублей: " + (data.totalGroups || 0), "ok");
    }

    function renderResult(data) {
      if (!data) {
        resultEl.textContent = "";
        return;
      }

      if (Array.isArray(data.uploaded)) {
        resultEl.textContent = "Загружено файлов: " + data.uploaded.length;
        return;
      }

      if (data.queued) {
        resultEl.textContent = data.message || "Задача поставлена в очередь.";
        return;
      }

      if (data.document?.title) {
        resultEl.textContent = "Документ обновлён: " + data.document.title;
        return;
      }

      resultEl.textContent = data.message || "Действие выполнено.";
    }

    async function renameSelectedDocument() {
      const documentId = renameDocumentSelectEl.value;
      const title = renameDocumentTitleEl.value.trim();
      if (!documentId) {
        setStatus(renameStatusEl, "Выберите документ.", "warn");
        return;
      }
      if (!title) {
        setStatus(renameStatusEl, "Введите новое название.", "warn");
        return;
      }

      renameDocumentBtn.disabled = true;
      setStatus(renameStatusEl, "Переименовываю документ...");
      try {
        const response = await fetch("/documents/" + encodeURIComponent(documentId), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.error || ("HTTP " + response.status));
        }
        setStatus(renameStatusEl, "Готово. Название обновлено.", "ok");
        await loadDocumentsForRename();
        renameDocumentSelectEl.value = documentId;
        renameDocumentTitleEl.value = title;
        await loadQueueJobs();
        if (activeSideTab === "history") {
          await loadHistoryJobs();
        }
      } catch (error) {
        setStatus(renameStatusEl, "Ошибка: " + error.message, "warn");
      } finally {
        renameDocumentBtn.disabled = false;
      }
    }

    function cancelLocalUpload(uploadId) {
      const item = localUploadQueue.find((queueItem) => queueItem.id === uploadId);
      if (!item) {
        return;
      }

      item.status = "cancelled";
      item.message = "Отменено";
      const selectedBeforeStart = selectedFiles.some((selectedItem) => selectedItem.id === uploadId);
      if (selectedBeforeStart && currentUploadId !== uploadId) {
        removeSelectedFile(uploadId);
      }
      if (currentUploadId === uploadId && uploadAbortController) {
        uploadAbortController.abort();
      }
      saveLocalQueueSnapshot();
      renderQueueView([]);
    }

    function dismissLocalUpload(uploadId) {
      localUploadQueue = localUploadQueue.filter((queueItem) => queueItem.id !== uploadId);
      saveLocalQueueSnapshot();
      renderQueueView([]);
      setStatus(fileStatusEl, "Недоступная локальная карточка убрана. Чтобы догрузить файл, выберите его или папку заново.", "ok");
    }

    async function cancelJob(jobId) {
      try {
        await postJson("/jobs/" + encodeURIComponent(jobId) + "/cancel", {});
        await loadQueueJobs();
      } catch (error) {
        setStatus(fileStatusEl, "Не удалось отменить задачу: " + error.message, "warn");
      }
    }

    async function cancelAllWork() {
      const hasLocalBatch = localUploadQueue.some((item) => (
        ["waiting", "uploading"].includes(item.status) || item.documentId
      ));
      if (hasLocalBatch) {
        const confirmed = window.confirm(
          "Отменить текущую загрузку и удалить документы этой партии, которые уже успели попасть в базу?"
        );
        if (!confirmed) {
          setStatus(fileStatusEl, "Отмена не выполнена.", "warn");
          return;
        }
      }

      uploadCancelled = true;
      if (uploadAbortController) {
        uploadAbortController.abort();
      }
      localUploadQueue.forEach((item) => {
        if (["waiting", "uploading", "lost"].includes(item.status)) {
          item.status = "cancelled";
          item.message = "Отменено";
        }
      });
      selectedFiles = [];
      renderSelectedFiles();
      renderQueueView([]);

      try {
        const removedFromBatch = await cleanupUploadedBatchDocuments();
        const response = await fetch(scopedJobsUrl("active", 50));
        const data = await response.json();
        const activeItems = Array.isArray(data.items) ? data.items : [];
        await Promise.all(
          activeItems
            .filter((item) => ["queued", "running", "cancel_requested"].includes(item.status))
            .map((item) => postJson("/jobs/" + encodeURIComponent(item.id) + "/cancel", {}).catch(() => null))
        );
        localUploadQueue = [];
        saveLocalQueueSnapshot();
        setStatus(
          fileStatusEl,
          "Отмена отправлена для активных задач. Удалено документов этой партии: " + removedFromBatch + ".",
          "warn"
        );
        await loadQueueJobs();
      } catch (error) {
        setStatus(fileStatusEl, "Не удалось отменить все задачи: " + error.message, "warn");
      }
    }

    ingestFileBtn.addEventListener("click", async () => {
      const relativePath = relativePathEl.value.trim();
      if (!relativePath) {
        setStatus(fileStatusEl, "Укажите путь к файлу.", "warn");
        return;
      }

      setStatus(fileStatusEl, "Идёт загрузка файла...");
      try {
        const data = await postJson("/documents/ingest-file", {
          relativePath,
          categories: parseCategories(fileCategoriesEl.value),
          createVisualAssets: fileCreateVisualAssetsEl.checked,
          force: fileForceEl.checked,
          ...selectedNodePayload(),
        });
        renderResult(data);
        setStatus(fileStatusEl, "Файл успешно обработан.", "ok");
        await loadQueueJobs();
      } catch (error) {
        setStatus(fileStatusEl, "Ошибка: " + error.message, "warn");
      }
    });

    ingestFolderBtn.addEventListener("click", async () => {
      const relativeDir = relativeDirEl.value.trim();
      if (!relativeDir) {
        setStatus(folderStatusEl, "Укажите путь к папке.", "warn");
        return;
      }

      setStatus(folderStatusEl, "Идёт загрузка папки...");
      try {
        const data = await postJson("/documents/ingest-folder", {
          relativeDir,
          categories: parseCategories(folderCategoriesEl.value),
          recursive: recursiveEl.checked,
          createVisualAssets: folderCreateVisualAssetsEl.checked,
          force: folderForceEl.checked,
          ...selectedNodePayload(),
        });
        renderResult(data);
        const tone = data.failedCount > 0 ? "warn" : "ok";
        setStatus(
          folderStatusEl,
          "Папка обработана. Успешно: " + data.indexedCount + ", ошибок: " + data.failedCount,
          tone
        );
        await loadQueueJobs();
      } catch (error) {
        setStatus(folderStatusEl, "Ошибка: " + error.message, "warn");
      }
    });

    ingestFileAsyncBtn.addEventListener("click", async () => {
      const relativePath = relativePathEl.value.trim();
      if (!relativePath) {
        setStatus(fileStatusEl, "Укажите путь к файлу.", "warn");
        return;
      }

      setStatus(fileStatusEl, "Файл поставлен в фоновую обработку...");
      try {
        const data = await postJson("/documents/ingest-file-async", {
          relativePath,
          categories: parseCategories(fileCategoriesEl.value),
          createVisualAssets: fileCreateVisualAssetsEl.checked,
          force: fileForceEl.checked,
          ...selectedNodePayload(),
        });
        renderResult(data);
        setStatus(fileStatusEl, "Файл поставлен в фон. Следите за статусом на /ui/jobs.", "ok");
        await loadQueueJobs();
      } catch (error) {
        setStatus(fileStatusEl, "Ошибка: " + error.message, "warn");
      }
    });

    ingestFolderAsyncBtn.addEventListener("click", async () => {
      const relativeDir = relativeDirEl.value.trim();
      if (!relativeDir) {
        setStatus(folderStatusEl, "Укажите путь к папке.", "warn");
        return;
      }

      setStatus(folderStatusEl, "Папка поставлена в фоновую обработку...");
      try {
        const data = await postJson("/documents/ingest-folder-async", {
          relativeDir,
          categories: parseCategories(folderCategoriesEl.value),
          recursive: recursiveEl.checked,
          createVisualAssets: folderCreateVisualAssetsEl.checked,
          force: folderForceEl.checked,
          ...selectedNodePayload(),
        });
        renderResult(data);
        setStatus(folderStatusEl, "Папка поставлена в фон. Следите за статусом на /ui/jobs.", "ok");
        setSideTab("queue");
        await loadQueueJobs();
      } catch (error) {
        setStatus(folderStatusEl, "Ошибка: " + error.message, "warn");
      }
    });

    selectFilePathBtn.addEventListener("click", () => {
      filePickerEl.click();
    });

    selectFolderPathBtn.addEventListener("click", () => {
      folderPickerEl.click();
    });

    filePickerEl.addEventListener("change", () => {
      setSelectedFiles(filePickerEl.files);
    });

    folderPickerEl.addEventListener("change", () => {
      setSelectedFiles(folderPickerEl.files);
    });

    selectionInfoEl.addEventListener("click", (event) => {
      const previewButton = event.target.closest(".preview-selected-file-btn");
      if (previewButton) {
        previewSelectedFile(previewButton.dataset.uploadId);
        return;
      }

      const removeButton = event.target.closest(".remove-selected-file-btn");
      if (removeButton) {
        removeSelectedFile(removeButton.dataset.uploadId);
        return;
      }

      if (event.target.closest("#clearSelectedFilesBtn")) {
        selectedFiles = [];
        renderSelectedFiles();
        setStatus(fileStatusEl, "Список выбранных файлов очищен.", "warn");
      }
    });

    selectionInfoEl.addEventListener("input", (event) => {
      if (event.target.classList.contains("selected-file-title-input")) {
        updateSelectedFileTitle(event.target.dataset.uploadId, event.target.value);
      } else if (event.target.classList.contains("selected-file-tags-input")) {
        updateSelectedFileTags(event.target.dataset.uploadId, event.target.value);
      }
    });

    uploadSelectedBtn.addEventListener("click", uploadSelectedFiles);

    dropzoneEl.addEventListener("dragover", (event) => {
      event.preventDefault();
      dropzoneEl.classList.add("dragover");
    });

    dropzoneEl.addEventListener("dragleave", () => {
      dropzoneEl.classList.remove("dragover");
    });

    dropzoneEl.addEventListener("drop", (event) => {
      event.preventDefault();
      dropzoneEl.classList.remove("dragover");
      setSelectedFiles(event.dataTransfer?.files || []);
    });

    renameDocumentSelectEl.addEventListener("change", syncRenameTitle);
    renamePreviewBtn.addEventListener("click", previewRenameDocument);
    renameDocumentBtn.addEventListener("click", renameSelectedDocument);
    nodeSelectEl.addEventListener("change", applyNodeScope);
    includeChildrenEl.addEventListener("change", applyNodeScope);
    nodeMultiSelectEl.addEventListener("change", (event) => {
      const checkbox = event.target.closest("[data-upload-node-id]");
      if (!checkbox) {
        return;
      }
      const nodeId = String(checkbox.dataset.uploadNodeId || "");
      if (!nodeId || nodeId === String(currentNodeId)) {
        renderUploadNodeChoices();
        return;
      }
      if (checkbox.checked) {
        additionalUploadNodeIds.add(nodeId);
      } else {
        additionalUploadNodeIds.delete(nodeId);
      }
      renderUploadNodeChoices();
      renderScopeStatus();
    });
    jobsRefreshBtn.addEventListener("click", loadQueueJobs);
    cancelAllJobsBtn.addEventListener("click", cancelAllWork);
    jobsListEl.addEventListener("click", (event) => {
      const localCancelButton = event.target.closest(".cancel-local-upload-btn");
      if (localCancelButton) {
        cancelLocalUpload(localCancelButton.dataset.uploadId);
        return;
      }

      const localDismissButton = event.target.closest(".dismiss-local-upload-btn");
      if (localDismissButton) {
        dismissLocalUpload(localDismissButton.dataset.uploadId);
        return;
      }

      const cancelJobButton = event.target.closest(".cancel-job-btn");
      if (cancelJobButton) {
        cancelJob(cancelJobButton.dataset.jobId);
      }
    });
    historyRefreshBtn.addEventListener("click", loadHistoryJobs);
    queueTabBtn.addEventListener("click", () => setSideTab("queue"));
    historyTabBtn.addEventListener("click", () => setSideTab("history"));
    ocrTabBtn.addEventListener("click", () => {
      setSideTab("ocr");
      setStatus(fileStatusEl, "OCR доступен как точечный режим на странице поиска по PDF-страницам.", "ok");
    });

    previewDuplicatesBtn.addEventListener("click", async () => {
      setStatus(dedupeStatusEl, "Ищу дубли...");
      try {
        dedupeKeepByGroup.clear();
        await refreshDuplicatePreview();
      } catch (error) {
        setStatus(dedupeStatusEl, "Ошибка: " + error.message, "warn");
      }
    });

    dedupeRefreshBtn.addEventListener("click", async () => {
      previewDuplicatesBtn.click();
    });

    dedupeResultEl.addEventListener("click", (event) => {
      const previewButton = event.target.closest(".preview-duplicate-btn");
      if (previewButton) {
        previewDocument(previewButton.dataset.documentId);
        return;
      }

      const keepButton = event.target.closest(".keep-duplicate-btn");
      if (keepButton) {
        dedupeKeepByGroup.set(keepButton.dataset.groupKey, keepButton.dataset.documentId);
        if (lastDuplicateData) {
          renderDuplicatePreview(lastDuplicateData);
        }
        setStatus(dedupeStatusEl, "Выбран документ, который нужно оставить.", "ok");
        return;
      }

      const deleteButton = event.target.closest(".delete-duplicate-btn");
      if (deleteButton) {
        deleteDuplicateDocument(deleteButton.dataset.documentId);
      }
    });

    dedupeBtn.addEventListener("click", async () => {
      const documentsToRemove = getDuplicateDocumentsToRemove();
      if (!documentsToRemove.length) {
        setStatus(dedupeStatusEl, "Сначала нажмите «Показать дубли» и выберите, что оставить.", "warn");
        return;
      }
      const confirmed = window.confirm(
        "Удалить лишние документы из найденных групп? Будет удалено: " + documentsToRemove.length + "."
      );
      if (!confirmed) {
        setStatus(dedupeStatusEl, "Удаление дублей отменено.", "warn");
        return;
      }

      setStatus(dedupeStatusEl, "Удаляю старые дубли...");
      try {
        const results = await Promise.allSettled(
          documentsToRemove.map((item) => deleteDocument(item.id))
        );
        const removed = results.filter((result) => result.status === "fulfilled").length;
        const vectors = results.reduce((sum, result) => (
          result.status === "fulfilled" ? sum + Number(result.value?.removedVectors || 0) : sum
        ), 0);
        dedupeResultEl.classList.add("has-content");
        setStatus(
          dedupeStatusEl,
          "Готово. Удалено документов: " + removed + ", векторов: " + vectors,
          "ok"
        );
        await refreshDuplicatePreview();
        await loadDocumentsForRename();
      } catch (error) {
        setStatus(dedupeStatusEl, "Ошибка: " + error.message, "warn");
      }
    });
    setInterval(() => {
      if (document.hidden) {
        return;
      }

      if (activeSideTab === "queue") {
        loadQueueJobs();
      } else if (activeSideTab === "history") {
        loadHistoryJobs();
      }
    }, 2500);
    restoreLocalQueueSnapshot();
    (async () => {
      try {
        await loadNodes();
      } catch (error) {
        scopeStatusEl.textContent = "Разделы недоступны. Новые документы попадут в раздел по умолчанию.";
      }
      syncScopeLinks();
      await loadDocumentsForRename();
      await loadQueueJobs();
    })();
  </script>
</body>
</html>`;
}

function renderJobsHtml() {
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Статусы задач</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f4f6f8;
      --panel: #ffffff;
      --panel-2: #f8fafb;
      --text: #111c29;
      --muted: #607083;
      --line: #d4dde7;
      --line-soft: #e6edf3;
      --accent: #127b85;
      --accent-soft: #e8f7f8;
      --ok: #007a50;
      --ok-soft: #e6f7ef;
      --warn: #a86400;
      --warn-soft: #fff6e6;
      --bad: #b3261e;
      --bad-soft: #fff0f0;
      --shadow: 0 18px 50px rgba(17, 28, 41, 0.08);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", Tahoma, sans-serif;
      background: var(--bg);
      color: var(--text);
    }
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      padding: 14px 22px;
      background: var(--panel);
      border-bottom: 1px solid var(--line);
      position: sticky;
      top: 0;
      z-index: 5;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 800;
      letter-spacing: 0;
      white-space: nowrap;
    }
    .brand-mark {
      width: 30px;
      height: 30px;
      display: inline-grid;
      place-items: center;
      border-radius: 8px;
      background: linear-gradient(135deg, #127b85, #1f9d72);
      color: #fff;
      font-size: 13px;
    }
    .nav {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .nav a {
      color: var(--text);
      text-decoration: none;
      padding: 10px 14px;
      border-radius: 7px;
      border: 1px solid var(--line);
      background: var(--panel);
      line-height: 1;
    }
    .nav a.active {
      background: #14202c;
      border-color: #14202c;
      color: #fff;
    }
    .wrap {
      max-width: 1500px;
      margin: 0 auto;
      padding: 18px 24px 24px;
    }
    .panel {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: var(--shadow);
      overflow: hidden;
    }
    .panel-head {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 18px;
      align-items: start;
      padding: 20px 22px 16px;
      border-bottom: 1px solid var(--line);
    }
    h1 { margin: 0 0 6px; font-size: 24px; line-height: 1.2; }
    .lead { margin: 0; color: var(--muted); line-height: 1.45; }
    .panel-body { padding: 18px 22px 22px; }
    .scope-row {
      display: grid;
      grid-template-columns: minmax(240px, 340px) auto minmax(220px, 1fr);
      gap: 12px;
      align-items: end;
      padding: 14px;
      margin-bottom: 16px;
      border: 1px solid #cfe7ea;
      border-radius: 8px;
      background: #f1fafb;
    }
    .scope-row label {
      display: block;
      font-size: 13px;
      color: var(--muted);
      margin-bottom: 6px;
    }
    .scope-row select {
      width: 100%;
      border-radius: 7px;
      border: 1px solid var(--line);
      background: var(--panel);
      color: var(--text);
      font: inherit;
      padding: 10px 12px;
      min-height: 40px;
    }
    .scope-row .scope-toggle {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-height: 40px;
      margin: 0;
      color: var(--text);
      line-height: 1.25;
      white-space: nowrap;
    }
    .scope-row .scope-toggle input {
      width: 16px;
      height: 16px;
      margin: 0;
      padding: 0;
      flex: 0 0 auto;
    }
    .scope-status {
      align-self: center;
      color: #0d6270;
      font-size: 13px;
      line-height: 1.45;
    }
    button {
      border-radius: 7px;
      border: 1px solid var(--line);
      background: var(--panel);
      color: var(--text);
      font: inherit;
      padding: 10px 14px;
      cursor: pointer;
      min-height: 38px;
    }
    button:hover { border-color: #aebdcb; }
    button:disabled {
      cursor: default;
      opacity: 0.65;
    }
    .primary-btn {
      background: #14202c;
      border-color: #14202c;
      color: #fff;
      font-weight: 700;
    }
    .stop-btn {
      color: var(--bad);
      border-color: #ffc9c9;
      background: #fffafa;
      white-space: nowrap;
    }
    .retry-btn {
      color: var(--ok);
      border-color: #b9e4d2;
      background: #f2fbf7;
      white-space: nowrap;
    }
    .toolbar {
      display: flex;
      gap: 12px;
      align-items: end;
      flex-wrap: wrap;
      margin-bottom: 18px;
    }
    .toolbar-group {
      min-width: 180px;
      flex: 0 1 220px;
    }
    .toolbar-group.search {
      flex: 1 1 300px;
    }
    .toolbar label {
      display: block;
      font-size: 13px;
      color: var(--muted);
      margin-bottom: 6px;
    }
    .toolbar select,
    .toolbar input[type="text"] {
      width: 100%;
      border-radius: 7px;
      border: 1px solid var(--line);
      background: var(--panel);
      color: var(--text);
      font: inherit;
      padding: 10px 12px;
      min-height: 40px;
    }
    .toolbar-inline {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--muted);
      font-size: 14px;
      padding-bottom: 9px;
    }
    .toolbar-inline input {
      width: auto;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(140px, 1fr));
      gap: 10px;
      margin-bottom: 16px;
    }
    .summary-card {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel-2);
      padding: 12px 14px;
    }
    .summary-card strong {
      display: block;
      font-size: 24px;
      line-height: 1.1;
      margin-bottom: 4px;
    }
    .summary-card span {
      color: var(--muted);
      font-size: 13px;
    }
    .summary-card.active { background: var(--warn-soft); border-color: #ffd89b; }
    .summary-card.failed { background: var(--bad-soft); border-color: #ffc4c4; }
    .summary-card.completed { background: var(--ok-soft); border-color: #bfe7d4; }
    .health-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(180px, 1fr));
      gap: 10px;
      margin-bottom: 18px;
    }
    .health-card {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      padding: 12px 14px;
      min-height: 82px;
    }
    .health-card strong {
      display: block;
      font-size: 15px;
      margin-bottom: 7px;
    }
    .health-card .metric {
      font-size: 20px;
      font-weight: 800;
      line-height: 1.1;
      margin-bottom: 5px;
    }
    .health-card.ok { background: var(--ok-soft); border-color: #bfe7d4; }
    .health-card.warn { background: var(--warn-soft); border-color: #ffd89b; }
    .health-card.bad { background: var(--bad-soft); border-color: #ffc4c4; }
    .content-shell {
      border: 1px solid var(--line);
      border-radius: 8px;
      overflow: hidden;
      background: var(--panel);
    }
    .table-scroll {
      overflow-x: auto;
      max-height: calc(100vh - 320px);
      min-height: 260px;
    }
    table { width: 100%; border-collapse: collapse; min-width: 1120px; }
    th, td {
      border-bottom: 1px solid var(--line-soft);
      text-align: left;
      padding: 12px 12px;
      vertical-align: top;
      font-size: 14px;
    }
    th {
      color: var(--muted);
      font-weight: 700;
      background: var(--panel-2);
      position: sticky;
      top: 0;
      z-index: 1;
    }
    tr:last-child td { border-bottom: 0; }
    .status-pill {
      display: inline-flex;
      align-items: center;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 4px 9px;
      font-weight: 700;
      font-size: 12px;
      line-height: 1.1;
      white-space: nowrap;
    }
    .status-running, .status-cancel_requested, .status-queued, .status-pending {
      color: var(--warn);
      background: var(--warn-soft);
      border-color: #ffd89b;
    }
    .status-completed {
      color: var(--ok);
      background: var(--ok-soft);
      border-color: #bfe7d4;
    }
    .status-cancelled {
      color: #52616f;
      background: #eef2f5;
      border-color: #d8e1ea;
    }
    .status-failed {
      color: var(--bad);
      background: var(--bad-soft);
      border-color: #ffc4c4;
    }
    .small { color: var(--muted); font-size: 12px; }
    .muted { color: var(--muted); }
    .progress {
      min-width: 150px;
    }
    .progress-main {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 6px;
      font-weight: 700;
    }
    .bar {
      width: 100%;
      height: 7px;
      border-radius: 999px;
      overflow: hidden;
      background: #e8eef3;
      margin: 5px 0 7px;
    }
    .bar span {
      display: block;
      height: 100%;
      background: linear-gradient(90deg, #127b85, #1f9d72);
    }
    .row-running {
      background: #fffdf8;
    }
    .row-failed {
      background: #fffafa;
    }
    .path {
      word-break: break-word;
      margin-top: 3px;
      max-width: 340px;
    }
    .doc-title {
      font-weight: 700;
      max-width: 260px;
      word-break: break-word;
    }
    .error-text {
      color: var(--bad);
      max-width: 320px;
      word-break: break-word;
    }
    .empty-state {
      border: 1px dashed #c8d5e1;
      border-radius: 8px;
      background: var(--panel-2);
      color: var(--muted);
      padding: 18px;
      line-height: 1.45;
    }
    .load-state {
      padding: 18px;
      color: var(--muted);
    }
    @media (max-width: 900px) {
      .topbar {
        align-items: flex-start;
        flex-direction: column;
      }
      .nav {
        justify-content: flex-start;
      }
      .wrap {
        padding: 12px;
      }
      .panel-head {
        grid-template-columns: 1fr;
      }
      .scope-row {
        grid-template-columns: 1fr;
      }
      .scope-row .scope-toggle {
        min-height: auto;
        white-space: normal;
      }
      .toolbar {
        flex-direction: column;
        align-items: stretch;
      }
      .toolbar-group {
        min-width: 100%;
        flex-basis: auto;
      }
      .summary-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .health-grid {
        grid-template-columns: 1fr;
      }
      .table-scroll {
        max-height: none;
      }
    }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="brand"><span class="brand-mark">LR</span><span>LOCAL-RAG-PLATFORM</span></div>
    <nav class="nav" aria-label="Главная навигация">
      <a href="/ui/consult">Консультант</a>
      <a href="/ui/ingest">Загрузка документов</a>
      <a href="/ui/nodes">Разделы базы</a>
      <a class="active" href="/ui/jobs">Админ / состояние базы</a>
      <a href="/ui/pages-search">Поиск по страницам PDF</a>
    </nav>
  </header>
  <div class="wrap">
    <div class="panel">
      <div class="panel-head">
        <div>
          <h1>Статусы задач</h1>
          <p class="lead">Контроль фонового импорта: текущие задачи, история, ошибки и повторный запуск.</p>
        </div>
        <button id="refreshBtn" class="primary-btn" type="button">Обновить</button>
      </div>
      <div class="panel-body">
        <div class="scope-row">
          <div>
            <label for="nodeSelect">Рабочий раздел</label>
            <select id="nodeSelect">
              <option value="">Разделы загружаются</option>
            </select>
          </div>
          <label class="scope-toggle" for="includeChildren">
            <input id="includeChildren" type="checkbox" checked />
            <span>Раздел и вложенные</span>
          </label>
          <div id="scopeStatus" class="scope-status">Контекст раздела загружается.</div>
        </div>
        <div id="systemHealth" class="health-grid" aria-live="polite">
          <div class="health-card warn">
            <strong>Состояние базы</strong>
            <div class="metric">Проверяю</div>
            <div class="small">Qdrant и PostgreSQL</div>
          </div>
        </div>
        <div class="toolbar">
          <div class="toolbar-group">
            <label for="statusFilter">Что показывать</label>
            <select id="statusFilter">
              <option value="active">Активные</option>
              <option value="history">История</option>
              <option value="errors">Ошибки и остановки</option>
              <option value="all">Все задачи</option>
            </select>
          </div>
          <div class="toolbar-group">
            <label for="limitFilter">Сколько строк</label>
            <select id="limitFilter">
              <option value="25">25</option>
              <option value="50" selected>50</option>
              <option value="100">100</option>
              <option value="200">200</option>
            </select>
          </div>
          <div class="toolbar-group search">
            <label for="searchFilter">Поиск по документу или ошибке</label>
            <input id="searchFilter" type="text" placeholder="Например, G2025_RU_02_01.pdf" />
          </div>
          <div class="toolbar-inline">
            <input id="autoRefresh" type="checkbox" checked />
            <label for="autoRefresh">Автообновление 10 секунд</label>
          </div>
        </div>
        <div id="content" class="load-state">Загрузка задач...</div>
      </div>
    </div>
  </div>
  <script>
    const contentEl = document.getElementById("content");
    const refreshBtn = document.getElementById("refreshBtn");
    const statusFilterEl = document.getElementById("statusFilter");
    const limitFilterEl = document.getElementById("limitFilter");
    const searchFilterEl = document.getElementById("searchFilter");
    const autoRefreshEl = document.getElementById("autoRefresh");
    const nodeSelectEl = document.getElementById("nodeSelect");
    const includeChildrenEl = document.getElementById("includeChildren");
    const scopeStatusEl = document.getElementById("scopeStatus");
    const systemHealthEl = document.getElementById("systemHealth");
    const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    let searchTimer = null;
    let knowledgeNodes = [];
    let currentNodeId = "";
    let currentIncludeChildren = true;

    function escapeHtml(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function formatNumber(value) {
      return new Intl.NumberFormat("ru-RU").format(Number(value || 0));
    }

    function flattenNodeTree(items, depth = 0) {
      return (Array.isArray(items) ? items : []).flatMap((item) => {
        const current = { ...item, depth };
        return [current, ...flattenNodeTree(item.children || [], depth + 1)];
      });
    }

    function currentNode() {
      return knowledgeNodes.find((item) => String(item.id) === String(currentNodeId)) || null;
    }

    function readScopeFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const urlNodeId = params.get("nodeId") || "";
      const urlIncludeChildren = params.get("includeChildren");

      return {
        nodeId: urlNodeId,
        includeChildren:
          urlIncludeChildren === null
            ? true
            : ["1", "true", "yes", "on", "да"].includes(urlIncludeChildren.toLowerCase()),
      };
    }

    function hasScopeInUrl() {
      const params = new URLSearchParams(window.location.search);
      return params.has("nodeId") || params.has("includeChildren");
    }

    async function readSavedUiScope() {
      try {
        const response = await fetch("/ui/state");
        const data = await response.json();
        if (!response.ok || data.ok !== true) {
          return null;
        }
        const state = data.state || {};
        return {
          nodeId: state.currentNodeId || "",
          includeChildren: state.includeChildren !== false,
        };
      } catch (error) {
        return null;
      }
    }

    async function resolveInitialScope() {
      const urlScope = readScopeFromUrl();
      if (hasScopeInUrl()) {
        return urlScope;
      }
      return (await readSavedUiScope()) || urlScope;
    }

    async function saveUiScope() {
      try {
        await fetch("/ui/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentNodeId: currentNodeId || null,
            includeChildren: currentIncludeChildren,
          }),
        });
      } catch (error) {
        console.warn("Не удалось сохранить контекст UI", error);
      }
    }

    function syncScopeUrl() {
      const url = new URL(window.location.href);
      if (currentNodeId) {
        url.searchParams.set("nodeId", currentNodeId);
      } else {
        url.searchParams.delete("nodeId");
      }
      url.searchParams.set("includeChildren", String(currentIncludeChildren));
      window.history.replaceState({}, "", url);
    }

    function syncIncludeChildrenControl() {
      const node = currentNode();
      const label = includeChildrenEl.closest(".scope-toggle") || includeChildrenEl.parentElement;
      const systemScope = node?.isSystem === true;
      if (systemScope) {
        currentIncludeChildren = false;
        includeChildrenEl.checked = false;
      }
      includeChildrenEl.disabled = systemScope;
      if (label) {
        label.hidden = systemScope;
      }
    }

    function renderScopeStatus() {
      const node = currentNode();
      if (!node) {
        scopeStatusEl.textContent = "Раздел не выбран. Показаны задачи по всей базе.";
        return;
      }

      const counts = node.counts || {};
      const docs = formatNumber(counts.scopeDocuments ?? counts.directDocuments ?? 0);
      const pages = formatNumber(counts.scopePages ?? 0);
      scopeStatusEl.textContent = (
        "Текущий контекст: " +
        node.name +
        " · " +
        docs +
        " документов" +
        (Number(counts.scopePages || 0) > 0 ? " · " + pages + " страниц" : "")
      );
    }

    function populateNodeSelect() {
      if (!knowledgeNodes.length) {
        nodeSelectEl.innerHTML = '<option value="">Все разделы</option>';
        nodeSelectEl.value = "";
        renderScopeStatus();
        return;
      }

      nodeSelectEl.innerHTML = knowledgeNodes
        .map((item) => {
          const prefix = item.depth > 0 ? Array(item.depth + 1).join("— ") : "";
          const counts = item.counts || {};
          const docs = Number(counts.scopeDocuments ?? counts.directDocuments ?? 0);
          const label = prefix + item.name + " (" + docs + ")";
          return '<option value="' + escapeHtml(item.id) + '">' + escapeHtml(label) + '</option>';
        })
        .join("");
      nodeSelectEl.value = currentNodeId;
      includeChildrenEl.checked = currentIncludeChildren;
      syncIncludeChildrenControl();
      renderScopeStatus();
    }

    async function loadNodes() {
      const requestedScope = await resolveInitialScope();
      const response = await fetch("/nodes?format=tree");
      const data = await response.json();
      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || "Не удалось загрузить разделы");
      }

      knowledgeNodes = flattenNodeTree(data.items || []);
      const requestedExists = knowledgeNodes.some(
        (item) => String(item.id) === String(requestedScope.nodeId)
      );
      const systemNode = knowledgeNodes.find((item) => item.isSystem === true);
      const fallbackNode = systemNode || knowledgeNodes[0] || null;

      currentNodeId = requestedExists ? requestedScope.nodeId : (fallbackNode?.id || "");
      currentIncludeChildren = requestedScope.includeChildren;
      populateNodeSelect();
      syncScopeUrl();
    }

    async function applyNodeScope() {
      currentNodeId = nodeSelectEl.value || "";
      currentIncludeChildren = includeChildrenEl.checked;
      syncIncludeChildrenControl();
      renderScopeStatus();
      syncScopeUrl();
      await saveUiScope();
      await loadJobs();
    }

    function statusLabel(status) {
      const labels = {
        running: "выполняется",
        cancel_requested: "останавливается",
        cancelled: "остановлено",
        completed: "готово",
        failed: "ошибка",
        pending: "ожидает",
        queued: "ожидает",
      };
      return labels[status] || status || "неизвестно";
    }

    function documentStatusLabel(status) {
      const labels = {
        indexed: "проиндексирован",
        indexing: "индексируется",
        cancelled: "остановлен",
        failed: "ошибка",
        new: "новый",
      };
      return labels[status] || status || "";
    }

    function jobTypeLabel(jobType) {
      const labels = {
        "ingest-file": "импорт файла",
        "ingest-folder": "импорт папки",
        "ingest-text": "импорт текста",
      };
      return labels[jobType] || jobType || "задача";
    }

    function statusClass(status) {
      return "status-" + String(status || "unknown").replace(/[^a-z0-9_-]/gi, "");
    }

    function renderAction(item) {
      if (item.status === "running" || item.status === "queued" || item.status === "cancel_requested") {
        const disabled = item.status === "cancel_requested" ? "disabled" : "";
        const label = item.status === "cancel_requested" ? "Остановка..." : "Остановить";
        return "<button class='stop-btn' data-job-id='" + escapeHtml(item.id) + "' " + disabled + ">" + label + "</button>";
      }

      if ((item.status === "failed" || item.status === "cancelled") && item.job_type === "ingest-file") {
        return "<button class='retry-btn' data-job-id='" + escapeHtml(item.id) + "'>Повторить</button>";
      }

      return "<span class='small'>—</span>";
    }

    function renderProgress(item) {
      const total = Number(item.total_items || 0);
      const processed = Number(item.processed_items || 0);
      const percent = Number(item.progress_percent || 0);
      const width = Math.max(0, Math.min(100, percent || (total > 0 ? (processed / total) * 100 : 0)));
      const label = total > 0 ? processed + " / " + total : "—";
      return "<div class='progress'>" +
        "<div class='progress-main'><span>" + escapeHtml(label) + "</span><span class='small'>" + escapeHtml(width ? Math.round(width) + "%" : "") + "</span></div>" +
        "<div class='bar'><span style='width:" + width + "%'></span></div>" +
        "<div class='small'>" + escapeHtml(item.progress_message || "") + "</div>" +
      "</div>";
    }

    function formatDate(value) {
      if (!value) {
        return "—";
      }

      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        return value;
      }

      return dateFormatter.format(parsed);
    }

    function eventDate(item) {
      return item.finished_at || item.started_at || item.created_at || "";
    }

    function summarize(items) {
      return items.reduce((acc, item) => {
        if (["queued", "pending", "running", "cancel_requested"].includes(item.status)) {
          acc.active += 1;
        } else if (item.status === "completed") {
          acc.completed += 1;
        } else if (item.status === "failed" || item.status === "cancelled") {
          acc.failed += 1;
        }
        acc.total += 1;
        return acc;
      }, { active: 0, completed: 0, failed: 0, total: 0 });
    }

    function renderSummary(items) {
      const counts = summarize(items);
      return "<div class='summary-grid'>" +
        "<div class='summary-card'><strong>" + counts.total + "</strong><span>задач в выборке</span></div>" +
        "<div class='summary-card active'><strong>" + counts.active + "</strong><span>активные</span></div>" +
        "<div class='summary-card failed'><strong>" + counts.failed + "</strong><span>ошибки и остановки</span></div>" +
        "<div class='summary-card completed'><strong>" + counts.completed + "</strong><span>завершено</span></div>" +
      "</div>";
    }

    function formatDateTime(value) {
      if (!value) {
        return "—";
      }

      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        return value;
      }

      return dateFormatter.format(parsed);
    }

    function renderSystemHealth(qdrantData, syncData) {
      const qdrant = qdrantData?.qdrant || {};
      const postgres = qdrantData?.postgres || {};
      const postgresIndexed = qdrantData?.postgresIndexed || {};
      const sync = syncData?.status || null;
      const qdrantOk = qdrantData?.ok === true && qdrant.ok === true && qdrant.exists === true;
      const qdrantClass = qdrantOk ? "ok" : qdrant.ok === false ? "bad" : "warn";
      const qdrantMetric = qdrantOk
        ? String(qdrant.status || "green")
        : qdrant.ok === false
          ? "ошибка"
          : "нет коллекции";
      const qdrantDetails = qdrantOk
        ? formatNumber(qdrant.pointsCount) + " точек в " + escapeHtml(qdrantData.collection || "Qdrant")
        : escapeHtml(qdrant.error || "Коллекция ещё не создана");
      const syncClass = sync?.lastError ? "bad" : sync?.lastReindexAt ? "ok" : "warn";
      const syncMetric = sync?.lastReindexAt ? formatDateTime(sync.lastReindexAt) : "нет данных";
      let syncDetails = "Синхронизация ещё не запускалась";
      if (sync?.lastError) {
        syncDetails = escapeHtml(sync.lastError);
      } else if (sync) {
        const scopeLabel = sync.lastScope === "qdrant-rebuild"
          ? "пересборка Qdrant"
          : sync.lastScope === "node"
            ? "payload раздела"
            : sync.lastScope === "document"
              ? "payload документа"
              : escapeHtml(sync.lastScope || "ручная операция");
        syncDetails = sync.lastPointCount > 0
          ? "Обновлено точек: " + formatNumber(sync.lastPointCount) + " · " + scopeLabel
          : "Точек не обновлялось · " + scopeLabel + " без Qdrant-точек";
      }
      const indexedTotal = Number(postgresIndexed.totalCount ?? 0);
      const allTotal = Number(postgres.totalCount ?? 0);
      const postgresClass = indexedTotal > 0 ? "ok" : "warn";
      const postgresDetails =
        formatNumber(postgresIndexed.chunkCount) + " chunks · " +
        formatNumber(postgresIndexed.assetCount) + " страниц/assets · всего записей: " +
        formatNumber(allTotal);

      systemHealthEl.innerHTML =
        "<div class='health-card " + qdrantClass + "'>" +
          "<strong>Qdrant</strong>" +
          "<div class='metric'>" + escapeHtml(qdrantMetric) + "</div>" +
          "<div class='small'>" + qdrantDetails + "</div>" +
        "</div>" +
        "<div class='health-card " + postgresClass + "'>" +
          "<strong>PostgreSQL indexed</strong>" +
          "<div class='metric'>" + formatNumber(indexedTotal) + "</div>" +
          "<div class='small'>" + postgresDetails + "</div>" +
        "</div>" +
        "<div class='health-card " + syncClass + "'>" +
          "<strong>Последняя операция payload</strong>" +
          "<div class='metric'>" + escapeHtml(syncMetric) + "</div>" +
          "<div class='small'>" + syncDetails + "</div>" +
        "</div>";
    }

    async function loadSystemHealth() {
      try {
        const [qdrantResponse, syncResponse] = await Promise.all([
          fetch("/admin/qdrant-status"),
          fetch("/admin/sync-status"),
        ]);
        const [qdrantData, syncData] = await Promise.all([
          qdrantResponse.json(),
          syncResponse.json(),
        ]);
        renderSystemHealth(qdrantData, syncData);
      } catch (error) {
        systemHealthEl.innerHTML =
          "<div class='health-card bad'>" +
            "<strong>Состояние базы</strong>" +
            "<div class='metric'>ошибка</div>" +
            "<div class='small'>Не удалось получить статус Qdrant/PostgreSQL</div>" +
          "</div>";
      }
    }

    function renderEmpty() {
      const mode = statusFilterEl.value || "active";
      const text = mode === "active"
        ? "Активных задач сейчас нет. После запуска импорта они появятся здесь."
        : "По текущему фильтру задачи не найдены.";
      return "<div class='empty-state'>" + escapeHtml(text) + "</div>";
    }

    function rowClass(item) {
      if (item.status === "running" || item.status === "queued" || item.status === "cancel_requested") {
        return "row-running";
      }
      if (item.status === "failed") {
        return "row-failed";
      }
      return "";
    }

    function renderRows(items) {
      return items.map((item) => {
        const documentLabel = item.document_title || item.document_id || "—";
        const fileLabel = item.original_file_name || item.original_file_path || "—";
        const errorLabel = item.error_message || "—";
        const trClass = rowClass(item);
        return "<tr" + (trClass ? " class='" + trClass + "'" : "") + ">" +
          "<td><span class='status-pill " + statusClass(item.status) + "'>" + escapeHtml(statusLabel(item.status)) + "</span><div class='small'>" + escapeHtml(jobTypeLabel(item.job_type)) + "</div></td>" +
          "<td>" + renderProgress(item) + "</td>" +
          "<td><div class='doc-title'>" + escapeHtml(documentLabel) + "</div><div class='small'>" + escapeHtml(documentStatusLabel(item.document_status)) + "</div></td>" +
          "<td><div>" + escapeHtml(fileLabel) + "</div><div class='small path'>" + escapeHtml(item.original_file_path || "") + "</div></td>" +
          "<td>" + escapeHtml(item.chunk_count || "0") + "</td>" +
          "<td>" + escapeHtml(formatDate(item.started_at || item.created_at)) + "</td>" +
          "<td>" + escapeHtml(formatDate(item.finished_at)) + "</td>" +
          "<td class='error-text'>" + escapeHtml(errorLabel) + "</td>" +
          "<td>" + renderAction(item) + "</td>" +
        "</tr>";
      }).join("");
    }

    function renderTable(items) {
      return "<div class='content-shell'><div class='table-scroll'>" +
        "<table><thead><tr><th>Статус</th><th>Прогресс</th><th>Документ</th><th>Файл</th><th>Chunks</th><th>Начало</th><th>Завершение</th><th>Ошибка</th><th>Действие</th></tr></thead><tbody>" +
        renderRows(items) +
        "</tbody></table></div></div>";
    }

    async function loadJobs() {
      const params = new URLSearchParams();
      params.set("statusMode", statusFilterEl.value || "active");
      params.set("limit", limitFilterEl.value || "50");

      const searchTerm = (searchFilterEl.value || "").trim();
      if (searchTerm) {
        params.set("search", searchTerm);
      }
      if (currentNodeId) {
        params.set("nodeId", currentNodeId);
        params.set("includeChildren", String(currentIncludeChildren));
      }

      contentEl.className = "load-state";
      contentEl.textContent = "Загрузка задач...";

      try {
        const response = await fetch("/jobs?" + params.toString());
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Не удалось загрузить задачи");
        }

        const items = Array.isArray(data.items) ? data.items : [];
        renderScopeStatus();
        contentEl.className = "";
        contentEl.innerHTML = items.length === 0
          ? renderEmpty()
          : renderSummary(items) + renderTable(items);
      } catch (error) {
        contentEl.className = "";
        contentEl.innerHTML = "<div class='empty-state'>Не удалось загрузить задачи. Проверьте, что kb-api запущен, и попробуйте обновить страницу.</div>";
      }
    }

    refreshBtn.addEventListener("click", async () => {
      await Promise.all([loadSystemHealth(), loadJobs()]);
    });
    statusFilterEl.addEventListener("change", loadJobs);
    limitFilterEl.addEventListener("change", loadJobs);
    nodeSelectEl.addEventListener("change", applyNodeScope);
    includeChildrenEl.addEventListener("change", applyNodeScope);
    searchFilterEl.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(loadJobs, 250);
    });
    contentEl.addEventListener("click", async (event) => {
      const stopButton = event.target.closest(".stop-btn");
      const retryButton = event.target.closest(".retry-btn");
      const button = stopButton || retryButton;
      if (!button) {
        return;
      }

      const isStop = Boolean(stopButton);
      button.disabled = true;
      button.textContent = isStop ? "Остановка..." : "Запуск...";

      try {
        const response = await fetch("/jobs/" + encodeURIComponent(button.dataset.jobId) + (isStop ? "/cancel" : "/retry"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: "{}",
        });
        const data = await response.json();
        if (!response.ok || data.ok !== true) {
          throw new Error(data.error || (isStop ? "Не удалось остановить задачу" : "Не удалось поставить повторный импорт в очередь"));
        }
      } catch (error) {
        alert(error.message || (isStop ? "Не удалось остановить задачу" : "Не удалось поставить повторный импорт в очередь"));
      } finally {
        await loadJobs();
      }
    });
    (async () => {
      try {
        await loadNodes();
      } catch (error) {
        scopeStatusEl.textContent = "Разделы недоступны. Задачи будут показаны без ограничения разделом.";
      }
      await loadJobs();
      await loadSystemHealth();
    })();
    setInterval(() => {
      if (autoRefreshEl.checked) {
        loadJobs();
        loadSystemHealth();
      }
    }, 10000);
  </script>
</body>
</html>`;
}

export async function uiRoutes(app) {
  app.get("/ui/consult", async (_request, reply) => {
    reply.type("text/html; charset=utf-8");
    return renderConsultantHtml();
  });

  app.get("/ui/pages-search", async (_request, reply) => {
    reply.type("text/html; charset=utf-8");
    return renderPagesSearchHtml();
  });

  app.get("/ui/ingest", async (_request, reply) => {
    reply.type("text/html; charset=utf-8");
    return renderIngestHtml();
  });

  app.get("/ui/nodes", async (_request, reply) => {
    reply.type("text/html; charset=utf-8");
    return renderNodesHtml();
  });

  app.get("/ui/jobs", async (_request, reply) => {
    reply.type("text/html; charset=utf-8");
    return renderJobsHtml();
  });
}
