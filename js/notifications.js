/**
 * Wedding Notification System
 * Glassmorphism toast notifications with slide-down animation
 */
(function() {
  'use strict';

  var container = null;

  function ensureContainer() {
    if (container && document.body.contains(container)) return container;
    container = document.createElement('div');
    container.id = 'weddingNotifications';
    container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:30000;display:flex;flex-direction:column;gap:10px;pointer-events:none;max-width:400px;width:calc(100% - 40px);';
    document.body.appendChild(container);
    return container;
  }

  var icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };

  var colors = {
    success: { border: 'rgba(34,197,94,0.3)', bg: 'rgba(34,197,94,0.08)', icon: '#22c55e' },
    error: { border: 'rgba(239,68,68,0.3)', bg: 'rgba(239,68,68,0.08)', icon: '#ef4444' },
    warning: { border: 'rgba(245,158,11,0.3)', bg: 'rgba(245,158,11,0.08)', icon: '#f59e0b' },
    info: { border: 'rgba(212,175,55,0.3)', bg: 'rgba(212,175,55,0.08)', icon: '#D4AF37' }
  };

  window.showNotification = function(message, type, duration) {
    type = type || 'info';
    duration = duration || 4000;

    var c = ensureContainer();
    var style = colors[type] || colors.info;

    var toast = document.createElement('div');
    toast.style.cssText = 'pointer-events:auto;display:flex;align-items:center;gap:12px;padding:14px 20px;border-radius:14px;background:rgba(11,15,25,0.92);border:1px solid ' + style.border + ';backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);box-shadow:0 8px 32px rgba(0,0,0,0.4),0 0 0 1px rgba(212,175,55,0.04);transform:translateX(120%);opacity:0;transition:all 0.4s cubic-bezier(0.34,1.56,0.64,1);font-family:Inter,sans-serif;';

    toast.innerHTML = '<div style="width:32px;height:32px;border-radius:50%;background:' + style.bg + ';border:1px solid ' + style.border + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas ' + icons[type] + '" style="color:' + style.icon + ';font-size:0.85rem;"></i></div>' +
      '<div style="flex:1;"><div style="color:#E8E0D0;font-size:0.88rem;font-weight:500;line-height:1.4;">' + message + '</div></div>' +
      '<button onclick="this.parentElement.remove()" style="background:none;border:none;color:#A09888;font-size:1rem;cursor:pointer;padding:4px;flex-shrink:0;line-height:1;"><i class="fas fa-times"></i></button>';

    c.appendChild(toast);

    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
      });
    });

    setTimeout(function() {
      toast.style.transform = 'translateX(120%)';
      toast.style.opacity = '0';
      setTimeout(function() {
        if (toast.parentElement) toast.remove();
      }, 400);
    }, duration);

    return toast;
  };

  // Also override global showNotification from global.js if it exists
  // The showNotification defined here will be the canonical one

  // ===== NOTIFICATION BADGE =====
  function ensureNotifBadge() {
    var existing = document.querySelector('.notif-badge');
    if (existing) return;
    var badge = document.createElement('span');
    badge.className = 'notif-badge';
    badge.style.cssText = 'position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;border-radius:50px;background:var(--error);color:#fff;font-size:0.65rem;font-weight:700;display:none;align-items:center;justify-content:center;padding:0 4px;font-family:Poppins,sans-serif;pointer-events:none;';
    // Add to all notification bell icons in nav
    var bells = document.querySelectorAll('.sidebar-link[href*="notifications"], .notif-icon');
    bells.forEach(function(bell) {
      if (!bell.querySelector('.notif-badge')) {
        var wrapper = bell.style.position ? bell : bell;
        wrapper.style.position = 'relative';
        wrapper.appendChild(badge.cloneNode(true));
      }
    });
  }

  // Update badge count on load
  setTimeout(function() {
    if (typeof updateNotifBadge === 'function') updateNotifBadge();
    ensureNotifBadge();
  }, 500);

})();
