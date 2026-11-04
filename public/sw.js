// Service worker : garde l'appli dans le téléphone pour qu'elle s'ouvre sans réseau (au magasin).
// Pages : réseau d'abord (toujours la dernière version), copie en cache si pas de réseau.
const CACHE = 'recettes-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req.mode === 'navigate' ? './' : req, copy));
        return res;
      })
      .catch(() => caches.match(req.mode === 'navigate' ? './' : req).then((r) => r || Response.error())),
  );
});
