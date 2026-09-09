const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const DF = require('./test-setup');

beforeEach(async () => { await DF.db.clearAll(); DF.auth.logout(); });

test('conflict detection finds nested and non-adjacent overlapping pairs', () => {
  const items = [{ title: 'A', startTime: '09:00', endTime: '12:00' }, { title: 'B', startTime: '10:00', endTime: '11:00' }, { title: 'C', startTime: '10:30', endTime: '11:30' }];
  assert.equal(DF.conflicts.detect(items).length, 3);
});

test('semi-fixed activities stay inside their availability window', () => {
  const task = new DF.Task({ title: 'Office hours', type: 'SEMI_FIXED', availableFrom: '09:00', availableUntil: '09:30', duration: 60 });
  const plan = DF.schedulerEngine.generate({ date: '2026-09-09', preferences: { wakeTime: '08:00', sleepTime: '18:00' }, tasks: [task] });
  assert.equal(plan.items.length, 0); assert.equal(plan.unscheduled[0].reason, 'NO_AVAILABLE_WINDOW');
});

test('event buffers reserve real transition time', () => {
  const event = new DF.Event({ id: 'meeting', title: 'Meeting', date: '2026-09-09', startTime: '10:00', endTime: '11:00', bufferBefore: 20, bufferAfter: 15 });
  const plan = DF.schedulerEngine.generate({ date: '2026-09-09', events: [event] });
  assert.deepEqual(plan.items.map(item => item.source), ['buffer', 'event', 'buffer']);
  assert.equal(plan.items[0].startTime, '09:40'); assert.equal(plan.items[2].endTime, '11:15');
});

test('day boundaries cap buffers and never create imaginary free time', () => {
  const early = new DF.Event({ id: 'early', title: 'Early', date: '2026-09-09', startTime: '00:10', endTime: '00:20', bufferBefore: 30 });
  const earlyPlan = DF.schedulerEngine.generate({ date: early.date, events: [early], preferences: { wakeTime: '00:00', sleepTime: '01:00' } });
  assert.equal(earlyPlan.items[0].duration, 10);
  const late = new DF.Event({ id: 'late', title: 'Late', date: '2026-09-09', startTime: '23:00', endTime: '23:30' });
  const latePlan = DF.schedulerEngine.generate({ date: late.date, events: [late], preferences: { wakeTime: '07:00', sleepTime: '22:00' } });
  assert.deepEqual(latePlan.freeWindows, [{ startTime: '07:00', endTime: '22:00', duration: 900 }]);
});

test('onboarding work, lunch, and commute become protected daily blocks', () => {
  const plan = DF.schedulerEngine.generate({ date: '2026-09-09', preferences: { wakeTime: '07:00', sleepTime: '22:00', workDays: [3], workStart: '09:00', workEnd: '17:00', lunchStart: '12:00', lunchEnd: '13:00', commuteMinutes: 30, workLabel: 'Studio' } });
  assert.deepEqual(plan.items.map(item => [item.title, item.startTime, item.endTime]), [
    ['Commute to work / school', '08:30', '09:00'],
    ['Studio', '09:00', '12:00'],
    ['Lunch break', '12:00', '13:00'],
    ['Studio', '13:00', '17:00'],
    ['Commute home', '17:00', '17:30']
  ]);
  assert.ok(plan.items.every(item => item.type === 'FIXED'));
});

test('ordered routine items preserve sequence and optionality', () => {
  const routine = new DF.Habit({ id: 'morning', title: 'Morning', preferredTime: '07:00', routineItems: [{ id: 'wash', title: 'Wash', duration: 10, required: true }, { id: 'eat', title: 'Eat', duration: 20, required: true }, { id: 'read', title: 'Read', duration: 10, required: false }] });
  const plan = DF.schedulerEngine.generate({ date: '2026-09-09', preferences: { wakeTime: '07:00', sleepTime: '09:00' }, habits: [routine] });
  assert.deepEqual(plan.items.map(item => item.title), ['Morning · Wash', 'Morning · Eat', 'Morning · Read']);
  assert.equal(plan.items[2].type, 'OPTIONAL');
});

test('goals create real sessions until the weekly target is met', () => {
  const goal = new DF.Goal({ id: 'learn', title: 'Learn programming', weeklyTargetMinutes: 60, sessionMinutes: 30 });
  const first = DF.schedulerEngine.generate({ date: '2026-09-09', goals: [goal] });
  assert.equal(first.items[0].source, 'goal'); assert.match(first.items[0].reason, /weekly goal target/);
  const history = [new DF.ActivityLog({ source: 'goal', sourceId: 'learn', date: '2026-09-08', status: 'COMPLETED', actualDuration: 60 })];
  assert.equal(DF.schedulerEngine.generate({ date: '2026-09-09', goals: [goal], history }).items.length, 0);
});

