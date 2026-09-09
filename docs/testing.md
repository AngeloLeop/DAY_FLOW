# DAY FLOW Testing Strategy

The automated suite uses Node's built-in test runner only; Node.js is development tooling and is not required by the browser application.

```bash
npm test
```

## Current automated coverage

- Database identity, planned/actual store separation, schema migrations, and fail-safe startup
- Repository CRUD, user isolation, and replaceable adapter injection
- State publication, unsubscribe behavior, and declared-key validation
- Local account creation, password verification, and weak/invalid credential rejection
- Dependency ordering and circular-dependency detection
- Normal/late scheduling, overdue/future selection, fixed conflicts, overload, dependencies, optional removal, protected current/completed work, mid-day regeneration, version links, and learned durations
- Backup structural/schema validation, explicit confirmation, atomic round-trip recovery, and encrypted backup authentication
- App locking and repeated-login throttling

Browser verification covers bootstrap, account creation, onboarding, navigation, IndexedDB persistence, console errors, accessibility, and offline reload.

Before packaging a release, syntax, manifest parsing, the complete automated suite, browser navigation/forms, console errors, WCAG A/AA automation, service-worker installation, and offline reload are verified.
