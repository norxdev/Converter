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
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    try {
      const formData = await request.formData();
      const file = formData.get("file");
      const type = formData.get("type");

      if (!file || !type) {
        return new Response("Missing file or type", {
          status: 400,
          headers: { "Access-Control-Allow-Origin": "*" },
        });
      }

      const buffer = await file.arrayBuffer();
      const ext = file.name.split(".").pop().toLowerCase();

      let output;
      let contentType;

      // ROUTER
      if (ext === "txt" && type === "pdf") {
        output = await txtToPDF(buffer);
        contentType = "application/pdf";
      } else if (ext === "pdf" && type === "txt") {
        output = await pdfToTxt(buffer);
        contentType = "text/plain";
      } else {
        return new Response("Unsupported conversion", {
          status: 400,
          headers: { "Access-Control-Allow-Origin": "*" },
        });
      }

      return new Response(output, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="converted.${type}"`,
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (err) {
      return new Response("Conversion failed: " + err.message, {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }
  },
};

// === BASIC CONVERSIONS ===

async function txtToPDF(buffer) {
  const text = new TextDecoder().decode(buffer);
  return new TextEncoder().encode(`%PDF-1.3\n${text}`);
}

async function pdfToTxt(buffer) {
  // MVP placeholder (real parsing later)
  return buffer;
}
