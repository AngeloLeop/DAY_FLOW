/**
 * Base Repository
 * Abstract repository pattern for database operations
 */

(function (root) {
  const DF = root.DayFlow = root.DayFlow || {};
  DF.BaseRepository = class BaseRepository {
    constructor(storeName, Model = Object, database = DF.db) { if (!DF.constants.STORES.includes(storeName)) throw new Error(`Unknown data store: ${storeName}`); this.storeName = storeName; this.Model = Model; this.database = database; }
    async get(id) { const value = await this.database.run(this.storeName, 'readonly', s => s.memory ? s.memory.get(id) : s.get(id)); return value ? new this.Model(value) : null; }
    async getAll() { const values = await this.database.run(this.storeName, 'readonly', s => s.memory ? [...s.memory.values()] : s.getAll()); return values.map(v => new this.Model(v)); }
    async forUser(userId) { return (await this.getAll()).filter(item => item.userId === userId); }
    async save(value) { const record = this.Model === Object ? { ...value } : new this.Model(value); if (!record.id) throw new Error(`${this.storeName} records require an id`); await this.database.run(this.storeName, 'readwrite', s => { if (s.memory) { s.memory.set(record.id, structuredClone(record)); return record.id; } return s.put(record); }); return record; }
    async delete(id) { return this.database.run(this.storeName, 'readwrite', s => { if (s.memory) return s.memory.delete(id); return s.delete(id); }); }
    async clear() { return this.database.run(this.storeName, 'readwrite', s => { if (s.memory) return s.memory.clear(); return s.clear(); }); }
  };
})(globalThis);
