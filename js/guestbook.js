(function () {
  'use strict';
  if (window.__WEDDING_GUESTBOOK) return;
  window.__WEDDING_GUESTBOOK = true;

  var GB_KEY = 'weddingGuestbook';
  var DB_KEY = 'weddingData';

  function getData() {
    try { return JSON.parse(localStorage.getItem(DB_KEY) || '{}'); } catch (e) { return {}; }
  }

  function getGuestbook() {
    try { return JSON.parse(localStorage.getItem(GB_KEY) || '[]'); } catch (e) { return []; }
  }

  function saveGuestbook(entries) {
    localStorage.setItem(GB_KEY, JSON.stringify(entries));
  }

  function genId() {
    return 'gb_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
  }

  function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function timeAgo(ts) {
    if (!ts) return '';
    var diff = Date.now() - ts;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    return Math.floor(diff / 86400000) + 'd ago';
  }

  var Guestbook = {
    isEnabled: function () {
      var d = getData();
      return d.guestbookEnabled !== false;
    },

    setEnabled: function (enabled) {
      var d = getData();
      d.guestbookEnabled = !!enabled;
      localStorage.setItem(DB_KEY, JSON.stringify(d));
    },

    addEntry: function (data) {
      if (!this.isEnabled()) return { success: false, error: 'guestbook_disabled' };
      if (!data.name || !data.name.trim()) return { success: false, error: 'name_required' };
      if (!data.message || !data.message.trim()) return { success: false, error: 'message_required' };

      var entries = getGuestbook();
      var entry = {
        id: genId(),
        name: data.name.trim(),
        message: data.message.trim(),
        photo: data.photo || '',
        weddingId: data.weddingId || '',
        createdAt: Date.now(),
        status: 'pending',
        source: data.source || 'invite-page'
      };
      entries.unshift(entry);
      if (entries.length > 500) entries.length = 500;
      saveGuestbook(entries);

      try {
        var notifs = JSON.parse(localStorage.getItem('weddingNotifications') || '[]');
        notifs.unshift({
          id: 'notif_' + Date.now().toString(36),
          type: 'guestbook',
          title: 'New Guestbook Entry',
          message: entry.name + ' left a message: "' + entry.message.substring(0, 60) + '"',
          time: Date.now(),
          read: false
        });
        if (notifs.length > 50) notifs.length = 50;
        localStorage.setItem('weddingNotifications', JSON.stringify(notifs));
        if (typeof updateNotifBadge === 'function') updateNotifBadge();
      } catch (e) {}

      var evt = new CustomEvent('guestbook_entry', { detail: entry });
      document.dispatchEvent(evt);

      return { success: true, id: entry.id, entry: entry };
    },

    getEntries: function (opts) {
      opts = opts || {};
      var entries = getGuestbook();
      if (opts.status) {
        entries = entries.filter(function (e) { return e.status === opts.status; });
      }
      if (opts.approved !== undefined) {
        entries = entries.filter(function (e) {
          return opts.approved ? e.status === 'approved' : e.status !== 'approved';
        });
      }
      return entries;
    },

    getApprovedEntries: function () {
      return this.getEntries({ status: 'approved' });
    },

    getPendingEntries: function () {
      return this.getEntries({ status: 'pending' });
    },

    approveEntry: function (id) {
      var entries = getGuestbook();
      var found = false;
      entries.forEach(function (e) {
        if (e.id === id) { e.status = 'approved'; found = true; }
      });
      if (found) saveGuestbook(entries);
      return found;
    },

    hideEntry: function (id) {
      var entries = getGuestbook();
      var found = false;
      entries.forEach(function (e) {
        if (e.id === id) { e.status = 'hidden'; found = true; }
      });
      if (found) saveGuestbook(entries);
      return found;
    },

    deleteEntry: function (id) {
      var entries = getGuestbook().filter(function (e) { return e.id !== id; });
      saveGuestbook(entries);
      return true;
    },

    getStats: function () {
      var entries = getGuestbook();
      var total = entries.length;
      var approved = entries.filter(function (e) { return e.status === 'approved'; }).length;
      var pending = entries.filter(function (e) { return e.status === 'pending'; }).length;
      var hidden = entries.filter(function (e) { return e.status === 'hidden'; }).length;
      return { total: total, approved: approved, pending: pending, hidden: hidden };
    },

    renderGuestbookSection: function (containerId) {
      var container = document.getElementById(containerId);
      if (!container) return;
      if (!this.isEnabled()) {
        container.style.display = 'none';
        return;
      }
      container.style.display = 'block';

      var entries = this.getApprovedEntries();
      var html = '';
      html += '<div class="guestbook-section">';
      html += '<h2 style="font-family:var(--font-heading);font-size:clamp(1.6rem,3.5vw,2.2rem);color:#fff;text-align:center;margin-bottom:8px">Guestbook</h2>';
      html += '<p style="color:var(--text-light);text-align:center;margin-bottom:28px;font-size:0.95rem">Leave a message for the happy couple</p>';

      html += '<div class="guestbook-form" id="guestbookForm">';
      html += '<div class="guestbook-form-row">';
      html += '<input type="text" id="gbName" placeholder="Your Name *" class="guestbook-input" maxlength="60">';
      html += '</div>';
      html += '<div class="guestbook-form-row">';
      html += '<textarea id="gbMessage" placeholder="Write your congratulations message... *" class="guestbook-textarea" rows="3" maxlength="500"></textarea>';
      html += '</div>';
      html += '<div class="guestbook-form-row">';
      html += '<label class="guestbook-photo-label"><i class="fas fa-camera"></i> Add Photo (optional)</label>';
      html += '<input type="file" id="gbPhoto" accept="image/*" class="guestbook-file-input">';
      html += '</div>';
      html += '<button class="rsvp-btn rsvp-btn-accept" id="gbSubmitBtn" onclick="Guestbook.submitEntry()" style="width:100%;justify-content:center"><i class="fas fa-pen-fancy"></i> Sign Guestbook</button>';
      html += '</div>';

      html += '<div class="guestbook-entries" id="guestbookEntries">';
      if (entries.length === 0) {
        html += '<p style="color:var(--text-light);text-align:center;font-style:italic;padding:20px">No messages yet. Be the first to sign!</p>';
      } else {
        entries.slice(0, 20).forEach(function (e) {
          html += '<div class="guestbook-entry">';
          if (e.photo) {
            html += '<div class="guestbook-entry-photo"><img src="' + esc(e.photo) + '" alt="' + esc(e.name) + '" loading="lazy"></div>';
          }
          html += '<div class="guestbook-entry-header">';
          html += '<strong>' + esc(e.name) + '</strong>';
          html += '<span class="guestbook-entry-time">' + timeAgo(e.createdAt) + '</span>';
          html += '</div>';
          html += '<p class="guestbook-entry-msg">' + esc(e.message) + '</p>';
          html += '</div>';
        });
      }
      html += '</div>';
      html += '</div>';

      container.innerHTML = html;
    },

    submitEntry: function () {
      var name = document.getElementById('gbName');
      var message = document.getElementById('gbMessage');
      var photoInput = document.getElementById('gbPhoto');
      if (!name || !message) return;

      var nameVal = name.value.trim();
      var msgVal = message.value.trim();
      if (!nameVal) { name.style.borderColor = '#ef4444'; setTimeout(function () { name.style.borderColor = ''; }, 2000); return; }
      if (!msgVal) { message.style.borderColor = '#ef4444'; setTimeout(function () { message.style.borderColor = ''; }, 2000); return; }

      var btn = document.getElementById('gbSubmitBtn');
      if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...'; }

      var d = {};
      try { d = JSON.parse(localStorage.getItem('weddingData') || '{}'); } catch (e) {}

      var process = function (photoData) {
        var result = Guestbook.addEntry({
          name: nameVal,
          message: msgVal,
          photo: photoData || '',
          weddingId: d.weddingId || '',
          source: 'invite-page'
        });

        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-pen-fancy"></i> Sign Guestbook'; }

        if (result.success) {
          if (typeof InviteSys !== 'undefined' && InviteSys.notify) {
            InviteSys.notify('Thank you! Your message has been submitted.', 'success');
          }
          name.value = '';
          message.value = '';
          if (photoInput) photoInput.value = '';
          Guestbook.renderGuestbookSection('guestbookContainer');
        } else if (result.error === 'guestbook_disabled') {
          if (typeof InviteSys !== 'undefined' && InviteSys.notify) {
            InviteSys.notify('Guestbook is currently disabled.', 'info');
          }
        } else {
          if (typeof InviteSys !== 'undefined' && InviteSys.notify) {
            InviteSys.notify('Please fill in all required fields.', 'error');
          }
        }
      };

      if (photoInput && photoInput.files && photoInput.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) { process(e.target.result); };
        reader.readAsDataURL(photoInput.files[0]);
      } else {
        process('');
      }
    },

    renderOwnerGuestbookManager: function (containerId) {
      var container = document.getElementById(containerId);
      if (!container) return;

      var stats = this.getStats();
      var pending = this.getPendingEntries();
      var approved = this.getApprovedEntries();

      var html = '';
      html += '<div class="owner-guestbook-manager">';
      html += '<div class="owner-section-header">';
      html += '<h3><i class="fas fa-book"></i> Digital Guestbook</h3>';
      html += '<label class="guestbook-toggle"><input type="checkbox" id="guestbookEnabledToggle" ' + (this.isEnabled() ? 'checked' : '') + ' onchange="Guestbook.toggleEnabled()"> Enable Guestbook</label>';
      html += '</div>';

      html += '<div class="owner-stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px">';
      html += '<div class="owner-stat-card"><div class="owner-stat-num">' + stats.total + '</div><div class="owner-stat-label">Total</div></div>';
      html += '<div class="owner-stat-card"><div class="owner-stat-num" style="color:#22c55e">' + stats.approved + '</div><div class="owner-stat-label">Approved</div></div>';
      html += '<div class="owner-stat-card"><div class="owner-stat-num" style="color:#f59e0b">' + stats.pending + '</div><div class="owner-stat-label">Pending</div></div>';
      html += '<div class="owner-stat-card"><div class="owner-stat-num" style="color:#ef4444">' + stats.hidden + '</div><div class="owner-stat-label">Hidden</div></div>';
      html += '</div>';

      if (pending.length > 0) {
        html += '<h4 style="color:var(--gold);margin-bottom:12px">Pending Approval (' + pending.length + ')</h4>';
        html += '<div class="guestbook-moderation-list">';
        pending.forEach(function (e) {
          html += '<div class="guestbook-moderation-item">';
          html += '<div class="guestbook-mod-content">';
          html += '<strong>' + esc(e.name) + '</strong>';
          html += '<p>' + esc(e.message) + '</p>';
          html += '<span class="owner-notif-time">' + timeAgo(e.createdAt) + '</span>';
          html += '</div>';
          html += '<div class="guestbook-mod-actions">';
          html += '<button onclick="Guestbook.approveEntry(\'' + e.id + '\');Guestbook.renderOwnerGuestbookManager(\'' + containerId + '\')" class="owner-btn owner-btn-sm" style="background:rgba(34,197,94,0.15);color:#22c55e;border:1px solid rgba(34,197,94,0.3)"><i class="fas fa-check"></i></button>';
          html += '<button onclick="Guestbook.hideEntry(\'' + e.id + '\');Guestbook.renderOwnerGuestbookManager(\'' + containerId + '\')" class="owner-btn owner-btn-sm" style="background:rgba(245,158,11,0.15);color:#f59e0b;border:1px solid rgba(245,158,11,0.3)"><i class="fas fa-eye-slash"></i></button>';
          html += '<button onclick="Guestbook.deleteEntry(\'' + e.id + '\');Guestbook.renderOwnerGuestbookManager(\'' + containerId + '\')" class="owner-btn owner-btn-sm" style="background:rgba(239,68,68,0.15);color:#ef4444;border:1px solid rgba(239,68,68,0.3)"><i class="fas fa-trash"></i></button>';
          html += '</div></div>';
        });
        html += '</div>';
      }

      if (approved.length > 0) {
        html += '<h4 style="color:var(--text-light);margin:16px 0 12px">Approved Messages (' + stats.approved + ')</h4>';
        html += '<div class="guestbook-moderation-list">';
        approved.slice(0, 10).forEach(function (e) {
          html += '<div class="guestbook-moderation-item">';
          html += '<div class="guestbook-mod-content">';
          if (e.photo) html += '<img src="' + esc(e.photo) + '" style="width:40px;height:40px;border-radius:50%;object-fit:cover;margin-bottom:6px">';
          html += '<strong>' + esc(e.name) + '</strong>';
          html += '<p>' + esc(e.message) + '</p>';
          html += '<span class="owner-notif-time">' + timeAgo(e.createdAt) + '</span>';
          html += '</div>';
          html += '<div class="guestbook-mod-actions">';
          html += '<button onclick="Guestbook.hideEntry(\'' + e.id + '\');Guestbook.renderOwnerGuestbookManager(\'' + containerId + '\')" class="owner-btn owner-btn-sm" style="background:rgba(245,158,11,0.15);color:#f59e0b;border:1px solid rgba(245,158,11,0.3)"><i class="fas fa-eye-slash"></i></button>';
          html += '<button onclick="Guestbook.deleteEntry(\'' + e.id + '\');Guestbook.renderOwnerGuestbookManager(\'' + containerId + '\')" class="owner-btn owner-btn-sm" style="background:rgba(239,68,68,0.15);color:#ef4444;border:1px solid rgba(239,68,68,0.3)"><i class="fas fa-trash"></i></button>';
          html += '</div></div>';
        });
        html += '</div>';
      }

      html += '</div>';
      container.innerHTML = html;
    },

    toggleEnabled: function () {
      var cb = document.getElementById('guestbookEnabledToggle');
      if (cb) this.setEnabled(cb.checked);
      if (typeof showNotification === 'function') {
        showNotification('Guestbook ' + (cb && cb.checked ? 'enabled' : 'disabled'), 'info');
      }
    }
  };

  window.Guestbook = Guestbook;
})();
