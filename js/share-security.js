/**
 * Phase 14 — Share Security Module
 * Ensures all sharing generates ONLY the public invitation URL
 * Never exposes dashboard, setup, analytics, admin, or private routes
 */
(function () {
  'use strict';

  var S = window.__SHARE_SECURITY = window.__SHARE_SECURITY || {};
  if (S.initialized) return;
  S.initialized = true;

  function getWeddingId() {
    try {
      var d = JSON.parse(localStorage.getItem('weddingData') || '{}');
      return d.weddingId || null;
    } catch (e) { return null; }
  }

  function getPublicInviteUrl() {
    var id = getWeddingId();
    if (!id) return null;
    return window.location.origin + '/invite/' + id;
  }

  /* ===== OVERRIDE SHARE FUNCTIONS ===== */
  function secureShareTo(platform) {
    var url = getPublicInviteUrl();
    if (!url) {
      if (typeof InviteSys !== 'undefined' && InviteSys.notify) {
        InviteSys.notify('Please publish your wedding first', 'warning');
      }
      return;
    }

    var d = {};
    try { d = JSON.parse(localStorage.getItem('weddingData') || '{}'); } catch (e) {}
    var groom = d.groomName || 'Groom';
    var bride = d.brideName || 'Bride';
    var date = d.weddingDate ? new Date(d.weddingDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '';
    var venue = d.venue || '';

    var text = 'You\'re cordially invited to the wedding of ' + groom + ' & ' + bride + '! \uD83D\uDC8D\n\n';
    if (date) text += '\uD83D\uDCC5 ' + date + '\n';
    if (d.weddingTime) text += '\uD83D\uDD50 ' + d.weddingTime + '\n';
    if (venue) text += '\uD83D\uDCCD ' + venue + '\n';
    text += '\nView invitation: ' + url;

    var subject = 'Wedding Invitation - ' + groom + ' & ' + bride;
    var encodedUrl = encodeURIComponent(url);
    var encodedText = encodeURIComponent(text);
    var encodedSubject = encodeURIComponent(subject);

    switch (platform) {
      case 'whatsapp':
        window.open('https://wa.me/?text=' + encodeURIComponent(text + '\n\n' + url), '_blank');
        break;
      case 'facebook':
        window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl, '_blank');
        break;
      case 'messenger':
        window.open('https://www.facebook.com/dialog/send?link=' + encodedUrl + '&app_id=87741124305&redirect_uri=' + encodedUrl, '_blank');
        break;
      case 'twitter':
        window.open('https://twitter.com/intent/tweet?text=' + encodedSubject + '&url=' + encodedUrl, '_blank');
        break;
      case 'telegram':
        window.open('https://t.me/share/url?url=' + encodedUrl + '&text=' + encodedText, '_blank');
        break;
      case 'linkedin':
        window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + encodedUrl, '_blank');
        break;
      case 'email':
        window.location.href = 'mailto:?subject=' + encodedSubject + '&body=' + encodedText;
        break;
      case 'sms':
        window.open('sms:?&body=' + encodedText, '_blank');
        break;
      case 'copy':
        copyPublicUrl(url);
        break;
      default:
        if (navigator.share) {
          navigator.share({ title: subject, text: text, url: url }).catch(function () {});
        } else {
          copyPublicUrl(url);
        }
    }
  }

  function copyPublicUrl(url) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function () {
        if (typeof InviteSys !== 'undefined' && InviteSys.notify) {
          InviteSys.notify('Public invitation link copied!', 'success');
        } else if (typeof showNotification === 'function') {
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
      if (typeof InviteSys !== 'undefined' && InviteSys.notify) {
        InviteSys.notify('Public invitation link copied!', 'success');
      } else if (typeof showNotification === 'function') {
        showNotification('Public invitation link copied!', 'success');
      }
    }
  }

  /* ===== OVERRIDE DOM SHARE BUTTONS ===== */
  function secureShareButtons() {
    var url = getPublicInviteUrl();
    if (!url) return;

    /* Override all share buttons to use public URL only */
    document.querySelectorAll('[onclick*="shareTo("], [onclick*="shareTo(\'"]').forEach(function (el) {
      var match = el.getAttribute('onclick').match(/shareTo\(['"]([^'"]+)['"]\)/);
      if (match) {
        var platform = match[1];
        el.setAttribute('onclick', 'ShareSec.shareTo("' + platform + '")');
      }
    });

    /* Override copy link buttons */
    document.querySelectorAll('[onclick*="copyLink"]').forEach(function (el) {
      el.setAttribute('onclick', 'ShareSec.copyLink()');
    });

    /* Override any invite link generators */
    document.querySelectorAll('.invite-link-input').forEach(function (input) {
      input.value = url;
    });

    /* Override any share via native */
    document.querySelectorAll('[onclick*="shareViaNative"]').forEach(function (el) {
      el.setAttribute('onclick', 'ShareSec.shareViaNative()');
    });
  }

  /* ===== NATIVE SHARE ===== */
  function secureNativeShare() {
    var url = getPublicInviteUrl();
    if (!url) return false;
    if (navigator.share) {
      var d = {};
      try { d = JSON.parse(localStorage.getItem('weddingData') || '{}'); } catch (e) {}
      var subject = 'Wedding Invitation - ' + (d.groomName || 'Groom') + ' & ' + (d.brideName || 'Bride');
      navigator.share({ title: subject, url: url }).catch(function () {});
      return true;
    }
    return false;
  }

  /* ===== PUBLIC API ===== */
  S.getPublicInviteUrl = getPublicInviteUrl;
  S.shareTo = secureShareTo;
  S.copyLink = function () {
    var url = getPublicInviteUrl();
    if (url) copyPublicUrl(url);
  };
  S.shareViaNative = function () {
    if (!secureNativeShare()) {
      S.copyLink();
    }
  };
  S.secureButtons = secureShareButtons;

  /* ===== EXPOSE GLOBALLY ===== */
  window.ShareSec = S;

  /* Also override the existing InviteSys share methods if available */
  if (typeof InviteSys !== 'undefined') {
    var origShareTo = InviteSys.shareTo;
    InviteSys.shareTo = function (platform) {
      secureShareTo(platform);
    };
    InviteSys.copyLink = function () {
      S.copyLink();
    };
    InviteSys.shareViaNative = function () {
      S.shareViaNative();
    };
    InviteSys.getInvitationUrl = function () {
      return getPublicInviteUrl() || (origShareTo ? origShareTo() : '#');
    };
  }

  /* ===== INIT ===== */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', secureShareButtons);
  } else {
    secureShareButtons();
  }

  /* Watch for dynamic share content */
  setTimeout(secureShareButtons, 2000);
  setTimeout(secureShareButtons, 5000);

})();
