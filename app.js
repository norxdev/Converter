document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("upload-form");
  const fileInput = document.getElementById("file-input");
  const typeSelect = document.getElementById("conversion-type");
  const convertButton = form.querySelector("button[type='submit']");
  const modal = document.getElementById("processing-modal");
  const modalStatus = document.getElementById("modal-status");

  // Disable initially
  typeSelect.disabled = true;
  convertButton.disabled = true;

  // File detection
  fileInput.addEventListener("change", async () => {
    if (!fileInput.files[0]) {
      typeSelect.disabled = true;
      convertButton.disabled = true;
      return;
    }

    // Detect file type (basic)
    const file = fileInput.files[0];
    let options = [];

    if (file.type === "text/plain") {
      options = ["pdf", "docx"];
    } else if (file.type === "application/pdf") {
      options = ["txt", "jpg"];
    } else if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      options = ["pdf", "txt"];
    } else {
      options = ["pdf", "docx", "txt"];
    }

    // Populate dropdown
    typeSelect.innerHTML = "";
    options.forEach((opt) => {
      const optionEl = document.createElement("option");
      optionEl.value = opt;
      optionEl.textContent = opt.toUpperCase();
      typeSelect.appendChild(optionEl);
    });

    // Enable controls
    typeSelect.disabled = false;
    convertButton.disabled = false;
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
      const response = await fetch(
        "https://converter-worker.norxonics.workers.dev",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Conversion failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download =
        fileInput.files[0].name.replace(/\.[^/.]+$/, "") +
        "." +
        typeSelect.value;
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
