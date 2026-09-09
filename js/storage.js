/**
 * Legacy storage facade
 * Maintained for compatibility; core logic moved to database/
 */

(function (root) { root.DayFlowStorage = { init: () => root.DayFlow.storageService.init(), get: (store, id) => new root.DayFlow.BaseRepository(store).get(id), save: (store, value) => new root.DayFlow.BaseRepository(store).save(value), remove: (store, id) => new root.DayFlow.BaseRepository(store).delete(id) }; })(globalThis);
