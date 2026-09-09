# DAY FLOW Scheduler

The engine is deterministic and independent of the DOM. Its public generation input is a date, preferences, tasks, habits, and fixed events; its output is a versionable plan.

## Contract

Activity types are ordered `FIXED → SEMI_FIXED → FLEXIBLE → OPTIONAL`. Priorities are `0–20 OPTIONAL`, `21–40 LOW`, `41–60 NORMAL`, `61–80 HIGH`, `81–99 VERY_HIGH`, and `100 CRITICAL`.

The non-negotiable rules are:

1. Fixed commitments are protected.
2. Flexible activities move before fixed commitments.
3. Optional activities may be removed when no space remains.
4. Critical commitments are never silently moved.

## V1 implementation

The engine ranks candidates, topologically orders dependencies, adapts duration from local actual-history averages, places activities around fixed events and configurable buffers, reports unscheduled work with reasons, detects overlaps, and rejects fixed-versus-fixed conflicts. Plans retain an incrementing version and previous-version link when regenerated.

Late starts and mid-day regeneration schedule remaining work after the current time. Past, started, and completed plan items are protected. Added appointments that collide with protected work are surfaced instead of silently moving either item. Each scheduled item includes a plain-language explanation; overload, dependency, conflict, optional-removal, protection, versioning, and learned-duration behavior are covered by tests.
