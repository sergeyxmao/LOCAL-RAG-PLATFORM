import fs from "node:fs/promises";
import path from "node:path";

import mammoth from "mammoth";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import xlsx from "xlsx";

function normalizeExtractedText(text) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractPlainText(fullPath) {
  return fs.readFile(fullPath, "utf8");
}

async function extractPdfText(fullPath) {
  const buffer = await fs.readFile(fullPath);
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  });
  const pdf = await loadingTask.promise;
  const pages = [];
  const pageTexts = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (pageText) {
      pageTexts.push({
        page: pageNumber,
        text: pageText,
      });
      pages.push(`PDF Page ${pageNumber}\n${pageText}`);
    }
  }

  return {
    text: pages.join("\n\n"),
    pageTexts,
  };
}

async function extractDocxText(fullPath) {
  const buffer = await fs.readFile(fullPath);
  const result = await mammoth.extractRawText({ buffer });
  return result.value ?? "";
}

function serializeTableRows(rows, prefix = null) {
  const blocks = [];

  rows.forEach((row, rowIndex) => {
    const parts = Object.entries(row)
      .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "")
      .map(([key, value]) => `${key}: ${String(value).trim()}`);

    if (parts.length === 0) {
      return;
    }

    const header = prefix ? `${prefix} Row ${rowIndex + 1}` : `Row ${rowIndex + 1}`;
    blocks.push(`${header}\n${parts.join("\n")}`);
  });

  return blocks.join("\n\n");
}

function buildTableRowChunks(rows, title, prefix = null) {
  const chunks = [];

  rows.forEach((row, rowIndex) => {
    const parts = Object.entries(row)
      .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "")
      .map(([key, value]) => `${key}: ${String(value).trim()}`);

    if (parts.length === 0) {
      return;
    }

    const rowHeader = prefix ? `${prefix} Row ${rowIndex + 1}` : `Row ${rowIndex + 1}`;
    const text = `${rowHeader}\n${parts.join("\n")}`;

    chunks.push({
      context: `Document: ${title}${prefix ? ` | ${prefix}` : ""}`,
      text,
    });
  });

  return chunks;
}

async function extractCsvText(fullPath) {
  const raw = await fs.readFile(fullPath, "utf8");
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return "";
  }

  const headers = lines[0].split(",").map((header) => header.trim());
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",");
    const row = {};

    headers.forEach((header, index) => {
      row[header || `column_${index + 1}`] = (values[index] ?? "").trim();
    });

    return row;
  });

  return {
    text: serializeTableRows(rows, "CSV"),
    prebuiltChunks: buildTableRowChunks(rows, path.basename(fullPath), "CSV"),
  };
}

async function extractSpreadsheetText(fullPath) {
  const workbook = xlsx.readFile(fullPath, { cellDates: true });
  const parts = [];
  const prebuiltChunks = [];

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, {
      defval: "",
      raw: false,
    });

    const block = serializeTableRows(rows, `Sheet ${sheetName}`);
    if (block) {
      parts.push(block);
    }

    prebuiltChunks.push(
      ...buildTableRowChunks(rows, path.basename(fullPath), `Sheet ${sheetName}`)
    );
  });

  return {
    text: parts.join("\n\n"),
    prebuiltChunks,
  };
}

export class ExtractorService {
  constructor({ parsedRoot }) {
    this.parsedRoot = parsedRoot;
  }

  async extractFromFile(fullPath, relativePath) {
    const extension = path.extname(fullPath).toLowerCase();

    let text = "";
    let sourceType = "file";
    let prebuiltChunks = null;
    let pageTexts = null;

    if (extension === ".txt" || extension === ".md") {
      text = await extractPlainText(fullPath);
    } else if (extension === ".pdf") {
      const extracted = await extractPdfText(fullPath);
      text = extracted.text;
      pageTexts = extracted.pageTexts;
      sourceType = "pdf";
    } else if (extension === ".docx") {
      text = await extractDocxText(fullPath);
      sourceType = "docx";
    } else if (extension === ".csv") {
      const extracted = await extractCsvText(fullPath);
      text = extracted.text;
      prebuiltChunks = extracted.prebuiltChunks;
      sourceType = "csv";
    } else if (extension === ".xlsx" || extension === ".xls") {
      const extracted = await extractSpreadsheetText(fullPath);
      text = extracted.text;
      prebuiltChunks = extracted.prebuiltChunks;
      sourceType = "spreadsheet";
    } else {
      throw new Error("Only .txt, .md, .pdf, .docx, .csv, .xlsx, and .xls are supported right now");
    }

    const normalized = normalizeExtractedText(text);
    if (!normalized) {
      throw new Error("Extractor returned empty text");
    }

    await this.saveParsedText(relativePath, normalized);

    return {
      text: normalized,
      sourceType,
      prebuiltChunks,
      pageTexts,
    };
  }

  async saveParsedText(relativePath, text) {
    const parsedRelative = `${relativePath}.parsed.txt`;
    const parsedFullPath = path.join(this.parsedRoot, parsedRelative);
    const parsedDir = path.dirname(parsedFullPath);

    await fs.mkdir(parsedDir, { recursive: true });
    await fs.writeFile(parsedFullPath, text, "utf8");
  }
}
