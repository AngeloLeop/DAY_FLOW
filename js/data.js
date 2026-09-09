/**
 * Legacy data facade
 * Maintained for compatibility; core logic moved to services/
 */

(function (root) { root.DayFlowData = { get user() { return root.DayFlow.auth?.currentUser || null; }, async tasks() { return this.user ? root.DayFlow.tasks.forUser(this.user.id) : []; }, async habits() { return this.user ? root.DayFlow.habits.forUser(this.user.id) : []; } }; })(globalThis);
