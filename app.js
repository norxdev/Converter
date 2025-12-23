const form = document.getElementById("upload-form");
const fileInput = document.getElementById("file-input");
const typeSelect = document.getElementById("conversion-type");
const modal = document.getElementById("processing-modal");
const modalStatus = document.getElementById("modal-status");
const convertBtn = document.getElementById("convert-btn");

// Map of supported conversions
const conversionMap = {
  txt: ["pdf"],
  pdf: ["txt", "png"],
  docx: ["pdf", "txt"],
  png: ["jpg"],
  jpg: ["png"]
};

// Detect file type from extension
function getFileType(file) {
  return file.name.split(".").pop().toLowerCase();
}

// Update dropdown dynamically
fileInput.addEventListener("change", () => {
  typeSelect.innerHTML = '<option value="">Select output format</option>';
  typeSelect.disabled = true;
  convertBtn.disabled = true;

  if (!fileInput.files[0]) return;

  const sourceType = getFileType(fileInput.files[0]);
  const targets = conversionMap[sourceType];

  if (!targets) {
    alert("Unsupported file type");
    return;
  }

  targets.forEach(t => {
    const option = document.createElement("option");
    option.value = t;
    option.textContent = t.toUpperCase();
    typeSelect.appendChild(option);
  });

  typeSelect.disabled = false;
  convertBtn.disabled = false;
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = fileInput.files[0];
  const type = typeSelect.value;
  if (!file || !type) return;

  modal.classList.remove("hidden");
  modalStatus.textContent = "Processing...";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);

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
    a.download = file.name.replace(/\.[^/.]+$/, "") + "." + type;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
    modalStatus.textContent = "Done!";
    setTimeout(() => modal.classList.add("hidden"), 1000);
  } catch (err) {
    modalStatus.textContent = "Error: " + err.message;
    setTimeout(() => modal.classList.add("hidden"), 2000);
  }
});
