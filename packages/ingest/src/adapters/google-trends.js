const googleTrends = require("google-trends-api");

/** @typedef {import('../types').RawSignalInput} RawSignalInput */

/**
 * @param {object} [config]
 * @returns {Promise<RawSignalInput[]>}
 */
async function fetchGoogleTrends(config = {}) {
  const geo = config.geo ?? "US";

  try {
    const raw = await googleTrends.dailyTrends({ geo });
    const parsed = JSON.parse(raw);
    const days = parsed?.default?.trendingSearchesDays ?? [];

    const signals = [];

    for (const day of days.slice(0, 1)) {
      const searches = day?.trendingSearches ?? [];
      searches.forEach((item, index) => {
        const title = item?.title?.query;
        if (!title) return;

        const traffic = item?.formattedTraffic || "";
        const volumeEstimate = parseTraffic(traffic);
        const articles = item?.articles ?? [];
        const topArticle = articles[0];

        signals.push({
          externalId: `${geo}-${slugify(title)}-${day.date || "today"}`,
          title,
          url: topArticle?.url || `https://trends.google.com/trends/explore?q=${encodeURIComponent(title)}&geo=${geo}`,
          description: topArticle?.title || null,
          rawPayload: item,
          discoveredAt: new Date(),
          rankPosition: index + 1,
          volumeEstimate,
          engagementScore: Math.min(100, 20 + (searches.length - index) * 3),
        });
      });
    }

    return signals;
  } catch (error) {
    throw new Error(`Google Trends fetch failed: ${error.message}`);
  }
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
