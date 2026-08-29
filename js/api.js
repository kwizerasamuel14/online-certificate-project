/* =====================================================
   Up Skills Hub — Online Certificate Module
   api.js — API layer for all certificate endpoints.

   HOW TO CONNECT THE REAL BACKEND:
   Set API_CONFIG.baseUrl to the backend server root and
   implement the listed endpoints. Until then, mock data
   (data/mock-data.js) is served with simulated latency
   so the full UI flow works offline.
   ===================================================== */

const API_CONFIG = {
  // e.g. 'https://api.upskillshub.com/v1'
  baseUrl: null,
  useMock: true,
  latency: 500, // simulated network delay (ms)
};

const ENDPOINTS = {
  certificates:    '/certificates',          // GET list, POST create
  certificate:     '/certificates/:id',      // GET one, PUT update, DELETE
  generate:        '/certificates/:id/generate', // POST -> PDF + QR
  revoke:          '/certificates/:id/revoke',   // POST
  download:        '/certificates/:id/download', // GET -> PDF
  verify:          '/verify/:certificateNumber', // GET public
  sendEmail:       '/certificates/:id/email',    // POST
  requests:        '/certificate-requests',      // POST trainee submission
};

/* ---------- helpers ---------- */
const delay = (ms = API_CONFIG.latency) => new Promise(r => setTimeout(r, ms));

function store() {
  if (!localStorage.getItem('ush_cert_db')) {
    localStorage.setItem('ush_cert_db', JSON.stringify(MOCK_DB));
  }
  return JSON.parse(localStorage.getItem('ush_cert_db'));
}
function save(db) { localStorage.setItem('ush_cert_db', JSON.stringify(db)); }

const STATUS_LABELS = {
  pending: 'Pending Review',
  recommended: 'Trainer Recommended',
  approved: 'Approved',
  generated: 'Certificate Generated',
  revoked: 'Revoked',
  cancelled: 'Cancelled',
};

function statusBadge(status) {
  const label = STATUS_LABELS[status] || status;
  return `<span class="badge badge-${status}">${label}</span>`;
}

