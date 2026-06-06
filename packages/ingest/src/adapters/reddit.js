/** @typedef {import('../types').RawSignalInput} RawSignalInput */

const DEFAULT_SUBREDDITS = ["technology", "programming", "entrepreneur", "SideProject"];

/**
 * @param {object} [config]
 * @returns {Promise<RawSignalInput[]>}
 */
async function fetchReddit(config = {}) {
  const subreddits = config.subreddits ?? DEFAULT_SUBREDDITS;
  const limit = config.limit ?? 25;
  const userAgent =
    process.env.REDDIT_USER_AGENT ||
    "autopilot-media-engine:1.0.0 (trend discovery bot)";

  const signals = [];

  for (const subreddit of subreddits) {
    const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;
    const response = await fetch(url, {
      headers: { "User-Agent": userAgent },
    });

    if (!response.ok) {
      throw new Error(`Reddit API error for r/${subreddit}: ${response.status}`);
    }

    const data = await response.json();
    const posts = data?.data?.children ?? [];

    posts.forEach((child, index) => {
      const post = child?.data;
      if (!post || post.stickied || !post.title) return;

      signals.push({
        externalId: post.id,
        title: post.title,
        url: post.url || `https://reddit.com${post.permalink}`,
        description: post.selftext?.slice(0, 500) || null,
        rawPayload: {
          subreddit: post.subreddit,
          ups: post.ups,
          num_comments: post.num_comments,
          permalink: post.permalink,
        },
        discoveredAt: new Date((post.created_utc || Date.now() / 1000) * 1000),
        rankPosition: index + 1,
        volumeEstimate: post.ups ?? 0,
        engagementScore: normalizeEngagement(post.num_comments ?? 0, post.ups ?? 0),
      });
    });

    // Respect Reddit rate limits between subreddit fetches
    await sleep(1100);
  }

  return signals;
}

/**
 * @param {number} comments
 * @param {number} ups
 * @returns {number}
 */
function normalizeEngagement(comments, ups) {
  const raw = comments * 3 + ups;
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
const redditAdapter = {
  sourceSlug: "reddit",
  fetch: fetchReddit,
};

module.exports = { redditAdapter, fetchReddit };
