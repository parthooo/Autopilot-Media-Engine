import { prisma } from "../../../../lib/db";
import { PageHeader } from "../../../../components/page-header";
import { StatusBadge } from "../../../../components/status-badge";
import { assetTypeLabel, assetDurationLabel } from "../../../../lib/content-asset";
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

  const isYouTube = asset.assetType === "youtube_script";
  const isShort = asset.assetType === "shorts_script";
  const isArticle = asset.assetType === "article";

  return (
    <div>
      <PageHeader
        title={asset.title}
        subtitle={`${assetTypeLabel(asset.assetType)} · ${asset.opportunity.topic.title}`}
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
            <strong>Length</strong>
            <span>{assetDurationLabel(asset)}</span>
          </div>
          {(isYouTube || isShort) && asset.metadata?.hook && (
            <div className="detail-row">
              <strong>Hook</strong>
              <span>{asset.metadata.hook}</span>
            </div>
          )}
          {isYouTube && asset.metadata?.thumbnailConcept && (
            <div className="detail-row">
              <strong>Thumbnail</strong>
              <span>{asset.metadata.thumbnailConcept}</span>
            </div>
          )}
          {isArticle && (
            <>
              <div className="detail-row">
                <strong>SEO title</strong>
                <span>{asset.metadata?.seoTitle || "—"}</span>
              </div>
              <div className="detail-row">
                <strong>Slug</strong>
                <span>{asset.metadata?.slug || "—"}</span>
              </div>
            </>
          )}
          {asset.metadata?.tags?.length > 0 && (
            <div className="detail-row">
              <strong>Tags</strong>
              <span>{asset.metadata.tags.join(", ")}</span>
            </div>
          )}
        </div>
      </section>

      {(isYouTube || isShort) && (
        <section className="panel panel-spaced">
          <div className="panel-title">Upload checklist</div>
          <ul className="checklist">
            <li>Review script — edit hook and CTA if needed</li>
            <li>Record voiceover or use TTS</li>
            <li>Add B-roll / screen recordings per [B-ROLL] cues</li>
            {isShort && <li>Export vertical 9:16, under 60 seconds</li>}
            {isYouTube && <li>Design thumbnail from concept above</li>}
            <li>Paste title + description tags into YouTube Studio</li>
            <li>Add affiliate links in description when eligible</li>
          </ul>
        </section>
      )}

      <section className="panel">
        <div className="panel-title">Script</div>
        <pre className="article-preview">{asset.body}</pre>
      </section>
    </div>
  );
}
