/**
 * Test Setup & Configuration
 * Test framework initialization, helpers, fixtures
 */

const path = require('node:path');

class WebStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

global.localStorage = new WebStorage();
global.sessionStorage = new WebStorage();

const files = [
  'constants.js', 'utils/logger.js', 'utils/date-utils.js', 'utils/validation.js', 'state.js', 'models/user.js',
  'models/task.js', 'models/habit.js', 'models/event.js', 'models/goal.js', 'models/plan.js', 'models/activity-log.js',
  'database/migrations.js', 'database/db.js', 'repositories/base-repository.js',
  'repositories/user-repository.js', 'repositories/task-repository.js', 'repositories/habit-repository.js',
  'repositories/event-repository.js', 'repositories/plan-repository.js', 'repositories/goal-repository.js', 'repositories/activity-log-repository.js', 'security/crypto.js',
  'security/auth.js', 'security/access-control.js', 'engine/dependency-resolver.js',
  'engine/conflict-resolver.js', 'engine/optimizer.js', 'engine/scheduler.js', 'services/backup-service.js'
];
for (const file of files) require(path.join(__dirname, '..', 'js', file));
global.DayFlow.db.enableMemoryAdapterForTests();

module.exports = global.DayFlow;
