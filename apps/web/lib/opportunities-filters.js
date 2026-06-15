import { LOW_SCORE_BENCHMARK } from "@ame/core";
import { parseWhenParam, whenCutoff, TIME_FILTERS } from "./list-filters";

const SCORE_FILTERS = [
  { value: "", label: "Any score" },
  { value: "70", label: "Score ≥ 70" },
  { value: "low", label: `Below ${LOW_SCORE_BENCHMARK}` },
];

const STATUS_FILTERS = [
  { value: "", label: "Active" },
  { value: "approved", label: "Winner" },
  { value: "rejected", label: "Rejected" },
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "archived", label: "Archived" },
];

const VALID_STATUS = new Set(STATUS_FILTERS.map((f) => f.value).filter(Boolean));

export function parseOpportunitiesFilters(params = {}) {
  const when = parseWhenParam(params.when);
  const category = typeof params.category === "string" ? params.category : "";
  const score = params.score === "70" || params.score === "low" ? params.score : "";
  const status = VALID_STATUS.has(params.status) ? params.status : "";

  return { when, category, score, status };
}

export function buildOpportunitiesWhere(filters) {
  const where = {};
  const topicWhere = {};
  const cutoff = whenCutoff(filters.when);

  if (cutoff) {
    topicWhere.lastSeenAt = { gte: cutoff };
  }

  if (filters.category === "_none") {
    topicWhere.category = null;
  } else if (filters.category) {
    topicWhere.category = filters.category;
  }

  if (Object.keys(topicWhere).length > 0) {
    where.topic = { is: topicWhere };
  }

  if (filters.score === "70") {
    where.opportunityScore = { gte: 70 };
  } else if (filters.score === "low") {
    where.opportunityScore = { lt: LOW_SCORE_BENCHMARK };
  }

  if (filters.status) {
    where.status = filters.status;
  } else {
    where.status = { not: "archived" };
  }

  return where;
}

export function buildOpportunitiesPath(filters, { page } = {}) {
  const params = new URLSearchParams();
  if (filters.when) params.set("when", filters.when);
  if (filters.category) params.set("category", filters.category);
  if (filters.score) params.set("score", filters.score);
  if (filters.status) params.set("status", filters.status);
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/opportunities?${query}` : "/opportunities";
}

export function hasActiveOpportunitiesFilters(filters) {
  return Boolean(filters.when || filters.category || filters.score || filters.status);
}

export function opportunitiesFilterSummary(filters) {
  const parts = [];
  const whenLabel = TIME_FILTERS.find((f) => f.value === filters.when)?.label;
  if (whenLabel && filters.when) parts.push(whenLabel);
  if (filters.category === "_none") parts.push("Uncategorized");
  else if (filters.category) parts.push(filters.category);
  if (filters.score === "70") parts.push("Score ≥ 70");
  if (filters.score === "low") parts.push(`Below ${LOW_SCORE_BENCHMARK}`);
  const statusLabel = STATUS_FILTERS.find((f) => f.value === filters.status)?.label;
  if (statusLabel && filters.status) parts.push(statusLabel);
  return parts;
}

export { TIME_FILTERS, SCORE_FILTERS, STATUS_FILTERS };
