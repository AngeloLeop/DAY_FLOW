/**
 * Cryptography Utilities
 * Password hashing, secure storage, Web Crypto API wrapper
 */

(function (root) {
  const bytesToBase64 = bytes => btoa(String.fromCharCode(...bytes));
  const base64ToBytes = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));
  root.DayFlow = root.DayFlow || {};
  root.DayFlow.crypto = {
    random(bytes = 16) { const value = new Uint8Array(bytes); crypto.getRandomValues(value); return bytesToBase64(value); },
    async hashPassword(password, salt = this.random()) { const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']); const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: base64ToBytes(salt), iterations: 120000, hash: 'SHA-256' }, key, 256); return { hash: bytesToBase64(new Uint8Array(bits)), salt }; },
    async verifyPassword(password, hash, salt) { const candidate = await this.hashPassword(password, salt); if (candidate.hash.length !== hash.length) return false; let diff = 0; for (let i = 0; i < hash.length; i++) diff |= candidate.hash.charCodeAt(i) ^ hash.charCodeAt(i); return diff === 0; },
    async encryptionKey(passphrase, salt, usage) { const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']); return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 180000, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, [usage]); },
    async encryptJson(value, passphrase) { if (String(passphrase).length < 8) throw new Error('Backup passphrase must be at least 8 characters'); const salt = crypto.getRandomValues(new Uint8Array(16)); const iv = crypto.getRandomValues(new Uint8Array(12)); const key = await this.encryptionKey(passphrase, salt, 'encrypt'); const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(value))); return { format: 'day-flow-encrypted-backup', version: 1, kdf: 'PBKDF2-SHA-256', cipher: 'AES-256-GCM', salt: bytesToBase64(salt), iv: bytesToBase64(iv), data: bytesToBase64(new Uint8Array(ciphertext)) }; },
    async decryptJson(value, passphrase) { try { const salt = base64ToBytes(value.salt); const iv = base64ToBytes(value.iv); const key = await this.encryptionKey(passphrase, salt, 'decrypt'); const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, base64ToBytes(value.data)); return JSON.parse(new TextDecoder().decode(plaintext)); } catch { throw new Error('Unable to decrypt backup. Check the passphrase and file integrity.'); } }
  };
})(globalThis);