test('local learning is transparent and can be disabled', () => {
  const task = new DF.Task({ id: 'workout', title: 'Workout', duration: 20 }); const history = [{ sourceId: 'workout', actualDuration: 40 }, { sourceId: 'workout', actualDuration: 50 }];
  assert.equal(DF.schedulerEngine.generate({ date: '2026-09-09', tasks: [task], history }).items[0].duration, 45);
  assert.equal(DF.schedulerEngine.generate({ date: '2026-09-09', tasks: [task], history, preferences: { learningEnabled: false } }).items[0].duration, 20);
});

test('plan repository retains every revision and returns the latest', async () => {
  await DF.plans.save(new DF.Plan({ id: 'v1', userId: 'u1', date: '2026-09-09', version: 1 }));
  await DF.plans.save(new DF.Plan({ id: 'v2', userId: 'u1', date: '2026-09-09', version: 2, previousVersionId: 'v1' }));
  assert.deepEqual((await DF.plans.historyForDate('u1', '2026-09-09')).map(plan => plan.id), ['v1', 'v2']);
  assert.equal((await DF.plans.forDate('u1', '2026-09-09')).id, 'v2');
});

test('adaptive replanning preserves critical commitments and explains the revision', () => {
  const critical = new DF.Task({ id: 'critical', title: 'Submit filing', priority: 100, duration: 30 });
  const flexible = new DF.Task({ id: 'flexible', title: 'Read', priority: 30, duration: 45 });
  const existingPlan = new DF.Plan({ id: 'first', date: '2026-09-09', version: 1, items: [
    { id: 'read', sourceId: flexible.id, source: 'task', title: flexible.title, startTime: '08:00', endTime: '08:45', duration: 45, type: 'FLEXIBLE', priority: 30, status: 'PLANNED' },
    { id: 'filing', sourceId: critical.id, source: 'task', title: critical.title, startTime: '12:00', endTime: '12:30', duration: 30, type: 'FLEXIBLE', priority: 100, status: 'PLANNED' }
  ] });
  const revised = DF.schedulerEngine.reschedule({ existingPlan, date: existingPlan.date, now: new Date(2026, 8, 9, 9, 0), tasks: [critical, flexible], preferences: { wakeTime: '07:00', sleepTime: '18:00' } });
  const preserved = revised.items.find(item => item.sourceId === critical.id);
  assert.equal(preserved.startTime, '12:00');
  assert.equal(revised.previousVersionId, existingPlan.id);
  assert.equal(revised.version, 2);
  assert.deepEqual(revised.changeSummary.protected, ['Submit filing']);
  assert.match(revised.changeSummary.message, /Protected 1/);
});

test('live flow records actual time without overwriting planned values', async () => {
  const task = await DF.tasks.save(new DF.Task({ id: 'write', userId: 'u1', title: 'Write' }));
  const plan = await DF.plans.save(new DF.Plan({ id: 'plan', userId: 'u1', date: '2026-09-09', items: [{ id: 'entry', sourceId: task.id, source: 'task', title: task.title, startTime: '09:00', endTime: '10:00', duration: 60, plannedDuration: 60, status: 'PLANNED' }] }));
  await DF.dailyFlow.perform({ userId: 'u1', date: plan.date, itemId: 'entry', action: 'START', at: new Date('2026-09-09T09:05:00') });
  await DF.dailyFlow.perform({ userId: 'u1', date: plan.date, itemId: 'entry', action: 'COMPLETE', at: new Date('2026-09-09T09:50:00') });
  const latest = await DF.plans.forDate('u1', plan.date); const log = await DF.activityLogs.forPlanItem('u1', plan.id, task.id);
  assert.equal(latest.items[0].startTime, '09:00'); assert.equal(latest.items[0].endTime, '10:00'); assert.equal(log.actualDuration, 45); assert.equal(log.plannedDuration, 60);
});

