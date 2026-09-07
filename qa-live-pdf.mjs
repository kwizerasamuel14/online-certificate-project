export default async function run(page) {
  const base = 'https://kwizerasamuel14.github.io/online-certificate-project/';
  await page.fill('#loginEmail', 'clarissenet.info@gmail.com');
  await page.fill('#loginPassword', 'Admin1*');
  await page.click('#loginBtn');
  await page.waitForTimeout(2000);
  await page.goto(base + 'admin-certificates.html');
  await page.waitForSelector('table.data-table', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500);

  const lib = await page.evaluate(() => typeof window.jspdf);
  const pdfFn = await page.evaluate(() => typeof downloadCertificatePDF);
  const rows = await page.locator('table.data-table tbody tr').count().catch(() => 0);
  if (!rows) return { lib, pdfFn, rows, body: (await page.locator('body').innerText()).slice(0, 400) };

  const dl = page.waitForEvent('download', { timeout: 12000 }).catch(() => null);
  await page.locator('button:has-text("Generate PDF")').first().click();
  const download = await dl;
  await page.waitForTimeout(800);
  const toast = await page.evaluate(() => document.getElementById('toast')?.textContent || '');
  return { lib, pdfFn, rows, downloadFired: !!download, filename: download ? download.suggestedFilename() : null, toast };
}
