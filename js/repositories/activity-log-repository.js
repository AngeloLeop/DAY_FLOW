/** Repository for actual activity execution/history records. */
(function (root) {
  const DF = root.DayFlow; DF.activityLogs = new DF.BaseRepository('activityLogs', DF.ActivityLog);
  DF.activityLogs.forDate = async (userId, date) => (await DF.activityLogs.forUser(userId)).filter(item => item.date === DF.dates.dateKey(date));
})(globalThis);
