import fs from "node:fs/promises";
import path from "node:path";

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
