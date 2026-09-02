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

const ROLE_LABELS = {
  user:    '👤 User',
  trainer: '🧑‍🏫 Trainer',
  admin:   '🛡️ Admin',
};

function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
  location.href = 'login.html';
}

/* Logged-in user area: shows the role badge and a Logout button. */
function renderAuthArea() {
  const user = getCurrentUser();
  if (!user) {
    return `<a class="btn btn-sm btn-primary" href="login.html">Login</a>`;
  }
  return `
    <div class="user-area">
      <span class="user-role ${user.role === 'admin' ? 'role-admin' : user.role === 'trainer' ? 'role-trainer' : 'role-user'}"
            title="Signed in as ${user.email}">${ROLE_LABELS[user.role] || user.role}</span>
      <button class="btn btn-sm btn-ghost" onclick="logout()">Logout</button>
    </div>`;
}

/* Pages each role is allowed to open.
   'user'   = trainee/intern  'trainer' & 'admin' = staff  (null = public) */
const PAGE_ACCESS = {
  home:    null,
  verify:  null,
  request: ['user', 'trainer', 'admin'],
  mine:    ['user', 'trainer', 'admin'],
  admin:   ['admin'],
};

function enforceAccess(activePage) {
  const allowed = PAGE_ACCESS[activePage];
  if (!allowed) return;                       // public page
  const user = getCurrentUser();
  if (!user) {
    // Not logged in at all — go to login
    location.replace('login.html');
  } else if (!allowed.includes(user.role)) {
    // Logged in but not permitted — keep session, send home with a message
    location.replace('index.html#access-denied');
  }
}

function renderHeader(activePage) {
  const user = getCurrentUser();
  const role = user ? user.role : null;
  const nav = [
    { id: 'home',       href: 'index.html',              label: 'Home' },
    { id: 'request',    href: 'request-certificate.html',label: 'Request Certificate' },
    { id: 'mine',       href: 'my-certificates.html',    label: 'My Certificates' },
    { id: 'admin',      href: 'admin-certificates.html', label: 'Admin Management', staff: true },
    { id: 'verify',     href: 'verify.html',             label: 'Verify Certificate' },
  ].filter(n => !n.staff || role === 'admin');
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
      ${renderAuthArea()}
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
  if (activePage) enforceAccess(activePage);
  if (location.hash === '#access-denied') {
    history.replaceState(null, '', location.pathname);
    setTimeout(() => toast('You do not have permission to view that page.', 'error'), 300);
  }
  document.getElementById('header').innerHTML = renderHeader(activePage);
  document.getElementById('footer').innerHTML = renderFooter();
}
