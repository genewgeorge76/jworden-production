/*
 * Kill-switch service worker.
 *
 * A previous build registered a service worker at `/sw.js` with `scope: '/'`
 * (see historical `navigator.serviceWorker.register('/sw.js', { scope: '/' })`).
 * That worker cached an old build and kept serving it long after the site moved
 * on. Because `/sw.js` later stopped serving valid JavaScript, the browser's
 * update check failed and the stale worker could never be replaced — a build
 * that "won't go away."
 *
 * This file exists solely to exorcise that orphaned worker. When an old client
 * performs its periodic update check and fetches `/sw.js`, it now receives this
 * valid script, installs it, and on activation we: purge every Cache Storage
 * entry, unregister ourselves, and reload open pages so they immediately load
 * the current build straight from the network. After that, no service worker
 * remains registered for this origin.
 *
 * The current site does NOT register any service worker, so this is a one-way
 * cleanup — it never re-installs itself.
 */
self.addEventListener('install', () => {
  // Take over as soon as possible instead of waiting for existing tabs to close.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // 1. Delete all caches created by the old worker.
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));

      // 2. Unregister this worker so nothing controls the origin afterward.
      await self.registration.unregister();

      // 3. Reload every controlled page so users see the live build now,
      //    served from the network rather than the purged cache.
      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) {
        client.navigate(client.url);
      }
    })()
  );
});
