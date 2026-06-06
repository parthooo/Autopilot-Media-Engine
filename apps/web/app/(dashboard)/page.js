import { prisma } from "../../lib/db";
import { ScoreBadge } from "../../components/score-badge";
import { StatusBadge } from "../../components/status-badge";
import { PageHeader } from "../../components/page-header";
import { PipelineControls } from "../../components/pipeline-controls";
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
        subtitle="Trend discovery and opportunity scoring at a glance"
      />

      <PipelineControls />

      <div className="stat-strip">
        <div className="stat-strip-item">
          <div className="stat-value">{stats.topics}</div>
          <div className="stat-label">Topics tracked</div>
        </div>
        <div className="stat-strip-item">
          <div className="stat-value">{stats.opportunities}</div>
          <div className="stat-label">Opportunities scored</div>
        </div>
        <div className="stat-strip-item">
          <div className="stat-value">{stats.signalsToday}</div>
          <div className="stat-label">Signals today</div>
        </div>
        <div className="stat-strip-item">
          <div className="stat-value">{stats.activeSources}</div>
          <div className="stat-label">Active sources</div>
        </div>
      </div>

      {stats.lastRun && (
        <p className="meta-line">
          Last ingestion: {stats.lastRun.source.name} — {stats.lastRun.status}
          {stats.lastRun.completedAt &&
            ` · ${new Date(stats.lastRun.completedAt).toLocaleString()}`}
        </p>
      )}

      {stats.aiWinner ? (
        <section className="panel panel-spaced">
          <div className="panel-title">Active niche</div>
          <div className="panel-body">
            <div className="score-hero score-hero--flush">
              <ScoreBadge score={stats.aiWinner.opportunityScore} />
              <Link href={`/opportunities/${stats.aiWinner.id}`}>
                {stats.aiWinner.topic.title}
              </Link>
            </div>
            {stats.aiWinner.analysis?.aiReasoning && (
              <p className="muted u-mt-xs">{stats.aiWinner.analysis.aiReasoning}</p>
            )}
            {stats.aiWinner.analysis?.contentStrategy?.siteAngle && (
              <p className="u-mt-xs">
                <span className="section-label">Site angle</span>
                {stats.aiWinner.analysis.contentStrategy.siteAngle}
              </p>
            )}
          </div>
        </section>
      ) : (
        <section className="panel panel-spaced">
          <div className="panel-title">Active niche</div>
          <div className="empty-state">
            Run full pipeline — AI picks one niche automatically.
          </div>
        </section>
      )}

      <section className="panel">
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
