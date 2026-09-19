/* injected into the page's MAIN world — runs the PDF generator and reports result */
(function () {
  const cert = {
    id: 'CERT-TEST', certificateNumber: 'USH-2026-SE-000001', requestRef: 'REQ-00001',
    studentName: 'Test Student', studentEmail: 'student1@test.com',
    course: 'Academic Internship / Software Engineering',
    startDate: '2026-01-05', endDate: '2026-02-28', issueDate: '2026-03-01',
    status: 'generated', verifyUrl: 'https://upskillshub.com/verify/USH-2026-SE-000001',
  };
  window.__pdfResult = { done: false };
  window.jspdf.jsPDF.prototype.save = () => {};   // stub download
  downloadCertificatePDF(cert)
    .then(() => { window.__pdfResult = { done: true, ok: true }; })
    .catch(e => { window.__pdfResult = { done: true, ok: false, error: e.message }; });
})();

/* write result into the DOM (readable from the isolated world) */
(function poll() {
  let n = 0;
  const t = setInterval(() => {
    const r = window.__pdfResult;
    if ((r && r.done) || n++ > 40) {
      clearInterval(t);
      let el = document.getElementById('__qaResult');
      if (!el) { el = document.createElement('div'); el.id = '__qaResult'; document.body.appendChild(el); }
      el.textContent = JSON.stringify(r);
    }
  }, 250);
})();
