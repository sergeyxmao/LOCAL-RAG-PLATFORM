const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value) {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function respondError(reply, statusCode, message) {
  reply.code(statusCode);
  return { ok: false, error: message };
}

export async function chatSessionRoutes(app) {
  app.get("/api/v2/chat/sessions", async (request, reply) => {
    try {
      const limit = Number(request.query?.limit ?? 50);
      const sessions = await app.chatSessionService.listSessions({ limit });
      return { ok: true, sessions };
    } catch (error) {
      request.log.error({ err: error }, "Не удалось получить список сессий чата");
      return respondError(reply, 500, error.message || "Не удалось получить список сессий");
    }
  });

  app.post("/api/v2/chat/sessions", async (request, reply) => {
    try {
      const body = request.body ?? {};
      const session = await app.chatSessionService.createSession({
        title: body.title,
        mode: body.mode,
        filters: body.filters,
      });
      reply.code(201);
      return { ok: true, session };
    } catch (error) {
      request.log.error({ err: error }, "Не удалось создать сессию чата");
      return respondError(reply, 500, error.message || "Не удалось создать сессию");
    }
  });

  app.get("/api/v2/chat/sessions/:id", async (request, reply) => {
    const { id } = request.params;
    if (!isUuid(id)) {
      return respondError(reply, 400, "Некорректный идентификатор сессии");
    }
    try {
      const result = await app.chatSessionService.getSessionWithMessages(id);
      if (!result) {
        return respondError(reply, 404, "Сессия чата не найдена");
      }
      return { ok: true, session: result.session, messages: result.messages };
    } catch (error) {
      request.log.error({ err: error, sessionId: id }, "Не удалось получить сессию чата");
      return respondError(reply, 500, error.message || "Не удалось получить сессию");
    }
  });

  app.patch("/api/v2/chat/sessions/:id", async (request, reply) => {
    const { id } = request.params;
    if (!isUuid(id)) {
      return respondError(reply, 400, "Некорректный идентификатор сессии");
    }
    try {
      const body = request.body ?? {};
      const updated = await app.chatSessionService.updateSession(id, {
        title: body.title,
        mode: body.mode,
        filters: body.filters,
      });
      if (!updated) {
        return respondError(reply, 404, "Сессия чата не найдена");
      }
      return { ok: true, session: updated };
    } catch (error) {
      request.log.error({ err: error, sessionId: id }, "Не удалось обновить сессию чата");
      return respondError(reply, 500, error.message || "Не удалось обновить сессию");
    }
  });

  app.delete("/api/v2/chat/sessions/:id", async (request, reply) => {
    const { id } = request.params;
    if (!isUuid(id)) {
      return respondError(reply, 400, "Некорректный идентификатор сессии");
    }
    try {
      const deleted = await app.chatSessionService.deleteSession(id);
      if (!deleted) {
        return respondError(reply, 404, "Сессия чата не найдена");
      }
      return { ok: true };
    } catch (error) {
      request.log.error({ err: error, sessionId: id }, "Не удалось удалить сессию чата");
      return respondError(reply, 500, error.message || "Не удалось удалить сессию");
    }
  });

  app.post("/api/v2/chat/sessions/:id/messages", async (request, reply) => {
    const { id } = request.params;
    if (!isUuid(id)) {
      return respondError(reply, 400, "Некорректный идентификатор сессии");
    }
    const body = request.body ?? {};
    if (!body.content || !String(body.content).trim()) {
      return respondError(reply, 400, "Сообщение не может быть пустым");
    }
    try {
      const result = await app.chatSessionService.appendUserMessageAndAnswer(
        id,
        String(body.content)
      );
      return { ok: true, ...result };
    } catch (error) {
      if (error.statusCode) {
        return respondError(reply, error.statusCode, error.message);
      }
      request.log.error(
        { err: error, sessionId: id },
        "Не удалось обработать сообщение чата"
      );
      return respondError(
        reply,
        500,
        error.message || "Не удалось обработать сообщение"
      );
    }
  });
}
