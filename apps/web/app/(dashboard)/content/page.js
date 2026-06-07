import { prisma } from "../../../lib/db";
import { PageHeader } from "../../../components/page-header";
import { StatusBadge } from "../../../components/status-badge";
import { Pagination } from "../../../components/pagination";
import { PipelineControls } from "../../../components/pipeline-controls";
import { assetTypeLabel, assetDurationLabel } from "../../../lib/content-asset";
import {
  PAGE_SIZE,
  clampPage,
  pageSkip,
  parsePage,
  totalPages,
} from "../../../lib/pagination";
import Link from "next/link";

export const dynamic = "force-dynamic";

const TYPE_FILTERS = [
  { value: "", label: "All" },
  { value: "youtube_script", label: "YouTube" },
  { value: "shorts_script", label: "Shorts" },
  { value: "article", label: "Articles" },
];

export default async function ContentPage({ searchParams }) {
  const params = await searchParams;
  const typeFilter = params.type || "";
  const where = typeFilter ? { assetType: typeFilter } : {};

  const totalCount = await prisma.contentAsset.count({ where });
  const pages = totalPages(totalCount);
  const page = clampPage(parsePage(params.page), pages);
  const skip = pageSkip(page);

  const [assets, winner, typeCounts] = await Promise.all([
    prisma.contentAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      include: {
        opportunity: { include: { topic: { select: { title: true } } } },
      },
    }),
    prisma.opportunity.findFirst({
      where: { status: "approved" },
      include: { topic: { select: { title: true } } },
    }),
    prisma.contentAsset.groupBy({
      by: ["assetType"],
      _count: { _all: true },
    }),
  ]);

  const countByType = Object.fromEntries(
    typeCounts.map((row) => [row.assetType, row._count._all])
  );

  return (
    <div>
      <PageHeader
        title="Content"
        subtitle={`${totalCount.toLocaleString()} assets · YouTube-first pipeline`}
      />

      {winner && (
        <p className="meta-line">
          Active niche: {winner.topic.title}
        </p>
      )}

      <PipelineControls filterGroup="content" compact />

      <nav className="filter-row" aria-label="Filter by content type">
        {TYPE_FILTERS.map((filter) => {
          const count =
            filter.value === ""
              ? Object.values(countByType).reduce((a, b) => a + b, 0)
              : countByType[filter.value] || 0;
          const href = filter.value ? `/content?type=${filter.value}` : "/content";
          const active = typeFilter === filter.value;

          return (
            <Link
              key={filter.value || "all"}
              href={href}
              className={active ? "filter-chip active" : "filter-chip"}
            >
              {filter.label} ({count})
            </Link>
          );
        })}
      </nav>

      <section className="panel">
        {totalCount === 0 ? (
          <div className="empty-state">
            No content yet. Use <strong>Generate YouTube</strong> above, or run{" "}
            <code>npm run worker -- generate-content --youtube-only</code>
          </div>
        ) : (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Niche</th>
                    <th>Length</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => (
                    <tr key={asset.id}>
                      <td className="col-sticky">
                        <Link href={`/content/${asset.id}`}>{asset.title}</Link>
                      </td>
                      <td className="muted">{assetTypeLabel(asset.assetType)}</td>
                      <td className="muted">{asset.opportunity.topic.title}</td>
                      <td className="num">{assetDurationLabel(asset)}</td>
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
            </div>
            <Pagination
              basePath={typeFilter ? `/content?type=${typeFilter}` : "/content"}
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
