import { prisma } from "../../lib/db";
import { ScoreBadge } from "../../components/score-badge";
import { StatusBadge } from "../../components/status-badge";
import { PageHeader } from "../../components/page-header";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const opportunities = await prisma.opportunity.findMany({
    where: { status: { not: "archived" } },
    orderBy: { opportunityScore: "desc" },
    take: 50,
    include: {
      topic: { select: { title: true, category: true, signalCount: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Opportunities"
        subtitle="Ranked by composite opportunity score (0–100)"
      />

      <div className="panel">
        <div className="panel-header">{opportunities.length} opportunities</div>
        {opportunities.length === 0 ? (
          <div className="empty-state">
            No scored opportunities yet. Run <code>npm run worker -- score</code>
          </div>
        ) : (
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
                  <td>
                    <Link href={`/opportunities/${opp.id}`}>{opp.topic.title}</Link>
                  </td>
                  <td className="muted">{opp.topic.category || "—"}</td>
                  <td>
                    <ScoreBadge score={opp.opportunityScore} />
                  </td>
                  <td>{opp.growthScore.toFixed(1)}</td>
                  <td>{opp.competitionScore.toFixed(1)}</td>
                  <td>{opp.monetizationScore.toFixed(1)}</td>
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
