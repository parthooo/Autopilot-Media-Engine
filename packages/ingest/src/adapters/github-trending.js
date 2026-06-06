/** @typedef {import('../types').RawSignalInput} RawSignalInput */

/**
 * Scrape GitHub trending page (no official API).
 * @param {object} [config]
 * @returns {Promise<RawSignalInput[]>}
 */
async function fetchGitHubTrending(config = {}) {
  const since = config.since ?? "daily";
  const language = config.language ? `&spoken_language_code=${config.language}` : "";
  const url = `https://github.com/trending?since=${since}${language}`;

  const response = await fetch(url, {
    headers: {
      Accept: "text/html",
      "User-Agent": "autopilot-media-engine/1.0 (trend discovery)",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub Trending fetch failed: HTTP ${response.status}`);
  }

  const html = await response.text();
  const articles = html.split('<article class="Box-row">').slice(1);

  if (articles.length === 0) {
    throw new Error("GitHub Trending page returned no repositories");
  }

  const signals = [];

  articles.forEach((block, index) => {
    const link = block.match(
      /<h2[^>]*>[\s\S]*?<a[^>]+href="(\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/
    );
    if (!link) return;

    const repoPath = link[1].replace(/\/$/, "");
    const name = link[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    const descMatch = block.match(/<p class="col-9[^"]*"[^>]*>([\s\S]*?)<\/p>/);
    const starsToday = block.match(/([\d,]+)\s+stars\s+today/i);
    const description = descMatch
      ? decodeHtml(descMatch[1].replace(/<[^>]+>/g, "").trim())
      : null;

    const stars = starsToday ? parseInt(starsToday[1].replace(/,/g, ""), 10) : 0;

    signals.push({
      externalId: `${since}-${repoPath}`,
      title: name || repoPath.replace(/^\//, ""),
      url: `https://github.com${repoPath}`,
      description,
      rawPayload: { repoPath, since, starsToday: stars },
      discoveredAt: new Date(),
      rankPosition: index + 1,
      volumeEstimate: stars,
      engagementScore: Math.min(100, Math.round(Math.log10(stars + 1) * 30)),
    });
  });

  return signals;
}

/**
 * @param {string} text
 * @returns {string}
 */
function decodeHtml(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** @type {import('../types').IngestAdapter} */
const githubTrendingAdapter = {
  sourceSlug: "github-trending",
  fetch: fetchGitHubTrending,
};

module.exports = { githubTrendingAdapter, fetchGitHubTrending };
