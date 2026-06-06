/** @typedef {import('../types').RawSignalInput} RawSignalInput */

/**
 * Product Hunt public Atom feed — no auth required.
 * @param {object} [config]
 * @returns {Promise<RawSignalInput[]>}
 */
async function fetchProductHunt(config = {}) {
  const feedUrl = config.feedUrl ?? "https://www.producthunt.com/feed";

  const response = await fetch(feedUrl, {
    headers: { Accept: "application/atom+xml, application/xml, text/xml" },
  });

  if (!response.ok) {
    throw new Error(`Product Hunt feed failed: HTTP ${response.status}`);
  }

  const xml = await response.text();
  const entries = parseAtomEntries(xml);

  if (entries.length === 0) {
    throw new Error("Product Hunt feed returned no entries");
  }

  return entries.map((entry, index) => ({
    externalId: entry.id || slugify(entry.title),
    title: entry.title,
    url: entry.url || "https://www.producthunt.com",
    description: entry.description || null,
    rawPayload: entry,
    discoveredAt: entry.published ? new Date(entry.published) : new Date(),
    rankPosition: index + 1,
    volumeEstimate: null,
    engagementScore: Math.min(100, 40 + (entries.length - index) * 2),
  }));
}

/**
 * @param {string} xml
 * @returns {Array<{ id: string, title: string, url: string, description: string, published: string }>}
 */
function parseAtomEntries(xml) {
  const blocks = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];

  return blocks.map((block) => {
    const id = extractTag(block, "id");
    const title = decodeXml(extractTag(block, "title"));
    const published = extractTag(block, "published") || extractTag(block, "updated");
    const url =
      block.match(/<link[^>]+rel="alternate"[^>]+href="([^"]+)"/)?.[1] ||
      block.match(/<link[^>]+href="([^"]+)"[^>]+rel="alternate"/)?.[1] ||
      "";
    const content = extractTag(block, "content");
    const description = decodeXml(
      content
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .match(/<p>\s*([\s\S]*?)\s*<\/p>/)?.[1]
        ?.replace(/<[^>]+>/g, "")
        .trim() || ""
    );

    return { id, title, url, description, published };
  });
}

/**
 * @param {string} block
 * @param {string} tag
 * @returns {string}
 */
function extractTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return match ? match[1].trim() : "";
}

/**
 * @param {string} text
 * @returns {string}
 */
function decodeXml(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * @param {string} text
 * @returns {string}
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** @type {import('../types').IngestAdapter} */
const productHuntAdapter = {
  sourceSlug: "product-hunt",
  fetch: fetchProductHunt,
};

module.exports = { productHuntAdapter, fetchProductHunt };
