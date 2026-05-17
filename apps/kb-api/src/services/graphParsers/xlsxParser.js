import path from "node:path";
import XLSX from "xlsx";

function safeRegex(pattern) {
  if (!pattern) return null;
  try {
    return new RegExp(pattern);
  } catch {
    return null;
  }
}

function normalizeHeader(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function trimOrNull(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function rowMatchesSkipCondition(row, condition) {
  if (typeof condition !== "string" || condition.length === 0) return false;
  const [code, arg] = condition.split(":", 2);
  switch (code) {
    case "loop_tag_empty":
      return !trimOrNull(row.loop_tag);
    case "loop_tag_matches": {
      const re = safeRegex(arg);
      return re ? re.test(String(row.loop_tag ?? "")) : false;
    }
    case "tag_empty":
      return !trimOrNull(row.tag);
    case "description_matches": {
      const re = safeRegex(arg);
      return re ? re.test(String(row.description ?? "")) : false;
    }
    default:
      return false;
  }
}

export function readWorkbook(filePath) {
  const workbook = XLSX.readFile(filePath, { cellDates: false, cellNF: false, cellText: false });
  const sheetNames = workbook.SheetNames || [];
  const headersBySheet = {};
  for (const name of sheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet) {
      headersBySheet[name] = [];
      continue;
    }
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, blankrows: true });
    const headerRows = [];
    for (let i = 0; i < Math.min(8, rows.length); i++) {
      const row = rows[i] || [];
      headerRows.push(row.map((c) => (c === null || c === undefined ? "" : String(c))));
    }
    headersBySheet[name] = headerRows;
  }
  return { workbook, sheetNames, headersBySheet };
}

function findColumnIndices(headerRow, columnsConfig) {
  const result = {};
  const normalizedHeaders = headerRow.map((c) => normalizeHeader(c));
  for (const [field, headerLabel] of Object.entries(columnsConfig || {})) {
    const target = normalizeHeader(headerLabel);
    if (!target) {
      result[field] = -1;
      continue;
    }
    let idx = normalizedHeaders.findIndex((h) => h === target);
    if (idx < 0) {
      idx = normalizedHeaders.findIndex((h) => h.includes(target));
    }
    result[field] = idx;
  }
  return result;
}

function extractRowFields(row, columnIndices) {
  const out = {};
  for (const [field, idx] of Object.entries(columnIndices)) {
    if (idx < 0 || idx >= row.length) {
      out[field] = null;
    } else {
      out[field] = row[idx] === null || row[idx] === undefined ? null : row[idx];
    }
  }
  return out;
}

function extractCabinetCodeFromSheet(sheetName, cabinetCfg) {
  if (!cabinetCfg || cabinetCfg.source !== "sheet_name") return null;
  const re = safeRegex(cabinetCfg.pattern);
  if (!re) return null;
  const m = sheetName.match(re);
  return m ? (m[1] || m[0]) : null;
}

function renderTemplate(template, vars) {
  if (!template) return null;
  return String(template).replace(/\{(\w+)\}/g, (_, key) => {
    const val = vars[key];
    return val === undefined || val === null ? "" : String(val);
  });
}

function dataRowsFromSheet(sheet, layout) {
  const headerRowIdx = Math.max(1, Number(layout?.header_row ?? 1)) - 1;
  const dataStartRowIdx = Math.max(1, Number(layout?.data_start_row ?? headerRowIdx + 2)) - 1;
  // blankrows: true сохраняет «пустые» строки в массиве, чтобы индекс совпадал
  // с реальным номером строки в Excel (важно для header_row/data_start_row).
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, blankrows: true });
  const headerRow = matrix[headerRowIdx] || [];
  const dataRows = [];
  for (let i = dataStartRowIdx; i < matrix.length; i++) {
    const row = matrix[i];
    if (!row || row.every((c) => c === null || c === undefined || String(c).trim() === "")) {
      continue;
    }
    dataRows.push({ row, excelRowNumber: i + 1 });
  }
  return { headerRow, dataRows, headerRowIdx };
}

