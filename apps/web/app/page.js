import { prisma } from "../lib/db";
import { ScoreBadge } from "../components/score-badge";
import { StatusBadge } from "../components/status-badge";
import { PageHeader } from "../components/page-header";
import { PipelineControls } from "../components/pipeline-controls";
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
        subtitle="Fully automated trend discovery — AI picks your niche"
      />

      {stats.aiWinner ? (
        <div className="panel" style={{ marginBottom: "1.5rem" }}>
          <div className="panel-header">
            AI-selected winner · {stats.aiWinner.analysis?.selectionMethod || "auto"}
          </div>
          <div style={{ padding: "1.25rem" }}>
            <div className="score-hero" style={{ padding: 0, marginBottom: "0.75rem" }}>
              <ScoreBadge score={stats.aiWinner.opportunityScore} />
              <Link href={`/opportunities/${stats.aiWinner.id}`}>
                {stats.aiWinner.topic.title}
              </Link>
            </div>
            {stats.aiWinner.analysis?.aiReasoning && (
              <p className="muted" style={{ marginBottom: "0.75rem" }}>
                {stats.aiWinner.analysis.aiReasoning}
              </p>
            )}
            {stats.aiWinner.analysis?.contentStrategy?.siteAngle && (
              <p>
                <strong>Site angle:</strong>{" "}
                {stats.aiWinner.analysis.contentStrategy.siteAngle}
              </p>
            )}
            <p className="meta-line" style={{ marginTop: "0.75rem", marginBottom: 0 }}>
              Only ONE niche is active at a time. Pipeline re-evaluates every 6 hours.
            </p>
          </div>
        </div>
      ) : (
        <div className="panel" style={{ marginBottom: "1.5rem" }}>
          <div className="panel-header">No AI winner yet</div>
          <div className="empty-state">
            Run <strong>Full Pipeline</strong> below — AI will analyze trends and pick ONE
            niche automatically. No manual review needed.
          </div>
        </div>
      )}

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

      <div className="panel">
        <div className="panel-header">Top opportunities</div>
        {stats.topOpportunities.length === 0 ? (
          <div className="empty-state">
            Run <code>npm run worker -- pipeline</code> to discover and score trends.
          </div>
        ) : (
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
                  <td>
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
        )}
      </div>
    </div>
  );
}
