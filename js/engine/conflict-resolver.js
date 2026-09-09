/**
 * Conflict Resolver
 * Detects and resolves scheduling conflicts
 * Preserves FIXED, moves FLEXIBLE, removes OPTIONAL
 */

(function (root) {
  const DF = root.DayFlow;
  DF.conflicts = {
    detect(items) {
      const sorted = [...items].sort((a, b) => DF.dates.timeToMinutes(a.startTime) - DF.dates.timeToMinutes(b.startTime)); const found = [];
      for (let i = 0; i < sorted.length; i++) for (let j = i + 1; j < sorted.length; j++) { if (DF.dates.timeToMinutes(sorted[j].startTime) >= DF.dates.timeToMinutes(sorted[i].endTime)) break; if (DF.dates.overlaps(sorted[i], sorted[j])) found.push([sorted[i], sorted[j]]); }
      return found;
    },
    resolve(items, dayEnd = '22:00') { const sorted = [...items].sort((a, b) => DF.dates.timeToMinutes(a.startTime) - DF.dates.timeToMinutes(b.startTime)); const result = []; const dropped = []; for (const item of sorted) { const prior = result.at(-1); if (!prior || !DF.dates.overlaps(prior, item)) { result.push(item); continue; } const movable = item.type !== 'FIXED' ? item : prior.type !== 'FIXED' ? prior : null; if (!movable) throw new Error(`Fixed commitments conflict: ${prior.title} and ${item.title}`); if (movable === prior) result.pop(); const duration = DF.dates.timeToMinutes(movable.endTime) - DF.dates.timeToMinutes(movable.startTime); const start = Math.max(...result.map(x => DF.dates.timeToMinutes(x.endTime)), DF.dates.timeToMinutes(item === movable ? prior.endTime : item.endTime)); if (start + duration > DF.dates.timeToMinutes(dayEnd) || movable.type === 'OPTIONAL') dropped.push(movable); else result.push({ ...movable, startTime: DF.dates.minutesToTime(start), endTime: DF.dates.minutesToTime(start + duration), rescheduled: true }); if (movable === prior) result.push(item); result.sort((a, b) => DF.dates.timeToMinutes(a.startTime) - DF.dates.timeToMinutes(b.startTime)); } return { items: result, dropped }; }
  };
})(globalThis);
