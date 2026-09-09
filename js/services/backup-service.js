/**
 * Backup & Restore Service
 * Safe export/import, validation, versioning, optional encryption
 */

(function (root) {
  const DF = root.DayFlow;
  DF.backup = {
    async create() { const data = {}; for (const store of DF.constants.STORES) data[store] = await new DF.BaseRepository(store).getAll(); return { format: 'day-flow-backup', version: DF.constants.APP_VERSION, schemaVersion: DF.constants.DB_VERSION, exportedAt: new Date().toISOString(), data }; },
    validate(value) { if (!DF.validation.record(value) || value.format !== 'day-flow-backup' || !DF.validation.record(value.data)) throw new Error('Invalid DAY FLOW backup'); if (Number(value.schemaVersion || 1) > DF.constants.DB_VERSION) throw new Error('This backup requires a newer DAY FLOW version'); for (const store of DF.constants.STORES) { const records = value.data[store] || []; if (!Array.isArray(records)) throw new Error(`Invalid ${store} data`); if (records.some(record => !DF.validation.record(record) || !record.id)) throw new Error(`Invalid ${store} record`); } return true; },
    async encrypt(value, passphrase) { this.validate(value); return DF.crypto.encryptJson(value, passphrase); },
    async decrypt(value, passphrase) { if (value?.format !== 'day-flow-encrypted-backup') return value; return DF.crypto.decryptJson(value, passphrase); },
    async restore(value, { confirmed = false } = {}) { this.validate(value); if (!confirmed) throw new Error('Restore requires explicit overwrite confirmation'); await DF.db.replaceAll(value.data); return true; },
    download(value) { const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `day-flow-${DF.dates.dateKey()}${value.format === 'day-flow-encrypted-backup' ? '-encrypted' : ''}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 0); }
  };
})(globalThis);
