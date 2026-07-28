/**
 * Wedding Invitation Sharing & RSVP System
 * Complete production-ready module with secure public/private separation
 */
(function () {
  'use strict';

  var W = window.__WEDDING_INVITE_SYSTEM = window.__WEDDING_INVITE_SYSTEM || {};
  if (W.initialized) return;
  W.initialized = true;

  var DB_KEY = 'weddingData';
  var INVITATIONS_KEY = 'weddingInvitations';
  var RSVP_COOKIE_PREFIX = 'wrsvp_';
  var RSVP_STORAGE_KEY = 'wedding_rsvp_submissions';

  function getData() {
    try {
      var r = localStorage.getItem(DB_KEY);
      return r ? JSON.parse(r) : {};
    } catch (e) { return {}; }
  }

  function saveData(d) {
    localStorage.setItem(DB_KEY, JSON.stringify(d));
    try {
      if (typeof fbSetDoc === 'function') {
        fbSetDoc('weddingInfo', 'main', d);
      }
    } catch (e) {}
  }

  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  function getInvitationBaseUrl() {
    return window.location.origin + '/invite/';
  }

  function getInvitationUrl(weddingId) {
    return getInvitationBaseUrl() + (weddingId || getWeddingId());
  }

  function getWeddingId() {
    var d = getData();
    if (!d.weddingId) {
      d.weddingId = genId();
      saveData(d);
    }
    return d.weddingId;
  }

  function updateWeddingId() {
    var d = getData();
    if (!d.weddingId) {
      d.weddingId = genId();
      saveData(d);
    }
    return d.weddingId;
  }

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function getGuestIp(cb) { cb(''); }

  function getDeviceInfo() {
    var info = {
      userAgent: navigator.userAgent || '',
      platform: navigator.platform || '',
      language: navigator.language || '',
      screenSize: (screen.width || 0) + 'x' + (screen.height || 0),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      timestamp: new Date().toISOString()
    };
    return info;
  }

  function setCookie(name, value, days) {
    days = days || 365;
    var d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = name + '=' + encodeURIComponent(value) + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
  }

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  function hasResponded(weddingId) {
    var c = getCookie(RSVP_COOKIE_PREFIX + weddingId);
    if (c) return true;
    try {
      var s = localStorage.getItem(RSVP_STORAGE_KEY + '_' + weddingId);
      if (s) return true;
    } catch (e) {}
    return false;
  }

  function markResponded(weddingId, status) {
    setCookie(RSVP_COOKIE_PREFIX + weddingId, status, 365);
    try {
      localStorage.setItem(RSVP_STORAGE_KEY + '_' + weddingId, JSON.stringify({ status: status, time: Date.now() }));
    } catch (e) {}
  }

  function notify(msg, type) {
    var existing = document.querySelector('.invite-toast');
    if (existing) existing.remove();
    var t = document.createElement('div');
    t.className = 'invite-toast';
    var icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle', warning: 'fa-exclamation-triangle' };
    var bgColors = { success: 'rgba(34,197,94,0.95)', error: 'rgba(239,68,68,0.95)', info: 'rgba(59,130,246,0.95)', warning: 'rgba(245,158,11,0.95)' };
    var iconColors = { success: '#22c55e', error: '#ef4444', info: '#3b82f6', warning: '#f59e0b' };
    t.style.cssText = 'position:fixed;top:24px;left:50%;transform:translateX(-50%) translateY(-20px);z-index:100001;padding:14px 24px;border-radius:12px;background:' + (bgColors[type] || bgColors.info) + ';backdrop-filter:blur(20px);box-shadow:0 8px 32px rgba(0,0,0,0.4);display:flex;align-items:center;gap:10px;font-size:0.88rem;color:#fff;opacity:0;transition:all 0.4s cubic-bezier(0.34,1.56,0.64,1)';
    t.innerHTML = '<div style="width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center"><i class="fas ' + (icons[type] || icons.info) + '" style="color:#fff"></i></div><span>' + msg + '</span>';
    document.body.appendChild(t);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        t.style.transform = 'translateX(-50%) translateY(0)';
        t.style.opacity = '1';
      });
    });
    setTimeout(function () {
      t.style.transform = 'translateX(-50%) translateY(-20px)';
      t.style.opacity = '0';
      setTimeout(function () { if (t.parentElement) t.remove(); }, 400);
    }, 3500);
  }

  function generateQR(text, size, callback) {
    size = size || 200;
    if (typeof QRCode === 'undefined') {
      var canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#000000';
      var modules = 25;
      var cellSize = size / modules;
      var seed = 0;
      for (var i = 0; i < text.length; i++) seed = ((seed << 5) - seed) + text.charCodeAt(i);
      function rand() { seed = (seed * 16807 + 0) % 2147483647; return (seed & 1); }
      for (var r = 0; r < modules; r++) {
        for (var c = 0; c < modules; c++) {
          if ((r < 7 && c < 7) || (r < 7 && c >= modules - 7) || (r >= modules - 7 && c < 7)) {
            if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= modules - 7 && c >= modules - 7) || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
              ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
            }
          } else if (rand()) {
            ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
          }
        }
      }
      if (callback) callback(canvas.toDataURL('image/png'));
      return canvas;
    } else {
      var qrContainer = document.createElement('div');
      var qr = new QRCode(qrContainer, { text: text, width: size, height: size, correctLevel: QRCode.CorrectLevel.H });
      setTimeout(function () {
        var img = qrContainer.querySelector('img') || qrContainer.querySelector('canvas');
        if (img) {
          if (callback) callback(img.src || img.toDataURL('image/png'));
        }
      }, 200);
      return qrContainer;
    }
  }

  function downloadQR(weddingId) {
    var url = getInvitationUrl(weddingId);
    var size = 300;
    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000000';
    var modules = 25;
    var cellSize = size / modules;
    var seed = 0;
    for (var i = 0; i < url.length; i++) seed = ((seed << 5) - seed) + url.charCodeAt(i);
    function rand() { seed = (seed * 16807 + 0) % 2147483647; return (seed & 1); }
    for (var r = 0; r < modules; r++) {
      for (var c = 0; c < modules; c++) {
        if ((r < 7 && c < 7) || (r < 7 && c >= modules - 7) || (r >= modules - 7 && c < 7)) {
          if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= modules - 7 && c >= modules - 7) || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
          }
        } else if (rand()) {
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      }
    }
    var link = document.createElement('a');
    link.download = 'wedding-invitation-qr.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    notify('QR Code downloaded!', 'success');
    trackEvent('qr_download');
  }

  var SHARE_PLATFORMS = [
    { id: 'whatsapp', icon: 'fab fa-whatsapp', color: '#25D366', label: 'WhatsApp' },
    { id: 'facebook', icon: 'fab fa-facebook-f', color: '#1877F2', label: 'Facebook' },
    { id: 'messenger', icon: 'fab fa-facebook-messenger', color: '#006AFF', label: 'Messenger' },
    { id: 'instagram', icon: 'fab fa-instagram', color: '#E1306C', label: 'Instagram' },
    { id: 'twitter', icon: 'fab fa-x-twitter', color: '#000000', label: 'X (Twitter)' },
    { id: 'telegram', icon: 'fab fa-telegram-plane', color: '#0088CC', label: 'Telegram' },
    { id: 'tiktok', icon: 'fab fa-tiktok', color: '#000000', label: 'TikTok' },
    { id: 'snapchat', icon: 'fab fa-snapchat-ghost', color: '#FFFC00', label: 'Snapchat' },
    { id: 'discord', icon: 'fab fa-discord', color: '#5865F2', label: 'Discord' },
    { id: 'linkedin', icon: 'fab fa-linkedin-in', color: '#0077B5', label: 'LinkedIn' },
    { id: 'email', icon: 'fas fa-envelope', color: '#6B6B7B', label: 'Email' },
    { id: 'sms', icon: 'fas fa-comment-dots', color: '#4CAF50', label: 'SMS' },
    { id: 'copy', icon: 'fas fa-link', color: '#D4AF37', label: 'Copy Link' }
  ];

  function getShareText() {
    var d = getData();
    var groom = d.groomName || 'Groom';
    var bride = d.brideName || 'Bride';
    var date = d.weddingDate ? new Date(d.weddingDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '';
    var venue = d.venue || '';
    var msg = 'You\'re cordially invited to the wedding of ' + groom + ' & ' + bride + '! \uD83D\uDC8D\n\n';
    if (date) msg += '\uD83D\uDCC5 ' + date + '\n';
    if (d.weddingTime) msg += '\uD83D\uDD50 ' + d.weddingTime + '\n';
    if (venue) msg += '\uD83D\uDCCD ' + venue + '\n';
    msg += '\nView invitation: ' + getInvitationUrl();
    return msg;
  }

  function getShareSubject() {
    var d = getData();
    return 'Wedding Invitation - ' + (d.groomName || 'Groom') + ' & ' + (d.brideName || 'Bride');
  }

  function shareViaNativeAPI() {
    var url = getInvitationUrl();
    var text = getShareText();
    if (navigator.share) {
      navigator.share({ title: getShareSubject(), text: text, url: url })
        .then(function () { trackEvent('share_native'); })
        .catch(function () {});
      return true;
    }
    return false;
  }

  function shareTo(platform) {
    var url = getInvitationUrl();
    var text = getShareText();
    var subject = getShareSubject();
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
      case 'instagram':
        copyToClipboard(url);
        notify('Link copied! Open Instagram and paste in your story or bio.', 'info');
        break;
      case 'twitter':
        window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(subject) + '&url=' + encodedUrl, '_blank');
        break;
      case 'telegram':
        window.open('https://t.me/share/url?url=' + encodedUrl + '&text=' + encodedText, '_blank');
        break;
      case 'tiktok':
        copyToClipboard(url);
        notify('Link copied! Open TikTok and paste in your bio or video.', 'info');
        break;
      case 'snapchat':
        copyToClipboard(url);
        notify('Link copied! Paste it in Snapchat to share.', 'info');
        break;
      case 'discord':
        copyToClipboard(url);
        notify('Link copied! Paste it in Discord to share.', 'info');
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
        copyToClipboard(url);
        break;
      default:
        if (navigator.share) {
          navigator.share({ title: subject, text: text, url: url }).catch(function () {});
        } else {
          copyToClipboard(url);
        }
    }
    trackEvent('share_' + platform);
  }

  function copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function () {
        notify('Invitation link copied to clipboard!', 'success');
      });
    } else {
      var ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      notify('Invitation link copied to clipboard!', 'success');
    }
  }

  function renderShareButtons(containerId, compact) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var html = '';
    SHARE_PLATFORMS.forEach(function (p) {
      html += '<button class="share-btn-platform" data-platform="' + p.id + '" style="--plat-color:' + p.color + '" onclick="InviteSys.shareTo(\'' + p.id + '\')" title="Share on ' + p.label + '">' +
        '<i class="' + p.icon + '"></i>' + (compact ? '' : '<span>' + p.label + '</span>') +
        '</button>';
    });
    container.innerHTML = html;
    if (!document.getElementById('inviteShareBtnStyles')) {
      var sheet = document.createElement('style');
      sheet.id = 'inviteShareBtnStyles';
      sheet.textContent = '.share-btn-platform{display:inline-flex;align-items:center;gap:8px;padding:12px 18px;border-radius:50px;border:1px solid rgba(212,175,55,0.15);background:rgba(255,255,255,0.04);color:var(--text);font-family:var(--font-sans);font-size:0.82rem;cursor:pointer;transition:all 0.3s;text-decoration:none}.share-btn-platform:hover{background:var(--plat-color);color:#fff;border-color:var(--plat-color);transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.2)}.share-btn-platform i{font-size:1.1rem}';
      document.head.appendChild(sheet);
    }
  }

  function renderQRCode(containerId, weddingId) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var url = getInvitationUrl(weddingId);
    container.innerHTML = '';
    generateQR(url, 200, function (dataUrl) {
      container.innerHTML = '<img src="' + dataUrl + '" alt="QR Code" style="width:200px;height:200px;border-radius:12px;display:block">';
    });
  }

  function renderInvitationCenter(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var d = getData();
    var weddingId = getWeddingId();
    var url = getInvitationUrl(weddingId);
    var guests = d.guests || [];
    var total = guests.length;
    var accepted = guests.filter(function (g) { return g.rsvp === 'accepted'; }).length;
    var declined = guests.filter(function (g) { return g.rsvp === 'declined'; }).length;
    var maybe = guests.filter(function (g) { return g.rsvp === 'maybe'; }).length;
    var pending = total - accepted - declined - maybe;
    var expectedGuests = guests.reduce(function (sum, g) { return sum + (parseInt(g.guestCount) || 1); }, 0);

    container.innerHTML =
      '<div class="invite-center">' +
      '<div class="invite-center-header">' +
      '<h2><i class="fas fa-paper-plane"></i> Invitation Center</h2>' +
      '<p class="sub">Share your wedding invitation with friends and family</p>' +
      '</div>' +
      '<div class="invite-stats-grid">' +
      '<div class="invite-stat-card"><div class="invite-stat-num">' + total + '</div><div class="invite-stat-label">Total Invitations</div></div>' +
      '<div class="invite-stat-card accepted"><div class="invite-stat-num">' + accepted + '</div><div class="invite-stat-label">Accepted</div></div>' +
      '<div class="invite-stat-card declined"><div class="invite-stat-num">' + declined + '</div><div class="invite-stat-label">Declined</div></div>' +
      '<div class="invite-stat-card maybe"><div class="invite-stat-num">' + maybe + '</div><div class="invite-stat-label">Maybe</div></div>' +
      '<div class="invite-stat-card pending"><div class="invite-stat-num">' + pending + '</div><div class="invite-stat-label">Pending</div></div>' +
      '</div>' +
      '<div class="invite-link-row">' +
      '<input type="text" class="invite-link-input" id="inviteLinkField" value="' + escapeHtml(url) + '" readonly>' +
      '<button class="invite-copy-btn" onclick="InviteSys.copyLink()"><i class="fas fa-copy"></i> Copy</button>' +
      '</div>' +
      '<div class="invite-share-grid" id="inviteShareGrid"></div>' +
      '<div class="invite-qr-section">' +
      '<h3><i class="fas fa-qrcode"></i> QR Code</h3>' +
      '<div class="invite-qr-box" id="inviteQrBox"></div>' +
      '<button class="invite-btn invite-btn-outline" onclick="InviteSys.downloadQR()" style="margin-top:12px"><i class="fas fa-download"></i> Download QR Code</button>' +
      '</div>' +
      '<div class="invite-actions-row">' +
      '<button class="invite-btn invite-btn-primary" onclick="InviteSys.shareViaNative()"><i class="fas fa-share-alt"></i> Share Invitation</button>' +
      '<button class="invite-btn invite-btn-outline" onclick="InviteSys.previewInvitation()"><i class="fas fa-eye"></i> Preview Page</button>' +
      '</div>' +
      '</div>';

    renderShareButtons('inviteShareGrid', false);
    renderQRCode('inviteQrBox', weddingId);
  }

  function shareViaNative() {
    if (!shareViaNativeAPI()) {
      shareTo('copy');
    }
  }

  function previewInvitation() {
    var weddingId = getWeddingId();
    window.open('invite/' + weddingId, '_blank');
  }

  function copyLink() {
    copyToClipboard(getInvitationUrl());
    trackEvent('copy_link');
  }

  var analyticsData = {
    pageViews: 0,
    uniqueVisitors: 0,
    shares: 0,
    rsvpAccepted: 0,
    rsvpDeclined: 0,
    devices: {},
    countries: {},
    sources: {},
    daily: {}
  };

  function loadAnalytics() {
    try {
      var s = localStorage.getItem('weddingAnalytics');
      if (s) {
        var a = JSON.parse(s);
        Object.keys(a).forEach(function (k) { analyticsData[k] = a[k]; });
      }
    } catch (e) {}
  }

  function saveAnalytics() {
    try {
      localStorage.setItem('weddingAnalytics', JSON.stringify(analyticsData));
    } catch (e) {}
    try {
      if (typeof fbSetDoc === 'function') {
        fbSetDoc('analytics', 'main', analyticsData);
      }
    } catch (e) {}
  }

  function trackEvent(event) {
    loadAnalytics();
    var today = new Date().toISOString().split('T')[0];
    if (!analyticsData.daily) analyticsData.daily = {};
    if (!analyticsData.daily[today]) analyticsData.daily[today] = {};
    if (!analyticsData.daily[today][event]) analyticsData.daily[today][event] = 0;
    analyticsData.daily[today][event]++;

    switch (event) {
      case 'page_view':
        analyticsData.pageViews++;
        break;
      case 'unique_visit':
        analyticsData.uniqueVisitors++;
        break;
      case 'share_native':
      case 'share_whatsapp':
      case 'share_facebook':
      case 'share_twitter':
      case 'share_telegram':
      case 'share_email':
      case 'share_copy':
      case 'share_linkedin':
      case 'share_messenger':
      case 'share_instagram':
      case 'share_tiktok':
      case 'share_snapchat':
      case 'share_discord':
      case 'share_sms':
        analyticsData.shares++;
        break;
      case 'rsvp_accepted':
        analyticsData.rsvpAccepted++;
        break;
      case 'rsvp_declined':
        analyticsData.rsvpDeclined++;
        break;
    }
    saveAnalytics();
  }

  function submitRSVP(weddingId, data, callback) {
    if (hasResponded(weddingId)) {
      if (callback) callback({ success: false, error: 'already_responded' });
      return;
    }

    getGuestIp(function (ip) {
      var deviceInfo = getDeviceInfo();
      var country = '';
      try {
        if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
          var parts = Intl.DateTimeFormat().resolvedOptions();
          if (parts.timeZone) {
            var tzParts = parts.timeZone.split('/');
            if (tzParts.length > 1) country = tzParts[0];
          }
        }
      } catch (e) {}

      var rsvpEntry = {
        weddingId: weddingId,
        guestName: data.name,
        email: data.email || '',
        phone: data.phone || '',
        guestCount: parseInt(data.guestCount) || 1,
        message: data.message || '',
        mealPreference: data.mealPreference || '',
        status: data.status,
        acceptedTime: data.status === 'accepted' ? new Date().toISOString() : null,
        declinedTime: data.status === 'declined' ? new Date().toISOString() : null,
        maybeTime: data.status === 'maybe' ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
        deviceInfo: JSON.stringify(deviceInfo),
        device: deviceInfo.platform || '',
        country: country,
        ipAddress: ip || '',
        source: 'invite-page',
        invitationLink: window.location.href
      };

      function saveToFirebase() {
        if (typeof fbAddDoc === 'function') {
          fbAddDoc('guests', rsvpEntry).then(function (result) {
            if (result && result.success) {
              rsvpEntry.id = result.id;
              saveToLocalStorage(rsvpEntry);
            } else {
              saveToLocalStorage(rsvpEntry);
            }
          }).catch(function () {
            saveToLocalStorage(rsvpEntry);
          });
        } else {
          saveToLocalStorage(rsvpEntry);
        }
      }

      function saveToLocalStorage(entry) {
        var d = getData();
        if (!d.guests) d.guests = [];
        entry.id = entry.id || 'local_' + Date.now();
        entry.rsvp = entry.status;
        entry.name = entry.guestName;
        entry.rsvpDate = entry.createdAt;
        d.guests.push(entry);
        saveData(d);
        markResponded(weddingId, entry.status);
        if (data.status === 'accepted') {
          trackEvent('rsvp_accepted');
        } else if (data.status === 'declined') {
          trackEvent('rsvp_declined');
        } else {
          trackEvent('rsvp_maybe');
        }
        notifyOwner(entry);
        if (callback) callback({ success: true, id: entry.id, entry: entry });
      }

      saveToFirebase();
    });
  }

  function sendConfirmationEmail(entry, status) {
    if (!entry.email) return;
    var d = getData();
    var subject = status === 'accepted' ?
      'Thank You for Accepting - ' + (d.groomName || '') + ' & ' + (d.brideName || '') + '\'s Wedding' :
      'Thank You for Your Response - ' + (d.groomName || '') + ' & ' + (d.brideName || '') + '\'s Wedding';
    var date = d.weddingDate ? new Date(d.weddingDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '';
    var venue = d.venue || '';
    var time = d.weddingTime || '';
    var address = d.address || '';
    var body = status === 'accepted' ?
      'Dear ' + entry.guestName + ',\n\nThank you for accepting our wedding invitation! We are thrilled to have you join us on our special day.\n\n' +
      'Wedding Details:\n\uD83D\uDCC5 ' + date + '\n\uD83D\uDD50 ' + time + '\n\uD83D\uDCCD ' + venue + '\n\uD83C\uDFE0 ' + address + '\n\n' +
      'Add to Calendar:\nGoogle: https://www.google.com/calendar/render?action=TEMPLATE&text=Wedding+of+' + encodeURIComponent((d.groomName || '') + ' & ' + (d.brideName || '')) + '&dates=' + (d.weddingDate ? d.weddingDate.replace(/-/g, '') : '') + 'T' + (time ? time.replace(/:/g, '') : '120000') + '/&details=Join+us+for+our+wedding+celebration&location=' + encodeURIComponent(venue + ', ' + address) + '\n\n' +
      'We cannot wait to celebrate with you!\n\nWith love,\n' + (d.groomName || '') + ' & ' + (d.brideName || '') :
      'Dear ' + entry.guestName + ',\n\nThank you for letting us know. We understand and appreciate your response.\n\n' +
      'You will be in our thoughts on our special day.\n\nWith love,\n' + (d.groomName || '') + ' & ' + (d.brideName || '');

    window.location.href = 'mailto:' + entry.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }

  function notifyOwner(entry) {
    var statusLabel = entry.status === 'accepted' ? 'Accepted' : entry.status === 'declined' ? 'Declined' : 'Maybe';
    var notification = {
      id: 'rsvp_' + Date.now(),
      type: entry.status === 'accepted' ? 'success' : entry.status === 'declined' ? 'error' : 'info',
      title: 'New RSVP: ' + statusLabel,
      message: entry.guestName + ' ' + (entry.status === 'accepted' ? 'accepted your invitation!' : entry.status === 'declined' ? 'declined your invitation.' : 'may attend your wedding.') + (entry.status === 'accepted' && parseInt(entry.guestCount) > 1 ? ' (+' + (parseInt(entry.guestCount) - 1) + ' guests)' : ''),
      time: Date.now(),
      read: false
    };
    try {
      var notifs = JSON.parse(localStorage.getItem('weddingNotifications') || '[]');
      notifs.unshift(notification);
      if (notifs.length > 50) notifs.length = 50;
      localStorage.setItem('weddingNotifications', JSON.stringify(notifs));
      if (typeof updateNotifBadge === 'function') updateNotifBadge();
    } catch (e) {}
    try {
      if (typeof addNotification === 'function') {
        addNotification(notification.title, notification.type, notification.message);
      }
    } catch (e) {}

    try {
      if (typeof DashApp !== 'undefined') {
        if (DashApp.loadRSVP) setTimeout(function () { DashApp.loadRSVP(); }, 500);
        if (DashApp.loadGuests) setTimeout(function () { DashApp.loadGuests(); }, 600);
        if (DashApp.renderNotifications) setTimeout(function () { DashApp.renderNotifications(); }, 700);
      }
    } catch (e) {}

    var rsvpEvent = new CustomEvent('rsvp_update', { detail: entry });
    document.dispatchEvent(rsvpEvent);
  }

  function showInviteNotFound(weddingId) {
    var loading = document.getElementById('loadingScreen');
    if (loading) {
      loading.innerHTML =
        '<div style="text-align:center;padding:40px 20px;max-width:480px">' +
        '<div style="font-size:3.5rem;margin-bottom:16px">&#128140;</div>' +
        '<h2 style="font-family:\'Playfair Display\',serif;font-size:1.8rem;color:#fff;margin-bottom:8px">Invitation Not Found</h2>' +
        '<p style="color:#A09888;font-size:0.95rem;line-height:1.7;margin-bottom:24px">This invitation could not be found. It may have been removed or the link may be incorrect.</p>' +
        '<a href="index.html" style="display:inline-flex;align-items:center;gap:8px;padding:14px 28px;background:linear-gradient(135deg,#D4AF37,#B8962E);color:#0B0F19;border-radius:50px;font-weight:600;text-decoration:none;font-family:\'Poppins\',sans-serif;font-size:0.85rem;cursor:pointer;border:none"><i class="fas fa-home"></i> Home</a>' +
        '<p style="color:rgba(255,255,255,0.15);font-size:0.72rem;margin-top:24px"><i class="fas fa-ring"></i> Forever &amp; Always &mdash; Luxury Wedding Platform</p>' +
        '</div>';
      loading.style.background = '#0B0F19';
    }
    trackEvent('invite_not_found');
  }

  function initInvitePage() {
    var urlParams = new URLSearchParams(window.location.search);
    var weddingId = urlParams.get('id');
    if (!weddingId) {
      var pathParts = window.location.pathname.split('/');
      var lastPart = pathParts[pathParts.length - 1];
      if (lastPart && lastPart.length > 10 && lastPart.indexOf('.html') === -1) {
        weddingId = lastPart;
      }
      if (!weddingId) {
        weddingId = urlParams.get('wedding') || urlParams.get('invite');
      }
    }
    if (!weddingId) {
      document.getElementById('loadingStatus').textContent = 'Invalid invitation link';
      return;
    }

    trackEvent('page_view');
    var visitKey = 'visited_' + weddingId;
    if (!localStorage.getItem(visitKey)) {
      trackEvent('unique_visit');
      localStorage.setItem(visitKey, '1');
    }

    loadWeddingData(weddingId, function (data) {
      if (!data || !data.groomName) {
        showInviteNotFound(weddingId);
        return;
      }
      renderInvitePage(data, weddingId);
    });
  }

  function loadWeddingData(weddingId, callback) {
    var d = getData();
    if (d && d.weddingId === weddingId) {
      callback(d);
      return;
    }
    if (typeof fbGetDoc === 'function') {
      fbGetDoc('weddingInfo', 'main').then(function (doc) {
        if (doc) {
          callback(doc);
        } else {
          callback(d);
        }
      }).catch(function () {
        callback(d);
      });
    } else {
      callback(d);
    }
  }

  function renderInvitePage(data, weddingId) {
    var loading = document.getElementById('loadingScreen');
    if (loading) loading.style.display = 'none';

    var content = document.getElementById('inviteContent');
    if (content) content.style.display = 'block';

    var groom = data.groomName || 'Groom';
    var bride = data.brideName || 'Bride';
    var date = data.weddingDate || '';
    var time = data.weddingTime || '';
    var venue = data.venue || '';
    var address = data.address || '';
    var city = data.city || '';
    var state = data.state || '';
    var country = data.country || '';
    var dressCode = data.dressCode || data.aiSettings?.dressCode || 'Black Tie Optional';
    var story = data.weddingStory || data.story || '';
    var themeColor = data.themeColor || '#D4AF37';
    var musicUrl = data.musicUrl || '';
    var storyTitle = data.storyTitle || 'Our Love Story';
    var giftInfo = data.giftInfo || data.giftRegistry || '';
    var contactPhone = data.phone || data.whatsapp || data.contactPhone || '';
    var contactEmail = data.email || data.contactEmail || '';

    document.documentElement.style.setProperty('--accent', themeColor);
    document.title = 'Wedding Invitation - ' + groom + ' & ' + bride;

    setText('invGroomName', groom);
    setText('invBrideName', bride);
    setText('invNames', groom + ' & ' + bride);
    setText('invFullNames', groom + ' & ' + bride);
    setText('invDate', date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '');
    setText('invTime', time || '');
    setText('invVenue', venue || '');
    setText('invAddress', address || '');
    setText('invLocation', [city, state, country].filter(Boolean).join(', '));
    setText('invDressCode', dressCode);
    setText('invStoryTitle', storyTitle);
    setText('invStory', story);
    setText('invGiftInfo', giftInfo);
    setText('invContactPhone', contactPhone);
    setText('invContactEmail', contactEmail);

    var tagline = document.getElementById('invTagline');
    if (tagline) tagline.textContent = data.quote || data.motto || 'Together With Their Families';

    if (data.coverPhoto) {
      var bg = document.querySelector('.invite-hero-bg');
      if (bg) { bg.style.backgroundImage = 'url(' + data.coverPhoto + ')'; bg.classList.add('loaded'); }
    }

    if (data.groomPhoto) {
      var gp = document.getElementById('invGroomPhoto');
      if (gp) { gp.src = data.groomPhoto; gp.style.display = 'block'; }
    }
    if (data.bridePhoto) {
      var bp = document.getElementById('invBridePhoto');
      if (bp) { bp.src = data.bridePhoto; bp.style.display = 'block'; }
    }

    if (data.groomPhoto || data.bridePhoto) {
      var cpi = document.getElementById('couplePlaceholder');
      if (cpi) cpi.style.display = 'none';
    }

    var mapContainer = document.getElementById('invMap');
    if (mapContainer && address) {
      var mapKey = (window.WEDDING_MAPS_KEY || '');
      if (mapKey) {
        var query = encodeURIComponent([venue, address, city, state, country].filter(Boolean).join(', '));
        mapContainer.innerHTML = '<iframe src="https://www.google.com/maps/embed/v1/place?key=' + mapKey + '&q=' + query + '" width="100%" height="300" style="border:0;border-radius:12px" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>';
      } else {
        var encodedAddr = encodeURIComponent([venue, address, city, state, country].filter(Boolean).join(', '));
        mapContainer.innerHTML = '<a href="https://www.google.com/maps/search/?api=1&query=' + encodedAddr + '" target="_blank" rel="noopener" style="display:flex;align-items:center;justify-content:center;height:300px;background:var(--dark-soft);border-radius:12px;color:var(--gold);text-decoration:none;gap:12px"><i class="fas fa-map-marked-alt" style="font-size:2rem"></i><span>Open in Google Maps</span></a>';
      }
    } else if (mapContainer) {
      mapContainer.innerHTML = '<div class="map-placeholder"><i class="fas fa-map-marked-alt"></i><p>Map will appear here</p></div>';
    }

    var galleryEl = document.getElementById('invGallery');
    if (galleryEl) {
      var gallery = data.gallery || [];
      if (gallery.length) {
        galleryEl.innerHTML = gallery.map(function (img, i) {
          return '<div class="invite-gallery-item"><img src="' + img + '" alt="Gallery ' + (i + 1) + '" loading="lazy"></div>';
        }).join('');
        galleryEl.innerHTML += '<button class="invite-btn invite-btn-outline" onclick="document.getElementById(\'invGallery\').classList.toggle(\'expanded\')" style="grid-column:1/-1;justify-self:center"><i class="fas fa-expand"></i> View All Photos</button>';
      } else {
        galleryEl.innerHTML = '<p class="empty-msg">Gallery photos coming soon...</p>';
      }
    }

    // Render Timeline section
    renderTimelineSection(data);

    // Render Videos section
    renderVideosSection(data);

    // Render Gift Registry section
    renderGiftRegistrySection(data);

    startCountdown(date);
    initMusicPlayer(musicUrl);
    checkAlreadyResponded(weddingId);
    renderRSVPModal(data, weddingId);
    renderAddToCalendar(data);
    renderShareSection(data, weddingId);
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text || '';
  }

  function startCountdown(dateStr) {
    if (!dateStr) return;
    var target = new Date(dateStr + 'T23:59:59');
    function update() {
      var diff = target - new Date();
      if (diff <= 0) {
        var els = document.querySelectorAll('.countdown-num');
        els.forEach(function (el) { el.textContent = '0'; });
        var msg = document.querySelector('.countdown-message-invite');
        if (msg) msg.textContent = 'Today is the day! \uD83C\uDF89';
        return;
      }
      var days = Math.floor(diff / (1000 * 60 * 60 * 24));
      var hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      var secs = Math.floor((diff % (1000 * 60)) / 1000);
      setText('cdDays', String(days).padStart(2, '0'));
      setText('cdHours', String(hours).padStart(2, '0'));
      setText('cdMinutes', String(mins).padStart(2, '0'));
      setText('cdSeconds', String(secs).padStart(2, '0'));
    }
    update();
    setInterval(update, 1000);
  }

  function initMusicPlayer(musicUrl) {
    if (!musicUrl) return;
    var player = document.getElementById('inviteMusicPlayer');
    if (!player) return;
    player.style.display = 'flex';
    var audio = new Audio(musicUrl);
    audio.loop = true;
    var btn = player.querySelector('button');
    var icon = player.querySelector('i');
    var isPlaying = false;
    btn.addEventListener('click', function () {
      if (isPlaying) {
        audio.pause();
        icon.className = 'fas fa-music';
        btn.classList.remove('playing');
      } else {
        audio.play().catch(function () {});
        icon.className = 'fas fa-pause';
        btn.classList.add('playing');
      }
      isPlaying = !isPlaying;
    });
    document.addEventListener('click', function handler() {
      if (!isPlaying && musicUrl) {
        audio.play().catch(function () {});
        icon.className = 'fas fa-pause';
        btn.classList.add('playing');
        isPlaying = true;
      }
      document.removeEventListener('click', handler);
    }, { once: true });
  }

  function checkAlreadyResponded(weddingId) {
    if (hasResponded(weddingId)) {
      var rsvpSection = document.getElementById('rsvpSection');
      if (rsvpSection) {
        rsvpSection.innerHTML = '<div class="already-responded"><i class="fas fa-check-circle"></i><h3>You have already responded to this invitation.</h3><p>Thank you! Your response has been recorded.</p></div>';
      }
      var acp = document.getElementById('btnAccept');
      var dcl = document.getElementById('btnDecline');
      if (acp) acp.disabled = true;
      if (dcl) dcl.disabled = true;
    }
  }

  function renderRSVPModal(data, weddingId) {
    if (hasResponded(weddingId)) return;
    document.getElementById('btnAccept').addEventListener('click', function () { showRSVPForm('accepted'); });
    document.getElementById('btnMaybe').addEventListener('click', function () { showRSVPForm('maybe'); });
    document.getElementById('btnDecline').addEventListener('click', function () { showRSVPForm('declined'); });
    document.getElementById('rsvpCancelBtn').addEventListener('click', hideRSVPForm);
    document.getElementById('rsvpFormOverlay').addEventListener('click', function (e) {
      if (e.target === this) hideRSVPForm();
    });
    document.getElementById('rsvpFormElement').addEventListener('submit', function (e) {
      e.preventDefault();
      handleRSVPSubmit(weddingId);
    });
  }

  function showRSVPForm(status) {
    document.getElementById('rsvpStatus').value = status;
    document.getElementById('rsvpFormOverlay').classList.add('active');
    document.getElementById('rsvpFormContainer').classList.add('active');
    var title = 'Respond to Invitation';
    var color = 'var(--gold)';
    if (status === 'accepted') { title = 'Accept Invitation'; color = 'var(--success)'; }
    else if (status === 'maybe') { title = 'Maybe Attending'; color = 'var(--warning)'; }
    else { title = 'Decline Invitation'; color = 'var(--error)'; }
    document.getElementById('rsvpFormTitle').textContent = title;
    document.getElementById('rsvpFormTitle').style.color = color;
  }

  function hideRSVPForm() {
    document.getElementById('rsvpFormOverlay').classList.remove('active');
    document.getElementById('rsvpFormContainer').classList.remove('active');
  }

  function handleRSVPSubmit(weddingId) {
    var name = document.getElementById('rsvpName').value.trim();
    var email = document.getElementById('rsvpEmail').value.trim();
    var phone = document.getElementById('rsvpPhone').value.trim();
    var guestCount = parseInt(document.getElementById('rsvpGuestCount').value) || 1;
    var message = document.getElementById('rsvpMessage').value.trim();
    var status = document.getElementById('rsvpStatus').value;
    var mealPref = document.getElementById('rsvpMealPreference') ? document.getElementById('rsvpMealPreference').value : '';

    var valid = true;
    if (!name) { showFieldError('rsvpName'); valid = false; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showFieldError('rsvpEmail'); valid = false; }
    if (guestCount < 1 || guestCount > 20) { showFieldError('rsvpGuestCount'); valid = false; }
    if (!status) { valid = false; }
    if (!valid) return;

    var submitBtn = document.getElementById('rsvpFormSubmit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

    submitRSVP(weddingId, { name: name, email: email, phone: phone, guestCount: guestCount, message: message, status: status, mealPreference: mealPref }, function (result) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit RSVP';
      hideRSVPForm();
      if (result.success) {
        showThankYou(status, name);
        markResponded(weddingId, status);
      } else if (result.error === 'already_responded') {
        notify('You have already responded to this invitation.', 'warning');
        checkAlreadyResponded(weddingId);
      } else {
        notify('An error occurred. Please try again.', 'error');
      }
    });
  }

  function showFieldError(id) {
    var el = document.getElementById(id);
    if (el) { el.style.borderColor = '#ef4444'; el.classList.add('error'); }
    setTimeout(function () {
      if (el) { el.style.borderColor = ''; el.classList.remove('error'); }
    }, 3000);
  }

  function showThankYou(status, name) {
    var rsvpSection = document.getElementById('rsvpSection');
    if (!rsvpSection) return;
    var icon = 'fa-heart';
    var statusClass = 'accepted';
    if (status === 'declined') { icon = 'fa-envelope'; statusClass = 'declined'; }
    else if (status === 'maybe') { icon = 'fa-clock'; statusClass = 'maybe'; }
    rsvpSection.innerHTML =
      '<div class="thank-you-message ' + statusClass + '">' +
      '<div class="thank-you-icon"><i class="fas ' + icon + '"></i></div>' +
      '<h3>Thank you for your response.</h3>' +
      '<p>' + (status === 'accepted' ? 'We look forward to celebrating with you!' : status === 'maybe' ? 'We hope you can make it!' : 'You will be in our thoughts on our special day.') + '</p>' +
      '</div>';
    var btns = document.getElementById('rsvpButtons');
    if (btns) btns.style.display = 'none';
  }

  function renderAddToCalendar(data) {
    var container = document.getElementById('addToCalendar');
    if (!container) return;
    var groom = data.groomName || 'Groom';
    var bride = data.brideName || 'Bride';
    var date = data.weddingDate || '';
    var time = data.time || data.weddingTime || '16:00';
    var venue = data.venue || '';
    var address = data.address || '';
    var location = [venue, address].filter(Boolean).join(', ');
    var startDate = date ? date.replace(/-/g, '') : '';
    var startTime = time ? time.replace(/:/g, '') : '160000';
    var endDate = startDate;
    var endTime = '180000';
    var icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Wedding//Invitation//EN\nBEGIN:VEVENT\nDTSTART:' + startDate + 'T' + startTime + '\nDTEND:' + endDate + 'T' + endTime + '\nSUMMARY:Wedding of ' + groom + ' & ' + bride + '\nDESCRIPTION:Join us for the wedding celebration of ' + groom + ' & ' + bride + '!\nLOCATION:' + location + '\nEND:VEVENT\nEND:VCALENDAR';

    container.innerHTML =
      '<div class="calendar-buttons">' +
      '<a href="https://www.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent('Wedding of ' + groom + ' & ' + bride) + '&dates=' + startDate + 'T' + startTime + '/' + endDate + 'T' + endTime + '&details=' + encodeURIComponent('Join us for our wedding celebration!') + '&location=' + encodeURIComponent(location) + '" target="_blank" class="calendar-btn"><i class="fab fa-google"></i> Google Calendar</a>' +
      '<button onclick="InviteSys.downloadICS(\'' + encodeURIComponent(icsContent) + '\')" class="calendar-btn"><i class="fas fa-calendar"></i> Apple Calendar</button>' +
      '<button onclick="InviteSys.downloadICS(\'' + encodeURIComponent(icsContent) + '\')" class="calendar-btn"><i class="fas fa-download"></i> Download .ics</button>' +
      '</div>';
  }

  function renderShareSection(data, weddingId) {
    var container = document.getElementById('inviteShareButtons');
    if (!container) return;
    renderShareButtons('inviteShareButtons', true);
    var nativeBtn = document.getElementById('inviteShareNative');
    if (nativeBtn && navigator.share) {
      nativeBtn.style.display = 'inline-flex';
      nativeBtn.addEventListener('click', function () {
        if (!shareViaNativeAPI()) {
          shareTo('copy');
        }
      });
    }
    renderQRCode('inviteQRContainer', weddingId);
  }

  function renderTimelineSection(data) {
    var container = document.getElementById('invTimeline');
    var section = document.getElementById('timelineSection');
    if (!container || !section) return;
    var timeline = data.timeline || [];
    if (!timeline.length) {
      section.style.display = 'none';
      return;
    }
    section.style.display = '';
    container.innerHTML = timeline.map(function (ev, i) {
      return '<div class="timeline-item">' +
        '<div class="timeline-time">' + (ev.time || '') + '</div>' +
        '<div class="timeline-content">' +
        '<h4>' + (ev.title || '') + '</h4>' +
        (ev.description ? '<p>' + ev.description + '</p>' : '') +
        (ev.venue ? '<p class="timeline-venue"><i class="fas fa-map-marker-alt" style="color:var(--accent);margin-right:6px"></i>' + ev.venue + '</p>' : '') +
        '</div></div>';
    }).join('');
  }

  function renderVideosSection(data) {
    var container = document.getElementById('invVideos');
    var section = document.getElementById('videosSection');
    if (!container || !section) return;
    var videos = data.videos || [];
    if (!videos.length) {
      section.style.display = 'none';
      return;
    }
    section.style.display = '';
    container.innerHTML = videos.map(function (v) {
      var url = v.url || v;
      var title = v.title || 'Wedding Video';
      var isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
      var isVimeo = url.includes('vimeo.com');
      var embedUrl = '';
      if (isYoutube) {
        var videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
        if (videoId) embedUrl = 'https://www.youtube.com/embed/' + videoId[1];
      } else if (isVimeo) {
        var videoId = url.match(/vimeo\.com\/(\d+)/);
        if (videoId) embedUrl = 'https://player.vimeo.com/video/' + videoId[1];
      } else {
        embedUrl = url;
      }
      return '<div class="video-item">' +
        '<h4>' + title + '</h4>' +
        (embedUrl ? '<iframe src="' + embedUrl + '" allowfullscreen loading="lazy"></iframe>' : '<div style="padding:60px;text-align:center;color:var(--text-light)">Video format not supported</div>') +
        '</div>';
    }).join('');
  }

  function renderGiftRegistrySection(data) {
    var container = document.getElementById('invGiftRegistry');
    var section = document.getElementById('giftRegistrySection');
    if (!container || !section) return;
    var hasGifts = data.bankName || data.bankNumber || data.registryLink || data.paypal || data.cashapp || data.giftInfo || data.giftRegistry;
    if (!hasGifts) {
      section.style.display = 'none';
      return;
    }
    section.style.display = '';
    var html = '';
    if (data.bankName && data.bankNumber) {
      html += '<div class="gift-card">' +
        '<div class="gift-icon"><i class="fas fa-university"></i></div>' +
        '<h4>Bank Transfer</h4>' +
        '<p>' + data.bankName + '</p>' +
        '<div class="bank-detail">Account: ' + data.bankNumber + '</div>' +
        '</div>';
    }
    if (data.registryLink) {
      html += '<div class="gift-card">' +
        '<div class="gift-icon"><i class="fas fa-gift"></i></div>' +
        '<h4>Gift Registry</h4>' +
        '<a href="' + data.registryLink + '" target="_blank" class="gift-link">View Registry</a>' +
        '</div>';
    }
    if (data.paypal) {
      html += '<div class="gift-card">' +
        '<div class="gift-icon"><i class="fab fa-paypal"></i></div>' +
        '<h4>PayPal</h4>' +
        '<a href="' + data.paypal + '" target="_blank" class="gift-link">Send Gift</a>' +
        '</div>';
    }
    if (data.cashapp) {
      html += '<div class="gift-card">' +
        '<div class="gift-icon"><i class="fas fa-money-bill"></i></div>' +
        '<h4>CashApp</h4>' +
        '<a href="' + data.cashapp + '" target="_blank" class="gift-link">Send Gift</a>' +
        '</div>';
    }
    if (data.giftInfo) {
      html += '<div class="gift-card">' +
        '<div class="gift-icon"><i class="fas fa-heart"></i></div>' +
        '<h4>Gift Information</h4>' +
        '<p>' + data.giftInfo + '</p>' +
        '</div>';
    }
    container.innerHTML = html || '<p style="color:var(--text-light);text-align:center">Your presence is the greatest gift.</p>';
  }

  function downloadICS(encodedContent) {
    var content = decodeURIComponent(encodedContent);
    var blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'wedding-invitation.ics';
    link.click();
    URL.revokeObjectURL(blob);
    trackEvent('ics_download');
  }

  function getStats() {
    var d = getData();
    var guests = d.guests || [];
    var total = guests.length;
    var accepted = guests.filter(function (g) { return g.status === 'accepted' || g.rsvp === 'accepted'; }).length;
    var declined = guests.filter(function (g) { return g.status === 'declined' || g.rsvp === 'declined'; }).length;
    var maybe = guests.filter(function (g) { return g.status === 'maybe' || g.rsvp === 'maybe'; }).length;
    var pending = total - accepted - declined - maybe;
    var expectedGuests = guests.reduce(function (sum, g) { return sum + (parseInt(g.guestCount) || 1); }, 0);
    return { total: total, accepted: accepted, declined: declined, maybe: maybe, pending: pending, expectedGuests: expectedGuests };
  }

  function exportData(format) {
    var d = getData();
    var guests = d.guests || [];
    var statusLabels = { accepted: 'Accepted', declined: 'Declined', pending: 'Pending' };

    if (format === 'csv') {
      var csv = 'Guest Name,Email,Phone,Status,Guest Count,Message,Date\n';
      guests.forEach(function (g) {
        csv += '"' + escapeHtml(g.guestName || g.name || '') + '","' + escapeHtml(g.email || '') + '","' + escapeHtml(g.phone || '') + '","' + (statusLabels[g.status || g.rsvp] || 'Pending') + '","' + (g.guestCount || 1) + '","' + escapeHtml(g.message || '') + '","' + (g.createdAt || g.rsvpDate || '') + '"\n';
      });
      downloadFile(csv, 'rsvp-data.csv', 'text/csv');
    } else if (format === 'excel') {
      var xml = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="RSVP"><Table><Row><Cell><Data ss:Type="String">Guest Name</Data></Cell><Cell><Data ss:Type="String">Email</Data></Cell><Cell><Data ss:Type="String">Phone</Data></Cell><Cell><Data ss:Type="String">Status</Data></Cell><Cell><Data ss:Type="Number">Guest Count</Data></Cell><Cell><Data ss:Type="String">Message</Data></Cell><Cell><Data ss:Type="String">Date</Data></Cell></Row>';
      guests.forEach(function (g) {
        xml += '<Row><Cell><Data ss:Type="String">' + escapeHtml(g.guestName || g.name || '') + '</Data></Cell><Cell><Data ss:Type="String">' + escapeHtml(g.email || '') + '</Data></Cell><Cell><Data ss:Type="String">' + escapeHtml(g.phone || '') + '</Data></Cell><Cell><Data ss:Type="String">' + (statusLabels[g.status || g.rsvp] || 'Pending') + '</Data></Cell><Cell><Data ss:Type="Number">' + (g.guestCount || 1) + '</Data></Cell><Cell><Data ss:Type="String">' + escapeHtml(g.message || '') + '</Data></Cell><Cell><Data ss:Type="String">' + (g.createdAt || g.rsvpDate || '') + '</Data></Cell></Row>';
      });
      xml += '</Table></Worksheet></Workbook>';
      downloadFile(xml, 'rsvp-data.xls', 'application/vnd.ms-excel');
    } else if (format === 'pdf') {
      var text = 'RSVP DATA EXPORT\n\n';
      text += 'Guest Name | Email | Phone | Status | Guests | Message | Date\n';
      text += '='.repeat(80) + '\n';
      guests.forEach(function (g) {
        text += (g.guestName || g.name || '') + ' | ' + (g.email || '') + ' | ' + (g.phone || '') + ' | ' + (statusLabels[g.status || g.rsvp] || 'Pending') + ' | ' + (g.guestCount || 1) + ' | ' + (g.message || '') + ' | ' + (g.createdAt || g.rsvpDate || '') + '\n';
      });
      downloadFile(text, 'rsvp-data.txt', 'text/plain');
    }
    notify('RSVP data exported as ' + format.toUpperCase(), 'success');
  }

  function downloadFile(content, filename, type) {
    var blob = new Blob([content], { type: type });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function getAnalyticsReport() {
    loadAnalytics();
    return analyticsData;
  }

  // Public API
  W.getWeddingId = getWeddingId;
  W.getInvitationUrl = getInvitationUrl;
  W.generateQR = generateQR;
  W.downloadQR = downloadQR;
  W.shareTo = shareTo;
  W.shareViaNative = shareViaNative;
  W.copyLink = copyLink;
  W.submitRSVP = submitRSVP;
  W.initInvitePage = initInvitePage;
  W.renderInvitationCenter = renderInvitationCenter;
  W.renderShareButtons = renderShareButtons;
  W.renderQRCode = renderQRCode;
  W.previewInvitation = previewInvitation;
  W.hasResponded = hasResponded;
  W.downloadICS = downloadICS;
  W.getStats = getStats;
  W.exportData = exportData;
  W.trackEvent = trackEvent;
  W.getAnalyticsReport = getAnalyticsReport;
  W.notify = notify;
  W.updateWeddingId = updateWeddingId;
  W.shareViaNativeAPI = shareViaNativeAPI;
  W.getInvitationBaseUrl = getInvitationBaseUrl;

  // Compatibility wrapper for existing code
  window.InviteSys = W;

})();
