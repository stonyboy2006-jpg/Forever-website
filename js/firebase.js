/* FIREBASE_CONFIG is loaded from js/firebase-config.js (must be included before this file) */

const COLLECTIONS = {
  weddingInfo: 'weddingInfo',
  gallery: 'gallery',
  events: 'events',
  guests: 'guests',
  messages: 'messages',
  socialLinks: 'socialLinks',
  users: 'users',
  rsvps: 'rsvps',
  gifts: 'gifts',
  analytics: 'analytics',
  notifications: 'notifications',
  invitations: 'invitations',
  shareHistory: 'shareHistory',
  backups: 'backups'
};

let fb = { app: null, db: null, storage: null, ready: false, initPromise: null };

async function initFirebase() {
  if (fb.ready) return true;
  if (fb.initPromise) return fb.initPromise;
  if (typeof firebase === 'undefined') { return false; }
  if (FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY') { return false; }
  fb.initPromise = (async () => {
    try {
      if (!firebase.apps.length) {
        fb.app = firebase.initializeApp(FIREBASE_CONFIG);
      } else {
        fb.app = firebase.app();
      }
      fb.db = firebase.firestore();
      fb.storage = firebase.storage();
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        try { fb.db.settings({ host: 'localhost:8080', ssl: false }); } catch {}
      }
      fb.ready = true;
      return true;
    } catch (e) {
      console.warn('Firebase init failed:', e.message);
      return false;
    }
  })();
  return fb.initPromise;
}

async function fbGetDoc(collection, docId) {
  await initFirebase();
  if (!fb.ready) { return localGet(collection, docId); }
  try {
    const doc = await fb.db.collection(collection).doc(docId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  } catch { return localGet(collection, docId); }
}

async function fbGetCollection(collection) {
  await initFirebase();
  if (!fb.ready) { return localGetAll(collection); }
  try {
    const snap = await fb.db.collection(collection).orderBy('createdAt', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch { return localGetAll(collection); }
}

async function fbSetDoc(collection, docId, data) {
  await initFirebase();
  const payload = { ...data, updatedAt: new Date().toISOString() };
  if (!payload.createdAt) payload.createdAt = payload.updatedAt;
  if (!fb.ready) { localSet(collection, docId, payload); return { success: true, local: true }; }
  try {
    await fb.db.collection(collection).doc(docId).set(payload, { merge: true });
    return { success: true, id: docId };
  } catch (e) {
    localSet(collection, docId, payload);
    return { success: true, local: true };
  }
}

async function fbAddDoc(collection, data) {
  await initFirebase();
  const payload = { ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  if (!fb.ready) {
    const id = 'local_' + Date.now();
    localSet(collection, id, payload);
    return { success: true, id, local: true };
  }
  try {
    const ref = await fb.db.collection(collection).add(payload);
    return { success: true, id: ref.id };
  } catch (e) {
    const id = 'local_' + Date.now();
    localSet(collection, id, payload);
    return { success: true, id, local: true };
  }
}

async function fbDeleteDoc(collection, docId) {
  await initFirebase();
  if (!fb.ready) { localStorage.removeItem('_fb_' + collection + '_' + docId); return true; }
  try { await fb.db.collection(collection).doc(docId).delete(); return true; }
  catch { localStorage.removeItem('_fb_' + collection + '_' + docId); return true; }
}

async function fbUpdateDoc(collection, docId, data) {
  await initFirebase();
  const payload = { ...data, updatedAt: new Date().toISOString() };
  if (!fb.ready) {
    const existing = localGet(collection, docId) || {};
    localSet(collection, docId, { ...existing, ...payload });
    return true;
  }
  try { await fb.db.collection(collection).doc(docId).update(payload); return true; }
  catch { const existing = localGet(collection, docId) || {}; localSet(collection, docId, { ...existing, ...payload }); return true; }
}

function fbOnSnapshot(collection, callback, docId) {
  initFirebase().then(ready => {
    if (!ready) {
      callback(docId ? localGet(collection, docId) : localGetAll(collection));
      return;
    }
    try {
      if (docId) {
        return fb.db.collection(collection).doc(docId).onSnapshot(
          doc => { callback(doc.exists ? { id: doc.id, ...doc.data() } : null); },
          () => { callback(localGet(collection, docId)); }
        );
      } else {
        return fb.db.collection(collection).orderBy('createdAt', 'desc').onSnapshot(
          snap => { callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))); },
          () => { callback(localGetAll(collection)); }
        );
      }
    } catch { callback(docId ? localGet(collection, docId) : localGetAll(collection)); return () => {}; }
  });
  return () => {};
}

async function fbUploadFile(path, file) {
  await initFirebase();
  if (!fb.ready || !fb.storage) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }
  try {
    const ref = fb.storage.ref().child(path);
    const snap = await ref.put(file);
    return await snap.ref.getDownloadURL();
  } catch {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }
}

