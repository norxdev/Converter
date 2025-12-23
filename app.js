document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("upload-form");
  const fileInput = document.getElementById("file-input");
  const typeSelect = document.getElementById("conversion-type");
  const modal = document.getElementById("processing-modal");
  const modalStatus = document.getElementById("modal-status");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!fileInput.files[0]) return;

    const file = fileInput.files[0];
    // Auto-detect file type
    const ext = file.name.split(".").pop().toLowerCase();
    typeSelect.innerHTML = "";

    if (ext === "txt") {
      typeSelect.innerHTML = `
        <option value="txt-to-pdf">TXT → PDF</option>
        <option value="txt-to-docx">TXT → DOCX</option>
      `;
    } else if (ext === "docx") {
      typeSelect.innerHTML = `
        <option value="docx-to-txt">DOCX → TXT</option>
      `;
    } else {
      typeSelect.innerHTML = `<option value="">Unsupported file</option>`;
    }

    modal.classList.remove("hidden");
    modalStatus.textContent = "Processing...";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", typeSelect.value);

    try {
      const response = await fetch("https://converter-worker.norxonics.workers.dev", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Conversion failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.[^/.]+$/, "") + "." + typeSelect.value.split("-").pop();
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      modalStatus.textContent = "Done!";
      setTimeout(() => modal.classList.add("hidden"), 1000);
    } catch (err) {
      modalStatus.textContent = "Conversion failed: " + err.message;
      setTimeout(() => modal.classList.add("hidden"), 2000);
    }
  });
});
