const COOKIE_NAME = "admin_mode";
const COOKIE_TTL_SECONDS = 3600;

function parseCookies(header) {
  if (!header || typeof header !== "string") return {};
  const out = {};
  header.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx < 0) return;
    const name = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (name) out[name] = decodeURIComponent(value);
  });
  return out;
}

function setAdminCookie(reply) {
  const expires = new Date(Date.now() + COOKIE_TTL_SECONDS * 1000).toUTCString();
  const value = `${COOKIE_NAME}=1; Path=/; Max-Age=${COOKIE_TTL_SECONDS}; Expires=${expires}; SameSite=Lax`;
  const existing = reply.getHeader("Set-Cookie");
  if (Array.isArray(existing)) {
    reply.header("Set-Cookie", [...existing, value]);
  } else if (existing) {
    reply.header("Set-Cookie", [existing, value]);
  } else {
    reply.header("Set-Cookie", value);
  }
}

export function hasAdminFlag(request) {
  if (request.query && String(request.query.admin || "") === "1") return true;
  const cookies = parseCookies(request.headers?.cookie);
  return cookies[COOKIE_NAME] === "1";
}

export function adminFlagPreHandler(request, reply, done) {
  if (request.query && String(request.query.admin || "") === "1") {
    setAdminCookie(reply);
    return done();
  }
  const cookies = parseCookies(request.headers?.cookie);
  if (cookies[COOKIE_NAME] === "1") {
    return done();
  }
  const wantsHtml = String(request.headers?.accept || "").includes("text/html");
  reply.code(404);
  if (wantsHtml) {
    reply.type("text/html; charset=utf-8");
    return reply.send(`<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><title>Перенесено</title>
<style>body{font-family:"Inter",system-ui,sans-serif;background:#0B1220;color:#E5E7EB;min-height:100vh;margin:0;display:flex;align-items:center;justify-content:center;padding:24px}main{max-width:520px;text-align:center}a{color:#3B82F6}h1{color:#F8FAFC;margin:0 0 12px}p{color:#94A3B8;line-height:1.5}.mono{font-family:"JetBrains Mono",ui-monospace,monospace;background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px;font-size:0.9em}</style>
</head><body><main>
<h1>Эта страница перенесена</h1>
<p>Старый интерфейс скрыт. Используйте новый дизайн на странице <a href="/ui/v2/chat">/ui/v2/chat</a>.</p>
<p style="font-size:13px">Если нужен старый интерфейс — добавьте <span class="mono">?admin=1</span> к адресу. Доступ к старому UI действует час (cookie <span class="mono">admin_mode=1</span>).</p>
</main></body></html>`);
  }
  return reply.send({
    ok: false,
    error: "Эта страница перенесена в новый интерфейс. Откройте /ui/v2/chat или добавьте ?admin=1, если нужен старый интерфейс.",
  });
}
