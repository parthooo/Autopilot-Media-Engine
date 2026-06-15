/** Canonical ingest / display order — YouTube first, Reddit last */
const SOURCE_SLUG_ORDER = [
  "youtube",
  "hacker-news",
  "dev-to",
  "google-trends",
  "github-trending",
  "product-hunt",
  "reddit",
];

/**
 * @param {Array<{ slug: string }>} items
 * @returns {Array<{ slug: string }>}
 */
function sortBySourceSlugOrder(items) {
  const rank = new Map(SOURCE_SLUG_ORDER.map((slug, index) => [slug, index]));
  return [...items].sort((a, b) => {
    const aRank = rank.get(a.slug) ?? SOURCE_SLUG_ORDER.length;
    const bRank = rank.get(b.slug) ?? SOURCE_SLUG_ORDER.length;
    return aRank - bRank;
  });
}

module.exports = { SOURCE_SLUG_ORDER, sortBySourceSlugOrder };
