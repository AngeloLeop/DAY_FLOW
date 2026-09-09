/**
 * Scheduler Tests
 * Scheduling logic, conflict detection, optimization
 * Test cases: normal day, late wake-up, fixed vs fixed conflict, etc.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const DF = require('./test-setup');

test('scheduler protects fixed events and places flexible tasks around them', () => {
  const plan = DF.schedulerEngine.generate({ date: '2026-09-09', preferences: { wakeTime: '08:00', sleepTime: '18:00' }, events: [new DF.Event({ title: 'Meeting', date: '2026-09-09', startTime: '09:00', endTime: '10:00' })], tasks: [new DF.Task({ title: 'Write', duration: 90, priority: 80 })], habits: [] });
  assert.equal(plan.items.find(x => x.title === 'Meeting').startTime, '09:00');
  assert.equal(DF.conflicts.detect(plan.items).length, 0);
});

test('dependency resolver orders prerequisites and detects cycles', () => {
  const first = new DF.Task({ id: 'first', title: 'First' }); const second = new DF.Task({ id: 'second', title: 'Second', dependencies: ['first'] });
  assert.deepEqual(DF.dependencies.sort([second, first]).map(x => x.id), ['first', 'second']);
  first.dependencies = ['second']; assert.throws(() => DF.dependencies.sort([first, second]), /Circular/);
});

test('fixed versus fixed overlap is reported', () => {
  const items = [{ title: 'A', type: 'FIXED', startTime: '09:00', endTime: '10:00' }, { title: 'B', type: 'FIXED', startTime: '09:30', endTime: '11:00' }];
  assert.throws(() => DF.conflicts.resolve(items), /Fixed commitments conflict/);
});

test('scheduler includes overdue work but defers future tasks', () => {
  const plan = DF.schedulerEngine.generate({ date: '2026-09-09', preferences: { wakeTime: '08:00', sleepTime: '18:00' }, events: [], habits: [], tasks: [new DF.Task({ title: 'Overdue', dueDate: '2026-09-08' }), new DF.Task({ title: 'Future', dueDate: '2026-09-10' })] });
  assert.deepEqual(plan.items.map(x => x.title), ['Overdue']);
});

test('late wake-up schedules remaining work after the current time', () => {
  const plan = DF.schedulerEngine.generate({ date: '2026-09-09', preferences: { wakeTime: '07:00', sleepTime: '18:00', currentTime: '10:30' }, tasks: [new DF.Task({ title: 'Late start' })] });
  assert.equal(plan.items[0].startTime, '10:30');
});

test('overloaded days leave lower-priority work unscheduled with a reason', () => {
  const plan = DF.schedulerEngine.generate({ date: '2026-09-09', preferences: { wakeTime: '08:00', sleepTime: '10:00' }, tasks: [new DF.Task({ title: 'High', duration: 90, priority: 80 }), new DF.Task({ title: 'Low', duration: 90, priority: 40 })] });
  assert.deepEqual(plan.items.map(x => x.title), ['High']); assert.equal(plan.unscheduled[0].reason, 'NO_AVAILABLE_WINDOW');
});

test('dependency chains are scheduled in order', () => {
  const first = new DF.Task({ id: 'first', title: 'First' }); const second = new DF.Task({ title: 'Second', dependencies: ['first'], priority: 80 });
  const plan = DF.schedulerEngine.generate({ date: '2026-09-09', tasks: [second, first] });
  assert.deepEqual(plan.items.map(x => x.title), ['First', 'Second']);
});

test('optional activities are identified when removed from an overloaded day', () => {
  const optional = new DF.Task({ title: 'Optional', duration: 90, type: 'OPTIONAL', priority: 20 });
  const plan = DF.schedulerEngine.generate({ date: '2026-09-09', preferences: { wakeTime: '08:00', sleepTime: '09:00' }, tasks: [optional] });
  assert.equal(plan.unscheduled[0].optional, true);
});

test('mid-day regeneration protects current and completed activities', () => {
  const current = { id: 'current', sourceId: 'a', title: 'Current', startTime: '09:00', endTime: '11:00', type: 'FLEXIBLE', status: 'STARTED' };
  const completed = { id: 'done', sourceId: 'b', title: 'Done', startTime: '08:00', endTime: '09:00', type: 'FLEXIBLE', status: 'COMPLETED' };
  const existingPlan = new DF.Plan({ id: 'old-plan', date: '2026-09-09', items: [completed, current] });
  const plan = DF.schedulerEngine.reschedule({ existingPlan, now: new Date('2026-09-09T10:00:00'), date: '2026-09-09', preferences: { wakeTime: '07:00', sleepTime: '18:00' }, tasks: [new DF.Task({ id: 'a', title: 'Current' }), new DF.Task({ id: 'b', title: 'Done', status: 'COMPLETED' }), new DF.Task({ id: 'c', title: 'Next' })] });
  assert.equal(plan.items.find(x => x.sourceId === 'a').startTime, '09:00'); assert.equal(plan.items.find(x => x.sourceId === 'b').status, 'COMPLETED'); assert.ok(DF.dates.timeToMinutes(plan.items.find(x => x.sourceId === 'c').startTime) >= 11 * 60); assert.equal(plan.previousVersionId, 'old-plan');
});

test('an appointment conflicting with the current activity is surfaced', () => {
  const existingPlan = new DF.Plan({ items: [{ sourceId: 'a', title: 'Current', startTime: '09:00', endTime: '11:00', type: 'FLEXIBLE', status: 'STARTED' }] });
  assert.throws(() => DF.schedulerEngine.reschedule({ existingPlan, now: new Date('2026-09-09T10:00:00'), date: '2026-09-09', events: [new DF.Event({ id: 'meeting', title: 'Appointment', startTime: '10:30', endTime: '11:30' })], tasks: [new DF.Task({ id: 'a', title: 'Current' })] }), /Fixed commitments conflict/);
});

test('actual duration history influences future planned duration', () => {
  const task = new DF.Task({ id: 'write', title: 'Write', duration: 30 }); const plan = DF.schedulerEngine.generate({ date: '2026-09-09', tasks: [task], history: [{ itemId: 'write', actualDuration: 50 }, { itemId: 'write', actualDuration: 70 }] });
  assert.equal(plan.items[0].duration, 60);
});
