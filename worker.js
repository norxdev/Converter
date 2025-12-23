// worker.js - ES Module syntax
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.19.0';
import mammoth from 'https://esm.sh/mammoth@1.4.17';

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

      const filename = file.name.replace(/\.[^/.]+$/, `.${type}`);
      const arrayBuffer = await file.arrayBuffer();
      let resultBuffer;
      let contentType;

      switch (type) {
        case 'pdf':
          resultBuffer = await txtToPDF(arrayBuffer);
          contentType = 'application/pdf';
          break;
        case 'txt':
          resultBuffer = await fileToTXT(file);
          contentType = 'text/plain';
          break;
        case 'docx':
          resultBuffer = await txtToDOCX(arrayBuffer);
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
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

// Simple TXT → PDF
async function txtToPDF(arrayBuffer) {
  const text = new TextDecoder().decode(arrayBuffer);
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  page.drawText(text, { x: 50, y: height - 50, size: 14, font });
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

// TXT → DOCX
async function txtToDOCX(arrayBuffer) {
  const text = new TextDecoder().decode(arrayBuffer);
  const contentXml = `
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>${text}</w:t></w:r></w:p>
  </w:body>
</w:document>`.trim();
  return new TextEncoder().encode(contentXml);
}

// Extract text from uploaded TXT or DOCX
async function fileToTXT(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const arrayBuffer = await file.arrayBuffer();
  if (ext === 'txt') {
    return arrayBuffer;
  } else if (ext === 'docx') {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return new TextEncoder().encode(result.value);
  } else {
    return new TextEncoder().encode('Unsupported file type for TXT extraction');
  }
}
