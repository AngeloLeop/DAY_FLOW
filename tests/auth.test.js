/**
 * Authentication Tests
 * Login, signup, session management, password hashing
 */

const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const DF = require('./test-setup');

beforeEach(async () => { await DF.db.clearAll(); DF.auth.logout(); });

test('creates and authenticates a local account without storing plaintext password', async () => {
  const user = await DF.auth.signup({ name: 'Ada', email: 'ada@example.com', password: 'correct horse' });
  assert.notEqual(user.passwordHash, 'correct horse'); DF.auth.logout();
  assert.equal((await DF.auth.login('ada@example.com', 'correct horse')).id, user.id);
});

test('rejects weak passwords and invalid credentials', async () => {
  await assert.rejects(() => DF.auth.signup({ name: 'Ada', email: 'ada@example.com', password: 'short' }), /8 characters/);
  await assert.rejects(() => DF.auth.login('nobody@example.com', 'password'), /Invalid/);
});

test('locks and unlocks an active local session', async () => {
  await DF.auth.signup({ name: 'Ada', email: 'ada@example.com', password: 'correct horse' });
  assert.equal(DF.auth.lock(), true); assert.equal(DF.auth.locked, true);
  await assert.rejects(() => DF.auth.unlock('wrong password'), /Invalid password/);
  await DF.auth.unlock('correct horse'); assert.equal(DF.auth.locked, false);
});

test('temporarily throttles repeated failed login attempts', async () => {
  for (let attempt = 0; attempt < 5; attempt++) await assert.rejects(() => DF.auth.login('attacker@example.com', 'wrong'), /Invalid/);
  await assert.rejects(() => DF.auth.login('attacker@example.com', 'wrong'), /Too many login attempts/);
});
