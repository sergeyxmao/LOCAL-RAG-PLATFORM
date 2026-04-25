export async function searchRoutes(app) {
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

      const result = await app.searchService.hybridSearch(body.query, {
        semanticSearch: body.semanticSearch,
        lexicalSearch: body.lexicalSearch,
        limit: body.limit,
        scope: body.scope,
        assetClass: body.assetClass,
        engineeringTopic: body.engineeringTopic,
        signalTag: body.signalTag,
        documentId: body.documentId,
      });
      return {
        ok: true,
        ...result,
      };
    } catch (error) {
      reply.code(500);
      return {
        ok: false,
        error: error.message,
      };
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

      const result = await app.searchService.hybridSearch(body.query, {
        semanticSearch: body.semanticSearch,
        lexicalSearch: body.lexicalSearch,
        limit: body.limit,
        scope: "assets",
        assetClass: body.assetClass,
        engineeringTopic: body.engineeringTopic,
        signalTag: body.signalTag,
        documentId: body.documentId,
      });

      return {
        ok: true,
        ...result,
      };
    } catch (error) {
      reply.code(500);
      return {
        ok: false,
        error: error.message,
      };
    }
  });
}
