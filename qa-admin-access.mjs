export default async function run(page, ui) {
  const results = {};
  const login = 'file:///C:/Users/ADMIN/Desktop/Project%202%20Internship/login.html';
  const admin = 'file:///C:/Users/ADMIN/Desktop/Project%202%20Internship/admin-certificates.html';

  // Login as regular User
  await page.goto(login);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.fill('#loginEmail', 'user@upskillshub.com');
  await page.fill('#loginPassword', 'User1');
  await page.click('#loginBtn');
  await page.waitForURL('**/index.html', { timeout: 8000 });
  await page.waitForTimeout(400);

  // 1. Is "Admin Management" in the nav?
  results.navShowsAdminManagement = await page.evaluate(() =>
    [...document.querySelectorAll('.main-nav a')].some(a => a.textContent.includes('Admin Management')));

  // 2. Direct URL access attempt
  await page.goto(admin);
  await page.waitForTimeout(800);
  results.redirectedAwayFromAdmin = !page.url().includes('admin-certificates.html');
  results.landedOn = page.url().split('/').pop();
  results.userStillLoggedIn = await page.evaluate(() =>
    !!JSON.parse(localStorage.getItem('ush_current_user') || 'null'));
  await page.waitForURL('**/index.html', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(900);
  results.toastShown = await page.evaluate(() => {
    const el = document.getElementById('toast');
    return el ? el.textContent : 'no element';
  });
  results.adminTableVisible = await page.evaluate(() => {
    const el = document.getElementById('listWrap');
    return el ? getComputedStyle(el).display !== 'none' && el.innerHTML.trim().length > 0 : false;
  }).catch(() => 'page changed');

  // Not-logged-in visitor should go to login page
  await page.evaluate(() => localStorage.removeItem('ush_current_user'));
  await page.goto(admin);
  await page.waitForTimeout(600);
  results.anonymousRedirectedToLogin = page.url().includes('login.html');

  await page.evaluate(() => localStorage.clear());
  return results;
}
