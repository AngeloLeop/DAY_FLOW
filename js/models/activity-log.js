/** Actual execution record kept separate from generated plans. */
(function (root) {
  root.DayFlow = root.DayFlow || {};
  root.DayFlow.ActivityLog = class ActivityLog {
    constructor(data = {}) { Object.assign(this, { id: data.id || crypto.randomUUID(), userId: '', planId: '', sourceId: '', source: '', title: '', date: '', status: 'COMPLETED', plannedStart: '', plannedEnd: '', actualStart: '', actualEnd: '', actualDuration: 0, createdAt: new Date().toISOString(), ...data }); }
  };
})(globalThis);
