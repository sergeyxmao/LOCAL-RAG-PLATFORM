export async function askRoutes(app) {
  app.post("/ask", async (request, reply) => {
    try {
      const body = request.body ?? {};
      if (!body.question) {
        reply.code(400);
        return {
          ok: false,
          error: "Нужно передать вопрос",
        };
      }

      const result = await app.answerService.answerQuestion(body.question, {
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

  app.post("/ask/pages", async (request, reply) => {
    try {
      const body = request.body ?? {};
      if (!body.question) {
        reply.code(400);
        return {
          ok: false,
          error: "Нужно передать вопрос",
        };
      }

      const result = await app.answerService.answerQuestion(body.question, {
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
