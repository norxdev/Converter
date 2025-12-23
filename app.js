const fileInput = document.getElementById("file-input");
const conversionType = document.getElementById("conversion-type");
const resultDiv = document.getElementById("result");
const uploadForm = document.getElementById("upload-form");
const modal = document.getElementById("processing-modal");
const modalStatus = document.getElementById("modal-status");

// Map of supported file types
const conversionMap = {
  txt: ["pdf", "docx"],
  pdf: ["txt"],
};

// Populate conversion options
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const ext = file.name.split(".").pop().toLowerCase();
  conversionType.innerHTML = "";

  if (conversionMap[ext]) {
    conversionMap[ext].forEach((target) => {
      const option = document.createElement("option");
      option.value = `${ext}-to-${target}`;
      option.textContent = `${ext.toUpperCase()} → ${target.toUpperCase()}`;
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
uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = fileInput.files[0];
  const conversion = conversionType.value;
  if (!file || !conversion) {
    alert("Please select a file and conversion type.");
    return;
  }

  // Show processing modal
  modal.style.display = "block";
  modalStatus.textContent = `Converting ${file.name}...`;

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("conversion", conversion);

    const res = await fetch("https://converter-worker.norxonics.workers.dev", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("Conversion failed");

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `converted.${conversion.split("-to-")[1]}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert("Conversion failed: " + err.message);
  } finally {
    modal.style.display = "none";
  }
});
