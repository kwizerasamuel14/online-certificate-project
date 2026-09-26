import fs from 'fs';

export default async function run(page, ui) {
  const base = process.env.QA_BASE || 'https://kwizerasamuel14.github.io/online-certificate-project/';
  const out = {};

  // Open certificate details (public page) for CERT-00001
  await page.goto(base + 'certificate-details.html?id=CERT-00001');
  await page.waitForSelector('.cert-paper', { timeout: 20000 });
  await page.waitForTimeout(1500); // let the transparent logo swap in
  const paper = page.locator('.cert-paper');
  await paper.screenshot({ path: 'qa-online-cert.png' });
  out.onlineShot = true;

  // Trigger the PDF download and save it
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 20000 }),
    page.click('#btnDownload'),
  ]);
  await download.saveAs('qa-download.pdf');
  out.pdfBytes = fs.statSync('qa-download.pdf').size;
  return out;
}