function toast(message, type = 'success') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.className = `show ${type}`;
  setTimeout(() => (el.className = ''), 3200);
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ---------- The API object ---------- */
const API = {

  /** POST /certificate-requests — trainee/intern submits the request form */
  async submitRequest(formData) {
    await delay();
    const db = store();
    const programCode = (formData.program || '').split('/').pop().trim();
    const request = {
      id: 'REQ-' + String(db.nextReqId++).padStart(5, '0'),
      ...formData,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      traineeEmail: formData.email,
    };
    db.requests.push(request);
    save(db);
    return request;
  },

  /** GET /certificate-requests — list (trainee sees own, admin sees all) */
  async getRequests(filter = {}) {
    await delay();
    let requests = store().requests;
    if (filter.email) requests = requests.filter(r => r.email === filter.email);
    return [...requests].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  },

  /** GET /certificate-requests/:id */
  async getRequest(id) {
    await delay();
    const r = store().requests.find(x => x.id === id);
    if (!r) throw new Error('Request not found');
    return { ...r };
  },

  /** PUT /certificate-requests/:id — editable only while pending */
  async updateRequest(id, changes) {
    await delay();
    const db = store();
    const r = db.requests.find(x => x.id === id);
    if (!r) throw new Error('Request not found');
    if (r.status !== 'pending') throw new Error('Request can only be edited while Pending Review.');
    Object.assign(r, changes);
    save(db);
    return { ...r };
  },

  /** PUT /certificate-requests/:id/cancel */
  async cancelRequest(id) {
    await delay();
    const db = store();
    const r = db.requests.find(x => x.id === id);
    if (!r) throw new Error('Request not found');
    if (r.status !== 'pending') throw new Error('Only pending requests can be cancelled.');
    r.status = 'cancelled';
    save(db);
    return { ...r };
  },

  /* ---- Trainer / Admin workflow ---- */

  /** POST — trainer recommends a pending request */
  async recommendRequest(id) {
    await delay();
    const db = store();
    const r = db.requests.find(x => x.id === id);
    if (!r || r.status !== 'pending') throw new Error('Only pending requests can be recommended.');
    r.status = 'recommended';
    r.recommendedAt = new Date().toISOString();
    save(db);
    return { ...r };
  },

  /** POST — admin approves a recommended request and generates the certificate */
  async approveAndGenerate(id) {
    await delay(800);
    const db = store();
    const r = db.requests.find(x => x.id === id);
    if (!r || r.status !== 'recommended') throw new Error('Only trainer-recommended requests can be approved.');
    r.status = 'approved';
    r.approvedAt = new Date().toISOString();

    const cert = {
      id: 'CERT-' + String(db.nextCertId++).padStart(5, '0'),
      certificateNumber: CertificateNumber.generate(r),
      requestRef: r.id,
      studentName: r.fullName,
      studentEmail: r.email,
      studentId: r.traineeId,
      course: r.program,
      startDate: r.startDate,
      endDate: r.endDate,
      issueDate: new Date().toISOString().slice(0, 10),
      status: 'generated',
      verifyUrl: '',
    };
    cert.verifyUrl = `https://upskillshub.com/verify/${cert.certificateNumber}`;
    db.certificates.push(cert);
    db.notifications.push({
      id: 'N' + Date.now(),
      email: cert.studentEmail,
      title: '🎓 Your certificate is ready!',
      message: `Congratulations ${cert.studentName}! Your certificate ${cert.certificateNumber} has been generated and is available for download.`,
      date: new Date().toISOString(),
      read: false,
    });
    save(db);
    return cert;
  },

  /** POST — admin revokes a certificate */
  async revokeCertificate(id, reason) {
    await delay();
    const db = store();
    const c = db.certificates.find(x => x.id === id);
    if (!c) throw new Error('Certificate not found');
    c.status = 'revoked';
    c.revokeReason = reason || 'Revoked by administrator';
    save(db);
    return { ...c };
  },

  /** POST — admin re-generates PDF for an approved/generated certificate */
  async generateCertificate(id) {
    await delay(800);
    const db = store();
    const c = db.certificates.find(x => x.id === id);
    if (!c) throw new Error('Certificate not found');
    c.status = 'generated';
    save(db);
    return { ...c };
  },

  /* ---- Student certificates ---- */

  /** GET /certificates?email= — student's certificates */
  async getCertificates(filter = {}) {
    await delay();
    let certs = store().certificates;
    if (filter.email) certs = certs.filter(c => c.studentEmail === filter.email);
    if (filter.q) {
      const q = filter.q.toLowerCase();
      certs = certs.filter(c =>
        c.studentName.toLowerCase().includes(q) ||
        c.certificateNumber.toLowerCase().includes(q) ||
        c.course.toLowerCase().includes(q));
    }
    return [...certs].sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));
  },

  /** GET /certificates/:id */
  async getCertificate(id) {
    await delay();
    const c = store().certificates.find(x => x.id === id || x.certificateNumber === id);
    if (!c) throw new Error('Certificate not found');
    return { ...c };
  },

  /** GET /verify/:certificateNumber — public verification */
  async verifyCertificate(number) {
    await delay();
    const db = store();
    const c = db.certificates.find(
      x => x.certificateNumber.toLowerCase() === String(number).trim().toLowerCase());
    // verification log
    db.verificationLogs.push({
      number, time: new Date().toISOString(),
      result: c ? c.status : 'not_found',
    });
    save(db);
    if (!c) return { found: false };
    return { found: true, certificate: { ...c } };
  },

  /** POST /certificates/:id/email — send certificate by email */
  async sendByEmail(id) {
    await delay(900);
    const c = store().certificates.find(x => x.id === id);
    if (!c) throw new Error('Certificate not found');
    return { sent: true, email: c.studentEmail };
  },
};

/* ---------- Certificate number generator ----------
   Format: USH-YEAR-XX-000001  (XX = program prefix) */
