import puppeteer from 'puppeteer';

const base = 'file:///C:/Users/ADMIN/Desktop/Project%202%20Internship/';
const results = {};

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

// 1. Home as guest: no Login button, guest-only tiles hidden
await page.goto(base + 'index.html');
await page.evaluate(() => localStorage.clear());
await page.reload();
results.noLoginButtonOnHome = await page.evaluate(() => !document.body.innerHTML.includes('login.html'));
results.guestTilesHidden = await page.evaluate(() => {
  const mine = document.getElementById('tileMine');
  const adm = document.getElementById('tileAdmin');
  return mine.style.display === 'none' && adm.style.display === 'none';
});

// 2. Request page open for guest (no redirect to login)
await page.goto(base + 'request-certificate.html');
results.requestPagePublic = !page.url().includes('login.html');

// 3. Verify + certificate details still public
await page.goto(base + 'verify.html');
results.verifyPublic = !page.url().includes('login.html');
await page.goto(base + 'certificate-details.html?id=c1');
results.detailsPublic = !page.url().includes('login.html');

// 4. My Certificates + Admin still redirect guests away (gate intact)
await page.goto(base + 'my-certificates.html');
results.mineStillGated = page.url().includes('login.html') || page.url().includes('index.html#');
await page.goto(base + 'admin-certificates.html');
results.adminStillGated = page.url().includes('login.html') || page.url().includes('index.html#');

// 5. Admin login still works via direct URL
await page.goto(base + 'login.html');
await page.evaluate(() => localStorage.clear());
await page.type('#loginEmail', 'clarissenet.info@gmail.com');
await page.type('#loginPassword', 'Admin1*');
await page.click('#loginBtn');
await new Promise(r => setTimeout(r, 1500));
results.adminLoginStillWorks = page.url().includes('admin-certificates.html');
await page.goto(base + 'index.html');
await page.reload();
results.adminTilesShownForAdmin = await page.evaluate(() => {
  const adm = document.getElementById('tileAdmin');
  return adm && adm.style.display !== 'none';
});

results.jsErrors = errors;
console.log(JSON.stringify(results, null, 2));
await browser.close();
process.exit(Object.values(results).every(v => v !== false && !(Array.isArray(v) && v.length)) ? 0 : 1);
