import Link from "next/link";
import { getPaginationItems, pageHref } from "../lib/pagination";

export function Pagination({ basePath, page, totalPages, totalCount }) {
  if (totalCount === 0 || totalPages <= 1) return null;

  const items = getPaginationItems(page, totalPages);

  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="pagination-summary">
        Page {page} of {totalPages.toLocaleString()} · {totalCount.toLocaleString()} total
      </span>
      <div className="pagination-links">
        {page > 1 ? (
          <Link href={pageHref(basePath, page - 1)} className="pagination-link">
            Prev
          </Link>
        ) : (
          <span className="pagination-link is-disabled">Prev</span>
        )}

        {items.map((item, index) =>
          item === "ellipsis" ? (
            <span key={`ellipsis-${index}`} className="pagination-ellipsis" aria-hidden="true">
              …
            </span>
          ) : (
            <Link
              key={item}
              href={pageHref(basePath, item)}
              className={`pagination-link${item === page ? " is-active" : ""}`}
              aria-current={item === page ? "page" : undefined}
            >
              {item.toLocaleString()}
            </Link>
          ),
        )}

        {page < totalPages ? (
          <Link href={pageHref(basePath, page + 1)} className="pagination-link">
            Next
          </Link>
        ) : (
          <span className="pagination-link is-disabled">Next</span>
        )}
      </div>
    </nav>
  );
}
