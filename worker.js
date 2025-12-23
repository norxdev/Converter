// worker.js
import PDFDocument from "pdfkit";
import { Document, Packer, Paragraph } from "docx";
import pdfParse from "pdf-parse";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request) {
    // Handle preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    try {
      const formData = await request.formData();
      const file = formData.get("file");
      const conversion = formData.get("conversion");

      if (!file || !conversion) {
        return new Response("Missing file or conversion type", { status: 400, headers: corsHeaders });
      }

      const [from, to] = conversion.split("-to-");
      let converted;

      // Simple txt <-> pdf <-> docx simulation
      if (from === "txt" && to === "pdf") {
        const doc = new PDFDocument();
        let chunks = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => {});
        doc.text(await file.text());
        doc.end();
        converted = new Blob(chunks, { type: "application/pdf" });
      } else if (from === "txt" && to === "docx") {
        const doc = new Document({
          sections: [{ children: [new Paragraph(await file.text())] }],
        });
        const buffer = await Packer.toBuffer(doc);
        converted = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      } else if (from === "pdf" && to === "txt") {
        const arrayBuffer = await file.arrayBuffer();
        const pdfData = await pdfParse(Buffer.from(arrayBuffer));
        converted = new Blob([pdfData.text], { type: "text/plain" });
      } else {
        return new Response("Unsupported conversion type", { status: 400, headers: corsHeaders });
      }

      const arrayBuffer = await converted.arrayBuffer();
      return new Response(arrayBuffer, {
        headers: {
          ...corsHeaders,
          "Content-Type": converted.type,
        },
      });
    } catch (err) {
      return new Response("Conversion failed: " + err.message, { status: 500, headers: corsHeaders });
    }
  },
};
