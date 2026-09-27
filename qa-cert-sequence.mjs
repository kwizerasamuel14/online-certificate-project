/* QA: certificate number must be unique and increment per generation.
   Reproduces the supervisor's bug: previously every cert got ...-000002. */
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
}).listen(8091).on('error', () => {});

export default async function run(page, ui) {
  const base = 'http://localhost:8091/';
  const out = {};

  await page.goto(base + 'login.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.fill('#loginEmail', 'clarissenet.info@gmail.com');
  await page.fill('#loginPassword', 'Admin1*');
  await page.click('#loginBtn');
  await page.waitForURL('**/admin-certificates.html', { timeout: 15000 });

  // Seed a DB with one existing certificate ...-000001 and nextSeq: 2,
  // plus three trainer-recommended requests ready for approval.
  await page.evaluate(() => {
    if (!localStorage.getItem('ush_cert_db')) {
      localStorage.setItem('ush_cert_db', JSON.stringify({ nextReqId: 20, nextCertId: 2, nextSeq: 2, requests: [], certificates: [], notifications: [], verificationLogs: [] }));
    }
    const db = JSON.parse(localStorage.getItem('ush_cert_db'));
    db.certificates.push({
      id: 'CERT-00001', certificateNumber: 'USH-2026-MO-000001', requestRef: 'REQ-00000',
      studentName: 'Aline Uwase', studentEmail: 'aline.uwase@example.com',
      studentId: 'USH-TRA-2026-00118', course: 'Training Program / Power BI & Data Analysis',
      startDate: '2026-01-05', endDate: '2026-02-28', issueDate: '2026-06-01',
      status: 'generated', verifyUrl: 'https://upskillshub.com/verify/USH-2026-MO-000001',
    });
    const mk = (id, email, name) => ({
      id, fullName: name, email, traineeId: 'USH-INT-2026-0099' + id.slice(-1),
      program: 'Training Program / Microsoft Office', startDate: '2026-01-01', endDate: '2026-02-01',
      projectName: 'P', projectDescription: 'D', accomplishments: 'A', workLink: '', liveLink: '',
      finalReport: null, logbook: null, sourceLink: '', declaration: true, status: 'recommended',
      submittedAt: new Date().toISOString(),
    });
    db.requests.push(mk('REQ-00010', 'a@t.com', 'Student A'));
    db.requests.push(mk('REQ-00011', 'b@t.com', 'Student B'));
    db.requests.push(mk('REQ-00012', 'c@t.com', 'Student C'));
    localStorage.setItem('ush_cert_db', JSON.stringify(db));
  });
  await page.reload();
  await page.waitForSelector('.data-table', { timeout: 15000 });

  // Approve all three recommended requests.
  const approveBtns = page.locator('button:has-text("Approve & Generate")');
  const count = await approveBtns.count();
  for (let i = 0; i < count; i++) {
    await approveBtns.first().click();
    await page.waitForTimeout(1600); // API delay is 800ms
  }

  out.issuedNumbers = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('ush_cert_db')).certificates.map(c => c.certificateNumber));
  out.storedNextSeq = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('ush_cert_db')).nextSeq);
  out.allUnique = new Set(out.issuedNumbers).size === out.issuedNumbers.length;
  out.incrementing = out.issuedNumbers.filter(n => n.startsWith('USH-2026-MO-')).map(n => Number(n.split('-').pop()));

  // Reload the page (fresh read from localStorage) — numbers must stay stable/unique
  await page.reload();
  await page.waitForSelector('.data-table', { timeout: 15000 });
  out.afterReload = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('ush_cert_db')).certificates.map(c => c.certificateNumber));

  await page.evaluate(() => localStorage.clear());
  server.close();
  return out;
}
