/** Days before stale low-quality library rows are eligible for pruning */
const LIBRARY_RETENTION_DAYS = 30;

/** Composite scores below this are treated as low-quality prune candidates */
const LOW_SCORE_BENCHMARK = 40;

module.exports = { LIBRARY_RETENTION_DAYS, LOW_SCORE_BENCHMARK };
