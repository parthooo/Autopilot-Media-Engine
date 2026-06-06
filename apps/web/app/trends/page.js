import { prisma } from "../../lib/db";
import { ScoreBadge } from "../../components/score-badge";
import { PageHeader } from "../../components/page-header";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TrendsPage() {
  const topics = await prisma.topic.findMany({
    orderBy: { lastSeenAt: "desc" },
    take: 50,
    include: {
      opportunity: { select: { opportunityScore: true, id: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Trends"
        subtitle="Recently discovered and updated topics across all sources"
      />

      <div className="panel">
        <div className="panel-header">{topics.length} topics</div>
        {topics.length === 0 ? (
          <div className="empty-state">No topics ingested yet.</div>
        ) : (
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
                  <td>
                    <Link href={`/trends/${topic.id}`}>{topic.title}</Link>
                  </td>
                  <td className="muted">{topic.category || "—"}</td>
                  <td>{topic.signalCount}</td>
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
        )}
      </div>
    </div>
  );
}
