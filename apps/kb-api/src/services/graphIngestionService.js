import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

import { matchProfile } from "./graphParsers/profileMatcher.js";
import { buildSignalKindMatcher } from "./graphParsers/signalKindNormalizer.js";
import { readWorkbook, parseWorkbookWithProfile } from "./graphParsers/xlsxParser.js";

const SUPPORTED_EXTENSIONS = new Set([".xlsx", ".xls", ".xlsm"]);

export function loadGraphConfigs({ configDir, logger = null } = {}) {
  const result = {
    parsers: { profiles: [] },
    aliases: { signal_kind: {} },
    errors: [],
  };

  const parsersPath = path.join(configDir, "graph-parsers.yaml");
  const aliasesPath = path.join(configDir, "graph-aliases.yaml");

  try {
    if (fs.existsSync(parsersPath)) {
      const text = fs.readFileSync(parsersPath, "utf8");
      const data = yaml.load(text);
      if (data && Array.isArray(data.profiles)) {
        result.parsers = data;
      } else {
        result.errors.push({ file: "graph-parsers.yaml", message: "В конфиге отсутствует profiles[]" });
        if (logger) logger.error({ parsersPath }, "graph-parsers.yaml: отсутствует profiles[]");
      }
    } else if (logger) {
      logger.warn({ parsersPath }, "graph-parsers.yaml не найден; парсер отключён");
    }
  } catch (err) {
    result.errors.push({ file: "graph-parsers.yaml", message: err.message });
    if (logger) logger.error({ err, parsersPath }, "graph-parsers.yaml невалиден");
  }

  try {
    if (fs.existsSync(aliasesPath)) {
      const text = fs.readFileSync(aliasesPath, "utf8");
      const data = yaml.load(text);
      if (data && typeof data === "object") {
        result.aliases = data;
      }
    }
  } catch (err) {
    result.errors.push({ file: "graph-aliases.yaml", message: err.message });
    if (logger) logger.error({ err, aliasesPath }, "graph-aliases.yaml невалиден");
  }

  return result;
}

function emptyTypeCounts() {
  return { created: 0, updated: 0 };
}

function emptySummary() {
  return {
    object: emptyTypeCounts(),
    cabinet: emptyTypeCounts(),
    station: emptyTypeCounts(),
    card: emptyTypeCounts(),
    channel: emptyTypeCounts(),
    signal: emptyTypeCounts(),
    device: emptyTypeCounts(),
  };
}

function bumpSummary(summary, type, created) {
  if (!summary[type]) summary[type] = emptyTypeCounts();
  if (created) summary[type].created += 1;
  else summary[type].updated += 1;
}

export class GraphIngestionService {
  constructor({
    graphService,
    postgresProvider,
    configs,
    configDir = null,
    logger = null,
  } = {}) {
    if (!graphService) throw new Error("GraphIngestionService требует graphService");
    if (!postgresProvider) throw new Error("GraphIngestionService требует postgresProvider");
    this.graphService = graphService;
    this.postgresProvider = postgresProvider;
    this.logger = logger;
    this.configDir = configDir;
    this.configs = configs ?? { parsers: { profiles: [] }, aliases: { signal_kind: {} }, errors: [] };
    this.signalKindMatcher = buildSignalKindMatcher(this.configs.aliases);
  }

  isFileApplicable(filePath) {
    if (!filePath || typeof filePath !== "string") return false;
    return SUPPORTED_EXTENSIONS.has(path.extname(filePath).toLowerCase());
  }

  reloadConfigs() {
    if (!this.configDir) return;
    this.configs = loadGraphConfigs({ configDir: this.configDir, logger: this.logger });
    this.signalKindMatcher = buildSignalKindMatcher(this.configs.aliases);
  }

