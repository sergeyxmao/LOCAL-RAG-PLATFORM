function normalizeForCompare(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function buildSignalKindMatcher(aliasConfig) {
  const sourceMap =
    aliasConfig && typeof aliasConfig === "object" && aliasConfig.signal_kind
      ? aliasConfig.signal_kind
      : {};

  const exact = new Map();
  const prefixes = [];

  for (const [canonical, definition] of Object.entries(sourceMap)) {
    const list = Array.isArray(definition?.aliases) ? definition.aliases : [];
    for (const alias of list) {
      const norm = normalizeForCompare(alias);
      if (!norm) continue;
      if (!exact.has(norm)) {
        exact.set(norm, canonical);
      }
      prefixes.push({ prefix: norm, canonical });
    }
    const canonicalNorm = normalizeForCompare(canonical);
    if (canonicalNorm && !exact.has(canonicalNorm)) {
      exact.set(canonicalNorm, canonical);
    }
  }

  prefixes.sort((a, b) => b.prefix.length - a.prefix.length);

  return {
    normalize(raw) {
      const norm = normalizeForCompare(raw);
      if (!norm) return null;
      if (exact.has(norm)) return exact.get(norm);
      for (const { prefix, canonical } of prefixes) {
        if (norm.startsWith(prefix)) return canonical;
      }
      return null;
    },
    canonicalKinds() {
      return Array.from(new Set(exact.values()));
    },
  };
}

export const __testing = { normalizeForCompare };
