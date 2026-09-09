/**
 * Scheduler Engine
 * Core scheduling logic: time calculation, availability, constraints
 * Priority levels: 0-20 OPTIONAL, 21-40 LOW, 41-60 NORMAL, 61-80 HIGH, 81-99 VERY_HIGH, 100 CRITICAL
 * Types: FIXED, SEMI_FIXED, FLEXIBLE, OPTIONAL
 */

(function (root) {
  const DF = root.DayFlow;
  DF.schedulerEngine = {
    findSlot(items, earliest, duration, dayEnd, buffer) { let cursor = earliest; for (const item of [...items].sort((a, b) => DF.dates.timeToMinutes(a.startTime) - DF.dates.timeToMinutes(b.startTime))) { const start = DF.dates.timeToMinutes(item.startTime); const end = DF.dates.timeToMinutes(item.endTime); if (cursor + duration + buffer <= start) break; if (cursor < end + buffer) cursor = end + buffer; } return cursor + duration <= dayEnd ? cursor : null; },
    generate({ date = new Date(), tasks = [], habits = [], events = [], preferences = {}, protectedItems = [], history = [] }) {
      const dateKey = DF.dates.dateKey(date); const wake = DF.dates.timeToMinutes(preferences.wakeTime || '07:00'); const sleep = DF.dates.timeToMinutes(preferences.sleepTime || '22:00'); const startAfter = Math.max(wake, preferences.currentTime ? DF.dates.timeToMinutes(preferences.currentTime) : wake); const buffer = Math.max(0, Number(preferences.bufferMinutes || 0));
      const protectedIds = new Set(protectedItems.map(item => item.sourceId)); const completedIds = tasks.filter(task => task.status === 'COMPLETED').map(task => task.id); const fixed = events.filter(event => !protectedIds.has(event.id)).map(event => ({ ...event, sourceId: event.id, source: 'event', type: 'FIXED', priority: 100 }));
      const protectedFixed = protectedItems.map(item => ({ ...item, originalType: item.type, type: 'FIXED', protected: true })); const occupied = DF.conflicts.resolve([...protectedFixed, ...fixed], preferences.sleepTime || '22:00').items;
      const typeOrder = { FIXED: 0, SEMI_FIXED: 1, FLEXIBLE: 2, OPTIONAL: 3 }; const candidates = DF.optimizer.rank([...tasks.filter(task => !protectedIds.has(task.id) && !['COMPLETED', 'CANCELLED'].includes(task.status) && (!task.dueDate || task.dueDate <= dateKey)), ...habits.filter(habit => !protectedIds.has(habit.id) && (habit.occursOn ? habit.occursOn(date) : true))], history).sort((a, b) => (typeOrder[a.type || 'FLEXIBLE'] - typeOrder[b.type || 'FLEXIBLE']) || (b.priority || 0) - (a.priority || 0));
      const items = [...occupied]; const unscheduled = []; const explanations = []; const scheduledIds = new Set(completedIds);
      for (const candidate of DF.dependencies.sort(candidates)) {
        const unmet = (candidate.dependencies || []).filter(id => !scheduledIds.has(id)); if (unmet.length) { unscheduled.push({ sourceId: candidate.id, title: candidate.title, reason: 'UNMET_DEPENDENCY', dependencies: unmet }); continue; }
        const duration = Math.max(5, Number(candidate.duration) || 30); const preferred = candidate.preferredTime ? DF.dates.timeToMinutes(candidate.preferredTime) : startAfter; const earliest = Math.max(startAfter, preferred); const start = this.findSlot(items, earliest, duration, sleep, buffer);
        if (start === null) { unscheduled.push({ sourceId: candidate.id, title: candidate.title, reason: 'NO_AVAILABLE_WINDOW', optional: candidate.type === 'OPTIONAL' || candidate.priority <= 20 }); continue; }
        const entry = { id: crypto.randomUUID(), sourceId: candidate.id, source: candidate instanceof DF.Habit ? 'habit' : 'task', title: candidate.title, startTime: DF.dates.minutesToTime(start), endTime: DF.dates.minutesToTime(start + duration), duration, priority: candidate.priority, type: candidate.type || 'FLEXIBLE', status: 'PLANNED' }; items.push(entry); scheduledIds.add(candidate.id); explanations.push({ sourceId: candidate.id, message: `${candidate.title} scheduled at ${entry.startTime} for ${duration} minutes based on priority ${candidate.priority || 0}.` });
      }
      return new DF.Plan({ date: dateKey, items: items.map(item => item.originalType ? { ...item, type: item.originalType } : item).sort((a, b) => DF.dates.timeToMinutes(a.startTime) - DF.dates.timeToMinutes(b.startTime)), unscheduled, explanations });
    },
    reschedule({ existingPlan, now = new Date(), ...input }) {
      const current = now.getHours() * 60 + now.getMinutes(); const protectedItems = existingPlan.items.filter(item => ['STARTED', 'COMPLETED'].includes(item.status) || DF.dates.timeToMinutes(item.startTime) <= current);
      const plan = this.generate({ ...input, protectedItems, preferences: { ...(input.preferences || {}), currentTime: DF.dates.minutesToTime(current) } }); plan.previousVersionId = existingPlan.id; return plan;
    }
  };
})(globalThis);
