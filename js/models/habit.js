/**
 * Habit Model
 * Represents a recurring habit with frequency, target days, etc.
 */

(function (root) {
  root.DayFlow = root.DayFlow || {};
  root.DayFlow.Habit = class Habit {
    constructor(data = {}) { Object.assign(this, { id: data.id || crypto.randomUUID(), userId: data.userId || '', title: '', description: '', duration: 30, frequency: 'daily', targetDays: [], preferredTime: '', priority: 50, status: 'PLANNED', completions: [], createdAt: new Date().toISOString(), ...data }); }
    occursOn(date) { const day = new Date(date).getDay(); return this.frequency === 'daily' || (this.frequency === 'weekdays' && day > 0 && day < 6) || (this.frequency === 'weekends' && (day === 0 || day === 6)) || this.targetDays.includes(day); }
  };
})(globalThis);
