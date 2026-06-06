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
    {
      label: "Competition (inverted)",
      value: 100 - opportunity.competitionScore,
      weight: "25%",
    },
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
          <p className="back-nav">
            <Link href="/opportunities" className="back-link">
              ← Opportunities
            </Link>
          </p>
        }
      />

      <section className="panel panel-spaced">
        <div className="score-hero">
          <ScoreBadge score={opportunity.opportunityScore} />
          <span className="score-hero-label">Opportunity score</span>
        </div>
        <div className="panel-body">
          <OpportunityActions
            opportunityId={opportunity.id}
            currentStatus={opportunity.status}
          />
        </div>
      </section>

      <section className="panel panel-spaced">
        <div className="panel-title">Score breakdown</div>
        <div className="table-scroll">
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
                  <td className="num">{s.value.toFixed(1)}</td>
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
      </section>

      {opportunity.analysis && (
        <section className="panel panel-spaced">
          <div className="panel-title">
            AI analysis
            <span className="panel-count">
              {opportunity.analysis.selectionMethod} ·{" "}
              {new Date(opportunity.analysis.analyzedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="panel-body detail-grid">
            {opportunity.analysis.aiReasoning && (
              <p>{opportunity.analysis.aiReasoning}</p>
            )}
            {opportunity.analysis.contentStrategy?.articleCluster && (
              <div>
                <span className="section-label">Suggested articles</span>
                <ul className="detail-list">
                  {opportunity.analysis.contentStrategy.articleCluster.map((title) => (
                    <li key={title}>{title}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="panel">
        <div className="panel-title">Topic</div>
        <div className="panel-body detail-grid">
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
          <p className="u-mt-xs">
            <Link href={`/trends/${opportunity.topic.id}`}>View trend details</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
