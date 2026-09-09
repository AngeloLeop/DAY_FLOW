/**
 * Schedule Optimizer
 * Optimizes daily plan based on user behavior and preferences
 * Simple local learning without external AI
 */

(function (root) {
  root.DayFlow.optimizer = {
    observations(history = []) {
      const groups = new Map();
      for (const entry of history) { const id = entry.sourceId || entry.itemId; if (!id || !Number(entry.actualDuration)) continue; const data = groups.get(id) || { total: 0, count: 0, starts: [] }; data.total += Number(entry.actualDuration); data.count++; if (entry.actualStart) { const start = new Date(entry.actualStart); data.starts.push(start.getHours() * 60 + start.getMinutes()); } groups.set(id, data); }
      return new Map([...groups].map(([id, data]) => [id, { samples: data.count, averageDuration: Math.max(5, Math.round(data.total / data.count)), averageStart: data.starts.length ? Math.round(data.starts.reduce((a, b) => a + b, 0) / data.starts.length) : null }]));
    },
    rank(items, history = [], learningEnabled = true) { const observations = learningEnabled ? this.observations(history) : new Map(); return [...items].map(item => { const seen = observations.get(item.id) || observations.get(item.sourceId); return { ...item, duration: seen?.samples >= 2 ? seen.averageDuration : item.duration, learnedDuration: Boolean(seen?.samples >= 2), historicalSamples: seen?.samples || 0 }; }).sort((a, b) => (b.priority || 0) - (a.priority || 0) || String(a.dueDate || '9999').localeCompare(String(b.dueDate || '9999'))); }
  };
})(globalThis);
