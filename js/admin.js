let adminUser = null;
let unsubscribeGuests = null;
let unsubscribeMessages = null;
let eventsData = [];
let galleryData = [];

document.addEventListener('DOMContentLoaded', function() {
  var loginPage = document.getElementById('loginPage');
  var dashboard = document.getElementById('dashboard');
  if (loginPage) loginPage.style.display = 'none';
  if (dashboard) dashboard.classList.add('active');
  adminUser = { email: 'admin' };
  initDashboard();
});

function initDashboard() {
  loadWeddingDetails();
  loadGallery();
  loadEvents();
  loadSocial();
  setupRealtimeListeners();
  document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', function() {
      document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(x => x.classList.remove('active'));
      this.classList.add('active');
      document.getElementById(this.dataset.tab).classList.add('active');
    });
  });
  setupGalleryUpload();
}

function setupRealtimeListeners() {
  if (unsubscribeGuests) unsubscribeGuests();
  if (unsubscribeMessages) unsubscribeMessages();

  unsubscribeGuests = fbOnSnapshot('guests', (guests) => {
    updateStats(guests || []);
    renderRSVP(guests || []);
    renderRecentRSVPs(guests || []);
  });

  unsubscribeMessages = fbOnSnapshot('messages', (messages) => {
    renderMessages(messages || []);
  });
}

function updateStats(guests) {
  const total = guests.length;
  const confirmed = guests.filter(g => g.attendanceStatus === 'yes').length;
  const declined = guests.filter(g => g.attendanceStatus === 'no').length;
  document.getElementById('statTotal').textContent = total;
  document.getElementById('statConfirmed').textContent = confirmed;
  document.getElementById('statDeclined').textContent = declined;
  document.getElementById('statMessages').textContent = '...';
  document.getElementById('overviewText').innerHTML =
    `<strong>${total}</strong> total RSVPs · <strong>${confirmed}</strong> confirmed · <strong>${declined}</strong> declined`;
  fbGetCollection('messages').then(msgs => {
    if (msgs && msgs.length !== undefined) {
      document.getElementById('statMessages').textContent = msgs.length;
    }
  });
}

function loadWeddingDetails() {
  fbGetDoc('weddingInfo', 'main').then(d => {
    if (!d) return;
    document.getElementById('agGroom').value = d.groomName || '';
    document.getElementById('agBride').value = d.brideName || '';
    document.getElementById('agDate').value = d.weddingDate || '';
    document.getElementById('agTime').value = d.weddingTime || '';
    document.getElementById('agMotto').value = d.motto || '';
    document.getElementById('agDressCode').value = d.dressCode || '';
    document.getElementById('agColor').value = d.themeColor || '#C9A84C';
    document.getElementById('agCountry').value = d.country || '';
    document.getElementById('agState').value = d.state || '';
    document.getElementById('agCity').value = d.city || '';
    document.getElementById('agVenue').value = d.venue || '';
    document.getElementById('agAddress').value = d.address || '';
    document.getElementById('agGroomPhoto').value = d.groomPhoto || '';
    document.getElementById('agBridePhoto').value = d.bridePhoto || '';
    document.getElementById('agCoverPhoto').value = d.coverPhoto || '';
    document.getElementById('agMusic').value = d.musicUrl || '';
    document.getElementById('agStory').value = d.weddingStory || '';
  });
}

function saveWeddingDetails() {
  const data = {
    groomName: document.getElementById('agGroom').value.trim(),
    brideName: document.getElementById('agBride').value.trim(),
    weddingDate: document.getElementById('agDate').value,
    weddingTime: document.getElementById('agTime').value,
    motto: document.getElementById('agMotto').value.trim(),
    dressCode: document.getElementById('agDressCode').value.trim(),
    themeColor: document.getElementById('agColor').value,
    country: document.getElementById('agCountry').value.trim(),
    state: document.getElementById('agState').value.trim(),
    city: document.getElementById('agCity').value.trim(),
    venue: document.getElementById('agVenue').value.trim(),
    address: document.getElementById('agAddress').value.trim(),
    groomPhoto: document.getElementById('agGroomPhoto').value.trim(),
    bridePhoto: document.getElementById('agBridePhoto').value.trim(),
    coverPhoto: document.getElementById('agCoverPhoto').value.trim(),
    musicUrl: document.getElementById('agMusic').value.trim(),
    weddingStory: document.getElementById('agStory').value.trim()
  };
  fbSetDoc('weddingInfo', 'main', data).then(() => {
    showSaved('savedDetails');
  });
}

