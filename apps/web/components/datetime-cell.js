/**
 * @param {string | Date} value
 */
export function DateTimeCell({ value }) {
  const date = new Date(value);

  return (
    <span className="datetime-cell">
      <span className="datetime-cell-date">{date.toLocaleDateString()},</span>
      <span className="datetime-cell-time">{date.toLocaleTimeString()}</span>
    </span>
  );
}
