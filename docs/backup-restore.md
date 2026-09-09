# DAY FLOW Backup & Restore

The backup service exports a versioned JSON envelope containing every declared object store. Users may optionally encrypt it with AES-256-GCM using a PBKDF2-SHA-256 derived key; the passphrase never leaves the device.

Import validates format, store shapes, and schema compatibility before requesting explicit overwrite confirmation. Restore replaces all stores in one IndexedDB transaction, so a failure aborts the whole operation. The test adapter provides equivalent snapshot rollback semantics.

Plain JSON exports remain available for portability and must be treated as sensitive. DAY FLOW cannot recover a forgotten encrypted-backup passphrase.
