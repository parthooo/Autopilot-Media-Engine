import { parseWhenParam, whenCutoff, TIME_FILTERS } from "./list-filters";

const SOURCE_ACTIVE_FILTERS = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const RUN_STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "success", label: "Success" },
  { value: "running", label: "Running" },
  { value: "failed", label: "Failed" },
];

const VALID_SRC = new Set(SOURCE_ACTIVE_FILTERS.map((f) => f.value).filter(Boolean));
const VALID_RUN_STATUS = new Set(RUN_STATUS_FILTERS.map((f) => f.value).filter(Boolean));

export function parseIngestionFilters(params = {}) {
  const src = VALID_SRC.has(params.src) ? params.src : "";
  const source = typeof params.source === "string" ? params.source : "";
  const status = VALID_RUN_STATUS.has(params.status) ? params.status : "";
  const when = parseWhenParam(params.when);

  return { src, source, status, when };
}

export function buildIngestionRunsWhere(filters) {
  const where = {};
  const cutoff = whenCutoff(filters.when);

  if (filters.source) {
    where.source = { slug: filters.source };
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (cutoff) {
    where.startedAt = { gte: cutoff };
  }

  return where;
}

export function filterSources(sources, filters) {
  if (filters.src === "active") return sources.filter((s) => s.isActive);
  if (filters.src === "inactive") return sources.filter((s) => !s.isActive);
  return sources;
}

export function buildIngestionPath(filters, { page } = {}) {
  const params = new URLSearchParams();
  if (filters.src) params.set("src", filters.src);
  if (filters.source) params.set("source", filters.source);
  if (filters.status) params.set("status", filters.status);
  if (filters.when) params.set("when", filters.when);
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/ingestion?${query}` : "/ingestion";
}

export function hasActiveIngestionFilters(filters) {
  return Boolean(filters.src || filters.source || filters.status || filters.when);
}

export function hasActiveRunFilters(filters) {
  return Boolean(filters.source || filters.status || filters.when);
}

export function ingestionFilterSummary(filters) {
  const parts = [];
  const srcLabel = SOURCE_ACTIVE_FILTERS.find((f) => f.value === filters.src)?.label;
  if (srcLabel && filters.src) parts.push(`Sources: ${srcLabel}`);
  if (filters.source) parts.push(`Source: ${filters.source}`);
  const statusLabel = RUN_STATUS_FILTERS.find((f) => f.value === filters.status)?.label;
  if (statusLabel && filters.status) parts.push(statusLabel);
  const whenLabel = TIME_FILTERS.find((f) => f.value === filters.when)?.label;
  if (whenLabel && filters.when) parts.push(whenLabel);
  return parts;
}

export { TIME_FILTERS, SOURCE_ACTIVE_FILTERS, RUN_STATUS_FILTERS };
