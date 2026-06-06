/** @typedef {import('../types').RawSignalInput} RawSignalInput */

/**
 * Dev.to public API — no auth required.
 * @param {object} [config]
 * @returns {Promise<RawSignalInput[]>}
 */
async function fetchDevTo(config = {}) {
  const perPage = config.perPage ?? 30;
  const topDays = config.topDays ?? 7;
  const tags = config.tags ?? [];

  const signals = [];
  const seen = new Set();

  const endpoints = tags.length
    ? tags.map((tag) => `https://dev.to/api/articles?tag=${encodeURIComponent(tag)}&per_page=${perPage}&top=${topDays}`)
    : [`https://dev.to/api/articles?per_page=${perPage}&top=${topDays}`];

  for (const url of endpoints) {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Dev.to API error: ${response.status}`);
    }

    const articles = await response.json();

    articles.forEach((article, index) => {
      if (!article?.title || seen.has(String(article.id))) return;
      seen.add(String(article.id));

      signals.push({
        externalId: String(article.id),
        title: article.title,
        url: article.url || `https://dev.to${article.path}`,
        description: article.description?.slice(0, 500) || null,
        rawPayload: {
          tag_list: article.tag_list,
          positive_reactions_count: article.positive_reactions_count,
          comments_count: article.comments_count,
          reading_time_minutes: article.reading_time_minutes,
        },
        discoveredAt: article.published_at ? new Date(article.published_at) : new Date(),
        rankPosition: index + 1,
        volumeEstimate: article.positive_reactions_count ?? 0,
        engagementScore: normalizeEngagement(
          article.comments_count ?? 0,
          article.positive_reactions_count ?? 0
        ),
      });
    });

    await sleep(500);
  }

  return signals;
}

/**
 * @param {number} comments
 * @param {number} reactions
 * @returns {number}
 */
function normalizeEngagement(comments, reactions) {
  const raw = comments * 3 + reactions;
  return Math.min(100, Math.round(Math.log10(raw + 1) * 22));
}

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** @type {import('../types').IngestAdapter} */
const devToAdapter = {
  sourceSlug: "dev-to",
  fetch: fetchDevTo,
};

module.exports = { devToAdapter, fetchDevTo };
