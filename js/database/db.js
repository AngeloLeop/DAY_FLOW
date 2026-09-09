/**
 * IndexedDB Database Initialization
 * Creates database, handles schema versioning, migrations
 * Database name: DAY_FLOW_DB
 */

(function (root) {
  const DF = root.DayFlow = root.DayFlow || {};
  const memory = new Map();
  DF.db = {
    connection: null,
    opening: null,
    testMemoryEnabled: false,
    enableMemoryAdapterForTests() { this.close(); memory.clear(); this.testMemoryEnabled = true; },
    disableMemoryAdapterForTests() { this.close(); memory.clear(); this.testMemoryEnabled = false; },
    async open() {
      if (this.connection) return this.connection;
      if (this.testMemoryEnabled) { this.connection = { memory: true }; return this.connection; }
      if (!root.indexedDB) throw new Error('IndexedDB is required. DAY FLOW cannot safely persist data in this browser.');
      if (this.opening) return this.opening;
      this.opening = new Promise((resolve, reject) => {
        let settled = false;
        const request = root.indexedDB.open(DF.constants.DB_NAME, DF.constants.DB_VERSION);
        request.onupgradeneeded = event => DF.migrateDatabase(request.result, event.oldVersion, request.transaction);
        request.onsuccess = () => {
          const database = request.result;
          if (settled) { database.close(); return; }
          settled = true;
          database.onversionchange = () => { database.close(); if (this.connection === database) this.connection = null; };
          resolve(database);
        };
        request.onerror = () => { if (!settled) { settled = true; reject(request.error || new Error('Unable to open DAY_FLOW_DB')); } };
        request.onblocked = () => { if (!settled) { settled = true; reject(new Error('Database upgrade is blocked by another DAY FLOW tab')); } };
      });
      try { this.connection = await this.opening; return this.connection; }
      finally { this.opening = null; }
    },
    async run(storeName, mode, operation) {
      const db = await this.open();
      if (db.memory) {
        const store = memory.get(storeName) || new Map(); memory.set(storeName, store);
        return operation({ memory: store });
      }
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode); const store = tx.objectStore(storeName);
        let operationResult; let result;
        try { operationResult = operation(store); } catch (error) { reject(error); return; }
        if (operationResult && 'onsuccess' in operationResult) { operationResult.onsuccess = () => { result = operationResult.result; }; operationResult.onerror = () => reject(operationResult.error); }
        else result = operationResult;
        tx.oncomplete = () => resolve(result); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error || new Error('Database transaction aborted'));
      });
    },
    async replaceAll(recordsByStore) {
      const db = await this.open(); const storeNames = DF.constants.STORES;
      if (db.memory) {
        const snapshot = new Map([...memory].map(([name, records]) => [name, new Map(records)]));
        try { for (const name of storeNames) { const records = new Map(); for (const record of recordsByStore[name] || []) records.set(record.id, structuredClone(record)); memory.set(name, records); } }
        catch (error) { memory.clear(); for (const [name, records] of snapshot) memory.set(name, records); throw error; }
        return;
      }
      await new Promise((resolve, reject) => {
        const transaction = db.transaction(storeNames, 'readwrite');
        try { for (const name of storeNames) { const store = transaction.objectStore(name); store.clear(); for (const record of recordsByStore[name] || []) store.put(record); } }
        catch (error) { transaction.abort(); reject(error); return; }
        transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error); transaction.onabort = () => reject(transaction.error || new Error('Restore transaction aborted'));
      });
    },
    async clearAll() { const db = await this.open(); if (db.memory) { memory.clear(); return; } await Promise.all(DF.constants.STORES.map(name => this.run(name, 'readwrite', s => s.clear()))); },
    close() { if (this.connection?.close) this.connection.close(); this.connection = null; this.opening = null; }
  };
})(globalThis);
