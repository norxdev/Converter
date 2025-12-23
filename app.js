const form = document.getElementById("convertForm");
const fileInput = document.getElementById("file");
const fromSelect = document.getElementById("from");
const toSelect = document.getElementById("to");
const statusEl = document.getElementById("status");

// Supported conversions (expand safely)
const SUPPORTED = {
  txt: ["pdf"]
};

function isSupported(from, to) {
  return SUPPORTED[from]?.includes(to);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusEl.textContent = "";

  const file = fileInput.files[0];
  const from = fromSelect.value;
  const to = toSelect.value;

  if (!file) {
    statusEl.textContent = "Please select a file.";
    return;
  }

  if (!isSupported(from, to)) {
    statusEl.textContent = "This conversion is not supported yet.";
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("from", from);
  formData.append("to", to);

  try {
    statusEl.textContent = "Converting...";

    const res = await fetch("/", {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || "Conversion failed");
    }

    const blob = await res.blob();

    // Download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `converted.${to}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    statusEl.textContent = "Conversion complete!";
  } catch (err) {
    statusEl.textContent = err.message;
  }
});
