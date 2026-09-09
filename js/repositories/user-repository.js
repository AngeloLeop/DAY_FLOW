/**
 * User Repository
 * Database operations for users
 */

(function (root) { const DF = root.DayFlow; DF.users = new DF.BaseRepository('users', DF.User); DF.users.byEmail = async email => { const target = String(email || '').trim().toLowerCase(); return (await DF.users.getAll()).find(x => String(x.email || '').toLowerCase() === target) || null; }; })(globalThis);
