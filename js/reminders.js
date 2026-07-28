(function () {
  'use strict';
  if (window.__WEDDING_REMINDERS) return;
  window.__WEDDING_REMINDERS = true;

  var REMINDERS_KEY = 'weddingReminders';
  var DB_KEY = 'weddingData';

  function getData() {
    try { return JSON.parse(localStorage.getItem(DB_KEY) || '{}'); } catch (e) { return {}; }
  }

  function getReminders() {
    try { return JSON.parse(localStorage.getItem(REMINDERS_KEY) || '[]'); } catch (e) { return []; }
  }

  function saveReminders(r) {
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(r));
  }

  function genId() {
    return 'rem_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
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

  var Reminders = {
    create: function (data) {
      var reminder = {
        id: genId(),
        title: data.title || '',
        message: data.message || '',
        type: data.type || 'custom',
        triggerAt: data.triggerAt || null,
        sentTo: data.sentTo || 'all',
        createdAt: Date.now(),
        sent: false
      };
      var reminders = getReminders();
      reminders.unshift(reminder);
      saveReminders(reminders);
      return reminder;
    },

    createAutoReminders: function () {
      var d = getData();
      if (!d.weddingDate) return [];

      var weddingDate = new Date(d.weddingDate + 'T' + (d.weddingTime || '12:00'));
      var now = Date.now();
      var diff = weddingDate.getTime() - now;
      if (diff <= 0) return [];

      var reminders = [];
      var groom = d.groomName || 'Groom';
      var bride = d.brideName || 'Bride';
      var venue = d.venue || 'the venue';

      var sevenDays = 7 * 24 * 60 * 60 * 1000;
      var oneDay = 24 * 60 * 60 * 1000;
      var threeHours = 3 * 60 * 60 * 1000;

      if (diff > sevenDays) {
        reminders.push({
          id: genId(),
          title: '7 Days to Go!',
          message: 'The wedding of ' + groom + ' & ' + bride + ' is in 7 days at ' + venue + '. Get ready to celebrate!',
          type: '7_days',
          triggerAt: now + (diff - sevenDays),
          createdAt: Date.now(),
          sent: false
        });
      }

      if (diff > oneDay) {
        reminders.push({
          id: genId(),
          title: 'Wedding Tomorrow!',
          message: 'The wedding of ' + groom + ' & ' + bride + ' is TOMORROW at ' + venue + '! We can\'t wait to see you there!',
          type: 'tomorrow',
          triggerAt: now + (diff - oneDay),
          createdAt: Date.now(),
          sent: false
        });
      }

      if (diff > threeHours) {
        reminders.push({
          id: genId(),
          title: 'Wedding in 3 Hours!',
          message: 'The wedding of ' + groom + ' & ' + bride + ' starts in 3 hours at ' + venue + '! See you soon!',
          type: '3_hours',
          triggerAt: now + (diff - threeHours),
          createdAt: Date.now(),
          sent: false
        });
      }

      var existing = getReminders();
      var existingTypes = {};
      existing.forEach(function (r) { existingTypes[r.type] = true; });

      reminders = reminders.filter(function (r) { return !existingTypes[r.type]; });
      if (reminders.length > 0) {
        var all = existing.concat(reminders);
        saveReminders(all);
      }

      return reminders;
    },

    sendReminder: function (id) {
      var reminders = getReminders();
      var found = false;
      reminders.forEach(function (r) {
        if (r.id === id && !r.sent) {
          r.sent = true;
          r.sentAt = Date.now();
          found = true;
          try {
            var notifs = JSON.parse(localStorage.getItem('weddingNotifications') || '[]');
            notifs.unshift({
              id: 'notif_' + Date.now().toString(36),
              type: 'reminder',
              title: r.title,
              message: r.message,
              time: Date.now(),
              read: false
            });
            if (notifs.length > 50) notifs.length = 50;
            localStorage.setItem('weddingNotifications', JSON.stringify(notifs));
            if (typeof updateNotifBadge === 'function') updateNotifBadge();
          } catch (e) {}
        }
      });
      if (found) saveReminders(reminders);
      return found;
    },

    sendNow: function (id) {
      var reminders = getReminders();
      var found = false;
      reminders.forEach(function (r) {
        if (r.id === id) {
          r.sent = true;
          r.sentAt = Date.now();
          found = true;
          try {
            var notifs = JSON.parse(localStorage.getItem('weddingNotifications') || '[]');
            notifs.unshift({
              id: 'notif_' + Date.now().toString(36),
              type: 'reminder',
              title: r.title,
              message: r.message,
              time: Date.now(),
              read: false
            });
            if (notifs.length > 50) notifs.length = 50;
            localStorage.setItem('weddingNotifications', JSON.stringify(notifs));
            if (typeof updateNotifBadge === 'function') updateNotifBadge();
          } catch (e) {}
          if (typeof showNotification === 'function') {
            showNotification('Reminder sent: ' + r.title, 'success');
          }
        }
      });
      if (found) saveReminders(reminders);
      return found;
    },

    deleteReminder: function (id) {
      var reminders = getReminders().filter(function (r) { return r.id !== id; });
      saveReminders(reminders);
    },

    getReminders: function () {
      return getReminders();
    },

    getPendingReminders: function () {
      return getReminders().filter(function (r) { return !r.sent; });
    },

    getSentReminders: function () {
      return getReminders().filter(function (r) { return r.sent; });
    },

    checkAndSend: function () {
      var now = Date.now();
      var reminders = getReminders();
      var updated = false;
      reminders.forEach(function (r) {
        if (!r.sent && r.triggerAt && now >= r.triggerAt) {
          r.sent = true;
          r.sentAt = now;
          updated = true;
          try {
            var notifs = JSON.parse(localStorage.getItem('weddingNotifications') || '[]');
            notifs.unshift({
              id: 'notif_' + Date.now().toString(36),
              type: 'reminder',
              title: r.title,
              message: r.message,
              time: Date.now(),
              read: false
            });
            if (notifs.length > 50) notifs.length = 50;
            localStorage.setItem('weddingNotifications', JSON.stringify(notifs));
            if (typeof updateNotifBadge === 'function') updateNotifBadge();
          } catch (e) {}
        }
      });
      if (updated) saveReminders(reminders);
    },

    renderRemindersSection: function (containerId) {
      var container = document.getElementById(containerId);
      if (!container) return;

      this.createAutoReminders();
      var all = this.getReminders();
      var pending = all.filter(function (r) { return !r.sent; });
      var sent = all.filter(function (r) { return r.sent; });

      var html = '';
      html += '<div class="owner-reminders-section">';
      html += '<div class="owner-section-header">';
      html += '<h3><i class="fas fa-bell"></i> Wedding Reminders</h3>';
      html += '</div>';

      html += '<div class="owner-reminder-actions" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px">';
      html += '<button onclick="Reminders.createQuickReminder(\'7_days\')" class="owner-btn owner-btn-sm owner-btn-outline"><i class="fas fa-calendar-week"></i> 7 Days Before</button>';
      html += '<button onclick="Reminders.createQuickReminder(\'tomorrow\')" class="owner-btn owner-btn-sm owner-btn-outline"><i class="fas fa-calendar-day"></i> Day Before</button>';
      html += '<button onclick="Reminders.createQuickReminder(\'3_hours\')" class="owner-btn owner-btn-sm owner-btn-outline"><i class="fas fa-clock"></i> 3 Hours Before</button>';
      html += '</div>';

      if (pending.length > 0) {
        html += '<h4 style="color:var(--gold);margin-bottom:10px">Pending Reminders (' + pending.length + ')</h4>';
        pending.forEach(function (r) {
          html += '<div class="owner-notif-item">';
          html += '<div class="owner-notif-icon" style="background:rgba(245,158,11,0.1);color:#f59e0b"><i class="fas fa-clock"></i></div>';
          html += '<div class="owner-notif-content"><strong>' + esc(r.title) + '</strong><span>' + esc(r.message) + '</span></div>';
          html += '<button onclick="Reminders.sendNow(\'' + r.id + '\');Reminders.renderRemindersSection(\'' + containerId + '\')" class="owner-btn owner-btn-sm" style="background:rgba(34,197,94,0.15);color:#22c55e;border:1px solid rgba(34,197,94,0.3)"><i class="fas fa-paper-plane"></i> Send Now</button>';
          html += '</div>';
        });
      } else {
        html += '<p style="color:var(--text-light);text-align:center;padding:16px;font-style:italic">No pending reminders. Create one using the buttons above.</p>';
      }

      if (sent.length > 0) {
        html += '<h4 style="color:var(--text-light);margin:16px 0 10px">Sent Reminders (' + sent.length + ')</h4>';
        sent.slice(0, 5).forEach(function (r) {
          html += '<div class="owner-notif-item" style="opacity:0.6">';
          html += '<div class="owner-notif-icon" style="background:rgba(34,197,94,0.1);color:#22c55e"><i class="fas fa-check-circle"></i></div>';
          html += '<div class="owner-notif-content"><strong>' + esc(r.title) + '</strong><span>' + esc(r.message) + '</span><span class="owner-notif-time">Sent ' + timeAgo(r.sentAt) + '</span></div>';
          html += '</div>';
        });
      }

      html += '</div>';
      container.innerHTML = html;
    },

    createQuickReminder: function (type) {
      var d = getData();
      if (!d.weddingDate) {
        if (typeof showNotification === 'function') showNotification('Please set a wedding date first.', 'error');
        return;
      }
      var groom = d.groomName || 'Groom';
      var bride = d.brideName || 'Bride';
      var venue = d.venue || 'the venue';
      var title = '';
      var message = '';

      switch (type) {
        case '7_days':
          title = '7 Days to Go!';
          message = 'The wedding of ' + groom + ' & ' + bride + ' is in 7 days at ' + venue + '. Get ready to celebrate!';
          break;
        case 'tomorrow':
          title = 'Wedding Tomorrow!';
          message = 'The wedding of ' + groom + ' & ' + bride + ' is TOMORROW at ' + venue + '! We can\'t wait to see you there!';
          break;
        case '3_hours':
          title = 'Wedding in 3 Hours!';
          message = 'The wedding of ' + groom + ' & ' + bride + ' starts in 3 hours at ' + venue + '! See you soon!';
          break;
      }

      this.create({ title: title, message: message, type: type });
      if (typeof showNotification === 'function') showNotification(title + ' reminder created!', 'success');
      this.renderRemindersSection('ownerRemindersContainer');
    }
  };

  window.Reminders = Reminders;

  setInterval(function () { Reminders.checkAndSend(); }, 60000);
  setTimeout(function () { Reminders.createAutoReminders(); }, 500);
})();
