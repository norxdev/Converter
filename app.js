document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("upload-form");
  const fileInput = document.getElementById("file-input");
  const conversionSelect = document.getElementById("conversion-type");
  const resultEl = document.getElementById("result");

  if (!form || !fileInput || !conversionSelect || !resultEl) {
    console.error("Missing required DOM elements");
    return;
  }

  const conversionMap = {
    txt: ["pdf"],
    pdf: ["txt"],
  };

  function setResult(msg) {
    if (resultEl) {
      resultEl.textContent = msg;
    }
  }

  // Populate conversions when file is selected
  fileInput.addEventListener("change", () => {
    conversionSelect.innerHTML = "";

    const file = fileInput.files[0];
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();

    if (!conversionMap[ext]) {
      const opt = document.createElement("option");
      opt.textContent = "Unsupported file type";
      opt.value = "";
      conversionSelect.appendChild(opt);
      return;
    }

    conversionMap[ext].forEach((to) => {
      const opt = document.createElement("option");
      opt.value = `${ext}-to-${to}`;
      opt.textContent = `${ext.toUpperCase()} → ${to.toUpperCase()}`;
      conversionSelect.appendChild(opt);
    });
  });

  // Handle submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setResult("");

    const file = fileInput.files[0];
    const conversion = conversionSelect.value;

    if (!file) {
      setResult("Please select a file.");
      return;
    }

    if (!conversion) {
      setResult("Unsupported conversion.");
      return;
    }

    const [from, to] = conversion.split("-to-");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("from", from);
    formData.append("to", to);

    try {
      setResult("Processing…");

      const res = await fetch("https://converter-worker.norxonics.workers.dev/", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Conversion failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `converted.${to}`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
      setResult("Conversion complete!");
    } catch (err) {
      console.error(err);
      setResult("Conversion failed.");
    }
  });
});
