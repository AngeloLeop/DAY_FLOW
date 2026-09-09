# DAY FLOW Security & Privacy

## Current controls

- Accounts and sessions are local to one browser profile.
- Passwords are derived with PBKDF2-SHA-256, a random salt, and 120,000 iterations through Web Crypto. Plaintext passwords are not persisted.
- Email addresses are unique at both the authentication and database-index layers.
- Application rendering uses DOM creation and `textContent`; application code does not use `innerHTML` or `eval()`.
- Repository records are checked against the current user before destructive UI operations.
- There is no analytics, advertising SDK, CDN, remote authentication, or external AI call.
- Startup fails visibly if IndexedDB is unavailable instead of silently using volatile storage.

## Offline-authentication limitations

Local authentication protects access through the DAY FLOW UI; it is not equivalent to operating-system disk encryption. A person or extension with access to the browser profile may inspect IndexedDB. Login attempts are temporarily throttled and users can manually lock the app. Password recovery, cross-device identity, multi-factor authentication, and operating-system-backed key storage are intentionally unavailable in the offline V1 model.

Backups can be protected with authenticated AES-256-GCM encryption. Plain JSON export is intentionally available for portability and must be treated as sensitive because it includes local account-verification material and schedule data.
