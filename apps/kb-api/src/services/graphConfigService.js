import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";
import { parseDocument, parse, isSeq, isMap } from "yaml";

const ID_REGEX = /^[a-z][a-z0-9_]*$/;
const CANONICAL_REGEX = /^[A-Za-z][A-Za-z0-9_-]*$/;
const PROFILE_DESCRIPTION_MAX = 512;
const ALIAS_DESCRIPTION_MAX = 256;
const BACKUP_KEEP = 10;
// #8.1.e: builds — открытый список строк (не enum). Конкретный набор поддержанных
// кодов хранится в БД (`graph_node_types`) + хардкоженная логика в xlsxParser.
// Неизвестные коды парсер просто игнорирует с warning "unknown_node_type".
const BUILD_CODE_REGEX = /^[a-z][a-z0-9_]*$/;

function timestampForBackup() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const pad3 = (n) => String(n).padStart(3, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "-" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    pad3(d.getUTCMilliseconds())
  );
}

function findItemIndexById(seqNode, id) {
  if (!isSeq(seqNode)) return -1;
  for (let i = 0; i < seqNode.items.length; i++) {
    const item = seqNode.items[i];
    if (isMap(item)) {
      const itemId = item.get("id");
      if (itemId === id) return i;
    } else if (item && typeof item === "object" && item.id === id) {
      return i;
    }
  }
  return -1;
}

function validateProfilePayload(profile, { existingIds = new Set(), isCreate = true } = {}) {
  const errors = [];
  if (!profile || typeof profile !== "object") {
    errors.push("Тело профиля должно быть объектом");
    return errors;
  }
  if (isCreate) {
    if (typeof profile.id !== "string" || !ID_REGEX.test(profile.id)) {
      errors.push("Поле id обязательно и должно быть snake_case латиницей (например, my_profile_1)");
    } else if (existingIds.has(profile.id)) {
      errors.push(`Профиль с id "${profile.id}" уже существует`);
    }
  } else if (profile.id !== undefined && profile.id !== null) {
    if (typeof profile.id !== "string" || !ID_REGEX.test(profile.id)) {
      errors.push("Поле id должно быть snake_case латиницей");
    }
  }
  if (profile.description !== undefined) {
    if (typeof profile.description !== "string") {
      errors.push("description должно быть строкой");
    } else if (profile.description.length > PROFILE_DESCRIPTION_MAX) {
      errors.push(`description не должно превышать ${PROFILE_DESCRIPTION_MAX} символов`);
    }
  }
  if (!profile.match || typeof profile.match !== "object") {
    errors.push("match обязателен и должен быть объектом");
  } else {
    const m = profile.match;
    const hasAny =
      (Array.isArray(m.file_extensions) && m.file_extensions.length > 0) ||
      (typeof m.sheet_name_pattern === "string" && m.sheet_name_pattern.length > 0) ||
      (Array.isArray(m.required_headers) && m.required_headers.length > 0) ||
      (Array.isArray(m.required_sheets) && m.required_sheets.length > 0);
    if (!hasAny) {
      errors.push(
        "match должен содержать хотя бы одно из: file_extensions, sheet_name_pattern, required_headers, required_sheets"
      );
    }
    if (m.sheet_name_pattern) {
      try { new RegExp(m.sheet_name_pattern); } catch (e) {
        errors.push(`match.sheet_name_pattern — некорректный regex: ${e.message}`);
      }
    }
  }
  if (profile.layout && typeof profile.layout === "object") {
    if (profile.layout.header_row !== undefined && !(Number.isInteger(profile.layout.header_row) && profile.layout.header_row >= 1)) {
      errors.push("layout.header_row должен быть положительным целым");
    }
    if (profile.layout.data_start_row !== undefined && !(Number.isInteger(profile.layout.data_start_row) && profile.layout.data_start_row >= 1)) {
      errors.push("layout.data_start_row должен быть положительным целым");
    }
  }
  if (Array.isArray(profile.builds)) {
    for (const b of profile.builds) {
      if (typeof b !== "string" || !BUILD_CODE_REGEX.test(b)) {
        errors.push(`builds содержит недопустимое значение "${b}". Код должен начинаться с буквы латиницы и содержать только латиницу, цифры и _`);
      }
    }
  } else if (profile.builds !== undefined && profile.builds !== null) {
    errors.push("builds должен быть массивом строк");
  }

  // Style: metso requires columns or per_sheet doesn't; koyo requires per_sheet.
  const hasPerSheet = profile.per_sheet && typeof profile.per_sheet === "object" && Object.keys(profile.per_sheet).length > 0;
  const hasColumns = profile.columns && typeof profile.columns === "object" && Object.keys(profile.columns).length > 0;
  if (!hasPerSheet && !hasColumns) {
    errors.push("Профиль должен содержать columns (metso-style) или per_sheet (koyo-style)");
  }

  return errors;
}

