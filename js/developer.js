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
          if (target > 0) {
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

document.addEventListener('DOMContentLoaded', function() {
  DeveloperPage.init();
});