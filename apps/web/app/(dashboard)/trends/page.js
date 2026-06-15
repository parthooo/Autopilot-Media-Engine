import { prisma } from "../../../lib/db";
import { ScoreBadge } from "../../../components/score-badge";
import { StatusBadge } from "../../../components/status-badge";
import { PageHeader } from "../../../components/page-header";
import { Pagination } from "../../../components/pagination";
import { TableHeaderFilter } from "../../../components/table-header-filter";
import { PruneLibraryButton } from "../../../components/prune-library-button";
import { DateTimeCell } from "../../../components/datetime-cell";
import {
  PAGE_SIZE,
  clampPage,
  pageSkip,
  parsePage,
  totalPages,
} from "../../../lib/pagination";
import { withFilterHrefs } from "../../../lib/filter-hrefs";
import {
  TIME_FILTERS,
  SCORE_FILTERS,
  WINNER_FILTERS,
  parseTrendsFilters,
  buildTrendsWhere,
  buildTrendsPath,
  hasActiveTrendsFilters,
  trendsFilterSummary,
} from "../../../lib/trends-filters";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TrendsPage({ searchParams }) {
  const params = await searchParams;
  const filters = parseTrendsFilters(params);
  const where = buildTrendsWhere(filters);

  const [totalCount, categories, uncategorizedCount] = await Promise.all([
    prisma.topic.count({ where }),
    prisma.topic.findMany({
      distinct: ["category"],
      where: { category: { not: null } },
      select: { category: true },
      orderBy: { category: "asc" },
    }),
    prisma.topic.count({ where: { category: null } }),
  ]);

  const categoryOptions = [
    { value: "", label: "All" },
    ...categories.map((row) => ({
      value: row.category,
      label: row.category,
    })),
    ...(uncategorizedCount > 0
      ? [{ value: "_none", label: "Uncategorized" }]
      : []),
  ];

  const whenOptions = withFilterHrefs(TIME_FILTERS, filters, "when", buildTrendsPath);
  const categoryFilterOptions = withFilterHrefs(
    categoryOptions,
    filters,
    "category",
    buildTrendsPath
  );
  const scoreOptions = withFilterHrefs(SCORE_FILTERS, filters, "score", buildTrendsPath);
  const statusOptions = withFilterHrefs(WINNER_FILTERS, filters, "winner", buildTrendsPath);

  const pages = totalPages(totalCount);
  const page = clampPage(parsePage(params.page), pages);
  const skip = pageSkip(page);
  const basePath = buildTrendsPath(filters);
  const activeSummary = trendsFilterSummary(filters);
  const showTable = totalCount > 0 || hasActiveTrendsFilters(filters);

  const topics = showTable
    ? await prisma.topic.findMany({
        where,
        orderBy: { lastSeenAt: "desc" },
        skip,
        take: PAGE_SIZE,
        include: {
          opportunity: { select: { opportunityScore: true, id: true, status: true } },
        },
      })
    : [];

  const subtitleParts = [`${totalCount.toLocaleString()} topics`, `${PAGE_SIZE} per page`];
  if (activeSummary.length > 0) {
    subtitleParts.push(activeSummary.join(" · "));
  }

  return (
    <div>
      <PageHeader title="Trends" subtitle={subtitleParts.join(" · ")} />

      <section className="panel">
        {!showTable ? (
          <div className="empty-state">No topics ingested yet.</div>
        ) : (
          <>
            <div className="table-toolbar">
              {hasActiveTrendsFilters(filters) ? (
                <Link href="/trends" className="table-toolbar-link">
                  Clear filters
                </Link>
              ) : (
                <span />
              )}
              <PruneLibraryButton compact />
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <TableHeaderFilter
                      label="Category"
                      value={filters.category}
                      options={categoryFilterOptions}
                    />
                    <th>Signals</th>
                    <TableHeaderFilter
                      label="Score"
                      value={filters.score}
                      options={scoreOptions}
                    />
                    <TableHeaderFilter
                      label="Status"
                      value={filters.winner}
                      options={statusOptions}
                    />
                    <TableHeaderFilter
                      label="Last seen"
                      value={filters.when}
                      options={whenOptions}
                    />
                  </tr>
                </thead>
                <tbody>
                  {topics.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="table-empty-row">
                        No topics match these filters.
                      </td>
                    </tr>
                  ) : (
                    topics.map((topic) => (
                      <tr key={topic.id}>
                        <td className="col-sticky">
                          <Link href={`/trends/${topic.id}`}>{topic.title}</Link>
                        </td>
                        <td className="muted">{topic.category || "—"}</td>
                        <td className="num">{topic.signalCount}</td>
                        <td>
                          {topic.opportunity ? (
                            <Link href={`/opportunities/${topic.opportunity.id}`}>
                              <ScoreBadge score={topic.opportunity.opportunityScore} />
                            </Link>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td>
                          {topic.opportunity?.status === "approved" ? (
                            <StatusBadge status="approved" />
                          ) : topic.opportunity?.status === "rejected" ? (
                            <StatusBadge status="rejected" />
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td className="muted">
                          <DateTimeCell value={topic.lastSeenAt} />
                        </td>
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
