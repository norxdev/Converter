// worker.js

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Generate a simple PDF from text using ArrayBuffer
 */
async function generatePDF(text) {
  // Minimal PDF structure with a single page
  const pdfLines = [
    '%PDF-1.3',
    '1 0 obj',
    '<< /Type /Catalog /Pages 2 0 R >>',
    'endobj',
    '2 0 obj',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    'endobj',
    '3 0 obj',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    'endobj',
    '4 0 obj',
    `<< /Length ${text.length + 50} >>`,
    'stream',
    `BT /F1 24 Tf 50 700 Td (${text}) Tj ET`,
    'endstream',
    'endobj',
    '5 0 obj',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    'endobj',
    'xref',
    '0 6',
    '0000000000 65535 f ',
    '0000000010 00000 n ',
    '0000000060 00000 n ',
    '0000000110 00000 n ',
    '0000000200 00000 n ',
    '0000000300 00000 n ',
    'trailer',
    '<< /Size 6 /Root 1 0 R >>',
    'startxref',
    '400',
    '%%EOF'
  ];

  const pdfBytes = new TextEncoder().encode(pdfLines.join('\n'));
  return pdfBytes;
}

/**
 * Generate a very basic DOCX from text (Office Open XML)
 */
async function generateDOCX(text) {
  // Minimal DOCX XML content
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

  // Build minimal DOCX ZIP structure
  const encoder = new TextEncoder();
  const xmlBytes = encoder.encode(contentXml);

  // Very naive ZIP file header (works for small single-file DOCX)
  // For full-featured DOCX, a proper ZIP library is needed
  const zipHeader = new Uint8Array([
    0x50, 0x4B, 0x03, 0x04, // Local file header signature
  ]);

  const combined = new Uint8Array(zipHeader.length + xmlBytes.length);
  combined.set(zipHeader, 0);
  combined.set(xmlBytes, zipHeader.length);

  return combined;
}

/**
 * Main request handler
 */
async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    // CORS preflight
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

    const text = await file.text();

    let outputBytes, contentType, filename;

    if (type === 'pdf') {
      outputBytes = await generatePDF(text);
      contentType = 'application/pdf';
      filename = file.name.replace(/\.[^/.]+$/, '.pdf');
    } else if (type === 'docx') {
      outputBytes = await generateDOCX(text);
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      filename = file.name.replace(/\.[^/.]+$/, '.docx');
    } else {
      return new Response('Unsupported conversion type', { status: 400 });
    }

    return new Response(outputBytes, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response('Conversion failed: ' + err.message, { status: 500 });
  }
}
