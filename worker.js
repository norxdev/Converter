import JSZip from "jszip";

export default {
  async fetch(request) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    try {
      const formData = await request.formData();
      const file = formData.get("file");
      const type = formData.get("type");

      if (!file || !type) {
        return new Response(JSON.stringify({ error: "File or type missing" }), { status: 400, headers: corsHeaders });
      }

      const arrayBuffer = await file.arrayBuffer();
      const textContent = new TextDecoder().decode(arrayBuffer);

      let outputBuffer, filename, mime;

      if (type === "pdf") {
        const pdfBytes = generatePDF(textContent);
        outputBuffer = pdfBytes;
        filename = file.name.replace(/\.[^/.]+$/, "") + ".pdf";
        mime = "application/pdf";
      } else if (type === "docx") {
        const docxBytes = await generateDOCX(textContent);
        outputBuffer = docxBytes;
        filename = file.name.replace(/\.[^/.]+$/, "") + ".docx";
        mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      } else {
        return new Response(JSON.stringify({ error: "Unsupported type" }), { status: 400, headers: corsHeaders });
      }

      return new Response(outputBuffer, {
        headers: {
          ...corsHeaders,
          "Content-Type": mime,
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  },
};

// Minimal PDF generator
function generatePDF(text) {
  const pdfHeader = "%PDF-1.3\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  const pdfPages = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
  const pdfPage = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n`;
  const pdfContentStream = `4 0 obj\n<< /Length ${text.length + 50} >>\nstream\nBT /F1 24 Tf 50 700 Td (${text.replace(/\)/g, "\\)").replace(/\(/g, "\\(")}) Tj ET\nendstream\nendobj\n`;
  const pdfFooter = "xref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000120 00000 n \n0000000200 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n300\n%%EOF";
  const pdfString = pdfHeader + pdfPages + pdfPage + pdfContentStream + pdfFooter;
  return new TextEncoder().encode(pdfString);
}

// Minimal DOCX generator using JSZip
async function generateDOCX(text) {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/></Types>`);
  zip.file("word/document.xml", `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</w:t></w:r></w:p></w:body></w:document>`);
  zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
  return await zip.generateAsync({ type: "uint8array" });
}