function localGet(collection, docId) {
  try { return JSON.parse(localStorage.getItem('_fb_' + collection + '_' + docId)); } catch { return null; }
}
function localSet(collection, docId, data) {
  localStorage.setItem('_fb_' + collection + '_' + docId, JSON.stringify(data));
  if (collection === 'weddingInfo' && docId === 'main') {
    localStorage.setItem('weddingData', JSON.stringify(data));
  }
  if (collection === 'guests') {
    const all = localGetAll('guests');
    localStorage.setItem('weddingRSVP', JSON.stringify(all));
  }
  if (collection === 'messages') {
    const all = localGetAll('messages');
    localStorage.setItem('weddingMessages', JSON.stringify(all));
  }
  if (collection === 'gallery') {
    const all = localGetAll('gallery');
    try {
      const wd = JSON.parse(localStorage.getItem('weddingData') || '{}');
      wd.gallery = all.map(g => g.imageUrl || g.url || '').filter(Boolean);
      localStorage.setItem('weddingData', JSON.stringify(wd));
    } catch {}
  }
}
function localGetAll(collection) {
  const items = [];
  if (collection === 'guests') {
    try { return JSON.parse(localStorage.getItem('weddingRSVP') || '[]'); } catch { return []; }
  }
  if (collection === 'messages') {
    try { return JSON.parse(localStorage.getItem('weddingMessages') || '[]'); } catch { return []; }
  }
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('_fb_' + collection + '_')) {
        try { items.push(JSON.parse(localStorage.getItem(key))); } catch {}
      }
    }
  } catch {}
  return items;
}

async function fbSeedDefaults() {
  const existing = await fbGetDoc('weddingInfo', 'main');
  if (existing && existing.groomName) return;
  const defaults = {
    groomName: 'David', brideName: 'Sarah', weddingDate: '2026-12-31',
    weddingTime: '16:00', country: 'United States', state: 'California',
    city: 'Beverly Hills', venue: 'The Grand Ballroom',
    address: '123 Love Lane, Beverly Hills, CA 90210',
    themeColor: '#C9A84C', dressCode: 'Black Tie Optional',
    weddingStory: 'Our beautiful journey together...',
    motto: 'Together with their families', groomPhoto: '', bridePhoto: '',
    coverPhoto: '', musicUrl: ''
  };
  await fbSetDoc('weddingInfo', 'main', defaults);
}

/* ===== FIREBASE AUTH ===== */
let fbAuth = null;

function getAuth() {
  if (!fbAuth && typeof firebase !== 'undefined' && firebase.auth) {
    fbAuth = firebase.auth();
  }
  return fbAuth;
}

