import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.19.0';
import * as pdfjsLib from 'https://esm.sh/pdfjs-dist@3.12.100/legacy/build/pdf.js';
import mammoth from 'https://esm.sh/mammoth@1.4.17';
import JSZip from 'https://esm.sh/jszip@3.11.0';

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    try {
      const formData = await request.formData();
      const file = formData.get('file');
      const type = formData.get('type');

      if (!file || !type) {
        return new Response('Missing file or type', { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const filenameBase = file.name.replace(/\.[^/.]+$/, '');
      let resultBuffer, contentType, filename;

      switch (type) {
        case 'txt-to-pdf':
          resultBuffer = await txtToPDF(arrayBuffer);
          contentType = 'application/pdf';
          filename = `${filenameBase}.pdf`;
          break;
        case 'txt-to-docx':
          resultBuffer = await txtToDOCX(arrayBuffer);
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          filename = `${filenameBase}.docx`;
          break;
        case 'pdf-to-txt':
          resultBuffer = await pdfToTXT(arrayBuffer);
          contentType = 'text/plain';
          filename = `${filenameBase}.txt`;
          break;
        case 'pdf-to-jpg':
          resultBuffer = await pdfToJPGZip(arrayBuffer);
          contentType = 'application/zip';
          filename = `${filenameBase}.zip`;
          break;
        default:
          return new Response('Unsupported conversion type', { status: 400 });
      }

      return new Response(resultBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Access-Control-Allow-Origin': '*',
        },
      });

    } catch (err) {
      return new Response('Conversion failed: ' + err.message, { status: 500 });
    }
  },
};

// --- Conversion Functions ---
async function txtToPDF(arrayBuffer) {
  const text = new TextDecoder().decode(arrayBuffer);
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  page.drawText(text, { x: 50, y: 700, size: 24, font, color: rgb(0, 0, 0) });
  return await pdfDoc.save();
}

async function txtToDOCX(arrayBuffer) {
  const text = new TextDecoder().decode(arrayBuffer);
  const contentXml = `
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>${text}</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>
  `.trim();
  return new TextEncoder().encode(contentXml);
}

async function pdfToTXT(arrayBuffer) {
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }
  return new TextEncoder().encode(fullText);
}

async function pdfToJPGZip(arrayBuffer) {
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const zip = new JSZip();

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = new OffscreenCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');
    await page.render({ canvasContext: context, viewport }).promise;
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.95 });
    const arrayBuffer = await blob.arrayBuffer();
    zip.file(`page-${i}.jpg`, arrayBuffer);
  }

  return await zip.generateAsync({ type: 'uint8array' });
}
