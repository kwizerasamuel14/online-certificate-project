export default async function run(page, ui) {
  const base = 'file:///C:/Users/ADMIN/Desktop/Project%202%20Internship/';
  // login as user
  await page.goto(base + 'login.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.fill('#loginEmail', 'user@upskillshub.com');
  await page.fill('#loginPassword', 'User1');
  await page.click('#loginBtn');
  await page.waitForURL('**/index.html', { timeout: 8000 });

  // open the certificate details page
  await page.goto(base + 'certificate-details.html?id=CERT-00001');
  await page.waitForSelector('.cert-paper', { timeout: 8000 });
  await page.waitForTimeout(800); // fonts + QR
  await page.evaluate(() => localStorage.clear());

  // sanity assertions
  return {
    name: await page.locator('#c-name').innerText(),
    course: await page.locator('#c-course').innerText(),
    number: await page.locator('#c-number').innerText(),
    start: await page.locator('#c-start').innerText(),
    end: await page.locator('#c-end').innerText(),
    signatures: await page.locator('.cert-sig .sig-line').allInnerTexts(),
    footer: (await page.locator('.cert-foot').innerText()).slice(0, 60),
  };
}
