const fileInput = document.getElementById("file-input");
const conversionType = document.getElementById("conversion-type");
const uploadForm = document.getElementById("upload-form");
const modal = document.getElementById("processing-modal");
const modalStatus = document.getElementById("modal-status");

const conversionMap = {
  'txt': ['pdf', 'docx'],
  'md': ['pdf', 'docx'],
  'csv': ['pdf', 'docx']
};

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const ext = file.name.split('.').pop().toLowerCase();
  conversionType.innerHTML = '';

  if (conversionMap[ext]) {
    conversionMap[ext].forEach(target => {
      const option = document.createElement('option');
      option.value = `${ext}-to-${target}`;
      option.textContent = `${ext.toUpperCase()} → ${target.toUpperCase()}`;
      conversionType.appendChild(option);
    });
  } else {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Unsupported file type';
    conversionType.appendChild(option);
  }
});

uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = fileInput.files[0];
  const conversion = conversionType.value;
  if (!file || !conversion) return alert("Please select a valid file and conversion type.");

  modal.style.display = "block";
  modalStatus.textContent = `Converting "${file.name}" to ${conversion.split('-to-')[1].toUpperCase()}...`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("conversion", conversion);

  try {
    const response = await fetch("https://converter-worker.norxonics.workers.dev/", {
      method: "POST",
      body: formData
    });

    if (!response.ok) throw new Error("Conversion failed");

    const blob = await response.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `converted-file.${conversion.split('-to-')[1]}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    alert("Conversion failed: " + err.message);
  } finally {
    modal.style.display = "none";
  }
});
