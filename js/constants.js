/**
 * DAY FLOW Constants
 * App-wide constants for priority levels, statuses, categories, etc.
 */

(function (root) {
  const DF = root.DayFlow = root.DayFlow || {};
  DF.constants = Object.freeze({
    DB_NAME: 'DAY_FLOW_DB', DB_VERSION: 2, APP_VERSION: '1.1.0',
    STORES: Object.freeze(['users', 'tasks', 'habits', 'events', 'goals', 'plans', 'activityLogs', 'settings']),
    STATUS: Object.freeze({ PLANNED: 'PLANNED', STARTED: 'STARTED', COMPLETED: 'COMPLETED', SKIPPED: 'SKIPPED', MISSED: 'MISSED', CANCELLED: 'CANCELLED', RESCHEDULED: 'RESCHEDULED', PARTIAL: 'PARTIAL' }),
    TYPE: Object.freeze({ FIXED: 'FIXED', SEMI_FIXED: 'SEMI_FIXED', FLEXIBLE: 'FLEXIBLE', OPTIONAL: 'OPTIONAL' }),
    PRIORITY: Object.freeze({ OPTIONAL: 20, LOW: 40, NORMAL: 60, HIGH: 80, VERY_HIGH: 99, CRITICAL: 100 }),
    FLOW_ACTION: Object.freeze({ START: 'START', PAUSE: 'PAUSE', COMPLETE: 'COMPLETE', SKIP: 'SKIP', MORE_TIME: 'MORE_TIME', FINISHED_EARLY: 'FINISHED_EARLY', CANT_DO: 'CANT_DO', REPLAN: 'REPLAN' })
  });
})(globalThis);
