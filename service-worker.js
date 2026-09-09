/**
 * DAY FLOW Service Worker
 * 
 * Handles:
 * - Offline detection & sync
 * - Cache management
 * - Network-first application shell with offline cache fallback
 * - Background sync (when available)
 * 
 * Security: no dynamic code execution or unsafe DOM manipulation
 */

const CACHE_VERSION = 'v1.1.0';
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
  '/js/constants.js',
  '/js/utils/date-utils.js',
  '/js/utils/validation.js',
  '/js/utils/logger.js',
  '/js/models/user.js',
  '/js/models/task.js',
  '/js/models/habit.js',
  '/js/models/event.js',
  '/js/models/goal.js',
  '/js/models/plan.js',
  '/js/models/activity-log.js',
  '/js/database/migrations.js',
  '/js/database/db.js',
  '/js/repositories/base-repository.js',
  '/js/repositories/user-repository.js',
  '/js/repositories/task-repository.js',
  '/js/repositories/habit-repository.js',
  '/js/repositories/event-repository.js',
  '/js/repositories/plan-repository.js',
  '/js/repositories/goal-repository.js',
  '/js/repositories/activity-log-repository.js',
  '/js/security/crypto.js',
  '/js/security/auth.js',
  '/js/security/access-control.js',
  '/js/engine/dependency-resolver.js',
  '/js/engine/conflict-resolver.js',
  '/js/engine/optimizer.js',
  '/js/engine/scheduler.js',
  '/js/services/storage-service.js',
  '/js/services/notification-service.js',
  '/js/services/backup-service.js',
  '/js/services/sync-service.js',
  '/js/services/daily-flow-service.js',
  '/js/device/device-info.js',
  '/js/device/permissions.js',
  '/js/state.js',
  '/js/router.js',
  '/js/data.js',
  '/js/storage.js',
  '/js/scheduler.js',
  '/js/app.js',
  '/manifest.json',
  '/assets/icon.svg',
  '/assets/icon-maskable.svg',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/icon-maskable-512.png',
  '/assets/screenshot-mobile.png',
].map((path) => path === '/' ? './' : `.${path}`);

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
 * - App shell: network-first for updates, cache fallback for offline use
 * - Other same-origin GET requests: network-first with runtime caching
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

  // App shell: network first so deployed updates are visible, cache fallback offline.
  if (['document', 'style', 'script'].includes(request.destination)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) caches.open(CACHE_NAMES.CORE).then((cache) => cache.put(request, response.clone()));
          return response;
        })
        .catch(async () => (await caches.match(request)) || (request.mode === 'navigate' ? await caches.match('./index.html') : undefined) || Response.error())
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
      .catch(async () => (await caches.match(request)) || Response.error())
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
