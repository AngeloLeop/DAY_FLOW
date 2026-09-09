/**
 * User Repository
 * Database operations for users
 */

(function (root) { const DF = root.DayFlow; DF.users = new DF.BaseRepository('users', DF.User); DF.users.byEmail = async email => (await DF.users.getAll()).find(x => x.email.toLowerCase() === String(email).toLowerCase()) || null; })(globalThis);