function validateAliasPayload({ canonical, description, aliases }, { existingCanonicals = new Set(), isCreate = true } = {}) {
  const errors = [];
  if (isCreate) {
    if (typeof canonical !== "string" || canonical.length === 0 || canonical.length > 64) {
      errors.push("canonical обязателен, не пустой, до 64 символов");
    } else if (!CANONICAL_REGEX.test(canonical)) {
      errors.push("canonical должен содержать только буквы латиницы, цифры, _ или -, начинаться с буквы");
    } else if (existingCanonicals.has(canonical)) {
      errors.push(`Каноническое значение "${canonical}" уже существует`);
    }
  }
  if (description !== undefined && description !== null) {
    if (typeof description !== "string") {
      errors.push("description должно быть строкой");
    } else if (description.length > ALIAS_DESCRIPTION_MAX) {
      errors.push(`description не должно превышать ${ALIAS_DESCRIPTION_MAX} символов`);
    }
  }
  if (aliases !== undefined && aliases !== null) {
    if (!Array.isArray(aliases)) {
      errors.push("aliases должен быть массивом строк");
    } else {
      for (const a of aliases) {
        if (typeof a !== "string" || a.length === 0 || a.length > 128) {
          errors.push(`Алиас "${String(a).slice(0, 30)}" должен быть непустой строкой до 128 символов`);
          break;
        }
      }
    }
  }
  return errors;
}

function profileDocToPlain(profile) {
  if (!profile) return null;
  return JSON.parse(JSON.stringify(profile));
}

export class GraphConfigService {
  constructor({ profilesPath, aliasesPath, backupDir, logger = null } = {}) {
    if (!profilesPath) throw new Error("GraphConfigService требует profilesPath");
    if (!aliasesPath) throw new Error("GraphConfigService требует aliasesPath");
    if (!backupDir) throw new Error("GraphConfigService требует backupDir");
    this.profilesPath = profilesPath;
    this.aliasesPath = aliasesPath;
    this.backupDir = backupDir;
    this.logger = logger;
  }

  async _ensureBackupDir() {
    await fs.mkdir(this.backupDir, { recursive: true });
  }

  async _createBackup(filePath) {
    if (!fssync.existsSync(filePath)) return null;
    await this._ensureBackupDir();
    const fileName = path.basename(filePath);
    const ts = timestampForBackup();
    const backupName = `${fileName}.${ts}.bak`;
    const backupPath = path.join(this.backupDir, backupName);
    await fs.copyFile(filePath, backupPath);
    await this._pruneBackups(fileName);
    return backupName;
  }

  async _pruneBackups(fileName) {
    let entries;
    try {
      entries = await fs.readdir(this.backupDir);
    } catch {
      return;
    }
    const matching = entries
      .filter((n) => n.startsWith(`${fileName}.`) && n.endsWith(".bak"))
      .sort()
      .reverse();
    for (const old of matching.slice(BACKUP_KEEP)) {
      try {
        await fs.unlink(path.join(this.backupDir, old));
      } catch (err) {
        if (this.logger?.warn) this.logger.warn({ err, file: old }, "Не удалось удалить старый backup");
      }
    }
  }

  // ─── Profiles ───────────────────────────────────────────────────────────

  async readProfilesRaw() {
    if (!fssync.existsSync(this.profilesPath)) {
      return "";
    }
    return fs.readFile(this.profilesPath, "utf8");
  }

