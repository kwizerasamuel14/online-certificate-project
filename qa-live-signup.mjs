/* QA: live site — sign up -> logout -> student login with same credentials */
export default async function run(page) {
  const base = 'https://kwizerasamuel14.github.io/online-certificate-project/';

  // fresh profile, clear storage just in case
  await page.goto(base + 'login.html');
  await page.evaluate(() => localStorage.clear());

  // 1. sign up on the LIVE site
  await page.goto(base + 'login.html');
  await page.waitForTimeout(1000);
  await page.click('a[href="#"]:has-text("sign up")');
  await page.waitForTimeout(300);
  await page.fill('#signupName', 'Live Tester');
  await page.fill('#signupEmail', 'livetester@test.com');
  await page.fill('#signupPassword', 'Test123');
  await page.fill('#signupConfirm', 'Test123');
  await page.click('#signupForm button[type="submit"]');
  await page.waitForTimeout(2500);

  const afterSignupUrl = page.url();

  // 2. logout
  await page.click('button:has-text("Logout")');
  await page.waitForTimeout(1000);

  // 3. student login on the LIVE site
  await page.goto(base + 'login.html');
  await page.waitForTimeout(1000);
  await page.click('a[href="#"]:has-text("Log in here")');
  await page.waitForTimeout(300);
  await page.fill('#studentEmail', 'livetester@test.com');
  await page.fill('#studentPassword', 'Test123');
  await page.click('#studentForm button[type="submit"]');
  await page.waitForTimeout(2500);

  const afterLoginUrl = page.url();
  const errVisible = await page.evaluate(() => {
    const el = document.getElementById('studentLoginError');
    return el ? el.style.display : 'no-element';
  });
  const errText = await page.evaluate(() => {
    const el = document.getElementById('studentLoginError');
    return el ? el.textContent.trim().slice(0, 80) : '';
  });
  const students = await page.evaluate(() => localStorage.getItem('ush_students'));
  const currentUser = await page.evaluate(() => localStorage.getItem('ush_current_user'));

  return { afterSignupUrl, afterLoginUrl, errVisible, errText, students, currentUser };
}
