/**
 * Device Permissions
 * Requests and tracks notification, storage, etc. permissions
 */

(function (root) { root.DayFlow.permissions = { async notification() { return root.DayFlow.notifications.request(); }, async persistentStorage() { return navigator.storage?.persist ? navigator.storage.persist() : false; }, async status(name) { try { return await navigator.permissions.query({ name }); } catch { return { state: 'unsupported' }; } } }; })(globalThis);
