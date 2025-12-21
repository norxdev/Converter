const conversionMap = {
  'pdf': ['docx', 'txt'],
  'docx': ['pdf', 'txt'],
  'txt': ['pdf', 'docx']
};

const fileInput = document.getElementById("file-input");
const conversionType = document.getElementById("conversion-type");
const resultDiv = document.getElementById("result");
const modal = document.getElementById("processing-modal");

// Update conversion options dynamically
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

// Handle form submission
document.getElementById("upload-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = fileInput.files[0];
  const conversion = conversionType.value;

  if (!file) {
    resultDiv.textContent = "Please select a file!";
    return;
  }
  if (!conversion) {
    resultDiv.textContent = "Unsupported file type!";
    return;
  }

  // Show processing modal
  modal.style.display = "block";

  // Send file to backend
  const formData = new FormData();
  formData.append('file', file);
  formData.append('conversion', conversion);

  try {
    const response = await fetch('/convert', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Conversion failed');

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted-file.${conversion.split('-to-')[1]}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

  } catch (err) {
    resultDiv.textContent = err.message;
  } finally {
    modal.style.display = "none";
  }
});
