/**
 * Access Control
 * Permission management, data isolation per user
 */

(function (root) { root.DayFlow.access = { owns(record, userId) { return Boolean(record && userId && record.userId === userId); }, assert(record, userId) { if (!this.owns(record, userId)) throw new Error('Access denied'); return record; } }; })(globalThis);
