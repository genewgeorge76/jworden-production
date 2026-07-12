/**
 * J. Worden Construction OS — Service Worker
 *
 * Strategy:
 *   Static assets (JS/CSS/fonts/images): cache-first, background refresh
 *   /os dashboard shell:                 cache-first (offline-capable)
 *   /api/*:                              network-first, no caching
 *   Everything else:                     network-first, stale-while-revalidate fallback
 */

const CACHE_VERSION = 'jworden-v1';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

const PRECACHE_URLS = [
  '/',
  '/os',
  '/index.html',
  '/manifest.json',
];

// ── Install: precache shell ────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

// ── Activate: prune old caches ────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('jworden-') && k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map((k) => caches.delete(k)),
      ),
    ).then(() => self.clients.claim()),
  );
});

// ── Fetch: routing strategy ───────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // API calls: network-only (never cache)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Static assets (hashed filenames): cache-first
  if (url.pathname.match(/\.(js|css|woff2?|png|jpg|svg|ico)(\?.*)?$/)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // /os and SPA shell: stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// ── Background sync: queue offline mutations ──────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'offline-mutations') {
    event.waitUntil(drainOfflineQueue());
  }
});

// ── Strategies ─────────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);
  const networkPromise = fetch(request).then((response) => {
    if (response.ok) {
      caches.open(cacheName).then((c) => c.put(request, response.clone()));
    }
    return response;
  }).catch(() => cached); // network failed — return stale if available

  return cached ?? networkPromise;
}

async function drainOfflineQueue() {
  // IndexedDB-backed mutation queue (populated by api client on network failure)
  // Drain and replay in order — placeholder for Phase 2 offline sync
  const db = await openDB();
  const tx = db.transaction('offline_queue', 'readwrite');
  const store = tx.objectStore('offline_queue');
  const all = await store.getAll();
  for (const item of all) {
    try {
      await fetch(item.url, { method: item.method, body: item.body, headers: item.headers });
      await store.delete(item.id);
    } catch {
      break; // stop on first failure to preserve order
    }
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('jworden-offline', 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore('offline_queue', { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = reject;
  });
}
