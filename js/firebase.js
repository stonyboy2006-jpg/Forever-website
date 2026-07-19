/* FIREBASE_CONFIG is loaded from js/firebase-config.js (must be included before this file) */

const COLLECTIONS = {
  weddingInfo: 'weddingInfo',
  gallery: 'gallery',
  events: 'events',
  guests: 'guests',
  messages: 'messages',
  socialLinks: 'socialLinks'
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

initFirebase();