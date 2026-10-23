import QRCode from 'qrcode';
import JSZip from 'jszip';

/**
 * Draws a professional, high-resolution (600x750px) branded MWS Eagle QR Reward Card
 * @param {Object} tokenObj { token, points, title }
 * @returns {Promise<Blob>}
 */
export const generateCardBlob = async (tokenObj) => {
  const canvas = document.createElement('canvas');
  const width = 600;
  const height = 750;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // 1. Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Outer border
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#e2e8f0';
  ctx.strokeRect(10, 10, width - 20, height - 20);

  // Top Accent Banner
  const topGrad = ctx.createLinearGradient(0, 10, width, 10);
  topGrad.addColorStop(0, '#0f172a');
  topGrad.addColorStop(0.5, '#1e293b');
  topGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = topGrad;
  ctx.fillRect(12, 12, width - 24, 90);

  // Header Brand Text
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MWS EAGLE', width / 2, 54);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 13px sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('PREMIUM ACCESSORIES REWARD VOUCHER', width / 2, 80);

  // 2. Points Badge (Gold Pill)
  const badgeY = 135;
  const badgeW = 340;
  const badgeH = 54;
  const badgeX = (width - badgeW) / 2;
  const radius = 27;

  // Draw rounded pill
  ctx.beginPath();
  ctx.moveTo(badgeX + radius, badgeY);
  ctx.lineTo(badgeX + badgeW - radius, badgeY);
  ctx.quadraticCurveTo(badgeX + badgeW, badgeY, badgeX + badgeW, badgeY + radius);
  ctx.lineTo(badgeX + badgeW, badgeY + badgeH - radius);
  ctx.quadraticCurveTo(badgeX + badgeW, badgeY + badgeH, badgeX + badgeW - radius, badgeY + badgeH);
  ctx.lineTo(badgeX + radius, badgeY + badgeH);
  ctx.quadraticCurveTo(badgeX, badgeY + badgeH, badgeX, badgeY + badgeH - radius);
  ctx.lineTo(badgeX, badgeY + radius);
  ctx.quadraticCurveTo(badgeX, badgeY, badgeX + radius, badgeY);
  ctx.closePath();

  const goldGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY + badgeH);
  goldGrad.addColorStop(0, '#f59e0b');
  goldGrad.addColorStop(1, '#d97706');
  ctx.fillStyle = goldGrad;
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 24px sans-serif';
  ctx.fillText(`★  ${tokenObj.points} REWARD POINTS  ★`, width / 2, badgeY + 36);

  // 3. Campaign Title
  ctx.fillStyle = '#475569';
  ctx.font = '700 16px sans-serif';
  ctx.fillText(tokenObj.title || 'MWS Eagle Rewards', width / 2, 222);

  // 4. Generate & Draw QR Code
  const qrDataUrl = await QRCode.toDataURL(tokenObj.token, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 280,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  });

  const qrImg = new Image();
  qrImg.src = qrDataUrl;
  await new Promise((resolve) => {
    qrImg.onload = resolve;
  });

  // White box container for QR code
  const qrBoxSize = 300;
  const qrBoxX = (width - qrBoxSize) / 2;
  const qrBoxY = 245;

  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 16);
  } else {
    ctx.rect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);
  }
  ctx.fill();
  ctx.stroke();

  // Draw QR image
  ctx.drawImage(qrImg, qrBoxX + 15, qrBoxY + 15, 270, 270);

  // 5. Unique Token ID in monospace container
  const tokenBoxY = 575;
  const tokenBoxW = 320;
  const tokenBoxH = 50;
  const tokenBoxX = (width - tokenBoxW) / 2;

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(tokenBoxX, tokenBoxY, tokenBoxW, tokenBoxH, 10);
  } else {
    ctx.rect(tokenBoxX, tokenBoxY, tokenBoxW, tokenBoxH);
  }
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 22px monospace';
  ctx.fillText(tokenObj.token, width / 2, tokenBoxY + 33);

  // 6. Footer Instructions
  ctx.fillStyle = '#059669';
  ctx.font = '800 14px sans-serif';
  ctx.fillText('Scan with MWS Eagle Mobile App to Claim', width / 2, 658);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 12px sans-serif';
  ctx.fillText('One-time claim only • Instant bank cash redemption available', width / 2, 684);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 11px sans-serif';
  ctx.fillText('© MWS Eagle Accessories • All rights reserved', width / 2, 712);

  // Convert canvas to blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png');
  });
};

/**
 * Download a single card directly as a PNG
 */
export const downloadSingleCard = async (tokenObj) => {
  const blob = await generateCardBlob(tokenObj);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MWS-QR-${tokenObj.points}pts-${tokenObj.token}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/**
 * Downloads all given tokens as a single convenient ZIP file
 * @param {Array} tokens Array of token objects { token, points, title }
 * @param {String} zipName Optional zip file name
 * @param {Function} onProgress Callback for reporting progress e.g. (current, total)
 */
export const downloadAllAsZip = async (tokens, zipName = 'MWS-Eagle-QR-Cards.zip', onProgress = null) => {
  if (!Array.isArray(tokens) || tokens.length === 0) {
    throw new Error('No QR tokens provided to download.');
  }

  const zip = new JSZip();
  const folder = zip.folder('MWS_Eagle_QR_Codes');

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (onProgress) onProgress(i + 1, tokens.length);

    const blob = await generateCardBlob(tok);
    const fileName = `${String(i + 1).padStart(3, '0')}_MWS-QR-${tok.points}pts_${tok.token}.png`;
    folder.file(fileName, blob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = zipName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 2000);
};
