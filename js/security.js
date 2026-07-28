(function() {
  'use strict';
  if (window.__WEDDING_SECURITY) return;
  window.__WEDDING_SECURITY = true;

  var PRIVATE_PAGES = [
    'dashboard.html', 'setup.html', 'settings.html', 'admin.html',
    'share.html', 'planner.html', 'developer.html', 'profile.html',
    'customize.html', 'preview.html', 'reminders.html', 'memories.html',
    'ai-assistant.html', 'invitation.html', 'analytics.html',
    'index.html', 'about.html', 'our-story.html', 'wedding-details.html',
    'wedding-party.html', 'rsvp.html', 'gallery.html', 'music.html',
    'gift-registry.html', 'events.html', 'story.html', 'timeline.html',
    'contact.html', 'faq.html', 'media.html', 'gift-registry.html'
  ];

  var PUBLIC_PAGES = [
    'invite.html', 'login.html', 'signup.html', 'forgot-password.html',
    '403.html', '404.html', '500.html', 'maintenance.html',
    'privacy.html', 'terms.html'
  ];

  var currentPage = window.location.pathname.split('/').pop() || 'index.html';

  function isGuestPage() {
    return currentPage === 'invite.html';
  }

  function isPublicPage() {
    return PUBLIC_PAGES.indexOf(currentPage) !== -1;
  }

  function isPrivatePage() {
    return PRIVATE_PAGES.indexOf(currentPage) !== -1;
  }

  function getSession() {
    try {
      var s = JSON.parse(localStorage.getItem('weddingAuthSession'));
      if (!s || !s.expiresAt || Date.now() > s.expiresAt) {
        localStorage.removeItem('weddingAuthSession');
        return null;
      }
      s.lastActivity = Date.now();
      localStorage.setItem('weddingAuthSession', JSON.stringify(s));
      return s;
    } catch (e) { return null; }
  }

  function isOwner() {
    var session = getSession();
    if (!session) return false;
    try {
      var users = JSON.parse(localStorage.getItem('weddingAuthUsers') || '[]');
      var user = users.find(function(u) { return u.id === session.userId; });
      return !!user;
    } catch (e) { return false; }
  }

  function redirectToLogin() {
    var redirectUrl = encodeURIComponent(currentPage);
    window.location.replace('login.html?redirect=' + redirectUrl);
  }

  function redirectTo403() {
    window.location.replace('403.html');
  }

  function getWeddingIdFromPath() {
    var pathParts = window.location.pathname.split('/');
    var lastPart = pathParts[pathParts.length - 1];
    if (lastPart && lastPart.length > 10 && lastPart.indexOf('.html') === -1 && lastPart.indexOf('.') === -1) {
      return lastPart;
    }
    var params = new URLSearchParams(window.location.search);
    return params.get('id') || params.get('wedding') || params.get('invite') || null;
  }

  function isInvitePath() {
    var path = window.location.pathname;
    return path.indexOf('/invite/') !== -1;
  }

  window.WeddingSecurity = {
    isOwner: isOwner,
    getSession: getSession,
    isGuestPage: isGuestPage,
    isPublicPage: isPublicPage,
    isPrivatePage: isPrivatePage,
    isInvitePath: isInvitePath,
    getWeddingIdFromPath: getWeddingIdFromPath,
    currentPage: currentPage,

    enforce: function() {
      if (isGuestPage() || isInvitePath()) return;
      if (isPublicPage()) return;
      if (isPrivatePage()) {
        var session = getSession();
        if (!session) {
          redirectToLogin();
          return;
        }
        if (!isOwner()) {
          redirectTo403();
          return;
        }
      }
    }
  };

  window.WeddingSecurity.enforce();
})();
