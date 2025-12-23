const WORKER_URL = "https://converter-worker.norxonics.workers.dev";

const form = document.getElementById("upload-form");
const fileInput = document.getElementById("file-input");
const conversionType = document.getElementById("conversion-type");
const modal = document.getElementById("processing-modal");
const modalText = document.getElementById("modal-status");

const conversionMap = {
  txt: ["txt", "pdf", "docx"]
};

fileInput.addEventListener("change", () => {
  conversionType.innerHTML = "";
  const file = fileInput.files[0];
  if (!file) return;

  const ext = file.name.split(".").pop().toLowerCase();
  if (!conversionMap[ext]) {
    conversionType.innerHTML = `<option>Unsupported</option>`;
    return;
  }

  conversionMap[ext].forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = `${ext.toUpperCase()} → ${t.toUpperCase()}`;
    conversionType.appendChild(opt);
  });
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = fileInput.files[0];
  const target = conversionType.value;

  if (!file || !target) return;

  modal.style.display = "flex";
  modalText.textContent = "Uploading file...";

  const data = new FormData();
  data.append("file", file);
  data.append("target", target);

  try {
    modalText.textContent = "Converting file...";

    const res = await fetch(WORKER_URL, {
      method: "POST",
      body: data
    });

    if (!res.ok) throw new Error();

    modalText.textContent = "Finalizing download...";

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `converted.${target}`;
    document.body.appendChild(a);
    a.click();
    a.remove();

  } catch {
    alert("Conversion failed.");
  } finally {
    modal.style.display = "none";
  }
});
