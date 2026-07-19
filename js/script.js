let weddingData = {};
let galleryImages = [];
let guestMessages = [];
let currentLightboxIndex = 0;
let countdownInterval = null;
let dataLoaded = false;

function $(id) { return document.getElementById(id); }

function setTxt(id, val) { var el = $(id); if (el) el.textContent = val; }
function setAttr(id, attr, val) { var el = $(id); if (el) el.setAttribute(attr, val); }
function setHtml(id, val) { var el = $(id); if (el) el.innerHTML = val; }
function setSrc(id, val) { var el = $(id); if (el) el.src = val; }
function setDisplay(id, val) { var el = $(id); if (el) el.style.display = val; }

document.addEventListener('DOMContentLoaded', function() {
  loadFromFirebase();
  initUI();
  (function(){var p=localStorage.getItem('weddingPalette');if(p)document.documentElement.setAttribute('data-palette',p);})();
});

async function loadFromFirebase() {
  // First check localStorage (fastest, always available)
  const local = localStorage.getItem('weddingData');
  if (local) {
    try { weddingData = JSON.parse(local); } catch(e) {}
    dataLoaded = !!(weddingData.groomName || weddingData.groom);
    if (dataLoaded) {
      // Normalize field names from setup wizard (groom -> groomName, etc.)
      if (weddingData.groom && !weddingData.groomName) weddingData.groomName = weddingData.groom;
      if (weddingData.bride && !weddingData.brideName) weddingData.brideName = weddingData.bride;
      if (weddingData.date && !weddingData.weddingDate) weddingData.weddingDate = weddingData.date;
      if (weddingData.time && !weddingData.weddingTime) weddingData.weddingTime = weddingData.time;
    }
  }

  // Try Firebase in background (updates data if available)
  try {
    const info = await fbGetDoc('weddingInfo', 'main');
    if (info && info.groomName) {
      weddingData = info;
      dataLoaded = true;
      localStorage.setItem('weddingData', JSON.stringify(info));
    }
  } catch(e) {}

  if (!dataLoaded) {
    setHtml('heroContent', '<div style="padding:40px;"><h2 style="color:var(--gold);font-size:2rem;margin-bottom:15px;">Welcome!</h2><p style="color:var(--gold-light);margin-bottom:25px;">This wedding website hasn\'t been set up yet.</p><a href="setup.html" style="display:inline-block;padding:14px 36px;background:var(--gold);color:#fff;border-radius:50px;font-family:Inter,sans-serif;font-weight:600;text-transform:uppercase;letter-spacing:2px;font-size:0.85rem;">Set Up Wedding Website</a></div>');
    return;
  }

  try {
    const gal = await fbGetCollection('gallery');
    galleryImages = (gal || []).map(g => g.imageUrl || g.url).filter(Boolean);
    if (!galleryImages.length) {
      galleryImages = weddingData.gallery || [];
    }
  } catch { galleryImages = weddingData.gallery || []; }

  try {
    const msgs = await fbGetCollection('messages');
    guestMessages = (msgs || []).map(m => ({
      id: m.id,
      name: m.guestName || 'Anonymous',
      message: m.message || '',
      date: m.createdAt || new Date().toISOString()
    }));
    if (!guestMessages.length) {
      const legacy = localStorage.getItem('weddingMessages');
      if (legacy) guestMessages = JSON.parse(legacy);
    }
  } catch {
    const legacy = localStorage.getItem('weddingMessages');
    if (legacy) guestMessages = JSON.parse(legacy);
  }

  renderEverything();
  startCountdown();
}

