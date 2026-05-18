import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { readWorkbook, parseWorkbookWithProfile } from "./graphParsers/xlsxParser.js";
import { buildSignalKindMatcher } from "./graphParsers/signalKindNormalizer.js";

const KOYO_MARKER_SHEETS = new Set(["ai", "ao", "di", "do", "ain", "aout", "din", "dout"]);

function normalizedName(name) {
  return String(name ?? "").trim().toLowerCase();
}

function pickHeaderSample(headersBySheet, sheetName) {
  const rows = headersBySheet[sheetName] || [];
  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    if (row.some((c) => c && String(c).trim().length > 0)) {
      return row.slice(0, 16);
    }
  }
  return [];
}

function estimateEdges(parsed) {
  let edges = 0;
  if (parsed.cabinets.length > 0) edges += parsed.stations.length; // station→cabinet
  edges += parsed.cards.length; // card→station
  edges += parsed.channels.length; // channel→card has_channel
  edges += parsed.signals.filter((s) => s.channelKey).length; // signal→channel
  edges += parsed.signals.filter((s) => s.deviceTag).length; // signal→device
  edges += parsed.devices.length; // device→station
  return edges;
}

export class GraphPreviewService {
  constructor({ graphConfigService, logger = null } = {}) {
    if (!graphConfigService) throw new Error("GraphPreviewService требует graphConfigService");
    this.graphConfigService = graphConfigService;
    this.logger = logger;
  }

  async _withTempFile(buffer, filename, fn) {
    const ext = path.extname(filename || "") || ".xlsx";
    const tempPath = path.join(os.tmpdir(), `graph-preview-${randomUUID()}${ext}`);
    await fs.writeFile(tempPath, buffer);
    try {
      return await fn(tempPath);
    } finally {
      try { await fs.unlink(tempPath); } catch { /* no-op */ }
    }
  }

  async detectStyle({ buffer, filename }) {
    return this._withTempFile(buffer, filename, async (tempPath) => {
      let wb;
      try {
        wb = readWorkbook(tempPath);
      } catch (err) {
        const e = new Error(`Не удалось открыть файл как XLSX: ${err.message}`);
        e.code = "XLSX_OPEN";
        throw e;
      }
      const sheetNames = wb.sheetNames;
      const koyoSheets = sheetNames.filter((n) => KOYO_MARKER_SHEETS.has(normalizedName(n)));
      const isKoyo = koyoSheets.length >= 2;
      const style = isKoyo ? "koyo" : "metso";
      const sheets = sheetNames.map((name) => {
        const headers = wb.headersBySheet[name] || [];
        return {
          name,
          rows: headers.length,
          has_data: headers.some((row) => Array.isArray(row) && row.some((c) => c && String(c).trim() !== "")),
          sample_header: pickHeaderSample(wb.headersBySheet, name),
          all_header_rows: headers.slice(0, 6).map((row) => (Array.isArray(row) ? row.slice(0, 16) : [])),
        };
      });
      const suggested = {
        file_extensions: [path.extname(filename || "").toLowerCase() || ".xlsx"],
        likely_header_row: 1,
        likely_data_start_row: 4,
      };
      return { ok: true, style, sheets, suggested_metadata: suggested };
    });
  }

  async preview({ buffer, filename, profile }) {
    if (!profile || typeof profile !== "object") {
      const e = new Error("profile обязателен и должен быть объектом");
      e.code = "VALIDATION";
      throw e;
    }
    let aliasesData;
    try {
      const res = await this.graphConfigService.readAliasesDocument();
      aliasesData = res.data;
    } catch {
      aliasesData = { signal_kind: {} };
    }
    const signalKindMatcher = buildSignalKindMatcher(aliasesData);

    return this._withTempFile(buffer, filename, async (tempPath) => {
      let wb;
      try {
        wb = readWorkbook(tempPath);
      } catch (err) {
        const e = new Error(`Не удалось открыть файл как XLSX: ${err.message}`);
        e.code = "XLSX_OPEN";
        throw e;
      }
      let parsed;
      try {
        parsed = parseWorkbookWithProfile({
          workbook: wb.workbook,
          profile,
          filePath: tempPath,
          signalKindMatcher,
        });
      } catch (err) {
        const e = new Error(`Парсер упал на этом файле: ${err.message}`);
        e.code = "PARSE";
        throw e;
      }
      const summary = {
        cabinet: { found: parsed.cabinets.length },
        station: { found: parsed.stations.length },
        card: { found: parsed.cards.length },
        channel: { found: parsed.channels.length },
        signal: { found: parsed.signals.length },
        device: { found: parsed.devices.length },
      };
      const sampleSignals = parsed.signals.slice(0, 10).map((s) => ({
        tag: s.attributes?.tag ?? null,
        signal_kind: s.attributes?.signal_kind ?? null,
        signal_kind_raw: s.attributes?.signal_kind_raw ?? null,
        address: s.attributes?.address ?? s.attributes?.signal_address ?? null,
        channel: s.attributes?.channel ?? null,
        station_code: s.attributes?.station_code ?? null,
        description: s.attributes?.description ?? null,
      }));
      return {
        ok: true,
        summary,
        edges_estimate: estimateEdges(parsed),
        warnings: parsed.warnings,
        sample_signals: sampleSignals,
      };
    });
  }
}

export const __testing = { estimateEdges, KOYO_MARKER_SHEETS };
