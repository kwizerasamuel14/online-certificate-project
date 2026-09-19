/* QA: PDF generation via main-world script injection, with error reporting */
export default async function run(page) {
  await page.goto('file:///C:/Users/ADMIN/Desktop/Project%202%20Internship/certificate-details.html');
  await page.waitForTimeout(2500); // let CDN scripts load
  let injectError = null;
  try {
    await page.addScriptTag({ path: 'C:/Users/ADMIN/Desktop/Project 2 Internship/qa-pdf-inject.js' });
  } catch (e) { injectError = e.message; }
  await page.waitForTimeout(5000);
  const result = await page.evaluate(() => {
    const el = document.getElementById('__qaResult');
    return el ? el.textContent : null;
  });
  return { injectError, result };
}