test('paused time is excluded from actual activity duration', async () => {
  await DF.tasks.save(new DF.Task({ id: 'focus', userId: 'u1', title: 'Focus' }));
  await DF.plans.save(new DF.Plan({ id: 'pause-plan', userId: 'u1', date: '2026-09-09', items: [{ id: 'focus-entry', sourceId: 'focus', source: 'task', title: 'Focus', startTime: '09:00', endTime: '10:00', duration: 60, plannedDuration: 60, status: 'PLANNED' }] }));
  await DF.dailyFlow.perform({ userId: 'u1', date: '2026-09-09', itemId: 'focus-entry', action: 'START', at: new Date('2026-09-09T09:00:00') });
  await DF.dailyFlow.perform({ userId: 'u1', date: '2026-09-09', itemId: 'focus-entry', action: 'PAUSE', at: new Date('2026-09-09T09:20:00') });
  await DF.dailyFlow.perform({ userId: 'u1', date: '2026-09-09', itemId: 'focus-entry', action: 'START', at: new Date('2026-09-09T09:30:00') });
  await DF.dailyFlow.perform({ userId: 'u1', date: '2026-09-09', itemId: 'focus-entry', action: 'COMPLETE', at: new Date('2026-09-09T09:50:00') });
  const log = await DF.activityLogs.forPlanItem('u1', 'pause-plan', 'focus');
  assert.equal(log.pauseMinutes, 10);
  assert.equal(log.actualDuration, 40);
});

test('live execution continues across a new plan version', async () => {
  await DF.tasks.save(new DF.Task({ id: 'carry', userId: 'u1', title: 'Carry over' }));
  const item = { id: 'carry-v1', sourceId: 'carry', source: 'task', title: 'Carry over', startTime: '09:00', endTime: '10:00', duration: 60, plannedDuration: 60, status: 'PLANNED' };
  await DF.plans.save(new DF.Plan({ id: 'carry-plan-v1', userId: 'u1', date: '2026-09-09', version: 1, items: [item] }));
  await DF.dailyFlow.perform({ userId: 'u1', date: '2026-09-09', itemId: item.id, action: 'START', at: new Date('2026-09-09T09:05:00') });
  await DF.plans.save(new DF.Plan({ id: 'carry-plan-v2', userId: 'u1', date: '2026-09-09', version: 2, previousVersionId: 'carry-plan-v1', items: [{ ...item, id: 'carry-v2', status: 'STARTED' }] }));
  await DF.dailyFlow.perform({ userId: 'u1', date: '2026-09-09', itemId: 'carry-v2', action: 'COMPLETE', at: new Date('2026-09-09T09:35:00') });
  const records = await DF.activityLogs.forUser('u1');
  assert.equal(records.length, 1);
  assert.equal(records[0].actualDuration, 30);
});

test('skipped tasks stay out of today but remain eligible tomorrow', async () => {
  const task = await DF.tasks.save(new DF.Task({ id: 'skip-me', userId: 'u1', title: 'Skip me' }));
  const entry = { id: 'skip-entry', sourceId: task.id, source: 'task', title: task.title, startTime: '09:00', endTime: '09:30', duration: 30, plannedDuration: 30, status: 'PLANNED', type: 'FLEXIBLE' };
  await DF.plans.save(new DF.Plan({ id: 'skip-plan', userId: 'u1', date: '2026-09-09', items: [entry] }));
  await DF.dailyFlow.perform({ userId: 'u1', date: '2026-09-09', itemId: entry.id, action: 'SKIP', at: new Date('2026-09-09T09:00:00') });
  const updated = await DF.tasks.get(task.id);
  assert.equal(DF.schedulerEngine.generate({ date: '2026-09-09', tasks: [updated] }).items.length, 0);
  assert.equal(DF.schedulerEngine.generate({ date: '2026-09-10', tasks: [updated] }).items.length, 1);
});

test('completed and skipped routines are not reintroduced into the same day', async () => {
  const completed = new DF.Habit({ id: 'done-routine', title: 'Done', completions: ['2026-09-09'] });
  assert.equal(DF.schedulerEngine.generate({ date: '2026-09-09', habits: [completed] }).items.length, 0);
  const routine = await DF.habits.save(new DF.Habit({ id: 'skip-routine', userId: 'u1', title: 'Routine' }));
  const entry = { id: 'routine-entry', sourceId: routine.id, routineId: routine.id, source: 'routine', title: routine.title, startTime: '09:00', endTime: '09:30', duration: 30, status: 'PLANNED', type: 'SEMI_FIXED' };
  await DF.plans.save(new DF.Plan({ id: 'routine-plan', userId: 'u1', date: '2026-09-09', items: [entry] }));
  await DF.dailyFlow.perform({ userId: 'u1', date: '2026-09-09', itemId: entry.id, action: 'SKIP', at: new Date('2026-09-09T09:00:00') });
  const skipped = await DF.habits.get(routine.id);
  assert.equal(DF.schedulerEngine.generate({ date: '2026-09-09', habits: [skipped] }).items.length, 0);
  assert.equal(DF.schedulerEngine.generate({ date: '2026-09-10', habits: [skipped] }).items.length, 1);
});

