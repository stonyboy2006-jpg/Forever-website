/* ===== Wedding Auth System ===== */
const AUTH_USERS_KEY = 'weddingAuthUsers';
const AUTH_SESSION_KEY = 'weddingAuthSession';

/* ===== PASSWORD HASHING (SHA-256) ===== */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'wedding-salt-2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ===== USER STORE ===== */
function getUsers() {
  try { return JSON.parse(localStorage.getItem(AUTH_USERS_KEY)) || []; }
  catch { return []; }
}

function saveUsers(users) {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

function findUserByEmail(email) {
  return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

/* ===== SESSION ===== */
function createSession(user) {
  const session = {
    userId: user.id,
    name: user.name,
    email: user.email,
    createdAt: Date.now(),
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
    lastActivity: Date.now()
  };
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  return session;
}

function getSession() {
  try {
    const s = JSON.parse(localStorage.getItem(AUTH_SESSION_KEY));
    if (!s || !s.expiresAt || Date.now() > s.expiresAt) {
      localStorage.removeItem(AUTH_SESSION_KEY);
      return null;
    }
    s.lastActivity = Date.now();
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(s));
    return s;
  } catch { return null; }
}

function clearSession() {
  localStorage.removeItem(AUTH_SESSION_KEY);
}

function isLoggedIn() {
  return !!getSession();
}

function getCurrentUser() {
  return getSession();
}

/* ===== SIGN UP ===== */
async function signUp(name, email, password) {
  const errors = [];
  if (!name || !name.trim()) errors.push('Full name is required');
  if (!email || !email.trim()) errors.push('Email address is required');
  if (!password) errors.push('Password is required');
  if (errors.length) return { ok: false, error: errors[0] };

  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) return { ok: false, error: 'Please enter a valid email address' };

  if (password.length < 8) return { ok: false, error: 'Password must be at least 8 characters' };

  if (findUserByEmail(trimmedEmail)) return { ok: false, error: 'An account with this email already exists' };

  const hashedPassword = await hashPassword(password);
  const user = {
    id: 'user_' + Date.now() + '_' + (crypto.randomUUID ? crypto.randomUUID().replace(/-/g,'').substr(0,16) : Math.random().toString(36).substr(2,9)),
    name: trimmedName,
    email: trimmedEmail,
    password: hashedPassword,
    createdAt: Date.now(),
    setupComplete: false
  };

  const users = getUsers();
  users.push(user);
  saveUsers(users);

  const session = createSession(user);
  return { ok: true, user: { id: user.id, name: user.name, email: user.email }, session };
}

/* ===== LOGIN ===== */
async function logIn(email, password) {
  if (!email || !email.trim()) return { ok: false, error: 'Email address is required' };
  if (!password) return { ok: false, error: 'Password is required' };

  const trimmedEmail = email.trim().toLowerCase();
  const user = findUserByEmail(trimmedEmail);
  if (!user) return { ok: false, error: 'Invalid email or password' };

  const hashedPassword = await hashPassword(password);
  if (user.password !== hashedPassword) return { ok: false, error: 'Invalid email or password' };

  const session = createSession(user);
  return { ok: true, user: { id: user.id, name: user.name, email: user.email }, session };
}

/* ===== LOGOUT ===== */
function logOut() {
  clearSession();
  return { ok: true };
}

/* ===== SETUP STATUS ===== */
function isSetupComplete() {
  const user = getCurrentUser();
  if (!user) return false;
  const users = getUsers();
  const fullUser = users.find(u => u.id === user.userId);
  if (fullUser && fullUser.setupComplete) return true;
  const wd = JSON.parse(localStorage.getItem('weddingData') || '{}');
  return !!(wd.groomName && wd.brideName && wd.weddingDate);
}

function markSetupComplete() {
  const session = getCurrentUser();
  if (!session) return;
  const users = getUsers();
  const user = users.find(u => u.id === session.userId);
  if (user) { user.setupComplete = true; saveUsers(users); }
}