function renderEverything() {
  const d = weddingData;
  const title = `${d.groomName || 'Groom'} \u2764\uFE0F ${d.brideName || 'Bride'}`;
  document.title = title;
  setTxt('pageTitle', title);
  setAttr('ogTitle', 'content', title);
  setAttr('twTitle', 'content', title);
  const desc = `Join us for the wedding of ${d.groomName || ''} & ${d.brideName || ''}!`;
  setAttr('metaDesc', 'content', desc);
  setAttr('ogDesc', 'content', desc);
  setAttr('twDesc', 'content', desc);
  if (d.coverPhoto) {
    setAttr('ogImage', 'content', d.coverPhoto);
    setAttr('twImage', 'content', d.coverPhoto);
  }

  setHtml('navLogo', `${d.groomName || 'Groom'} <span class="heart">&#10084;</span> ${d.brideName || 'Bride'}`);

  // === HERO SECTION ===
  setTxt('heroGroom', d.groomName || 'Groom');
  setTxt('heroBride', d.brideName || 'Bride');

  // Hero Info Card
  const wDate = d.weddingDate ? new Date(d.weddingDate + 'T' + (d.weddingTime || '16:00')) : null;
  if (wDate) {
    setTxt('heroInfoDate', wDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  }
  if (d.weddingTime) {
    const parts = d.weddingTime.split(':');
    const h = parseInt(parts[0]);
    const m = parts[1] || '00';
    setTxt('heroInfoTime', (h % 12 || 12) + ':' + m + (h >= 12 ? ' PM' : ' AM'));
  }
  setTxt('heroInfoVenue', d.venue || 'Venue TBD');
  const loc = [d.city, d.state, d.country].filter(Boolean).join(', ');
  setTxt('heroInfoLocation', loc || 'City, Country');

  // Background image from cover photo
  if (d.coverPhoto) {
    const heroBg = document.querySelector('.hero-bg');
    if (heroBg) {
      heroBg.style.backgroundImage = 'url(' + d.coverPhoto + ')';
      heroBg.classList.add('active');
    }
  }

  // Publish status - show/hide draft card and RSVP button
  const draftCard = document.getElementById('heroDraftCard');
  const btnRSVP = document.getElementById('btnRSVP');
  if (d.isPublished) {
    if (draftCard) draftCard.style.display = 'none';
    if (btnRSVP) btnRSVP.style.display = 'inline-flex';
  } else {
    if (draftCard) draftCard.style.display = 'block';
    if (btnRSVP) btnRSVP.style.display = 'none';
  }

  // === COUPLE SECTION ===
  setTxt('groomName', d.groomName || 'Groom');
  setTxt('brideName', d.brideName || 'Bride');
  setTxt('groomBio', d.groomBio || d.groomName || '');
  setTxt('brideBio', d.brideBio || d.brideName || '');
  if (d.groomPhoto) {
    setSrc('groomPhoto', d.groomPhoto);
    setDisplay('groomPhoto', 'block');
    setDisplay('groomPhotoPlaceholder', 'none');
  }
  if (d.bridePhoto) {
    setSrc('bridePhoto', d.bridePhoto);
    setDisplay('bridePhoto', 'block');
    setDisplay('bridePhotoPlaceholder', 'none');
  }

  // === STORY SECTION — hide if no story ===
  var storySection = document.getElementById('aiStory');
  if (storySection) {
    if (d.weddingStory) {
      storySection.style.display = '';
      var storyEl = $('storyTimeline');
      if (storyEl) {
        storyEl.innerHTML = '<div class="story-item"><div class="story-date">Our Story</div><div class="story-content"><div class="story-img-placeholder"><i class="fas fa-heart"></i></div><h3>' + escHtml(d.storyTitle || 'How We Met') + '</h3><p>' + escHtml(d.weddingStory) + '</p></div></div>';
      }
    } else {
      storySection.style.display = 'none';
    }
  }

  // === EVENTS SECTION — hide if no events ===
  var eventsSection = document.getElementById('events');
  if (eventsSection) {
    // loadEvents will check and hide if empty
    loadEvents(d);
  }

  // === GALLERY SECTION — hide if no images ===
  var gallerySection = document.getElementById('gallery');
  if (gallerySection) {
    if (galleryImages && galleryImages.length) {
      gallerySection.style.display = '';
      renderGallery();
    } else {
      gallerySection.style.display = 'none';
    }
  }

  // === GIFT SECTION — hide if no gift info ===
  var giftSection = document.getElementById('gift');
  var hasGifts = d.bankName || d.bankNumber || d.registryLink || d.paypal || d.cashapp;
  if (giftSection) {
    if (hasGifts) {
      giftSection.style.display = '';
      renderGifts(d);
    } else {
      giftSection.style.display = 'none';
    }
  }

  // === SHARE/SOCIAL SECTION — hide if no social links ===
  renderSocialLinks();

  setHtml('footerNames', `${d.groomName || 'Groom'} <span class="heart">&#10084;</span> ${d.brideName || 'Bride'}`);
  setTxt('footerYear', new Date().getFullYear());
  if (d.musicUrl) {
    setSrc('weddingSong', d.musicUrl);
    setDisplay('musicPlayer', 'block');
  }

  setTxt('locVenue', d.venue || 'Venue');
  setTxt('locAddress', d.address || '');
  setTxt('locCity', d.city || '');
  setTxt('locState', d.state || '');
  setTxt('locCountry', d.country || '');
  updateMap(d);
}

async function loadEvents(d) {
  const grid = $('eventsGrid');
  const section = document.getElementById('events');
  if (!grid) return;
  try {
    const events = await fbGetCollection('events');
    if (events && events.length && events.some(e => e.eventName)) {
      if (section) section.style.display = '';
      const icons = ['fa-church','fa-glass-cheers','fa-ring','fa-heart','fa-music','fa-calendar-day'];
      grid.innerHTML = events.map((e, i) => `
        <div class="event-card">
          <div class="event-icon"><i class="fas ${icons[i % icons.length]}"></i></div>
          <div class="event-date">${e.eventDate ? new Date(e.eventDate).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}) : ''}</div>
          <div class="event-time">${e.eventTime ? formatTime(e.eventTime) : ''}</div>
          <h3>${escHtml(e.eventName)}</h3>
          ${e.eventVenue ? `<div class="event-venue"><i class="fas fa-map-marker-alt" style="color:var(--gold);"></i> ${escHtml(e.eventVenue)}</div>` : ''}
          ${e.description ? `<div class="event-desc">${escHtml(e.description)}</div>` : ''}
        </div>
      `).join('');
      return;
    }
  } catch {}
  if (section) { section.style.display = 'none'; return; }
  grid.innerHTML = '<div class="events-empty">Event schedule coming soon...</div>';
}

function renderGallery() {
  const grid = $('galleryGrid');
  if (!grid) return;
  if (!galleryImages || !galleryImages.length) {
    grid.innerHTML = '<div class="empty-gallery-msg"><i class="fas fa-images"></i> Gallery coming soon...</div>';
    return;
  }
  grid.innerHTML = galleryImages.map((img, i) => `
    <div class="gallery-item" onclick="openLightbox(${i})">
      <img src="${img}" alt="Gallery ${i+1}" loading="lazy">
      <div class="overlay"><span><i class="fas fa-search-plus"></i></span></div>
    </div>
  `).join('');
}

function openLightbox(index) {
  if (!galleryImages.length) return;
  currentLightboxIndex = index;
  var lb = $('lightbox');
  if (lb) lb.classList.add('active');
  setSrc('lightboxImg', galleryImages[index]);
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  var lb = $('lightbox');
  if (lb) lb.classList.remove('active');
  document.body.style.overflow = '';
}

function changeLightbox(dir) {
  currentLightboxIndex = (currentLightboxIndex + dir + galleryImages.length) % galleryImages.length;
  setSrc('lightboxImg', galleryImages[currentLightboxIndex]);
}

function renderGifts(d) {
  const grid = $('giftGrid');
  if (!grid) return;
  let html = '';
  if (d.bankName && d.bankNumber) {
    html += `<div class="gift-card"><div class="gift-icon"><i class="fas fa-university"></i></div><h3>Bank Transfer</h3><p>${escHtml(d.bankName)}</p><div class="bank-detail">Account: ${escHtml(d.bankNumber)}</div></div>`;
  }
  if (d.registryLink) {
    html += `<div class="gift-card"><div class="gift-icon"><i class="fas fa-gift"></i></div><h3>Gift Registry</h3><a href="${d.registryLink}" target="_blank" class="gift-link">View Registry</a></div>`;
  }
  if (d.paypal) {
    html += `<div class="gift-card"><div class="gift-icon"><i class="fab fa-paypal"></i></div><h3>PayPal</h3><a href="${d.paypal}" target="_blank" class="gift-link">Send Gift</a></div>`;
  }
  if (d.cashapp) {
    html += `<div class="gift-card"><div class="gift-icon"><i class="fas fa-money-bill"></i></div><h3>CashApp</h3><a href="${d.cashapp}" target="_blank" class="gift-link">Send Gift</a></div>`;
  }
  grid.innerHTML = html || '<div class="gift-empty">Your presence is the greatest gift.</div>';
}

function renderSocialLinks() {
  const container = $('socialLinks');
  if (!container) return;
  const socials = [
    { key:'whatsapp', color:'#25D366', icon:'fab fa-whatsapp' },
    { key:'facebook', color:'#1877F2', icon:'fab fa-facebook-f' },
    { key:'instagram', color:'#E1306C', icon:'fab fa-instagram' },
    { key:'twitter', color:'#1DA1F2', icon:'fab fa-x-twitter' },
    { key:'telegram', color:'#0088CC', icon:'fab fa-telegram-plane' },
    { key:'youtube', color:'#FF0000', icon:'fab fa-youtube' },
    { key:'tiktok', color:'#000', icon:'fab fa-tiktok' },
    { key:'messenger', color:'#006AFF', icon:'fab fa-facebook-messenger' }
  ];
  var section = document.getElementById('contact');
  fbGetDoc('socialLinks', 'main').then(social => {
    const s = social || {};
    var links = socials
      .filter(soc => s[soc.key] || weddingData[soc.key])
      .map(soc => {
        const url = s[soc.key] || weddingData[soc.key];
        return '<a href="' + url + '" target="_blank" class="social-link" style="background:' + soc.color + ';" title="' + soc.key + '"><i class="' + soc.icon + '"></i></a>';
      })
      .join('');
    if (links) {
      container.innerHTML = links;
      if (section) section.style.display = '';
    } else {
      if (section) section.style.display = 'none';
    }
  }).catch(() => {
    if (section) section.style.display = 'none';
  });
}

function updateMap(d) {
  const q = encodeURIComponent(`${d.venue||''}, ${d.address||''}, ${d.city||''}, ${d.state||''}, ${d.country||''}`);
  const mapFrame = $('mapFrame');
  const fallback = $('mapFallback');
  if (!mapFrame || !fallback) return;
  if (!q.trim()) { fallback.innerHTML = '<i class="fas fa-map-marked-alt"></i><p>Location not set</p>'; return; }
  mapFrame.src = `https://www.google.com/maps?q=${q}&output=embed`;
  mapFrame.onload = function() { mapFrame.style.display = 'block'; fallback.style.display = 'none'; };
  mapFrame.onerror = function() {
    fallback.innerHTML = `<i class="fas fa-map-marked-alt"></i><p><a href="https://www.google.com/maps/search/${q}" target="_blank" style="color:var(--gold);">Open in Google Maps</a></p>`;
  };
}

function getDirections() {
  const d = weddingData;
  const q = encodeURIComponent(`${d.venue||''}, ${d.address||''}, ${d.city||''}, ${d.state||''}`);
  window.open(`https://www.google.com/maps/search/${q}`, '_blank');
}

async function submitGuestMessage() {
  const nameEl = $('guestName');
  const msgEl = $('guestMessage');
  const name = (nameEl ? nameEl.value.trim() : '') || 'Anonymous';
  const message = msgEl ? msgEl.value.trim() : '';
  if (!message) { alert('Please write a message.'); return; }
  try { await fbAddDoc('messages', { guestName: name, message: message }); } catch {}
  if (nameEl) nameEl.value = '';
  if (msgEl) msgEl.value = '';
  try {
    const msgs = await fbGetCollection('messages');
    guestMessages = (msgs || []).map(m => ({
      id: m.id, name: m.guestName || 'Anonymous',
      message: m.message || '', date: m.createdAt || new Date().toISOString()
    }));
  } catch {}
  renderGuestMessages();
}

function renderGuestMessages() {
  const container = $('guestMessages');
  if (!container) return;
  if (!guestMessages.length) {
    container.innerHTML = '<div class="guest-empty">No messages yet. Be the first to leave a blessing!</div>';
    return;
  }
  container.innerHTML = guestMessages.slice().reverse().map(msg => `
    <div class="guest-message">
      <div class="name">${escHtml(msg.name)}</div>
      <div class="date">${new Date(msg.date).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</div>
      <div class="message">${escHtml(msg.message)}</div>
    </div>
  `).join('');
}

function startCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);
  const d = weddingData;
  if (!d || !d.weddingDate) {
    setTxt('countdownMsg', 'Save the Date');
    return;
  }
  const wedding = new Date(d.weddingDate + 'T' + (d.weddingTime || '16:00'));
  function tick() {
    const now = new Date();
    const diff = wedding - now;
    if (diff <= 0) {
      setTxt('days', '00');
      setTxt('hours', '00');
      setTxt('minutes', '00');
      setTxt('seconds', '00');
      setTxt('countdownMsg', 'Today is the day!');
      clearInterval(countdownInterval);
      return;
    }
    const days = Math.floor(diff / (1000*60*60*24));
    const hours = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
    const mins = Math.floor((diff % (1000*60*60)) / (1000*60));
    const secs = Math.floor((diff % (1000*60)) / 1000);
    setTxt('days', String(days).padStart(2,'0'));
    setTxt('hours', String(hours).padStart(2,'0'));
    setTxt('minutes', String(mins).padStart(2,'0'));
    setTxt('seconds', String(secs).padStart(2,'0'));
    setTxt('countdownMsg', 'Counting down to our special day');
  }
  tick();
  countdownInterval = setInterval(tick, 1000);
}

