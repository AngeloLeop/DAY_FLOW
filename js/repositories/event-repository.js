/**
 * Event Repository
 * Database operations for events
 */

(function (root) { const DF = root.DayFlow; DF.events = new DF.BaseRepository('events', DF.Event); DF.events.forDate = async (userId, date) => (await DF.events.forUser(userId)).filter(x => x.date === DF.dates.dateKey(date)); })(globalThis);
