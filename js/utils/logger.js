/**
 * Logger Utility
 * Centralized logging for debugging and error tracking
 */

(function (root) {
  const DF = root.DayFlow = root.DayFlow || {};
  const write = (level, args) => { if (level === 'debug' && !root.DAY_FLOW_DEBUG) return; (console[level] || console.log)(`[DAY FLOW]`, ...args); };
  DF.logger = Object.freeze({ debug: (...a) => write('debug', a), info: (...a) => write('info', a), warn: (...a) => write('warn', a), error: (...a) => write('error', a) });
  DF.errors = {
    installed: false,
    normalize(value) { return value instanceof Error ? value : new Error(typeof value === 'string' ? value : 'Unexpected application error'); },
    report(value, context = 'application') { const error = this.normalize(value); DF.logger.error(`${context}:`, error); return error; },
    install() {
      if (this.installed || typeof root.addEventListener !== 'function') return;
      root.addEventListener('error', event => this.report(event.error || event.message, 'uncaught error'));
      root.addEventListener('unhandledrejection', event => this.report(event.reason, 'unhandled promise rejection'));
      this.installed = true;
    },
    renderFatal(value, container = root.document?.getElementById('app')) {
      const error = this.report(value, 'bootstrap');
      if (!container || !root.document) return;
      const shell = root.document.createElement('main'); shell.className = 'fatal-error'; shell.setAttribute('role', 'alert');
      const heading = root.document.createElement('h1'); heading.textContent = 'DAY FLOW could not start';
      const detail = root.document.createElement('p'); detail.textContent = error.message;
      const action = root.document.createElement('button'); action.className = 'btn btn-primary'; action.textContent = 'Try again'; action.addEventListener('click', () => root.location.reload());
      shell.append(heading, detail, action); container.replaceChildren(shell);
    }
  };
})(globalThis);
