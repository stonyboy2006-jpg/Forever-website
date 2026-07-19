/* ===== Auth Guard - Route Protection ===== */
(function() {
  const PROTECTED_PAGES = ['setup.html', 'planner.html', 'dashboard.html'];
  const PUBLIC_PAGES = ['index.html', 'login.html', 'signup.html', 'forgot-password.html', '404.html'];

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  if (PROTECTED_PAGES.includes(currentPage)) {
    const session = getSession();
    if (!session) {
      const redirectUrl = encodeURIComponent(currentPage);
      window.location.replace('login.html?redirect=' + redirectUrl);
      return;
    }
  }
})();
