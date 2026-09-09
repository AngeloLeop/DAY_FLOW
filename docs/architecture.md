# DAY FLOW Architecture

DAY FLOW is a browser-only, offline-first application built with HTML, CSS, vanilla JavaScript, IndexedDB, Service Worker, and PWA APIs. The shipped application has no Node.js runtime, framework, CDN, analytics, advertising, or external AI dependency. Node.js is used only to execute the development test suite.

## Dependency direction

```text
UI (index.html templates and js/app.js)
  ↓
Services (js/services, router, state)
  ↓
DAY FLOW Engine (js/engine)
  ↓
Repositories (js/repositories)
  ↓
IndexedDB adapter (js/database)
```

Engine modules contain no DOM access. Repositories accept a database adapter through their constructor; a future `ApiRepository` or alternative adapter can therefore be introduced without moving scheduling rules into the UI.

## Foundation lifecycle

`index.html` loads classic scripts in explicit dependency order and starts `js/app.js` after the DOM is available. Bootstrap installs global error reporting, opens the database, restores the local session, initializes the router, binds delegated UI events, and registers the service worker. Initialization is idempotent and renders a safe error screen if required storage cannot start.

The hash router owns template mounting but receives authentication guards, navigation rendering, and route callbacks from the application. The state store accepts only declared keys and returns unsubscribe functions for every subscriber.

## Repository structure

The existing `js/` module layout remains authoritative. Top-level `assets/`, `screens/`, `components/`, `scripts/`, `backend/`, `api/`, `database/`, and `deploy/` directories are reserved by the project contract. No browser module has been duplicated into those directories.

## V1 boundary

V1 is browser-only and fully usable without a backend. `backend/`, `api/`, `database/`, and `deploy/` remain reserved extension points; no remote sync or server is required. Notifications are scheduled while the application session is active because browsers do not provide a portable local alarm API without a push service.
