const form = document.getElementById("upload-form");
const fileInput = document.getElementById("file-input");
const conversionType = document.getElementById("conversion-type");
const modal = document.getElementById("processing-modal");
const modalStatus = document.getElementById("modal-status");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!fileInput.files.length) return;

  modal.style.display = "block";
  modalStatus.textContent = "Processing...";

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", conversionType.value);

  try {
    const response = await fetch("/api/convert", {
      method: "POST",
      body: formData
    });

    if (!response.ok) throw new Error("Conversion failed");

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name.split(".")[0] + "." + conversionType.value;
    document.body.appendChild(a);
    a.click();
    a.remove();

    modalStatus.textContent = "Done!";
    setTimeout(() => modal.style.display = "none", 1000);

  } catch (err) {
    modalStatus.textContent = "Conversion failed: " + err.message;
    setTimeout(() => modal.style.display = "none", 2000);
  }
});
