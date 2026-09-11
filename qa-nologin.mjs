import puppeteer from 'puppeteer';

const base = 'file:///C:/Users/ADMIN/Desktop/Project%202%20Internship/';
const results = {};

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

async function staffLogin(email, password) {
  await page.goto(base + 'login.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.type('#loginEmail', email);
  await page.type('#loginPassword', password);
  await page.click('#loginBtn');
  await new Promise(r => setTimeout(r, 1600));
}

// 1. Home as guest: Staff Login link present, guest-only tiles hidden
await page.goto(base + 'index.html');
await page.evaluate(() => localStorage.clear());
await page.reload();
results.staffLoginLinkVisible = await page.evaluate(() =>
  !!document.querySelector('.staff-login-link') &&
  document.querySelector('.staff-login-link').href.includes('login.html'));
results.guestTilesHidden = await page.evaluate(() => {
  const mine = document.getElementById('tileMine');
  const adm = document.getElementById('tileAdmin');
  return mine.style.display === 'none' && adm.style.display === 'none';
});

// 2. Login page: only Trainer & Admin tabs, User tab gone
await page.goto(base + 'login.html');
await page.reload();
results.userTabRemoved = await page.evaluate(() => {
  const tabs = [...document.querySelectorAll('.login-tabs button')].map(b => b.dataset.role);
  return tabs.includes('trainer') && tabs.includes('admin') && !tabs.includes('user');
});

// 3. Old User credentials must NOT work anymore
await staffLogin('user@upskillshub.com', 'User1');
results.userLoginBlocked = !page.url().includes('index.html') &&
  await page.evaluate(() => document.getElementById('loginError').style.display === 'block');

// 4. Trainer credentials from supervisor work
await staffLogin('upskillshub.info@gmail.com', 'Trainer1');
results.trainerLoginWorks = page.url().includes('admin-certificates.html');

// 5. Trainer can change password (then restore it)
await staffLogin('upskillshub.info@gmail.com', 'Trainer1');
await page.goto(base + 'login.html');  // logged-in staff sees the change-password form
await new Promise(r => setTimeout(r, 500));
await page.type('#currentPassword', 'Trainer1');
await page.type('#newPassword', 'Trainer2');
await page.type('#confirmPassword', 'Trainer2');
await page.click('#changeForm button[type=submit]');
await new Promise(r => setTimeout(r, 1600));
results.trainerPasswordChanged = await page.evaluate(() =>
  localStorage.getItem('ush_accounts')?.includes('Trainer2'));
// restore original
await page.goto(base + 'login.html');
await new Promise(r => setTimeout(r, 500));
await page.type('#currentPassword', 'Trainer2');
await page.type('#newPassword', 'Trainer1');
await page.type('#confirmPassword', 'Trainer1');
await page.click('#changeForm button[type=submit]');
await new Promise(r => setTimeout(r, 1600));

// 6. Admin credentials from supervisor work
await staffLogin('clarissenet.info@gmail.com', 'Admin1*');
results.adminLoginWorks = page.url().includes('admin-certificates.html');
await page.goto(base + 'index.html');
await page.reload();
results.adminTileShownForAdmin = await page.evaluate(() => {
  const adm = document.getElementById('tileAdmin');
  return adm && adm.style.display !== 'none';
});

// 7. Guest: request page public, gated pages still locked
await page.evaluate(() => localStorage.clear());
await page.goto(base + 'request-certificate.html');
results.requestPagePublic = !page.url().includes('login.html');
await page.goto(base + 'my-certificates.html');
results.mineStillGated = page.url().includes('login.html');
await page.goto(base + 'admin-certificates.html');
results.adminStillGated = page.url().includes('login.html');

results.jsErrors = errors;
console.log(JSON.stringify(results, null, 2));
await browser.close();
const bad = Object.values(results).filter(v => v === false || (Array.isArray(v) && v.length));
process.exit(bad.length ? 1 : 0);
