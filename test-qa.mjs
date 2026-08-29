export default async function run(page, ui) {
  const results = {};

  // 1. Submit request form
  await page.goto('file:///C:/Users/ADMIN/Desktop/Project 2 Internship/request-certificate.html');
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    document.getElementById('fullName').value = 'Test Trainee';
    document.getElementById('traineeId').value = 'USH-INT-2026-00999';
    document.getElementById('program').value = 'Training Program / Frontend Development';
    document.getElementById('startDate').value = '2026-07-03';
    document.getElementById('endDate').value = '2026-09-09';
    document.getElementById('projectName').value = 'E-commerce Dashboard';
    document.getElementById('projectDescription').value = 'Built a responsive dashboard with charts and product management features for the client.';
    document.getElementById('accomplishments').value = 'Developed the frontend, integrated REST APIs, and wrote documentation for the whole team.';
    document.getElementById('declaration').checked = true;
  });
  await page.click('#submitBtn');
  await page.waitForSelector('#successScreen', { state: 'visible', timeout: 8000 });
  results.submission = await page.evaluate(() => document.getElementById('successReqId').textContent);

  // 2. Admin: recommend -> approve & generate
  await page.goto('file:///C:/Users/ADMIN/Desktop/Project 2 Internship/admin-certificates.html');
  await page.waitForSelector('#listWrap table', { timeout: 8000 });
  await page.locator('button:has-text("Recommend")').first().click();
  await page.waitForSelector('button:has-text("Approve")', { timeout: 8000 });
  await page.locator('button:has-text("Approve")').first().click();
  await page.waitForTimeout(2000);
  results.admin = await page.evaluate(() => ({
    certGenerated: document.body.innerHTML.includes('USH-2026-FD-'),
    rows: [...document.querySelectorAll('#listWrap tbody tr')].map(tr => tr.innerText.split('\t')[3]),
  }));

  // 3. Verify: valid + invalid
  await page.goto('file:///C:/Users/ADMIN/Desktop/Project 2 Internship/verify.html');
  await page.waitForTimeout(600);
  await page.fill('#certNumber', 'USH-2026-FD-000002');
  await page.click('#verifyBtn');
  await page.waitForSelector('#result h2', { timeout: 8000 });
  results.validVerify = await page.evaluate(() => document.querySelector('#result h2').textContent);
  await page.fill('#certNumber', 'USH-2026-XX-999999');
  await page.click('#verifyBtn');
  await page.waitForTimeout(1000);
  results.invalidVerify = await page.evaluate(() => document.querySelector('#result h2').textContent);

  // 4. My Certificates (as admin user, filter none) & details page QR
  await page.goto('file:///C:/Users/ADMIN/Desktop/Project 2 Internship/certificate-details.html?id=CERT-00001');
  await page.waitForSelector('#content', { state: 'visible', timeout: 8000 });
  results.details = await page.evaluate(() => ({
    name: document.getElementById('c-name').textContent,
    qrRendered: !!document.querySelector('#c-qr canvas, #c-qr img'),
  }));

  // 5. Mobile responsive check
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('file:///C:/Users/ADMIN/Desktop/Project 2 Internship/index.html');
  await page.waitForTimeout(800);
  results.mobile = await page.evaluate(() => ({
    noHorizScroll: document.documentElement.scrollWidth <= window.innerWidth + 2,
  }));

  return results;
}
