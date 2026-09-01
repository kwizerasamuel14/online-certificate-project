/* =====================================================
   auth.js — login, logout and change-password logic.
   Credentials are stored in localStorage (client-side
   demo auth; replaced by the real backend later).
   ===================================================== */

let selectedRole = 'user';

/* Default accounts (as provided by the supervisor).
   Passwords can be changed from this page and the change
   is persisted in localStorage. */
const DEFAULT_ACCOUNTS = {
  user: {
    email: 'user@upskillshub.com',
    password: 'User1',
    name: 'Kwizera Samuel',
    displayName: 'User / Trainee',
    redirect: 'index.html',
    canChangePassword: false,
  },
  trainer: {
    email: 'upskillshub.info@gmail.com',
    password: 'Trainer1',
    name: 'Trainer',
    displayName: 'Trainer',
    redirect: 'admin-certificates.html',
    canChangePassword: true,
  },
  admin: {
    email: 'clarissenet.info@gmail.com',
    password: 'Admin1*',
    name: 'Clarisse',
    displayName: 'Administrator',
    redirect: 'admin-certificates.html',
    canChangePassword: true,
  },
};

const ACCOUNTS_KEY = 'ush_accounts';

function loadAccounts() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || {}; } catch { saved = {}; }
  const accounts = {};
  for (const [role, def] of Object.entries(DEFAULT_ACCOUNTS)) {
    accounts[role] = { ...def, ...(saved[role] ? { password: saved[role] } : {}) };
  }
  return accounts;
}
function savePasswords(accounts) {
  const passwords = {};
  for (const [role, a] of Object.entries(accounts)) passwords[role] = a.password;
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(passwords));
}

function selectRole(role) {
  selectedRole = role;
  document.querySelectorAll('.login-tabs button').forEach(b => {
    b.className = 'btn btn-sm ' + (b.dataset.role === role ? 'btn-primary' : 'btn-ghost');
  });
  document.getElementById('loginError').style.display = 'none';
}

function showLogin() {
  document.getElementById('loginSection').style.display = '';
  document.getElementById('changeSection').style.display = 'none';
}
function showChangePassword() {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('changeSection').style.display = '';
}

/* ---------- Login ---------- */
document.getElementById('loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  const err = document.getElementById('loginError');
  err.style.display = 'none';

  const accounts = loadAccounts();
  const match = Object.entries(accounts)
    .find(([, a]) => a.email.toLowerCase() === email && a.password === password);

  if (!match) { err.style.display = 'block'; return; }

  const [role, account] = match;
  setCurrentUser({ role, name: account.name, email: account.email });
  toast(`Welcome, ${account.name}! Redirecting…`, 'success');
  setTimeout(() => (location.href = account.redirect), 900);
});

/* ---------- Change password (Trainer & Admin) ---------- */
document.getElementById('changeForm').addEventListener('submit', e => {
  e.preventDefault();
  const current = document.getElementById('currentPassword').value;
  const next = document.getElementById('newPassword').value;
  const confirm = document.getElementById('confirmPassword').value;
  const newErr = document.getElementById('newPasswordErr');
  const confirmErr = document.getElementById('confirmErr');
  newErr.style.display = confirmErr.style.display = 'none';

  const accounts = loadAccounts();
  const logged = getCurrentUser();
  const account = logged && accounts[logged.role];

  if (!account || !account.canChangePassword) {
    toast('This account is not allowed to change its password.', 'error');
    return;
  }
  if (account.password !== current) {
    toast('Current password is incorrect.', 'error');
    return;
  }
  if (next.length < 6) { newErr.style.display = 'block'; return; }
  if (next !== confirm) { confirmErr.style.display = 'block'; return; }

  account.password = next;
  savePasswords(accounts);
  toast('Password changed successfully. You can now log in with the new password.', 'success');
  setTimeout(showLogin, 1400);
});

/* ---------- Init ---------- */
(function init() {
  const user = getCurrentUser();
  const account = user && DEFAULT_ACCOUNTS[user.role];
  if (account && account.canChangePassword) {
    showChangePassword();
    document.getElementById('changeWho').textContent =
      `Logged in as ${user.name} (${user.email}).`;
  } else {
    showLogin();
    selectRole(selectedRole);
  }
})();