  async parseAndIngest({ documentId, filePath, jobId = null }) {
    const startedAt = new Date().toISOString();

    if (!this.isFileApplicable(filePath)) {
      const report = {
        ok: false,
        error: "Файл не поддерживается парсером графа (нужны .xlsx/.xls/.xlsm)",
        started_at: startedAt,
        finished_at: new Date().toISOString(),
      };
      if (jobId) await this.postgresProvider.updateJobGraphReport(jobId, report).catch(() => {});
      return report;
    }

    if (Array.isArray(this.configs?.errors) && this.configs.errors.length > 0) {
      const report = {
        ok: false,
        error: "Конфиг парсера невалиден",
        config_errors: this.configs.errors,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
      };
      if (jobId) await this.postgresProvider.updateJobGraphReport(jobId, report).catch(() => {});
      return report;
    }

    let workbookData;
    try {
      workbookData = readWorkbook(filePath);
    } catch (err) {
      const report = {
        ok: false,
        error: `Не удалось открыть XLSX: ${err.message}`,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
      };
      if (jobId) await this.postgresProvider.updateJobGraphReport(jobId, report).catch(() => {});
      return report;
    }

    const profiles = this.configs?.parsers?.profiles ?? [];
    const matched = matchProfile({
      profiles,
      filePath,
      workbookSheetNames: workbookData.sheetNames,
      workbookHeadersBySheet: workbookData.headersBySheet,
    });

    if (!matched.profile) {
      const report = {
        ok: true,
        profile_id: null,
        warning: "Профиль для графа не распознан. Добавьте профиль в config/graph-parsers.yaml.",
        tried_profiles: matched.tried,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
      };
      if (jobId) await this.postgresProvider.updateJobGraphReport(jobId, report).catch(() => {});
      if (this.logger?.info) {
        this.logger.info({ documentId, filePath, tried: matched.tried }, "graph parser: профиль не распознан");
      }
      return report;
    }

    const profile = matched.profile;
    const author = `import:xlsx:${profile.id}`;
    if (this.logger?.info) {
      this.logger.info({ documentId, profileId: profile.id }, "graph parser: профиль выбран");
    }

    let parsed;
    try {
      parsed = parseWorkbookWithProfile({
        workbook: workbookData.workbook,
        profile,
        filePath,
        signalKindMatcher: this.signalKindMatcher,
      });
    } catch (err) {
      const report = {
        ok: false,
        profile_id: profile.id,
        error: `Ошибка парсинга XLSX: ${err.message}`,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
      };
      if (jobId) await this.postgresProvider.updateJobGraphReport(jobId, report).catch(() => {});
      return report;
    }

    const summary = emptySummary();
    let edgesCreated = 0;
    const stationIdByCode = new Map();
    const cardIdByKey = new Map();
    const channelIdByKey = new Map();
    let cabinetId = null;

    const upsertOpts = (extra = {}) => ({
      sourceDocumentId: documentId,
      author,
      confidence: 1.0,
      ...extra,
    });

    for (const cab of parsed.cabinets) {
      const businessKey = { attributeMatches: [{ field: "cabinet_code", value: cab.attributes.cabinet_code }] };
      const result = await this.graphService.upsertNodeByBusinessKey(
        upsertOpts({
          type: "cabinet",
          name: cab.name,
          businessKey,
          attributes: cab.attributes,
          sourceXlsxSheet: cab.sourceXlsxSheet,
          sourceXlsxRow: cab.sourceXlsxRow,
        })
      );
      cabinetId = result.node.id;
      bumpSummary(summary, "cabinet", result.created);
    }

    for (const st of parsed.stations) {
      const businessKey = { attributeMatches: [{ field: "station_code", value: st.attributes.station_code }] };
      const result = await this.graphService.upsertNodeByBusinessKey(
        upsertOpts({
          type: "station",
          name: st.name,
          businessKey,
          parentNodeId: cabinetId,
          parentRelation: cabinetId ? "installed_in" : null,
          attributes: st.attributes,
          sourceXlsxSheet: st.sourceXlsxSheet,
          sourceXlsxRow: st.sourceXlsxRow,
        })
      );
      stationIdByCode.set(st.attributes.station_code, result.node.id);
      bumpSummary(summary, "station", result.created);
      if (result.created && cabinetId) edgesCreated += 1;
    }

    for (const card of parsed.cards) {
      const parentStationId = card.stationCode ? stationIdByCode.get(card.stationCode) : null;
      const businessKey = {
        attributeMatches: [{ field: "address", value: card.attributes.address }],
      };
      const result = await this.graphService.upsertNodeByBusinessKey(
        upsertOpts({
          type: "card",
          name: card.name,
          businessKey,
          parentNodeId: parentStationId,
          parentRelation: parentStationId ? "installed_in" : null,
          attributes: card.attributes,
          sourceXlsxSheet: card.sourceXlsxSheet,
          sourceXlsxRow: card.sourceXlsxRow,
        })
      );
      const key = `${card.stationCode || "*"}::${card.attributes.address}`;
      cardIdByKey.set(key, result.node.id);
      bumpSummary(summary, "card", result.created);
      if (result.created && parentStationId) edgesCreated += 1;
    }

    for (const ch of parsed.channels) {
      const parentCardId = ch.cardKey ? cardIdByKey.get(ch.cardKey) : null;
      const businessKey = {
        attributeMatches: [{ field: "channel_number", value: ch.attributes.channel_number }],
      };
      const result = await this.graphService.upsertNodeByBusinessKey(
        upsertOpts({
          type: "channel",
          name: ch.name,
          businessKey,
          parentNodeId: parentCardId,
          parentRelation: parentCardId ? "has_channel" : null,
          attributes: ch.attributes,
          sourceXlsxSheet: ch.sourceXlsxSheet,
          sourceXlsxRow: ch.sourceXlsxRow,
        })
      );
      const key = ch.cardKey ? `${ch.cardKey}::${ch.attributes.channel_number}` : `*::${ch.attributes.channel_number}`;
      channelIdByKey.set(key, result.node.id);
      bumpSummary(summary, "channel", result.created);
      if (result.created && parentCardId) edgesCreated += 1;
    }

    const deviceIdByKey = new Map();
    for (const dev of parsed.devices) {
      const parentStationId = dev.stationCode ? stationIdByCode.get(dev.stationCode) : null;
      const businessKey = {
        attributeMatches: [{ field: "position", value: dev.attributes.position }],
      };
      const result = await this.graphService.upsertNodeByBusinessKey(
        upsertOpts({
          type: "device",
          name: dev.name,
          businessKey,
          parentNodeId: parentStationId,
          parentRelation: parentStationId ? "installed_in" : null,
          attributes: dev.attributes,
          sourceXlsxSheet: dev.sourceXlsxSheet,
          sourceXlsxRow: dev.sourceXlsxRow,
        })
      );
      deviceIdByKey.set(`${dev.stationCode || "*"}::${dev.attributes.position}`, result.node.id);
      bumpSummary(summary, "device", result.created);
      if (result.created && parentStationId) edgesCreated += 1;
    }

    for (const sig of parsed.signals) {
      const parentStationId = sig.stationCode ? stationIdByCode.get(sig.stationCode) : null;
      const channelId = sig.channelKey ? channelIdByKey.get(sig.channelKey) : null;
      const businessKey = {
        attributeMatches: [{ field: "tag", value: sig.attributes.tag }],
      };
      const result = await this.graphService.upsertNodeByBusinessKey(
        upsertOpts({
          type: "signal",
          name: sig.name,
          businessKey,
          parentNodeId: parentStationId,
          parentRelation: parentStationId ? "installed_in" : null,
          attributes: sig.attributes,
          sourceXlsxSheet: sig.sourceXlsxSheet,
          sourceXlsxRow: sig.sourceXlsxRow,
        })
      );
      bumpSummary(summary, "signal", result.created);
      if (result.created && parentStationId) edgesCreated += 1;

      if (channelId) {
        try {
          const edgeRes = await this.postgresProvider.createGraphEdge({
            sourceNodeId: result.node.id,
            targetNodeId: channelId,
            relation: "connected_to",
            attributes: {},
            confidence: 1.0,
            author,
          });
          if (edgeRes.created) edgesCreated += 1;
        } catch (err) {
          if (this.logger?.warn) this.logger.warn({ err }, "Не удалось создать связь signal→channel");
        }
      }

      const deviceTag = sig.deviceTag;
      if (deviceTag) {
        const devId = deviceIdByKey.get(`${sig.stationCode || "*"}::${deviceTag}`);
        if (devId) {
          try {
            const edgeRes = await this.postgresProvider.createGraphEdge({
              sourceNodeId: result.node.id,
              targetNodeId: devId,
              relation: "measures",
              attributes: {},
              confidence: 1.0,
              author,
            });
            if (edgeRes.created) edgesCreated += 1;
          } catch (err) {
            if (this.logger?.warn) this.logger.warn({ err }, "Не удалось создать связь signal→device");
          }
        }
      }
    }

    if (cabinetId) {
      // cabinet described_in document (опционально, для трассировки)
      try {
        // Не создаём described_in отдельным edge, чтобы не плодить шум:
        // source_document_id уже хранится на самом узле.
      } catch { /* no-op */ }
    }

    const finishedAt = new Date().toISOString();
    const report = {
      ok: true,
      profile_id: profile.id,
      summary,
      edges_created: edgesCreated,
      warnings: parsed.warnings,
      started_at: startedAt,
      finished_at: finishedAt,
    };
    if (jobId) await this.postgresProvider.updateJobGraphReport(jobId, report).catch(() => {});

    if (this.logger?.info) {
      this.logger.info(
        {
          documentId,
          profileId: profile.id,
          summary,
          edgesCreated,
          warningsCount: parsed.warnings.length,
        },
        "graph parser: завершён"
      );
    }
    return report;
  }
}
