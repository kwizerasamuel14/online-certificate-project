/* =====================================================
   admin.js — Admin Certificate Management.
   Combined list of requests (workflow) + certificates,
   with search, filter, recommend, approve+generate,
   revoke, download, email.
   ===================================================== */

const $ = id => document.getElementById(id);
let records = [];

async function load() {
  $('listLoading').style.display = 'block';
  $('listEmpty').style.display = 'none';
  $('listWrap').style.display = 'none';
  try {
    const [reqs, certs] = await Promise.all([API.getRequests(), API.getCertificates()]);
    const certByReq = Object.fromEntries(certs.map(c => [c.requestRef, c]));
    records = reqs.map(r => ({ ...r, certificate: certByReq[r.id] || null }));
    render();
  } catch (e) {
    $('listLoading').style.display = 'none';
    $('listEmpty').innerHTML = `<div class="icon">⚠️</div><p>${e.message}</p>`;
    $('listEmpty').style.display = 'block';
  }
}

function render() {
  $('listLoading').style.display = 'none';
  const q = $('searchBox').value.trim().toLowerCase();
  const st = $('statusFilter').value;
  let rows = records;
  if (st) rows = rows.filter(r => r.status === st);
  if (q) rows = rows.filter(r =>
    r.fullName.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) ||
    r.program.toLowerCase().includes(q) ||
    (r.certificate && r.certificate.certificateNumber.toLowerCase().includes(q)));

  if (!rows.length) { $('listEmpty').style.display = 'block'; return; }
  $('listWrap').style.display = 'block';

  $('listWrap').innerHTML = `
    <table class="data-table">
      <thead><tr>
        <th>Req / Cert</th><th>Student</th><th>Program</th><th>Status</th><th>Actions</th>
      </tr></thead>
      <tbody>${rows.map(r => {
        const c = r.certificate;
        const actions = [];
        actions.push(`<button class="btn btn-sm btn-outline" onclick="viewReq('${r.id}')">View</button>`);
        if (r.status === 'pending')
          actions.push(`<button class="btn btn-sm btn-secondary" onclick="recommend('${r.id}')">✔ Recommend</button>`);
        if (r.status === 'recommended')
          actions.push(`<button class="btn btn-sm btn-primary" onclick="approveGenerate('${r.id}')">🎓 Approve & Generate</button>`);
        if (c && (c.status === 'generated' || c.status === 'approved')) {
          actions.push(`<button class="btn btn-sm btn-secondary" onclick="regenerate('${c.id}')">🔄 Generate PDF</button>`);
          actions.push(`<button class="btn btn-sm btn-ghost" onclick="emailCert('${c.id}')">✉ Email</button>`);
          actions.push(`<button class="btn btn-sm btn-danger" onclick="openRevoke('${c.id}')">🚫 Revoke</button>`);
        }
        if (c) actions.push(`<a class="btn btn-sm btn-outline" href="certificate-details.html?id=${c.id}">Details</a>`);
        return `
          <tr>
            <td>
              <strong>${r.id}</strong><br>
              ${c ? `<span style="font-size:.78rem;color:var(--primary)">${c.certificateNumber}</span>` : '—'}
            </td>
            <td>${r.fullName}<br><span style="font-size:.78rem;color:var(--muted)">${r.traineeId}</span></td>
            <td style="max-width:220px">${r.program}</td>
            <td>${statusBadge(r.status)}</td>
            <td style="white-space:nowrap">
              <div style="display:flex;gap:6px;flex-wrap:wrap">${actions.join('')}</div>
            </td>
          </tr>`;
      }).join('')}
      </tbody>
    </table>`;
}

function viewReq(id) {
  const r = records.find(x => x.id === id);
  if (!r) return;
  openModal('Request — ' + r.id, `
    <dl style="display:grid;grid-template-columns:160px 1fr;gap:8px 12px;font-size:.92rem">
      <dt><strong>Name</strong></dt><dd>${r.fullName} (${r.email})</dd>
      <dt><strong>Trainee ID</strong></dt><dd>${r.traineeId}</dd>
      <dt><strong>Program</strong></dt><dd>${r.program}</dd>
      <dt><strong>Period</strong></dt><dd>${formatDate(r.startDate)} → ${formatDate(r.endDate)}</dd>
      <dt><strong>Project</strong></dt><dd>${r.projectName}</dd>
      <dt><strong>Description</strong></dt><dd>${r.projectDescription}</dd>
      <dt><strong>Accomplishments</strong></dt><dd>${r.accomplishments}</dd>
      ${r.workLink ? `<dt><strong>Work link</strong></dt><dd><a href="${r.workLink}" target="_blank">${r.workLink}</a></dd>` : ''}
      ${r.liveLink ? `<dt><strong>Live link</strong></dt><dd><a href="${r.liveLink}" target="_blank">${r.liveLink}</a></dd>` : ''}
      ${r.finalReport ? `<dt><strong>Final report</strong></dt><dd>📎 ${r.finalReport}</dd>` : ''}
      <dt><strong>Status</strong></dt><dd>${statusBadge(r.status)}</dd>
    </dl>`);
}

async function recommend(id) {
  try { await API.recommendRequest(id); toast('Request recommended — waiting for admin approval.'); load(); }
  catch (e) { toast(e.message, 'error'); }
}

async function approveGenerate(id) {
  try {
    const cert = await API.approveAndGenerate(id);
    toast(`Certificate ${cert.certificateNumber} generated & student notified.`);
    load();
  } catch (e) { toast(e.message, 'error'); }
}

async function regenerate(id) {
  try { await API.generateCertificate(id); toast('Certificate PDF regenerated.'); load(); }
  catch (e) { toast(e.message, 'error'); }
}

async function emailCert(id) {
  try {
    const res = await API.sendByEmail(id);
    toast(`Certificate emailed to ${res.email}.`);
  } catch (e) { toast(e.message, 'error'); }
}

let revokeTarget = null;
function openRevoke(certId) {
  revokeTarget = certId;
  $('revokeReason').value = '';
  $('revokeModal').classList.add('open');
}
$('confirmRevoke').onclick = async () => {
  try {
    await API.revokeCertificate(revokeTarget, $('revokeReason').value.trim());
    $('revokeModal').classList.remove('open');
    toast('Certificate revoked.', 'error');
    load();
  } catch (e) { toast(e.message, 'error'); }
};

$('searchBox').addEventListener('input', render);
$('statusFilter').addEventListener('change', render);
$('resetBtn').onclick = () => { $('searchBox').value = ''; $('statusFilter').value = ''; render(); };

/* shared modal helper (same as student page) */
function openModal(title, bodyHtml) {
  let overlay = document.querySelector('.modal-overlay.modal-dyn');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'modal-overlay modal-dyn';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-head"><h3></h3><button class="modal-close">✕</button></div>
        <div class="modal-body"></div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.modal-close').onclick = () => overlay.classList.remove('open');
    overlay.onclick = e => { if (e.target === overlay) overlay.classList.remove('open'); };
  }
  overlay.querySelector('h3').textContent = title;
  overlay.querySelector('.modal-body').innerHTML = bodyHtml;
  overlay.classList.add('open');
}

load();
