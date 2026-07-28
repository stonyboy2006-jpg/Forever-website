/**
 * Wedding Notification System — Luxury Toast Notifications
 * Premium glassmorphism toasts with title, description, icon, auto-dismiss, manual close
 */
(function() {
  'use strict';

  var container = null;

  function ensureContainer() {
    if (container && document.body.contains(container)) return container;
    container = document.createElement('div');
    container.className = 'ds-toast-container';
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-label', 'Notifications');
    document.body.appendChild(container);
    return container;
  }

  var icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };

  var titles = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Notice'
  };

  /**
   * Show a luxury toast notification
   * @param {string} message - Description text (or title if no title param)
   * @param {string} type - success|error|warning|info
   * @param {number} duration - Auto-dismiss in ms (default 4000, 0 = no auto-dismiss)
   * @param {object} opts - { title: string, description: string, dismissible: boolean }
   */
  window.showNotification = function(message, type, duration, opts) {
    type = type || 'info';
    duration = duration !== undefined ? duration : 4000;
    opts = opts || {};

    var c = ensureContainer();
    var title = opts.title || titles[type] || 'Notice';
    var description = opts.description || message || '';
    var dismissible = opts.dismissible !== false;

    var toast = document.createElement('div');
    toast.className = 'ds-toast ' + type;
    toast.setAttribute('role', 'alert');
    toast.style.position = 'relative';

    var iconHtml = '<div class="ds-toast-icon"><i class="fas ' + (icons[type] || icons.info) + '"></i></div>';

    var closeBtn = dismissible
      ? '<button class="ds-toast-close" aria-label="Dismiss notification"><i class="fas fa-times"></i></button>'
      : '';

    toast.innerHTML = iconHtml +
      '<div class="ds-toast-body">' +
        '<div class="ds-toast-title">' + escHtml(title) + '</div>' +
        '<div class="ds-toast-desc">' + escHtml(description) + '</div>' +
      '</div>' +
      closeBtn;

    if (duration > 0) {
      var progress = document.createElement('div');
      progress.className = 'ds-toast-progress';
      progress.style.width = '100%';
      progress.style.transition = 'width ' + duration + 'ms linear';
      toast.appendChild(progress);
      setTimeout(function() { progress.style.width = '0%'; }, 50);
    }

    c.appendChild(toast);

    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        toast.classList.add('show');
      });
    });

    function dismiss() {
      toast.classList.remove('show');
      setTimeout(function() {
        if (toast.parentElement) toast.remove();
      }, 450);
    }

    var closeBtnEl = toast.querySelector('.ds-toast-close');
    if (closeBtnEl) {
      closeBtnEl.addEventListener('click', function(e) {
        e.stopPropagation();
        dismiss();
      });
    }

    if (duration > 0) {
      toast.addEventListener('mouseenter', function() {
        if (progress) progress.style.transitionDuration = '0s';
      });
      toast.addEventListener('mouseleave', function() {
        if (progress) {
          var remaining = parseFloat(getComputedStyle(progress).width) / toast.offsetWidth * duration;
          progress.style.transitionDuration = remaining + 'ms';
          progress.style.width = '0%';
        }
      });
      setTimeout(dismiss, duration);
    }

    return { el: toast, dismiss: dismiss };
  };

  function escHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ===== NOTIFICATION BADGE =====
  function ensureNotifBadge() {
    var bells = document.querySelectorAll('.sidebar-link[href*="notifications"], .ds-nav-bell, .notif-icon');
    bells.forEach(function(bell) {
      if (bell.querySelector('.ds-notif-dot, .notif-badge')) return;
      bell.style.position = 'relative';
      var dot = document.createElement('span');
      dot.className = 'ds-notif-dot';
      bell.appendChild(dot);
    });
  }

  setTimeout(ensureNotifBadge, 500);

})();
