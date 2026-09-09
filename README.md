# DAY FLOW

**Manage Your Time. Live Your Day.**

Offline-first intelligent daily scheduling application. No server. No external dependencies. All data stored locally.

## Technology contract

- HTML, CSS, and vanilla JavaScript
- IndexedDB with versioned migrations
- Service Worker and PWA APIs
- No browser framework, CDN, tracking, advertising, server, or external AI API in V1

V1 is a complete local-first release with account/app locking, onboarding, tasks, routines, fixed events, goals, deterministic scheduling and rescheduling, Today/Plan views, history-backed insights, optional notifications, encrypted backup/restore, and installable offline PWA support.

## Getting Started

```bash
# Clone repository
git clone https://github.com/AngeloLeop/DAY_FLOW.git
cd DAY_FLOW

# Serve locally (e.g., using Python)
python -m http.server 8000

# Visit http://localhost:8000
```

The browser application has no Node.js runtime dependency. Node.js 20 or newer is used only for development tests:

```bash
npm test
```

## Architecture

See [docs/architecture.md](docs/architecture.md) for detailed architecture.

```
UI → Services → Engine → Repository → IndexedDB
```

## Development Phases

See [docs/roadmap.md](docs/roadmap.md)

## Security & Privacy

See [docs/security.md](docs/security.md)

## License

MIT
