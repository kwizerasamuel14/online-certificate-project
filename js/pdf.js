/* =====================================================
   pdf.js — real client-side PDF generation for
   certificates (Up Skills Hub official layout).
   Uses jsPDF (loaded from CDN on the pages that need it).
   ===================================================== */

/**
 * Generates a real PDF for a certificate object and
 * triggers the browser download.
 * @param {Object} c certificate record (from API)
 */
async function downloadCertificatePDF(c) {
  if (typeof window.jspdf === 'undefined') {
    throw new Error('PDF library not loaded. Check your connection.');
  }
  const { jsPDF } = window.jspdf;
  // A4 landscape: 297mm x 210mm
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297, H = 210, cx = W / 2;

  const NAVY = '#1b2a4a', GOLD = '#b3924f', PALE = '#faf6ea', GREY = '#5a6478';

  // load the logo, circularly clipped onto a transparent PNG so it sits
  // inside the round stamp like the official template's seal
  async function loadCircularLogo() {
    try {
      const img = await new Promise((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = reject;
        im.src = 'Logo%20Image.jpeg';
      });
      const size = 300, canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      // cover-fit the square source into the circle
      ctx.drawImage(img, 0, 0, size, size);
      ctx.restore();
      return canvas.toDataURL('image/png');
    } catch (e) { return null; }
  }
  const logoDataUrl = await loadCircularLogo();

  // supervisor-provided scans, backgrounds already removed:
  // "Real 2 signatures.png" (top = FOUNDER & CEO, bottom = PROGRAM DIRECTOR)
  // and the official stamp "Real Stamp.png"
  // top signature in the scan = Christophe (Program Director),
  // bottom signature in the scan = Clarisse (Founder & CEO)
  const sigClarisse = await loadInkCrop('Real%202%20signatures.png',
    { x: 0.10, y: 0.55, w: 0.85, h: 0.40 }, { hi: 230, lo: 120 });
  const sigChristophe = await loadInkCrop('Real%202%20signatures.png',
    { x: 0.05, y: 0.03, w: 0.90, h: 0.28 }, { hi: 230, lo: 120 });
  const stampImg = await loadInkCrop('Real%20Stamp.png',
    { x: 0.05, y: 0.05, w: 0.90, h: 0.90 }, { hi: 215, lo: 110 });

  // parchment background
  doc.setFillColor(PALE);
  doc.rect(0, 0, W, H, 'F');

  // outer navy border + inner gold line
  doc.setDrawColor(NAVY); doc.setLineWidth(1.2);
  doc.rect(6, 6, W - 12, H - 12);
  doc.setDrawColor(GOLD); doc.setLineWidth(0.4);
  doc.rect(11, 11, W - 22, H - 22);

  // gold corner ribbons (top-left / bottom-right)
  doc.setDrawColor('#c9a85c'); doc.setLineWidth(2.2);
  doc.line(12, 24, 12, 12); doc.line(12, 12, 24, 12);
  doc.line(W - 12, H - 24, W - 12, H - 12); doc.line(W - 12, H - 12, W - 24, H - 12);

  // meta row (cert number + issue date)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.setTextColor(NAVY);
  doc.text('Certificate ID: ' + c.certificateNumber, 18, 22);
  doc.text('Issue Date: ' + formatDate(c.issueDate), W - 18, 22, { align: 'right' });

  // title
  doc.setFont('times', 'bold'); doc.setFontSize(34);
  doc.text('Certificate of Completion', cx, 52, { align: 'center' });

  // ornament
  doc.setDrawColor(GOLD); doc.setLineWidth(0.5);
  doc.line(cx - 70, 58, cx - 8, 58); doc.line(cx + 8, 58, cx + 70, 58);
  doc.setFont('times', 'normal'); doc.setFontSize(12); doc.setTextColor(GOLD);
  doc.text('❖', cx, 59, { align: 'center' });

  // awarded-to line
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(GREY);
  doc.text('T H I S   C E R T I F I C A T E   I S   A W A R D E D   T O', cx, 74, { align: 'center' });

  // student name
  doc.setFont('times', 'bold'); doc.setFontSize(30); doc.setTextColor(NAVY);
  doc.text(c.studentName, cx, 88, { align: 'center' });

  // body paragraph (matches official template wording)
  doc.setFont('times', 'normal'); doc.setFontSize(11); doc.setTextColor('#33405c');
  const bodyLines = [
    'For successfully completing the ' + c.course + ' at Up Skills Hub. The recipient has',
    'successfully fulfilled all program requirements, including practical training,',
    'project-based learning, assessments, and competency evaluations, demonstrating',
    'the knowledge, technical skills, and professional standards expected of the program.',
  ];
  bodyLines.forEach((line, i) => doc.text(line, cx, 102 + i * 7, { align: 'center' }));

  // start / end dates — centred below the body text (per supervisor's reference)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold'); doc.setTextColor(NAVY);
  doc.text('Start Date:', cx - 3, 133, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setTextColor('#33405c');
  doc.text(formatDate(c.startDate), cx + 3, 133);
  doc.setFont('helvetica', 'bold'); doc.setTextColor(NAVY);
  doc.text('End Date:', cx - 3, 139, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setTextColor('#33405c');
  doc.text(formatDate(c.endDate), cx + 3, 139);

  // ---- signatures row ----
  const rowY = 165;
  doc.setFontSize(9); doc.setTextColor(NAVY);

  // scanned handwritten signatures in the spaces above the lines
  if (sigClarisse) {
    const sw = 32, sgh = sw * sigClarisse.ratio;
    doc.addImage(sigClarisse.url, 'PNG', 60 - sw / 2, rowY - 2 - sgh, sw, sgh);
  }
  if (sigChristophe) {
    const sw = 30, sgh = sw * sigChristophe.ratio;
    doc.addImage(sigChristophe.url, 'PNG', W - 60 - sw / 2, rowY - 2 - sgh, sw, sgh);
  }

  // left signature
  doc.setDrawColor(NAVY); doc.setLineWidth(0.3);
  doc.line(30, rowY, 90, rowY);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text('Clarisse Uwizeyimana', 60, rowY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(GREY);
  doc.text('FOUNDER & CEO', 60, rowY + 8, { align: 'center' });

  // right signature
  doc.setDrawColor(NAVY); doc.line(W - 90, rowY, W - 30, rowY);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text('Christophe Nshimiyimana', W - 60, rowY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(GREY);
  doc.text('PROGRAM DIRECTOR', W - 60, rowY + 8, { align: 'center' });

  // centre row, exactly per the supervisor's reference template:
  // official stamp on the LEFT, enlarged logo in the MIDDLE,
  // QR code on the RIGHT
  if (stampImg) {
    try {
      const ss = 26, st = ss * stampImg.ratio;
      doc.addImage(stampImg.url, 'PNG', cx - 20 - ss / 2, rowY - st / 2, ss, st);
    } catch (e) { /* fall through to drawn seal */ }
  }
  if (logoDataUrl) {
    try {
      const ls = 34; // enlarged logo, centred
      doc.addImage(logoDataUrl, 'PNG', cx - ls / 2, rowY - ls / 2, ls, ls);
    } catch (e) { /* logo optional */ }
  }
  if (!stampImg) {
    // fallback: drawn circular OFFICIAL seal with the logo inside
    doc.setDrawColor(NAVY); doc.setLineWidth(0.6);
    doc.circle(cx - 20, rowY, 11, 'S');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(3.2); doc.setTextColor(NAVY);
    const stampLabel = '· OFFICIAL · UP SKILLS HUB ';
    (function stampRingText() {
      const radius = 12.2, start = -125, sweep = 70; // degrees
      const chars = stampLabel.split('');
      chars.forEach((ch, i) => {
        const a = (start + (sweep / (chars.length - 1)) * i) * Math.PI / 180;
        doc.text(ch, cx - 20 + radius * Math.cos(a), rowY + radius * Math.sin(a) + 1, { align: 'center' });
      });
    })();
    if (!logoDataUrl) {
      doc.setDrawColor(GOLD); doc.setLineWidth(0.3);
      doc.circle(cx - 20, rowY, 9.2, 'S');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(NAVY);
      doc.text('USH', cx - 20, rowY + 1, { align: 'center' });
      doc.setFontSize(4.5);
      doc.text('UP SKILLS HUB', cx - 20, rowY + 5, { align: 'center' });
    }
  }

  // footer (matches official template contact info)
  doc.setDrawColor(NAVY); doc.setLineWidth(0.2);
  doc.line(cx - 90, H - 24, cx + 90, H - 24);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(GREY);
  doc.text('Up Skills Hub, Remera, Kigali, Rwanda', cx, H - 19, { align: 'center' });
  doc.text('www.upskillshub.com  ·  info@upskillshub.com  ·  +250 781 796 283', cx, H - 14, { align: 'center' });

  // QR code (verification URL) — beside the official stamp,
  // per the supervisor's reference template
  try {
    const verifyTarget = c.verifyUrl || ('https://upskillshub.com/verify/' + c.certificateNumber);
    const qrDataUrl = await makeQrDataUrl(verifyTarget);
    if (qrDataUrl) {
      const qs = 22, qx = cx + 22, qy = rowY - 11;
      // white backing box (scan contrast) with a thin navy border
      doc.setFillColor('#ffffff');
      doc.rect(qx - 2, qy - 2, qs + 4, qs + 4, 'F');
      doc.setDrawColor(NAVY); doc.setLineWidth(0.2);
      doc.rect(qx - 2, qy - 2, qs + 4, qs + 4);
      doc.addImage(qrDataUrl, 'PNG', qx, qy, qs, qs);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); doc.setTextColor(NAVY);
      doc.text('Scan to verify', qx + qs / 2, qy + qs + 4, { align: 'center' });
    }
  } catch (_) { /* QR optional — never block the download */ }

  // download
  const safeName = String(c.studentName).replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  doc.save(`certificate-${c.certificateNumber}-${safeName}.pdf`);
}

/**
 * Returns a PNG data-URL QR code, whatever QR library is on the page:
 *  - "qrcode" (node-style) -> QRCode.toDataURL()
 *  - qrcodejs (constructor, used on certificate-details.html)
 */
function makeQrDataUrl(text) {
  if (typeof QRCode === 'undefined') return Promise.resolve(null);
  if (typeof QRCode.toDataURL === 'function') {
    return QRCode.toDataURL(text, { margin: 1, width: 160 });
  }
  // qrcodejs fallback: render into a detached div, read the canvas/img
  return new Promise(resolve => {
    const holder = document.createElement('div');
    holder.style.position = 'fixed'; holder.style.left = '-9999px';
    document.body.appendChild(holder);
    try {
      new QRCode(holder, { text, width: 160, height: 160, correctLevel: QRCode.CorrectLevel ? QRCode.CorrectLevel.M : undefined });
      setTimeout(() => {
        const canvas = holder.querySelector('canvas');
        const img = holder.querySelector('img');
        const url = canvas ? canvas.toDataURL('image/png') : (img && img.src) || null;
        document.body.removeChild(holder);
        resolve(url);
      }, 120);
    } catch (_) {
      document.body.removeChild(holder);
      resolve(null);
    }
  });
}

/**
 * Loads a photo, crops a fractional region and knocks the light paper
 * background out to transparency (luminance key), leaving only the ink.
 * Used for the supervisor-provided signature scans and the official stamp.
 * Returns { url, ratio } or null when the image cannot be processed
 * (e.g. the page is opened directly from disk without a web server —
 * browsers block canvas reads for file:// images).
 * @param {string} src image path
 * @param {{x:number,y:number,w:number,h:number}} crop fractional region of the photo
 * @param {{hi?:number,lo?:number}} opts luma thresholds (hi..lo → alpha 0..255)
 */
async function loadInkCrop(src, crop, opts = {}) {
  try {
    const img = await new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = src;
    });
    const sx = Math.round(img.width * crop.x);
    const sy = Math.round(img.height * crop.y);
    const sw = Math.round(img.width * crop.w);
    const sh = Math.round(img.height * crop.h);
    const scale = Math.min(1, 900 / sw);            // cap canvas size
    const cw = Math.max(1, Math.round(sw * scale));
    const ch = Math.max(1, Math.round(sh * scale));
    const canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
    // Detect whether the source PNG already has a transparent background
    // (e.g. exported from an online background remover). Transparent pixels
    // read back as BLACK with alpha 0 on canvas — if we luma-key them we'd
    // turn the removed background into opaque black. So for transparent
    // sources we KEEP the existing alpha (it already encodes the ink shape)
    // and only un-premultiply the colour; for opaque scans we luma-key as before.
    const frame = ctx.getImageData(0, 0, cw, ch);
    const px = frame.data;
    let transparentSource = false;
    for (let i = 3; i < px.length; i += 4) {
      if (px[i] < 16) { transparentSource = true; break; }   // any fully transparent pixel
    }
    const hi = opts.hi ?? 215, lo = opts.lo ?? 135; // luma key thresholds
    for (let i = 0; i < px.length; i += 4) {
      if (transparentSource) {
        // honour the PNG's own alpha; darken RGB so semi-transparent edges stay ink-coloured
        if (px[i + 3] > 0 && px[i + 3] < 255) {
          px[i] = px[i + 1] = px[i + 2] = Math.min(px[i], px[i + 1], px[i + 2]);
        }
        continue;
      }
      const luma = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      let a = (255 * (hi - luma)) / (hi - lo);
      px[i + 3] = a < 0 ? 0 : a > 255 ? 255 : a;
    }
    ctx.putImageData(frame, 0, 0);
    return { url: canvas.toDataURL('image/png'), ratio: ch / cw };
  } catch (e) { return null; }
}
