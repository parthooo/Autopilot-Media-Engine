import { prisma } from "../../lib/db";
import { PageHeader } from "../../components/page-header";
import { PipelineControls } from "../../components/pipeline-controls";
import { StatusBadge } from "../../components/status-badge";
import { Pagination } from "../../components/pagination";
import {
  PAGE_SIZE,
  clampPage,
  pageSkip,
  parsePage,
  totalPages,
} from "../../lib/pagination";

export const dynamic = "force-dynamic";

export default async function IngestionPage({ searchParams }) {
  const params = await searchParams;
  const totalCount = await prisma.ingestionRun.count();
  const pages = totalPages(totalCount);
  const page = clampPage(parsePage(params.page), pages);
  const skip = pageSkip(page);

  const [runs, sources] = await Promise.all([
    prisma.ingestionRun.findMany({
      orderBy: { startedAt: "desc" },
      skip,
      take: PAGE_SIZE,
      include: { source: { select: { name: true, slug: true } } },
    }),
    prisma.source.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Ingestion"
        subtitle="Pipeline run history and source configuration"
      />

      <PipelineControls />

      <section className="panel panel-spaced">
        <div className="panel-title">
          Sources
          <span className="panel-count">{sources.length}</span>
        </div>
        <div className="table-scroll">
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
                  <td className="col-sticky">{s.name}</td>
                  <td className="muted">{s.slug}</td>
                  <td>{s.isActive ? "yes" : "—"}</td>
                  <td className="muted">{s.scrapeIntervalHours}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          Recent runs
          <span className="panel-count">{totalCount.toLocaleString()}</span>
        </div>
        {totalCount === 0 ? (
          <div className="empty-state">No ingestion runs yet.</div>
        ) : (
          <>
            <div className="table-scroll">
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
                      <td className="col-sticky">{run.source.name}</td>
                      <td>
                        <StatusBadge status={run.status} />
                      </td>
                      <td className="num">{run.recordsFetched}</td>
                      <td className="num">{run.recordsNew}</td>
                      <td className="muted">{new Date(run.startedAt).toLocaleString()}</td>
                      <td className="muted cell-truncate">{run.errorMessage || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              basePath="/ingestion"
              page={page}
              totalPages={pages}
              totalCount={totalCount}
            />
          </>
        )}
      </section>
    </div>
  );
}
