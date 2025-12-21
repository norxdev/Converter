document.addEventListener("DOMContentLoaded", () => {

  // Map of supported file types and their valid conversions
  const conversionMap = {
    'pdf': ['docx', 'txt'],
    'docx': ['pdf', 'txt'],
    'txt': ['pdf', 'docx']
  };

  const fileInput = document.getElementById("file-input");
  const conversionType = document.getElementById("conversion-type");
  const resultDiv = document.getElementById("result");

  // Update conversion options dynamically when a file is selected
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
  document.getElementById("upload-form").addEventListener("submit", (e) => {
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

    // Show converting message and spinner
    resultDiv.innerHTML = `
      <p>Converting "<strong>${file.name}</strong>" to ${conversion.split('-to-')[1].toUpperCase()}...</p>
      <div class="spinner"></div>
    `;

    // Simulate conversion delay
    setTimeout(() => {
      const ext = conversion.split('-to-')[1];

      // Show download button after "conversion"
      resultDiv.innerHTML = `
        File "<strong>${file.name}</strong>" converted (${conversion}).<br>
        <button id="download-btn">Download Converted File</button>
      `;

      // Handle dummy download
      document.getElementById("download-btn").addEventListener("click", () => {
        const blob = new Blob([`This is a dummy converted ${ext} file.`], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `converted-file.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });

    }, 2000); // 2-second delay to show spinner
  });

});
