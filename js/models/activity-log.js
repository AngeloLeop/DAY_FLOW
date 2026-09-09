/** Actual execution record kept separate from generated plans. */
(function (root) {
  root.DayFlow = root.DayFlow || {};
  root.DayFlow.ActivityLog = class ActivityLog {
    constructor(data = {}) { Object.assign(this, { id: data.id || crypto.randomUUID(), userId: '', planId: '', sourceId: '', source: '', title: '', date: '', status: 'PLANNED', plannedStart: '', plannedEnd: '', plannedDuration: 0, actualStart: '', actualEnd: '', actualDuration: 0, pausedAt: '', pauseMinutes: 0, reason: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...data }); }
  };
})(globalThis);
