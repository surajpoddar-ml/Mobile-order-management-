import QRCode from 'qrcode';
import JSZip from 'jszip';

/**
 * Wraps canvas text cleanly when long
 */
const wrapCanvasText = (ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) => {
  if (!text) return y;
  const words = text.split(' ');
  let line = '';
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, y);
      line = words[n] + ' ';
      y += lineHeight;
      lineCount++;
      if (lineCount >= maxLines - 1 && n < words.length - 1) {
        // truncate with ellipsis for remaining
        const remaining = words.slice(n).join(' ');
        let ellLine = remaining;
        while (ctx.measureText(ellLine + '...').width > maxWidth && ellLine.length > 0) {
          ellLine = ellLine.slice(0, -1);
        }
        ctx.fillText((ellLine + '...').trim(), x, y);
        return y + lineHeight;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, y);
  return y + lineHeight;
};

/**
 * Draws a professional, high-resolution (640x820px) branded MWS Eagle Product Warranty Card
 * @param {Object} warranty Warranty record
 * @returns {Promise<Blob>}
 */
export const generateWarrantyCardBlob = async (warranty) => {
  const canvas = document.createElement('canvas');
  const width = 640;
  const height = 820;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // 1. Clean White Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Outer Border & Corner Accent
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#e2e8f0';
  ctx.strokeRect(12, 12, width - 24, height - 24);

  // 2. Top Premium Navy Banner
  const topGrad = ctx.createLinearGradient(0, 12, width, 12);
  topGrad.addColorStop(0, '#031738');
  topGrad.addColorStop(0.5, '#0c2d6b');
  topGrad.addColorStop(1, '#031738');
  ctx.fillStyle = topGrad;
  ctx.fillRect(14, 14, width - 28, 96);

  // Header Brand Name
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MWS EAGLE', width / 2, 54);

  // Subtitle
  const isGuarantee = (warranty.warranty_type || '').toLowerCase() === 'guarantee';
  ctx.fillStyle = '#38bdf8';
  ctx.font = '700 12px sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText(
    isGuarantee ? 'OFFICIAL PRODUCT GUARANTEE CERTIFICATE' : 'OFFICIAL PRODUCT WARRANTY CERTIFICATE',
    width / 2,
    80
  );

  // 3. Warranty Duration Pill Badge
  const duration = warranty.warranty_duration || 6;
  const unit = warranty.warranty_duration_unit || 'Months';
  const badgeY = 126;
  const badgeW = 380;
  const badgeH = 46;
  const badgeX = (width - badgeW) / 2;
  const radius = 23;

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

  const badgeGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY + badgeH);
  if (isGuarantee) {
    badgeGrad.addColorStop(0, '#059669');
    badgeGrad.addColorStop(1, '#047857');
  } else {
    badgeGrad.addColorStop(0, '#0284c7');
    badgeGrad.addColorStop(1, '#0369a1');
  }
  ctx.fillStyle = badgeGrad;
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 19px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`★  ${duration} ${unit.toUpperCase()} OFFICIAL ${isGuarantee ? 'GUARANTEE' : 'WARRANTY'}  ★`, width / 2, badgeY + 30);

  // 4. Product Name & Model / Specs
  const prodName = warranty.product_name || 'MWS Eagle Product';
  ctx.fillStyle = '#0f172a';
  ctx.font = '800 20px sans-serif';
  ctx.textAlign = 'center';
  wrapCanvasText(ctx, prodName, width / 2, 202, 540, 26, 2);

  // Category / Model / Brand line
  const metaParts = [];
  if (warranty.brand) metaParts.push(warranty.brand);
  if (warranty.product_sku) metaParts.push(`SKU: ${warranty.product_sku}`);
  if (warranty.model) metaParts.push(`Model: ${warranty.model}`);
  const metaLine = metaParts.join('  •  ');
  if (metaLine) {
    ctx.fillStyle = '#64748b';
    ctx.font = '600 13px sans-serif';
    ctx.fillText(metaLine, width / 2, 258);
  }

  // 5. Generate QR Code
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mwseagle.com';
  const verifyUrl = `${origin}/verify-warranty/${warranty.warranty_token}`;

  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 260,
    color: {
      dark: '#031738',
      light: '#ffffff'
    }
  });

  const qrImg = new Image();
  qrImg.src = qrDataUrl;
  await new Promise((resolve) => {
    qrImg.onload = resolve;
  });

  // QR Container Box
  const qrBoxSize = 280;
  const qrBoxX = (width - qrBoxSize) / 2;
  const qrBoxY = 282;

  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 14);
  } else {
    ctx.rect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);
  }
  ctx.fill();
  ctx.stroke();

  // Draw QR in box
  ctx.drawImage(qrImg, qrBoxX + 10, qrBoxY + 10, 260, 260);

  // 6. Serial Number Box (Monospace)
  const serialY = 582;
  const serialW = 420;
  const serialH = 46;
  const serialX = (width - serialW) / 2;

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(serialX, serialY, serialW, serialH, 8);
  } else {
    ctx.rect(serialX, serialY, serialW, serialH);
  }
  ctx.fill();

  ctx.fillStyle = '#38bdf8';
  ctx.font = '700 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SERIAL / UNIQUE IDENTIFIER', width / 2, serialY + 16);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 18px monospace';
  ctx.fillText(warranty.product_code || 'N/A', width / 2, serialY + 36);

  // 7. Warranty Code & Batch Reference
  ctx.fillStyle = '#334155';
  ctx.font = '700 13px sans-serif';
  const warCodeText = `Security ID: ${warranty.warranty_code || 'MWS-WAR'}`;
  const batchText = warranty.purchase_info ? `  |  Ref: ${warranty.purchase_info}` : '';
  ctx.fillText(warCodeText + batchText, width / 2, 652);

  // 8. Footer Instructions & Anti-Counterfeit Notice
  ctx.fillStyle = '#0284c7';
  ctx.font = '800 13px sans-serif';
  ctx.fillText('Scan with smartphone camera to activate & verify warranty', width / 2, 692);

  ctx.fillStyle = '#64748b';
  ctx.font = '500 11px sans-serif';
  if (warranty.qr_expiry_date) {
    const expDate = new Date(warranty.qr_expiry_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    ctx.fillText(`Warranty starts automatically upon scan • QR Valid Until: ${expDate}`, width / 2, 714);
  } else {
    ctx.fillText('Warranty starts automatically on initial customer scan.', width / 2, 714);
  }

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 10.5px sans-serif';
  ctx.fillText('Authentic MWS Eagle Replacement Parts & Accessories • All Rights Reserved', width / 2, 750);

  // 9. Convert Canvas to Blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png');
  });
};

