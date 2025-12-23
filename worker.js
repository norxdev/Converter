import { PDFDocument, StandardFonts } from "pdf-lib";
import { Document, Packer, Paragraph, TextRun } from "docx";

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    try {
      const formData = await request.formData();
      const file = formData.get("file");
      const conversion = formData.get("conversion");

      if (!file || !conversion) {
        return new Response(
          JSON.stringify({ error: "File or conversion missing" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const [fromExt, toExt] = conversion.split("-to-");

      const arrayBuffer = await file.arrayBuffer();
      let outputBuffer;
      let outputName = file.name.split(".")[0] + "." + toExt;

      // TXT → PDF
      if (fromExt === "txt" && toExt === "pdf") {
        const text = new TextDecoder().decode(arrayBuffer);
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        page.drawText(text, { x: 50, y: 700, size: 12, font });
        outputBuffer = await pdfDoc.save();
      }
      // TXT → DOCX
      else if (fromExt === "txt" && toExt === "docx") {
        const text = new TextDecoder().decode(arrayBuffer);
        const doc = new Document();
        doc.addSection({ children: [new Paragraph(text)] });
        outputBuffer = await Packer.toBuffer(doc);
      }
      // PDF → TXT
      else if (fromExt === "pdf" && toExt === "txt") {
        // Simple text extraction using pdf-lib (limited)
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        let extractedText = "";
        const pages = pdfDoc.getPages();
        for (const page of pages) {
          const { text } = page.getTextContent?.() || {};
          if (text) extractedText += text + "\n";
        }
        outputBuffer = new TextEncoder().encode(extractedText);
      } else {
        return new Response(
          JSON.stringify({ error: "Unsupported conversion" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(outputBuffer, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="${outputName}"`,
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Conversion failed", details: err.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
