// Mapping extension to expected MIME type(s)
const extMimeMap = {
  'jpg': ['image/jpeg'],
  'jpeg': ['image/jpeg'],
  'png': ['image/png'],
  'gif': ['image/gif'],
  'bmp': ['image/bmp'],
  'webp': ['image/webp'],
  'svg': ['image/svg+xml'],
  'pdf': ['application/pdf'],
  'txt': ['text/plain'],
  'html': ['text/html'],
  'htm': ['text/html'],
  'js': ['application/javascript', 'text/javascript'],
  'json': ['application/json'],
  'css': ['text/css'],
  'xml': ['application/xml', 'text/xml'],
  'mp3': ['audio/mpeg'],
  'wav': ['audio/wav'],
  'ogg': ['audio/ogg'],
  'mp4': ['video/mp4'],
  'avi': ['video/x-msvideo'],
  'zip': ['application/zip'],
  'rar': ['application/x-rar-compressed'],
  '7z': ['application/x-7z-compressed'],
  'exe': ['application/x-msdownload', 'application/octet-stream'],
  'dll': ['application/x-msdownload'],
  // Tambah lagi sesuai kebutuhan
};

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const results = document.getElementById('results');
const downloadBtn = document.getElementById('download-report');

let reportData = [];

function getExtension(filename) {
  const parts = filename.toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() : '';
}

function isMatch(ext, mime) {
  if (!ext || !mime) return false;
  const allowedMimes = extMimeMap[ext];
  if (!allowedMimes) return false; // Unknown extension = mismatch
  // Some MIME headers may contain charset e.g. text/html; charset=UTF-8
  let cleanMime = mime.split(';')[0].trim().toLowerCase();
  return allowedMimes.includes(cleanMime);
}

function renderResult(items) {
  results.innerHTML = '';
  if (items.length === 0) {
    results.textContent = 'No files checked yet.';
    downloadBtn.disabled = true;
    return;
  }

  items.forEach(({ filename, ext, mime, status }) => {
    const div = document.createElement('div');
    div.className = 'result-item';

    const filenameEl = document.createElement('div');
    filenameEl.className = 'filename';
    filenameEl.textContent = filename;
    div.appendChild(filenameEl);

    const extEl = document.createElement('div');
    extEl.textContent = `Extension: ${ext || '[none]'}`;
    div.appendChild(extEl);

    const mimeEl = document.createElement('div');
    mimeEl.textContent = `MIME Type: ${mime || '[none]'}`;
    div.appendChild(mimeEl);

    const statusEl = document.createElement('div');
    statusEl.textContent = status ? 'MATCH' : 'MISMATCH';
    statusEl.className = status ? 'match' : 'mismatch';
    div.appendChild(statusEl);

    results.appendChild(div);
  });

  downloadBtn.disabled = false;
}

function generateCSV(data) {
  let csv = 'Filename,Extension,MIME Type,Status\n';
  data.forEach(({ filename, ext, mime, status }) => {
    csv += `"${filename}","${ext}","${mime}","${status ? 'MATCH' : 'MISMATCH'}"\n`;
  });
  return csv;
}

function downloadCSV(content, filename = 'mime_extension_report.csv') {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Fake MIME detection (simulate, no API, no terminal)
// Since we can't read real MIME from file header in browser due to security,
// we use the file.type (from input) which is provided by browser (not 100% reliable)
function checkFile(file) {
  return new Promise((resolve) => {
    const ext = getExtension(file.name);
    const mime = file.type || '';
    const match = isMatch(ext, mime);
    resolve({
      filename: file.name,
      ext,
      mime,
      status: match
    });
  });
}

function handleFiles(files) {
  const fileArray = Array.from(files);
  results.textContent = 'Checking files...';
  Promise.all(fileArray.map(checkFile))
    .then((res) => {
      reportData = res;
      renderResult(reportData);
    });
}

// Event Listeners
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  if (e.dataTransfer.files.length > 0) {
    handleFiles(e.dataTransfer.files);
  }
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleFiles(e.target.files);
  }
});

downloadBtn.addEventListener('click', () => {
  if (reportData.length > 0) {
    const csv = generateCSV(reportData);
    downloadCSV(csv);
  }
});
