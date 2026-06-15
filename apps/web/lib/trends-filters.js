import { parseWhenParam, whenCutoff, TIME_FILTERS } from "./list-filters";

const SCORE_FILTERS = [
  { value: "", label: "Any score" },
  { value: "70", label: "Score ≥ 70" },
];

const WINNER_FILTERS = [
  { value: "", label: "All topics" },
  { value: "1", label: "Winner" },
];

export function parseTrendsFilters(params = {}) {
  const when = parseWhenParam(params.when);
  const category = typeof params.category === "string" ? params.category : "";
  const score = params.score === "70" ? "70" : "";
  const winner = params.winner === "1" ? "1" : "";

  return { when, category, score, winner };
}

export function buildTrendsWhere(filters) {
  const where = {};
  const cutoff = whenCutoff(filters.when);

  if (cutoff) {
    where.lastSeenAt = { gte: cutoff };
  }

  if (filters.category === "_none") {
    where.category = null;
  } else if (filters.category) {
    where.category = filters.category;
  }

  const opportunityWhere = {};
  if (filters.score === "70") {
    opportunityWhere.opportunityScore = { gte: 70 };
  }
  if (filters.winner === "1") {
    opportunityWhere.status = "approved";
  }
  if (Object.keys(opportunityWhere).length > 0) {
    where.opportunity = { is: opportunityWhere };
  }

  return where;
}

export function buildTrendsPath(filters, { page } = {}) {
  const params = new URLSearchParams();
  if (filters.when) params.set("when", filters.when);
  if (filters.category) params.set("category", filters.category);
  if (filters.score === "70") params.set("score", "70");
  if (filters.winner === "1") params.set("winner", "1");
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/trends?${query}` : "/trends";
}

export function hasActiveTrendsFilters(filters) {
  return Boolean(filters.when || filters.category || filters.score || filters.winner);
}

export function trendsFilterSummary(filters) {
  const parts = [];
  const whenLabel = TIME_FILTERS.find((f) => f.value === filters.when)?.label;
  if (whenLabel && filters.when) parts.push(whenLabel);
  if (filters.category === "_none") parts.push("Uncategorized");
  else if (filters.category) parts.push(filters.category);
  if (filters.score === "70") parts.push("Score ≥ 70");
  if (filters.winner === "1") parts.push("Winner");
  return parts;
}

export { TIME_FILTERS, SCORE_FILTERS, WINNER_FILTERS };
