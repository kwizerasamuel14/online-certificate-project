export default async function run(page, ui) {
  const results = {};
  try {
  const url = 'file:///C:/Users/ADMIN/Desktop/Project%202%20Internship/login.html';

  const fresh = async () => {
    await page.goto(url);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(300);
  };

  // 1. User login
  await fresh();
  await page.fill('#loginEmail', 'user@upskillshub.com');
  await page.fill('#loginPassword', 'User1');
  await page.click('#loginBtn');
  await page.waitForURL('**/index.html', { timeout: 8000 });
  results.userLogin = true;

  // 2. User must NOT see change-password section
  await page.goto(url);
  results.userChangePasswordHidden = await page.evaluate(() =>
    document.getElementById('changeSection').style.display === 'none');

  // 3. Trainer login + change password
  await fresh();
  await page.fill('#loginEmail', 'upskillshub.info@gmail.com');
  await page.fill('#loginPassword', 'Trainer1');
  await page.click('#loginBtn');
  await page.waitForURL('**/admin-certificates.html', { timeout: 8000 });
  results.trainerLogin = true;

  await page.goto(url);
  results.trainerSeesChangeForm = await page.evaluate(() =>
    document.getElementById('changeSection').style.display !== 'none' &&
    document.getElementById('changeWho').textContent.includes('Trainer'));
  await page.fill('#currentPassword', 'Trainer1');
  await page.fill('#newPassword', 'NewTrainer2');
  await page.fill('#confirmPassword', 'NewTrainer2');
  await page.click('#changeForm button[type=submit]');
  await page.waitForTimeout(600);
  results._savedPw = await page.evaluate(() =>
    (JSON.parse(localStorage.getItem('ush_accounts') || '{}').trainer) || 'NOT SAVED');

  // Trainer's NEW password works (simulate persisted accounts)
  await fresh();
  await page.evaluate(() => localStorage.setItem('ush_accounts', '{"trainer":"NewTrainer2","admin":"Admin1*"}'));
  await page.reload();
  await page.waitForTimeout(300);
  await page.fill('#loginEmail', 'upskillshub.info@gmail.com');
  await page.fill('#loginPassword', 'NewTrainer2');
  await page.click('#loginBtn');
  await page.waitForURL('**/admin-certificates.html', { timeout: 8000 });
  results.trainerNewPasswordWorks = true;

  // Old password must now fail (same persisted accounts)
  await page.evaluate(() => localStorage.removeItem('ush_current_user'));
  await page.goto(url);
  await page.waitForTimeout(300);
  await page.fill('#loginEmail', 'upskillshub.info@gmail.com');
  await page.fill('#loginPassword', 'Trainer1');
  await page.click('#loginBtn');
  await page.waitForTimeout(800);
  results.trainerOldPasswordRejected = page.url().includes('login.html') &&
    await page.evaluate(() => document.getElementById('loginError').style.display === 'block');

  // User password untouched
  await fresh();
  await page.fill('#loginEmail', 'user@upskillshub.com');
  await page.fill('#loginPassword', 'User1');
  await page.click('#loginBtn');
  await page.waitForURL('**/index.html', { timeout: 8000 });
  results.userPasswordUnaffected = true;

  // 4. Admin login
  await fresh();
  await page.fill('#loginEmail', 'clarissenet.info@gmail.com');
  await page.fill('#loginPassword', 'Admin1*');
  await page.click('#loginBtn');
  await page.waitForURL('**/admin-certificates.html', { timeout: 8000 });
  results.adminLogin = true;

  // cleanup so the deployed defaults stay intact
  await page.evaluate(() => localStorage.clear());
  return results;
  } catch (e) {
    results._error = String(e).slice(0, 200);
    results._url = page.url();
    results._accounts = await page.evaluate(() => localStorage.getItem('ush_accounts'));
    results._session = await page.evaluate(() => localStorage.getItem('ush_current_user'));
    results._loginErrVisible = await page.evaluate(() => document.getElementById('loginError') ? document.getElementById('loginError').style.display : 'n/a');
    return results;
  }
}
