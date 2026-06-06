import { prisma } from "../../../lib/db";
import { PageHeader } from "../../../components/page-header";
import { StatusBadge } from "../../../components/status-badge";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ContentDetailPage({ params }) {
  const { id } = await params;

  const asset = await prisma.contentAsset.findUnique({
    where: { id },
    include: {
      opportunity: { include: { topic: true } },
    },
  });

  if (!asset) notFound();

  return (
    <div>
      <PageHeader
        title={asset.title}
        subtitle={`${asset.assetType} · ${asset.opportunity.topic.title}`}
        back={
          <p style={{ marginBottom: "0.75rem" }}>
            <Link href="/content" className="back-link">
              ← Content
            </Link>
          </p>
        }
      />

      <div className="panel" style={{ marginBottom: "1.5rem" }}>
        <div className="panel-header">Metadata</div>
        <div style={{ padding: "1.25rem" }} className="detail-grid">
          <div className="detail-row">
            <strong>Status</strong>
            <StatusBadge status={asset.status} />
          </div>
          <div className="detail-row">
            <strong>SEO title</strong>
            <span>{asset.metadata?.seoTitle || "—"}</span>
          </div>
          <div className="detail-row">
            <strong>Slug</strong>
            <span>{asset.metadata?.slug || "—"}</span>
          </div>
          <div className="detail-row">
            <strong>Words</strong>
            <span>{asset.metadata?.wordCount ?? "—"}</span>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">Article preview</div>
        <pre
          style={{
            padding: "1.25rem",
            margin: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontFamily: "var(--font-mono)",
            fontSize: "0.8125rem",
            lineHeight: 1.6,
            maxHeight: "70vh",
            overflow: "auto",
          }}
        >
          {asset.body}
        </pre>
      </div>
    </div>
  );
}
