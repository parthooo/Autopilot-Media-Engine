import { prisma } from "../../../lib/db";
import { ScoreBadge } from "../../../components/score-badge";
import { PageHeader } from "../../../components/page-header";
import { Pagination } from "../../../components/pagination";
import {
  PAGE_SIZE,
  clampPage,
  pageSkip,
  parsePage,
  totalPages,
} from "../../../lib/pagination";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TrendsPage({ searchParams }) {
  const params = await searchParams;
  const totalCount = await prisma.topic.count();
  const pages = totalPages(totalCount);
  const page = clampPage(parsePage(params.page), pages);
  const skip = pageSkip(page);

  const topics = await prisma.topic.findMany({
    orderBy: { lastSeenAt: "desc" },
    skip,
    take: PAGE_SIZE,
    include: {
      opportunity: { select: { opportunityScore: true, id: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Trends"
        subtitle={`${totalCount.toLocaleString()} topics · ${PAGE_SIZE} per page`}
      />

      <section className="panel">
        {topics.length === 0 ? (
          <div className="empty-state">No topics ingested yet.</div>
        ) : (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Signals</th>
                    <th>Score</th>
                    <th>Last seen</th>
                  </tr>
                </thead>
                <tbody>
                  {topics.map((topic) => (
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
                      <td className="muted">
                        {new Date(topic.lastSeenAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              basePath="/trends"
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
