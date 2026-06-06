export function PageHeader({ title, subtitle, back }) {
  return (
    <header className="page-header">
      {back}
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </header>
  );
}
