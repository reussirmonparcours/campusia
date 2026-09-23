import { extractTextFromPdf } from './src/lib/rag/extractor';

async function run() {
  console.log("Creating dummy PDF buffer...");
  // Minimal valid PDF (1 page, empty text)
  const dummyPdf = Buffer.from(
    "%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%EOF",
    "binary"
  );
  
  try {
    const result = await extractTextFromPdf(dummyPdf);
    console.log("Success:", result);
  } catch (error: any) {
    if (error.message.includes("DOMMatrix")) {
      console.error("FAIL: DOMMatrix error found:", error.message);
      process.exit(1);
    } else if (error.message.includes("NO_EXTRACTABLE_TEXT") || error.message.includes("extraction") || error.message.includes("PDF")) {
      console.log("PASS: Handled empty/dummy PDF correctly without DOMMatrix crash. Error:", error.message);
    } else {
      console.error("Unknown error:", error.message);
    }
  }
}

run();
