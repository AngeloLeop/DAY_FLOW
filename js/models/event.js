/**
 * Event Model
 * Represents a calendar event or fixed commitment
 */

(function (root) { root.DayFlow = root.DayFlow || {}; root.DayFlow.Event = class Event { constructor(data = {}) { Object.assign(this, { id: data.id || crypto.randomUUID(), userId: '', title: '', date: '', startTime: '', endTime: '', type: 'FIXED', priority: 100, status: 'PLANNED', lastDecisionDate: '', bufferBefore: 0, bufferAfter: 0, location: '', notes: '', ...data }); } }; })(globalThis);
