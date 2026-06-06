import { prisma } from "../../lib/db";
import { PageHeader } from "../../components/page-header";
import { StatusBadge } from "../../components/status-badge";
import { Pagination } from "../../components/pagination";
import {
  PAGE_SIZE,
  clampPage,
  pageSkip,
  parsePage,
  totalPages,
} from "../../lib/pagination";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ContentPage({ searchParams }) {
  const params = await searchParams;
  const totalCount = await prisma.contentAsset.count();
  const pages = totalPages(totalCount);
  const page = clampPage(parsePage(params.page), pages);
  const skip = pageSkip(page);

  const [assets, winner] = await Promise.all([
    prisma.contentAsset.findMany({
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
  ]);

  return (
    <div>
      <PageHeader
        title="Content"
        subtitle={`${totalCount.toLocaleString()} assets · ${PAGE_SIZE} per page`}
      />

      {winner && (
        <p className="meta-line">
          Active niche: {winner.topic.title} — run generate on Overview for more
        </p>
      )}

      <section className="panel">
        {totalCount === 0 ? (
          <div className="empty-state">
            No content yet. Run <code>npm run worker -- generate-content</code>
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
                    <th>Words</th>
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
                      <td className="muted">{asset.assetType}</td>
                      <td className="muted">{asset.opportunity.topic.title}</td>
                      <td className="num">{asset.metadata?.wordCount ?? "—"}</td>
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
              basePath="/content"
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
