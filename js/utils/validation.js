/**
 * Validation Utilities
 * Input validation, data sanitization, security checks
 */

(function (root) {
  const clean = value => String(value == null ? '' : value).replace(/[<>]/g, '').trim();
  root.DayFlow = root.DayFlow || {};
  root.DayFlow.validation = {
    sanitize: clean,
    email(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim()); },
    password(value) { return String(value).length >= 8; },
    required(value, name = 'Value') { const result = clean(value); if (!result) throw new Error(`${name} is required`); return result; },
    number(value, { min = -Infinity, max = Infinity, fallback = 0 } = {}) { const n = Number(value); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback; },
    record(value) { return Boolean(value && typeof value === 'object' && !Array.isArray(value)); }
  };
})(globalThis);
