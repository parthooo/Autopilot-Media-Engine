import { prisma } from "../../lib/db";
import { ScoreBadge } from "../../components/score-badge";
import { StatusBadge } from "../../components/status-badge";
import { PageHeader } from "../../components/page-header";
import { Pagination } from "../../components/pagination";
import {
  PAGE_SIZE,
  clampPage,
  pageSkip,
  parsePage,
  totalPages,
} from "../../lib/pagination";
import Link from "next/link";

export const dynamic = "force-dynamic";

const listWhere = { status: { not: "archived" } };

export default async function OpportunitiesPage({ searchParams }) {
  const params = await searchParams;
  const totalCount = await prisma.opportunity.count({ where: listWhere });
  const pages = totalPages(totalCount);
  const page = clampPage(parsePage(params.page), pages);
  const skip = pageSkip(page);

  const opportunities = await prisma.opportunity.findMany({
    where: listWhere,
    orderBy: { opportunityScore: "desc" },
    skip,
    take: PAGE_SIZE,
    include: {
      topic: { select: { title: true, category: true, signalCount: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Opportunities"
        subtitle={`${totalCount.toLocaleString()} ranked by composite score (0–100)`}
      />

      <section className="panel">
        {totalCount === 0 ? (
          <div className="empty-state">
            No scored opportunities yet. Run <code>npm run worker -- score</code>
          </div>
        ) : (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Topic</th>
                    <th>Category</th>
                    <th>Score</th>
                    <th>Growth</th>
                    <th>Competition</th>
                    <th>Monetization</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map((opp) => (
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              basePath="/opportunities"
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
