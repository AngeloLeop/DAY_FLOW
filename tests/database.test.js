/**
 * Database Tests
 * IndexedDB initialization, migrations, CRUD operations
 */

const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const DF = require('./test-setup');

beforeEach(async () => { await DF.db.clearAll(); });

test('database constants define separate planned and actual stores', () => {
  assert.equal(DF.constants.DB_NAME, 'DAY_FLOW_DB');
  assert.ok(DF.constants.STORES.includes('plans'));
  assert.ok(DF.constants.STORES.includes('activityLogs'));
});

test('migrations create every store and declared index', () => {
  const stores = new Map();
  const makeStore = () => { const indexes = new Set(); return { indexNames: { contains: name => indexes.has(name) }, indexes, createIndex(name) { indexes.add(name); } }; };
  const db = { objectStoreNames: { contains: name => stores.has(name) }, createObjectStore(name) { const store = makeStore(); stores.set(name, store); return store; } };
  const transaction = { objectStore: name => stores.get(name) };
  DF.migrateDatabase(db, 0, transaction);
  assert.deepEqual([...stores.keys()], DF.constants.STORES);
  assert.ok(stores.get('users').indexes.has('email'));
  assert.ok(stores.get('activityLogs').indexes.has('planId'));
});

test('production database fails safely when IndexedDB is unavailable', async () => {
  DF.db.disableMemoryAdapterForTests();
  await assert.rejects(() => DF.db.open(), /IndexedDB is required/);
  DF.db.enableMemoryAdapterForTests();
});

test('repositories persist and isolate user records', async () => {
  await DF.tasks.save(new DF.Task({ userId: 'a', title: 'A' }));
  await DF.tasks.save(new DF.Task({ userId: 'b', title: 'B' }));
  assert.deepEqual((await DF.tasks.forUser('a')).map(x => x.title), ['A']);
});

test('repository updates and deletes a record', async () => {
  const saved = await DF.tasks.save(new DF.Task({ userId: 'a', title: 'Old' }));
  saved.title = 'New'; await DF.tasks.save(saved);
  assert.equal((await DF.tasks.get(saved.id)).title, 'New');
  await DF.tasks.delete(saved.id); assert.equal(await DF.tasks.get(saved.id), null);
});

test('base repository accepts a replaceable storage adapter', async () => {
  const calls = []; const adapter = { async run(store, mode, operation) { calls.push({ store, mode }); return operation({ memory: new Map([['x', { id: 'x', title: 'From adapter' }]]) }); } };
  const repository = new DF.BaseRepository('tasks', DF.Task, adapter);
  assert.equal((await repository.get('x')).title, 'From adapter');
  assert.deepEqual(calls, [{ store: 'tasks', mode: 'readonly' }]);
});
