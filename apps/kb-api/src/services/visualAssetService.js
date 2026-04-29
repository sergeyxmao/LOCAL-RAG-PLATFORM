import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

import { pdf as pdfToImages } from "pdf-to-img";

function sanitizeBaseName(value) {
  return String(value ?? "document")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export class VisualAssetService {
  constructor({ assetRoot, options = {} }) {
    this.assetRoot = assetRoot;
    this.options = {
      enabled: options.enabled !== false,
      pdfPreviewPages: Number(options.pdf_preview_pages ?? 4),
      pdfScale: Number(options.pdf_scale ?? 2),
      ocrCommand: options.ocr_command ?? "tesseract",
      ocrLang: options.ocr_lang ?? "rus+eng",
      ocrTimeoutMs: Number(options.ocr_timeout_ms ?? 60000),
      ocrMaxChars: Number(options.ocr_max_chars ?? 12000),
    };
  }

  getDocumentAssetDir(documentId) {
    return path.join(this.assetRoot, documentId);
  }

  async saveMetadata(documentId, metadata) {
    const targetDir = this.getDocumentAssetDir(documentId);
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(
      path.join(targetDir, "assets.json"),
      JSON.stringify(metadata, null, 2),
      "utf8"
    );
  }

  async listDocumentAssets(documentId) {
    const targetDir = this.getDocumentAssetDir(documentId);
    const metadataPath = path.join(targetDir, "assets.json");

    try {
      const raw = await fs.readFile(metadataPath, "utf8");
      return JSON.parse(raw);
    } catch (error) {
      return {
        documentId,
        items: [],
      };
    }
  }

  async readAssetFile(documentId, fileName) {
    const safeName = path.basename(fileName);
    const targetPath = path.join(this.getDocumentAssetDir(documentId), safeName);
    return fs.readFile(targetPath);
  }

  async generatePdfPagePreview({ fullPath, documentId, title, pageNumber }) {
    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
      throw new Error("Номер страницы должен быть положительным целым числом");
    }

    const targetDir = this.getDocumentAssetDir(documentId);
    await fs.mkdir(targetDir, { recursive: true });

    const doc = await pdfToImages(fullPath, {
      scale: this.options.pdfScale,
    });

    const image = await doc.getPage(pageNumber);
    if (!image) {
      throw new Error(`Не удалось создать предпросмотр для страницы ${pageNumber}`);
    }

    const safeTitle = sanitizeBaseName(title);
    const fileName = `${safeTitle}-page-${String(pageNumber).padStart(3, "0")}.png`;
    const fullAssetPath = path.join(targetDir, fileName);
    await fs.writeFile(fullAssetPath, image);

    return {
      fileName,
      relativePath: path.posix.join(documentId, fileName),
      sizeBytes: image.length,
      mimeType: "image/png",
      previewAvailable: true,
    };
  }

  async runLocalOcr(imagePath, { mode = "off" } = {}) {
    const normalizedMode = String(mode ?? "off").trim().toLowerCase();
    if (!["try", "require"].includes(normalizedMode)) {
      return {
        status: "off",
        text: "",
        lang: this.options.ocrLang,
      };
    }

    const args = [imagePath, "stdout", "-l", this.options.ocrLang];
    const timeoutMs = Math.max(5000, Number(this.options.ocrTimeoutMs || 60000));
    const maxChars = Math.max(1000, Number(this.options.ocrMaxChars || 12000));

    return new Promise((resolve, reject) => {
      let stdout = "";
      let stderr = "";
      let settled = false;

      const finish = (result) => {
        if (settled) {
          return;
        }
        settled = true;
        resolve(result);
      };
      const fail = (error) => {
        if (settled) {
          return;
        }
        settled = true;
        if (normalizedMode === "require") {
          reject(error);
        } else {
          resolve({
            status: "unavailable",
            text: "",
            lang: this.options.ocrLang,
            error: error.message,
          });
        }
      };

      const child = spawn(this.options.ocrCommand, args, {
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      });

      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        fail(new Error("OCR превысил лимит времени"));
      }, timeoutMs);

      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString("utf8");
        if (stdout.length > maxChars * 2) {
          stdout = stdout.slice(0, maxChars * 2);
        }
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString("utf8");
      });
      child.on("error", (error) => {
        clearTimeout(timer);
        fail(new Error(`Команда OCR недоступна: ${error.message}`));
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        if (settled) {
          return;
        }
        if (code !== 0) {
          fail(new Error(`OCR завершился с кодом ${code}: ${stderr.trim() || "без деталей"}`));
          return;
        }

        const text = stdout.replace(/\s+\n/g, "\n").replace(/[ \t]+/g, " ").trim().slice(0, maxChars);
        finish({
          status: text ? "completed" : "empty",
          text,
          lang: this.options.ocrLang,
        });
      });
    });
  }

  async mergeMetadata(documentId, nextItems, { totalPages = null } = {}) {
    const existing = await this.listDocumentAssets(documentId);
    const byPage = new Map();

    for (const item of Array.isArray(existing.items) ? existing.items : []) {
      byPage.set(Number(item.page), item);
    }
    for (const item of nextItems) {
      byPage.set(Number(item.page), {
        ...(byPage.get(Number(item.page)) ?? {}),
        ...item,
      });
    }

    const items = Array.from(byPage.values()).sort((a, b) => Number(a.page || 0) - Number(b.page || 0));
    const metadata = {
      documentId,
      sourceType: "pdf",
      totalPages: totalPages ?? existing.totalPages ?? items.length,
      extractedPages: items.length,
      previewPages: items.filter((item) => item.previewAvailable).length,
      items,
    };

    await this.saveMetadata(documentId, metadata);
    return metadata;
  }

  async extractTargetedPdfPageAssets({
    fullPath,
    documentId,
    title,
    pageTexts = [],
    pages = [],
    createPreview = true,
    ocrMode = "off",
  }) {
    if (!this.options.enabled) {
      return {
        documentId,
        items: [],
        mode: "disabled",
      };
    }

    const normalizedPages = Array.from(
      new Set(
        (Array.isArray(pages) ? pages : [])
          .map((page) => Number(page))
          .filter((page) => Number.isInteger(page) && page > 0)
      )
    ).sort((a, b) => a - b);

    if (normalizedPages.length === 0) {
      return {
        documentId,
        items: [],
        mode: "empty-page-selection",
      };
    }

    const targetDir = this.getDocumentAssetDir(documentId);
    await fs.mkdir(targetDir, { recursive: true });

    const pageTextMap = new Map(
      (Array.isArray(pageTexts) ? pageTexts : []).map((item) => [Number(item.page), item.text])
    );
    const needsImage = createPreview === true || ["try", "require"].includes(String(ocrMode).toLowerCase());
    const doc = needsImage
      ? await pdfToImages(fullPath, {
          scale: this.options.pdfScale,
        })
      : null;
    const totalPages = Number(doc?.length ?? pageTexts.length ?? 0);
    const safeTitle = sanitizeBaseName(title);
    const items = [];

    for (const pageNumber of normalizedPages) {
      const text = pageTextMap.get(pageNumber) ?? "";
      const item = {
        type: "pdf-page-preview",
        page: pageNumber,
        title: `${title} - Страница ${pageNumber}`,
        fileName: null,
        relativePath: null,
        sizeBytes: 0,
        text,
        textExcerpt: text.slice(0, 280),
        mimeType: null,
        previewAvailable: false,
        sourceType: "pdf",
        ocrStatus: "off",
        ocrText: "",
        ocrLang: this.options.ocrLang,
      };

      if (needsImage && doc) {
        const image = await doc.getPage(pageNumber);
        if (!image) {
          item.ocrStatus = "page-render-failed";
          items.push(item);
          continue;
        }

        const fileName = `${safeTitle}-page-${String(pageNumber).padStart(3, "0")}.png`;
        const fullAssetPath = path.join(targetDir, fileName);
        await fs.writeFile(fullAssetPath, image);

        item.fileName = fileName;
        item.relativePath = path.posix.join(documentId, fileName);
        item.sizeBytes = image.length;
        item.mimeType = "image/png";
        item.previewAvailable = true;

        const ocr = await this.runLocalOcr(fullAssetPath, { mode: ocrMode });
        item.ocrStatus = ocr.status;
        item.ocrText = ocr.text;
        item.ocrLang = ocr.lang;
        item.ocrError = ocr.error;
      }

      if (item.ocrText) {
        const combinedText = [text, "OCR:", item.ocrText].filter(Boolean).join("\n\n");
        item.text = combinedText;
        item.textExcerpt = combinedText.slice(0, 280);
      }

      items.push(item);
    }

    const metadata = await this.mergeMetadata(documentId, items, { totalPages });
    return {
      ...metadata,
      items,
      mode: "targeted",
    };
  }

  async extractPdfPagePreviews({ fullPath, documentId, title, pageTexts = [] }) {
    if (!this.options.enabled) {
      return {
        documentId,
        items: [],
        mode: "disabled",
      };
    }

    const pageLimit = Math.max(0, this.options.pdfPreviewPages);
    if (pageLimit === 0) {
      return {
        documentId,
        items: [],
        mode: "skipped",
      };
    }

    const targetDir = this.getDocumentAssetDir(documentId);
    await fs.mkdir(targetDir, { recursive: true });

    const doc = await pdfToImages(fullPath, {
      scale: this.options.pdfScale,
    });

    const totalPages = Number(doc.length ?? 0);
    const pagesToExtract = Math.min(pageLimit, totalPages || pageLimit);
    const safeTitle = sanitizeBaseName(title);
    const pageTextMap = new Map(
      (Array.isArray(pageTexts) ? pageTexts : []).map((item) => [item.page, item.text])
    );
    const items = [];

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
      const text = pageTextMap.get(pageNumber) ?? "";
      const item = {
        type: "pdf-page-preview",
        page: pageNumber,
        title: `${title} - Страница ${pageNumber}`,
        fileName: null,
        relativePath: null,
        sizeBytes: 0,
        text,
        textExcerpt: text.slice(0, 280),
        mimeType: null,
        previewAvailable: false,
        sourceType: "pdf",
      };

      if (pageNumber <= pagesToExtract) {
        const image = await doc.getPage(pageNumber);
        if (image) {
          const fileName = `${safeTitle}-page-${String(pageNumber).padStart(3, "0")}.png`;
          const fullAssetPath = path.join(targetDir, fileName);
          await fs.writeFile(fullAssetPath, image);

          item.fileName = fileName;
          item.relativePath = path.posix.join(documentId, fileName);
          item.sizeBytes = image.length;
          item.mimeType = "image/png";
          item.previewAvailable = true;
        }
      }

      items.push(item);
    }

    const metadata = {
      documentId,
      sourceType: "pdf",
      totalPages,
      extractedPages: items.length,
      previewPages: items.filter((item) => item.previewAvailable).length,
      items,
    };

    await this.saveMetadata(documentId, metadata);
    return metadata;
  }
}
