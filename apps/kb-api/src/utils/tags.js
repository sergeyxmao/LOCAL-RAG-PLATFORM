const TAG_ALIASES = new Map([
  ["met-o", "metso"],
]);

export function normalizeTag(value) {
  const normalized = String(value ?? "")
    .trim()
    .replace(/^#+/, "")
    .replace(/\s+/g, "-");

  if (!normalized) {
    return "";
  }

  return TAG_ALIASES.get(normalized.toLowerCase()) ?? normalized;
}

export function normalizeTagForCompare(value) {
  return normalizeTag(value).toLowerCase();
}

export function parseTagList(value) {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  const values = Array.isArray(value) ? value : String(value).split(",");
  return Array.from(
    new Map(
      values
        .map((item) => normalizeTag(item))
        .filter(Boolean)
        .map((tag) => [tag.toLowerCase(), tag])
    ).values()
  );
}

export function tagSearchVariants(value) {
  const canonical = normalizeTag(value);
  if (!canonical) {
    return [];
  }

  const variants = new Map([[canonical.toLowerCase(), canonical]]);
  for (const [alias, target] of TAG_ALIASES.entries()) {
    if (target.toLowerCase() === canonical.toLowerCase()) {
      variants.set(alias.toLowerCase(), alias);
    }
  }

  return Array.from(variants.values());
}

export function expandTagSearchVariants(values) {
  return Array.from(
    new Map(
      parseTagList(values)
        .flatMap((tag) => tagSearchVariants(tag))
        .filter(Boolean)
        .map((tag) => [tag.toLowerCase(), tag])
    ).values()
  );
}
