document.getElementById("upload-form").addEventListener("submit", function(e) {
  e.preventDefault(); 

  const fileInput = document.getElementById("file-input");
  const conversionType = document.getElementById("conversion-type").value;
  const resultDiv = document.getElementById("result");

  if (!fileInput.files.length) {
    resultDiv.textContent = "Please select a file!";
    return;
  }

  const file = fileInput.files[0];

  // Show conversion message + dummy download button
  resultDiv.innerHTML = `
    File "<strong>${file.name}</strong>" ready to convert (${conversionType}).<br>
    <button id="download-btn">Download Converted File</button>
  `;

  // Dummy file download
  document.getElementById("download-btn").addEventListener("click", () => {
    const blob = new Blob(["This is a dummy converted file."], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "converted-file.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
});
