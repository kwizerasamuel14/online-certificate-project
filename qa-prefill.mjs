export default async function run(page, ui) {
  const base = 'file:///C:/Users/ADMIN/Desktop/Project%202%20Internship/';
  await page.goto(base + 'login.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // login as TRAINER — the account whose name was leaking into the field
  await page.fill('#loginEmail', 'upskillshub.info@gmail.com');
  await page.fill('#loginPassword', 'Trainer1');
  await page.click('#loginBtn');
  await page.waitForURL('**/admin-certificates.html', { timeout: 8000 });

  await page.goto(base + 'request-certificate.html');
  await page.waitForSelector('#fullName', { timeout: 8000 });

  const trainerNameValue = await page.inputValue('#fullName');

  // now as USER — prefill should still work
  await page.goto(base + 'login.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.fill('#loginEmail', 'user@upskillshub.com');
  await page.fill('#loginPassword', 'User1');
  await page.click('#loginBtn');
  await page.waitForURL('**/index.html', { timeout: 8000 });

  await page.goto(base + 'request-certificate.html');
  await page.waitForSelector('#fullName', { timeout: 8000 });
  const userNameValue = await page.inputValue('#fullName');

  await page.evaluate(() => localStorage.clear());
  return { trainerNameValue, userNameValue };
}
