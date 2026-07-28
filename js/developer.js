var DeveloperPage = {
  init: function() {
    this.initReveal();
    this.initPortfolio();
    this.initStats();
  },
  initReveal: function() {
    var els = document.querySelectorAll('.dev-reveal');
    if (!els.length) return;
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) {
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateY(0)';
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    els.forEach(function(el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
      observer.observe(el);
    });
  },
  initPortfolio: function() {
    var items = document.querySelectorAll('.dev-portfolio-item');
    items.forEach(function(item) {
      item.addEventListener('click', function() {
        var img = this.querySelector('img');
        var title = this.dataset.title || 'Portfolio Project';
        if (img && typeof DeveloperLightbox !== 'undefined') {
          DeveloperLightbox.show(img.src, title);
        }
      });
    });
  },
  initStats: function() {
    var counters = document.querySelectorAll('.dev-stat-card .num');
    if (!counters.length) return;
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) {
          var el = e.target;
          var target = parseInt(el.dataset.count) || 0;
          var suffix = el.dataset.suffix || '';
          var text = el.dataset.text || '';
          if (text) {
            el.textContent = text;
          } else if (target > 0) {
            DeveloperPage.animateCount(el, target, suffix);
          }
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function(el) { observer.observe(el); });
  },
  animateCount: function(el, target, suffix) {
    var current = 0;
    var step = Math.max(1, Math.floor(target / 40));
    var timer = setInterval(function() {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = current + suffix;
    }, 30);
  }
};

var DeveloperLightbox = {
  show: function(src, title) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(5,11,24,0.95);backdrop-filter:blur(20px);display:flex;align-items:center;justify-content:center;padding:40px;cursor:pointer;animation:devFadeIn 0.3s ease';
    overlay.onclick = function() { overlay.remove(); };
    var img = document.createElement('img');
    img.src = src;
    img.alt = title || 'Portfolio';
    img.style.cssText = 'max-width:90%;max-height:85vh;border-radius:16px;border:1px solid rgba(212,175,55,0.15);box-shadow:0 20px 60px rgba(0,0,0,0.5);object-fit:contain;';
    overlay.appendChild(img);
    var style = document.createElement('style');
    style.textContent = '@keyframes devFadeIn{from{opacity:0}to{opacity:1}}';
    document.head.appendChild(style);
    document.body.appendChild(overlay);
  }
};

var DeveloperActions = {
  phone: '08157610930',
  whatsapp: '08025092458',
  whatsappLink: 'https://wa.me/2348025092458',
  email: 'stonyboy@example.com',
  name: 'Leelee David Douglas (Stonyboy)',

  copyPhone: function() {
    var self = this;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(self.phone).then(function() {
        self.showNotification('Phone number copied!');
      });
    } else {
      var input = document.createElement('input');
      input.value = self.phone;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      self.showNotification('Phone number copied!');
    }
  },

  copyWhatsApp: function() {
    var self = this;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(self.whatsapp).then(function() {
        self.showNotification('WhatsApp number copied!');
      });
    } else {
      var input = document.createElement('input');
      input.value = self.whatsapp;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      self.showNotification('WhatsApp number copied!');
    }
  },

  copyEmail: function() {
    var self = this;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(self.email).then(function() {
        self.showNotification('Email copied!');
      });
    } else {
      var input = document.createElement('input');
      input.value = self.email;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      self.showNotification('Email copied!');
    }
  },

  share: function() {
    var self = this;
    var shareData = {
      title: self.name + ' — Developer Profile',
      text: 'Check out ' + self.name + ' — Full Stack Developer, Founder & Software Engineer. Creator of the Luxury Wedding Platform.',
      url: window.location.href
    };
    if (navigator.share) {
      navigator.share(shareData).catch(function() {});
    } else {
      var text = shareData.text + '\n' + shareData.url;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function() {
          self.showNotification('Profile link copied to clipboard!');
        });
      }
    }
  },

  downloadVCard: function() {
    var self = this;
    var vcard = 'BEGIN:VCARD\nVERSION:3.0\nN:Douglas;Leelee David;;;\nFN:Leelee David Douglas\nNICKNAME:Stonyboy\nORG:Luxury Wedding Platform\nTITLE:Full Stack Developer &bull; Founder &bull; Software Engineer\nTEL;TYPE=CELL:08157610930\nTEL;TYPE=CELL:08025092458\nEMAIL:' + self.email + '\nADR;TYPE=HOME:;;Nigeria;;;;\nURL:' + window.location.href + '\nNOTE:Creator of the Luxury Wedding Platform\nEND:VCARD';
    var blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'Leelee-David-Douglas-Stonyboy.vcf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    self.showNotification('Contact card downloaded!');
  },

  showNotification: function(message) {
    var notification = document.createElement('div');
    notification.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#D4AF37,#B8860B);color:#0B0F19;padding:14px 28px;border-radius:12px;font-family:Poppins,sans-serif;font-size:0.9rem;font-weight:600;z-index:100001;box-shadow:0 8px 30px rgba(212,175,55,0.4);animation:devNotifIn 0.3s ease';
    notification.textContent = message;
    var style = document.createElement('style');
    style.textContent = '@keyframes devNotifIn{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}';
    document.head.appendChild(style);
    document.body.appendChild(notification);
    setTimeout(function() {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(-50%) translateY(20px)';
      notification.style.transition = 'all 0.3s ease';
      setTimeout(function() { notification.remove(); }, 300);
    }, 2500);
  }
};

document.addEventListener('DOMContentLoaded', function() {
  DeveloperPage.init();
});
