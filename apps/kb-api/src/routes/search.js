import { parseTagList } from "../utils/tags.js";

function parseNumber(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseDocumentIds(value) {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseTags(value) {
  return parseTagList(value);
}

function buildSearchOptions(payload = {}, { pagesOnly = false } = {}) {
  return {
    semanticSearch: parseNumber(payload.semanticSearch),
    lexicalSearch: parseNumber(payload.lexicalSearch),
    limit: parseNumber(payload.limit),
    scope: pagesOnly ? "assets" : payload.scope,
    assetClass: payload.assetClass,
    engineeringTopic: payload.engineeringTopic,
    signalTag: payload.signalTag,
    documentId: payload.documentId,
    documentIds: parseDocumentIds(payload.documentIds),
    selectedTags: parseTags(payload.selectedTags ?? payload.tags ?? payload.categories),
    nodeId: payload.nodeId,
    includeChildren: payload.includeChildren,
  };
}

const VISUAL_ASSET_CLASSES = new Set(["scheme", "screen", "table", "signals"]);

function filterVisualItems(items, requestedAssetClass = "all", limit = 6) {
  const normalizedClass = String(requestedAssetClass ?? "all").trim();
  const source = Array.isArray(items) ? items : [];
  const filtered =
    normalizedClass && normalizedClass !== "all"
      ? source
      : source.filter((item) => VISUAL_ASSET_CLASSES.has(item.asset_class ?? item.assetClass));

  return filtered.slice(0, Math.max(1, Number(limit || 6)));
}

async function runVisualSearch(app, payload = {}) {
  const query = String(payload.query ?? payload.q ?? "").trim();
  if (!query) {
    throw Object.assign(new Error("Нужно передать поисковый запрос"), { statusCode: 400 });
  }

  const requestedLimit = parseNumber(payload.limit) ?? 6;
  const options = buildSearchOptions(payload, { pagesOnly: true });
  options.limit =
    !payload.assetClass || payload.assetClass === "all"
      ? Math.max(requestedLimit * 4, 12)
      : requestedLimit;

  const result = await app.searchService.hybridSearch(query, options);
  return {
    query,
    ...result,
    visualMode: true,
    visualClasses:
      !payload.assetClass || payload.assetClass === "all"
        ? Array.from(VISUAL_ASSET_CLASSES)
        : [payload.assetClass],
    items: filterVisualItems(result.items, payload.assetClass, requestedLimit),
  };
}

function handleSearchError(reply, error) {
  reply.code(error.statusCode ?? 500);
  return {
    ok: false,
    error: error.message,
  };
}

export async function searchRoutes(app) {
  app.get("/search", async (request, reply) => {
    try {
      const query = String(request.query?.query ?? request.query?.q ?? "").trim();
      if (!query) {
        reply.code(400);
        return {
          ok: false,
          error: "Нужно передать поисковый запрос",
        };
      }

      const result = await app.searchService.hybridSearch(
        query,
        buildSearchOptions(request.query)
      );

      return {
        ok: true,
        query,
        ...result,
      };
    } catch (error) {
      return handleSearchError(reply, error);
    }
  });

  app.post("/search", async (request, reply) => {
    try {
      const body = request.body ?? {};
      if (!body.query) {
        reply.code(400);
        return {
          ok: false,
          error: "Нужно передать поисковый запрос",
        };
      }

      const result = await app.searchService.hybridSearch(body.query, buildSearchOptions(body));
      return {
        ok: true,
        ...result,
      };
    } catch (error) {
      return handleSearchError(reply, error);
    }
  });

  app.get("/search/pages", async (request, reply) => {
    try {
      const query = String(request.query?.query ?? request.query?.q ?? "").trim();
      if (!query) {
        reply.code(400);
        return {
          ok: false,
          error: "Нужно передать поисковый запрос",
        };
      }

      const result = await app.searchService.hybridSearch(
        query,
        buildSearchOptions(request.query, { pagesOnly: true })
      );

      return {
        ok: true,
        query,
        ...result,
      };
    } catch (error) {
      return handleSearchError(reply, error);
    }
  });

  app.post("/search/pages", async (request, reply) => {
    try {
      const body = request.body ?? {};
      if (!body.query) {
        reply.code(400);
        return {
          ok: false,
          error: "Нужно передать поисковый запрос",
        };
      }

      const result = await app.searchService.hybridSearch(
        body.query,
        buildSearchOptions(body, { pagesOnly: true })
      );

      return {
        ok: true,
        ...result,
      };
    } catch (error) {
      return handleSearchError(reply, error);
    }
  });

  app.get("/search/visual", async (request, reply) => {
    try {
      const result = await runVisualSearch(app, request.query ?? {});
      return {
        ok: true,
        ...result,
      };
    } catch (error) {
      return handleSearchError(reply, error);
    }
  });

  app.post("/search/visual", async (request, reply) => {
    try {
      const result = await runVisualSearch(app, request.body ?? {});
      return {
        ok: true,
        ...result,
      };
    } catch (error) {
      return handleSearchError(reply, error);
    }
  });
}
