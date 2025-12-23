const conversionMap = {
  'pdf': ['txt'],
  'txt': ['pdf', 'docx'],
  'docx': ['txt']
};

const fileInput = document.getElementById("file-input");
const conversionType = document.getElementById("conversion-type");
const resultDiv = document.getElementById("result");
const processingModal = document.getElementById("processing-modal");

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
    conversionType.innerHTML = '<option value="">Unsupported file type</option>';
  }
});

document.getElementById("upload-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = fileInput.files[0];
  const conversion = conversionType.value;
  if (!file || !conversion) {
    resultDiv.textContent = "Please select a file and conversion type!";
    return;
  }

  processingModal.style.display = "flex";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("conversion", conversion);

  try {
    const res = await fetch("https://converter-worker.norxonics.workers.dev", {
      method: "POST",
      body: formData
    });

    if (!res.ok) throw new Error(`Server returned ${res.status}`);

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ext = conversion.split("-to-")[1];
    a.download = `converted-file.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    resultDiv.textContent = "Conversion successful!";
  } catch (err) {
    console.error(err);
    resultDiv.textContent = "Conversion failed: " + err.message;
  } finally {
    processingModal.style.display = "none";
  }
});
