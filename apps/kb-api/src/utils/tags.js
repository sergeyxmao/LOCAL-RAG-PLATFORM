const TAG_ALIASES = new Map([
  ["met-o", "metso"],
]);

const TAG_SEPARATOR_RE = /[,;\n]+/;
const MAX_TAG_LENGTH = 64;

function splitRawTagToken(value) {
  return String(value ?? "")
    .split(TAG_SEPARATOR_RE)
    .map((part) => part.trim())
    .filter(Boolean);
}

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

  const flat = Array.isArray(value)
    ? value.flatMap((item) => splitRawTagToken(item))
    : splitRawTagToken(value);

  return Array.from(
    new Map(
      flat
        .map((item) => normalizeTag(item))
        .filter((tag) => tag && tag.length <= MAX_TAG_LENGTH)
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
