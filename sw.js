'use strict';

// Network-first service worker: always try to load the latest files (so new
// questions show up right away) and fall back to the cached copy when offline.
// Bump CACHE when the list of ASSETS changes, so old caches get cleaned up.
const CACHE = 'wset-quiz-v3';
const ASSETS = [
  './',
  'index.html',
  'library.html',
  'trainer.html',
  'common.js',
  'profile.js',
  'app.js',
  'library.js',
  'trainer.js',
  'style.css',
  'questions.json',
  'library.json',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
];
const NETWORK_TIMEOUT_MS = 4000; // on a flaky connection, give up and use the cache

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(networkFirst(req));
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  // 'no-cache' revalidates with the server instead of trusting the browser's HTTP cache,
  // so an update never mixes old and new files (e.g. a new app.js with an old index.html).
  const network = fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).then(res => {
    if (res.ok) cache.put(req, res.clone());
    return res;
  });
  network.catch(() => {}); // handled below; avoid an unhandled rejection after a timeout
  const timeout = new Promise((_, reject) => setTimeout(reject, NETWORK_TIMEOUT_MS));
  try {
    return await Promise.race([network, timeout]);
  } catch {
    return (await cache.match(req, { ignoreSearch: true })) || network;
  }
}
