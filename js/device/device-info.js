/**
 * Device Information
 * Detects device capabilities, screen size, theme preference
 */

(function (root) { root.DayFlow.device = { get mobile() { return matchMedia('(max-width: 720px)').matches; }, get standalone() { return matchMedia('(display-mode: standalone)').matches; }, get darkMode() { return matchMedia('(prefers-color-scheme: dark)').matches; }, get online() { return navigator.onLine; } }; })(globalThis);
