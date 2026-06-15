const { youtubeAdapter } = require("./adapters/youtube");
const { hackerNewsAdapter } = require("./adapters/hacker-news");
const { devToAdapter } = require("./adapters/dev-to");
const { googleTrendsAdapter } = require("./adapters/google-trends");
const { githubTrendingAdapter } = require("./adapters/github-trending");
const { productHuntAdapter } = require("./adapters/product-hunt");
const { redditAdapter } = require("./adapters/reddit");

/** @type {Map<string, import('./types').IngestAdapter>} */
const adapters = new Map([
  [youtubeAdapter.sourceSlug, youtubeAdapter],
  [hackerNewsAdapter.sourceSlug, hackerNewsAdapter],
  [devToAdapter.sourceSlug, devToAdapter],
  [googleTrendsAdapter.sourceSlug, googleTrendsAdapter],
  [githubTrendingAdapter.sourceSlug, githubTrendingAdapter],
  [productHuntAdapter.sourceSlug, productHuntAdapter],
  [redditAdapter.sourceSlug, redditAdapter],
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
