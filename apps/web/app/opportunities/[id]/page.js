import { prisma } from "../../../lib/db";
import { ScoreBadge } from "../../../components/score-badge";
import { StatusBadge } from "../../../components/status-badge";
import { OpportunityActions } from "../../../components/opportunity-actions";
import { PageHeader } from "../../../components/page-header";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OpportunityDetailPage({ params }) {
  const { id } = await params;

  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
      include: {
      topic: true,
      analysis: true,
      scoreHistory: { orderBy: { recordedAt: "desc" }, take: 5 },
    },
  });

  if (!opportunity) notFound();

  const scores = [
    { label: "Growth", value: opportunity.growthScore, weight: "30%" },
    { label: "Competition (inverted)", value: 100 - opportunity.competitionScore, weight: "25%" },
    { label: "Monetization", value: opportunity.monetizationScore, weight: "20%" },
    { label: "USA Audience", value: opportunity.usaAudienceScore, weight: "15%" },
    { label: "Evergreen", value: opportunity.evergreenScore, weight: "10%" },
  ];

  return (
    <div>
      <PageHeader
        title={opportunity.topic.title}
        subtitle={
          <>
            <StatusBadge status={opportunity.status} />
            {" · "}Scored {new Date(opportunity.scoredAt).toLocaleString()}
          </>
        }
        back={
          <p style={{ marginBottom: "0.75rem" }}>
            <Link href="/opportunities" className="back-link">
              ← Opportunities
            </Link>
          </p>
        }
      />

      <div className="panel" style={{ marginBottom: "1.5rem" }}>
        <div className="score-hero">
          <ScoreBadge score={opportunity.opportunityScore} />
          <span className="score-hero-label">opportunity score</span>
        </div>
        <div style={{ padding: "0 1.25rem 1.25rem" }}>
          <OpportunityActions
            opportunityId={opportunity.id}
            currentStatus={opportunity.status}
          />
        </div>
      </div>

      <div className="panel" style={{ marginBottom: "1.5rem" }}>
        <div className="panel-header">Score breakdown</div>
        <table>
          <thead>
            <tr>
              <th>Factor</th>
              <th>Score</th>
              <th>Weight</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((s) => (
              <tr key={s.label}>
                <td>{s.label}</td>
                <td>{s.value.toFixed(1)}</td>
                <td className="muted">{s.weight}</td>
              </tr>
            ))}
            <tr>
              <td>Competition (raw)</td>
              <td colSpan={2} className="muted">
                {opportunity.competitionScore.toFixed(1)} — higher means more saturated
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {opportunity.analysis && (
        <div className="panel" style={{ marginBottom: "1.5rem" }}>
          <div className="panel-header">
            AI analysis · {opportunity.analysis.selectionMethod} ·{" "}
            {new Date(opportunity.analysis.analyzedAt).toLocaleString()}
          </div>
          <div style={{ padding: "1.25rem" }} className="detail-grid">
            {opportunity.analysis.aiReasoning && (
              <p style={{ marginBottom: "0.75rem" }}>{opportunity.analysis.aiReasoning}</p>
            )}
            {opportunity.analysis.contentStrategy?.articleCluster && (
              <div>
                <strong style={{ display: "block", marginBottom: "0.5rem" }}>
                  Suggested articles
                </strong>
                <ul style={{ paddingLeft: "1.25rem", color: "var(--color-ink-muted)" }}>
                  {opportunity.analysis.contentStrategy.articleCluster.map((title) => (
                    <li key={title}>{title}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-header">Topic info</div>
        <div style={{ padding: "1.25rem" }} className="detail-grid">
          <div className="detail-row">
            <strong>Category</strong>
            <span>{opportunity.topic.category || "—"}</span>
          </div>
          <div className="detail-row">
            <strong>Signals</strong>
            <span>{opportunity.topic.signalCount}</span>
          </div>
          <div className="detail-row">
            <strong>Keywords</strong>
            <span>
              {opportunity.topic.keywords.length
                ? opportunity.topic.keywords.join(", ")
                : "—"}
            </span>
          </div>
          <p style={{ marginTop: "0.5rem" }}>
            <Link href={`/trends/${opportunity.topic.id}`}>View trend details →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
