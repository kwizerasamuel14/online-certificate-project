export default async function run(page) {
  const results = {};
  const login = 'file:///C:/Users/ADMIN/Desktop/Project%202%20Internship/login.html';
  const admin = 'file:///C:/Users/ADMIN/Desktop/Project%202%20Internship/admin-certificates.html';
  const fresh = async () => {
    await page.goto(login);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(300);
  };
  const tryNav = async (email, pass, role) => {
    await fresh();
    await page.fill('#loginEmail', email);
    await page.fill('#loginPassword', pass);
    await page.click('#loginBtn');
    await page.waitForTimeout(1500);
    const navHasAdmin = await page.evaluate(() =>
      [...document.querySelectorAll('.main-nav a')].some(a => a.textContent.includes('Admin Management')));
    await page.goto(admin);
    await page.waitForTimeout(900);
    const landedAdmin = page.url().includes('admin-certificates.html');
    results[role] = { navHasAdmin, canOpenAdminPage: landedAdmin };
  };

  await tryNav('user@upskillshub.com', 'User1', 'user');
  await tryNav('upskillshub.info@gmail.com', 'Trainer1', 'trainer');
  await tryNav('clarissenet.info@gmail.com', 'Admin1*', 'admin');

  await page.evaluate(() => localStorage.clear());
  return results;
}
