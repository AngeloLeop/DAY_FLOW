# DAY FLOW Scheduler

## Scheduling Algorithm

### Activity Types
- **FIXED**: Never moves (work, appointments, sleep)
- **SEMI_FIXED**: Preferred time but can shift (morning routine)
- **FLEXIBLE**: Can move anywhere (tasks, exercises)
- **OPTIONAL**: Can be removed if no space (nice-to-have activities)

### Priority Levels
- 0–20: OPTIONAL
- 21–40: LOW
- 41–60: NORMAL
- 61–80: HIGH
- 81–99: VERY_HIGH
- 100: CRITICAL

### Core Rules
1. FIXED commitments are protected
2. FLEXIBLE activities move first
3. OPTIONAL activities may be removed
4. CRITICAL commitments are never silently moved

## Placeholder for algorithm details