test('completing a single-step routine from Live Flow records its day', async () => {
  const routine = await DF.habits.save(new DF.Habit({ id: 'single-routine', userId: 'u1', title: 'Stretch' }));
  const generated = DF.schedulerEngine.generate({ date: '2026-09-09', habits: [routine] });
  const plan = await DF.plans.save(new DF.Plan({ ...generated, id: 'single-routine-plan', userId: 'u1' }));
  await DF.dailyFlow.perform({ userId: 'u1', date: plan.date, itemId: plan.items[0].id, action: 'COMPLETE', at: new Date('2026-09-09T09:00:00') });
  assert.deepEqual((await DF.habits.get(routine.id)).completions, ['2026-09-09']);
});

test('declined fixed events and goal sessions stay out of the rebuilt day', async () => {
  const event = await DF.events.save(new DF.Event({ id: 'declined-event', userId: 'u1', title: 'Appointment', date: '2026-09-09', startTime: '09:00', endTime: '10:00' }));
  const entry = { id: 'event-entry', sourceId: event.id, source: 'event', title: event.title, startTime: event.startTime, endTime: event.endTime, duration: 60, status: 'PLANNED', type: 'FIXED', priority: 100 };
  await DF.plans.save(new DF.Plan({ id: 'event-plan', userId: 'u1', date: event.date, items: [entry] }));
  await DF.dailyFlow.perform({ userId: 'u1', date: event.date, itemId: entry.id, action: 'CANT_DO', at: new Date('2026-09-09T09:00:00') });
  assert.equal(DF.schedulerEngine.generate({ date: event.date, events: [await DF.events.get(event.id)] }).items.length, 0);
  const goal = new DF.Goal({ id: 'declined-goal', title: 'Study', weeklyTargetMinutes: 60 });
  const history = [new DF.ActivityLog({ source: 'goal', sourceId: goal.id, date: '2026-09-09', status: 'SKIPPED' })];
  assert.equal(DF.schedulerEngine.generate({ date: '2026-09-09', goals: [goal], history }).items.length, 0);
  assert.equal(DF.schedulerEngine.generate({ date: '2026-09-10', goals: [goal], history }).items.length, 1);
});

test('goal insights report the selected week rather than lifetime totals', () => {
  const goal = new DF.Goal({ id: 'goal', title: 'Goal', weeklyTargetMinutes: 120 });
  const logs = [
    new DF.ActivityLog({ source: 'goal', sourceId: goal.id, date: '2026-09-09', status: 'COMPLETED', actualDuration: 30 }),
    new DF.ActivityLog({ source: 'goal', sourceId: goal.id, date: '2026-09-01', status: 'COMPLETED', actualDuration: 90 })
  ];
  const progress = DF.dailyFlow.insights({ logs, goals: [goal], date: new Date(2026, 8, 9) }).goalMinutes[0];
  assert.equal(progress.minutes, 30);
});

test('untimed completions never fabricate duration insights', () => {
  const result = DF.dailyFlow.insights({ logs: [new DF.ActivityLog({ status: 'COMPLETED', plannedDuration: 45, actualDuration: 0, reason: 'Marked complete outside Live Flow' })] });
  assert.equal(result.completionRate, 100);
  assert.equal(result.plannedMinutes, 0);
  assert.equal(result.actualMinutes, 0);
  assert.equal(result.estimateVariance, 0);
});

test('date-only values remain local calendar dates', () => {
  assert.equal(DF.dates.dateKey('2026-01-02'), '2026-01-02');
  assert.equal(new DF.Habit({ frequency: 'weekdays' }).occursOn('2026-09-09'), true);
});

test('remembered sessions preserve lock state in persistent storage', async () => {
  const secured = await DF.crypto.hashPassword('correct horse'); const user = await DF.users.save(new DF.User({ id: 'u1', name: 'Ada', email: 'ada@example.com', passwordHash: secured.hash, salt: secured.salt }));
  DF.auth.start(user, true); DF.auth.lock(); DF.auth.currentUser = null; DF.auth.locked = false; await DF.auth.restore();
  assert.equal(DF.auth.currentUser.id, 'u1'); assert.equal(DF.auth.locked, true);
});

test('service worker caches the live-flow service and has explicit offline fallbacks', () => {
  const worker = fs.readFileSync(path.join(__dirname, '..', 'service-worker.js'), 'utf8');
  assert.match(worker, /daily-flow-service\.js/); assert.match(worker, /request\.mode === 'navigate'/); assert.match(worker, /Response\.error\(\)/);
});
