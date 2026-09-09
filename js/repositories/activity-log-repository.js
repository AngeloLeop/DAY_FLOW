/** Repository for actual activity execution/history records. */
(function (root) {
  const DF = root.DayFlow; DF.activityLogs = new DF.BaseRepository('activityLogs', DF.ActivityLog);
  DF.activityLogs.forDate = async (userId, date) => (await DF.activityLogs.forUser(userId)).filter(item => item.date === DF.dates.dateKey(date));
  DF.activityLogs.forPlanItem = async (userId, planId, sourceId) => {
    const items = await DF.activityLogs.forUser(userId);
    const newest = records => records.sort((a, b) => String(a.updatedAt || a.createdAt).localeCompare(String(b.updatedAt || b.createdAt))).at(-1) || null;
    const exact = newest(items.filter(item => item.planId === planId && item.sourceId === sourceId));
    if (exact) return exact;
    const plan = await DF.plans.get(planId);
    return plan ? newest(items.filter(item => item.sourceId === sourceId && item.date === plan.date)) : null;
  };
  DF.activityLogs.latestForSource = async (userId, sourceId, date = '') => (await DF.activityLogs.forUser(userId)).filter(item => item.sourceId === sourceId && (!date || item.date === DF.dates.dateKey(date))).sort((a, b) => String(a.updatedAt || a.createdAt).localeCompare(String(b.updatedAt || b.createdAt))).at(-1) || null;
})(globalThis);
