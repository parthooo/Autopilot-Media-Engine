import { Nav } from "../../components/nav";
import { PipelineJobProvider } from "../../components/pipeline-job-provider";

export default function DashboardLayout({ children }) {
  return (
    <div className="app-shell">
      <Nav />
      <PipelineJobProvider>
        <main className="main-content">{children}</main>
      </PipelineJobProvider>
    </div>
  );
}
