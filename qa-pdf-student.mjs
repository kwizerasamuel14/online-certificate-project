export default async function run(page) {
  const base = 'file:///C:/Users/ADMIN/Desktop/Project%202%20Internship/';
  // login as student (cert CERT-00001 was seeded for this email)
  await page.goto(base + 'login.html');
  await page.evaluate(() => {
    for (const k of Object.keys(localStorage)) if (k.toLowerCase().includes('user') || k.toLowerCase().includes('session') || k.toLowerCase().includes('auth')) localStorage.removeItem(k);
    for (const k of Object.keys(sessionStorage)) sessionStorage.removeItem(k);
  });
  await page.reload();
  await page.waitForTimeout(600);
  await page.fill('#loginEmail', 'user@upskillshub.com');
  await page.fill('#loginPassword', 'User1');
  await page.click('#loginBtn');
  await page.waitForTimeout(1200);
  await page.goto(base + 'my-certificates.html');
  await page.waitForSelector('table.data-table', { timeout: 8000 });
  await page.waitForTimeout(600);

  const dl = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
  await page.locator('button:has-text("PDF")').first().click();
  const download = await dl;

  const toast = await page.evaluate(() => document.getElementById('toast')?.textContent || '');
  return {
    downloadFired: !!download,
    suggestedFilename: download ? download.suggestedFilename() : null,
    toast,
  };
}