function setupGalleryUpload() {
  const area = document.getElementById('galleryDrop');
  const input = document.getElementById('galleryFile');
  area.addEventListener('click', () => input.click());
  input.addEventListener('change', (e) => {
    for (const file of e.target.files) {
      fbUploadFile('gallery/' + Date.now() + '_' + file.name, file).then(url => {
        galleryData.push({ imageUrl: url, uploadDate: new Date().toISOString(), createdAt: new Date().toISOString() });
        renderGalleryPreview();
      });
    }
    e.target.value = '';
  });
  area.addEventListener('dragover', e => { e.preventDefault(); area.style.borderColor = 'var(--gold)'; });
  area.addEventListener('dragleave', () => { area.style.borderColor = '#ddd'; });
  area.addEventListener('drop', e => {
    e.preventDefault(); area.style.borderColor = '#ddd';
    for (const file of e.dataTransfer.files) {
      if (!file.type.startsWith('image/')) continue;
      fbUploadFile('gallery/' + Date.now() + '_' + file.name, file).then(url => {
        galleryData.push({ imageUrl: url, uploadDate: new Date().toISOString(), createdAt: new Date().toISOString() });
        renderGalleryPreview();
      });
    }
  });
}

function loadGallery() {
  fbGetCollection('gallery').then(items => {
    galleryData = items || [];
    renderGalleryPreview();
  });
}

function renderGalleryPreview() {
  const container = document.getElementById('galleryPreview');
  if (!galleryData.length) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-images"></i>No photos yet</div>';
    return;
  }
  container.innerHTML = galleryData.map((item, i) =>
    `<div class="preview-item" draggable="true" data-idx="${i}">
      <img src="${item.imageUrl || item.url}" alt="Photo ${i+1}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/%3E%3C/svg%3E'">
      <button class="remove-btn" onclick="deleteGalleryItem(${i})">&times;</button>
      <div class="drag-handle"><i class="fas fa-grip-vertical"></i></div>
    </div>`
  ).join('');
}

function addGalleryUrl() {
  const url = document.getElementById('galleryUrlInput').value.trim();
  if (!url) return;
  galleryData.push({ imageUrl: url, uploadDate: new Date().toISOString(), createdAt: new Date().toISOString() });
  document.getElementById('galleryUrlInput').value = '';
  renderGalleryPreview();
}

function deleteGalleryItem(index) {
  const item = galleryData[index];
  galleryData.splice(index, 1);
  renderGalleryPreview();
  if (item.id) {
    fbDeleteDoc('gallery', item.id);
  } else {
    saveGalleryToFirebase();
  }
}

function saveGallery() {
  saveGalleryToFirebase().then(() => showSaved('savedGallery'));
}

async function saveGalleryToFirebase() {
  for (const item of galleryData) {
    if (!item.id) {
      await fbAddDoc('gallery', item);
    } else {
      await fbSetDoc('gallery', item.id, item);
    }
  }
  loadGallery();
}

function loadEvents() {
  fbGetCollection('events').then(items => {
    eventsData = items && items.length ? items : [
      { eventName: 'Wedding Ceremony', eventDate: '', eventTime: '', eventVenue: '', description: '' },
      { eventName: 'Reception', eventDate: '', eventTime: '', eventVenue: '', description: '' }
    ];
    renderEvents();
  });
}

