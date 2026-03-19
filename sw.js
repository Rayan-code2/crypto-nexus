const CACHE_NAME = 'cryptospiral-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.css',
  '/index.tsx',
  '/manifest.json',
  'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a635305444d75633144c18f02626cc28e271cf0/128/color/usdt.png',
  'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a635305444d75633144c18f02626cc28e271cf0/512/color/usdt.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
