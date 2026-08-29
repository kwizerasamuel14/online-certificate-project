/* =====================================================
   details.js — Certificate Details page.
   Reads ?id=, renders preview + QR code and actions.
   ===================================================== */

const params = new URLSearchParams(location.search);
const certId = params.get('id');

(async function init() {
  if (!certId) return showError();
  try {
    const c = await API.getCertificate(certId);
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';

    const set = (id, v) => (document.getElementById(id).textContent = v);
    set('c-name', c.studentName);   set('d-name', c.studentName);
    set('c-course', c.course);      set('d-course', c.course);
    set('c-number', c.certificateNumber); set('d-number', c.certificateNumber);
    set('c-issue', formatDate(c.issueDate)); set('d-issue', formatDate(c.issueDate));
    set('c-period', `${formatDate(c.startDate)} — ${formatDate(c.endDate)}`);

    const url = document.getElementById('d-url');
    url.href = c.verifyUrl; url.textContent = c.verifyUrl;

    document.getElementById('c-status').innerHTML = statusBadge(c.status);
    document.getElementById('d-status').innerHTML = statusBadge(c.status);

    /* QR code -> public verification URL */
    new QRCode(document.getElementById('c-qr'), {
      text: c.verifyUrl, width: 110, height: 110,
      colorDark: '#0d1b2a', colorLight: '#ffffff',
    });

    document.getElementById('btnDownload').onclick = async () => {
      try {
        await API.generateCertificate(c.id);
        toast('Certificate PDF downloaded.');
      } catch (e) { toast(e.message, 'error'); }
    };
    document.getElementById('btnShare').onclick = () => {
      if (navigator.share) navigator.share({ title: 'Up Skills Hub Certificate', url: c.verifyUrl }).catch(() => {});
      else { navigator.clipboard?.writeText(c.verifyUrl); toast('Verification link copied.'); }
    };
  } catch (e) { showError(); }
})();

function showError() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('content').style.display = 'none';
  const nf = document.getElementById('notFound');
  nf.style.display = 'block';
  nf.textContent = 'Certificate Not Found';
}
