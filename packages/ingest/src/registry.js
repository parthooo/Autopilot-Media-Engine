const { hackerNewsAdapter } = require("./adapters/hacker-news");
const { redditAdapter } = require("./adapters/reddit");
const { googleTrendsAdapter } = require("./adapters/google-trends");

/** @type {Map<string, import('./types').IngestAdapter>} */
const adapters = new Map([
  [hackerNewsAdapter.sourceSlug, hackerNewsAdapter],
  [redditAdapter.sourceSlug, redditAdapter],
  [googleTrendsAdapter.sourceSlug, googleTrendsAdapter],
]);

/**
 * @param {string} slug
 * @returns {import('./types').IngestAdapter | undefined}
 */
function getAdapter(slug) {
  return adapters.get(slug);
}

/**
 * @returns {import('./types').IngestAdapter[]}
 */
function getAllAdapters() {
  return Array.from(adapters.values());
}

module.exports = { getAdapter, getAllAdapters };
