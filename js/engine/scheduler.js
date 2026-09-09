/** Deterministic, explainable DAY FLOW scheduling and adaptive replanning engine. */
(function (root) {
  const DF = root.DayFlow;
  const terminal = new Set(['COMPLETED', 'CANCELLED']);
  const typeOrder = { FIXED: 0, SEMI_FIXED: 1, FLEXIBLE: 2, OPTIONAL: 3 };
  const minutes = value => DF.dates.timeToMinutes(value);
  const byStart = (a, b) => minutes(a.startTime) - minutes(b.startTime) || String(a.sourceId).localeCompare(String(b.sourceId));
  const localDate = value => { const [year, month, day] = String(value).split('-').map(Number); return new Date(year, month - 1, day); };
  const dateInCurrentWeek = (date, target) => { const start = localDate(date); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); const end = new Date(start); end.setDate(end.getDate() + 7); const value = localDate(target); return value >= start && value < end; };

  function expandRoutines(habits) {
    const output = [];
    for (const habit of habits) {
      if (!habit.routineItems?.length) { output.push({ ...habit, sourceId: habit.id, routineId: habit.id, source: 'routine' }); continue; }
      let previous = '';
      habit.routineItems.forEach((part, index) => {
        const id = `${habit.id}:${part.id || index}`; const required = part.required !== false;
        output.push({ ...habit, ...part, id, sourceId: id, routineId: habit.id, source: 'routine', title: `${habit.title} · ${part.title}`, duration: Number(part.duration) || 5, type: required ? (habit.type || 'SEMI_FIXED') : 'OPTIONAL', dependencies: previous ? [previous] : [] });
        if (required) previous = id;
      });
    }
    return output;
  }

  function goalSessions(goals, history, dateKey) {
    return goals.filter(goal => goal.status !== 'COMPLETED').flatMap(goal => {
      if (history.some(log => log.source === 'goal' && log.sourceId === goal.id && log.date === dateKey && ['SKIPPED', 'MISSED'].includes(log.status))) return [];
      const completed = history.filter(log => log.source === 'goal' && log.sourceId === goal.id && log.status === 'COMPLETED' && dateInCurrentWeek(dateKey, log.date)).reduce((sum, log) => sum + Number(log.actualDuration || 0), 0);
      const remaining = Math.max(0, Number(goal.weeklyTargetMinutes || 0) - completed); if (!remaining) return [];
      return [{ id: `goal-session:${goal.id}`, sourceId: goal.id, source: 'goal', goalId: goal.id, title: goal.title, duration: Math.min(Number(goal.sessionMinutes || 30), remaining), priority: goal.priority || 60, type: 'FLEXIBLE', dueDate: goal.deadline, preferredTime: goal.preferredTime, goalRemainingMinutes: remaining }];
    });
  }

  DF.schedulerEngine = {
    findSlot(items, earliest, duration, dayEnd, buffer = 0, latest = dayEnd) {
      let cursor = earliest;
      for (const item of [...items].sort(byStart)) { const start = minutes(item.startTime); const end = minutes(item.endTime); if (cursor + duration + buffer <= start) break; if (cursor < end + buffer) cursor = end + buffer; }
      return cursor + duration <= Math.min(dayEnd, latest) ? cursor : null;
    },
    freeWindows(items, start, end, minimum = 10) {
      const windows = []; let cursor = start;
      for (const item of [...items].sort(byStart)) { const itemEnd = minutes(item.endTime); if (itemEnd <= start) continue; const itemStart = Math.max(start, minutes(item.startTime)); if (itemStart >= end) break; if (itemStart - cursor >= minimum) windows.push({ startTime: DF.dates.minutesToTime(cursor), endTime: DF.dates.minutesToTime(itemStart), duration: itemStart - cursor }); cursor = Math.min(end, Math.max(cursor, itemEnd)); }
      if (end - cursor >= minimum) windows.push({ startTime: DF.dates.minutesToTime(cursor), endTime: DF.dates.minutesToTime(end), duration: end - cursor }); return windows;
    },
    explanation(candidate, entry, dateKey) {
      if (candidate.learnedDuration) return `Planned ${candidate.title} for ${entry.duration} minutes using ${candidate.historicalSamples} local completion records.`;
      if (candidate.goalId) return `Scheduled ${candidate.title} to make progress toward its weekly goal target.`;
      if (candidate.dueDate && candidate.dueDate <= dateKey) return `Scheduled ${candidate.title} to protect its deadline.`;
      if (candidate.preferredTime) return `Scheduled ${candidate.title} near its preferred time at ${DF.dates.formatTime(entry.startTime)}.`;
      return `Scheduled ${candidate.title} at the earliest realistic opening based on its ${String(candidate.type || 'FLEXIBLE').toLowerCase().replace('_', '-')} constraint and priority.`;
    },
    generate({ date = new Date(), tasks = [], habits = [], events = [], goals = [], preferences = {}, protectedItems = [], history = [], trigger = 'INITIAL_PLAN' }) {
      const dateKey = DF.dates.dateKey(date); const wake = minutes(preferences.wakeTime || '07:00'); const sleep = minutes(preferences.sleepTime || '22:00'); const startAfter = Math.max(wake, preferences.currentTime ? minutes(preferences.currentTime) : wake); const buffer = Math.max(0, Number(preferences.bufferMinutes || 0));
      const protectedIds = new Set(protectedItems.map(item => item.sourceId)); const completedIds = new Set([...tasks.filter(task => task.status === 'COMPLETED').map(task => task.id), ...protectedItems.filter(item => item.status === 'COMPLETED').map(item => item.sourceId)]);
      const workDays = Array.isArray(preferences.workDays) ? preferences.workDays.map(Number) : []; const [year, month, dayOfMonth] = dateKey.split('-').map(Number); const weekday = new Date(year, month - 1, dayOfMonth).getDay(); const scheduledEvents = [...events];
      if (workDays.includes(weekday) && preferences.workStart && preferences.workEnd && minutes(preferences.workEnd) > minutes(preferences.workStart)) {
        const title = preferences.workLabel || 'Work / School'; const commute = Number(preferences.commuteMinutes || 0); const hasLunch = preferences.lunchStart && preferences.lunchEnd && minutes(preferences.lunchStart) > minutes(preferences.workStart) && minutes(preferences.lunchEnd) > minutes(preferences.lunchStart) && minutes(preferences.lunchEnd) < minutes(preferences.workEnd);
        if (hasLunch) scheduledEvents.push(
          { id: `work:${dateKey}:morning`, title, date: dateKey, startTime: preferences.workStart, endTime: preferences.lunchStart, bufferBefore: commute, bufferBeforeTitle: 'Commute to work / school', status: 'PLANNED', priority: 100 },
          { id: `work:${dateKey}:lunch`, title: 'Lunch break', date: dateKey, startTime: preferences.lunchStart, endTime: preferences.lunchEnd, status: 'PLANNED', priority: 100 },
          { id: `work:${dateKey}:afternoon`, title, date: dateKey, startTime: preferences.lunchEnd, endTime: preferences.workEnd, bufferAfter: commute, bufferAfterTitle: 'Commute home', status: 'PLANNED', priority: 100 }
        );
        else scheduledEvents.push({ id: `work:${dateKey}`, title, date: dateKey, startTime: preferences.workStart, endTime: preferences.workEnd, bufferBefore: commute, bufferAfter: commute, bufferBeforeTitle: 'Commute to work / school', bufferAfterTitle: 'Commute home', status: 'PLANNED', priority: 100 });
      }
      const fixed = scheduledEvents.filter(event => !terminal.has(event.status) && !['SKIPPED', 'MISSED'].includes(event.status) && !protectedIds.has(event.id)).flatMap(event => {
        const blocks = [{ ...event, sourceId: event.id, source: 'event', type: 'FIXED', priority: Math.max(81, event.priority || 100), duration: minutes(event.endTime) - minutes(event.startTime), reason: 'Fixed commitment protected.' }];
        const before = Math.max(0, Number(event.bufferBefore || 0)); const after = Math.max(0, Number(event.bufferAfter || 0)); const beforeStart = Math.max(0, minutes(event.startTime) - before); const afterEnd = Math.min(1439, minutes(event.endTime) + after);
        if (before && beforeStart < minutes(event.startTime)) blocks.unshift({ id: `${event.id}:before`, sourceId: `${event.id}:before`, source: 'buffer', title: event.bufferBeforeTitle || `Prepare for ${event.title}`, startTime: DF.dates.minutesToTime(beforeStart), endTime: event.startTime, duration: minutes(event.startTime) - beforeStart, type: 'FIXED', priority: 100, status: 'PLANNED', reason: 'Preparation or travel buffer protected before a fixed commitment.' });
        if (after && afterEnd > minutes(event.endTime)) blocks.push({ id: `${event.id}:after`, sourceId: `${event.id}:after`, source: 'buffer', title: event.bufferAfterTitle || `Transition after ${event.title}`, startTime: event.endTime, endTime: DF.dates.minutesToTime(afterEnd), duration: afterEnd - minutes(event.endTime), type: 'FIXED', priority: 100, status: 'PLANNED', reason: 'Transition buffer protected after a fixed commitment.' });
        return blocks;
      });
      const protectedFixed = protectedItems.map(item => ({ ...item, originalType: item.type, type: 'FIXED', protected: true, reason: item.status === 'COMPLETED' ? 'Completed activity protected.' : 'Current activity protected.' }));
      const fixedConflicts = DF.conflicts.detect([...protectedFixed, ...fixed]); if (fixedConflicts.length) { const [a, b] = fixedConflicts[0]; throw new Error(`Fixed commitments conflict: ${a.title} and ${b.title}`); }
      const routineCandidates = expandRoutines(habits.filter(habit => !habit.completions?.includes(dateKey) && !protectedIds.has(habit.id) && !(habit.lastDecisionDate === dateKey && ['SKIPPED', 'MISSED'].includes(habit.status)))).filter(candidate => !protectedIds.has(candidate.sourceId || candidate.id));
      const candidates = [...tasks.filter(task => !protectedIds.has(task.id) && !terminal.has(task.status) && !(task.lastDecisionDate === dateKey && ['SKIPPED', 'MISSED'].includes(task.status)) && (!task.dueDate || task.dueDate <= dateKey)), ...routineCandidates, ...goalSessions(goals, history, dateKey)];
      const ranked = DF.optimizer.rank(candidates, history, preferences.learningEnabled !== false).sort((a, b) => (typeOrder[a.type || 'FLEXIBLE'] - typeOrder[b.type || 'FLEXIBLE']) || (b.priority || 0) - (a.priority || 0) || String(a.id).localeCompare(String(b.id)));
      const items = [...protectedFixed, ...fixed]; const unscheduled = []; const explanations = []; const scheduledIds = new Set(completedIds);
      for (const candidate of DF.dependencies.sort(ranked)) {
        const dependencyIds = candidate.dependencies || []; const unmet = dependencyIds.filter(id => !scheduledIds.has(id)); if (unmet.length) { unscheduled.push({ sourceId: candidate.sourceId || candidate.id, title: candidate.title, reason: 'UNMET_DEPENDENCY', dependencies: unmet, explanation: `Deferred because ${unmet.length} required step${unmet.length === 1 ? ' is' : 's are'} not yet available.` }); continue; }
        const duration = Math.max(5, Number(candidate.duration) || 30); const requested = candidate.availableFrom || candidate.preferredTime; const earliest = Math.max(startAfter, requested ? minutes(requested) : startAfter); const latest = candidate.availableUntil ? minutes(candidate.availableUntil) : sleep; const start = this.findSlot(items, earliest, duration, sleep, buffer, latest);
        if (start === null) { const optional = candidate.type === 'OPTIONAL' || candidate.priority <= 20; unscheduled.push({ sourceId: candidate.sourceId || candidate.id, title: candidate.title, reason: 'NO_AVAILABLE_WINDOW', optional, explanation: optional ? 'Removed because this activity is optional and today has limited available time.' : 'Deferred because today does not contain a realistic available window.' }); continue; }
        const sourceId = candidate.sourceId || candidate.id; const entry = { id: `${dateKey}:${candidate.source || (candidate instanceof DF.Habit ? 'routine' : 'task')}:${sourceId}`, sourceId, source: candidate.source || (candidate instanceof DF.Habit ? 'routine' : 'task'), routineId: candidate.routineId || '', goalId: candidate.goalId || '', title: candidate.title, startTime: DF.dates.minutesToTime(start), endTime: DF.dates.minutesToTime(start + duration), duration, plannedDuration: duration, priority: candidate.priority || 0, type: candidate.type || 'FLEXIBLE', status: 'PLANNED' }; entry.reason = this.explanation(candidate, entry, dateKey); items.push(entry); scheduledIds.add(candidate.id); explanations.push({ sourceId, message: entry.reason });
      }
      const sorted = items.map(item => item.originalType ? { ...item, type: item.originalType } : item).sort(byStart); const freeWindows = this.freeWindows(sorted, startAfter, sleep);
      return new DF.Plan({ date: dateKey, items: sorted, unscheduled, explanations, freeWindows, trigger });
    },
    compare(before, after) {
      const oldBySource = new Map(before.items.map(item => [item.sourceId, item])); const nextIds = new Set(after.items.map(item => item.sourceId)); const moved = after.items.filter(item => oldBySource.has(item.sourceId) && oldBySource.get(item.sourceId).startTime !== item.startTime).map(item => ({ title: item.title, from: oldBySource.get(item.sourceId).startTime, to: item.startTime }));
      const protectedItems = after.items.filter(item => item.protected).map(item => item.title); const deferred = before.items.filter(item => !nextIds.has(item.sourceId) && !['COMPLETED', 'STARTED'].includes(item.status)).map(item => item.title); return { protected: protectedItems, moved, deferred, message: `Protected ${protectedItems.length}, moved ${moved.length}, and deferred ${deferred.length} activit${deferred.length === 1 ? 'y' : 'ies'} while rebuilding the remaining day.` };
    },
    reschedule({ existingPlan, now = new Date(), trigger = 'MANUAL_REPLAN', ...input }) {
      const current = now.getHours() * 60 + now.getMinutes(); const protectedItems = existingPlan.items.filter(item => !['SKIPPED', 'MISSED', 'CANCELLED'].includes(item.status) && (item.type === 'FIXED' || item.priority >= 100 || item.status === 'COMPLETED' || item.status === 'STARTED' || (minutes(item.startTime) <= current && minutes(item.endTime) > current))).map(item => item.requestedExtension ? { ...item, previousPlannedEnd: item.endTime, endTime: DF.dates.minutesToTime(minutes(item.endTime) + item.requestedExtension), duration: Number(item.duration) + item.requestedExtension, reason: `Extended by ${item.requestedExtension} minutes at the user’s request.` } : item);
      const plan = this.generate({ ...input, trigger, protectedItems, preferences: { ...(input.preferences || {}), currentTime: DF.dates.minutesToTime(current) } }); plan.previousVersionId = existingPlan.id; plan.version = existingPlan.version + 1; plan.changeSummary = this.compare(existingPlan, plan); return plan;
    }
  };
})(globalThis);
