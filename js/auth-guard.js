/**
 * Phase 14 — Secure Guest Invitation System
 * Enhanced Auth Guard with Public/Private Access Control
 *
 * PRIVATE ROUTES (require authentication + ownership):
 *   dashboard, setup, settings, analytics, admin,
 *   invitation-center, guests, reports, planner, profile,
 *   customize, gallery, video-mgmt, music-mgmt, gift-settings,
 *   timeline-editor, theme-settings, notifications, account,
 *   developer, admin-pages, invitation, memories
 *
 * PUBLIC ROUTES (no auth required):
 *   invite.html, invite/{id}, index.html (public sections)
 *
 * GUESTS accessing private routes → 403.html
 * NOT LOGGED IN accessing private routes → login.html
 * LOGGED IN but NOT OWNER → 403.html
 */
(function () {
  'use strict';

  var CURRENT_PAGE = window.location.pathname.split('/').pop() || 'index.html';
  var CURRENT_PATH = window.location.pathname;

  /* ===== PRIVATE PAGES (owner-only, require auth + ownership) ===== */
  var PRIVATE_PAGES = [
    'dashboard.html', 'setup.html', 'settings.html', 'analytics.html',
    'admin.html', 'invitation-center.html', 'guests.html', 'reports.html',
    'planner.html', 'profile.html', 'customize.html', 'developer.html',
    'invitation.html', 'memories.html', 'ai-assistant.html',
    'preview.html', 'share.html', 'reminders.html', 'media.html',
    'index.html', 'about.html', 'our-story.html', 'wedding-details.html',
    'wedding-party.html', 'events.html', 'gallery.html', 'timeline.html',
    'story.html', 'rsvp.html', 'gift-registry.html', 'music.html',
    'faq.html', 'contact.html'
  ];

  /* Pages accessible to any logged-in user */
  var AUTH_PAGES = ['login.html', 'signup.html', 'forgot-password.html'];

  /* ===== PUBLIC PAGES (guests + owners - no auth required) ===== */
  var PUBLIC_PAGES = [
    'invite.html', 'terms.html', 'privacy.html',
    '403.html', '404.html', '500.html', 'maintenance.html'
  ];

  /* ===== INVITE PAGE DETECTION ===== */
  var isInvitePage = (CURRENT_PAGE === 'invite.html' ||
    CURRENT_PATH.indexOf('/invite/') === 0 ||
    CURRENT_PATH.indexOf('/inv/') === 0);

  /* ===== GUEST DETECTION ===== */
  function isGuest() {
    try {
      var s = localStorage.getItem('weddingAuthSession');
      if (!s) return true;
      var sess = JSON.parse(s);
      if (!sess || !sess.userId || !sess.expiresAt) return true;
      if (Date.now() > sess.expiresAt) {
        localStorage.removeItem('weddingAuthSession');
        return true;
      }
      return false;
    } catch (e) { return true; }
  }

  function getCurrentSession() {
    try {
      var s = localStorage.getItem('weddingAuthSession');
      if (!s) return null;
      var sess = JSON.parse(s);
      if (!sess || !sess.userId || !sess.expiresAt) return null;
      if (Date.now() > sess.expiresAt) {
        localStorage.removeItem('weddingAuthSession');
        return null;
      }
      return sess;
    } catch (e) { return null; }
  }

  function getWeddingOwnerId() {
    try {
      var wd = JSON.parse(localStorage.getItem('weddingData') || '{}');
      return wd.ownerId || wd.createdBy || null;
    } catch (e) { return null; }
  }

  function isOwner() {
    var session = getCurrentSession();
    if (!session) return false;
    var ownerId = getWeddingOwnerId();
    if (!ownerId) {
      if (session.userId) return true;
      return false;
    }
    return session.userId === ownerId;
  }

  /* ===== REDIRECT TO BRANDED 403 ===== */
  function redirectTo403() {
    var currentPath = window.location.href;
    window.location.replace('403.html?ref=' + encodeURIComponent(currentPath));
  }

  /* ===== REDIRECT TO BRANDED 404 ===== */
  function redirectTo404() {
    var currentPath = window.location.href;
    window.location.replace('404.html?ref=' + encodeURIComponent(currentPath));
  }

  /* ===== REDIRECT TO LOGIN ===== */
  function redirectToLogin() {
    var redirectUrl = encodeURIComponent(CURRENT_PAGE);
    window.location.replace('login.html?redirect=' + redirectUrl);
  }

  /* ===== MAIN GUARD ===== */
  function runGuard() {
    /* Always allow invite pages for guests */
    if (isInvitePage) return;

    /* Public pages are always accessible */
    if (PUBLIC_PAGES.indexOf(CURRENT_PAGE) !== -1) return;

    /* Allow auth pages */
    if (AUTH_PAGES.indexOf(CURRENT_PAGE) !== -1) return;

    /* Check if current page is private (requires auth) */
    var isPrivate = PRIVATE_PAGES.indexOf(CURRENT_PAGE) !== -1;

    /* Also check path patterns for admin/owner routes */
    if (!isPrivate) {
      var privatePatterns = ['/dashboard', '/setup', '/settings', '/analytics',
        '/admin', '/invitation-center', '/guests', '/reports', '/planner',
        '/profile', '/customize', '/developer', '/preview', '/share',
        '/memories', '/ai-assistant', '/reminders', '/media',
        '/gallery-manager', '/video-manager', '/music-manager',
        '/gift-manager', '/timeline-editor', '/theme-settings',
        '/account-settings', '/notifications', '/guest-manager',
        '/rsvp-manager', '/reports', '/owner'];
      for (var i = 0; i < privatePatterns.length; i++) {
        if (CURRENT_PATH.indexOf(privatePatterns[i]) !== -1) {
          isPrivate = true;
          break;
        }
      }
    }

    if (!isPrivate) return;

    /* Guard private pages */
    if (isGuest()) {
      redirectToLogin();
      return;
    }

    if (!isOwner()) {
      redirectTo403();
      return;
    }
  }

  /* ===== HIDE ADMIN UI ELEMENTS FROM GUESTS ===== */
  function hideAdminUI() {
    if (!isGuest() && !window.__PUBLIC_INVITE_PAGE) return;

    /* Remove all admin/edit buttons */
    var selectors = [
      '.edit-btn', '.publish-btn', '.publish-button', '.btn-publish',
      '.admin-nav', '.admin-link', '[data-admin]',
      '.sidebar-link[href*="dashboard"]',
      '.sidebar-link[href*="setup"]',
      '.sidebar-link[href*="settings"]',
      '.sidebar-link[href*="planner"]',
      '.sidebar-link[href*="profile"]',
      '.sidebar-link[href*="developer"]',
      '.sidebar-link[href*="admin"]',
      '.sidebar-link[href*="memories"]',
      '.sidebar-link[href*="invitation"]',
      '.sidebar-link[href*="share"]',
      '.sidebar-link[href*="customize"]',
      '#btnPublish', '#btnPublishWebsite', '.btn-publish-website',
      '.dash-btn-gold', '[onclick*="PublishEngine"]',
      '[onclick*="publish"]', '[onclick*="Publish"]',
      '#ownerDashboardSection', '#ownerProfileIcon',
      '#invitationCenterContainer', '#welcomeCardSection',
      '.floating-wrapper', '#floatingWrapper', '#floatingPanel',
      '.fp-toggle', '.fp-panel', '.fp-body',
      '[data-owner]', '[data-dev-credit]', '[data-admin-credit]',
      '.auth-user-menu', '.auth-user-dropdown', '#authUserDropdown',
      '.auth-user-trigger', '.auth-user-avatar', '.auth-user-name',
      '.auth-user-email', '.auth-user-chevron',
      '.auth-dropdown-item', '.auth-logout-btn',
      '.owner-dashboard', '#ownerDashboardSection',
      '.sidebar', '#sidebarNav', '#sidebarOverlay', '#sidebarToggle',
      '.dash-header', '.dash-sidebar', '.dashboard-header',
      '.notif-badge', '#notifBadge',
      '.welcome-dropdown', '.welcome-dropdown-item',
      '.owner-profile-dropdown', '.owner-profile-dd-item',
      '.draft-badge', '.draft-indicator',
      '.publish-indicator', '.live-badge',
      '.setup-progress', '.setup-reminder',
      '.setup-wizard', '.wizard-step',
      '.notification-center', '#notificationCenter',
      '.account-menu', '.account-dropdown',
      '.logout-btn', '[onclick*="logout"]', '[onclick*="Logout"]',
      '.ai-assistant-widget', '#aiAssistantWidget',
      '.publish-updates', '.publish-button',
      '.get-started-btn', '.get-started-section',
      '.quick-actions-panel'
    ];
    selectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        el.style.display = 'none';
      });
    });

    /* Remove back buttons to admin pages */
    document.querySelectorAll('.inner-back-btn').forEach(function (el) {
      var href = el.getAttribute('href');
      if (href === 'index.html') return;
      var adminLinks = ['setup', 'dashboard', 'planner', 'settings', 'profile', 'customize', 'share', 'developer', 'memories', 'invitation'];
      var isAdmin = false;
      for (var i = 0; i < adminLinks.length; i++) {
        if (href.indexOf(adminLinks[i]) !== -1) { isAdmin = true; break; }
      }
      if (isAdmin) el.style.display = 'none';
    });
  }

  /* ===== APPLY GUEST RESTRICTIONS TO NAV ===== */
  function restrictNavigation() {
    if (!isGuest() && !window.__PUBLIC_INVITE_PAGE) return;

    /* Override sidebar link clicks to prevent navigation to private pages */
    document.querySelectorAll('.sidebar-link, .welcome-dropdown-item, .owner-profile-dd-item, .auth-dropdown-item').forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href) return;
      var privateLinks = ['setup.html', 'dashboard.html', 'planner.html', 'profile.html',
        'settings.html', 'customize.html', 'developer.html', 'memories.html',
        'invitation.html', 'share.html', 'preview.html', 'analytics.html',
        'admin.html', 'guests.html', 'reports.html', 'invitation-center.html'];
      for (var i = 0; i < privateLinks.length; i++) {
        if (href === privateLinks[i]) {
          link.style.display = 'none';
          break;
        }
      }
    });

    /* Hide auth menu dropdown items for guests */
    var dropdowns = document.querySelectorAll('.auth-user-dropdown, .welcome-dropdown, .owner-profile-dropdown');
    dropdowns.forEach(function (dd) {
      dd.querySelectorAll('a').forEach(function (a) {
        var href = a.getAttribute('href');
        if (!href) return;
        if (href.indexOf('setup') !== -1 || href.indexOf('dashboard') !== -1 ||
            href.indexOf('planner') !== -1 || href.indexOf('settings') !== -1) {
          a.style.display = 'none';
        }
      });
    });
  }

  /* ===== SECURE SHARE ===== */
  function secureShareLinks() {
    /* Ensure all share buttons use the public invite URL only */
    var publicInviteUrl = null;
    try {
      var d = JSON.parse(localStorage.getItem('weddingData') || '{}');
      if (d.weddingId) {
        publicInviteUrl = window.location.origin + '/invite/' + d.weddingId;
      }
    } catch (e) {}

    if (!publicInviteUrl) return;

    /* Override copy/share to clipboard actions */
    document.querySelectorAll('[onclick*="copyLink"], [onclick*="copy"], [onclick*="clipboard"]').forEach(function (el) {
      var original = el.getAttribute('onclick');
      if (original && original.indexOf('publicInviteUrl') === -1) {
        el.setAttribute('onclick', 'copyPublicInviteUrl("' + publicInviteUrl + '")');
      }
    });
  }

  /* ===== INVITE PAGE EARLY EXIT ===== */
  function isOnInvitePage() {
    var page = window.location.pathname.split('/').pop() || '';
    return page === 'invite.html' || window.location.pathname.indexOf('/invite/') === 0 || window.location.pathname.indexOf('/inv/') === 0 || window.__PUBLIC_INVITE_PAGE === true;
  }

  /* ===== INIT ===== */
  function init() {
    if (isOnInvitePage()) {
      /* On public invite page — skip all auth guarding, hideAdminUI, and restrictNavigation.
         The invite-guard.js handles all content lockdown. */
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
          hideAdminUI();
          restrictNavigation();
          secureShareLinks();
        });
      } else {
        hideAdminUI();
        restrictNavigation();
        secureShareLinks();
      }
      var observer = new MutationObserver(function () {
        hideAdminUI();
        restrictNavigation();
      });
      if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
      }
      return;
    }

    runGuard();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        hideAdminUI();
        restrictNavigation();
        secureShareLinks();
      });
    } else {
      hideAdminUI();
      restrictNavigation();
      secureShareLinks();
    }

    /* Watch for dynamically added admin elements */
    var observer = new MutationObserver(function () {
      hideAdminUI();
      restrictNavigation();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  /* ===== EXPOSE PUBLIC HELPER ===== */
  window.copyPublicInviteUrl = function (url) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function () {
        if (typeof showNotification === 'function') {
          showNotification('Public invitation link copied!', 'success');
        }
      });
    } else {
      var ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      if (typeof showNotification === 'function') {
        showNotification('Public invitation link copied!', 'success');
      }
    }
  };

  window.isGuest = isGuest;
  window.isOwner = isOwner;

  init();

})();
