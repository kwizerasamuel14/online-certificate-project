/* QA: student sign-up -> my-certificates shows their requests */
export default async function run(page, ui) {
  await page.goto('file:///C:/Users/ADMIN/Desktop/Project%202%20Internship/login.html');
  await page.waitForTimeout(500);

  // 1. open sign-up
  await page.click('a[href="#"]:has-text("sign up")');
  await page.waitForTimeout(200);

  // 2. fill the form
  await page.fill('#signupName', 'Test Student');
  await page.fill('#signupEmail', 'student1@test.com');
  await page.fill('#signupPassword', 'secret1');
  await page.fill('#signupConfirm', 'secret1');
  await page.click('#signupForm button[type="submit"]');
  await page.waitForTimeout(1500); // redirect to my-certificates

  const url = page.url();
  const user = await page.evaluate(() => localStorage.getItem('ush_current_user'));

  // 3. check requests list rendering (should show empty state, no crash)
  await page.waitForTimeout(800);
  const bodyText = await page.evaluate(() => document.body.innerText);
  return {
    redirectedTo: url,
    currentUser: user,
    hasMyCertificates: bodyText.includes('My Certificates'),
    hasEmptyReqState: bodyText.includes('not submitted any certificate requests'),
    studentSaved: await page.evaluate(() => localStorage.getItem('ush_students')),
  };
}
