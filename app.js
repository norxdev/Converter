// app.js
const fileInput = document.getElementById("file-input");
const conversionType = document.getElementById("conversion-type");
const resultDiv = document.getElementById("result");
const processingModal = document.getElementById("processing-modal");

const WORKER_URL = "https://converter-worker.norxonics.workers.dev/";

// Supported file conversions
const conversionMap = {
  txt: ["pdf", "docx"],
  pdf: ["txt"],
  docx: ["txt", "pdf"],
};

// Update dropdown when a file is selected
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  conversionType.innerHTML = "";

  if (!file) return;

  const ext = file.name.split(".").pop().toLowerCase();

  if (conversionMap[ext]) {
    conversionMap[ext].forEach((to) => {
      const option = document.createElement("option");
      option.value = `${ext}-to-${to}`;
      option.textContent = `${ext.toUpperCase()} → ${to.toUpperCase()}`;
      conversionType.appendChild(option);
    });
  } else {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Unsupported file type";
    conversionType.appendChild(option);
  }
});

// Handle form submit
document.getElementById("upload-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = fileInput.files[0];
  const conversion = conversionType.value;

  if (!file) {
    resultDiv.textContent = "Please select a file!";
    return;
  }
  if (!conversion) {
    resultDiv.textContent = "Unsupported conversion type!";
    return;
  }

  // Show processing modal
  processingModal.style.display = "block";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("conversion", conversion);

  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error(`Status: ${res.status}`);

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    // Hide modal
    processingModal.style.display = "none";

    resultDiv.innerHTML = `
      File converted successfully!<br>
      <a href="${url}" download="converted.${conversion.split("-to-")[1]}">
        Download Converted File
      </a>
    `;
  } catch (err) {
    processingModal.style.display = "none";
    resultDiv.textContent = `Conversion failed: ${err.message}`;
  }
});
