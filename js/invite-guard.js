(function () {
  'use strict';

  if (window.__INVITE_GUARD_INIT) return;
  window.__INVITE_GUARD_INIT = true;
  window.__PUBLIC_INVITE_PAGE = true;

  var GUARD_INJECTED_STYLE = 'inviteGuardStyles';

  var HIDE_SELECTORS = [
    '.sidebar', '#sidebarNav', '#sidebarOverlay', '#sidebarToggle',
    '.sidebar-link', '.sidebar-close',
    '.auth-user-menu', '.auth-user-dropdown', '#authUserDropdown',
    '.auth-user-trigger', '.auth-user-avatar', '.auth-user-info',
    '.auth-user-name', '.auth-user-email', '.auth-user-chevron',
    '.auth-dropdown-item', '.auth-logout-btn',
    '.owner-dashboard', '#ownerDashboardSection',
    '#ownerProfileIcon', '#ownerProfileSection',
    '#welcomeCardSection', '#invitationCenterContainer',
    '.dash-btn-gold', '.dash-header', '.dash-sidebar',
    '.dashboard-header', '.dashboard-sidebar',
    '.floating-wrapper', '#floatingWrapper', '#floatingPanel',
    '.fp-toggle', '.fp-panel',
    '.edit-btn', '.btn-publish', '.publish-btn', '.btn-publish-website',
    '#btnPublish', '#btnPublishWebsite',
    '.admin-nav', '.admin-link', '[data-admin]',
    '[data-owner]', '[data-dev-credit]', '[data-admin-credit]',
    '#devPopupOverlay', '.developer-popup',
    '.notif-badge', '#notifBadge',
    '.inner-back-btn',
    '.welcome-dropdown', '.welcome-dropdown-item',
    '.owner-profile-dropdown', '.owner-profile-dd-item',
    '.preview-badge', '.draft-badge', '.draft-indicator',
    '.publish-indicator', '.live-badge',
    '.setup-progress', '.setup-reminder',
    '.wizard-step', '.setup-wizard',
    '.notification-center', '#notificationCenter',
    '.account-menu', '.account-dropdown',
    '.logout-btn', '[onclick*="logout"]', '[onclick*="Logout"]',
    '[href="dashboard.html"]', '[href="setup.html"]',
    '[href="settings.html"]', '[href="admin.html"]',
    '[href="analytics.html"]', '[href="reports.html"]',
    '[href="planner.html"]', '[href="profile.html"]',
    '[href="customize.html"]', '[href="developer.html"]',
    '[href="memories.html"]', '[href="invitation.html"]',
    '[href="share.html"]', '[href="preview.html"]',
    '[href="guests.html"]', '[href="invitation-center.html"]',
    '[href="ai-assistant.html"]',
    '.ai-assistant-widget', '#aiAssistantWidget',
    '.publish-updates', '.publish-button',
    '.get-started-btn', '.get-started-section',
    '.quick-actions-panel',
    '.toast-container', '.ds-toast-container'
  ];

  var STYLE_RULES = HIDE_SELECTORS.map(function (s) {
    return s + '{display:none!important;visibility:hidden!important;pointer-events:none!important;opacity:0!important;width:0!important;height:0!important;overflow:hidden!important;position:absolute!important;z-index:-9999!important}';
  }).join('\n') +
  '.invite-page .owner-only, .invite-page [data-owner-only]{display:none!important;visibility:hidden!important}' +
  '.invite-page .auth-notification{display:none!important}' +
  '.invite-loading{position:fixed;inset:0;z-index:100000;background:var(--bg,#0B0F19);display:flex;flex-direction:column;align-items:center;justify-content:center;transition:opacity 0.6s ease}' +
  '#inviteContent[style*="display:block"] ~ .invite-loading{opacity:0;pointer-events:none}' +
  '.invite-page [class*="dash"], .invite-page [id*="dash"], .invite-page [class*="admin"], .invite-page [id*="admin"], .invite-page [class*="owner"], .invite-page [id*="owner"]{display:none!important;visibility:hidden!important;width:0!important;height:0!important;overflow:hidden!important;position:absolute!important;z-index:-9999!important;pointer-events:none!important;opacity:0!important}' +
  '.invite-page a[href*="setup"], .invite-page a[href*="dashboard"], .invite-page a[href*="planner"], .invite-page a[href*="profile"], .invite-page a[href*="settings"], .invite-page a[href*="customize"], .invite-page a[href*="developer"], .invite-page a[href*="memories"], .invite-page a[href*="admin"], .invite-page a[href*="analytics"], .invite-page a[href*="reports"], .invite-page a[href*="guests"], .invite-page a[href*="invitation-center"], .invite-page a[href*="ai-assistant"], .invite-page a[href*="preview"], .invite-page a[href*="share.html"], .invite-page a[href*="login"], .invite-page a[href*="signup"], .invite-page a[href*="forgot-password"]{display:none!important;visibility:hidden!important;width:0!important;height:0!important;overflow:hidden!important;position:absolute!important;z-index:-9999!important;pointer-events:none!important;opacity:0!important}';

  function injectGuardStyles() {
    if (document.getElementById(GUARD_INJECTED_STYLE)) return;
    var style = document.createElement('style');
    style.id = GUARD_INJECTED_STYLE;
    style.textContent = STYLE_RULES;
    document.head.appendChild(style);
  }

  function purgeAdminElements() {
    HIDE_SELECTORS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        el.remove();
      });
    });
    document.querySelectorAll('[class*="dash"],[id*="dash"],[class*="admin"],[id*="admin"],[class*="owner"],[id*="owner"]').forEach(function (el) {
      if (el.closest('#inviteContent')) return;
      if (el.id === 'inviteContent') return;
      el.remove();
    });
    document.querySelectorAll('a[href*="setup"],a[href*="dashboard"],a[href*="planner"],a[href*="profile"],a[href*="settings"],a[href*="customize"],a[href*="developer"],a[href*="memories"],a[href*="admin"],a[href*="analytics"],a[href*="reports"],a[href*="guests"],a[href*="invitation-center"],a[href*="ai-assistant"],a[href*="preview"],a[href*="share.html"],a[href*="login"],a[href*="signup"]').forEach(function (el) {
      if (el.closest('#inviteContent')) return;
      el.remove();
    });
  }

  function safeStringify(obj) {
    try { return JSON.stringify(obj); } catch (e) { return '{}'; }
  }

  function getPublicInviteUrl() {
    try {
      var d = JSON.parse(localStorage.getItem('weddingData') || '{}');
      if (d.weddingId) {
        return window.location.origin + '/invite/' + d.weddingId;
      }
    } catch (e) {}
    var pathParts = window.location.pathname.split('/');
    for (var i = 0; i < pathParts.length; i++) {
      if (pathParts[i] === 'invite' && i + 1 < pathParts.length) {
        return window.location.origin + '/invite/' + pathParts[i + 1];
      }
    }
    return window.location.href;
  }

  function overrideDangerousAPIs() {
    var dangerousOverrides = [
      'renderOwnerDashboard', 'renderUserMenu', 'toggleUserDropdown',
      'showDeveloperPopup', 'DeveloperPopup.show',
      'markSetupComplete', 'isSetupComplete',
      'getWeddingProgress', 'getRecentActivity', 'addActivity',
      'renderInvitationCenter', 'renderDashboard',
      'PublishEngine.publish', 'PublishEngine.validate',
      'renderAdminPanel', 'showAdminPanel',
      'toggleAdminMenu', 'openDashboard',
      'openSetup', 'openSettings', 'openPlanner',
      'renderNotifications', 'updateNotifBadge',
      'setupWizard', 'showSetupWizard'
    ];
    dangerousOverrides.forEach(function (name) {
      var parts = name.split('.');
      if (parts.length === 1) {
        if (typeof window[parts[0]] === 'function') {
          window[parts[0]] = function () {};
        }
      } else {
        var obj = window;
        for (var i = 0; i < parts.length - 1; i++) {
          if (obj[parts[i]]) obj = obj[parts[i]];
          else break;
        }
        if (obj && typeof obj[parts[parts.length - 1]] === 'function') {
          obj[parts[parts.length - 1]] = function () {};
        }
      }
    });
  }

  function preventPrivateNavigation() {
    document.addEventListener('click', function (e) {
      var target = e.target;
      while (target && target !== document.body) {
        if (target.tagName === 'A') {
          var href = target.getAttribute('href') || '';
          href = href.split('?')[0].split('#')[0];
          var blocked = ['dashboard.html', 'setup.html', 'settings.html', 'admin.html', 'analytics.html', 'reports.html', 'planner.html', 'profile.html', 'customize.html', 'developer.html', 'memories.html', 'invitation.html', 'share.html', 'preview.html', 'guests.html', 'invitation-center.html', 'ai-assistant.html', 'login.html', 'signup.html', 'forgot-password.html'];
          if (blocked.indexOf(href) !== -1 || href.indexOf('/dashboard') === 0 || href.indexOf('/setup') === 0 || href.indexOf('/settings') === 0 || href.indexOf('/admin') === 0 || href.indexOf('/analytics') === 0 || href.indexOf('/reports') === 0) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
          break;
        }
        target = target.parentElement;
      }
    }, true);
  }

  function preventHistoryLeaks() {
    try {
      if (window.history && window.history.replaceState) {
        var cleanUrl = window.location.origin + window.location.pathname + window.location.search;
        window.history.replaceState({ invitePage: true, ts: Date.now() }, document.title, cleanUrl);
      }
    } catch (e) {}
  }

  function guardInit() {
    injectGuardStyles();
    purgeAdminElements();
    overrideDangerousAPIs();
    preventPrivateNavigation();
    preventHistoryLeaks();
    var obs = new MutationObserver(function () {
      purgeAdminElements();
    });
    if (document.body) {
      obs.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener('DOMContentLoaded', function () {
        obs.observe(document.body, { childList: true, subtree: true });
      });
    }
    var styleCheck = setInterval(function () {
      if (!document.getElementById(GUARD_INJECTED_STYLE)) {
        injectGuardStyles();
      }
    }, 500);
    setTimeout(function () { clearInterval(styleCheck); }, 30000);
    var purgeTimer = setInterval(purgeAdminElements, 2000);
    setTimeout(function () { clearInterval(purgeTimer); }, 60000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', guardInit);
  } else {
    guardInit();
  }

})();
