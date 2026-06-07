const MAX_SHORTS = 5;

/**
 * @param {string} topicTitle
 */
function defaultPillarVideo(topicTitle) {
  return {
    title: `${topicTitle}: Complete Beginner's Guide (2026)`,
    angle: "Everything you need to know in under 12 minutes",
  };
}

/**
 * @param {string} topicTitle
 * @returns {Array<{ title: string, angle: string }>}
 */
function defaultShortsCluster(topicTitle) {
  return [
    { title: `3 ${topicTitle} mistakes to avoid`, angle: "quick warning hook" },
    { title: `Best ${topicTitle} tip nobody tells you`, angle: "contrarian hook" },
    { title: `Is ${topicTitle} worth it?`, angle: "yes/no debate" },
    { title: `${topicTitle} in 60 seconds`, angle: "speed explainer" },
    { title: `Stop doing this with ${topicTitle}`, angle: "pattern interrupt" },
  ];
}

/**
 * @param {object} strategy
 * @param {string} topicTitle
 */
function inferPillarVideo(strategy, topicTitle) {
  if (strategy?.pillarVideo?.title) {
    return {
      title: strategy.pillarVideo.title,
      angle: strategy.pillarVideo.angle || strategy.siteAngle || "",
    };
  }

  const firstArticle = strategy?.articleCluster?.[0];
  if (typeof firstArticle === "string" && firstArticle.trim()) {
    return {
      title: firstArticle,
      angle: strategy.siteAngle || `Deep dive on ${topicTitle}`,
    };
  }

  return defaultPillarVideo(topicTitle);
}

/**
 * @param {object} strategy
 * @param {string} topicTitle
 * @returns {Array<{ title: string, angle: string }>}
 */
function inferShortsCluster(strategy, topicTitle) {
  const existing = normalizeShortsEntries(strategy?.shortsCluster);
  if (existing.length >= MAX_SHORTS) {
    return existing.slice(0, MAX_SHORTS);
  }

  const fromArticles = (strategy?.articleCluster || [])
    .slice(1, MAX_SHORTS + 1)
    .filter((title) => typeof title === "string" && title.trim())
    .map((title) => ({
      title,
      angle: "quick explainer hook",
    }));

  const merged = [...existing];
  for (const short of fromArticles) {
    if (merged.length >= MAX_SHORTS) break;
    if (!merged.some((s) => s.title.toLowerCase() === short.title.toLowerCase())) {
      merged.push(short);
    }
  }

  for (const short of defaultShortsCluster(topicTitle)) {
    if (merged.length >= MAX_SHORTS) break;
    if (!merged.some((s) => s.title.toLowerCase() === short.title.toLowerCase())) {
      merged.push(short);
    }
  }

  return merged.slice(0, MAX_SHORTS);
}

/**
 * @param {unknown} entries
 * @returns {Array<{ title: string, angle: string }>}
 */
function normalizeShortsEntries(entries) {
  if (!Array.isArray(entries)) return [];

  return entries
    .map((entry) => {
      if (typeof entry === "string") {
        return { title: entry.trim(), angle: "quick hook" };
      }
      if (entry && typeof entry.title === "string" && entry.title.trim()) {
        return {
          title: entry.title.trim(),
          angle: typeof entry.angle === "string" ? entry.angle : "quick hook",
        };
      }
      return null;
    })
    .filter(Boolean);
}

/**
 * @param {object} [strategy]
 */
function isVideoStrategyComplete(strategy) {
  return !!(
    strategy?.pillarVideo?.title &&
    Array.isArray(strategy?.shortsCluster) &&
    strategy.shortsCluster.length >= MAX_SHORTS &&
    strategy.shortsCluster.every((s) => (typeof s === "string" ? s.trim() : s?.title))
  );
}

/**
 * Ensure winner analysis always has pillar video + 5 Shorts (Phase 4a gate).
 * @param {object} selection - Raw Gemini or rule-based winner payload
 * @param {string} topicTitle
 * @returns {object} selection with normalized contentStrategy + youtubeIdeas
 */
function normalizeWinnerSelection(selection, topicTitle) {
  if (!selection) return selection;

  const rawStrategy = selection.contentStrategy || {};
  const contentStrategy = {
    ...rawStrategy,
    channelAngle:
      rawStrategy.channelAngle ||
      (rawStrategy.siteAngle
        ? `YouTube channel for ${rawStrategy.siteAngle}`
        : `Explain ${topicTitle} for beginners on YouTube`),
    pillarVideo: inferPillarVideo(rawStrategy, topicTitle),
    shortsCluster: inferShortsCluster(rawStrategy, topicTitle),
  };

  if (!Array.isArray(contentStrategy.articleCluster) || !contentStrategy.articleCluster.length) {
    contentStrategy.articleCluster = defaultArticleCluster(topicTitle);
  }

  const youtubeIdeas = {
    videos:
      selection.youtubeIdeas?.videos?.length > 0
        ? selection.youtubeIdeas.videos
        : [
            {
              ...contentStrategy.pillarVideo,
              format: "long-form",
            },
          ],
    shorts:
      selection.youtubeIdeas?.shorts?.length > 0
        ? normalizeShortsEntries(selection.youtubeIdeas.shorts)
        : contentStrategy.shortsCluster,
  };

  return {
    ...selection,
    contentStrategy,
    youtubeIdeas,
    videoStrategyNormalized: !isVideoStrategyComplete(rawStrategy),
  };
}

/**
 * @param {string} topicTitle
 */
function defaultArticleCluster(topicTitle) {
  return [
    `What is ${topicTitle}? A complete guide`,
    `Best tools and resources for ${topicTitle}`,
    `How to get started with ${topicTitle}`,
    `${topicTitle}: common mistakes to avoid`,
    `${topicTitle} FAQ`,
  ];
}

module.exports = {
  MAX_SHORTS,
  isVideoStrategyComplete,
  normalizeWinnerSelection,
  defaultPillarVideo,
  defaultShortsCluster,
};
