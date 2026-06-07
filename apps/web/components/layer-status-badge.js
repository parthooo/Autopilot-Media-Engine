/**
 * @param {object} props
 * @param {'live' | 'planned' | 'partial'} props.status
 * @param {string} [props.note] - Shown for partial status (e.g. "Scripts live")
 */
export function LayerStatusBadge({ status, note }) {
  const label =
    status === "live" ? "Live" : status === "partial" ? "Partial" : "Planned";

  return (
    <span className={`layer-status layer-status--${status}`} title={note}>
      {label}
      {status === "partial" && note ? (
        <span className="layer-status-note">{note}</span>
      ) : null}
    </span>
  );
}
