# DAY FLOW Data Model

IndexedDB uses the database name `DAY_FLOW_DB`, currently at schema version 2. Every record uses an `id` key.

## Object stores

| Store | Purpose | Indexed fields |
| --- | --- | --- |
| `users` | Local profiles and password-verification material | unique `email` |
| `tasks` | One-off planned activities | `userId`, `status`, `dueDate` |
| `habits` | Recurring planned activities | `userId`, `status` |
| `events` | Fixed commitments | `userId`, `status`, `date` |
| `goals` | Longer-term objectives | `userId`, `status` |
| `plans` | Generated schedules, free windows, decision summaries, and immutable version history | `userId`, `date`, compound `userDate` |
| `activityLogs` | Actual starts, pauses, completion, duration, and user decision records | `userId`, `planId`, `date` |
| `settings` | User-scoped preferences | `userId` |

`plans` and `activityLogs` deliberately separate intended schedules from actual behavior. Live Flow never replaces a plan item's original start, end, or planned duration with actual execution values. Regeneration saves a new plan record linked through `previousVersionId`; all prior versions remain queryable.

Tasks may define flexibility, priority, dependencies, deadlines, availability windows, preferred time, and a goal link. Routines contain ordered required or optional steps. Goals define weekly targets and session sizes. Events may reserve explicit transition buffers before and after a fixed commitment. User preferences retain workdays, work hours, commute duration, sleep boundaries, theme, notifications, and the local-learning opt-out used by the engine.

## Lifecycle statuses

`PLANNED`, `STARTED`, `COMPLETED`, `SKIPPED`, `MISSED`, `CANCELLED`, `RESCHEDULED`, and `PARTIAL` are defined centrally in `js/constants.js`.

Schema changes run only inside IndexedDB upgrade transactions. Startup never deletes the database. Version 2 converges existing version-1 databases on the declared stores and indexes.
