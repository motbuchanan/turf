// Turf service worker. The cache name carries the version, so every release installs fresh;
// only Turf's own old caches are removed. Files are fetched fresh at install, never from the browser's own cache.
const CACHE = 'turf-v0.4.1';   // stamped by build.py
const FILES = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png', 'viceroy.png', 'title.jpg', 'event-rescue.jpg', 'event-keys.jpg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, {cache:'reload'})))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('turf-v') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
 const u = new URL(e.request.url);
 if (e.request.method !== 'GET' || u.origin !== location.origin) return;
 if (u.pathname.endsWith('sw.js') || e.request.cache === 'no-store') return;   // the update checks always ask the network
 if (e.request.mode === 'navigate'){ e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put('index.html', c)); return r; }).catch(() => caches.match('index.html'))); return; }
 // pictures: show the saved copy right away, and fetch a fresh one in the background so a replaced picture shows up next time
 if (/\.(png|jpg|webp)$/.test(u.pathname)){ e.respondWith(caches.open(CACHE).then(c => c.match(e.request, {ignoreSearch:true}).then(r => { const net = fetch(e.request).then(n => { if (n.ok) c.put(e.request, n.clone()); return n; }).catch(() => r); return r || net; }))); return; }
 e.respondWith(caches.match(e.request, {ignoreSearch:true}).then(r => r || fetch(e.request)));
});