function toggleMusic() {
  const audio = $('weddingSong');
  const btn = $('musicBtn');
  if (!audio || !btn) return;
  if (!audio.src) return;
  if (audio.paused) {
    audio.play().catch(() => {});
    btn.classList.add('playing');
    btn.innerHTML = '<i class="fas fa-pause"></i>';
  } else {
    audio.pause();
    btn.classList.remove('playing');
    btn.innerHTML = '<i class="fas fa-music"></i>';
  }
}

function shareTo(platform) {
  const d = weddingData;
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent(
    `You are warmly invited to celebrate the wedding of ${d.groomName || 'Groom'} and ${d.brideName || 'Bride'}!`
  );
  const shareUrl = {
    whatsapp: `https://wa.me/?text=${text}%20${url}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    telegram: `https://t.me/share/url?url=${url}&text=${text}`,
    email: `mailto:?subject=${encodeURIComponent('Wedding Invitation')}&body=${text}%20${url}`
  }[platform];
  if (shareUrl) window.open(shareUrl, '_blank', 'noopener');
}

function emailInvitation() {
  const d = weddingData;
  const subject = encodeURIComponent('Wedding Invitation');
  const body = encodeURIComponent(
    `You are invited to celebrate the wedding of ${d.groomName || 'Groom'} and ${d.brideName || 'Bride'} on ${d.weddingDate || 'our wedding day'} at ${d.venue || 'the venue'}.\n\nWe look forward to celebrating with you!\n\n${window.location.href}`
  );
  window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
}

