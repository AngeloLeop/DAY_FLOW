/**
 * Storage Service
 * Abstraction layer over IndexedDB for data persistence
 */

(function (root) {
  const DF = root.DayFlow;
  DF.storageService = {
    database: DF.db,
    configure(database) { if (!database || typeof database.run !== 'function') throw new TypeError('Storage adapter must implement run()'); this.database = database; return this; },
    async init() { return this.database.open(); },
    createRepository(storeName, Model = Object) { return new DF.BaseRepository(storeName, Model, this.database); },
    repository(name) { const repository = DF[name]; if (!repository) throw new Error(`Unknown repository: ${name}`); return repository; }
  };
})(globalThis);
