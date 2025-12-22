export default {
  async fetch(request) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    try {
      // Only allow POST
      if (request.method !== "POST") {
        return new Response("Method Not Allowed", {
          status: 405,
          headers: cors,
        });
      }

      const contentType = request.headers.get("content-type") || "";
      if (!contentType.includes("multipart/form-data")) {
        return new Response("Invalid content type", {
          status: 400,
          headers: cors,
        });
      }

      const formData = await request.formData();
      const file = formData.get("file");
      const target = formData.get("target");

      if (!file || !target) {
        return new Response("Missing file or target", {
          status: 400,
          headers: cors,
        });
      }

      // Enforce 10MB limit
      if (file.size > 10 * 1024 * 1024) {
        return new Response("File too large", {
          status: 413,
          headers: cors,
        });
      }

      // ✅ TXT output: decode as UTF-8 text
      if (target === "txt") {
        const text = await file.text();

        return new Response(text, {
          headers: {
            ...cors,
            "Content-Type": "text/plain; charset=utf-8",
            "Content-Disposition": 'attachment; filename="converted.txt"',
          },
        });
      }

      // ✅ All other formats: return binary
      const buffer = await file.arrayBuffer();

      return new Response(buffer, {
        headers: {
          ...cors,
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="converted.${target}"`,
        },
      });

    } catch (err) {
      return new Response("Worker error", {
        status: 500,
        headers: cors,
      });
    }
  }
};
