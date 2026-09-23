// @ts-ignore
if (typeof global !== "undefined" && typeof global.navigator !== "undefined" && !global.DOMMatrix) {
  // Polyfill required because pdfjs-dist used by pdf-parse incorrectly assumes it's a browser when Node exposes navigator
  // @ts-ignore
  global.DOMMatrix = class DOMMatrix {};
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require("pdf-parse");

export interface ExtractedPage {
  text: string;
  pageNumber: number | null;
}

export interface ExtractedDocument {
  pages: ExtractedPage[];
  pageCount: number;
}

/**
 * Normalizes text to avoid double spaces, weird newlines, etc.
 * Keeps structural integrity (paragraphs).
 */
export function normalizeText(text: string): string {
  let cleaned = text.replace(/\0/g, "");
  cleaned = cleaned.replace(/\n\s*\n/g, "\n\n");
  cleaned = cleaned.replace(/[ \t]+/g, " ");
  return cleaned.trim();
}

/**
 * Extracts text from a PDF Buffer.
 * Supports basic text extraction.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<ExtractedDocument> {
  const pages: ExtractedPage[] = [];

  try {
    const uint8Buffer = new Uint8Array(buffer);
    const parser = new PDFParse(uint8Buffer);
    const data = await parser.getText();
    
    for (const p of data.pages) {
      const cleanText = normalizeText(p.text);
      pages.push({ text: cleanText, pageNumber: p.num });
    }
    
    if (pages.length === 0 || pages.every(p => p.text.length === 0)) {
      throw new Error("NO_EXTRACTABLE_TEXT");
    }

    return {
      pages,
      pageCount: data.numpages
    };
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "NO_EXTRACTABLE_TEXT") {
        throw err;
    }
    throw new Error(`PDF Extraction failed: ${err.message}`);
  }
}
