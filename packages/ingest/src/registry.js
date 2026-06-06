const { hackerNewsAdapter } = require("./adapters/hacker-news");
const { redditAdapter } = require("./adapters/reddit");
const { googleTrendsAdapter } = require("./adapters/google-trends");
const { devToAdapter } = require("./adapters/dev-to");
const { githubTrendingAdapter } = require("./adapters/github-trending");
const { productHuntAdapter } = require("./adapters/product-hunt");
const { youtubeAdapter } = require("./adapters/youtube");

/** @type {Map<string, import('./types').IngestAdapter>} */
const adapters = new Map([
  [hackerNewsAdapter.sourceSlug, hackerNewsAdapter],
  [redditAdapter.sourceSlug, redditAdapter],
  [googleTrendsAdapter.sourceSlug, googleTrendsAdapter],
  [devToAdapter.sourceSlug, devToAdapter],
  [githubTrendingAdapter.sourceSlug, githubTrendingAdapter],
  [productHuntAdapter.sourceSlug, productHuntAdapter],
  [youtubeAdapter.sourceSlug, youtubeAdapter],
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
