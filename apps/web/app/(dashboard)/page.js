import { prisma } from "../../lib/db";
import { ScoreBadge } from "../../components/score-badge";
import { StatusBadge } from "../../components/status-badge";
import { PageHeader } from "../../components/page-header";
import { PlatformHierarchy } from "../../components/platform-hierarchy";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [topics, opportunities, signalsToday, activeSources, lastRun, aiWinner] =
    await Promise.all([
      prisma.topic.count(),
      prisma.opportunity.count(),
      prisma.rawSignal.count({ where: { createdAt: { gte: today } } }),
      prisma.source.count({ where: { isActive: true } }),
      prisma.ingestionRun.findFirst({
        orderBy: { startedAt: "desc" },
        include: { source: true },
      }),
      prisma.opportunity.findFirst({
        where: { status: "approved" },
        orderBy: { updatedAt: "desc" },
        include: {
          topic: { select: { title: true, category: true } },
          analysis: true,
        },
      }),
    ]);

  const topOpportunities = await prisma.opportunity.findMany({
    where: { status: { notIn: ["archived", "rejected"] } },
    orderBy: { opportunityScore: "desc" },
    take: 5,
    include: { topic: { select: { title: true, category: true } } },
  });

  return {
    topics,
    opportunities,
    signalsToday,
    activeSources,
    lastRun,
    aiWinner,
    topOpportunities,
  };
}

export default async function OverviewPage() {
  const stats = await getStats();

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle="Platform pipeline — niche library, winner gate, video + article factory"
      />

      <PlatformHierarchy stats={stats} />

      <section className="panel panel-spaced">
        <div className="panel-title">
          Top opportunities
          <span className="panel-count">{stats.topOpportunities.length}</span>
        </div>
        {stats.topOpportunities.length === 0 ? (
          <div className="empty-state">
            Run <code>npm run worker -- pipeline</code> to discover and score trends.
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Category</th>
                  <th>Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.topOpportunities.map((opp) => (
                  <tr key={opp.id}>
                    <td className="col-sticky">
                      <Link href={`/opportunities/${opp.id}`}>{opp.topic.title}</Link>
                    </td>
                    <td className="muted">{opp.topic.category || "—"}</td>
                    <td>
                      <ScoreBadge score={opp.opportunityScore} />
                    </td>
                    <td>
                      <StatusBadge status={opp.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
