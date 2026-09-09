/**
 * Authentication Service
 * Local authentication, session management, app lock
 * No external OAuth or server dependencies
 */

(function (root) {
  const DF = root.DayFlow; const SESSION_KEY = 'dayflow-session'; const LOCK_KEY = 'dayflow-locked'; const attempts = new Map();
  DF.auth = {
    currentUser: null,
    locked: false,
    async restore() { const id = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY); this.currentUser = id ? await DF.users.get(id) : null; this.locked = Boolean(this.currentUser && sessionStorage.getItem(LOCK_KEY) === '1'); return this.currentUser; },
    async signup(data) { if (!DF.validation.email(data.email)) throw new Error('Enter a valid email address'); if (!DF.validation.password(data.password)) throw new Error('Password must be at least 8 characters'); if (await DF.users.byEmail(data.email)) throw new Error('An account with that email already exists'); const secured = await DF.crypto.hashPassword(data.password); const user = await DF.users.save(new DF.User({ name: DF.validation.required(data.name, 'Name'), email: data.email.trim().toLowerCase(), passwordHash: secured.hash, salt: secured.salt })); return this.start(user, false); },
    async login(identifier, password, remember = false) { const users = await DF.users.getAll(); const value = String(identifier).trim().toLowerCase(); const attempt = attempts.get(value) || { count: 0, blockedUntil: 0 }; if (attempt.blockedUntil > Date.now()) throw new Error('Too many login attempts. Try again shortly.'); const user = users.find(x => x.email.toLowerCase() === value || x.name.toLowerCase() === value); if (!user || !(await DF.crypto.verifyPassword(password, user.passwordHash, user.salt))) { attempt.count++; if (attempt.count >= 5) { attempt.count = 0; attempt.blockedUntil = Date.now() + 30000; } attempts.set(value, attempt); throw new Error('Invalid email or password'); } attempts.delete(value); return this.start(user, remember); },
    start(user, remember) { this.logout(); this.currentUser = user; this.locked = false; (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, user.id); return user; },
    lock() { if (!this.currentUser) return false; this.locked = true; sessionStorage.setItem(LOCK_KEY, '1'); return true; },
    async unlock(password) { if (!this.currentUser || !(await DF.crypto.verifyPassword(password, this.currentUser.passwordHash, this.currentUser.salt))) throw new Error('Invalid password'); this.locked = false; sessionStorage.removeItem(LOCK_KEY); return true; },
    logout() { localStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(LOCK_KEY); this.currentUser = null; this.locked = false; },
    requireUser() { if (!this.currentUser) throw new Error('Authentication required'); if (this.locked) throw new Error('App is locked'); return this.currentUser; }
  };
})(globalThis);
