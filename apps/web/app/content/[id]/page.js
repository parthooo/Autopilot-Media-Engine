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
          <p className="back-nav">
            <Link href="/content" className="back-link">
              ← Content
            </Link>
          </p>
        }
      />

      <section className="panel panel-spaced">
        <div className="panel-title">Metadata</div>
        <div className="panel-body detail-grid">
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
      </section>

      <section className="panel">
        <div className="panel-title">Preview</div>
        <pre className="article-preview">{asset.body}</pre>
      </section>
    </div>
  );
}