  async readProfilesDocument() {
    const raw = await this.readProfilesRaw();
    if (!raw) {
      return { raw: "", doc: parseDocument("schema_version: 1\nprofiles: []\n"), data: { profiles: [] } };
    }
    let doc;
    try {
      doc = parseDocument(raw);
    } catch (err) {
      const e = new Error(`YAML парсер не смог прочитать файл: ${err.message}`);
      e.code = "YAML_PARSE";
      throw e;
    }
    let data;
    try {
      data = doc.toJSON() ?? {};
    } catch (err) {
      const e = new Error(`Не удалось преобразовать YAML в объект: ${err.message}`);
      e.code = "YAML_PARSE";
      throw e;
    }
    if (!Array.isArray(data.profiles)) {
      const e = new Error("Невалидная структура YAML: отсутствует массив profiles");
      e.code = "YAML_STRUCTURE";
      throw e;
    }
    return { raw, doc, data };
  }

  async listProfiles() {
    const { data } = await this.readProfilesDocument();
    return data.profiles.map((p) => profileDocToPlain(p));
  }

  async getProfile(id) {
    const profiles = await this.listProfiles();
    return profiles.find((p) => p.id === id) || null;
  }

  async writeProfilesRawText(rawText) {
    const trimmed = String(rawText ?? "");
    let parsed;
    try {
      parsed = parse(trimmed);
    } catch (err) {
      const e = new Error(`Не удалось распарсить YAML: ${err.message}`);
      e.code = "YAML_PARSE";
      throw e;
    }
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.profiles)) {
      const e = new Error("Невалидная структура YAML: должен быть объект с массивом profiles");
      e.code = "YAML_STRUCTURE";
      throw e;
    }
    await this._createBackup(this.profilesPath);
    await fs.writeFile(this.profilesPath, trimmed.endsWith("\n") ? trimmed : trimmed + "\n", "utf8");
  }

  async upsertProfile(profile, { isCreate = true } = {}) {
    const { doc, data } = await this.readProfilesDocument();
    const existingIds = new Set(data.profiles.map((p) => p.id));
    const errors = validateProfilePayload(profile, { existingIds: isCreate ? existingIds : new Set(), isCreate });
    if (errors.length > 0) {
      const e = new Error(errors.join("; "));
      e.code = "VALIDATION";
      e.fieldErrors = errors;
      throw e;
    }
    const profilesNode = doc.get("profiles");
    if (!isSeq(profilesNode)) {
      // Initialize empty sequence
      doc.set("profiles", []);
    }
    const seq = doc.get("profiles");
    const idx = findItemIndexById(seq, profile.id);
    const plain = profileDocToPlain(profile);
    if (idx < 0) {
      if (!isCreate) {
        const e = new Error(`Профиль с id "${profile.id}" не найден`);
        e.code = "NOT_FOUND";
        throw e;
      }
      seq.add(plain);
    } else {
      if (isCreate) {
        const e = new Error(`Профиль с id "${profile.id}" уже существует`);
        e.code = "CONFLICT";
        throw e;
      }
      seq.set(idx, plain);
    }
    await this._createBackup(this.profilesPath);
    await fs.writeFile(this.profilesPath, doc.toString(), "utf8");
    return plain;
  }

  async deleteProfile(id) {
    const { doc, data } = await this.readProfilesDocument();
    const exists = data.profiles.some((p) => p.id === id);
    if (!exists) {
      const e = new Error(`Профиль с id "${id}" не найден`);
      e.code = "NOT_FOUND";
      throw e;
    }
    const seq = doc.get("profiles");
    const idx = findItemIndexById(seq, id);
    if (idx >= 0) seq.delete(idx);
    await this._createBackup(this.profilesPath);
    await fs.writeFile(this.profilesPath, doc.toString(), "utf8");
    return { id };
  }

  // ─── Aliases ────────────────────────────────────────────────────────────

  async readAliasesRaw() {
    if (!fssync.existsSync(this.aliasesPath)) return "";
    return fs.readFile(this.aliasesPath, "utf8");
  }

  async readAliasesDocument() {
    const raw = await this.readAliasesRaw();
    if (!raw) {
      return {
        raw: "",
        doc: parseDocument("schema_version: 1\nsignal_kind: {}\n"),
        data: { signal_kind: {} },
      };
    }
    let doc;
    try {
      doc = parseDocument(raw);
    } catch (err) {
      const e = new Error(`YAML парсер не смог прочитать файл: ${err.message}`);
      e.code = "YAML_PARSE";
      throw e;
    }
    let data;
    try {
      data = doc.toJSON() ?? {};
    } catch (err) {
      const e = new Error(`Не удалось преобразовать YAML в объект: ${err.message}`);
      e.code = "YAML_PARSE";
      throw e;
    }
    if (!data.signal_kind || typeof data.signal_kind !== "object") {
      const e = new Error("Невалидная структура YAML: отсутствует объект signal_kind");
      e.code = "YAML_STRUCTURE";
      throw e;
    }
    return { raw, doc, data };
  }

  async listAliases() {
    const { data } = await this.readAliasesDocument();
    const result = {};
    for (const [k, v] of Object.entries(data.signal_kind || {})) {
      result[k] = {
        description: v?.description ?? "",
        aliases: Array.isArray(v?.aliases) ? v.aliases.slice() : [],
      };
    }
    return result;
  }

  async writeAliasesRawText(rawText) {
    const trimmed = String(rawText ?? "");
    let parsed;
    try {
      parsed = parse(trimmed);
    } catch (err) {
      const e = new Error(`Не удалось распарсить YAML: ${err.message}`);
      e.code = "YAML_PARSE";
      throw e;
    }
    if (!parsed || typeof parsed !== "object" || !parsed.signal_kind || typeof parsed.signal_kind !== "object") {
      const e = new Error("Невалидная структура YAML: должен быть объект с полем signal_kind");
      e.code = "YAML_STRUCTURE";
      throw e;
    }
    await this._createBackup(this.aliasesPath);
    await fs.writeFile(this.aliasesPath, trimmed.endsWith("\n") ? trimmed : trimmed + "\n", "utf8");
  }

  async upsertAlias({ canonical, description, aliases }, { isCreate = true } = {}) {
    const { doc, data } = await this.readAliasesDocument();
    const existingCanonicals = new Set(Object.keys(data.signal_kind || {}));
    const errors = validateAliasPayload(
      { canonical, description, aliases },
      { existingCanonicals: isCreate ? existingCanonicals : new Set(), isCreate }
    );
    if (errors.length > 0) {
      const e = new Error(errors.join("; "));
      e.code = "VALIDATION";
      e.fieldErrors = errors;
      throw e;
    }
    const exists = existingCanonicals.has(canonical);
    if (isCreate && exists) {
      const e = new Error(`Каноническое значение "${canonical}" уже существует`);
      e.code = "CONFLICT";
      throw e;
    }
    if (!isCreate && !exists) {
      const e = new Error(`Каноническое значение "${canonical}" не найдено`);
      e.code = "NOT_FOUND";
      throw e;
    }
    let signalKindMap = doc.get("signal_kind");
    if (!isMap(signalKindMap)) {
      doc.set("signal_kind", {});
      signalKindMap = doc.get("signal_kind");
    }
    const value = {
      description: description ?? (data.signal_kind?.[canonical]?.description ?? ""),
      aliases: Array.isArray(aliases) ? aliases : (data.signal_kind?.[canonical]?.aliases ?? []),
    };
    signalKindMap.set(canonical, value);
    await this._createBackup(this.aliasesPath);
    await fs.writeFile(this.aliasesPath, doc.toString(), "utf8");
    return { canonical, ...value };
  }

  async deleteAlias(canonical) {
    const { doc, data } = await this.readAliasesDocument();
    if (!data.signal_kind || !(canonical in data.signal_kind)) {
      const e = new Error(`Каноническое значение "${canonical}" не найдено`);
      e.code = "NOT_FOUND";
      throw e;
    }
    const map = doc.get("signal_kind");
    if (isMap(map)) {
      map.delete(canonical);
    }
    await this._createBackup(this.aliasesPath);
    await fs.writeFile(this.aliasesPath, doc.toString(), "utf8");
    return { canonical };
  }

  // ─── Validation helpers exposed ─────────────────────────────────────────

  async validateProfilesYamlText(rawText) {
    try {
      const parsed = parse(rawText);
      if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.profiles)) {
        return { ok: false, error: "Должен быть объект с массивом profiles" };
      }
      return { ok: true, profilesCount: parsed.profiles.length };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async validateAliasesYamlText(rawText) {
    try {
      const parsed = parse(rawText);
      if (!parsed || typeof parsed !== "object" || !parsed.signal_kind || typeof parsed.signal_kind !== "object") {
        return { ok: false, error: "Должен быть объект с полем signal_kind" };
      }
      return { ok: true, count: Object.keys(parsed.signal_kind).length };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }
}

export const __testing = {
  validateProfilePayload,
  validateAliasPayload,
  findItemIndexById,
  timestampForBackup,
};