function renderEvents() {
  const container = document.getElementById('eventsContainer');
  container.innerHTML = eventsData.map((ev, i) => `
    <div class="event-card-admin">
      <button class="btn danger small remove-event" onclick="removeEvent(${i})"><i class="fas fa-times"></i></button>
      <h4>Event ${i+1}</h4>
      <div class="form-row">
        <div class="form-group"><label>Name</label><input type="text" class="ev-name" value="${escAttr(ev.eventName||'')}"></div>
        <div class="form-group"><label>Date</label><input type="date" class="ev-date" value="${ev.eventDate||''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Time</label><input type="time" class="ev-time" value="${ev.eventTime||''}"></div>
        <div class="form-group"><label>Venue</label><input type="text" class="ev-venue" value="${escAttr(ev.eventVenue||'')}"></div>
      </div>
      <div class="form-group"><label>Description</label><input type="text" class="ev-desc" value="${escAttr(ev.description||'')}"></div>
    </div>
  `).join('');
}

function addEvent() {
  eventsData.push({ eventName: '', eventDate: '', eventTime: '', eventVenue: '', description: '', createdAt: new Date().toISOString() });
  renderEvents();
}

function removeEvent(index) {
  const ev = eventsData[index];
  eventsData.splice(index, 1);
  renderEvents();
  if (ev.id) fbDeleteDoc('events', ev.id);
}

async function saveEvents() {
  const cards = document.querySelectorAll('#eventsContainer .event-card-admin');
  cards.forEach((card, i) => {
    if (eventsData[i]) {
      eventsData[i].eventName = card.querySelector('.ev-name').value;
      eventsData[i].eventDate = card.querySelector('.ev-date').value;
      eventsData[i].eventTime = card.querySelector('.ev-time').value;
      eventsData[i].eventVenue = card.querySelector('.ev-venue').value;
      eventsData[i].eventDescription = card.querySelector('.ev-desc').value;
    }
  });
  for (const ev of eventsData) {
    if (ev.id) {
      await fbSetDoc('events', ev.id, ev);
    } else {
      const res = await fbAddDoc('events', ev);
      ev.id = res.id;
    }
  }
  showSaved('savedEvents');
}

function renderRSVP(guests) {
  if (!guests) return;
  const search = (document.getElementById('rsvpSearch').value || '').toLowerCase();
  let filtered = guests;
  if (search) {
    filtered = guests.filter(g =>
      (g.fullName || '').toLowerCase().includes(search) ||
      (g.email || '').toLowerCase().includes(search)
    );
  }
  document.getElementById('rsvpCount').textContent = `(${filtered.length} shown of ${guests.length})`;
  const tbody = document.getElementById('rsvpBody');
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#999;">No responses</td></tr>';
    return;
  }
  tbody.innerHTML = filtered.map(g => `
    <tr>
      <td><strong>${escHtml(g.fullName||'')}</strong></td>
      <td>${escHtml(g.email||'-')}</td>
      <td>${escHtml(g.phone||'-')}</td>
      <td>${g.guestCount||1}</td>
      <td>${g.mealPreference||'-'}</td>
      <td style="color:${g.attendanceStatus==='yes'?'#27ae60':'#e74c3c'};font-weight:600;">${g.attendanceStatus==='yes'?'Yes':'No'}</td>
      <td style="font-size:0.8rem;color:#999;">${g.createdAt?new Date(g.createdAt).toLocaleDateString():'-'}</td>
    </tr>
  `).join('');
}

function renderRecentRSVPs(guests) {
  const container = document.getElementById('recentRSVPs');
  const recent = (guests || []).slice(0, 5);
  if (!recent.length) { container.innerHTML = '<p style="color:var(--text-light);">No RSVPs yet</p>'; return; }
  container.innerHTML = recent.map(g => `
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;">
      <span><strong>${escHtml(g.fullName||'')}</strong> <span style="color:var(--text-light);font-size:0.8rem;">(${g.guestCount||1} guest${g.guestCount>1?'s':''})</span></span>
      <span style="color:${g.attendanceStatus==='yes'?'#27ae60':'#e74c3c'};font-weight:600;">${g.attendanceStatus==='yes'?'Yes':'No'}</span>
    </div>
  `).join('');
}

