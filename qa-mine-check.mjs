/* QA: check my-certificates rendering for a signed-in student */
export default async function run(page) {
  await page.goto('file:///C:/Users/ADMIN/Desktop/Project%202%20Internship/login.html');
  await page.evaluate(() => {
    localStorage.setItem('ush_students', JSON.stringify([{ name: 'Test Student', email: 'student1@test.com', password: 'secret1' }]));
    localStorage.setItem('ush_current_user', JSON.stringify({ role: 'user', name: 'Test Student', email: 'student1@test.com' }));
  });
  await page.goto('file:///C:/Users/ADMIN/Desktop/Project%202%20Internship/my-certificates.html');
  await page.waitForTimeout(1800);
  const text = await page.evaluate(() => document.body.innerText);
  return { text: text.slice(0, 900) };
}