function aggregateWarning(warningsMap, code, hint, example) {
  if (!warningsMap.has(code)) {
    warningsMap.set(code, { code, count: 0, examples: [], hint });
  }
  const entry = warningsMap.get(code);
  entry.count += 1;
  if (entry.examples.length < 5 && example !== undefined && example !== null) {
    const text = String(example).slice(0, 80);
    if (!entry.examples.includes(text)) entry.examples.push(text);
  }
}

export function parseMetsoStyle({ workbook, profile, filePath, signalKindMatcher }) {
  const layout = profile.layout || {};
  const sheetFilter = safeRegex(layout.sheet_filter);
  const cols = profile.columns || {};
  const builds = new Set(profile.builds || []);
  const skipRows = Array.isArray(profile.skip_rows) ? profile.skip_rows : [];
  const warnings = new Map();
  const cabinets = [];
  const stations = [];
  const cards = [];
  const channels = [];
  const signals = [];
  const devices = [];

  const filename = path.basename(filePath || "");

  for (const sheetName of workbook.SheetNames || []) {
    if (sheetFilter && !sheetFilter.test(sheetName)) continue;
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const { headerRow, dataRows } = dataRowsFromSheet(sheet, layout);
    const columnIndices = findColumnIndices(headerRow, cols);

    const cabinetCode =
      extractCabinetCodeFromSheet(sheetName, profile.cabinet) ||
      renderTemplate(profile.cabinet?.name_template, { sheet_name: sheetName });
    const cabinetName = profile.cabinet?.name_template
      ? renderTemplate(profile.cabinet.name_template, {
          cabinet_code: cabinetCode || sheetName,
          sheet_name: sheetName,
        })
      : `Cabinet ${cabinetCode || sheetName}`;

    let cabinetRef = null;
    if (builds.has("cabinet") && cabinetCode) {
      cabinetRef = {
        type: "cabinet",
        name: cabinetName,
        attributes: { cabinet_code: cabinetCode },
        sourceXlsxSheet: sheetName,
        sourceXlsxRow: 1,
      };
      cabinets.push(cabinetRef);
    }

    const stationsLocal = new Map();
    const cardsLocal = new Map();
    const channelsLocal = new Map();
    const devicesLocal = new Map();

    for (const { row, excelRowNumber } of dataRows) {
      const fields = extractRowFields(row, columnIndices);
      const skip = skipRows.some((rule) => rowMatchesSkipCondition(fields, rule.condition));
      if (skip) continue;

      const loopTag = trimOrNull(fields.loop_tag);
      const deviceTag = trimOrNull(fields.device_tag);
      const cardType = trimOrNull(fields.card_type);
      const address = trimOrNull(fields.address);
      const stationCode = trimOrNull(fields.station_code);
      const channelNumberRaw = fields.channel_number;
      const channelNumber = channelNumberRaw === null || channelNumberRaw === undefined || channelNumberRaw === ""
        ? null
        : String(channelNumberRaw).trim();
      const signalKindRaw = trimOrNull(fields.signal_kind_raw);
      const description = trimOrNull(fields.description);

      if (!loopTag) {
        aggregateWarning(warnings, "loop_tag_empty",
          "Сигналы без LOOPTAG пропущены. Проверьте исходный файл.",
          `${sheetName}:${excelRowNumber}`);
        continue;
      }

      if (!address) {
        aggregateWarning(warnings, "address_empty",
          "Отсутствует ADDRESS — карта/канал/сигнал созданы без полного адреса.",
          `${sheetName}:${excelRowNumber}`);
      }

      let stationRef = null;
      if (builds.has("station") && stationCode) {
        const key = stationCode;
        if (!stationsLocal.has(key)) {
          const node = {
            type: "station",
            name: `ПЛК ${stationCode}`,
            attributes: { station_code: stationCode },
            cabinetCabinetCode: cabinetCode,
            sourceXlsxSheet: sheetName,
            sourceXlsxRow: excelRowNumber,
          };
          stationsLocal.set(key, node);
          stations.push(node);
        }
        stationRef = stationsLocal.get(key);
      }

      let cardRef = null;
      if (builds.has("card") && address) {
        const key = `${stationCode || "*"}::${address}`;
        if (!cardsLocal.has(key)) {
          const node = {
            type: "card",
            name: `${cardType || "Card"} @ ${address}`,
            attributes: {
              address,
              card_type: cardType,
              station_code: stationCode,
            },
            stationCode,
            sourceXlsxSheet: sheetName,
            sourceXlsxRow: excelRowNumber,
          };
          cardsLocal.set(key, node);
          cards.push(node);
        }
        cardRef = cardsLocal.get(key);
      }

      let channelRef = null;
      if (builds.has("channel") && channelNumber !== null) {
        const key = `${cardRef ? `${stationCode || "*"}::${address || "*"}` : "*"}::${channelNumber}`;
        if (!channelsLocal.has(key)) {
          const node = {
            type: "channel",
            name: `Канал ${channelNumber} (${address || ""})`.trim(),
            attributes: {
              channel_number: channelNumber,
              card_address: address,
              station_code: stationCode,
            },
            cardKey: cardRef ? `${stationCode || "*"}::${address}` : null,
            sourceXlsxSheet: sheetName,
            sourceXlsxRow: excelRowNumber,
          };
          channelsLocal.set(key, node);
          channels.push(node);
        }
        channelRef = channelsLocal.get(key);
      }

      let signalKind = null;
      if (signalKindMatcher && signalKindRaw) {
        signalKind = signalKindMatcher.normalize(signalKindRaw);
        if (!signalKind) {
          aggregateWarning(warnings, "signal_kind_unknown",
            "Добавьте алиасы в config/graph-aliases.yaml и запустите /api/v2/graph/reparse/:documentId.",
            signalKindRaw);
        }
      }

      if (builds.has("signal")) {
        signals.push({
          type: "signal",
          name: loopTag,
          attributes: {
            tag: loopTag,
            description,
            signal_kind: signalKind,
            signal_kind_raw: signalKindRaw,
            address,
            channel: channelNumber,
            station_code: stationCode,
            device_tag: deviceTag,
            pin_on_card: trimOrNull(fields.pin_on_card),
            wire_name: trimOrNull(fields.wire_name),
          },
          stationCode,
          channelKey: channelRef
            ? `${cardRef ? `${stationCode || "*"}::${address || "*"}` : "*"}::${channelNumber}`
            : null,
          deviceTag,
          sourceXlsxSheet: sheetName,
          sourceXlsxRow: excelRowNumber,
        });
      }

      if (builds.has("device") && deviceTag) {
        const key = `${stationCode || "*"}::${deviceTag}`;
        if (!devicesLocal.has(key)) {
          const node = {
            type: "device",
            name: deviceTag,
            attributes: {
              position: deviceTag,
              station_code: stationCode,
            },
            stationCode,
            sourceXlsxSheet: sheetName,
            sourceXlsxRow: excelRowNumber,
          };
          devicesLocal.set(key, node);
          devices.push(node);
        }
      }
    }
  }

  return {
    cabinets,
    stations,
    cards,
    channels,
    signals,
    devices,
    warnings: Array.from(warnings.values()),
    filename,
  };
}

