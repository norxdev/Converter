document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("upload-form");
  const fileInput = document.getElementById("file-input");
  const typeSelect = document.getElementById("conversion-type");
  const modal = document.getElementById("processing-modal");
  const modalStatus = document.getElementById("modal-status");

  const conversionMap = {
    txt: ["pdf", "docx"],
    docx: ["txt"],
    pdf: ["txt"],
    csv: ["txt"],
    md: ["txt", "pdf"],
  };

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    // Enable dropdown and button
    typeSelect.disabled = false;
    form.querySelector("button[type='submit']").disabled = false;

    // Detect extension
    const ext = file.name.split(".").pop().toLowerCase();
    const options = conversionMap[ext] || [];

    // Populate dropdown
    typeSelect.innerHTML = "";
    options.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = opt.toUpperCase();
      typeSelect.appendChild(option);
    });

    if (options.length === 0) {
      typeSelect.disabled = true;
      form.querySelector("button[type='submit']").disabled = true;
      alert("This file type is not supported.");
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!fileInput.files[0]) return;

    modal.classList.remove("hidden");
    modalStatus.textContent = "Processing...";

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
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
      a.download =
        fileInput.files[0].name.replace(/\.[^/.]+$/, "") + "." + typeSelect.value;
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
