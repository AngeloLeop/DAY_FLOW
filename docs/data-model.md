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
| `plans` | Generated planned schedules and versions | `userId`, `date`, compound `userDate` |
| `activityLogs` | Actual execution/behavior records | `userId`, `planId`, `date` |
| `settings` | User-scoped preferences | `userId` |

`plans` and `activityLogs` deliberately separate intended schedules from actual behavior. Later phases must not store actual start/end/duration values by mutating the original plan.

## Lifecycle statuses

`PLANNED`, `STARTED`, `COMPLETED`, `SKIPPED`, `MISSED`, `CANCELLED`, `RESCHEDULED`, and `PARTIAL` are defined centrally in `js/constants.js`.

Schema changes run only inside IndexedDB upgrade transactions. Startup never deletes the database. Version 2 converges existing version-1 databases on the declared stores and indexes.
