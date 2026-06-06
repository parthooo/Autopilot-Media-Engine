const BADGE_ALIASES = {
  success: "approved",
  failed: "rejected",
  running: "running",
};

export function StatusBadge({ status }) {
  const key = BADGE_ALIASES[status] || status;
  return <span className={`badge badge-${key}`}>{status}</span>;
}
