/**
 * Sync Service
 * Manages offline queue, background sync when online
 */

(function (root) { root.DayFlow.sync = { online: navigator.onLine, queue: [], enqueue(change) { this.queue.push({ ...change, queuedAt: new Date().toISOString() }); }, flush() { if (!this.online) return []; const changes = this.queue.splice(0); return changes; }, init() { addEventListener('online', () => { this.online = true; this.flush(); }); addEventListener('offline', () => { this.online = false; }); } }; })(globalThis);
