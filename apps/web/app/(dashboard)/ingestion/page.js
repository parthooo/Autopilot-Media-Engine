import { prisma } from "../../../lib/db";
import { sortBySourceSlugOrder } from "@ame/core";
import { PageHeader } from "../../../components/page-header";
import { PipelineControls } from "../../../components/pipeline-controls";
import { StatusBadge } from "../../../components/status-badge";
import { Pagination } from "../../../components/pagination";
import { TableHeaderFilter } from "../../../components/table-header-filter";
import { PanelAccordion } from "../../../components/panel-accordion";
import { withFilterHrefs } from "../../../lib/filter-hrefs";
import {
  PAGE_SIZE,
  clampPage,
  pageSkip,
  parsePage,
  totalPages,
} from "../../../lib/pagination";
import {
  TIME_FILTERS,
  SOURCE_ACTIVE_FILTERS,
  RUN_STATUS_FILTERS,
  parseIngestionFilters,
  buildIngestionRunsWhere,
  filterSources,
  buildIngestionPath,
  hasActiveRunFilters,
  ingestionFilterSummary,
} from "../../../lib/ingestion-filters";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function IngestionPage({ searchParams }) {
  const params = await searchParams;
  const filters = parseIngestionFilters(params);
  const runsWhere = buildIngestionRunsWhere(filters);

  const totalCount = await prisma.ingestionRun.count({ where: runsWhere });
  const pages = totalPages(totalCount);
  const page = clampPage(parsePage(params.page), pages);
  const skip = pageSkip(page);
  const basePath = buildIngestionPath(filters);
  const activeSummary = ingestionFilterSummary(filters);
  const showRunsTable = totalCount > 0 || hasActiveRunFilters(filters);

  const [runs, sources] = await Promise.all([
    showRunsTable
      ? prisma.ingestionRun.findMany({
          where: runsWhere,
          orderBy: { startedAt: "desc" },
          skip,
          take: PAGE_SIZE,
          include: { source: { select: { name: true, slug: true } } },
        })
      : [],
    prisma.source.findMany(),
  ]);

  const orderedSources = filterSources(sortBySourceSlugOrder(sources), filters);

  const sourceOptions = [
    { value: "", label: "All sources" },
    ...sources.map((source) => ({
      value: source.slug,
      label: source.name,
    })),
  ];

  const srcActiveOptions = withFilterHrefs(
    SOURCE_ACTIVE_FILTERS,
    filters,
    "src",
    buildIngestionPath
  );
  const sourceFilterOptions = withFilterHrefs(
    sourceOptions,
    filters,
    "source",
    buildIngestionPath
  );
  const runStatusOptions = withFilterHrefs(
    RUN_STATUS_FILTERS,
    filters,
    "status",
    buildIngestionPath
  );
  const whenOptions = withFilterHrefs(TIME_FILTERS, filters, "when", buildIngestionPath);

  const subtitleParts = ["Pipeline run history and source configuration"];
  if (activeSummary.length > 0) {
    subtitleParts.push(activeSummary.join(" · "));
  }

  return (
    <div>
      <PageHeader title="Ingestion" subtitle={subtitleParts.join(" · ")} />

      <PipelineControls layout="grid" gridLayout="2-3" className="ingestion-pipeline" />

      <PanelAccordion title="Sources" count={orderedSources.length} className="panel-spaced">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <TableHeaderFilter
                  label="Active"
                  value={filters.src}
                  options={srcActiveOptions}
                />
                <th>Interval</th>
              </tr>
            </thead>
            <tbody>
              {orderedSources.length === 0 ? (
                <tr>
                  <td colSpan={4} className="table-empty-row">
                    No sources match this filter.
                  </td>
                </tr>
              ) : (
                orderedSources.map((s) => (
                  <tr key={s.id}>
                    <td className="col-sticky">{s.name}</td>
                    <td className="muted">{s.slug}</td>
                    <td>{s.isActive ? "yes" : "—"}</td>
                    <td className="muted">{s.scrapeIntervalHours}h</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </PanelAccordion>

      <section className="panel panel-spaced">
        <div className="panel-title">
          Recent runs
          <span className="panel-count">{totalCount.toLocaleString()}</span>
        </div>
        {!showRunsTable ? (
          <div className="empty-state">No ingestion runs yet.</div>
        ) : (
          <>
            {hasActiveRunFilters(filters) && (
              <div className="table-toolbar">
                <Link href={buildIngestionPath({ ...filters, source: "", status: "", when: "" })} className="table-toolbar-link">
                  Clear run filters
                </Link>
                <span />
              </div>
            )}
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <TableHeaderFilter
                      label="Source"
                      value={filters.source}
                      options={sourceFilterOptions}
                    />
                    <TableHeaderFilter
                      label="Status"
                      value={filters.status}
                      options={runStatusOptions}
                    />
                    <th>Fetched</th>
                    <th>New</th>
                    <TableHeaderFilter
                      label="Started"
                      value={filters.when}
                      options={whenOptions}
                    />
                  </tr>
                </thead>
                <tbody>
                  {runs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="table-empty-row">
                        No runs match these filters.
                      </td>
                    </tr>
                  ) : (
                    runs.map((run) => (
                      <tr key={run.id}>
                        <td className="col-sticky">{run.source.name}</td>
                        <td>
                          <StatusBadge status={run.status} />
                        </td>
                        <td className="num">{run.recordsFetched}</td>
                        <td className="num">{run.recordsNew}</td>
                        <td className="muted">{new Date(run.startedAt).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              basePath={basePath}
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
