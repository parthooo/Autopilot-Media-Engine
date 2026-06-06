import { prisma } from "../../lib/db";
import { PageHeader } from "../../components/page-header";
import { StatusBadge } from "../../components/status-badge";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const [assets, winner] = await Promise.all([
    prisma.contentAsset.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        opportunity: { include: { topic: { select: { title: true } } } },
      },
    }),
    prisma.opportunity.findFirst({
      where: { status: "approved" },
      include: { topic: { select: { title: true } } },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Content Factory"
        subtitle="AI-generated articles for your approved niche"
      />

      {winner && (
        <p className="meta-line">
          Active niche: <strong>{winner.topic.title}</strong> — run{" "}
          <strong>Generate Articles</strong> on Overview to create more
        </p>
      )}

      <div className="panel">
        <div className="panel-header">{assets.length} content assets</div>
        {assets.length === 0 ? (
          <div className="empty-state">
            No content yet. Click <strong>Generate Articles</strong> or run{" "}
            <code>npm run worker -- generate-content</code>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Niche</th>
                <th>Words</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id}>
                  <td>
                    <Link href={`/content/${asset.id}`}>{asset.title}</Link>
                  </td>
                  <td className="muted">{asset.assetType}</td>
                  <td className="muted">{asset.opportunity.topic.title}</td>
                  <td>{asset.metadata?.wordCount ?? "—"}</td>
                  <td>
                    <StatusBadge status={asset.status} />
                  </td>
                  <td className="muted">
                    {new Date(asset.createdAt).toLocaleString()}
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
