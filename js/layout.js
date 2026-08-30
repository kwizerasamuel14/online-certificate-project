/* =====================================================
   Shared layout helpers — header, footer, current user
   (simulated auth until real backend integration)
   ===================================================== */

const CURRENT_USER_KEY = 'ush_current_user';

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem(CURRENT_USER_KEY)); } catch { return null; }
}
function setCurrentUser(user) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

/* Demo switcher: lets you preview the module as a Trainee,
   a Trainer or an Admin (real auth comes from the backend). */
function renderAuthSwitcher() {
  const user = getCurrentUser() || { role: 'trainee', name: 'Kwizera Samuel', email: 'kwizera.samuel@example.com' };
  if (!localStorage.getItem(CURRENT_USER_KEY)) setCurrentUser(user);
  const roles = [
    { role: 'trainee', label: '🎓 Trainee' },
    { role: 'trainer', label: '🧑‍🏫 Trainer' },
    { role: 'admin',   label: '🛡️ Admin' },
  ];
  return `
    <div class="auth-switch" title="Demo role switcher — replaced by real login in production">
      ${roles.map(r => `
        <button class="btn btn-sm ${user.role === r.role ? 'btn-primary' : 'btn-ghost'}"
                onclick="switchRole('${r.role}')">${r.label}</button>`).join('')}
    </div>`;
}

function switchRole(role) {
  const names = {
    trainee: { name: 'Kwizera Samuel', email: 'kwizera.samuel@example.com' },
    trainer: { name: 'Trainer Eric',   email: 'trainer.eric@upskillshub.com' },
    admin:   { name: 'Administrator',  email: 'admin@upskillshub.com' },
  };
  setCurrentUser({ role, ...names[role] });
  location.reload();
}

function renderHeader(activePage) {
  const nav = [
    { id: 'home',       href: 'index.html',              label: 'Home' },
    { id: 'request',    href: 'request-certificate.html',label: 'Request Certificate' },
    { id: 'mine',       href: 'my-certificates.html',    label: 'My Certificates' },
    { id: 'admin',      href: 'admin-certificates.html', label: 'Admin Management' },
    { id: 'verify',     href: 'verify.html',             label: 'Verify Certificate' },
  ];
  return `
  <header class="site-header">
    <div class="header-inner">
      <a class="brand" href="index.html">
        <span class="logo-mark">USH</span>
        <span>Up Skills Hub</span>
      </a>
      <nav class="main-nav">
        ${nav.map(n => `<a href="${n.href}" class="${activePage === n.id ? 'active' : ''}">${n.label}</a>`).join('')}
      </nav>
      ${renderAuthSwitcher()}
    </div>
  </header>`;
}

function renderFooter() {
  return `
  <footer class="site-footer">
    <div class="footer-inner">
      <div>
        <strong>Up Skills Hub</strong><br>
        Empowering youth through IT Training, Internships & Digital Solutions.
      </div>
      <div>
        KG 173 Street, Remera, Kigali, Rwanda<br>
        <a href="mailto:upskillshub.info@gmail.com">upskillshub.info@gmail.com</a> · +250 781 796 283
      </div>
      <div>© ${new Date().getFullYear()} Up Skills Hub. All Rights Reserved.</div>
    </div>
  </footer>
  <div id="toast"></div>`;
}

function initPage(activePage) {
  document.getElementById('header').innerHTML = renderHeader(activePage);
  document.getElementById('footer').innerHTML = renderFooter();
}
