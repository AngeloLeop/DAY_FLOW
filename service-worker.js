/**
 * DAY FLOW Service Worker
 * 
 * Handles:
 * - Offline detection & sync
 * - Cache management
 * - Network-first strategy for API, cache-first for assets
 * - Background sync (when available)
 * 
 * Security: No eval(), no unsafe DOM manipulation
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAMES = {
  CORE: `dayflow-core-${CACHE_VERSION}`,
  ASSETS: `dayflow-assets-${CACHE_VERSION}`,
  API: `dayflow-api-${CACHE_VERSION}`,
};

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/css/variables.css',
  '/css/components.css',
  '/css/style.css',
];

/**
 * Install event: Cache essential resources
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAMES.CORE)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

/**
 * Activate event: Clean up old caches
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !Object.values(CACHE_NAMES).includes(name))
          .map((name) => caches.delete(name))
      );
    })
    .then(() => self.clients.claim())
  );
});

/**
 * Fetch event: Implement caching strategies
 * - Core: cache-first (offline support)
 * - API: network-first (latest data, fallback to cache)
 * - Assets: cache-first with network fallback
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Core HTML/CSS: Cache first
  if (request.destination === 'document' || request.destination === 'style') {
    event.respondWith(
      caches.match(request)
        .then((response) => response || fetch(request))
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Scripts & modules: Cache first
  if (request.destination === 'script') {
    event.respondWith(
      caches.match(request)
        .then((response) => response || fetch(request))
    );
    return;
  }

  // Default: Network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        // Clone and cache successful responses
        const responseToCache = response.clone();
        caches.open(CACHE_NAMES.API).then((cache) => {
          cache.put(request, responseToCache);
        });
        return response;
      })
      .catch(() => caches.match(request))
  );
});

/**
 * Message event: Handle messages from clients
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
