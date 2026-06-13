// Статические ассеты UI v2: CSS/JS страниц вынесены из inline-строк роутов
// в src/assets/uiV2/ (см. uiV2*.js), vendor-скрипты (marked, dompurify)
// отдаются из node_modules вместо инжекции в HTML каждой загрузки чата.
// Без новых зависимостей: fs + ETag/304, кэш в памяти с проверкой mtime.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_ROOT = path.resolve(__dirname, "..", "assets");
const APP_ROOT = path.resolve(__dirname, "..", "..");

// Vendor-файлы перечислены явно — произвольные пути в node_modules недоступны.
const VENDOR_FILES = {
  "marked.min.js": path.join(APP_ROOT, "node_modules", "marked", "marked.min.js"),
  "purify.min.js": path.join(APP_ROOT, "node_modules", "dompurify", "dist", "purify.min.js"),
};

const MIME_BY_EXT = {
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
};

const SAFE_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

const fileCache = new Map(); // fullPath -> { mtimeMs, content, etag }

function loadFile(fullPath) {
  const stat = fs.statSync(fullPath);
  const cached = fileCache.get(fullPath);
  if (cached && cached.mtimeMs === stat.mtimeMs) {
    return cached;
  }
  const content = fs.readFileSync(fullPath);
  const etag = `"${crypto.createHash("sha1").update(content).digest("hex")}"`;
  const entry = { mtimeMs: stat.mtimeMs, content, etag };
  fileCache.set(fullPath, entry);
  return entry;
}

function serveFile(request, reply, fullPath, cacheControl) {
  let entry;
  try {
    entry = loadFile(fullPath);
  } catch (error) {
    reply.code(404);
    return { ok: false, error: "Файл не найден" };
  }

  reply.header("ETag", entry.etag);
  reply.header("Cache-Control", cacheControl);
  if (request.headers["if-none-match"] === entry.etag) {
    reply.code(304);
    return reply.send();
  }
  const ext = path.extname(fullPath).toLowerCase();
  reply.header("Content-Type", MIME_BY_EXT[ext] ?? "application/octet-stream");
  return reply.send(entry.content);
}

export async function uiAssetRoutes(app) {
  app.get("/ui/assets/uiV2/:file", async (request, reply) => {
    const file = String(request.params.file ?? "");
    if (!SAFE_NAME_RE.test(file)) {
      reply.code(400);
      return { ok: false, error: "Некорректное имя файла" };
    }
    // no-cache = браузер всегда ревалидирует по ETag (304 — копейки на
    // localhost), зато после обновления контейнера стили свежие сразу.
    return serveFile(request, reply, path.join(ASSETS_ROOT, "uiV2", file), "no-cache");
  });

  app.get("/ui/assets/fonts/:file", async (request, reply) => {
    const file = String(request.params.file ?? "");
    if (!SAFE_NAME_RE.test(file)) {
      reply.code(400);
      return { ok: false, error: "Некорректное имя файла" };
    }
    return serveFile(
      request,
      reply,
      path.join(ASSETS_ROOT, "fonts", file),
      "public, max-age=604800, immutable"
    );
  });

  app.get("/ui/assets/vendor/:file", async (request, reply) => {
    const file = String(request.params.file ?? "");
    const fullPath = VENDOR_FILES[file];
    if (!fullPath) {
      reply.code(404);
      return { ok: false, error: "Файл не найден" };
    }
    return serveFile(request, reply, fullPath, "public, max-age=86400");
  });
}
