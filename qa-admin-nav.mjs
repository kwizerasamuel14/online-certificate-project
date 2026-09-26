export default async function run(page, ui) {
  const base = 'https://kwizerasamuel14.github.io/online-certificate-project/';
  const out = {};

  // Admin login
  await page.goto(base + 'login.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.fill('#loginEmail', 'clarissenet.info@gmail.com');
  await page.fill('#loginPassword', 'Admin1*');
  await page.click('#loginBtn');
  await page.waitForURL('**/admin-certificates.html', { timeout: 15000 });
  await page.waitForSelector('.data-table', { timeout: 15000 });
  const navText = await page.locator('.main-nav').innerText();
  out.adminNavLinks = navText.replace(/\n/g, ' | ');
  out.adminNavHidesTrainerLink = !navText.includes('All Requested Certificates');

  // Trainer still sees it
  await page.goto(base + 'login.html');
  await page.evaluate(() => localStorage.removeItem('ush_current_user'));
  await page.reload();
  await page.fill('#loginEmail', 'upskillshub.info@gmail.com');
  await page.fill('#loginPassword', 'Trainer1');
  await page.click('#loginBtn');
  await page.waitForURL('**/trainer-certificates.html', { timeout: 15000 });
  await page.waitForSelector('.data-table', { timeout: 15000 });
  out.trainerNavHasLink = (await page.locator('.main-nav').innerText()).includes('All Requested Certificates');

  await page.evaluate(() => localStorage.clear());
  return out;
}
