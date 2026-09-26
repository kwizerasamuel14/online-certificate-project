import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  fs.readFile(path.join(__dirname, p), (err, data) => {
    if (err) { res.writeHead(404); res.end('nf'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(p).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(8090).on('error', () => {});

export default async function run(page, ui) {
  const base = 'http://localhost:8090/';
  const out = {};

  // Trainer login → should land on All Requested Certificates page
  await page.goto(base + 'login.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.fill('#loginEmail', 'upskillshub.info@gmail.com');
  await page.fill('#loginPassword', 'Trainer1');
  await page.click('#loginBtn');
  await page.waitForURL('**/trainer-certificates.html', { timeout: 15000 });
  await page.waitForSelector('.data-table', { timeout: 15000 });
  out.trainerLandedOnTrainerPage = true;
  out.navHasTrainerLink = (await page.locator('.main-nav').innerText()).includes('All Requested Certificates');

  // Review & Recommend without comment → error, request stays pending
  await page.click('button:has-text("Review & Recommend")');
  await page.waitForSelector('#reviewModal.open', { timeout: 5000 });
  await page.click('#confirmRecommend');
  await page.waitForTimeout(300);
  out.emptyCommentBlocked = await page.locator('#reviewError').isVisible();
  out.errorText = await page.locator('#reviewError').innerText();
  await page.click('#closeReview');

  // Request should still be pending (no trainerReview recorded)
  out.stillPending = await page.evaluate(() => {
    const db = JSON.parse(localStorage.getItem('ush_cert_db'));
    return db.requests.find(r => r.id === 'REQ-00001').status;
  });

  // Review & Recommend with a comment → recommended
  await page.click('button:has-text("Review & Recommend")');
  await page.waitForSelector('#reviewModal.open', { timeout: 5000 });
  await page.fill('#reviewComment', 'Completed all tasks; final project meets the standard. Recommend approval.');
  await page.click('#confirmRecommend');
  await page.waitForTimeout(1200);
  out.statusAfterRecommend = await page.evaluate(() => {
    const db = JSON.parse(localStorage.getItem('ush_cert_db'));
    const r = db.requests.find(x => x.id === 'REQ-00001');
    return { status: r.status, comment: r.trainerReview && r.trainerReview.comment };
  });
  out.rowShowsComment = (await page.locator('.data-table').innerText()).includes('Recommend approval');

  // Admin login → Admin Management; pending request not approvable, recommended is
  await page.goto(base + 'login.html');
  await page.evaluate(() => localStorage.removeItem('ush_current_user'));
  await page.reload();
  // seed: keep existing requests (incl. the recommended one), add a fresh pending one
  await page.evaluate(() => {
    let db = JSON.parse(localStorage.getItem('ush_cert_db'));
    if (!db) db = { nextReqId: 3, nextCertId: 2, nextSeq: 2, requests: [], certificates: [], notifications: [], verificationLogs: [] };
    db.requests.push({ id: 'REQ-00002', fullName: 'Test User', email: 't@e.com', traineeId: 'TID-1',
      program: 'Training Program / Frontend Development', startDate: '2026-01-01', endDate: '2026-02-01',
      projectName: 'P', projectDescription: 'D', accomplishments: 'A', workLink: '', liveLink: '',
      finalReport: null, logbook: null, sourceLink: '', declaration: true, status: 'pending',
      submittedAt: new Date().toISOString() });
    localStorage.setItem('ush_cert_db', JSON.stringify(db));
  });
  await page.fill('#loginEmail', 'clarissenet.info@gmail.com');
  await page.fill('#loginPassword', 'Admin1*');
  await page.click('#loginBtn');
  await page.waitForURL('**/admin-certificates.html', { timeout: 15000 });
  await page.waitForSelector('.data-table', { timeout: 15000 });
  const tableText = await page.locator('.data-table').innerText();
  out.adminHasNoRecommendButton = !(await page.locator('button:has-text("Recommend")').count());
  out.adminSeesAwaitingTrainer = tableText.includes('Awaiting trainer recommendation');
  out.adminApproveCount = await page.locator('button:has-text("Approve & Generate")').count();
  // "All Requested Certificates" must be trainer-only: absent from admin nav
  out.adminNavHidesTrainerLink = !(await page.locator('.main-nav').innerText()).includes('All Requested Certificates');
  // Admin opening the trainer page directly should be denied
  await page.goto(base + 'trainer-certificates.html');
  await page.waitForTimeout(800);
  out.adminBlockedFromTrainerPage = page.url().includes('index.html');
  await page.goto(base + 'admin-certificates.html');
  await page.waitForSelector('.data-table', { timeout: 15000 });

  // Admin view modal shows the trainer comment (open the recommended request's row)
  const viewBtns = page.locator('tr', { hasText: 'REQ-00001' }).locator('button:has-text("View")');
  await viewBtns.first().click();
  await page.waitForSelector('.modal-overlay.open', { timeout: 5000 });
  out.adminSeesTrainerReview = (await page.locator('.modal-overlay.open .modal-body').innerText()).includes('Recommend approval');
  await page.locator('.modal-overlay.open .modal-close').click();

  // API guard: approving a pending request fails
  out.apiPresent = await page.evaluate(() => typeof window.API);
  await page.addScriptTag({ content: `
    (function () {
      const b = document.createElement('button');
      b.id = 'apiGuardTest';
      document.body.appendChild(b);
      API.approveAndGenerate('REQ-00002')
        .then(() => { b.textContent = 'APPROVED — BAD'; })
        .catch(e => { b.textContent = e.message; });
    })();
  ` });
  await page.waitForTimeout(1800);
  out.approvePendingFails = await page.evaluate(() => {
    const el = document.getElementById('apiGuardTest');
    return el ? el.textContent : 'no element';
  });
  out.approvedPendingStayedPending = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('ush_cert_db')).requests.find(r => r.id === 'REQ-00002').status);

  await page.evaluate(() => localStorage.clear());
  server.close();
  return out;
}
