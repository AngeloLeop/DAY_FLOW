/**
 * Goal Model
 * Represents a longer-term goal with deadline and sub-tasks
 */

(function (root) { root.DayFlow = root.DayFlow || {}; root.DayFlow.Goal = class Goal { constructor(data = {}) { Object.assign(this, { id: data.id || crypto.randomUUID(), userId: '', title: '', deadline: '', taskIds: [], progress: 0, status: 'PLANNED', ...data }); } }; })(globalThis);
