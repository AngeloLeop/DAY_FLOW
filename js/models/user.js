/**
 * User Model
 * Represents user profile, preferences, schedule settings
 */

(function (root) { root.DayFlow = root.DayFlow || {}; root.DayFlow.User = class User { constructor(data = {}) { const defaults = { wakeTime: '07:00', sleepTime: '22:00', workStart: '09:00', workEnd: '17:00', bufferMinutes: 5, autoSchedule: true, notifications: false, learningEnabled: true, theme: 'system' }; Object.assign(this, { id: data.id || crypto.randomUUID(), name: '', email: '', passwordHash: '', salt: '', onboarded: false, createdAt: new Date().toISOString(), ...data, preferences: { ...defaults, ...(data.preferences || {}) } }); } }; })(globalThis);
