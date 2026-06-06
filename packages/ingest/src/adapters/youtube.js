/** @typedef {import('../types').RawSignalInput} RawSignalInput */

/**
 * YouTube trending via Data API v3 (1 quota unit per call).
 * @param {object} [config]
 * @returns {Promise<RawSignalInput[]>}
 */
async function fetchYouTube(config = {}) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "YouTube requires YOUTUBE_API_KEY. Enable YouTube Data API v3 in Google Cloud Console, then add the key to GitHub Actions secrets (for scheduled runs) and Vercel env vars (for dashboard triggers)."
    );
  }

  const region = config.region ?? "US";
  const maxResults = config.maxResults ?? 25;
  const categoryId = config.categoryId;

  const params = new URLSearchParams({
    part: "snippet,statistics",
    chart: "mostPopular",
    regionCode: region,
    maxResults: String(maxResults),
    key: apiKey,
  });

  if (categoryId) params.set("videoCategoryId", String(categoryId));

  const url = `https://www.googleapis.com/youtube/v3/videos?${params}`;
  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`YouTube API error (${response.status}): ${body.slice(0, 200)}`);
  }

  const data = await response.json();
  const items = data?.items ?? [];

  if (items.length === 0) {
    throw new Error("YouTube API returned no trending videos");
  }

  return items.map((video, index) => {
    const snippet = video.snippet || {};
    const stats = video.statistics || {};
    const views = parseInt(stats.viewCount || "0", 10);

    return {
      externalId: video.id,
      title: snippet.title || "Untitled video",
      url: `https://www.youtube.com/watch?v=${video.id}`,
      description: snippet.description?.slice(0, 500) || null,
      rawPayload: {
        channelTitle: snippet.channelTitle,
        publishedAt: snippet.publishedAt,
        tags: snippet.tags,
        viewCount: views,
        likeCount: parseInt(stats.likeCount || "0", 10),
      },
      discoveredAt: snippet.publishedAt ? new Date(snippet.publishedAt) : new Date(),
      rankPosition: index + 1,
      volumeEstimate: views,
      engagementScore: Math.min(100, Math.round(Math.log10(views + 1) * 12)),
    };
  });
}

/** @type {import('../types').IngestAdapter} */
const youtubeAdapter = {
  sourceSlug: "youtube",
  fetch: fetchYouTube,
};

module.exports = { youtubeAdapter, fetchYouTube };
