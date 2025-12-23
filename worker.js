import PDFDocument from "pdfkit";
import { Document, Packer, Paragraph } from "docx";

export default {
  async fetch(request) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: cors });
    }

    try {
      const formData = await request.formData();
      const file = formData.get("file");
      const target = formData.get("target");

      if (!file || !target) {
        return new Response("Missing data", { status: 400, headers: cors });
      }

      if (file.size > 10 * 1024 * 1024) {
        return new Response("File too large", { status: 413, headers: cors });
      }

      // TXT → TXT
      if (target === "txt") {
        const text = await file.text();
        return new Response(text, {
          headers: {
            ...cors,
            "Content-Type": "text/plain; charset=utf-8",
            "Content-Disposition": `attachment; filename="converted.txt"`,
          },
        });
      }

      // TXT → PDF
      if (target === "pdf") {
        const text = await file.text();
        const pdf = new PDFDocument();
        const chunks = [];

        pdf.on("data", (chunk) => chunks.push(chunk));
        pdf.on("end", () => {});

        text.split("\n").forEach(line => pdf.text(line));
        pdf.end();

        const buffer = await new Promise(resolve =>
          pdf.on("end", () => resolve(Buffer.concat(chunks)))
        );

        return new Response(buffer, {
          headers: {
            ...cors,
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="converted.pdf"`,
          },
        });
      }

      // TXT → DOCX
      if (target === "docx") {
        const text = await file.text();
        const doc = new Document({
          sections: [{
            children: text.split("\n").map(line =>
              new Paragraph(line)
            )
          }]
        });

        const buffer = await Packer.toBuffer(doc);

        return new Response(buffer, {
          headers: {
            ...cors,
            "Content-Type":
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "Content-Disposition": `attachment; filename="converted.docx"`,
          },
        });
      }

      return new Response("Unsupported conversion", {
        status: 400,
        headers: cors,
      });

    } catch (err) {
      return new Response("Worker error", {
        status: 500,
        headers: cors,
      });
    }
  }
};
