import { parseWhenParam, whenCutoff, TIME_FILTERS } from "./list-filters";

const TYPE_FILTERS = [
  { value: "", label: "All" },
  { value: "youtube_script", label: "YouTube" },
  { value: "shorts_script", label: "Shorts" },
  { value: "article", label: "Articles" },
];

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "approved", label: "Approved" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Rejected" },
];

const VIDEO_FILTERS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "rendering", label: "Rendering" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "none", label: "No video" },
];

const VALID_TYPE = new Set(TYPE_FILTERS.map((f) => f.value).filter(Boolean));
const VALID_STATUS = new Set(STATUS_FILTERS.map((f) => f.value).filter(Boolean));
const VALID_VIDEO = new Set(VIDEO_FILTERS.map((f) => f.value).filter(Boolean));
const SCRIPT_TYPES = ["youtube_script", "shorts_script"];

export function parseContentFilters(params = {}) {
  const type = VALID_TYPE.has(params.type) ? params.type : "";
  const status = VALID_STATUS.has(params.status) ? params.status : "";
  const video = VALID_VIDEO.has(params.video) ? params.video : "";
  const when = parseWhenParam(params.when);

  return { type, status, video, when };
}

export function buildContentWhere(filters) {
  const clauses = [];
  const cutoff = whenCutoff(filters.when);

  if (filters.type) {
    clauses.push({ assetType: filters.type });
  }
  if (filters.status) {
    clauses.push({ status: filters.status });
  }
  if (cutoff) {
    clauses.push({ createdAt: { gte: cutoff } });
  }
  if (filters.video === "none") {
    clauses.push({
      OR: [
        { assetType: { notIn: SCRIPT_TYPES } },
        { videoAsset: null },
      ],
    });
  } else if (filters.video) {
    clauses.push({
      assetType: { in: SCRIPT_TYPES },
      videoAsset: { status: filters.video },
    });
  }

  if (clauses.length === 0) return {};
  if (clauses.length === 1) return clauses[0];
  return { AND: clauses };
}

export function buildContentPath(filters, { page } = {}) {
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.status) params.set("status", filters.status);
  if (filters.video) params.set("video", filters.video);
  if (filters.when) params.set("when", filters.when);
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/content?${query}` : "/content";
}

export function hasActiveContentFilters(filters) {
  return Boolean(filters.type || filters.status || filters.video || filters.when);
}

export function contentFilterSummary(filters) {
  const parts = [];
  const typeLabel = TYPE_FILTERS.find((f) => f.value === filters.type)?.label;
  if (typeLabel && filters.type) parts.push(typeLabel);
  const statusLabel = STATUS_FILTERS.find((f) => f.value === filters.status)?.label;
  if (statusLabel && filters.status) parts.push(statusLabel);
  const videoLabel = VIDEO_FILTERS.find((f) => f.value === filters.video)?.label;
  if (videoLabel && filters.video) parts.push(`Video: ${videoLabel}`);
  const whenLabel = TIME_FILTERS.find((f) => f.value === filters.when)?.label;
  if (whenLabel && filters.when) parts.push(whenLabel);
  return parts;
}

export { TIME_FILTERS, TYPE_FILTERS, STATUS_FILTERS, VIDEO_FILTERS };
