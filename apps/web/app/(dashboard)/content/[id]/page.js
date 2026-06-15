import { prisma } from "../../../../lib/db";
import { PageHeader } from "../../../../components/page-header";
import { StatusBadge } from "../../../../components/status-badge";
import { RenderVideoButton } from "../../../../components/render-video-button";
import { VideoPreview } from "../../../../components/video-preview";
import { assetTypeLabel, assetDurationLabel } from "../../../../lib/content-asset";
import {
  videoPlaybackUrl,
  formatDuration,
  getVideoFileInfo,
  renderStatusLabel,
} from "../../../../lib/video-asset";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ContentDetailPage({ params }) {
  const { id } = await params;

  const asset = await prisma.contentAsset.findUnique({
    where: { id },
    include: {
      opportunity: { include: { topic: true } },
      videoAsset: true,
    },
  });

  if (!asset) notFound();

  const isYouTube = asset.assetType === "youtube_script";
  const isShort = asset.assetType === "shorts_script";
  const isArticle = asset.assetType === "article";
  const isVideoScript = isYouTube || isShort;
  const playbackUrl = videoPlaybackUrl(asset.videoAsset);
  const hasRenderedVideo = asset.videoAsset?.status === "completed" && playbackUrl;
  const fileInfo = getVideoFileInfo(asset.videoAsset);

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

      {isVideoScript && (
        <section className="panel panel-spaced">
          <div className="panel-title">Video</div>
          <div className="panel-body">
            <p className="muted u-mb-sm">
              {isYouTube
                ? "Long-form 16:9 · captions · Ken Burns motion · v2 quality pipeline"
                : "Vertical 9:16 Short · captions · fast pacing · v2 quality pipeline"}
              {!process.env.PEXELS_API_KEY && (
                <span className="message-error">
                  {" "}
                  · Set PEXELS_API_KEY in .env for stock B-roll
                </span>
              )}
            </p>
            <RenderVideoButton
              assetId={asset.id}
              hasVideo={hasRenderedVideo}
              dbStatus={asset.videoAsset?.status}
            />
            {asset.videoAsset?.status === "failed" && (
              <p className="meta-line message-error u-mt-sm">
                Last render failed: {asset.videoAsset.errorMessage}
              </p>
            )}
          </div>
        </section>
      )}

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
          {isVideoScript && (
            <div className="detail-row">
              <strong>Video</strong>
              <span>{renderStatusLabel(asset.videoAsset)}</span>
            </div>
          )}
          {hasRenderedVideo && (
            <>
              <div className="detail-row">
                <strong>Duration</strong>
                <span>{formatDuration(asset.videoAsset.durationSeconds)}</span>
              </div>
              <div className="detail-row">
                <strong>Resolution</strong>
                <span>
                  {asset.videoAsset.width}×{asset.videoAsset.height}
                </span>
              </div>
            </>
          )}
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

      {hasRenderedVideo && (
        <section className="panel panel-spaced">
          <div className="panel-title">Preview</div>
          <div className="panel-body">
            {asset.videoAsset.metadata?.thumbnailRelative && (
              <p className="meta-line u-mb-sm">
                Thumbnail · quality {asset.videoAsset.metadata?.qualityVersion || "v1"}
                {asset.videoAsset.metadata?.hasPexels ? " · Pexels B-roll" : " · slides only"}
              </p>
            )}
            <VideoPreview
              src={playbackUrl}
              format={isShort ? "short" : "long"}
              versionKey={
                asset.videoAsset.renderedAt
                  ? String(new Date(asset.videoAsset.renderedAt).getTime())
                  : String(new Date(asset.videoAsset.updatedAt).getTime())
              }
            />
          </div>
        </section>
      )}

      {isVideoScript && (
        <section className="panel panel-spaced">
          <div className="panel-title">Where the file is saved</div>
          <div className="panel-body">
            {fileInfo ? (
              <>
                <div className="detail-row">
                  <strong>On disk</strong>
                  <code>{fileInfo.absolute}</code>
                </div>
                <div className="detail-row">
                  <strong>Project path</strong>
                  <code>{fileInfo.relative}</code>
                </div>
                <p className="meta-line u-mt-sm">
                  MP4s live under <code>renders/&lt;opportunity-id&gt;/</code> at the repo root
                  (gitignored). Preview above uses the local dashboard — not uploaded anywhere yet.
                </p>
              </>
            ) : (
              <p className="muted">
                No MP4 yet. Click <strong>Generate video</strong> above. Files are written to{" "}
                <code>renders/{asset.opportunityId}/</code> in your project folder.
              </p>
            )}
          </div>
        </section>
      )}

      <section className="panel">
        <div className="panel-title">Script</div>
        <pre className="article-preview">{asset.body}</pre>
      </section>
    </div>
  );
}
