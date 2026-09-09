# DAY FLOW Scheduler

The engine is deterministic and independent of the DOM. Its public generation input is a date, preferences, tasks, habits, and fixed events; its output is a versionable plan.

## Contract

Activity types are ordered `FIXED → SEMI_FIXED → FLEXIBLE → OPTIONAL`. Priorities are `0–20 OPTIONAL`, `21–40 LOW`, `41–60 NORMAL`, `61–80 HIGH`, `81–99 VERY_HIGH`, and `100 CRITICAL`.

The non-negotiable rules are:

1. Fixed commitments are protected.
2. Flexible activities move before fixed commitments.
3. Optional activities may be removed when no space remains.
4. Critical commitments are never silently moved.

## Current implementation

The engine ranks candidates, topologically orders dependencies, expands ordered routine steps, allocates goal sessions toward real weekly targets, optionally adapts duration from local actual-history averages, and converts configured workdays plus commute time into protected local blocks. It places other activities inside availability windows around fixed events and transition buffers, reports unscheduled work with reasons, computes free windows, detects every overlapping pair, and rejects fixed-versus-fixed conflicts. Plans retain an incrementing version and previous-version link when regenerated.

Late starts and mid-day regeneration schedule remaining work after the current time. Started and completed work, the current activity, fixed commitments, and critical commitments are protected. Added appointments that collide with protected work are surfaced instead of silently moving either item. Each scheduled item and unscheduled activity includes a plain-language explanation, while each revision summarizes protected, moved, and deferred work. Local learning requires at least two actual-duration samples and can be disabled.
