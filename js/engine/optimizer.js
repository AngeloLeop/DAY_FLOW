/**
 * Schedule Optimizer
 * Optimizes daily plan based on user behavior and preferences
 * Simple local learning without external AI
 */

(function (root) {
  root.DayFlow.optimizer = {
    rank(items, history = []) { const averages = new Map(); for (const entry of history) { const id = entry.sourceId || entry.itemId; if (!id || !Number(entry.actualDuration)) continue; const data = averages.get(id) || { total: 0, count: 0 }; data.total += Number(entry.actualDuration); data.count++; averages.set(id, data); } return [...items].map(item => { const seen = averages.get(item.id); return { ...item, duration: seen ? Math.max(5, Math.round(seen.total / seen.count)) : item.duration }; }).sort((a, b) => (b.priority || 0) - (a.priority || 0) || String(a.dueDate || '9999').localeCompare(String(b.dueDate || '9999'))); }
  };
})(globalThis);
