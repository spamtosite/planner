/* Ежедневник — service worker v25.
   HTML-навигация всегда сначала идёт в сеть, затем в кэш только при офлайне.
   Это предотвращает показ старой версии приложения после обновления GitHub Pages. */
const CACHE = 'planner-v29';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './fav.png',
  './planner.html',
  './planneresults.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isHtml = event.request.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('/');

  /* Ключевая часть: HTML всегда network-first.
     Поэтому новая версия planneresults.html не заменяется старой копией из Cache Storage. */
  if (isHtml) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  /* Иконки и manifest: кэш для офлайна, обновление в фоне. */
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fresh = fetch(event.request)
        .then(async response => {
          if (response && response.ok) {
            const cache = await caches.open(CACHE);
            await cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() => cached);

      return cached || fresh;
    })
  );
});
