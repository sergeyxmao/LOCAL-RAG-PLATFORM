import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const TESSERACT_TIMEOUT_MS = 30000;
const PDFTOPPM_TIMEOUT_MS = 60000;
const DEFAULT_LANGS = "rus+eng";
const DEFAULT_DPI = 200;

function spawnPromise(cmd, args, { timeoutMs, input } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let timer = null;
    let timedOut = false;
    if (timeoutMs) {
      timer = setTimeout(() => {
        timedOut = true;
        try { child.kill("SIGKILL"); } catch (err) { /* ignore */ }
      }, timeoutMs);
    }
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", (error) => {
      if (timer) clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      if (timer) clearTimeout(timer);
      if (timedOut) {
        const err = new Error(`${cmd} timeout`);
        err.code = "TIMEOUT";
        return reject(err);
      }
      if (code !== 0) {
        const err = new Error(`${cmd} exited with ${code}: ${stderr.trim()}`);
        err.code = "EXIT";
        err.exitCode = code;
        return reject(err);
      }
      resolve({ stdout, stderr });
    });
    if (input) {
      child.stdin.end(input);
    } else {
      child.stdin.end();
    }
  });
}

export class OcrService {
  constructor({ logger, config = {} } = {}) {
    this.logger = logger || console;
    this.langs = config.langs || DEFAULT_LANGS;
    this.dpi = Number(config.dpi || DEFAULT_DPI);
    this.tesseractTimeoutMs = Number(config.tesseractTimeoutMs || TESSERACT_TIMEOUT_MS);
    this.pdftoppmTimeoutMs = Number(config.pdftoppmTimeoutMs || PDFTOPPM_TIMEOUT_MS);
    this._availability = null;
  }

  async isAvailable() {
    if (this._availability !== null) return this._availability;
    try {
      await spawnPromise("tesseract", ["--version"], { timeoutMs: 5000 });
      await spawnPromise("pdftoppm", ["-v"], { timeoutMs: 5000 }).catch((error) => {
        // pdftoppm -v exits with non-zero on some versions but prints version
        if (error.exitCode === 99 || error.exitCode === 1) return;
        throw error;
      });
      this._availability = true;
    } catch (error) {
      this.logger.warn({ err: error.message }, "OCR tools unavailable (tesseract/pdftoppm)");
      this._availability = false;
    }
    return this._availability;
  }

  async ocrPdfPages(pdfPath, pageNumbers, { onProgress } = {}) {
    if (!Array.isArray(pageNumbers) || pageNumbers.length === 0) return new Map();
    const ok = await this.isAvailable();
    if (!ok) return new Map();

    const workdir = await fs.mkdtemp(path.join(os.tmpdir(), "kb-ocr-"));
    const results = new Map();
    try {
      let processed = 0;
      for (const pageNumber of pageNumbers) {
        try {
          if (typeof onProgress === "function") {
            onProgress({ processed, total: pageNumbers.length, page: pageNumber });
          }
          const prefix = path.join(workdir, `page-${pageNumber}`);
          await spawnPromise(
            "pdftoppm",
            ["-r", String(this.dpi), "-png", "-f", String(pageNumber), "-l", String(pageNumber), pdfPath, prefix],
            { timeoutMs: this.pdftoppmTimeoutMs }
          );
          const files = await fs.readdir(workdir);
          const generated = files
            .filter((name) => name.startsWith(`page-${pageNumber}`) && name.endsWith(".png"))
            .map((name) => path.join(workdir, name));
          if (generated.length === 0) {
            this.logger.warn({ pageNumber }, "OCR: pdftoppm did not produce PNG");
            continue;
          }
          const imagePath = generated[0];
          const { stdout } = await spawnPromise(
            "tesseract",
            [imagePath, "-", "-l", this.langs, "--psm", "6"],
            { timeoutMs: this.tesseractTimeoutMs }
          );
          const text = String(stdout || "").trim();
          if (text) results.set(pageNumber, text);
          await fs.unlink(imagePath).catch(() => {});
        } catch (error) {
          this.logger.warn({ pageNumber, err: error.message, code: error.code }, "OCR: page processing failed");
        } finally {
          processed += 1;
        }
      }
    } finally {
      try { await fs.rm(workdir, { recursive: true, force: true }); } catch (err) { /* ignore */ }
    }
    return results;
  }
}
