/** Coordinates live execution without coupling the scheduler or repositories to the DOM. */
(function (root) {
  const DF = root.DayFlow;
  const nowMinutes = value => { const date = value instanceof Date ? value : new Date(value || Date.now()); return date.getHours() * 60 + date.getMinutes(); };
  const durationBetween = (start, end) => Math.max(0, Math.round((new Date(end) - new Date(start)) / 60000));
  const weekLogs = (logs, date = new Date()) => { const start = new Date(date); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); const end = new Date(start); end.setDate(end.getDate() + 7); return logs.filter(log => { const parts = String(log.date || '').split('-').map(Number); if (parts.length !== 3) return false; const local = new Date(parts[0], parts[1] - 1, parts[2]); return local >= start && local < end; }); };

  DF.dailyFlow = {
    moment(plan, now = new Date()) {
      const currentMinute = nowMinutes(now); const active = plan.items.find(item => item.status === 'STARTED') || plan.items.find(item => DF.dates.timeToMinutes(item.startTime) <= currentMinute && DF.dates.timeToMinutes(item.endTime) > currentMinute && !['COMPLETED', 'SKIPPED', 'CANCELLED'].includes(item.status));
      const next = plan.items.find(item => DF.dates.timeToMinutes(item.startTime) > currentMinute && !['COMPLETED', 'SKIPPED', 'CANCELLED'].includes(item.status));
      const upcoming = plan.items.filter(item => DF.dates.timeToMinutes(item.startTime) > currentMinute && item !== next && !['COMPLETED', 'SKIPPED', 'CANCELLED'].includes(item.status)).slice(0, 4);
      const remaining = plan.items.filter(item => DF.dates.timeToMinutes(item.endTime) > currentMinute && !['COMPLETED', 'SKIPPED', 'CANCELLED'].includes(item.status));
      const scheduledMinutes = remaining.reduce((sum, item) => sum + Math.max(0, DF.dates.timeToMinutes(item.endTime) - Math.max(currentMinute, DF.dates.timeToMinutes(item.startTime))), 0);
      const freeMinutes = (plan.freeWindows || []).reduce((sum, window) => sum + Math.max(0, DF.dates.timeToMinutes(window.endTime) - Math.max(currentMinute, DF.dates.timeToMinutes(window.startTime))), 0);
      return { active, next, upcoming, scheduledMinutes, freeMinutes, important: remaining.filter(item => item.priority >= 80).length, warnings: plan.unscheduled?.length || 0 };
    },
    async logFor(userId, plan, item) {
      return (await DF.activityLogs.forPlanItem(userId, plan.id, item.sourceId)) || (await DF.activityLogs.latestForSource(userId, item.sourceId, plan.date)) || new DF.ActivityLog({ userId, planId: plan.id, sourceId: item.sourceId, source: item.source, title: item.title, date: plan.date, plannedStart: item.startTime, plannedEnd: item.endTime, plannedDuration: item.plannedDuration || item.duration });
    },
    async perform({ userId, date = new Date(), itemId, action, at = new Date(), reason = '' }) {
      const plan = await DF.plans.forDate(userId, date); if (!plan) throw new Error('Build today’s flow before using live actions.');
      const item = plan.items.find(entry => entry.id === itemId || entry.sourceId === itemId); if (!item) throw new Error('This activity is no longer in the current plan.');
      const log = await this.logFor(userId, plan, item); const timestamp = (at instanceof Date ? at : new Date(at)).toISOString(); let requiresReplan = false; let adjustment = 0;
      if (action === DF.constants.FLOW_ACTION.START) { if (!log.actualStart) log.actualStart = timestamp; if (log.pausedAt) { log.pauseMinutes += durationBetween(log.pausedAt, timestamp); log.pausedAt = ''; } item.status = log.status = 'STARTED'; }
      else if (action === DF.constants.FLOW_ACTION.PAUSE) { if (!log.actualStart) throw new Error('Start the activity before pausing it.'); if (log.pausedAt) throw new Error('This activity is already paused.'); item.status = log.status = 'PARTIAL'; log.pausedAt = timestamp; }
      else if (action === DF.constants.FLOW_ACTION.COMPLETE || action === DF.constants.FLOW_ACTION.FINISHED_EARLY) { if (!log.actualStart) log.actualStart = timestamp; if (log.pausedAt) { log.pauseMinutes += durationBetween(log.pausedAt, timestamp); log.pausedAt = ''; } log.actualEnd = timestamp; log.actualDuration = Math.max(0, durationBetween(log.actualStart, timestamp) - Number(log.pauseMinutes || 0)); item.status = log.status = 'COMPLETED'; log.reason = action === DF.constants.FLOW_ACTION.FINISHED_EARLY ? 'Finished earlier than planned' : reason; requiresReplan = action === DF.constants.FLOW_ACTION.FINISHED_EARLY; }
      else if (action === DF.constants.FLOW_ACTION.SKIP || action === DF.constants.FLOW_ACTION.CANT_DO) { log.actualEnd = timestamp; item.status = log.status = action === DF.constants.FLOW_ACTION.SKIP ? 'SKIPPED' : 'MISSED'; log.reason = reason || (action === DF.constants.FLOW_ACTION.SKIP ? 'Skipped by user' : 'User cannot complete this now'); requiresReplan = true; }
      else if (action === DF.constants.FLOW_ACTION.MORE_TIME) { if (!log.actualStart) log.actualStart = timestamp; item.status = log.status = 'STARTED'; log.reason = 'More time requested'; adjustment = 15; item.requestedExtension = adjustment; requiresReplan = true; }
      else if (action === DF.constants.FLOW_ACTION.REPLAN) requiresReplan = true;
      else throw new Error('Unsupported live-flow action.');
      log.updatedAt = timestamp; await DF.activityLogs.save(log); await DF.plans.save(plan);
      if (item.source === 'task' && ['COMPLETED', 'SKIPPED', 'MISSED'].includes(item.status)) { const task = await DF.tasks.get(item.sourceId); if (task) { task.status = item.status; task.lastDecisionDate = plan.date; await DF.tasks.save(task); } }
      if (item.source === 'event' && ['SKIPPED', 'MISSED'].includes(item.status)) { const event = await DF.events.get(item.sourceId); if (event) { event.status = item.status; event.lastDecisionDate = plan.date; await DF.events.save(event); } }
      if (item.source === 'routine' && item.routineId && ['SKIPPED', 'MISSED'].includes(item.status)) { const routine = await DF.habits.get(item.routineId); if (routine) { routine.status = item.status; routine.lastDecisionDate = plan.date; await DF.habits.save(routine); } }
      if (item.source === 'routine' && item.routineId && item.status === 'COMPLETED') { const routine = await DF.habits.get(item.routineId); const complete = plan.items.filter(entry => entry.routineId === item.routineId && entry.type !== 'OPTIONAL').every(entry => entry.status === 'COMPLETED'); if (routine && complete && !routine.completions.includes(plan.date)) { routine.status = 'PLANNED'; routine.completions.push(plan.date); await DF.habits.save(routine); } }
      return { plan, item, log, requiresReplan, adjustment };
    },
    insights({ logs = [], plans = [], goals = [], date = new Date() }) {
      const completed = logs.filter(log => log.status === 'COMPLETED'); const completedThisWeek = weekLogs(completed, date); const timed = completed.filter(log => Number(log.actualDuration) > 0); const plannedMinutes = timed.reduce((sum, log) => sum + Number(log.plannedDuration || 0), 0); const actualMinutes = timed.reduce((sum, log) => sum + Number(log.actualDuration || 0), 0); const revisedDays = new Set(plans.filter(plan => plan.version > 1).map(plan => plan.date)); const overloadedDays = new Set(plans.filter(plan => plan.unscheduled?.length).map(plan => plan.date));
      return { completed: completed.length, completionRate: logs.length ? Math.round(completed.length / logs.length * 100) : 0, plannedMinutes, actualMinutes, estimateVariance: plannedMinutes ? Math.round((actualMinutes - plannedMinutes) / plannedMinutes * 100) : 0, revisedDays: revisedDays.size, overloadedDays: overloadedDays.size, goalMinutes: goals.map(goal => ({ id: goal.id, title: goal.title, minutes: completedThisWeek.filter(log => log.source === 'goal' && log.sourceId === goal.id).reduce((sum, log) => sum + Number(log.actualDuration || 0), 0), target: Number(goal.weeklyTargetMinutes || 0) })) };
    }
  };
})(globalThis);
