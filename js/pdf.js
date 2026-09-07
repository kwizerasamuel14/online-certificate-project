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

  // body paragraph
  doc.setFont('times', 'normal'); doc.setFontSize(12); doc.setTextColor('#33405c');
  doc.text(
    'for successfully completing the internship program',
    cx, 103, { align: 'center' });
  doc.setFont('times', 'bold');
  doc.text('"' + c.course + '"', cx, 111, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.text('offered by Up Skills Hub. Throughout the program, the trainee demonstrated', cx, 120, { align: 'center' });
  doc.text('dedication, professionalism and outstanding growth in practical skills.', cx, 127, { align: 'center' });

  // ---- signatures row ----
  const rowY = 165;
  doc.setFontSize(9); doc.setTextColor(NAVY);

  // left signature
  doc.setFont('times', 'italic'); doc.setFontSize(16);
  doc.text('Clarisse Uwizeyimana', 60, rowY - 4, { align: 'center' });
  doc.setDrawColor(NAVY); doc.setLineWidth(0.3);
  doc.line(30, rowY, 90, rowY);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text('Clarisse Uwizeyimana', 60, rowY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(GREY);
  doc.text('FOUNDER & CEO — SIGNATURE', 60, rowY + 8, { align: 'center' });

  // right signature
  doc.setFont('times', 'italic'); doc.setFontSize(16); doc.setTextColor(NAVY);
  doc.text('Christophe Nshimiyimana', W - 60, rowY - 4, { align: 'center' });
  doc.setDrawColor(NAVY); doc.line(W - 90, rowY, W - 30, rowY);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text('Christophe Nshimiyimana', W - 60, rowY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(GREY);
  doc.text('PROGRAM MANAGER — SIGNATURE', W - 60, rowY + 8, { align: 'center' });

  // centre stamp (circular)
  doc.setDrawColor(NAVY); doc.setLineWidth(0.6);
  doc.circle(cx, rowY, 11, 'S');
  doc.setDrawColor(GOLD); doc.setLineWidth(0.3);
  doc.circle(cx, rowY, 9.2, 'S');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(NAVY);
  doc.text('USH', cx, rowY + 1, { align: 'center' });
  doc.setFontSize(4.5);
  doc.text('UP SKILLS HUB', cx, rowY + 5, { align: 'center' });

  // dates under left signature block
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor('#33405c');
  doc.text('Start Date:', 30, rowY + 16); doc.setTextColor(NAVY);
  doc.setFont('helvetica', 'bold');
  doc.text(formatDate(c.startDate), 62, rowY + 16);
  doc.setFont('helvetica', 'normal'); doc.setTextColor('#33405c');
  doc.text('End Date:', 30, rowY + 21); doc.setTextColor(NAVY);
  doc.setFont('helvetica', 'bold');
  doc.text(formatDate(c.endDate), 62, rowY + 21);

  // QR code (verification URL) bottom-right
  try {
    const qrDataUrl = await makeQrDataUrl(c.verifyUrl || ('https://upskillshub.com/verify/' + c.certificateNumber));
    if (qrDataUrl) doc.addImage(qrDataUrl, 'PNG', W - 40, H - 38, 22, 22);
  } catch (_) { /* QR optional — never block the download */ }

  // footer
  doc.setDrawColor(NAVY); doc.setLineWidth(0.2);
  doc.line(cx - 90, H - 24, cx + 90, H - 24);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(GREY);
  doc.text('KG 173 Street, Remera, Kigali, Rwanda  ·  upskillshub.info@gmail.com  ·  +250 781 796 283', cx, H - 18, { align: 'center' });

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
