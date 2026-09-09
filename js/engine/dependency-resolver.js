/**
 * Dependency Resolver
 * Handles task dependencies and ordering
 */

(function (root) {
  root.DayFlow.dependencies = {
    sort(tasks) { const byId = new Map(tasks.map(t => [t.id, t])); const visiting = new Set(); const visited = new Set(); const output = []; const visit = task => { if (visited.has(task.id)) return; if (visiting.has(task.id)) throw new Error(`Circular dependency involving ${task.title}`); visiting.add(task.id); for (const id of task.dependencies || []) if (byId.has(id)) visit(byId.get(id)); visiting.delete(task.id); visited.add(task.id); output.push(task); }; tasks.forEach(visit); return output; },
    ready(task, completedIds = []) { return (task.dependencies || []).every(id => completedIds.includes(id)); }
  };
})(globalThis);