/* ===== NOTIFICATIONS ===== */
function showAuthNotification(message, type) {
  const existing = document.querySelector('.auth-notification');
  if (existing) existing.remove();

  const colors = {
    success: 'var(--success)',
    error: 'var(--error)',
    info: 'var(--info)',
    warning: 'var(--warning)'
  };
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    info: 'fa-info-circle',
    warning: 'fa-exclamation-triangle'
  };

  const el = document.createElement('div');
  el.className = 'auth-notification';
  el.style.cssText = `
    position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:99999;
    background:var(--dark-soft);border:1px solid ${colors[type] || colors.info};
    border-radius:12px;padding:14px 24px;display:flex;align-items:center;gap:10px;
    color:var(--text);font-size:0.88rem;font-family:'Poppins',sans-serif;
    box-shadow:0 8px 32px rgba(0,0,0,0.4);animation:authNotifIn 0.3s ease;
    max-width:90vw;
  `;
  el.innerHTML = `<i class="fas ${icons[type] || icons.info}" style="color:${colors[type] || colors.info};font-size:1rem"></i><span></span>`;
  el.querySelector('span').textContent = message;
  document.body.appendChild(el);

  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(-50%) translateY(-10px)';
    el.style.transition = 'all 0.3s ease';
    setTimeout(() => el.remove(), 300);
  }, 3500);
}

/* ===== USER MENU ===== */
function renderUserMenu(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const session = getSession();
  if (!session) {
    container.innerHTML = `
      <a href="login.html" class="sidebar-link"><i class="fas fa-sign-in-alt"></i> Login</a>
      <a href="signup.html" class="sidebar-link"><i class="fas fa-user-plus"></i> Sign Up</a>
    `;
    return;
  }

  var initial = (session.name || 'U').charAt(0).toUpperCase();
  var safeName = sanitizeHTML(session.name || '');
  var safeEmail = sanitizeHTML(session.email || '');
  container.innerHTML = `
    <div class="auth-user-menu">
      <div class="auth-user-trigger" onclick="toggleUserDropdown()">
        <div class="auth-user-avatar">${initial}</div>
        <div class="auth-user-info">
          <div class="auth-user-name">${safeName}</div>
          <div class="auth-user-email">${safeEmail}</div>
        </div>
        <i class="fas fa-chevron-down auth-user-chevron"></i>
      </div>
      <div class="auth-user-dropdown" id="authUserDropdown">
        <a href="setup.html" class="auth-dropdown-item"><i class="fas fa-rocket"></i> Wedding Setup</a>
        <a href="planner.html" class="auth-dropdown-item"><i class="fas fa-clipboard-list"></i> Planner</a>
        <a href="dashboard.html" class="auth-dropdown-item"><i class="fas fa-th-large"></i> Dashboard</a>
        <div class="auth-dropdown-divider"></div>
        <button class="auth-dropdown-item auth-logout-btn" onclick="handleLogout()"><i class="fas fa-sign-out-alt"></i> Logout</button>
      </div>
    </div>
  `;
}

function toggleUserDropdown() {
  const dd = document.getElementById('authUserDropdown');
  if (dd) dd.classList.toggle('open');
}

function handleLogout() {
  logOut();
  showAuthNotification('Logged out successfully', 'success');
  setTimeout(() => { window.location.href = 'index.html'; }, 800);
}

/* Close dropdown on outside click */
document.addEventListener('click', function(e) {
  const menu = document.querySelector('.auth-user-menu');
  if (menu && !menu.contains(e.target)) {
    const dd = document.getElementById('authUserDropdown');
    if (dd) dd.classList.remove('open');
  }
});

/* ===== REDIRECT HELPER ===== */
function getRedirectUrl() {
  const params = new URLSearchParams(window.location.search);
  const url = params.get('redirect') || 'index.html';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) return 'index.html';
  return url;
}

function afterLoginRedirect() {
  const wd = JSON.parse(localStorage.getItem('weddingData') || '{}');
  if (wd.groomName && wd.brideName) {
    window.location.href = 'index.html';
  } else {
    window.location.href = 'setup.html';
  }
}

