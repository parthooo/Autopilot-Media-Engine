export const PAGE_SIZE = 15;

export function parsePage(value) {
  const n = Number.parseInt(String(value ?? "1"), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function pageSkip(page) {
  return (page - 1) * PAGE_SIZE;
}

export function totalPages(totalCount) {
  return Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
}

export function clampPage(page, pages) {
  return Math.min(Math.max(1, page), pages);
}

/** Page numbers and "ellipsis" markers for the pager UI. */
export function getPaginationItems(current, pages, siblingCount = 1) {
  if (pages <= 1) return [1];

  const items = new Set([1, pages, current]);

  for (let i = current - siblingCount; i <= current + siblingCount; i++) {
    if (i >= 1 && i <= pages) items.add(i);
  }

  if (current <= 3) {
    for (let i = 2; i <= Math.min(4, pages); i++) items.add(i);
  }

  if (current >= pages - 2) {
    for (let i = Math.max(pages - 3, 1); i <= pages - 1; i++) items.add(i);
  }

  const sorted = [...items].sort((a, b) => a - b);
  const result = [];

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      result.push("ellipsis");
    }
    result.push(sorted[i]);
  }

  return result;
}

export function pageHref(basePath, page) {
  if (page <= 1) return basePath;
  const sep = basePath.includes("?") ? "&" : "?";
  return `${basePath}${sep}page=${page}`;
}
