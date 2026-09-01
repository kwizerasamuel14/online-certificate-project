/* =====================================================
   certificates.js — student "My Certificates" page.
   Lists generated certificates + own requests, with
   View / Edit / Cancel actions and notifications.
   ===================================================== */

const $ = id => document.getElementById(id);
const user = getCurrentUser() || { role: 'user', name: 'Guest', email: '' };

async function load() {
  /* ---- notifications ---- */
  const db = JSON.parse(localStorage.getItem('ush_cert_db') || '{}');
  const notifs = (db.notifications || []).filter(n => n.email === user.email);
  $('notificationArea').innerHTML = notifs.map(n => `
    <div class="alert alert-success"><strong>${n.title}</strong><br>${n.message}
      <div style="font-size:.78rem;margin-top:4px;opacity:.8">${formatDate(n.date)}</div>
    </div>`).join('');

  /* ---- certificates ---- */
  try {
    const certs = await API.getCertificates({ email: user.email });
    $('certsLoading').style.display = 'none';
    if (!certs.length) { $('certsEmpty').style.display = 'block'; }
    else {
      $('certsList').style.display = 'block';
      $('certsList').innerHTML = `
        <table class="data-table">
          <thead><tr>
            <th>Certificate #</th><th>Course</th><th>Issued</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>${certs.map(c => `
            <tr>
              <td><strong>${c.certificateNumber}</strong></td>
              <td>${c.course}</td>
              <td>${formatDate(c.issueDate)}</td>
              <td>${statusBadge(c.status)}</td>
              <td style="white-space:nowrap">
                <a class="btn btn-sm btn-outline" href="certificate-details.html?id=${c.id}">View</a>
                <button class="btn btn-sm btn-secondary" onclick="downloadCert('${c.id}')">⬇ PDF</button>
                <button class="btn btn-sm btn-ghost" onclick="shareCert('${c.certificateNumber}')">🔗 Share</button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>`;
    }
  } catch (e) {
    $('certsLoading').style.display = 'none';
    $('certsEmpty').innerHTML = `<div class="icon">⚠️</div><p>${e.message}</p>`;
    $('certsEmpty').style.display = 'block';
  }

  /* ---- requests ---- */
  try {
    const reqs = await API.getRequests({ email: user.email });
    $('reqsLoading').style.display = 'none';
    if (!reqs.length) { $('reqsEmpty').style.display = 'block'; return; }
    $('reqsList').style.display = 'block';
    $('reqsList').innerHTML = `
      <table class="data-table">
        <thead><tr>
          <th>Request ID</th><th>Program</th><th>Submitted</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>${reqs.map(r => {
          const editable = r.status === 'pending';
          return `
            <tr>
              <td><strong>${r.id}</strong></td>
              <td>${r.program}</td>
              <td>${formatDate(r.submittedAt)}</td>
              <td>${statusBadge(r.status)}</td>
              <td style="white-space:nowrap">
                <button class="btn btn-sm btn-outline" onclick="viewReq('${r.id}')">View</button>
                ${editable ? `
                  <button class="btn btn-sm btn-secondary" onclick="editReq('${r.id}')">Edit</button>
                  <button class="btn btn-sm btn-danger" onclick="cancelReq('${r.id}')">Cancel</button>`
                : '<span style="color:var(--muted);font-size:.8rem">Locked</span>'}
              </td>
            </tr>`;
        }).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    $('reqsLoading').style.display = 'none';
  }
}

function viewReq(id) {
  API.getRequest(id).then(r => openModal('Certificate Request — ' + r.id, `
    <dl style="display:grid;grid-template-columns:150px 1fr;gap:8px 12px;font-size:.92rem">
      <dt><strong>Name</strong></dt><dd>${r.fullName}</dd>
      <dt><strong>Trainee ID</strong></dt><dd>${r.traineeId}</dd>
      <dt><strong>Program</strong></dt><dd>${r.program}</dd>
      <dt><strong>Period</strong></dt><dd>${formatDate(r.startDate)} → ${formatDate(r.endDate)}</dd>
      <dt><strong>Project</strong></dt><dd>${r.projectName}</dd>
      <dt><strong>Description</strong></dt><dd>${r.projectDescription}</dd>
      <dt><strong>Accomplishments</strong></dt><dd>${r.accomplishments}</dd>
      ${r.workLink ? `<dt><strong>Work link</strong></dt><dd><a href="${r.workLink}" target="_blank">${r.workLink}</a></dd>` : ''}
      ${r.liveLink ? `<dt><strong>Live link</strong></dt><dd><a href="${r.liveLink}" target="_blank">${r.liveLink}</a></dd>` : ''}
      <dt><strong>Status</strong></dt><dd>${statusBadge(r.status)}</dd>
    </dl>`));
}

function editReq(id) {
  location.href = 'request-certificate.html?edit=' + id;
}

async function cancelReq(id) {
  if (!confirm('Cancel this certificate request? This cannot be undone.')) return;
  try {
    await API.cancelRequest(id);
    toast('Request cancelled.');
    load();
  } catch (e) { toast(e.message, 'error'); }
}

async function downloadCert(id) {
  toast('Preparing PDF download…');
  try { await API.generateCertificate(id); toast('Certificate PDF downloaded.'); }
  catch (e) { toast(e.message, 'error'); }
}

function shareCert(number) {
  const url = 'https://upskillshub.com/verify/' + number;
  if (navigator.share) {
    navigator.share({ title: 'My Up Skills Hub Certificate', url }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(url);
    toast('Verification link copied: ' + url);
  }
}

/* ---------- shared modal ---------- */
function openModal(title, bodyHtml) {
  let overlay = document.querySelector('.modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
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
