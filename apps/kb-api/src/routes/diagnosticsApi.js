export async function diagnosticsRoutes(app) {
  app.post("/api/v2/diagnostics", async (request, reply) => {
    try {
      const result = await app.diagnosticsService.runAll();
      return { ok: true, ...result };
    } catch (error) {
      request.log.error({ err: error }, "Diagnostics run failed");
      reply.code(500);
      return { ok: false, error: error.message || "Не удалось выполнить проверки" };
    }
  });
}
