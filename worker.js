export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return new Response("Not allowed", { status: 405 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const target = formData.get("target");

    if (!file || !target) {
      return new Response("Missing file or target", { status: 400 });
    }

    const fileName = file.name.toLowerCase();

    /* ===============================
       TXT → PDF (simple text PDF)
    =============================== */
    if (fileName.endsWith(".txt") && target === "pdf") {
      const text = await file.text();

      const pdf = `
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]
   /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >>
>>
endobj
4 0 obj
<< /Length ${text.length + 40} >>
stream
BT
/F1 12 Tf
72 720 Td
(${text.replace(/\(/g, "\\(").replace(/\)/g, "\\)")}) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
0000000010 00000 n
0000000060 00000 n
0000000117 00000 n
0000000295 00000 n
0000000435 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
520
%%EOF
`;

      return new Response(pdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "attachment; filename=converted.pdf",
        },
      });
    }

    /* ===============================
       PDF → TXT (basic text extract)
       ⚠️ Limited but works for simple PDFs
    =============================== */
    if (fileName.endsWith(".pdf") && target === "txt") {
      const buffer = await file.arrayBuffer();
      const text = new TextDecoder().decode(buffer);

      // naive text extraction
      const matches = text.match(/\(([^)]+)\)/g) || [];
      const extracted = matches
        .map(m => m.slice(1, -1))
        .join("\n");

      return new Response(extracted || "No extractable text found.", {
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": "attachment; filename=converted.txt",
        },
      });
    }

    /* ===============================
       CSV → TXT ✅ FIXED
    =============================== */
    if (fileName.endsWith(".csv") && target === "txt") {
      const csvText = await file.text(); // 🔑 THIS IS THE FIX

      // optional cleanup: normalize commas to tabs
      const normalized = csvText.replace(/,/g, "\t");

      return new Response(normalized, {
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": "attachment; filename=converted.txt",
        },
      });
    }

    /* ===============================
       MD → TXT
    =============================== */
    if (fileName.endsWith(".md") && target === "txt") {
      const md = await file.text();
      const stripped = md
        .replace(/[#>*_`]/g, "")
        .replace(/\n{2,}/g, "\n");

      return new Response(stripped, {
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": "attachment; filename=converted.txt",
        },
      });
    }

    return new Response("Unsupported conversion", { status: 400 });
  }
};
