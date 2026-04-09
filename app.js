var urlInput    = document.getElementById('url-input');
var sizeSelect  = document.getElementById('size-select');
var fgColor     = document.getElementById('fg-color');
var bgColor     = document.getElementById('bg-color');
var marginRange = document.getElementById('margin');
var canvas      = document.getElementById('qr-canvas');
var qrLabel     = document.getElementById('qr-label');
var dlBtn       = document.getElementById('dl-btn');
var debounceTimer = null;

function getFilename(url) {
  try { return new URL(url).hostname.replace(/\./g, '_') + '.png'; }
  catch { return 'qrcode.png'; }
}

function generate() {
  var url = urlInput.value.trim();
  if (!url) return;

  var size   = parseInt(sizeSelect.value);
  var fg     = fgColor.value;
  var bg     = bgColor.value;
  var margin = parseInt(marginRange.value);

  var tmp = document.createElement('div');
  tmp.style.cssText = 'position:absolute;visibility:hidden;left:-9999px;';
  document.body.appendChild(tmp);

  new QRCode(tmp, {
    text: url,
    width: size,
    height: size,
    colorDark: fg,
    colorLight: bg,
    correctLevel: QRCode.CorrectLevel.H
  });

  setTimeout(function() {
    var src = tmp.querySelector('canvas');
    if (!src) { document.body.removeChild(tmp); return; }

    var total = size + margin * 2;
    canvas.width = total;
    canvas.height = total;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, total, total);
    ctx.drawImage(src, margin, margin, size, size);
    document.body.removeChild(tmp);
    qrLabel.textContent = url;
    dlBtn.disabled = false;
  }, 100);
}

urlInput.addEventListener('input', function() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(generate, 400);
});
sizeSelect.addEventListener('change', generate);
fgColor.addEventListener('input', function() {
  document.getElementById('fg-hex').textContent = fgColor.value;
  generate();
});
bgColor.addEventListener('input', function() {
  document.getElementById('bg-hex').textContent = bgColor.value;
  generate();
});
marginRange.addEventListener('input', function() {
  document.getElementById('margin-out').textContent = marginRange.value;
  generate();
});
dlBtn.addEventListener('click', function() {
  var a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = getFilename(urlInput.value.trim());
  a.click();
});

generate();