/* =====================================================
   verify.js — public /verify page.
   Supports ?n=CERT-NUMBER (QR code lands here) and
   camera QR scanning via html5-qrcode.
   ===================================================== */

const $ = id => document.getElementById(id);

async function verify(number) {
  if (!number) return;
  $('result').innerHTML = `<div class="loading" style="padding:28px"><div class="spinner"></div>Verifying…</div>`;
  try {
    const res = await API.verifyCertificate(number);
    if (!res.found) return showNotFound();

    const c = res.certificate;
    if (c.status === 'revoked') {
      $('result').innerHTML = `
        <div class="card"><div class="card-body" style="text-align:center;border-left:6px solid var(--danger)">
          <div style="font-size:2.6rem">🚫</div>
          <h2 style="color:var(--danger)">Certificate Revoked</h2>
          <p>This certificate existed but has been <strong>revoked</strong> and is no longer valid.</p>
          ${c.revokeReason ? `<p style="color:var(--muted)">Reason: ${c.revokeReason}</p>` : ''}
          <p style="font-size:.85rem;color:var(--muted)">Certificate #: ${c.certificateNumber}</p>
        </div></div>`;
      return;
    }
    if (c.status !== 'generated' && c.status !== 'approved') {
      return showNotFound();
    }
    $('result').innerHTML = `
      <div class="card"><div class="card-body" style="border-left:6px solid var(--success)">
        <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
          <div style="font-size:2.6rem">✅</div>
          <div>
            <h2 style="margin:0;color:var(--success)">Valid Certificate</h2>
            <span class="badge badge-generated">Valid</span>
          </div>
        </div>
        <dl class="detail-grid" style="display:grid;grid-template-columns:170px 1fr;gap:10px 14px;margin-top:18px;font-size:.95rem">
          <dt><strong>Student Name</strong></dt><dd>${c.studentName}</dd>
          <dt><strong>Course</strong></dt><dd>${c.course}</dd>
          <dt><strong>Certificate Number</strong></dt><dd>${c.certificateNumber}</dd>
          <dt><strong>Issue Date</strong></dt><dd>${formatDate(c.issueDate)}</dd>
          <dt><strong>Status</strong></dt><dd>Valid</dd>
        </dl>
        <div style="margin-top:18px">
          <a class="btn btn-outline btn-sm" href="certificate-details.html?id=${c.id}">View full details</a>
        </div>
      </div></div>`;
  } catch (e) {
    $('result').innerHTML = `<div class="alert alert-danger">${e.message || 'Verification failed.'}</div>`;
  }
}

function showNotFound() {
  $('result').innerHTML = `
    <div class="card"><div class="card-body" style="text-align:center;border-left:6px solid var(--danger)">
      <div style="font-size:2.6rem">🔍</div>
      <h2 style="color:var(--danger)">Certificate Not Found</h2>
      <p>No certificate matches this number. Please double-check and try again,
      or contact Up Skills Hub for assistance.</p>
    </div></div>`;
}

$('verifyBtn').onclick = () => verify($('certNumber').value.trim());
$('certNumber').addEventListener('keydown', e => { if (e.key === 'Enter') verify($('certNumber').value.trim()); });

/* ---- QR scanning ---- */
let scanner = null;
$('scanBtn').onclick = () => {
  const readerEl = $('qrReader');
  if (scanner) { scanner.clear().then(() => { scanner = null; readerEl.style.display = 'none'; }); return; }
  readerEl.style.display = 'block';
  scanner = new Html5Qrcode('qrReader');
  scanner.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: 250 },
    text => {
      const number = text.split('/verify/').pop();
      $('certNumber').value = number;
      scanner.stop().then(() => { scanner = null; readerEl.style.display = 'none'; });
      verify(number);
    },
    () => {} /* per-frame errors ignored */
  ).catch(() => {
    readerEl.style.display = 'none';
    $('result').innerHTML = `<div class="alert alert-danger">Camera not available. Please enter the certificate number manually.</div>`;
  });
};

/* support direct QR link: verify.html?n=USH-2026-FD-000001 */
const qrNumber = new URLSearchParams(location.search).get('n');
if (qrNumber) { $('certNumber').value = qrNumber; verify(qrNumber); }
