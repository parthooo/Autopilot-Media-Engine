/** @typedef {import('../types').RawSignalInput} RawSignalInput */

const HN_TOP_STORIES_URL =
  "https://hacker-news.firebaseio.com/v0/topstories.json";
const HN_ITEM_URL = "https://hacker-news.firebaseio.com/v0/item";

/**
 * @param {object} [config]
 * @returns {Promise<RawSignalInput[]>}
 */
async function fetchHackerNews(config = {}) {
  const limit = config.limit ?? 50;

  const topResponse = await fetch(HN_TOP_STORIES_URL);
  if (!topResponse.ok) {
    throw new Error(`Hacker News API error: ${topResponse.status}`);
  }

  const storyIds = await topResponse.json();
  const selectedIds = storyIds.slice(0, limit);

  const items = await Promise.all(
    selectedIds.map(async (id, index) => {
      const response = await fetch(`${HN_ITEM_URL}/${id}.json`);
      if (!response.ok) return null;
      const item = await response.json();
      if (!item || item.type !== "story" || !item.title) return null;

      return {
        externalId: String(item.id),
        title: item.title,
        url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
        description: item.text || null,
        rawPayload: item,
        discoveredAt: new Date((item.time || Date.now() / 1000) * 1000),
        rankPosition: index + 1,
        volumeEstimate: item.score ?? 0,
        engagementScore: normalizeEngagement(item.descendants ?? 0, item.score ?? 0),
      };
    })
  );

  return items.filter(Boolean);
}

/**
 * @param {number} comments
 * @param {number} score
 * @returns {number}
 */
function normalizeEngagement(comments, score) {
  const raw = comments * 2 + score;
  return Math.min(100, Math.round(Math.log10(raw + 1) * 25));
}

/** @type {import('../types').IngestAdapter} */
const hackerNewsAdapter = {
  sourceSlug: "hacker-news",
  fetch: fetchHackerNews,
};

module.exports = { hackerNewsAdapter, fetchHackerNews };
