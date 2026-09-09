/**
 * Plan Repository
 * Database operations for daily/weekly plans
 */

(function (root) {
  const DF = root.DayFlow; DF.plans = new DF.BaseRepository('plans', DF.Plan);
  DF.plans.historyForDate = async (userId, date) => (await DF.plans.forUser(userId)).filter(x => x.date === DF.dates.dateKey(date)).sort((a, b) => a.version - b.version || a.createdAt.localeCompare(b.createdAt));
  DF.plans.forDate = async (userId, date) => (await DF.plans.historyForDate(userId, date)).at(-1) || null;
})(globalThis);