async function fbSignUp(email, password, displayName) {
  await initFirebase();
  if (!fb.ready) return { ok: false, error: 'Firebase not configured', local: true };
  try {
    const auth = getAuth();
    if (!auth) return { ok: false, error: 'Auth not available' };
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    if (displayName) await cred.user.updateProfile({ displayName });
    await cred.user.sendEmailVerification().catch(() => {});
    return { ok: true, user: { uid: cred.user.uid, email: cred.user.email, displayName: cred.user.displayName } };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function fbLogIn(email, password) {
  await initFirebase();
  if (!fb.ready) return { ok: false, error: 'Firebase not configured', local: true };
  try {
    const auth = getAuth();
    if (!auth) return { ok: false, error: 'Auth not available' };
    const cred = await auth.signInWithEmailAndPassword(email, password);
    return { ok: true, user: { uid: cred.user.uid, email: cred.user.email, displayName: cred.user.displayName } };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function fbLogInWithGoogle() {
  await initFirebase();
  if (!fb.ready) return { ok: false, error: 'Firebase not configured' };
  try {
    const auth = getAuth();
    if (!auth) return { ok: false, error: 'Auth not available' };
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    const cred = await auth.signInWithPopup(provider);
    return { ok: true, user: { uid: cred.user.uid, email: cred.user.email, displayName: cred.user.displayName, photoURL: cred.user.photoURL } };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function fbLogInWithApple() {
  await initFirebase();
  if (!fb.ready) return { ok: false, error: 'Firebase not configured' };
  try {
    const auth = getAuth();
    if (!auth) return { ok: false, error: 'Auth not available' };
    const provider = new firebase.auth.OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    const cred = await auth.signInWithPopup(provider);
    return { ok: true, user: { uid: cred.user.uid, email: cred.user.email, displayName: cred.user.displayName } };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function fbResetPassword(email) {
  await initFirebase();
  if (!fb.ready) return { ok: false, error: 'Firebase not configured' };
  try {
    const auth = getAuth();
    if (!auth) return { ok: false, error: 'Auth not available' };
    await auth.sendPasswordResetEmail(email);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function fbLogOut() {
  const auth = getAuth();
  if (auth) return auth.signOut();
  return Promise.resolve();
}

function fbGetCurrentUser() {
  const auth = getAuth();
  if (!auth) return null;
  return auth.currentUser;
}

function fbOnAuthStateChanged(callback) {
  const auth = getAuth();
  if (!auth) { callback(null); return () => {}; }
  return auth.onAuthStateChanged(callback);
}

/* ===== MULTI-TENANT: wedding-scoped queries ===== */
function fbGetWeddingPath(weddingId) {
  return 'weddings/' + weddingId;
}

async function fbGetWeddingData(weddingId) {
  const path = fbGetWeddingPath(weddingId);
  return await fbGetDoc(path, 'info');
}

async function fbSetWeddingData(weddingId, data) {
  const path = fbGetWeddingPath(weddingId);
  return await fbSetDoc(path, 'info', data);
}

async function fbGetWeddingGuests(weddingId) {
  const path = fbGetWeddingPath(weddingId) + '/guests';
  return await fbGetCollection(path);
}

async function fbAddWeddingGuest(weddingId, guest) {
  const path = fbGetWeddingPath(weddingId) + '/guests';
  return await fbAddDoc(path, guest);
}

async function fbUpdateWeddingGuest(weddingId, guestId, data) {
  const path = fbGetWeddingPath(weddingId) + '/guests';
  return await fbUpdateDoc(path, guestId, data);
}

async function fbDeleteWeddingGuest(weddingId, guestId) {
  const path = fbGetWeddingPath(weddingId) + '/guests';
  return await fbDeleteDoc(path, guestId);
}

async function fbGetWeddingGallery(weddingId) {
  const path = fbGetWeddingPath(weddingId) + '/gallery';
  return await fbGetCollection(path);
}

async function fbAddWeddingMedia(weddingId, media) {
  const path = fbGetWeddingPath(weddingId) + '/gallery';
  return await fbAddDoc(path, media);
}

async function fbDeleteWeddingMedia(weddingId, mediaId) {
  const path = fbGetWeddingPath(weddingId) + '/gallery';
  return await fbDeleteDoc(path, mediaId);
}

function fbOnWeddingSnapshot(weddingId, callback) {
  const path = fbGetWeddingPath(weddingId);
  return fbOnSnapshot(path, callback, 'info');
}

function fbOnWeddingGuestsSnapshot(weddingId, callback) {
  const path = fbGetWeddingPath(weddingId) + '/guests';
  return fbOnSnapshot(path, callback);
}

/* ===== INVITATION URL GENERATION ===== */
function fbGenerateWeddingSlug(groomName, brideName) {
  const groom = (groomName || 'groom').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
  const bride = (brideName || 'bride').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
  const suffix = Date.now().toString(36).substring(4, 8);
  return groom + '-and-' + bride + '-wedding-' + suffix;
}

function fbGenerateWeddingId() {
  return 'w_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function fbGetInviteUrl(weddingId) {
  return window.location.origin + '/invite/' + weddingId;
}

/* ===== RSVP MANAGEMENT ===== */
async function fbSubmitRSVP(weddingId, rsvpData) {
  const path = fbGetWeddingPath(weddingId) + '/rsvps';
  const payload = { ...rsvpData, timestamp: new Date().toISOString(), status: rsvpData.status || 'pending' };
  return await fbAddDoc(path, payload);
}

async function fbGetWeddingRSVPs(weddingId) {
  const path = fbGetWeddingPath(weddingId) + '/rsvps';
  return await fbGetCollection(path);
}

async function fbUpdateRSVP(weddingId, rsvpId, data) {
  const path = fbGetWeddingPath(weddingId) + '/rsvps';
  return await fbUpdateDoc(path, rsvpId, data);
}

async function fbGetRSVPStats(weddingId) {
  const rsvps = await fbGetWeddingRSVPs(weddingId);
  const accepted = rsvps.filter(r => r.status === 'accepted' || r.status === 'attending').length;
  const declined = rsvps.filter(r => r.status === 'declined').length;
  const pending = rsvps.filter(r => r.status === 'pending').length;
  const totalGuests = rsvps.reduce((sum, r) => sum + (parseInt(r.guestCount) || 1), 0);
  return { total: rsvps.length, accepted, declined, pending, totalGuests };
}

/* ===== ANALYTICS ===== */
async function fbTrackEvent(weddingId, eventType, eventData) {
  const path = fbGetWeddingPath(weddingId) + '/analytics';
  return await fbAddDoc(path, { eventType, ...eventData, timestamp: new Date().toISOString() });
}

async function fbGetAnalytics(weddingId) {
  const path = fbGetWeddingPath(weddingId) + '/analytics';
  const events = await fbGetCollection(path);
  const shares = events.filter(e => e.eventType === 'share');
  const opens = events.filter(e => e.eventType === 'page_open');
  const rsvpEvents = events.filter(e => e.eventType === 'rsvp');
  return {
    totalShares: shares.length,
    totalOpens: opens.length,
    totalRSVPs: rsvpEvents.length,
    byPlatform: shares.reduce((acc, s) => { acc[s.platform] = (acc[s.platform] || 0) + 1; return acc; }, {}),
    events
  };
}

/* ===== NOTIFICATIONS ===== */
async function fbAddNotification(weddingId, notification) {
  const path = fbGetWeddingPath(weddingId) + '/notifications';
  return await fbAddDoc(path, { ...notification, read: false, timestamp: new Date().toISOString() });
}

async function fbGetNotifications(weddingId) {
  const path = fbGetWeddingPath(weddingId) + '/notifications';
  return await fbGetCollection(path);
}

async function fbMarkNotificationRead(weddingId, notifId) {
  const path = fbGetWeddingPath(weddingId) + '/notifications';
  return await fbUpdateDoc(path, notifId, { read: true });
}

/* ===== GIFTS ===== */
async function fbAddGift(weddingId, gift) {
  const path = fbGetWeddingPath(weddingId) + '/gifts';
  return await fbAddDoc(path, gift);
}

async function fbGetWeddingGifts(weddingId) {
  const path = fbGetWeddingPath(weddingId) + '/gifts';
  return await fbGetCollection(path);
}

/* ===== INVITATION MANAGEMENT ===== */
async function fbCreateInvitation(weddingId, data) {
  const path = fbGetWeddingPath(weddingId) + '/invitations';
  return await fbAddDoc(path, { ...data, slug: data.slug || fbGenerateWeddingSlug(data.groomName, data.brideName) });
}

async function fbGetInvitationBySlug(slug) {
  await initFirebase();
  if (!fb.ready) return null;
  try {
    const snap = await fb.db.collectionGroup('invitations').where('slug', '==', slug).limit(1).get();
    return snap.docs.length ? { id: snap.docs[0].id, ...snap.docs[0].data() } : null;
  } catch { return null; }
}

/* ===== BACKUPS ===== */
async function fbCreateBackup(weddingId) {
  const data = await fbGetWeddingData(weddingId);
  const guests = await fbGetWeddingGuests(weddingId);
  const gallery = await fbGetWeddingGallery(weddingId);
  const backup = { weddingData: data, guests, gallery, timestamp: new Date().toISOString() };
  const path = fbGetWeddingPath(weddingId) + '/backups';
  return await fbAddDoc(path, backup);
}

async function fbGetBackups(weddingId) {
  const path = fbGetWeddingPath(weddingId) + '/backups';
  return await fbGetCollection(path);
}

initFirebase();