function exportCSV() {
  let guests = [];
  fbGetCollection('guests').then(list => {
    guests = list || [];
    if (!guests.length) { alert('No data to export'); return; }
    let csv = 'Name,Email,Phone,Guests,Meal,Attending,Date\n';
    guests.forEach(g => {
      csv += `"${g.fullName||''}","${g.email||''}","${g.phone||''}",${g.guestCount||1},"${g.mealPreference||''}","${g.attendanceStatus||''}","${g.createdAt||''}"\n`;
    });
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'rsvp-list.csv'; a.click();
    URL.revokeObjectURL(url);
  });
}

function printRSVPs() {
  fbGetCollection('guests').then(list => {
    const guests = list || [];
    if (!guests.length) { alert('No data to print'); return; }
    const w = window.open('','_blank');
    w.document.write(`<html><head><title>RSVP List</title><style>body{font-family:Arial,sans-serif;padding:20px;}table{width:100%;border-collapse:collapse;}th,td{padding:8px 12px;border:1px solid #ddd;text-align:left;}th{background:#C9A84C;color:#fff;}h1{color:#C9A84C;}</style></head><body><h1>RSVP List</h1><table><tr><th>Name</th><th>Email</th><th>Phone</th><th>Guests</th><th>Meal</th><th>Attending</th></tr>`);
    guests.forEach(g => { w.document.write(`<tr><td>${escHtml(g.fullName||'')}</td><td>${escHtml(g.email||'-')}</td><td>${escHtml(g.phone||'-')}</td><td>${g.guestCount||1}</td><td>${g.mealPreference||'-'}</td><td>${g.attendanceStatus==='yes'?'Yes':'No'}</td></tr>`); });
    w.document.write('</table></body></html>');
    w.document.close();
    w.print();
  });
}

function renderMessages(messages) {
  const container = document.getElementById('messagesContainer');
  if (!messages || !messages.length) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-comment"></i>No messages yet</div>';
    return;
  }
  container.innerHTML = messages.slice().reverse().map(m =>
    `<div class="msg-item">
      <div class="msg-name">${escHtml(m.guestName||'Anonymous')}</div>
      <div class="msg-date">${m.createdAt?new Date(m.createdAt).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'}):''}</div>
      <div class="msg-text">${escHtml(m.message||'')}</div>
      ${m.id ? `<button class="btn danger small" onclick="deleteMessage('${m.id}')" style="margin-top:8px;"><i class="fas fa-trash"></i> Delete</button>` : ''}
    </div>`
  ).join('');
}

function deleteMessage(id) {
  if (!confirm('Delete this message?')) return;
  fbDeleteDoc('messages', id);
}

function deleteAllMessages() {
  if (!confirm('Delete ALL messages? This cannot be undone.')) return;
  fbGetCollection('messages').then(msgs => {
    (msgs || []).forEach(m => {
      if (m.id) fbDeleteDoc('messages', m.id);
    });
  });
}

function loadSocial() {
  fbGetDoc('socialLinks', 'main').then(d => {
    if (!d) return;
    document.getElementById('asWhatsapp').value = d.whatsapp || '';
    document.getElementById('asFacebook').value = d.facebook || '';
    document.getElementById('asInstagram').value = d.instagram || '';
    document.getElementById('asTwitter').value = d.twitter || '';
    document.getElementById('asTelegram').value = d.telegram || '';
    document.getElementById('asYoutube').value = d.youtube || '';
    document.getElementById('asTiktok').value = d.tiktok || '';
    document.getElementById('asMessenger').value = d.messenger || '';
  });
}

function saveSocial() {
  const data = {
    whatsapp: document.getElementById('asWhatsapp').value.trim(),
    facebook: document.getElementById('asFacebook').value.trim(),
    instagram: document.getElementById('asInstagram').value.trim(),
    twitter: document.getElementById('asTwitter').value.trim(),
    telegram: document.getElementById('asTelegram').value.trim(),
    youtube: document.getElementById('asYoutube').value.trim(),
    tiktok: document.getElementById('asTiktok').value.trim(),
    messenger: document.getElementById('asMessenger').value.trim()
  };
  fbSetDoc('socialLinks', 'main', data).then(() => showSaved('savedSocial'));
}

function showSaved(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function escAttr(s) { return (s || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

document.addEventListener('DOMContentLoaded', () => {});
