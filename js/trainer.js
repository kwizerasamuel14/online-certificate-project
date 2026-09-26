/* =====================================================
   trainer.js — Trainer: All Requested Certificates.
   The trainer reviews each pending request, writes a
   mandatory comment, then recommends it. Admin can only
   approve requests that the trainer has recommended.
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
    r.program.toLowerCase().includes(q));

  if (!rows.length) { $('listEmpty').style.display = 'block'; return; }
  $('listWrap').style.display = 'block';

  $('listWrap').innerHTML = `
    <table class="data-table">
      <thead><tr>
        <th>Request</th><th>Student</th><th>Program</th><th>Status</th><th>My Comment</th><th>Actions</th>
      </tr></thead>
      <tbody>${rows.map(r => {
        const review = r.trainerReview;
        const actions = [];
        actions.push(`<button class="btn btn-sm btn-outline" onclick="viewReq('${r.id}')">View</button>`);
        if (r.status === 'pending')
          actions.push(`<button class="btn btn-sm btn-primary" onclick="openReview('${r.id}')">🧑‍🏫 Review &amp; Recommend</button>`);
        if (r.status === 'recommended')
          actions.push(`<span style="font-size:.82rem;color:var(--muted)">Waiting for admin approval</span>`);
        return `
          <tr>
            <td><strong>${r.id}</strong><br>
                <span style="font-size:.78rem;color:var(--muted)">${formatDate(r.submittedAt)}</span></td>
            <td>${r.fullName}<br><span style="font-size:.78rem;color:var(--muted)">${r.email || ''}</span><br><span style="font-size:.78rem;color:var(--muted)">${r.traineeId}</span></td>
            <td style="max-width:200px">${r.program}</td>
            <td>${statusBadge(r.status)}</td>
            <td style="max-width:220px;font-size:.85rem">${review ? escapeHtml(review.comment) : '<span style="color:var(--muted)">—</span>'}</td>
            <td style="white-space:nowrap">
              <div style="display:flex;gap:6px;flex-wrap:wrap">${actions.join('')}</div>
            </td>
          </tr>`;
      }).join('')}
      </tbody>
    </table>`;
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function viewReq(id) {
  const r = records.find(x => x.id === id);
  if (!r) return;
  const review = r.trainerReview;
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
      ${review ? `<dt><strong>My review</strong></dt><dd>${escapeHtml(review.comment)}<br>
        <span style="font-size:.78rem;color:var(--muted)">— ${review.reviewedBy}, ${formatDate(review.reviewedAt)}</span></dd>` : ''}
    </dl>`);
}

/* ---------- Review & Recommend modal ---------- */
let reviewTarget = null;
function openReview(id) {
  const r = records.find(x => x.id === id);
  if (!r) return;
  reviewTarget = id;
  $('reviewError').style.display = 'none';
  $('reviewComment').value = '';
  $('reviewModal').classList.add('open');
  setTimeout(() => $('reviewComment').focus(), 50);
}
$('closeReview').onclick = () => $('reviewModal').classList.remove('open');
$('confirmRecommend').onclick = async () => {
  const comment = $('reviewComment').value.trim();
  if (!comment) {
    $('reviewError').textContent = 'A review comment is required before you can recommend this request.';
    $('reviewError').style.display = 'block';
    return;
  }
  try {
    await API.recommendRequest(reviewTarget, comment);
    $('reviewModal').classList.remove('open');
    toast('Request reviewed & recommended — waiting for admin approval.');
    load();
  } catch (e) {
    $('reviewError').textContent = e.message;
    $('reviewError').style.display = 'block';
  }
};

$('searchBox').addEventListener('input', render);
$('statusFilter').addEventListener('change', render);
$('resetBtn').onclick = () => { $('searchBox').value = ''; $('statusFilter').value = ''; render(); };

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
