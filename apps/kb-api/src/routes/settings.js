export async function settingsRoutes(app) {
  app.get("/settings", async () => {
    const dbSettings = await app.postgresProvider.getSettings();

    return {
      models: app.config.models,
      retrieval: app.config.retrieval,
      ingestion: app.config.ingestion,
      database: dbSettings,
    };
  });
}
