// Service worker de AutoNave MX.
// IMPORTANTE: sube este número cada vez que cambies archivos para forzar
// la actualización del caché en los dispositivos de los usuarios.
const CACHE_VERSION = 'v8';
const CACHE_NAME = `autonave-mx-${CACHE_VERSION}`;

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './js/app.js',
  './js/db.js',
  './js/utils.js',
  './js/ads.js',
  './js/donate.js',
  './js/store.js',
  './js/ui.js',
  './js/install.js',
  './js/theme.js',
  './js/firebase.js',
  './js/firebaseConfig.js',
  './js/auth.js',
  './js/views/login.js',
  './js/views/setupFirebase.js',
  './js/views/onboarding.js',
  './js/views/tickets.js',
  './js/views/ticketModal.js',
  './js/views/day.js',
  './js/views/attendance.js',
  './js/views/more.js',
  './js/views/stats.js',
  './js/views/history.js',
  './js/views/workers.js',
  './js/views/products.js',
  './js/views/config.js',
  './js/views/backup.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        ASSETS.map((url) => cache.add(url).catch(() => {}))
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // no cachear anuncios/terceros

  // Navegación: red primero, con respaldo en caché (para funcionar offline).
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // Resto de archivos propios: caché primero, actualiza en segundo plano.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