export function parseKoyoStyle({ workbook, profile, filePath, signalKindMatcher }) {
  const layout = profile.layout || {};
  const perSheet = profile.per_sheet || {};
  const warnings = new Map();
  const stations = [];
  const cards = [];
  const channels = [];
  const signals = [];

  const filename = path.basename(filePath || "");
  const filenameWithoutExt = filename.replace(/\.[^.]+$/, "");
  const stationCode = renderTemplate(
    profile.station_default?.station_code_template || "{filename_without_ext}",
    { filename_without_ext: filenameWithoutExt }
  );
  const stationName = renderTemplate(
    profile.station_default?.name_template || "ПЛК {station_code}",
    { station_code: stationCode, filename_without_ext: filenameWithoutExt }
  );

  if (stationCode) {
    stations.push({
      type: "station",
      name: stationName,
      attributes: { station_code: stationCode },
      sourceXlsxSheet: workbook.SheetNames?.[0] ?? "",
      sourceXlsxRow: 1,
    });
  }

  const skipRows = Array.isArray(profile.skip_rows) ? profile.skip_rows : [];

  const cardsLocal = new Map();
  const channelsLocal = new Map();

  for (const sheetName of workbook.SheetNames || []) {
    const sheetCfg = perSheet[sheetName];
    if (!sheetCfg) continue;
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const cols = sheetCfg.columns || {};
    const { headerRow, dataRows } = dataRowsFromSheet(sheet, layout);
    const columnIndices = findColumnIndices(headerRow, cols);
    const builds = new Set(sheetCfg.builds || []);
    const explicitSignalKind = trimOrNull(sheetCfg.signal_kind);

    for (const { row, excelRowNumber } of dataRows) {
      const fields = extractRowFields(row, columnIndices);
      const skip = skipRows.some((rule) => rowMatchesSkipCondition(fields, rule.condition));
      if (skip) continue;

      const tag = trimOrNull(fields.tag);
      if (!tag) {
        aggregateWarning(warnings, "tag_empty",
          "Сигналы без Tag пропущены.", `${sheetName}:${excelRowNumber}`);
        continue;
      }
      const cardType = trimOrNull(fields.card_type);
      const cardSlot = trimOrNull(fields.card_slot);
      const channelNumber = trimOrNull(fields.channel_number);
      const description = trimOrNull(fields.description);
      const signalAddress = trimOrNull(fields.signal_address);
      const position = trimOrNull(fields.position);

      const cardAddress = cardSlot ? cardSlot : cardType ? `${cardType}` : null;
      let cardRef = null;
      if (builds.has("card") && cardAddress) {
        const key = `${stationCode || "*"}::${cardAddress}`;
        if (!cardsLocal.has(key)) {
          const node = {
            type: "card",
            name: `${cardType || "Card"} ${cardSlot ? `(слот ${cardSlot})` : ""}`.trim(),
            attributes: {
              address: cardAddress,
              card_type: cardType,
              card_slot: cardSlot,
              station_code: stationCode,
            },
            stationCode,
            sourceXlsxSheet: sheetName,
            sourceXlsxRow: excelRowNumber,
          };
          cardsLocal.set(key, node);
          cards.push(node);
        }
        cardRef = cardsLocal.get(key);
      }

      let channelRef = null;
      if (builds.has("channel") && channelNumber) {
        const key = `${cardAddress || "*"}::${channelNumber}`;
        if (!channelsLocal.has(key)) {
          const node = {
            type: "channel",
            name: `Канал ${channelNumber}${cardAddress ? ` (${cardAddress})` : ""}`,
            attributes: {
              channel_number: channelNumber,
              card_address: cardAddress,
              station_code: stationCode,
            },
            cardKey: cardRef ? `${stationCode || "*"}::${cardAddress}` : null,
            sourceXlsxSheet: sheetName,
            sourceXlsxRow: excelRowNumber,
          };
          channelsLocal.set(key, node);
          channels.push(node);
        }
        channelRef = channelsLocal.get(key);
      }

      const signalKindRaw = explicitSignalKind || sheetName;
      let signalKind = explicitSignalKind;
      if (!signalKind && signalKindMatcher) {
        signalKind = signalKindMatcher.normalize(signalKindRaw);
      }
      if (!signalKind) {
        aggregateWarning(warnings, "signal_kind_unknown",
          "Добавьте алиасы в config/graph-aliases.yaml.", signalKindRaw);
      }

      if (builds.has("signal")) {
        signals.push({
          type: "signal",
          name: tag,
          attributes: {
            tag,
            description,
            signal_kind: signalKind,
            signal_kind_raw: signalKindRaw,
            signal_address: signalAddress,
            position,
            card_address: cardAddress,
            channel: channelNumber,
            station_code: stationCode,
          },
          stationCode,
          channelKey: channelRef
            ? `${cardAddress || "*"}::${channelNumber}`
            : null,
          sourceXlsxSheet: sheetName,
          sourceXlsxRow: excelRowNumber,
        });
      }
    }
  }

  return {
    cabinets: [],
    stations,
    cards,
    channels,
    signals,
    devices: [],
    warnings: Array.from(warnings.values()),
    filename,
  };
}

export function parseWorkbookWithProfile({ workbook, profile, filePath, signalKindMatcher }) {
  if (profile.per_sheet) {
    return parseKoyoStyle({ workbook, profile, filePath, signalKindMatcher });
  }
  return parseMetsoStyle({ workbook, profile, filePath, signalKindMatcher });
}
