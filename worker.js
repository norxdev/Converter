export async function onRequestPost({ request }) {
  const formData = await request.formData();
  const file = formData.get("file");
  const conversion = formData.get("conversion");

  if (!file || !conversion) return new Response("Invalid request", { status: 400 });

  const text = await file.text();
  const [fromExt, toExt] = conversion.split("-to-");

  let content, mime, filename;

  if (toExt === "pdf") {
    // Minimal PDF creation
    const encoder = new TextEncoder();
    const pdfText = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length ${text.length + 50} >>
stream
BT
/F1 24 Tf
100 700 Td
(${text}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000110 00000 n 
0000000160 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
300
%%EOF`;

    content = encoder.encode(pdfText);
    mime = "application/pdf";
    filename = "converted.pdf";
  } else if (toExt === "docx") {
    const encoder = new TextEncoder();
    const docxText = `PK\x03\x04...${text}`; // Placeholder minimal DOCX
    content = encoder.encode(docxText);
    mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    filename = "converted.docx";
  } else {
    content = new TextEncoder().encode(text);
    mime = "text/plain";
    filename = `converted.${toExt}`;
  }

  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

// Optional CORS preflight handler
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
