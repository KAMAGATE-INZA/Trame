/* Trame — service worker : réseau d’abord (toujours la dernière version en ligne),
   cache en secours pour fonctionner hors ligne. Seuls les fichiers du site sont mis en cache ;
   les services externes (GitHub, moteur Python, IA) passent toujours par le réseau.
   Le cache est partagé par tout kamagate-inza.github.io (Focale, Trame…) : on ne touche
   qu’aux caches « trame-… », jamais à ceux des autres applis. */
const CACHE = 'trame-v3';
const CORE = ['./', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './favicon.svg'];
self.addEventListener('install', (e) => {
  // Une connexion lente ne doit pas empêcher l’installation : le cache se remplit ensuite au fil des visites.
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('trame-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== self.location.origin) return;
  e.respondWith(fetch(req).then((res) => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; })
    .catch(() => caches.open(CACHE).then((c) => c.match(req, { ignoreSearch: req.mode === 'navigate' }).then((r) => r || (req.mode === 'navigate' ? c.match('./') : Response.error())))));
});
