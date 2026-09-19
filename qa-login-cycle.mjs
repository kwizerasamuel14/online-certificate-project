/* QA: sign up -> logout -> student login with same credentials */
export default async function run(page) {
  const base = 'file:///C:/Users/ADMIN/Desktop/Project%202%20Internship/';

  // fresh state
  await page.goto(base + 'login.html');
  await page.evaluate(() => localStorage.clear());

  // 1. sign up
  await page.goto(base + 'login.html');
  await page.waitForTimeout(400);
  await page.click('a[href="#"]:has-text("sign up")');
  await page.waitForTimeout(200);
  await page.fill('#signupName', 'Login Tester');
  await page.fill('#signupEmail', 'tester@test.com');
  await page.fill('#signupPassword', 'Test123');
  await page.fill('#signupConfirm', 'Test123');
  await page.click('#signupForm button[type="submit"]');
  await page.waitForTimeout(1500);

  const afterSignupUrl = page.url();

  // 2. logout
  await page.click('button:has-text("Logout")');
  await page.waitForTimeout(800);

  // 3. open login page -> go to student login
  await page.goto(base + 'login.html');
  await page.waitForTimeout(400);
  await page.click('a[href="#"]:has-text("Log in here")');
  await page.waitForTimeout(200);
  await page.fill('#studentEmail', 'tester@test.com');
  await page.fill('#studentPassword', 'Test123');
  await page.click('#studentForm button[type="submit"]');
  await page.waitForTimeout(1500);

  const afterLoginUrl = page.url();
  const errVisible = await page.evaluate(() => {
    const el = document.getElementById('studentLoginError');
    return el ? el.style.display : 'no-element';
  });
  const students = await page.evaluate(() => localStorage.getItem('ush_students'));
  const currentUser = await page.evaluate(() => localStorage.getItem('ush_current_user'));

  return { afterSignupUrl, afterLoginUrl, errVisible, students, currentUser };
}
