/** @typedef {import('../types').RawSignalInput} RawSignalInput */

const DEFAULT_SUBREDDITS = ["technology", "programming", "entrepreneur", "SideProject"];

/** @type {{ token: string | null, expiresAt: number }} */
const tokenCache = { token: null, expiresAt: 0 };

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

  const accessToken = await getAccessToken(userAgent);
  const signals = [];

  for (const subreddit of subreddits) {
    const url = `https://oauth.reddit.com/r/${subreddit}/hot?limit=${limit}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": userAgent,
      },
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

    await sleep(1100);
  }

  return signals;
}

/**
 * Reddit blocked unauthenticated .json access in May 2026 — OAuth is required.
 * @param {string} userAgent
 * @returns {Promise<string>}
 */
async function getAccessToken(userAgent) {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Reddit requires OAuth (anonymous API blocked since May 2026). " +
        "Create a script app at reddit.com/prefs/apps, then set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET in .env"
    );
  }

  if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": userAgent,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Reddit OAuth failed (${response.status}): ${body.slice(0, 200)}`);
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error("Reddit OAuth returned no access_token");
  }

  tokenCache.token = data.access_token;
  tokenCache.expiresAt = Date.now() + (data.expires_in || 3600) * 1000 - 60_000;

  return tokenCache.token;
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
