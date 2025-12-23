export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const from = formData.get("from");
    const to = formData.get("to");

    if (!file || !from || !to) {
      return new Response("Missing fields", { status: 400 });
    }

    // Only supported conversion for now
    if (from !== "txt" || to !== "pdf") {
      return new Response(
        JSON.stringify({ error: "Conversion not supported yet" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const text = await file.text();

    // Escape PDF-breaking characters
    const safeText = text
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");

    // Minimal valid PDF (Workers-safe)
    const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]
/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${safeText.length + 50} >>
stream
BT
/F1 12 Tf
72 720 Td
(${safeText}) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
trailer
<< /Root 1 0 R /Size 6 >>
startxref
%%EOF`;

    return new Response(
      new Uint8Array([...pdf].map(c => c.charCodeAt(0))),
      {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "attachment; filename=converted.pdf"
        }
      }
    );
  }
};
