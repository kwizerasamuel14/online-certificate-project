// Screenshot the online certificate view to visually confirm the logo
// has no white box behind it (uses the transparent logo.png now).
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1100, height: 900 });
const base = 'file:///C:/Users/ADMIN/Desktop/Project%202%20Internship/';

// skip login: certificate-details only needs a current user for layout
await page.goto(base + 'certificate-details.html?id=CERT-00001', {
  waitUntil: 'networkidle0',
});
await page.evaluate(() => {
  localStorage.setItem('ush_current_user', JSON.stringify({
    email: 'upskillshub.info@gmail.com', role: 'trainer', name: 'Trainer',
  }));
});
await page.reload({ waitUntil: 'networkidle0' });
await page.waitForSelector('.cert-paper', { timeout: 8000 });
await new Promise(r => setTimeout(r, 1200));

// confirm the logo element now uses the transparent PNG
const info = await page.evaluate(() => {
  const img = document.querySelector('.cert-logo');
  return { src: img.getAttribute('src'), w: img.naturalWidth, h: img.naturalHeight };
});
console.log('logo element:', JSON.stringify(info));

const el = await page.$('.cert-paper');
await el.screenshot({ path: 'cert-logo-check.png' });
await browser.close();
console.log('saved cert-logo-check.png');