function copyLink() {
  const d = weddingData;
  const text = `You are warmly invited to celebrate the wedding of ${d.groomName || 'Groom'} and ${d.brideName || 'Bride'}. ${window.location.href}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      var btn = document.querySelector('.share-btn.copy');
      if (btn) {
        var orig = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => btn.innerHTML = orig, 2000);
      }
    }).catch(() => alert('Copy: ' + window.location.href));
  } else {
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    alert('Link copied!');
  }
}

function initUI() {
  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-zoom').forEach(function(el) { obs.observe(el); });

  var ham = $('hamburger');
  var navLinks = $('navLinks');
  if (ham && navLinks) {
    ham.addEventListener('click', function() { ham.classList.toggle('active'); navLinks.classList.toggle('open'); });
    document.querySelectorAll('.nav-links a').forEach(function(l) { l.addEventListener('click', function() {
      ham.classList.remove('active'); navLinks.classList.remove('open');
    }); });
  }
  function setActiveNav() {
    var path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links > li > a').forEach(function(a) {
      var href = a.getAttribute('href');
      if (href === path) { a.classList.add('active'); }
    });
    document.querySelectorAll('.nav-dropdown a').forEach(function(a) {
      var href = a.getAttribute('href');
      if (href === path) { var nm = a.closest('.nav-more'); if (nm) { var t = nm.querySelector('.nav-more-toggle'); if (t) t.classList.add('active'); } }
    });
  }
  setActiveNav();

  document.addEventListener('keydown', function(e) {
    var lb = $('lightbox');
    if (!lb || !lb.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') changeLightbox(-1);
    if (e.key === 'ArrowRight') changeLightbox(1);
  });
}

function formatTime(t) {
  if (!t) return '';
  var parts = t.split(':');
  var hour = parseInt(parts[0]);
  var min = parts[1] || '00';
  return (hour % 12 || 12) + ':' + min + (hour >= 12 ? ' PM' : ' AM');
}

function escHtml(s) {
  if (!s) return '';
  var d = document.createElement('div');
  d.textContent = String(s);
  return d.innerHTML;
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('sw.js').catch(function() {});
  });
}

/* ===== WELCOME CARD ===== */
function renderWelcomeCard() {
  var section = document.getElementById('welcomeCardSection');
  var guestSection = document.getElementById('guestCtaSection');
  if (!section || !guestSection) return;

  var session = null;
  try { session = (typeof getSession === 'function') ? getSession() : null; } catch(e) {}

  if (!session) {
    section.style.display = 'none';
    guestSection.style.display = '';
    return;
  }

  section.style.display = '';
  guestSection.style.display = 'none';

  var initial = (session.name || 'U').charAt(0).toUpperCase();
  var avatarEl = document.getElementById('welcomeAvatar');
  if (avatarEl) {
    var profile = null;
    try { profile = (typeof getUserProfile === 'function') ? getUserProfile() : null; } catch(e) {}
    if (profile && profile.photo) {
      avatarEl.innerHTML = '<img src="' + profile.photo + '" alt="Profile">';
    } else {
      avatarEl.textContent = initial;
    }
  }

  var firstName = (session.name || 'User').split(' ')[0];
  setTxt('welcomeGreeting', 'Welcome back, ' + firstName + '!');
  setTxt('welcomeName', session.name || 'User');
  setTxt('welcomeEmail', session.email || '');

  var wd = {};
  try { wd = JSON.parse(localStorage.getItem('weddingData') || '{}'); } catch(e) {}
  var statusEl = document.getElementById('welcomeStatus');
  if (statusEl) {
    if (wd.isPublished) {
      statusEl.textContent = 'Published';
      statusEl.className = 'welcome-badge welcome-badge-status published';
    } else {
      statusEl.textContent = 'Draft';
      statusEl.className = 'welcome-badge welcome-badge-status draft';
    }
  }
}

function toggleWelcomeDropdown() {
  var dd = document.getElementById('welcomeDropdown');
  var card = document.querySelector('.welcome-card-inner');
  if (dd) {
    dd.classList.toggle('open');
    if (card) card.classList.toggle('welcome-dropdown-open');
  }
}

document.addEventListener('click', function(e) {
  var card = document.querySelector('.welcome-card-inner');
  if (card && !card.contains(e.target)) {
    var dd = document.getElementById('welcomeDropdown');
    if (dd) dd.classList.remove('open');
    card.classList.remove('welcome-dropdown-open');
  }
});

/* ===== LOGOUT CONFIRMATION ===== */
function showLogoutConfirm() {
  var overlay = document.getElementById('logoutConfirmOverlay');
  if (overlay) {
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    var cancelBtn = overlay.querySelector('.logout-confirm-cancel');
    if (cancelBtn) cancelBtn.focus();
  }
}

function hideLogoutConfirm() {
  var overlay = document.getElementById('logoutConfirmOverlay');
  if (overlay) {
    overlay.style.display = 'none';
    document.body.style.overflow = '';
  }
}

function confirmLogout() {
  hideLogoutConfirm();
  try {
    localStorage.removeItem('weddingAuthSession');
    localStorage.removeItem('weddingAuthUser');
    localStorage.removeItem('weddingUserProfile');
    localStorage.removeItem('weddingAuthRemember');
    localStorage.removeItem('weddingRememberEmail');
    localStorage.removeItem('weddingRememberPassword');
  } catch(e) {}
  try {
    sessionStorage.clear();
  } catch(e) {}
  window.location.href = 'index.html';
  setTimeout(function() {
    if (typeof showNotification === 'function') {
      showNotification('You have been logged out successfully.', 'success');
    }
  }, 400);
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    var overlay = document.getElementById('logoutConfirmOverlay');
    if (overlay && overlay.style.display === 'flex') {
      hideLogoutConfirm();
    }
  }
});

document.addEventListener('DOMContentLoaded', function() {
  renderWelcomeCard();
});
