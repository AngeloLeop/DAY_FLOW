/**
 * Task Model
 * Represents a single task with metadata, status, scheduling info
 */

(function (root) {
  root.DayFlow = root.DayFlow || {};
  root.DayFlow.Task = class Task {
    constructor(data = {}) { Object.assign(this, { id: data.id || crypto.randomUUID(), userId: data.userId || '', title: '', description: '', duration: 30, priority: 60, type: 'FLEXIBLE', status: 'PLANNED', category: 'PERSONAL', dueDate: '', preferredTime: '', dependencies: [], createdAt: new Date().toISOString(), ...data }); }
  };
})(globalThis);
