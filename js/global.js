(function() {
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';
  var isInvitePage = (currentPage === 'invite.html' || window.location.pathname.indexOf('/invite/') === 0);
  var isPublicPage = isInvitePage || ['index.html', 'our-story.html', 'wedding-details.html', 'wedding-party.html', 'events.html', 'gallery.html', 'timeline.html', 'story.html', 'rsvp.html', 'gift-registry.html', 'music.html', 'faq.html', 'contact.html', 'about.html', '404.html', '403.html'].indexOf(currentPage) !== -1;

  function isGuest() {
    try {
      var s = localStorage.getItem('weddingAuthSession');
      if (!s) return true;
      var sess = JSON.parse(s);
      return !(sess && sess.userId && sess.expiresAt && Date.now() < sess.expiresAt);
    } catch (e) { return true; }
  }

  // ===== LUXURY BACK NAVIGATION =====
  window.luxuryBack = function() {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.2s ease';
    setTimeout(function() {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = 'index.html';
      }
    }, 200);
  };

  // ===== DEVELOPER POPUP =====
  window.DeveloperPopup = {
    show: function() {
      if (isGuest() && isInvitePage) return;
      var existing = document.getElementById('devPopupOverlay');
      if (existing) { existing.remove(); return; }
      var overlay = document.createElement('div');
      overlay.id = 'devPopupOverlay';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(5,11,24,0.92);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);display:flex;align-items:center;justify-content:center;padding:20px;animation:devPopupIn 0.4s ease;cursor:pointer;';
      overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

      var box = document.createElement('div');
      box.style.cssText = 'max-width:440px;width:100%;padding:40px 32px;background:linear-gradient(145deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01));border:1px solid rgba(212,175,55,0.15);border-radius:24px;text-align:center;cursor:default;position:relative;';
      box.innerHTML =
        '<button class="luxury-close luxury-close-sm" onclick="this.closest(\'#devPopupOverlay\').remove()" aria-label="Close" style="position:absolute;top:12px;right:16px;"><i class="fas fa-arrow-left"></i></button>' +
        '<div style="font-family:\'Playfair Display\',serif;font-size:1.5rem;color:#D4AF37;margin-bottom:4px;">David Leelee Douglas</div>' +
        '<div style="font-family:\'Inter\',sans-serif;font-size:0.82rem;color:rgba(212,175,55,0.6);margin-bottom:6px;">Popularly Known As <strong style="color:#D4AF37;">Stonyboy</strong></div>' +
        '<div style="font-family:\'Inter\',sans-serif;font-size:0.72rem;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:2px;margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid rgba(212,175,55,0.08);">Founder, Lead Developer &amp; Designer</div>' +
        '<div style="font-family:\'Inter\',sans-serif;font-size:0.78rem;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:2px;margin-bottom:14px;">Services</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px;">' +
          '<div style="padding:10px;background:rgba(212,175,55,0.04);border-radius:10px;border:1px solid rgba(212,175,55,0.06);">' +
            '<i class="fas fa-heart" style="color:#D4AF37;font-size:1rem;display:block;margin-bottom:4px;"></i>' +
            '<span style="font-family:\'Inter\',sans-serif;font-size:0.68rem;color:rgba(255,255,255,0.6);">Wedding Websites</span>' +
          '</div>' +
          '<div style="padding:10px;background:rgba(212,175,55,0.04);border-radius:10px;border:1px solid rgba(212,175,55,0.06);">' +
            '<i class="fas fa-laptop-code" style="color:#D4AF37;font-size:1rem;display:block;margin-bottom:4px;"></i>' +
            '<span style="font-family:\'Inter\',sans-serif;font-size:0.68rem;color:rgba(255,255,255,0.6);">Web Design</span>' +
          '</div>' +
          '<div style="padding:10px;background:rgba(212,175,55,0.04);border-radius:10px;border:1px solid rgba(212,175,55,0.06);">' +
            '<i class="fas fa-mobile-alt" style="color:#D4AF37;font-size:1rem;display:block;margin-bottom:4px;"></i>' +
            '<span style="font-family:\'Inter\',sans-serif;font-size:0.68rem;color:rgba(255,255,255,0.6);">Mobile Apps</span>' +
          '</div>' +
          '<div style="padding:10px;background:rgba(212,175,55,0.04);border-radius:10px;border:1px solid rgba(212,175,55,0.06);">' +
            '<i class="fas fa-robot" style="color:#D4AF37;font-size:1rem;display:block;margin-bottom:4px;"></i>' +
            '<span style="font-family:\'Inter\',sans-serif;font-size:0.68rem;color:rgba(255,255,255,0.6);">AI Solutions</span>' +
          '</div>' +
          '<div style="grid-column:1/-1;padding:10px;background:rgba(212,175,55,0.04);border-radius:10px;border:1px solid rgba(212,175,55,0.06);">' +
            '<i class="fas fa-paint-brush" style="color:#D4AF37;font-size:1rem;display:block;margin-bottom:4px;"></i>' +
            '<span style="font-family:\'Inter\',sans-serif;font-size:0.68rem;color:rgba(255,255,255,0.6);">Digital Branding</span>' +
          '</div>' +
        '</div>' +
        '<div style="padding:16px;background:rgba(212,175,55,0.03);border-radius:12px;border:1px solid rgba(212,175,55,0.06);">' +
          '<div style="font-family:\'Inter\',sans-serif;font-size:0.72rem;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Contact</div>' +
          '<div style="display:flex;justify-content:center;gap:16px;flex-wrap:wrap;">' +
            '<a href="https://wa.me/2348025092458" target="_blank" style="color:#D4AF37;font-family:\'Inter\',sans-serif;font-size:0.82rem;text-decoration:none;transition:color 0.3s;"><i class="fab fa-whatsapp"></i> 08025092458</a>' +
            '<a href="tel:08157610930" style="color:#D4AF37;font-family:\'Inter\',sans-serif;font-size:0.82rem;text-decoration:none;transition:color 0.3s;"><i class="fas fa-phone"></i> 08157610930</a>' +
          '</div>' +
        '</div>' +
        '<a href="developer.html" style="display:inline-block;margin-top:16px;padding:10px 24px;border-radius:50px;background:transparent;border:1px solid rgba(212,175,55,0.2);color:#D4AF37;font-family:\'Inter\',sans-serif;font-size:0.78rem;text-decoration:none;transition:all 0.3s;" onmouseover="this.style.background=\'rgba(212,175,55,0.06)\';this.style.borderColor=\'rgba(212,175,55,0.4)\'" onmouseout="this.style.background=\'transparent\';this.style.borderColor=\'rgba(212,175,55,0.2)\'"><i class="fas fa-user"></i> Full Developer Profile</a>';

      overlay.appendChild(box);
      document.body.appendChild(overlay);

      var style = document.createElement('style');
      style.textContent = '@keyframes devPopupIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}';
      document.head.appendChild(style);
    }
  };

  // ===== NOTIFICATION SYSTEM =====
  var container = document.getElementById('notificationContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notificationContainer';
    container.style.cssText = 'position:fixed;top:80px;right:16px;z-index:99999;display:flex;flex-direction:column;gap:10px;max-width:400px;width:calc(100vw - 32px);pointer-events:none;';
    document.body.appendChild(container);
  }
  window.showNotification = function(msg, type) {
    type = type || 'info';
    var n = document.createElement('div');
    var icons = {success:'fa-check-circle',error:'fa-times-circle',warning:'fa-exclamation-triangle',info:'fa-info-circle'};
    var colors = {success:'rgba(39,174,96,0.15)',error:'rgba(231,76,60,0.15)',warning:'rgba(243,156,18,0.15)',info:'rgba(212,175,55,0.1)'};
    var borders = {success:'rgba(39,174,96,0.3)',error:'rgba(231,76,60,0.3)',warning:'rgba(243,156,18,0.3)',info:'rgba(212,175,55,0.2)'};
    n.style.cssText = 'pointer-events:all;padding:14px 18px;border-radius:12px;font-family:Inter,sans-serif;font-size:0.85rem;color:#fff;display:flex;align-items:center;gap:12px;transform:translateX(120%);opacity:0;transition:all 0.5s cubic-bezier(0.25,0.46,0.45,0.94);box-shadow:0 8px 30px rgba(0,0,0,0.4);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid ' + (borders[type]||borders.info) + ';background:' + (colors[type]||colors.info) + ';';
    n.innerHTML = '<i class="fas ' + (icons[type]||icons.info) + '" style="font-size:1.1rem;flex-shrink:0;color:' + (type==='info'?'var(--gold)':'inherit') + ';"></i><span style="flex:1;line-height:1.5;">' + msg + '</span><button class="luxury-close luxury-close-sm" onclick="this.parentElement.remove()" aria-label="Dismiss" style="width:28px;height:28px;min-width:28px;min-height:28px;font-size:0.7rem;"><i class="fas fa-arrow-left" style="transform:rotate(90deg);"></i></button>';
    container.appendChild(n);
    requestAnimationFrame(function() { n.style.transform = 'translateX(0)'; n.style.opacity = '1'; });
    setTimeout(function() {
      n.style.transform = 'translateX(120%)'; n.style.opacity = '0';
      setTimeout(function() { if (n.parentElement) n.remove(); }, 500);
    }, 5000);
  };

  // ===== DEVELOPER CREDIT (skip on invite/public pages) =====
  if (!isInvitePage) {
    var skipCreditPages = [];
    var dp = document.createElement('div');
    dp.style.cssText = 'width:100%;text-align:center;padding:24px 20px;border-top:1px solid rgba(212,175,55,0.04);background:var(--dark,#050B18);position:relative;z-index:1;';
    dp.innerHTML = '<div style="font-family:Inter,sans-serif;font-size:0.8rem;color:rgba(255,255,255,0.3);line-height:1.8;">Developed with <i class="fas fa-heart" style="color:var(--gold,#D4AF37);"></i> by <span style="color:var(--gold,#D4AF37);font-weight:500;cursor:pointer;" onclick="DeveloperPopup.show()">Leelee David Douglas (Stonyboy)</span><br><i class="fas fa-phone" style="color:var(--gold,#D4AF37);margin-right:4px;"></i> Call: 08157610930 | <i class="fab fa-whatsapp" style="color:var(--gold,#D4AF37);margin-right:4px;"></i> WhatsApp: 08025092458</div>';
    dp.setAttribute('data-dev-credit','1');
    if (skipCreditPages.indexOf(currentPage) === -1 && !document.querySelector('[data-dev-credit]')) {
      var insertAfter = document.querySelector('footer') || document.body.lastElementChild;
      if (insertAfter && insertAfter !== dp) {
        if (insertAfter.nextSibling) insertAfter.parentNode.insertBefore(dp, insertAfter.nextSibling);
        else document.body.appendChild(dp);
      } else {
        document.body.appendChild(dp);
      }
    }
  }

  // ===== ADMIN CREDIT (setup/preview) =====
  if ((currentPage === 'setup.html' || currentPage === 'preview.html') && !isGuest()) {
    if (!document.querySelector('[data-admin-credit]')) {
      var ac = document.createElement('div');
      ac.setAttribute('data-admin-credit','1');
      ac.style.cssText = 'text-align:center;padding:12px 20px;font-family:Inter,sans-serif;font-size:0.72rem;color:rgba(255,255,255,0.2);background:var(--dark,#050B18);border-top:1px solid rgba(212,175,55,0.04);letter-spacing:0.5px;';
      ac.innerHTML = 'Platform Developed By <span style="color:var(--gold,#D4AF37);cursor:pointer;" onclick="DeveloperPopup.show()">David Leelee Douglas (Stonyboy)</span>';
      var footer = document.querySelector('footer') || document.body.lastElementChild;
      if (footer && footer !== ac) {
        if (footer.nextSibling) footer.parentNode.insertBefore(ac, footer.nextSibling);
        else document.body.appendChild(ac);
      } else {
        document.body.appendChild(ac);
      }
    }
  }

  // ===== BACK BUTTON =====
  var noBackPages = ['index.html'];
  if (!isInvitePage && noBackPages.indexOf(currentPage) === -1 && !document.querySelector('.back-btn') && !document.querySelector('.btn-back') && !document.querySelector('.inner-back-btn')) {
    var bb = document.createElement('button');
    bb.className = 'luxury-close';
    bb.innerHTML = '<i class="fas fa-arrow-left"></i>';
    bb.setAttribute('aria-label','Go back');
    bb.setAttribute('onclick','luxuryBack()');
    document.body.appendChild(bb);
  }

  // ===== PAGE FADE IN =====
  document.body.classList.add('luxury-page-fade');
})();
