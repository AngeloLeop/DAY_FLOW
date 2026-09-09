# DAY FLOW

**Manage Your Time. Live Your Day.**

Offline-first intelligent daily scheduling application. No server. No external dependencies. All data stored locally.

## Technology contract

- HTML, CSS, and vanilla JavaScript
- IndexedDB with versioned migrations
- Service Worker and PWA APIs
- No browser framework, CDN, tracking, advertising, server, or external AI API in V1

Version 1.1 is a complete local-first release with account/app locking, onboarding, tasks, ordered routines, protected fixed events, goal-driven time allocation, deterministic scheduling and adaptive replanning, interactive Live Flow, recoverable plan history, real-data insights, optional notifications, encrypted backup/restore, and installable offline PWA support.

The Today experience is organized around the current moment: it shows what is happening now, what comes next, important upcoming blocks, and remaining capacity. Starting, pausing, completing, skipping, extending, or rejecting an activity records actual behavior separately from its original planned values. Replanning creates a new plan version and explains what was protected, moved, or deferred.

## Getting Started

```bash
# Clone repository
git clone https://github.com/AngeloLeop/DAY_FLOW.git
cd DAY_FLOW

# Serve locally (e.g., using Python)
python3 -m http.server 8000 --bind 0.0.0.0

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
