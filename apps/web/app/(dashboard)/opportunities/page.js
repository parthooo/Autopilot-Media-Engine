import { prisma } from "../../../lib/db";
import { ScoreBadge } from "../../../components/score-badge";
import { StatusBadge } from "../../../components/status-badge";
import { PageHeader } from "../../../components/page-header";
import { Pagination } from "../../../components/pagination";
import { TableHeaderFilter } from "../../../components/table-header-filter";
import { PruneLibraryButton } from "../../../components/prune-library-button";
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
  STATUS_FILTERS,
  parseOpportunitiesFilters,
  buildOpportunitiesWhere,
  buildOpportunitiesPath,
  hasActiveOpportunitiesFilters,
  opportunitiesFilterSummary,
} from "../../../lib/opportunities-filters";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage({ searchParams }) {
  const params = await searchParams;
  const filters = parseOpportunitiesFilters(params);
  const where = buildOpportunitiesWhere(filters);

  const [totalCount, categories, uncategorizedCount] = await Promise.all([
    prisma.opportunity.count({ where }),
    prisma.topic.findMany({
      distinct: ["category"],
      where: { category: { not: null }, opportunity: { isNot: null } },
      select: { category: true },
      orderBy: { category: "asc" },
    }),
    prisma.topic.count({
      where: { category: null, opportunity: { isNot: null } },
    }),
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

  const whenOptions = withFilterHrefs(TIME_FILTERS, filters, "when", buildOpportunitiesPath);
  const categoryFilterOptions = withFilterHrefs(
    categoryOptions,
    filters,
    "category",
    buildOpportunitiesPath
  );
  const scoreOptions = withFilterHrefs(SCORE_FILTERS, filters, "score", buildOpportunitiesPath);
  const statusOptions = withFilterHrefs(STATUS_FILTERS, filters, "status", buildOpportunitiesPath);

  const pages = totalPages(totalCount);
  const page = clampPage(parsePage(params.page), pages);
  const skip = pageSkip(page);
  const basePath = buildOpportunitiesPath(filters);
  const activeSummary = opportunitiesFilterSummary(filters);
  const showTable = totalCount > 0 || hasActiveOpportunitiesFilters(filters);

  const opportunities = showTable
    ? await prisma.opportunity.findMany({
        where,
        orderBy: { opportunityScore: "desc" },
        skip,
        take: PAGE_SIZE,
        include: {
          topic: {
            select: { title: true, category: true, signalCount: true, lastSeenAt: true },
          },
        },
      })
    : [];

  const subtitleParts = [
    `${totalCount.toLocaleString()} opportunities`,
    `${PAGE_SIZE} per page`,
    "ranked by composite score (0–100)",
  ];
  if (activeSummary.length > 0) {
    subtitleParts.push(activeSummary.join(" · "));
  }

  return (
    <div>
      <PageHeader title="Opportunities" subtitle={subtitleParts.join(" · ")} />

      <section className="panel">
        {!showTable ? (
          <div className="empty-state">
            No scored opportunities yet. Run <code>npm run worker -- score</code>
          </div>
        ) : (
          <>
            <div className="table-toolbar">
              {hasActiveOpportunitiesFilters(filters) ? (
                <Link href="/opportunities" className="table-toolbar-link">
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
                    <th>Topic</th>
                    <TableHeaderFilter
                      label="Category"
                      value={filters.category}
                      options={categoryFilterOptions}
                    />
                    <TableHeaderFilter
                      label="Score"
                      value={filters.score}
                      options={scoreOptions}
                    />
                    <th>Growth</th>
                    <th>Competition</th>
                    <th>Monetization</th>
                    <TableHeaderFilter
                      label="Status"
                      value={filters.status}
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
                  {opportunities.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="table-empty-row">
                        No opportunities match these filters.
                      </td>
                    </tr>
                  ) : (
                    opportunities.map((opp) => (
                      <tr key={opp.id}>
                        <td className="col-sticky">
                          <Link href={`/opportunities/${opp.id}`}>{opp.topic.title}</Link>
                        </td>
                        <td className="muted">{opp.topic.category || "—"}</td>
                        <td>
                          <ScoreBadge score={opp.opportunityScore} />
                        </td>
                        <td className="num">{opp.growthScore.toFixed(1)}</td>
                        <td className="num">{opp.competitionScore.toFixed(1)}</td>
                        <td className="num">{opp.monetizationScore.toFixed(1)}</td>
                        <td>
                          <StatusBadge status={opp.status} />
                        </td>
                        <td className="muted">
                          {new Date(opp.topic.lastSeenAt).toLocaleString()}
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
