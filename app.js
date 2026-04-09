import { removeBackground } from 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.5/+esm';

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-qr').style.display = tab.dataset.tab === 'qr' ? '' : 'none';
    document.getElementById('tab-bg').style.display = tab.dataset.tab === 'bg' ? '' : 'none';
  });
});

const urlInput    = document.getElementById('url-input');
const sizeSelect  = document.getElementById('size-select');
const fgColor     = document.getElementById('fg-color');
const bgColor     = document.getElementById('bg-color');
const marginRange = document.getElementById('margin');
const canvas      = document.getElementById('qr-canvas');
const qrLabel     = document.getElementById('qr-label');
const dlBtn       = document.getElementById('dl-btn');
let debounceTimer = null;

function getFilename(url) {
  try { return new URL(url).hostname.replace(/\./g, '_') + '.png'; }
  catch { return 'qrcode.png'; }
}

function generate() {
  const url = urlInput.value.trim();
  if (!url) return;

  const QRCodeLib = window.QRCode;
  if (!QRCodeLib) { console.error('QRCode library not loaded'); return; }

  const size   = parseInt(sizeSelect.value);
  const fg     = fgColor.value;
  const bg     = bgColor.value;
  const margin = parseInt(marginRange.value);

  const tmp = document.createElement('div');
  tmp.style.cssText = 'position:absolute;visibility:hidden;';
  document.body.appendChild(tmp);

  new QRCodeLib(tmp, {
    text: url,
    width: size,
    height: size,
    colorDark: fg,
    colorLight: bg,
    correctLevel: QRCodeLib.CorrectLevel.H
  });

  setTimeout(() => {
    const src = tmp.querySelector('canvas');
    if (!src) { document.body.removeChild(tmp); return; }

    const total = size + margin * 2;
    canvas.width = total;
    canvas.height = total;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, total, total);
    ctx.drawImage(src, margin, margin, size, size);
    document.body.removeChild(tmp);
    qrLabel.textContent = url;
    dlBtn.disabled = false;
  }, 100);
}

urlInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(generate, 400);
});
sizeSelect.addEventListener('change', generate);
fgColor.addEventListener('input', () => {
  document.getElementById('fg-hex').textContent = fgColor.value;
  generate();
});
bgColor.addEventListener('input', () => {
  document.getElementById('bg-hex').textContent = bgColor.value;
  generate();
});
marginRange.addEventListener('input', () => {
  document.getElementById('margin-out').textContent = marginRange.value;
  generate();
});
dlBtn.addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = getFilename(urlInput.value.trim());
  a.click();
});

// รอ QRCode โหลดเสร็จก่อน generate
window.addEventListener('load', () => {
  if (window.QRCode) generate();
  else {
    const check = setInterval(() => {
      if (window.QRCode) { clearInterval(check); generate(); }
    }, 100);
  }
});

// --- BG Removal ---
const fileInput   = document.getElementById('file-input');
const uploadArea  = document.getElementById('upload-area');
const bgPreview   = document.getElementById('bg-preview');
const imgOriginal = document.getElementById('img-original');
const imgResult   = document.getElementById('img-result');
const bgLoading   = document.getElementById('bg-loading');
const bgProgress  = document.getElementById('bg-progress');
const dlBgBtn     = document.getElementById('dl-bg-btn');

uploadArea.addEventListener('dragover', e => {
  e.preventDefault();
  uploadArea.style.borderColor = '#d4f400';
});
uploadArea.addEventListener('dragleave', () => {
  uploadArea.style.borderColor = '';
});
uploadArea.addEventListener('drop', e => {
  e.preventDefault();
  uploadArea.style.borderColor = '';
  handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));

async function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) return;

  imgOriginal.src = URL.createObjectURL(file);
  bgPreview.style.display = '';
  imgResult.style.display = 'none';
  bgLoading.classList.remove('hidden');
  bgProgress.textContent = '0%';
  dlBgBtn.disabled = true;

  try {
    const resultBlob = await removeBackground(file, {
      publicPath: 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.5/dist/',
      progress: (key, current, total) => {
        if (total > 0) {
          const pct = Math.round((current / total) * 100);
          bgProgress.textContent = pct + '%';
        }
      }
    });

    const resultUrl = URL.createObjectURL(resultBlob);
    imgResult.src = resultUrl;
    imgResult.style.display = 'block';
    bgLoading.classList.add('hidden');
    dlBgBtn.disabled = false;

    dlBgBtn.onclick = () => {
      const a = document.createElement('a');
      a.href = resultUrl;
      a.download = file.name.replace(/\.[^.]+$/, '') + '_nobg.png';
      a.click();
    };
  } catch (err) {
    bgLoading.innerHTML = '<span style="color:#e24b4a;font-family:monospace;font-size:13px;">เกิดข้อผิดพลาด ลองใหม่อีกครั้ง</span>';
    console.error(err);
  }
}