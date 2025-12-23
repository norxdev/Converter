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

    const formData = await request.formData();
    const file = formData.get("file");
    const conversion = formData.get("conversion");

    if (!file || !conversion) {
      return new Response("Missing file or conversion type", { status: 400 });
    }

    // Fake conversion: just return original file bytes
    const arrayBuffer = await file.arrayBuffer();
    const outputName = file.name.split(".")[0] + "-converted." + conversion.split("-to-")[1];

    return new Response(arrayBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${outputName}"`,
        "Access-Control-Allow-Origin": "*"
      },
    });
  },
};
