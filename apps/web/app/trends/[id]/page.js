import { prisma } from "../../../lib/db";
import { ScoreBadge } from "../../../components/score-badge";
import { PageHeader } from "../../../components/page-header";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TrendDetailPage({ params }) {
  const { id } = await params;

  const topic = await prisma.topic.findUnique({
    where: { id },
    include: {
      opportunity: true,
      topicMetrics: {
        include: { source: true },
        orderBy: { capturedAt: "desc" },
        take: 20,
      },
      rawSignals: {
        include: { source: true },
        orderBy: { discoveredAt: "desc" },
        take: 10,
      },
    },
  });

  if (!topic) notFound();

  return (
    <div>
      <PageHeader
        title={topic.title}
        subtitle={`${topic.category || "uncategorized"} · ${topic.signalCount} signals`}
        back={
          <p style={{ marginBottom: "0.75rem" }}>
            <Link href="/trends" className="back-link">
              ← Trends
            </Link>
          </p>
        }
      />

      {topic.opportunity && (
        <div className="panel" style={{ marginBottom: "1.5rem" }}>
          <div className="score-hero">
            <ScoreBadge score={topic.opportunity.opportunityScore} />
            <span className="score-hero-label">opportunity score</span>
            <Link href={`/opportunities/${topic.opportunity.id}`}>
              View details →
            </Link>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-header">Recent metrics</div>
        <table>
          <thead>
            <tr>
              <th>Source</th>
              <th>Rank</th>
              <th>Volume</th>
              <th>Engagement</th>
              <th>Captured</th>
            </tr>
          </thead>
          <tbody>
            {topic.topicMetrics.map((m) => (
              <tr key={m.id}>
                <td>{m.source.name}</td>
                <td>{m.rankPosition ?? "—"}</td>
                <td>{m.volumeEstimate ?? "—"}</td>
                <td>{m.engagementScore?.toFixed(1) ?? "—"}</td>
                <td className="muted">{new Date(m.capturedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <div className="panel-header">Raw signals</div>
        <table>
          <thead>
            <tr>
              <th>Source</th>
              <th>Title</th>
              <th>Discovered</th>
            </tr>
          </thead>
          <tbody>
            {topic.rawSignals.map((s) => (
              <tr key={s.id}>
                <td>{s.source.name}</td>
                <td>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title}
                    </a>
                  ) : (
                    s.title
                  )}
                </td>
                <td className="muted">{new Date(s.discoveredAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