const CertificateNumber = {
  prefixes: {
    'Cybersecurity & Ethical Hacking': 'CEH', 'Frontend Development': 'FD',
    'Backend Development': 'BD', 'Full-Stack Development': 'FS',
    'Mobile App Development': 'MA', 'Programming with Python': 'PY',
    'Digital Marketing & SEO': 'DM', 'Web Design': 'WD',
    'Graphic & UI/UX Design': 'GX', 'Microsoft Office': 'MO',
    'Power BI & Data Analysis': 'PB', 'Project Management': 'PM',
    'Artificial Intelligence (AI)': 'AI', 'AI Engineering': 'AIE',
    'Machine Learning': 'ML', 'Copy Writing': 'CW',
    'Multimedia and Videography': 'MV', 'English Language': 'EN',
    'French Language': 'FR', 'Kiswahili Language': 'SW',
    'Kinyarwanda Language': 'RW', 'IELTS': 'IE', 'TOEFL': 'TF',
    'Duolingo English Test': 'DE', 'TCF Canada': 'TC', 'GMAT': 'GM',
    'SAT': 'SA', 'DELF / DALF': 'DE', 'Software Engineering': 'SE',
    'Information Technology (IT)': 'IT', 'Business Information Technology (BIT)': 'BI',
    'Computer Science': 'CS', 'Digital Marketing': 'DM', 'Graphic Design': 'GD',
    'Data Analysis': 'DA', 'Business Administration': 'BA', 'Finance': 'FI',
    'Public Administration': 'PA', 'Education': 'ED', 'Health Sciences': 'HS',
    'Hospitality': 'HO', 'Other Fields': 'OT',
  },
  codeFor(program) {
    if (!program) return 'GN';
    return this.prefixes[program.split('/').pop().trim()] || 'GN';
  },
  generate(request) {
    const year = new Date().getFullYear();
    const db = JSON.parse(localStorage.getItem('ush_cert_db'));
    const seq = String(db.nextSeq++).padStart(6, '0');
    return `USH-${year}-${this.codeFor(request.program)}-${seq}`;
  },
};

/* ---------- Program list (from supervisor's document) ---------- */
const PROGRAMS = {
  '🎓 Training Programs': [
    'Training Program / Cybersecurity & Ethical Hacking', 'Training Program / Frontend Development',
    'Training Program / Backend Development', 'Training Program / Full-Stack Development',
    'Training Program / Mobile App Development', 'Training Program / Programming with Python',
    'Training Program / Digital Marketing & SEO', 'Training Program / Web Design',
    'Training Program / Graphic & UI/UX Design', 'Training Program / Microsoft Office',
    'Training Program / Power BI & Data Analysis', 'Training Program / Project Management',
    'Training Program / Artificial Intelligence (AI)', 'Training Program / AI Engineering',
    'Training Program / Machine Learning', 'Training Program / Copy Writing',
    'Training Program / Multimedia and Videography',
  ],
  '🌍 Language & Exam Programs': [
    'Language Program / English Language', 'Language Program / French Language',
    'Language Program / Kiswahili Language', 'Language Program / Kinyarwanda Language',
    'Exam Preparation / IELTS', 'Exam Preparation / TOEFL',
    'Exam Preparation / Duolingo English Test', 'Exam Preparation / TCF Canada',
    'Exam Preparation / GMAT', 'Exam Preparation / SAT', 'Exam Preparation / DELF / DALF',
  ],
  '💻 Academic Internship': [
    'Academic Internship / Software Engineering', 'Academic Internship / Information Technology (IT)',
    'Academic Internship / Business Information Technology (BIT)', 'Academic Internship / Computer Science',
    'Academic Internship / Frontend Development', 'Academic Internship / Backend Development',
    'Academic Internship / Full-Stack Development', 'Academic Internship / Mobile App Development',
    'Academic Internship / Digital Marketing', 'Academic Internship / Graphic Design',
    'Academic Internship / Data Analysis', 'Academic Internship / Web Design',
    'Academic Internship / Microsoft Office', 'Academic Internship / Multimedia and Videography',
    'Academic Internship / Business Administration', 'Academic Internship / Finance',
    'Academic Internship / Public Administration', 'Academic Internship / Power BI & Data Analysis',
    'Academic Internship / Project Management', 'Academic Internship / Education',
    'Academic Internship / Health Sciences', 'Academic Internship / Hospitality',
    'Academic Internship / Other Fields',
  ],
};

function populateProgramSelect(selectEl) {
  selectEl.innerHTML = '<option value="">— Select your program / course —</option>';
  for (const [group, items] of Object.entries(PROGRAMS)) {
    const og = document.createElement('optgroup');
    og.label = group;
    items.forEach(p => {
      const o = document.createElement('option');
      o.value = p; o.textContent = p;
      og.appendChild(o);
    });
    selectEl.appendChild(og);
  }
}
