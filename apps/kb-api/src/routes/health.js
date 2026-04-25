export async function healthRoutes(app) {
  app.get("/health", async () => {
    return {
      ok: true,
      service: "kb-api",
      time: new Date().toISOString(),
    };
  });
}
