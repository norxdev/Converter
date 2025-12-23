const WORKER_URL = "https://converter-worker.norxonics.workers.dev";

const form = document.getElementById("upload-form");
const fileInput = document.getElementById("file-input");
const conversionType = document.getElementById("conversion-type");
const modal = document.getElementById("processing-modal");
const modalText = document.getElementById("modal-status");

/**
 * Targets we allow users to choose.
 * Backend decides what actually converts.
 */
const TARGETS = ["txt", "pdf", "docx"];

fileInput.addEventListener("change", () => {
  conversionType.innerHTML = "";

  const file = fileInput.files[0];
  if (!file) return;

  // Always allow selecting a target
  TARGETS.forEach(target => {
    const opt = document.createElement("option");
    opt.value = target;
    opt.textContent = `Convert to ${target.toUpperCase()}`;
    conversionType.appendChild(opt);
  });
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = fileInput.files[0];
  const target = conversionType.value;

  if (!file || !target) {
    alert("Please select a file and conversion type.");
    return;
  }

  modal.style.display = "flex";
  modalText.textContent = "Uploading file...";

  const data = new FormData();
  data.append("file", file);
  data.append("target", target);

  try {
    modalText.textContent = "Processing conversion...";

    const res = await fetch(WORKER_URL, {
      method: "POST",
      body: data,
    });

    if (!res.ok) {
      throw new Error("Conversion failed");
    }

    modalText.textContent = "Preparing download...";

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `converted.${target}`;
    document.body.appendChild(a);
    a.click();
    a.remove();

  } catch (err) {
    alert("Conversion failed. This file type may have limited support.");
  } finally {
    modal.style.display = "none";
  }
});
