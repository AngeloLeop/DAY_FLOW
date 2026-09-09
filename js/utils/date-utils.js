/**
 * Date Utilities
 * Helper functions for date calculations, formatting, etc.
 */

(function (root) {
  const pad = n => String(n).padStart(2, '0');
  const toDate = value => {
    if (value instanceof Date) return new Date(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) {
      const [year, month, day] = String(value).split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date(value || Date.now());
  };
  root.DayFlow = root.DayFlow || {};
  root.DayFlow.dates = {
    dateKey(value) { const d = toDate(value); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; },
    timeToMinutes(value = '00:00') { const [h, m] = String(value).split(':').map(Number); return (h * 60) + (m || 0); },
    minutesToTime(value) { const n = Math.max(0, Math.min(1439, Math.round(value))); return `${pad(Math.floor(n / 60))}:${pad(n % 60)}`; },
    addDays(value, amount) { const d = toDate(value); d.setDate(d.getDate() + amount); return d; },
    formatDate(value, options = { weekday: 'short', month: 'short', day: 'numeric' }) { return toDate(value).toLocaleDateString(undefined, options); },
    formatTime(value) { if (!value) return ''; const [h, m] = value.split(':').map(Number); return new Date(2000, 0, 1, h, m).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); },
    overlaps(a, b) { return this.timeToMinutes(a.startTime) < this.timeToMinutes(b.endTime) && this.timeToMinutes(b.startTime) < this.timeToMinutes(a.endTime); }
  };
})(globalThis);