/**
 * Downloads a single warranty card as a PNG
 */
export const downloadSingleWarrantyCard = async (warranty) => {
  const blob = await generateWarrantyCardBlob(warranty);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanSerial = (warranty.product_code || warranty.warranty_code || 'card').replace(/[^a-zA-Z0-9_-]/g, '_');
  a.download = `MWS-Warranty-Card-${cleanSerial}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1200);
};

/**
 * Downloads standalone high-res QR code image only
 */
export const downloadSingleWarrantyQrOnly = async (warranty) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mwseagle.com';
  const verifyUrl = `${origin}/verify-warranty/${warranty.warranty_token}`;

  const dataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 600,
    margin: 2,
    color: {
      dark: '#031738',
      light: '#ffffff'
    },
    errorCorrectionLevel: 'H'
  });

  const a = document.createElement('a');
  a.href = dataUrl;
  const cleanSerial = (warranty.product_code || warranty.warranty_code || 'qr').replace(/[^a-zA-Z0-9_-]/g, '_');
  a.download = `MWS-Warranty-QR-${cleanSerial}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

/**
 * Downloads all given warranty records as a packaged ZIP file
 * @param {Array} warranties Array of warranty records
 * @param {String} zipName Zip file name
 * @param {Function} onProgress Progress callback e.g. (current, total)
 */
export const downloadAllWarrantiesAsZip = async (
  warranties,
  zipName = 'MWS-Eagle-Warranty-QRs.zip',
  onProgress = null
) => {
  if (!Array.isArray(warranties) || warranties.length === 0) {
    throw new Error('No warranty records provided to download.');
  }

  const zip = new JSZip();
  const cardsFolder = zip.folder('Warranty_Cards_PNG');
  const qrOnlyFolder = zip.folder('QR_Only_PNG');

  for (let i = 0; i < warranties.length; i++) {
    const w = warranties[i];
    if (onProgress) onProgress(i + 1, warranties.length);

    // 1. Generate full printable card blob
    const cardBlob = await generateWarrantyCardBlob(w);
    const cleanSerial = (w.product_code || `SN-${i + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanCode = (w.warranty_code || '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const indexStr = String(i + 1).padStart(3, '0');

    cardsFolder.file(`${indexStr}_MWS_WarrantyCard_${cleanSerial}_${cleanCode}.png`, cardBlob);

    // 2. Also generate standalone QR code image
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mwseagle.com';
    const verifyUrl = `${origin}/verify-warranty/${w.warranty_token}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 500,
      margin: 2,
      color: { dark: '#031738', light: '#ffffff' },
      errorCorrectionLevel: 'H'
    });
    // convert dataUrl to base64 buffer for zip
    const base64Data = qrDataUrl.split(',')[1];
    qrOnlyFolder.file(`${indexStr}_MWS_QR_${cleanSerial}.png`, base64Data, { base64: true });
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = zipName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 2500);
};

