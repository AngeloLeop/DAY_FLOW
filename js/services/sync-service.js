/**
 * Sync Service
 * Manages offline queue, background sync when online
 */

(function (root) { root.DayFlow.sync = { online: navigator.onLine, queue: [], listeners: new Set(), enqueue(change) { this.queue.push({ ...change, queuedAt: new Date().toISOString() }); }, onFlush(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }, flush() { if (!this.online || !this.listeners.size) return []; const changes = [...this.queue]; for (const listener of this.listeners) listener(changes); this.queue.splice(0, changes.length); return changes; }, init() { if (this.initialized) return; addEventListener('online', () => { this.online = true; this.flush(); }); addEventListener('offline', () => { this.online = false; }); this.initialized = true; } }; })(globalThis);
