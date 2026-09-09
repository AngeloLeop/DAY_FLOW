/**
 * Task Repository
 * Database operations for tasks
 */

(function (root) { const DF = root.DayFlow; DF.tasks = new DF.BaseRepository('tasks', DF.Task); DF.tasks.pending = async userId => (await DF.tasks.forUser(userId)).filter(x => !['COMPLETED', 'CANCELLED'].includes(x.status)); })(globalThis);
