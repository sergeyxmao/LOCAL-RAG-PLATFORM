import path from "node:path";

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

function headerRowMatches(workbookHeadersBySheet, requiredHeaders, sheetPattern) {
  if (!Array.isArray(requiredHeaders) || requiredHeaders.length === 0) return true;
  const normalizedRequired = requiredHeaders.map((h) => normalizeHeader(h));
  const sheetRegex = safeRegex(sheetPattern);

  for (const [sheetName, headerRows] of Object.entries(workbookHeadersBySheet)) {
    if (sheetRegex && !sheetRegex.test(sheetName)) continue;
    for (const headers of headerRows) {
      const normalized = headers.map((h) => normalizeHeader(h));
      const ok = normalizedRequired.every((req) =>
        normalized.some((h) => h.includes(req))
      );
      if (ok) return true;
    }
  }
  return false;
}

function sheetNamePatternMatches(workbookSheetNames, pattern) {
  if (!pattern) return true;
  const re = safeRegex(pattern);
  if (!re) return true;
  return workbookSheetNames.some((name) => re.test(name));
}

function requiredSheetsPresent(workbookSheetNames, required) {
  if (!Array.isArray(required) || required.length === 0) return true;
  const normalized = new Set(workbookSheetNames.map((n) => normalizeHeader(n)));
  return required.every((req) => normalized.has(normalizeHeader(req)));
}

function fileExtensionMatches(filePath, extensions) {
  if (!Array.isArray(extensions) || extensions.length === 0) return true;
  const ext = path.extname(filePath || "").toLowerCase();
  return extensions.map((e) => e.toLowerCase()).includes(ext);
}

export function matchProfile({
  profiles,
  filePath,
  workbookSheetNames,
  workbookHeadersBySheet,
}) {
  const tried = [];
  if (!Array.isArray(profiles) || profiles.length === 0) {
    return { profile: null, tried, reason: "no_profiles_configured" };
  }
  for (const profile of profiles) {
    tried.push(profile.id);
    const match = profile.match ?? {};
    if (!fileExtensionMatches(filePath, match.file_extensions)) continue;
    if (!requiredSheetsPresent(workbookSheetNames, match.required_sheets)) continue;
    if (!sheetNamePatternMatches(workbookSheetNames, match.sheet_name_pattern)) continue;
    if (!headerRowMatches(workbookHeadersBySheet, match.required_headers, match.sheet_name_pattern)) {
      continue;
    }
    return { profile, tried, reason: "matched" };
  }
  return { profile: null, tried, reason: "no_match" };
}

export const __testing = { normalizeHeader };