/* ===== ANIMATION STYLE ===== */
(function() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes authNotifIn{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
    .auth-user-menu{position:relative}
    .auth-user-trigger{display:flex;align-items:center;gap:10px;cursor:pointer;padding:8px 12px;border-radius:10px;transition:all 0.3s}
    .auth-user-trigger:hover{background:rgba(212,175,55,0.08)}
    .auth-user-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--gold-dark));color:var(--dark);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.9rem;font-family:'Playfair Display',serif}
    .auth-user-info{flex:1;min-width:0}
    .auth-user-name{font-size:0.85rem;color:var(--text);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .auth-user-email{font-size:0.72rem;color:var(--text-light);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .auth-user-chevron{font-size:0.7rem;color:var(--text-light);transition:transform 0.3s}
    .auth-user-menu.open .auth-user-chevron{transform:rotate(180deg)}
    .auth-user-dropdown{position:absolute;bottom:calc(100% + 8px);left:0;right:0;background:var(--dark-soft);border:1px solid rgba(212,175,55,0.12);border-radius:12px;padding:8px;display:none;box-shadow:0 8px 32px rgba(0,0,0,0.4);z-index:100}
    .auth-user-dropdown.open{display:block;animation:authNotifIn 0.2s ease}
    .auth-dropdown-item{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:8px;font-size:0.85rem;color:var(--text-light);text-decoration:none;border:none;background:none;width:100%;text-align:left;cursor:pointer;transition:all 0.2s;font-family:'Poppins',sans-serif}
    .auth-dropdown-item:hover{background:rgba(212,175,55,0.08);color:var(--gold)}
    .auth-dropdown-item i{width:18px;text-align:center;font-size:0.85rem}
    .auth-dropdown-divider{height:1px;background:rgba(212,175,55,0.08);margin:4px 0}
    .auth-logout-btn:hover{color:var(--error)!important}
  `;
  document.head.appendChild(style);
})();

/* ===== PROFILE MANAGEMENT ===== */
function updateProfile(updates) {
  const session = getSession();
  if (!session) return { ok: false, error: 'Not logged in' };
  const users = getUsers();
  const user = users.find(u => u.id === session.userId);
  if (!user) return { ok: false, error: 'User not found' };

  if (updates.email && updates.email !== user.email) {
    const existing = users.find(u => u.email.toLowerCase() === updates.email.toLowerCase() && u.id !== user.id);
    if (existing) return { ok: false, error: 'Email already in use' };
    user.email = updates.email.trim().toLowerCase();
  }
  if (updates.name) user.name = updates.name.trim();
  if (updates.phone !== undefined) user.phone = updates.phone.trim();
  if (updates.websiteName !== undefined) user.websiteName = updates.websiteName.trim();
  if (updates.photo !== undefined) user.photo = updates.photo;

  saveUsers(users);
  session.name = user.name;
  session.email = user.email;
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  return { ok: true };
}

async function changePassword(currentPassword, newPassword) {
  const session = getSession();
  if (!session) return { ok: false, error: 'Not logged in' };
  const users = getUsers();
  const user = users.find(u => u.id === session.userId);
  if (!user) return { ok: false, error: 'User not found' };

  const currentHash = await hashPassword(currentPassword);
  if (user.password !== currentHash) return { ok: false, error: 'Current password is incorrect' };
  if (newPassword.length < 8) return { ok: false, error: 'New password must be at least 8 characters' };

  user.password = await hashPassword(newPassword);
  saveUsers(users);
  return { ok: true };
}

async function changeEmail(currentPassword, newEmail) {
  const session = getSession();
  if (!session) return { ok: false, error: 'Not logged in' };
  if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) return { ok: false, error: 'Invalid email address' };

  const users = getUsers();
  const user = users.find(u => u.id === session.userId);
  if (!user) return { ok: false, error: 'User not found' };

  const currentHash = await hashPassword(currentPassword);
  if (user.password !== currentHash) return { ok: false, error: 'Password is incorrect' };

  const existing = users.find(u => u.email.toLowerCase() === newEmail.trim().toLowerCase() && u.id !== user.id);
  if (existing) return { ok: false, error: 'Email already in use' };

  user.email = newEmail.trim().toLowerCase();
  saveUsers(users);
  session.email = user.email;
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  return { ok: true };
}

function deleteAccount(password) {
  return hashPassword(password).then(hash => {
    const session = getSession();
    if (!session) return { ok: false, error: 'Not logged in' };
    const users = getUsers();
    const user = users.find(u => u.id === session.userId);
    if (!user) return { ok: false, error: 'User not found' };
    if (user.password !== hash) return { ok: false, error: 'Password is incorrect' };

    const filtered = users.filter(u => u.id !== session.userId);
    saveUsers(filtered);
    clearSession();
    return { ok: true };
  });
}

function getUserProfile() {
  const session = getSession();
  if (!session) return null;
  const users = getUsers();
  const user = users.find(u => u.id === session.userId);
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    websiteName: user.websiteName || '',
    photo: user.photo || '',
    createdAt: user.createdAt,
    lastLogin: user.lastLogin || Date.now()
  };
}

function updateLastLogin() {
  const session = getSession();
  if (!session) return;
  const users = getUsers();
  const user = users.find(u => u.id === session.userId);
  if (user) { user.lastLogin = Date.now(); saveUsers(users); }
}

function getWeddingProgress() {
  const wd = JSON.parse(localStorage.getItem('weddingData') || '{}');
  const session = getUserProfile();
  const steps = [
    { name: 'Profile Completed', done: !!(session && session.name) },
    { name: 'Wedding Information', done: !!(wd.groomName && wd.brideName && wd.weddingDate) },
    { name: 'Gallery Uploaded', done: (wd.gallery && wd.gallery.length > 0) },
    { name: 'Guest List Added', done: (wd.guests && wd.guests.length > 0) },
    { name: 'Website Published', done: !!wd.isPublished }
  ];
  const done = steps.filter(s => s.done).length;
  return { steps, percent: Math.round((done / steps.length) * 100) };
}

function getRecentActivity() {
  try { return JSON.parse(localStorage.getItem('weddingActivity') || '[]'); }
  catch { return []; }
}

function addActivity(action) {
  const activities = getRecentActivity();
  activities.unshift({ action, time: Date.now() });
  if (activities.length > 20) activities.length = 20;
  localStorage.setItem('weddingActivity', JSON.stringify(activities));
}

/* ===== NOTIFICATIONS CENTER ===== */
const WEDDING_NOTIF_KEY = 'weddingNotifications';

function getNotifications() {
  try { return JSON.parse(localStorage.getItem(WEDDING_NOTIF_KEY)) || []; }
  catch { return []; }
}

function saveNotifications(notifs) {
  localStorage.setItem(WEDDING_NOTIF_KEY, JSON.stringify(notifs));
}

function addNotification(title, type, message) {
  const notifs = getNotifications();
  notifs.unshift({
    id: 'n_' + Date.now(),
    title,
    type: type || 'info',
    message: message || '',
    time: Date.now(),
    read: false
  });
  if (notifs.length > 50) notifs.length = 50;
  saveNotifications(notifs);
  updateNotifBadge();
}

function markNotificationRead(id) {
  const notifs = getNotifications();
  const n = notifs.find(x => x.id === id);
  if (n) { n.read = true; saveNotifications(notifs); updateNotifBadge(); }
}

function markAllRead() {
  const notifs = getNotifications();
  notifs.forEach(n => n.read = true);
  saveNotifications(notifs);
  updateNotifBadge();
}

function getUnreadCount() {
  return getNotifications().filter(n => !n.read).length;
}

function updateNotifBadge() {
  const count = getUnreadCount();
  document.querySelectorAll('.notif-badge').forEach(b => {
    b.textContent = count;
    b.style.display = count > 0 ? 'flex' : 'none';
  });
}

/* ===== Input Sanitization ===== */
function sanitizeInput(str){
  if(typeof str!=='string')return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;');
}
function sanitizeHTML(str){
  if(typeof str!=='string')return '';
  var div=document.createElement('div');
  div.textContent=str;
  return div.innerHTML;
}
