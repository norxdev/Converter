const form = document.getElementById("upload-form");
const fileInput = document.getElementById("file-input");
const typeSelect = document.getElementById("conversion-type");
const modal = document.getElementById("processing-modal");
const modalStatus = document.getElementById("modal-status");

// Mapping input file type → possible conversions
const conversionMap = {
  txt: ["pdf"],
  pdf: ["txt", "png"],
  docx: ["txt", "pdf"]
};

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;
  const ext = file.name.split(".").pop().toLowerCase();
  typeSelect.innerHTML = "";
  const options = conversionMap[ext] || [];
  options.forEach(opt => {
    const el = document.createElement("option");
    el.value = opt;
    el.textContent = opt.toUpperCase();
    typeSelect.appendChild(el);
  });
});

form.addEventListener("submit", async e => {
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
      body: formData
    });

    if (!response.ok) throw new Error("Conversion failed");

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileInput.files[0].name.replace(/\.[^/.]+$/, "") + "." + typeSelect.value;
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
