const { test } = require('node:test');
const assert = require('node:assert/strict');
const DF = require('./test-setup');

test('state publishes changes and supports unsubscribe', () => {
  const changes = []; const unsubscribe = DF.state.on('loading', (value, metadata) => changes.push({ value, previous: metadata.previous }));
  DF.state.set('loading', true); unsubscribe(); DF.state.set('loading', false);
  assert.deepEqual(changes, [{ value: true, previous: false }]);
});

test('state rejects unknown keys', () => {
  assert.throws(() => DF.state.set('typo', true), /Unknown state key/);
});

test('all required lifecycle statuses are available', () => {
  assert.deepEqual(Object.values(DF.constants.STATUS), ['PLANNED', 'STARTED', 'COMPLETED', 'SKIPPED', 'MISSED', 'CANCELLED', 'RESCHEDULED', 'PARTIAL']);
});
