;(function() {
  'use strict';

  var STORAGE_KEY = 'fp_toolbar_visible';

  var buttons = [
    { icon: 'fa-robot', label: 'AI Assistant', ariaLabel: 'Open AI wedding concierge', action: 'aiConcierge', color: 'gold' },
    { icon: 'fa-music', label: 'Music Player', ariaLabel: 'Toggle music player', action: 'music', color: 'gold' },
    { icon: 'fa-gift', label: 'Gift Registry', ariaLabel: 'View gift registry', action: 'giftRegistry', color: 'gold' },
    { icon: 'fa-images', label: 'Gallery', ariaLabel: 'View wedding gallery', action: 'gallery', color: 'gold' },
    { icon: 'fab fa-whatsapp', label: 'WhatsApp', ariaLabel: 'Contact via WhatsApp', action: 'whatsapp', color: 'whatsapp', size: 'lg' },
    { icon: 'fas fa-chevron-up', label: 'Back to Top', ariaLabel: 'Scroll to top', action: 'backToTop', color: 'gold' }
  ];

  function isVisible() {
    var v = localStorage.getItem(STORAGE_KEY);
    return v === null ? true : v === '1';
  }

  function setVisible(val) {
    localStorage.setItem(STORAGE_KEY, val ? '1' : '0');
  }

  function createPanel() {
    if (document.getElementById('floatingPanel')) return;

    var wrapper = document.createElement('div');
    wrapper.id = 'floatingWrapper';
    wrapper.className = 'floating-wrapper';

    var toggle = document.createElement('button');
    toggle.className = 'fp-toggle';
    toggle.id = 'fpToggle';
    toggle.setAttribute('aria-label', isVisible() ? 'Hide Quick Menu' : 'Show Quick Menu');
    toggle.title = isVisible() ? 'Hide Quick Menu' : 'Show Quick Menu';
    toggle.innerHTML = '<i class="fas fa-chevron-right"></i>';

    toggle.addEventListener('click', function() {
      var hidden = wrapper.classList.toggle('hidden');
      setVisible(!hidden);
      updateToggleBtn(!hidden);
    });
    toggle.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle.click();
      }
    });

    var panel = document.createElement('div');
    panel.id = 'floatingPanel';
    panel.className = 'floating-panel';
    panel.setAttribute('role', 'navigation');
    panel.setAttribute('aria-label', 'Quick actions');

    buttons.forEach(function(btn) {
      var isWhatsApp = btn.action === 'whatsapp';
      var el = document.createElement('button');
      el.className = 'fp-btn' + (isWhatsApp ? ' fp-btn-whatsapp' : '') + (btn.size === 'lg' ? ' fp-btn-lg' : '');
      el.setAttribute('aria-label', btn.ariaLabel);
      el.title = btn.label;
      el.innerHTML = '<i class="' + btn.icon + '"></i><span class="fp-tooltip">' + btn.label + '</span>';

      el.addEventListener('click', function(e) { handleAction(btn.action, e); });
      el.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleAction(btn.action, e); }
      });

      panel.appendChild(el);
    });

    wrapper.appendChild(toggle);
    wrapper.appendChild(panel);
    document.body.appendChild(wrapper);

    if (!isVisible()) {
      wrapper.classList.add('hidden');
    }
    updateToggleBtn(isVisible());
  }

  function updateToggleBtn(visible) {
    var toggle = document.getElementById('fpToggle');
    if (!toggle) return;
    var icon = toggle.querySelector('i');
    if (visible) {
      icon.className = 'fas fa-chevron-right';
      toggle.setAttribute('aria-label', 'Hide Quick Menu');
      toggle.title = 'Hide Quick Menu';
    } else {
      icon.className = 'fas fa-chevron-right';
      toggle.setAttribute('aria-label', 'Show Quick Menu');
      toggle.title = 'Show Quick Menu';
    }
  }

  function handleAction(action) {
    switch (action) {
      case 'aiConcierge':
        var widget = document.getElementById('aiWidgetWindow');
        if (widget) { widget.classList.toggle('open'); return; }
        var toggler = document.getElementById('aiWidgetBtn');
        if (toggler) { toggler.click(); return; }
        if (typeof toggleAIWidget === 'function') { toggleAIWidget(); }
        break;
      case 'music':
        var audio = document.getElementById('weddingSong');
        if (audio) {
          if (audio.paused) { audio.play(); } else { audio.pause(); }
        }
        break;
      case 'giftRegistry':
        window.location.href = 'gift-registry.html';
        break;
      case 'gallery':
        window.location.href = 'gallery.html';
        break;
      case 'whatsapp':
        var wd=JSON.parse(localStorage.getItem('weddingData')||'{}');
        var whatsapp=(wd.socialLinks&&wd.socialLinks.whatsapp)||'';
        if(whatsapp){
          var num=whatsapp.replace(/[^0-9]/g,'');
          window.open('https://wa.me/'+num+'?text=Hello!%20I%20visited%20your%20wedding%20website', '_blank');
        }else{
          navigator.clipboard.writeText('I visited your wedding website!').then(function(){alert('Contact info copied to clipboard!');});
        }
        break;
      case 'backToTop':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
    }
  }

  function init() {
    createPanel();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
