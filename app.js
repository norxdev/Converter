document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("upload-form");
  const fileInput = document.getElementById("file-input");
  const fromSelect = document.getElementById("from");
  const toSelect = document.getElementById("to");
  const statusEl = document.getElementById("result");

  if (!form || !fileInput || !fromSelect || !toSelect || !statusEl) {
    console.error("One or more required DOM elements are missing", {
      form,
      fileInput,
      fromSelect,
      toSelect,
      statusEl
    });
    return;
  }

  const SUPPORTED = {
    txt: ["pdf"]
  };

  function setStatus(msg) {
    statusEl.textContent = msg;
  }

  function isSupported(from, to) {
    return SUPPORTED[from]?.includes(to);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("");

    const file = fileInput.files[0];
    const from = fromSelect.value;
    const to = toSelect.value;

    if (!file) {
      setStatus("Please select a file.");
      return;
    }

    if (!isSupported(from, to)) {
      setStatus("Unsupported conversion.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("from", from);
    formData.append("to", to);

    try {
      setStatus("Converting…");

      const res = await fetch("/", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Conversion failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "converted.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
      setStatus("Conversion complete!");
    } catch (err) {
      console.error(err);
      setStatus(err.message || "Conversion failed.");
    }
  });
});
