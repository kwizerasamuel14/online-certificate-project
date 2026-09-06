export default async function run(page, ui) {
  const base = 'https://kwizerasamuel14.github.io/online-certificate-project/';
  const out = {};

  // 1. Trainer login — fullName must be empty on request page
  await page.goto(base + 'login.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.fill('#loginEmail', 'upskillshub.info@gmail.com');
  await page.fill('#loginPassword', 'Trainer1');
  await page.click('#loginBtn');
  await page.waitForURL('**/admin-certificates.html', { timeout: 15000 });
  await page.goto(base + 'request-certificate.html');
  await page.waitForSelector('#fullName', { timeout: 15000 });
  out.trainerNameValue = await page.inputValue('#fullName');

  // 2. User login — prefill works
  await page.goto(base + 'login.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.fill('#loginEmail', 'user@upskillshub.com');
  await page.fill('#loginPassword', 'User1');
  await page.click('#loginBtn');
  await page.waitForURL('**/index.html', { timeout: 15000 });

  // 3. Certificate details — new template present
  await page.goto(base + 'certificate-details.html?id=CERT-00001');
  await page.waitForSelector('.cert-paper', { timeout: 15000 });
  out.hasCertTemplate = true;
  out.certName = await page.locator('#c-name').innerText();
  out.certFooter = (await page.locator('.cert-foot').innerText()).slice(0, 50);
  out.signatures = await page.locator('.cert-sig .sig-line').allInnerTexts();

  await page.evaluate(() => localStorage.clear());
  return out;
}
