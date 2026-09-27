/* Runner: launches Puppeteer and runs a QA script's default-exported run(page, ui). */
import { chromium } from 'playwright';

const script = process.argv[2];
if (!script) { console.error('usage: node run-qa.mjs <qa-script.mjs>'); process.exit(1); }

const browser = await chromium.launch({ headless: true, executablePath: process.env.PW_EXE || undefined });
const page = await browser.newPage();
const ui = {
  fill: async (sel, val) => { const el = await page.waitForSelector(sel, { timeout: 15000 }); await el.click({ clickCount: 3 }); await el.type(val); },
  click: async (sel) => (await page.waitForSelector(sel, { timeout: 15000 })).click(),
};

const mod = await import('./' + script);
const result = await (mod.default || mod.run)(page, ui);
console.log(JSON.stringify(result, null, 2));
await browser.close();
console.log('DONE');
process.exit(0);
