/**
 * Database Migrations
 * Schema versioning and migration logic for IndexedDB
 */

(function (root) {
  const DF = root.DayFlow = root.DayFlow || {};
  const definitions = Object.freeze({
    users: { indexes: { email: { keyPath: 'email', unique: true } } },
    tasks: { indexes: { userId: { keyPath: 'userId' }, status: { keyPath: 'status' }, dueDate: { keyPath: 'dueDate' } } },
    habits: { indexes: { userId: { keyPath: 'userId' }, status: { keyPath: 'status' } } },
    events: { indexes: { userId: { keyPath: 'userId' }, status: { keyPath: 'status' }, date: { keyPath: 'date' } } },
    goals: { indexes: { userId: { keyPath: 'userId' }, status: { keyPath: 'status' } } },
    plans: { indexes: { userId: { keyPath: 'userId' }, date: { keyPath: 'date' }, userDate: { keyPath: ['userId', 'date'] } } },
    activityLogs: { indexes: { userId: { keyPath: 'userId' }, planId: { keyPath: 'planId' }, date: { keyPath: 'date' } } },
    settings: { indexes: { userId: { keyPath: 'userId' } } }
  });

  function ensureSchema(db, transaction) {
    for (const [name, definition] of Object.entries(definitions)) {
      const store = db.objectStoreNames.contains(name)
        ? transaction.objectStore(name)
        : db.createObjectStore(name, { keyPath: 'id' });
      for (const [indexName, options] of Object.entries(definition.indexes)) {
        if (!store.indexNames.contains(indexName)) store.createIndex(indexName, options.keyPath, { unique: Boolean(options.unique) });
      }
    }
  }

  DF.databaseSchema = definitions;
  DF.databaseMigrations = Object.freeze([
    { version: 1, up: ensureSchema },
    { version: 2, up: ensureSchema }
  ]);
  DF.migrateDatabase = function (db, oldVersion, transaction) {
    if (!transaction) throw new Error('An IndexedDB upgrade transaction is required');
    for (const migration of DF.databaseMigrations) if (migration.version > oldVersion) migration.up(db, transaction);
  };
})(globalThis);
