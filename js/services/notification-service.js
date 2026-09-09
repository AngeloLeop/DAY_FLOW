/**
 * Notification Service
 * Handles push notifications, reminders, alerts
 */

(function (root) {
  root.DayFlow.notifications = {
    supported: 'Notification' in root, timers: [],
    async request() { return this.supported ? Notification.requestPermission() : 'unsupported'; },
    show(title, options = {}) { if (this.supported && Notification.permission === 'granted') return new Notification(title, options); return null; },
    cancel() { this.timers.forEach(clearTimeout); this.timers = []; },
    schedule(plan, leadMinutes = 5) { this.cancel(); if (!this.supported || Notification.permission !== 'granted' || plan.date !== root.DayFlow.dates.dateKey()) return 0; const now = new Date(); const current = now.getHours() * 60 + now.getMinutes(); for (const item of plan.items) { const delay = (root.DayFlow.dates.timeToMinutes(item.startTime) - leadMinutes - current) * 60000; if (delay > 0 && delay <= 2147483647) this.timers.push(setTimeout(() => this.show(`Up next: ${item.title}`, { body: `${item.title} starts at ${root.DayFlow.dates.formatTime(item.startTime)}.`, tag: `day-flow-${item.id}` }), delay)); } return this.timers.length; }
  };
})(globalThis);
