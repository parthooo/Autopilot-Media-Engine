/** @typedef {import('../types').RawSignalInput} RawSignalInput */

/**
 * @param {object} [config]
 * @returns {Promise<RawSignalInput[]>}
 */
async function fetchGoogleTrends(config = {}) {
  const geo = config.geo ?? "US";
  const url = `https://trends.google.com/trending/rss?geo=${geo}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/rss+xml, application/xml, text/xml" },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const xml = await response.text();
    const items = parseRssItems(xml);
    const signals = [];

    items.forEach((item, index) => {
      if (!item.title) return;

      signals.push({
        externalId: `${geo}-${slugify(item.title)}-${item.pubDate || "today"}`,
        title: item.title,
        url:
          item.newsUrl ||
          `https://trends.google.com/trends/explore?q=${encodeURIComponent(item.title)}&geo=${geo}`,
        description: item.newsTitle || null,
        rawPayload: item,
        discoveredAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        rankPosition: index + 1,
        volumeEstimate: parseTraffic(item.traffic || ""),
        engagementScore: Math.min(100, 20 + (items.length - index) * 3),
      });
    });

    if (signals.length === 0) {
      throw new Error("RSS feed returned no trending items");
    }

    return signals;
  } catch (error) {
    throw new Error(`Google Trends fetch failed: ${error.message}`);
  }
}

/**
 * @param {string} xml
 * @returns {Array<{ title: string, traffic: string, pubDate: string, newsUrl: string, newsTitle: string }>}
 */
function parseRssItems(xml) {
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

  return blocks.map((block) => ({
    title: decodeXml(extractTag(block, "title")),
    traffic: extractTag(block, "ht:approx_traffic"),
    pubDate: extractTag(block, "pubDate"),
    newsUrl: extractTag(block, "ht:news_item_url"),
    newsTitle: extractTag(block, "ht:news_item_title"),
  }));
}

/**
 * @param {string} block
 * @param {string} tag
 * @returns {string}
 */
function extractTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
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
 * Parse "200K+ searches" → 200000
 * @param {string} traffic
 * @returns {number}
 */
function parseTraffic(traffic) {
  const match = traffic.match(/([\d.]+)\s*([KMB])?/i);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = (match[2] || "").toUpperCase();
  const multipliers = { K: 1000, M: 1000000, B: 1000000000 };
  return Math.round(value * (multipliers[unit] || 1));
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
const googleTrendsAdapter = {
  sourceSlug: "google-trends",
  fetch: fetchGoogleTrends,
};

module.exports = { googleTrendsAdapter, fetchGoogleTrends };
