/* QA: sign up -> logout -> login via the DEFAULT main form (student creds) */
export default async function run(page) {
  const base = 'file:///C:/Users/ADMIN/Desktop/Project%202%20Internship/';

  await page.goto(base + 'login.html');
  await page.evaluate(() => localStorage.clear());

  // 1. sign up
  await page.goto(base + 'login.html');
  await page.waitForTimeout(500);
  await page.click('a[href="#"]:has-text("sign up")');
  await page.waitForTimeout(200);
  await page.fill('#signupName', 'Main Form Tester');
  await page.fill('#signupEmail', 'mainform@test.com');
  await page.fill('#signupPassword', 'Test123');
  await page.fill('#signupConfirm', 'Test123');
  await page.click('#signupForm button[type="submit"]');
  await page.waitForTimeout(1500);

  // 2. logout
  await page.click('button:has-text("Logout")');
  await page.waitForTimeout(800);

  // 3. login using the DEFAULT main form (no "Log in here" click!)
  await page.goto(base + 'login.html');
  await page.waitForTimeout(500);
  await page.fill('#loginEmail', 'mainform@test.com');
  await page.fill('#loginPassword', 'Test123');
  await page.click('#loginForm button[type="submit"]');
  await page.waitForTimeout(1500);

  const afterLoginUrl = page.url();
  const errVisible = await page.evaluate(() => {
    const el = document.getElementById('loginError');
    return el ? el.style.display : 'no-element';
  });
  const currentUser = await page.evaluate(() => localStorage.getItem('ush_current_user'));

  return { afterLoginUrl, errVisible, currentUser };
}
