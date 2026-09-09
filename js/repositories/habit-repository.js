/**
 * Habit Repository
 * Database operations for habits
 */

(function (root) { const DF = root.DayFlow; DF.habits = new DF.BaseRepository('habits', DF.Habit); DF.habits.forDate = async (userId, date) => (await DF.habits.forUser(userId)).filter(x => x.occursOn(date)); })(globalThis);
