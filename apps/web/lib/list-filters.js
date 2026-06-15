export const TIME_FILTERS = [
  { value: "", label: "All time" },
  { value: "15m", label: "15 min" },
  { value: "1h", label: "1 hour" },
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
];

export const TIME_WINDOWS = {
  "15m": () => new Date(Date.now() - 15 * 60 * 1000),
  "1h": () => new Date(Date.now() - 60 * 60 * 1000),
  today: () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  },
  "7d": () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
};

const VALID_WHEN = new Set(TIME_FILTERS.map((f) => f.value).filter(Boolean));

export function parseWhenParam(value) {
  return VALID_WHEN.has(value) ? value : "";
}

export function whenCutoff(when) {
  return when && TIME_WINDOWS[when] ? TIME_WINDOWS[when]() : null;
}
