import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import mammoth from 'mammoth';

// Worker entry
export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: {"Access-Control-Allow-Origin":"*"} });
    }

    try {
      const formData = await request.formData();
      const file = formData.get("file");
      const type = formData.get("type");

      if (!file || !type) return new Response("Missing file or type", { status: 400, headers: {"Access-Control-Allow-Origin":"*"} });

      const ext = file.name.split(".").pop().toLowerCase();
      const buffer = await file.arrayBuffer();

      let output, contentType;

      // ===== Conversion routing =====
      if (ext === "txt" && type === "pdf") {
        output = await txtToPDF(buffer);
        contentType = "application/pdf";
      } else if (ext === "pdf" && type === "txt") {
        output = await pdfToTxt(buffer);
        contentType = "text/plain";
      } else if (ext === "docx" && type === "txt") {
        output = await docxToTxt(buffer);
        contentType = "text/plain";
      } else if (ext === "docx" && type === "pdf") {
        output = await docxToPDF(buffer);
        contentType = "application/pdf";
      } else if (ext === "pdf" && type === "png") {
        output = await pdfToPng(buffer);
        contentType = "image/png";
      } else {
        return new Response("Unsupported conversion", { status: 400, headers: {"Access-Control-Allow-Origin":"*"} });
      }

      return new Response(output, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="converted.${type}"`,
          "Access-Control-Allow-Origin": "*",
        },
      });

    } catch (err) {
      return new Response("Conversion failed: "+err.message, { status: 500, headers: {"Access-Control-Allow-Origin":"*"} });
    }
  }
};

// ===== Conversion Functions =====

async function txtToPDF(buffer) {
  const text = new TextDecoder().decode(buffer);
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  page.drawText(text, { x: 50, y: 750, size: 14, font, color: rgb(0,0,0) });
  return pdfDoc.save();
}

async function pdfToTxt(buffer) {
  const loadingTask = pdfjsLib.getDocument({data: buffer});
  const pdf = await loadingTask.promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    text += strings.join(" ") + "\n\n";
  }
  return new TextEncoder().encode(text);
}

async function docxToTxt(buffer) {
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return new TextEncoder().encode(result.value);
}

async function docxToPDF(buffer) {
  const txtBuffer = await docxToTxt(buffer);
  return txtToPDF(txtBuffer);
}

async function pdfToPng(buffer) {
  const loadingTask = pdfjsLib.getDocument({data: buffer});
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });

  const canvas = new OffscreenCanvas(viewport.width, viewport.height);
  const context = canvas.getContext("2d");

  const renderContext = { canvasContext: context, viewport };
  await page.render(renderContext).promise;

  const blob = await canvas.convertToBlob({ type: "image/png" });
  return await blob.arrayBuffer();
}
