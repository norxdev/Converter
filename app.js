// Supported conversions (demo mapping)
const conversionMap = {
  pdf: ['txt'],
  txt: ['pdf'],
  docx: ['txt']
};

// 🔴 Replace with your deployed Cloudflare Worker URL
const WORKER_URL = 'https://converter-worker.norxonics.workers.dev';

const fileInput = document.getElementById('file-input');
const conversionType = document.getElementById('conversion-type');
const form = document.getElementById('upload-form');
const result = document.getElementById('result');
const modal = document.getElementById('processing-modal');

// Populate conversion options dynamically when a file is selected
fileInput.addEventListener('change', () => {
  conversionType.innerHTML = '';

  const file = fileInput.files[0];
  if (!file) return;

  const ext = file.name.split('.').pop().toLowerCase();

  if (!conversionMap[ext]) {
    const opt = document.createElement('option');
    opt.textContent = 'Unsupported file type';
    opt.value = '';
    conversionType.appendChild(opt);
    return;
  }

  conversionMap[ext].forEach(target => {
    const opt = document.createElement('option');
    opt.value = target;
    opt.textContent = `${ext.toUpperCase()} → ${target.toUpperCase()}`;
    conversionType.appendChild(opt);
  });
});

// Handle form submit (conversion)
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const file = fileInput.files[0];
  const target = conversionType.value;

  if (!file || !target) {
    result.textContent = 'Please select a file and target format.';
    return;
  }

  // Show processing modal
  modal.classList.remove('hidden');
  result.textContent = '';

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('target', target);

    const response = await fetch(WORKER_URL, {
      method: 'POST',
      body: formData
    });

    // If response fails, throw to catch
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const blob = await response.blob();
    if (!blob || blob.size === 0) {
      throw new Error('Empty file returned');
    }

    // Show success message
    result.textContent = 'Conversion complete.';

    // Trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted.${target}`;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

  } catch (err) {
    console.error(err);
    result.textContent = 'Conversion failed.';
  } finally {
    // Hide spinner
    modal.classList.add('hidden');
  }
});
