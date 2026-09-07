export default async function run(page) {
  const base = 'file:///C:/Users/ADMIN/Desktop/Project%202%20Internship/';
  // fresh DB
  await page.goto(base + 'login.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(300);

  // seed: approved request + generated certificate
  await page.evaluate(() => {
    const db = JSON.parse(localStorage.getItem('ush_cert_db') || '{}');
    db.requests = db.requests || [];
    db.certificates = db.certificates || [];
    db.requests.push({
      id: 'REQ-00001', fullName: 'Test Student', email: 'user@upskillshub.com',
      traineeId: 'TR-001', program: 'Academic Internship / Software Engineering',
      startDate: '2026-01-05', endDate: '2026-03-30', projectName: 'Capstone',
      projectDescription: 'x', accomplishments: 'y', status: 'approved',
      submittedAt: new Date().toISOString(),
    });
    db.certificates.push({
      id: 'CERT-00001', certificateNumber: 'USH-2026-SE-000001',
      requestRef: 'REQ-00001', studentName: 'Test Student',
      studentEmail: 'user@upskillshub.com', studentId: 'TR-001',
      course: 'Academic Internship / Software Engineering',
      startDate: '2026-01-05', endDate: '2026-03-30',
      issueDate: '2026-06-01', status: 'generated',
      verifyUrl: 'https://upskillshub.com/verify/USH-2026-SE-000001',
    });
    localStorage.setItem('ush_cert_db', JSON.stringify(db));
  });

  // login as admin
  await page.fill('#loginEmail', 'clarissenet.info@gmail.com');
  await page.fill('#loginPassword', 'Admin1*');
  await page.click('#loginBtn');
  await page.waitForTimeout(1500);
  await page.goto(base + 'admin-certificates.html');
  await page.waitForSelector('table.data-table', { timeout: 8000 });
  await page.waitForTimeout(700);

  // capture real Playwright download instead of guessing
  const dlPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);

  const btn = page.locator('button:has-text("Generate PDF")').first();
  await btn.click();
  const download = await dlPromise;
  await page.waitForTimeout(800);

  const toast = await page.evaluate(() => document.getElementById('toast')?.textContent || '');
  const jsPdf = await page.evaluate(() => typeof window.jspdf !== 'undefined');
  return {
    jsPdf,
    downloadFired: !!download,
    suggestedFilename: download ? download.suggestedFilename() : null,
    toast,
  };
}
