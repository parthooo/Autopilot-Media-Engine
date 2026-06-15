"use client";

/**
 * @param {object} [props]
 * @param {"sm" | "md"} [props.size]
 * @param {string} [props.className]
 */
export function Spinner({ size = "sm", className = "" }) {
  return (
    <span
      className={`spinner spinner--${size} ${className}`.trim()}
      role="status"
      aria-hidden="true"
    />
  );
}

/**
 * @param {object} props
 * @param {boolean} props.loading
 * @param {string} props.loadingLabel
 * @param {string} props.label
 * @param {React.ReactNode} [props.children] - overrides label when not loading
 */
export function ButtonContent({ loading, loadingLabel, label, children }) {
  if (loading) {
    return (
      <>
        <Spinner />
        <span>{loadingLabel}</span>
      </>
    );
  }
  return <>{children ?? label}</>;
}
