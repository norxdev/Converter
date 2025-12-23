// worker.js - ES Module syntax

export default {
  async fetch(request) {
    // ===== CORS PREFLIGHT =====
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    try {
      const formData = await request.formData();
      const file = formData.get('file');
      const type = formData.get('type');

      if (!file || !type) {
        return new Response('Missing file or type', {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Optional size protection (5MB)
      if (file.size > 5 * 1024 * 1024) {
        return new Response('File too large (5MB max)', {
          status: 413,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      const arrayBuffer = await file.arrayBuffer();

      let resultBuffer;
      let contentType;
      let filename = file.name;

      // ===== MATCH FRONTEND VALUES =====
      switch (type) {
        case 'pdf':
          resultBuffer = await convertTxtToPDF(arrayBuffer);
          contentType = 'application/pdf';
          filename = filename.replace(/\.[^/.]+$/, '.pdf');
          break;

        case 'docx':
          resultBuffer = await convertTxtToDOCX(arrayBuffer);
          contentType =
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          filename = filename.replace(/\.[^/.]+$/, '.docx');
          break;

        default:
          return new Response('Unsupported conversion type', {
            status: 400,
            headers: {
              'Access-Control-Allow-Origin': '*',
            },
          });
      }

      return new Response(resultBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (err) {
      return new Response('Conversion failed: ' + err.message, {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};

// ===== SIMPLE CONVERSION FUNCTIONS =====

async function convertTxtToPDF(arrayBuffer) {
  const text = new TextDecoder().decode(arrayBuffer);

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
    '%%EOF',
  ];

  return new TextEncoder().encode(pdfLines.join('\n'));
}

async function convertTxtToDOCX(arrayBuffer) {
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
