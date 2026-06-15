import { prisma } from "../../../lib/db";
import { PageHeader } from "../../../components/page-header";
import { StatusBadge } from "../../../components/status-badge";
import { Pagination } from "../../../components/pagination";
import { PipelineControls } from "../../../components/pipeline-controls";
import { TableHeaderFilter } from "../../../components/table-header-filter";
import { assetTypeLabel, assetDurationLabel } from "../../../lib/content-asset";
import { renderStatusLabel } from "../../../lib/video-asset";
import { withFilterHrefs } from "../../../lib/filter-hrefs";
import {
  PAGE_SIZE,
  clampPage,
  pageSkip,
  parsePage,
  totalPages,
} from "../../../lib/pagination";
import {
  TIME_FILTERS,
  TYPE_FILTERS,
  STATUS_FILTERS,
  VIDEO_FILTERS,
  parseContentFilters,
  buildContentWhere,
  buildContentPath,
  hasActiveContentFilters,
  contentFilterSummary,
} from "../../../lib/content-filters";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ContentPage({ searchParams }) {
  const params = await searchParams;
  const filters = parseContentFilters(params);
  const where = buildContentWhere(filters);

  const totalCount = await prisma.contentAsset.count({ where });
  const pages = totalPages(totalCount);
  const page = clampPage(parsePage(params.page), pages);
  const skip = pageSkip(page);
  const basePath = buildContentPath(filters);
  const activeSummary = contentFilterSummary(filters);
  const showTable = totalCount > 0 || hasActiveContentFilters(filters);

  const [assets, winner] = await Promise.all([
    showTable
      ? prisma.contentAsset.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: PAGE_SIZE,
          include: {
            opportunity: { include: { topic: { select: { title: true } } } },
            videoAsset: { select: { status: true } },
          },
        })
      : [],
    prisma.opportunity.findFirst({
      where: { status: "approved" },
      include: { topic: { select: { title: true } } },
    }),
  ]);

  const typeOptions = withFilterHrefs(TYPE_FILTERS, filters, "type", buildContentPath);
  const statusOptions = withFilterHrefs(STATUS_FILTERS, filters, "status", buildContentPath);
  const videoOptions = withFilterHrefs(VIDEO_FILTERS, filters, "video", buildContentPath);
  const whenOptions = withFilterHrefs(TIME_FILTERS, filters, "when", buildContentPath);

  const subtitleParts = [`${totalCount.toLocaleString()} assets`, "YouTube-first pipeline"];
  if (activeSummary.length > 0) {
    subtitleParts.push(activeSummary.join(" · "));
  }

  return (
    <div>
      <PageHeader title="Content" subtitle={subtitleParts.join(" · ")} />

      {winner && (
        <p className="meta-line">Active niche: {winner.topic.title}</p>
      )}

      <div className="content-factory-grid">
        <PipelineControls filterGroup="content-video" compact />
        <PipelineControls filterGroup="content-article" compact />
      </div>

      <section className="panel">
        {!showTable ? (
          <div className="empty-state">
            No content yet. Use <strong>Generate YouTube</strong> above, or run{" "}
            <code>npm run worker -- generate-content --youtube-only</code>
          </div>
        ) : (
          <>
            {hasActiveContentFilters(filters) && (
              <div className="table-toolbar">
                <Link href="/content" className="table-toolbar-link">
                  Clear filters
                </Link>
                <span />
              </div>
            )}
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <TableHeaderFilter
                      label="Type"
                      value={filters.type}
                      options={typeOptions}
                    />
                    <th>Niche</th>
                    <th>Length</th>
                    <TableHeaderFilter
                      label="Video"
                      value={filters.video}
                      options={videoOptions}
                    />
                    <TableHeaderFilter
                      label="Status"
                      value={filters.status}
                      options={statusOptions}
                    />
                    <TableHeaderFilter
                      label="Created"
                      value={filters.when}
                      options={whenOptions}
                    />
                  </tr>
                </thead>
                <tbody>
                  {assets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="table-empty-row">
                        No content matches these filters.
                      </td>
                    </tr>
                  ) : (
                    assets.map((asset) => (
                      <tr key={asset.id}>
                        <td className="col-sticky">
                          <Link href={`/content/${asset.id}`}>{asset.title}</Link>
                        </td>
                        <td className="muted">{assetTypeLabel(asset.assetType)}</td>
                        <td className="muted">{asset.opportunity.topic.title}</td>
                        <td className="num">{assetDurationLabel(asset)}</td>
                        <td className="muted">
                          {asset.assetType === "youtube_script" ||
                          asset.assetType === "shorts_script" ? (
                            <Link href={`/content/${asset.id}`}>
                              {renderStatusLabel(asset.videoAsset)}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          <StatusBadge status={asset.status} />
                        </td>
                        <td className="muted">
                          {new Date(asset.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              basePath={basePath}
              page={page}
              totalPages={pages}
              totalCount={totalCount}
            />
          </>
        )}
      </section>
    </div>
  );
}
