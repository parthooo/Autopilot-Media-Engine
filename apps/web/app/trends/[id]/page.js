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
          <p className="back-nav">
            <Link href="/trends" className="back-link">
              ← Trends
            </Link>
          </p>
        }
      />

      {topic.opportunity && (
        <section className="panel panel-spaced">
          <div className="score-hero">
            <ScoreBadge score={topic.opportunity.opportunityScore} />
            <span className="score-hero-label">Opportunity score</span>
            <Link href={`/opportunities/${topic.opportunity.id}`}>View details</Link>
          </div>
        </section>
      )}

      <section className="panel panel-spaced">
        <div className="panel-title">
          Recent metrics
          <span className="panel-count">{topic.topicMetrics.length}</span>
        </div>
        <div className="table-scroll">
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
                  <td className="col-sticky">{m.source.name}</td>
                  <td className="num">{m.rankPosition ?? "—"}</td>
                  <td className="num">{m.volumeEstimate ?? "—"}</td>
                  <td className="num">{m.engagementScore?.toFixed(1) ?? "—"}</td>
                  <td className="muted">{new Date(m.capturedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          Raw signals
          <span className="panel-count">{topic.rawSignals.length}</span>
        </div>
        <div className="table-scroll">
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
                  <td className="col-sticky">{s.source.name}</td>
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
      </section>
    </div>
  );
}
