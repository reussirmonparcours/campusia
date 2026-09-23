import { extractTextFromPdf } from './src/lib/rag/extractor';
import { PDFDocument, rgb } from 'pdf-lib';
import * as fs from 'fs';

async function generateTestPdf() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  page.drawText('MonParcours PDF Extraction Test\n\nIntroduction à l\'économie\n\nChapitre 1\n\nL\'économie étudie la manière dont les ressources rares sont utilisées pour satisfaire les besoins humains.', {
    x: 50,
    y: 700,
    size: 12,
    color: rgb(0, 0, 0),
  });
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('test-extract.pdf', pdfBytes);
  console.log('PDF generated at test-extract.pdf');
}

async function testExtraction() {
  await generateTestPdf();
  const buffer = fs.readFileSync('test-extract.pdf');
  try {
    const result = await extractTextFromPdf(buffer);
    console.log('Extraction PASS!');
    console.log('Page count:', result.pageCount);
    console.log('Text preview:', result.pages[0]?.text.substring(0, 100));
    console.log('Number of chunks (pages here):', result.pages.length);
  } catch (error) {
    console.error('Extraction FAIL:', error);
  }
}

testExtraction();
