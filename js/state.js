/**
 * Application State Manager
 * Centralized state management, event bus
 */

(function (root) {
  const DF = root.DayFlow = root.DayFlow || {};
  const listeners = new Map(); const data = { screen: 'login', selectedDate: new Date(), loading: false, initialized: false };
  const emit = (key, value, previous) => {
    for (const listener of [...(listeners.get(key) || []), ...(listeners.get('*') || [])]) {
      try { listener(value, { key, previous }); } catch (error) { DF.errors?.report(error, `state subscriber (${key})`); }
    }
  };
  DF.state = {
    get(key) { return key === undefined ? { ...data } : data[key]; },
    set(key, value) { if (!Object.prototype.hasOwnProperty.call(data, key)) throw new Error(`Unknown state key: ${key}`); const previous = data[key]; if (Object.is(previous, value)) return value; data[key] = value; emit(key, value, previous); return value; },
    update(values) { for (const [key, value] of Object.entries(values)) this.set(key, value); return this.get(); },
    on(key, listener) { if (typeof listener !== 'function') throw new TypeError('State listener must be a function'); const group = listeners.get(key) || new Set(); group.add(listener); listeners.set(key, group); return () => group.delete(listener); }
  };
})(globalThis);
