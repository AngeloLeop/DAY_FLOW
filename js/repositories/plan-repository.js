/**
 * Plan Repository
 * Database operations for daily/weekly plans
 */

(function (root) { const DF = root.DayFlow; DF.plans = new DF.BaseRepository('plans', DF.Plan); DF.plans.forDate = async (userId, date) => (await DF.plans.forUser(userId)).find(x => x.date === DF.dates.dateKey(date)) || null; })(globalThis);
