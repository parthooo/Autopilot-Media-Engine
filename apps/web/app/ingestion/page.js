import { prisma } from "../../lib/db";
import { PageHeader } from "../../components/page-header";
import { PipelineControls } from "../../components/pipeline-controls";

export const dynamic = "force-dynamic";

export default async function IngestionPage() {
  const runs = await prisma.ingestionRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 30,
    include: { source: { select: { name: true, slug: true } } },
  });

  const sources = await prisma.source.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Ingestion"
        subtitle="Pipeline run history and source configuration"
      />

      <PipelineControls />

      <div className="panel" style={{ marginBottom: "1.5rem" }}>
        <div className="panel-header">Sources</div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Active</th>
              <th>Interval</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td className="muted">{s.slug}</td>
                <td>{s.isActive ? "yes" : "—"}</td>
                <td className="muted">{s.scrapeIntervalHours}h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <div className="panel-header">Recent runs</div>
        {runs.length === 0 ? (
          <div className="empty-state">No ingestion runs yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>Status</th>
                <th>Fetched</th>
                <th>New</th>
                <th>Started</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id}>
                  <td>{run.source.name}</td>
                  <td>
                    <span
                      className={`badge ${
                        run.status === "success"
                          ? "badge-approved"
                          : run.status === "failed"
                            ? "badge-rejected"
                            : "badge-new"
                      }`}
                    >
                      {run.status}
                    </span>
                  </td>
                  <td>{run.recordsFetched}</td>
                  <td>{run.recordsNew}</td>
                  <td className="muted">{new Date(run.startedAt).toLocaleString()}</td>
                  <td className="muted cell-truncate">{run.errorMessage || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
