const conversionMap = {
  pdf: ['txt'],
  txt: ['pdf'],
  docx: ['txt']
};

const WORKER_URL = 'https://converter-worker.YOURNAME.workers.dev';

const fileInput = document.getElementById('file-input');
const conversionType = document.getElementById('conversion-type');
const form = document.getElementById('upload-form');
const result = document.getElementById('result');
const modal = document.getElementById('processing-modal');

fileInput.addEventListener('change', () => {
  conversionType.innerHTML = '';
  const file = fileInput.files[0];
  if (!file) return;

  const ext = file.name.split('.').pop().toLowerCase();
  if (!conversionMap[ext]) {
    conversionType.innerHTML = '<option>Unsupported file</option>';
    return;
  }

  conversionMap[ext].forEach(target => {
    const opt = document.createElement('option');
    opt.value = target;
    opt.textContent = `${ext.toUpperCase()} → ${target.toUpperCase()}`;
    conversionType.appendChild(opt);
  });
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const file = fileInput.files[0];
  const target = conversionType.value;

  if (!file || !target) {
    result.textContent = 'Please select a file and format.';
    return;
  }

  modal.classList.remove('hidden');

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('target', target);

    const res = await fetch(WORKER_URL, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) throw new Error();

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `converted.${target}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    result.textContent = 'Conversion complete.';
  } catch {
    result.textContent = 'Conversion failed.';
  } finally {
    modal.classList.add('hidden');
  }
});
