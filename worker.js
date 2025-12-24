export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const target = formData.get("target");

    if (!file || !target) {
      return new Response("Missing file or target", { status: 400 });
    }

    const name = file.name.toLowerCase();

    /* ======================================================
       TXT → PDF (VALID, VIEWABLE PDF)
    ====================================================== */
    if (name.endsWith(".txt") && target === "pdf") {
      let text = await file.text();

      // Normalize text
      text = text
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/[^\x09\x0A\x20-\x7E]/g, "");

      const lines = text.split("\n").slice(0, 50);

      let textStream = "BT\n/F1 12 Tf\n72 720 Td\n";

      for (const line of lines) {
        const escaped = line
          .replace(/\\/g, "\\\\")
          .replace(/\(/g, "\\(")
          .replace(/\)/g, "\\)");

        textStream += `(${escaped}) Tj\n0 -14 Td\n`;
      }

      textStream += "ET";

      // Build PDF objects dynamically so offsets are correct
      const objects = [];

      objects.push(`1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj`);

      objects.push(`2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj`);

      objects.push(`3 0 obj
<< /Type /Page
   /Parent 2 0 R
   /MediaBox [0 0 612 792]
   /Contents 4 0 R
   /Resources << /Font << /F1 5 0 R >> >>
>>
endobj`);

      objects.push(`4 0 obj
<< /Length ${textStream.length} >>
stream
${textStream}
endstream
endobj`);

      objects.push(`5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj`);

      let pdf = "%PDF-1.4\n";
      const offsets = [0];

      for (const obj of objects) {
        offsets.push(pdf.length);
        pdf += obj + "\n";
      }

      const xrefStart = pdf.length;

      pdf += "xref\n";
      pdf += `0 ${offsets.length}\n`;
      pdf += "0000000000 65535 f \n";

      for (let i = 1; i < offsets.length; i++) {
        pdf += offsets[i].toString().padStart(10, "0") + " 00000 n \n";
      }

      pdf += `trailer
<< /Size ${offsets.length} /Root 1 0 R >>
startxref
${xrefStart}
%%EOF`;

      return new Response(pdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "attachment; filename=converted.pdf",
        },
      });
    }

    return new Response("Unsupported conversion", { status: 400 });
  }
};
