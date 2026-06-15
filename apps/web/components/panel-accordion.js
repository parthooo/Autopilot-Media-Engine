/**
 * Collapsible panel section using native <details>.
 * @param {object} props
 * @param {string} props.title
 * @param {number} [props.count]
 * @param {boolean} [props.defaultOpen]
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
export function PanelAccordion({
  title,
  count,
  defaultOpen = false,
  className = "",
  children,
}) {
  return (
    <details className={`panel panel-accordion${className ? ` ${className}` : ""}`} open={defaultOpen || undefined}>
      <summary className="panel-accordion-summary">
        <span className="panel-accordion-title">{title}</span>
        {count != null && <span className="panel-count">{count}</span>}
        <span className="panel-accordion-chevron" aria-hidden="true" />
      </summary>
      <div className="panel-accordion-body">{children}</div>
    </details>
  );
}
