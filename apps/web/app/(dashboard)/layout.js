import { Nav } from "../../components/nav";

export default function DashboardLayout({ children }) {
  return (
    <div className="app-shell">
      <Nav />
      <main className="main-content">{children}</main>
    </div>
  );
}
