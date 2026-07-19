(function() {
  'use strict';

  // ===== 1. QUICK SIDEBAR NAVIGATION =====
  function initQuickSidebar() {
    var sections = [
      { id:'home', icon:'fa-home', label:'Home' },
      { id:'couple', icon:'fa-heart', label:'Couple' },
      { id:'countdown', icon:'fa-clock', label:'Countdown' },
      { id:'story', icon:'fa-book-open', label:'Love Story' },
      { id:'events', icon:'fa-calendar-alt', label:'Events' },
      { id:'gallery', icon:'fa-images', label:'Gallery' },
      { id:'rsvp', icon:'fa-envelope', label:'RSVP' },
      { id:'location', icon:'fa-map-marker-alt', label:'Venue' },
      { id:'gift', icon:'fa-gift', label:'Registry' },
      { id:'ai-assistant', icon:'fa-robot', label:'AI' },
      { id:'contact', icon:'fa-phone', label:'Contact' }
    ];
    var sidebar = document.createElement('div');
    sidebar.className = 'quick-sidebar';
    sidebar.id = 'quickSidebar';
    sidebar.innerHTML = sections.map(function(s) {
      var href = s.id === 'home' ? '#home' : '#' + s.id;
      return '<a href="' + href + '" data-section="' + s.id + '"><i class="fas ' + s.icon + '"></i><span class="tooltip">' + s.label + '</span></a>';
    }).join('') + '<a href="#" class="top-btn" onclick="window.scrollTo({top:0,behavior:\'smooth\'});return false"><i class="fas fa-arrow-up"></i><span class="tooltip">Top</span></a>';
    document.body.appendChild(sidebar);

    var ticking = false;
    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(function() {
          updateActiveSection();
          toggleSidebar();
          ticking = false;
        });
        ticking = true;
      }
    });

    function updateActiveSection() {
      var links = sidebar.querySelectorAll('a[data-section]');
      var scrollY = window.scrollY + 120;
      var active = 'home';
      links.forEach(function(a) {
        var sec = document.getElementById(a.dataset.section);
        if (sec && sec.offsetTop <= scrollY && sec.offsetTop + sec.offsetHeight > scrollY) {
          active = a.dataset.section;
        }
        a.classList.toggle('active', a.dataset.section === active);
      });
    }

    function toggleSidebar() {
      var hero = document.querySelector('.hero');
      var hH = hero ? hero.offsetHeight : window.innerHeight;
      sidebar.classList.toggle('hidden', window.scrollY < hH - 200);
    }

    setTimeout(toggleSidebar, 100);
  }

  // ===== 2. ENHANCED COUNTDOWN ===== (handled by script.js)

  // ===== 3. AI LOVE STORY GENERATOR =====
  function initAIStory() {
    var container = document.getElementById('aiStoryContainer');
    if (!container) return;
    var textEl = document.getElementById('aiStoryText');
    var spinner = document.getElementById('aiStorySpinner');
    var moodChips = container.querySelectorAll('.mood-chip');
    var currentMood = 'romantic';

    moodChips.forEach(function(chip) {
      chip.addEventListener('click', function() {
        moodChips.forEach(function(c) { c.classList.remove('active'); });
        chip.classList.add('active');
        currentMood = chip.dataset.mood || 'romantic';
      });
    });

    window.generateLoveStory = function() {
      textEl.classList.add('generating');
      spinner.classList.add('show');
      setTimeout(function() {
        var stories = {
          romantic: '"From the moment we first met, our hearts knew what our minds had yet to understand. Every glance, every smile, every stolen moment was a whisper from destiny. We have built a love that is patient, kind, and enduring — a love that grows stronger with each passing day. Today, we stand together not just as two people in love, but as two souls who have found their home in each other."',
          emotional: '"There are moments in life that take your breath away, and then there are moments that give it back. You gave me back my breath, my hope, my everything. In your eyes, I found my future. In your arms, I found my peace. Our love story is not just written in words — it is etched in the deepest chambers of our hearts, where fear cannot reach and time cannot fade."',
          funny: '"We met, we argued about the best pizza topping, we fell in love. It was that simple. Well, that and the fact that you laughed at my terrible jokes, tolerated my love for bad movies, and somehow still thought I was the best thing since sliced bread. Here we are, ready to spend forever together — or at least until one of us leaves the toilet seat up again."',
          christian: '"God brought us together in a beautiful tapestry of divine timing and unwavering faith. Our love is a reflection of His grace, a covenant built on prayer, trust, and shared belief. \'Therefore what God has joined together, let no one separate.\' We walk into marriage not as perfect people, but as a perfect match made in heaven, guided by His light every step of the way."',
          traditional: '"In a gathering of family, under the watchful eyes of our ancestors, we made a promise. Our love is woven into the fabric of our culture, strengthened by the blessings of our elders, and celebrated by the community that raised us. Together, we honor the traditions of the past while building a future that is uniquely our own — a love that speaks the language of home."',
          luxury: '"Ours is a love affair written in gold and illuminated by the finest moments life has to offer. From sunsets on distant shores to candlelit dinners under starlit skies, every chapter of our story is a masterpiece of elegance and passion. We have chosen each other not just as partners, but as the crowning jewels in each other\'s lives."'
        };
        textEl.textContent = stories[currentMood] || stories.romantic;
        textEl.classList.remove('generating');
        spinner.classList.remove('show');
      }, 1800);
    };

    window.regenerateStory = function() { generateLoveStory(); };
    window.editStory = function() {
      var newText = prompt('Edit your love story:', textEl.textContent);
      if (newText && newText.trim()) textEl.textContent = newText.trim();
    };
    window.saveStory = function() {
      try {
        localStorage.setItem('weddingLoveStory', textEl.textContent);
        if (window.showNotification) showNotification('Love story saved!', 'success');
      } catch(e) {
        if (window.showNotification) showNotification('Could not save story.', 'error');
      }
    };

    // Load saved story or generate default
    var saved = localStorage.getItem('weddingLoveStory');
    if (saved) {
      textEl.textContent = saved;
    } else {
      generateLoveStory();
    }
  }

  // ===== 5. INTERACTIVE MAP =====
  function initMap() {
    var addrBtn = document.getElementById('copyAddressBtn');
    if (addrBtn) {
      addrBtn.addEventListener('click', function() {
        var addr = document.getElementById('locAddress');
        if (!addr) return;
        var text = addr.textContent;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(function() {
            if (window.showNotification) showNotification('Address copied!', 'success');
          }).catch(function() { fallbackCopy(text); });
        } else { fallbackCopy(text); }
      });
    }
    function fallbackCopy(text) {
      var ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove();
      if (window.showNotification) showNotification('Address copied!', 'success');
    }
  }

  // ===== 6. QR CODE SHARING =====
  function initQRSharing() {
    var container = document.getElementById('shareQRContainer');
    if (!container) return;
    var url = encodeURIComponent(window.location.href);
    container.innerHTML =
      '<img src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=' + url + '" alt="QR Code" loading="lazy" style="border-radius:12px;">' +
      '<div class="qr-info"><p>Scan to share this wedding website</p><button onclick="copyLink();"><i class="fas fa-link"></i> Copy Link</button></div>';
  }

  // ===== 7. BACK TO TOP ===== (handled by floating-panel.js)

  // ===== 8. NEWSLETTER =====
  function initNewsletter() {
    var form = document.getElementById('newsletterForm');
    if (!form) return;
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var input = form.querySelector('input');
      var email = input && input.value.trim();
      if (!email) { if (window.showNotification) showNotification('Please enter your email.', 'warning'); return; }
      input.value = '';
      if (window.showNotification) showNotification('Thank you for subscribing! You\'ll hear from us soon.', 'success');
    });
  }

  // ===== 9. RSVP ENHANCEMENTS =====
  function initRSVPEnhance() {
    var mealOpts = document.querySelectorAll('.rsvp-meal-opt');
    mealOpts.forEach(function(opt) {
      opt.addEventListener('click', function() {
        mealOpts.forEach(function(o) { o.classList.remove('selected'); });
        opt.classList.add('selected');
      });
    });

    var photoInput = document.getElementById('rsvpPhotoInput');
    if (photoInput) {
      photoInput.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
          var label = document.querySelector('.upload-btn');
          if (label) label.textContent = 'Photo Added';
        }
      });
    }
  }

  // ===== 10. GUESTBOOK ENHANCEMENTS =====
  function initGuestbookEnhance() {
    var emojiContainer = document.querySelector('.guest-emoji-picker');
    if (emojiContainer) {
      emojiContainer.addEventListener('click', function(e) {
        var target = e.target;
        if (target.tagName === 'SPAN' && target.dataset.emoji) {
          var msgTextarea = document.getElementById('guestMessage');
          if (msgTextarea) {
            msgTextarea.value += target.dataset.emoji;
            msgTextarea.focus();
          }
        }
      });
    }
  }

  // ===== 11. AI WELCOME MESSAGE =====
  function initAIWelcome() {
    var banner = document.getElementById('aiWelcomeBanner');
    if (!banner) return;
    var wd = getWeddingData();
    var msgs = [
      'Welcome to our wedding journey! We\'re so excited to share this special day with you.',
      'Thank you for visiting our wedding website. Your presence means the world to us.',
      'We\'re counting down the days until we say "I do"! Explore our story and join the celebration.',
      'Love is in the air! Discover everything you need to know about our big day.'
    ];
    var msg = msgs[Math.floor(Math.random() * msgs.length)];
    banner.querySelector('.msg').textContent = msg;
    banner.classList.add('show');
  }

  // ===== HELPERS =====
  function getWeddingData() {
    try {
      var raw = localStorage.getItem('_fb_weddingInfo_main');
      if (raw) return JSON.parse(raw);
      raw = localStorage.getItem('weddingData');
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    return window.weddingData || {};
  }

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', function() {
    initQuickSidebar();
    initAIStory();
    initMap();
    initQRSharing();
    initNewsletter();
    initRSVPEnhance();
    initGuestbookEnhance();
    initAIWelcome();
  });
})();