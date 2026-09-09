/**
 * Legacy scheduler facade
 * Maintained for compatibility; core logic moved to engine/
 */

(function (root) { root.DayFlowScheduler = { generate: options => root.DayFlow.schedulerEngine.generate(options), conflicts: items => root.DayFlow.conflicts.detect(items) }; })(globalThis);
