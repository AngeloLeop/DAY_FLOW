/**
 * Plan Model
 * Represents a daily or weekly schedule plan
 */

(function (root) { root.DayFlow = root.DayFlow || {}; root.DayFlow.Plan = class Plan { constructor(data = {}) { Object.assign(this, { id: data.id || crypto.randomUUID(), userId: '', date: '', items: [], unscheduled: [], explanations: [], version: 1, previousVersionId: '', generatedAt: new Date().toISOString(), createdAt: new Date().toISOString(), ...data }); } }; })(globalThis);
