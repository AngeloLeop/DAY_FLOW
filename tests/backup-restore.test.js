/**
 * Backup & Restore Tests
 * Export/import validation, versioning, transaction safety
 */

const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const DF = require('./test-setup');

beforeEach(async () => { await DF.db.clearAll(); });

test('backup round-trip restores records', async () => {
  await DF.tasks.save(new DF.Task({ userId: 'u1', title: 'Keep me' })); const backup = await DF.backup.create();
  await DF.db.clearAll(); await DF.backup.restore(backup, { confirmed: true });
  assert.equal((await DF.tasks.forUser('u1'))[0].title, 'Keep me');
});

test('invalid backups are rejected before data changes', async () => {
  await assert.rejects(() => DF.backup.restore({ data: {} }), /Invalid DAY FLOW backup/);
});

test('valid backups require explicit overwrite confirmation', async () => {
  const backup = await DF.backup.create();
  await assert.rejects(() => DF.backup.restore(backup), /explicit overwrite confirmation/);
});

test('encrypted backups round-trip and reject the wrong passphrase', async () => {
  const backup = await DF.backup.create(); const encrypted = await DF.backup.encrypt(backup, 'a strong passphrase');
  assert.equal(encrypted.format, 'day-flow-encrypted-backup');
  assert.deepEqual(await DF.backup.decrypt(encrypted, 'a strong passphrase'), backup);
  await assert.rejects(() => DF.backup.decrypt(encrypted, 'wrong passphrase'), /Unable to decrypt/);
});

test('backups from newer schemas are rejected', async () => {
  const backup = await DF.backup.create(); backup.schemaVersion = DF.constants.DB_VERSION + 1;
  assert.throws(() => DF.backup.validate(backup), /newer DAY FLOW version/);
});

test('corrupt records are rejected before restore starts', async () => {
  const backup = await DF.backup.create(); backup.data.tasks.push({ title: 'Missing id' });
  assert.throws(() => DF.backup.validate(backup), /Invalid tasks record/);
});
