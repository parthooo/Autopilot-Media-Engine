const fs = require("fs");
const path = require("path");
const { prisma } = require("@ame/database");
const {
  generateArticle,
  generateYouTubeScript,
  generateShortsScript,
  DEFAULT_MODEL,
} = require("@ame/ai");

const MAX_ARTICLES = 5;
const MAX_SHORTS = 5;
const GENERATION_DELAY_MS = 3000;

/**
 * Generate YouTube scripts + SEO articles for the current approved opportunity.
 * YouTube content is generated first (P0 revenue path).
 * @param {object} [options]
 * @param {boolean} [options.autoApprove=true]
 * @param {boolean} [options.exportMarkdown=false]
 * @param {boolean} [options.includeYouTube=true]
 * @param {boolean} [options.includeArticles=true]
 * @returns {Promise<object>}
 */
async function generateContent(options = {}) {
  const autoApprove = options.autoApprove !== false;
  const exportMarkdown = options.exportMarkdown === true;
  const includeYouTube = options.includeYouTube !== false;
  const includeArticles = options.includeArticles !== false;

  const opportunity = await prisma.opportunity.findFirst({
    where: { status: "approved" },
    orderBy: { updatedAt: "desc" },
    include: {
      topic: true,
      analysis: true,
      contentAssets: true,
    },
  });

  if (!opportunity) {
    return { success: false, message: "No approved opportunity found" };
  }

  const strategy = opportunity.analysis?.contentStrategy || {};
  const channelAngle =
    strategy.channelAngle || strategy.siteAngle || opportunity.topic.title;
  const keywords =
    opportunity.analysis?.seoKeywords?.primary ||
    opportunity.topic.keywords ||
    [];

  const existingKeys = new Set(
    opportunity.contentAssets.map(
      (a) => `${a.assetType}:${a.title.toLowerCase()}`
    )
  );

  const youtube = { generated: [], skipped: [], errors: [] };
  const articles = { generated: [], skipped: [], errors: [] };

  if (includeYouTube) {
    await generateYouTubeAssets({
      opportunity,
      strategy,
      channelAngle,
      keywords,
      existingKeys,
      autoApprove,
      youtube,
    });
  }

  if (includeArticles) {
    await generateArticleAssets({
      opportunity,
      strategy,
      keywords,
      existingKeys,
      autoApprove,
      articles,
    });
  }

  let exportPath = null;
  const totalGenerated = youtube.generated.length + articles.generated.length;
  const totalSkipped = youtube.skipped.length + articles.skipped.length;

  if (exportMarkdown && totalGenerated > 0) {
    exportPath = await exportContentToDisk(opportunity.id);
  }

  return {
    success: totalGenerated > 0 || totalSkipped > 0,
    opportunityId: opportunity.id,
    niche: opportunity.topic.title,
    youtube: {
      generated: youtube.generated.length,
      items: youtube.generated,
      skipped: youtube.skipped.length,
      errors: youtube.errors,
    },
    articles: {
      generated: articles.generated.length,
      items: articles.generated,
      skipped: articles.skipped.length,
      errors: articles.errors,
    },
    exportPath,
  };
}

/**
 * @param {object} params
 */
async function generateYouTubeAssets(params) {
  const { opportunity, strategy, channelAngle, keywords, existingKeys, autoApprove, youtube } =
    params;

  const pillar =
    strategy.pillarVideo ||
    opportunity.analysis?.youtubeIdeas?.videos?.[0] ||
    {
      title: `${opportunity.topic.title}: Complete Beginner's Guide`,
      angle: "Everything you need to know",
    };

  const shorts =
    strategy.shortsCluster?.length > 0
      ? strategy.shortsCluster.slice(0, MAX_SHORTS)
      : opportunity.analysis?.youtubeIdeas?.shorts?.slice(0, MAX_SHORTS) ||
        defaultShorts(opportunity.topic.title);

  const pillarKey = `youtube_script:${pillar.title.toLowerCase()}`;
  if (existingKeys.has(pillarKey)) {
    youtube.skipped.push(pillar.title);
  } else {
    try {
      const result = await generateYouTubeScript({
        videoTitle: pillar.title,
        nicheTitle: opportunity.topic.title,
        channelAngle,
        angle: pillar.angle,
        keywords,
      });

      if (!result?.body) {
        youtube.errors.push({ title: pillar.title, error: "Empty Gemini response" });
      } else {
        const asset = await saveYouTubeAsset({
          opportunityId: opportunity.id,
          result,
          fallbackTitle: pillar.title,
          autoApprove,
        });
        youtube.generated.push({ id: asset.id, title: asset.title, type: "youtube_script" });
        existingKeys.add(pillarKey);
        await sleep(GENERATION_DELAY_MS);
      }
    } catch (error) {
      youtube.errors.push({ title: pillar.title, error: error.message });
    }
  }

  for (const short of shorts) {
    const title = typeof short === "string" ? short : short.title;
    const angle = typeof short === "string" ? short : short.angle;
    const shortKey = `shorts_script:${title.toLowerCase()}`;

    if (existingKeys.has(shortKey)) {
      youtube.skipped.push(title);
      continue;
    }

    try {
      const result = await generateShortsScript({
        shortTitle: title,
        nicheTitle: opportunity.topic.title,
        channelAngle,
        angle,
      });

      if (!result?.body) {
        youtube.errors.push({ title, error: "Empty Gemini response" });
        continue;
      }

      const asset = await saveShortsAsset({
        opportunityId: opportunity.id,
        result,
        fallbackTitle: title,
        autoApprove,
      });
      youtube.generated.push({ id: asset.id, title: asset.title, type: "shorts_script" });
      existingKeys.add(shortKey);
      await sleep(GENERATION_DELAY_MS);
    } catch (error) {
      youtube.errors.push({ title, error: error.message });
    }
  }
}

/**
 * @param {object} params
 */
async function generateArticleAssets(params) {
  const { opportunity, strategy, keywords, existingKeys, autoApprove, articles } = params;

  const articleTitles =
    strategy.articleCluster?.length > 0
      ? strategy.articleCluster.slice(0, MAX_ARTICLES)
      : defaultArticles(opportunity.topic.title);

  for (const articleTitle of articleTitles) {
    const articleKey = `article:${articleTitle.toLowerCase()}`;
    if (existingKeys.has(articleKey)) {
      articles.skipped.push(articleTitle);
      continue;
    }

    try {
      const result = await generateArticle({
        articleTitle,
        nicheTitle: opportunity.topic.title,
        siteAngle: strategy.siteAngle || opportunity.topic.title,
        keywords,
      });

      if (!result?.body) {
        articles.errors.push({ title: articleTitle, error: "Empty Gemini response" });
        continue;
      }

      const frontmatter = [
        "---",
        `title: "${(result.title || articleTitle).replace(/"/g, '\\"')}"`,
        `seoTitle: "${(result.seoTitle || articleTitle).replace(/"/g, '\\"')}"`,
        `seoDescription: "${(result.seoDescription || "").replace(/"/g, '\\"')}"`,
        `slug: "${result.slug || slugify(result.title || articleTitle)}"`,
        `tags: [${(result.tags || []).map((t) => `"${t}"`).join(", ")}]`,
        `opportunityId: "${opportunity.id}"`,
        `generatedAt: "${new Date().toISOString()}"`,
        "---",
        "",
      ].join("\n");

      const body = `${frontmatter}${result.body}`;

      const asset = await prisma.contentAsset.create({
        data: {
          opportunityId: opportunity.id,
          assetType: "article",
          title: result.title || articleTitle,
          body,
          metadata: {
            seoTitle: result.seoTitle,
            seoDescription: result.seoDescription,
            slug: result.slug,
            tags: result.tags,
            modelVersion: process.env.GEMINI_MODEL || DEFAULT_MODEL,
            wordCount: result.body.split(/\s+/).length,
          },
          status: autoApprove ? "approved" : "draft",
        },
      });

      articles.generated.push({ id: asset.id, title: asset.title, type: "article" });
      existingKeys.add(articleKey);
      await sleep(GENERATION_DELAY_MS);
    } catch (error) {
      articles.errors.push({ title: articleTitle, error: error.message });
    }
  }
}

/**
 * @param {object} params
 */
async function saveYouTubeAsset(params) {
  const { opportunityId, result, fallbackTitle, autoApprove } = params;
  const title = result.title || fallbackTitle;

  const frontmatter = [
    "---",
    `title: "${title.replace(/"/g, '\\"')}"`,
    `assetType: youtube_script`,
    `durationMinutes: ${result.durationMinutes || 10}`,
    `hook: "${(result.hook || "").replace(/"/g, '\\"')}"`,
    `thumbnailConcept: "${(result.thumbnailConcept || "").replace(/"/g, '\\"')}"`,
    `tags: [${(result.tags || []).map((t) => `"${t}"`).join(", ")}]`,
    `opportunityId: "${opportunityId}"`,
    `generatedAt: "${new Date().toISOString()}"`,
    "---",
    "",
  ].join("\n");

  return prisma.contentAsset.create({
    data: {
      opportunityId,
      assetType: "youtube_script",
      title,
      body: `${frontmatter}${result.body}`,
      metadata: {
        hook: result.hook,
        durationMinutes: result.durationMinutes || 10,
        thumbnailConcept: result.thumbnailConcept,
        tags: result.tags,
        modelVersion: process.env.GEMINI_MODEL || DEFAULT_MODEL,
        wordCount: result.body.split(/\s+/).length,
      },
      status: autoApprove ? "approved" : "draft",
    },
  });
}

/**
 * @param {object} params
 */
async function saveShortsAsset(params) {
  const { opportunityId, result, fallbackTitle, autoApprove } = params;
  const title = result.title || fallbackTitle;

  const frontmatter = [
    "---",
    `title: "${title.replace(/"/g, '\\"')}"`,
    `assetType: shorts_script`,
    `durationSeconds: ${result.durationSeconds || 45}`,
    `hook: "${(result.hook || "").replace(/"/g, '\\"')}"`,
    `tags: [${(result.tags || []).map((t) => `"${t}"`).join(", ")}]`,
    `opportunityId: "${opportunityId}"`,
    `generatedAt: "${new Date().toISOString()}"`,
    "---",
    "",
  ].join("\n");

  return prisma.contentAsset.create({
    data: {
      opportunityId,
      assetType: "shorts_script",
      title,
      body: `${frontmatter}${result.body}`,
      metadata: {
        hook: result.hook,
        durationSeconds: result.durationSeconds || 45,
        tags: result.tags,
        modelVersion: process.env.GEMINI_MODEL || DEFAULT_MODEL,
        wordCount: result.body.split(/\s+/).length,
      },
      status: autoApprove ? "approved" : "draft",
    },
  });
}

/**
 * @param {string} opportunityId
 * @returns {Promise<string>}
 */
async function exportContentToDisk(opportunityId) {
  const assets = await prisma.contentAsset.findMany({
    where: { opportunityId, status: "approved" },
    orderBy: { createdAt: "asc" },
  });

  const baseDir = path.resolve(process.cwd(), "content", opportunityId);

  for (const asset of assets) {
    const subdir =
      asset.assetType === "article"
        ? "articles"
        : asset.assetType === "shorts_script"
          ? "shorts"
          : "youtube";
    const dir = path.join(baseDir, subdir);
    fs.mkdirSync(dir, { recursive: true });

    const filename =
      asset.assetType === "article"
        ? `${asset.metadata?.slug || slugify(asset.title)}.md`
        : `${slugify(asset.title)}.md`;

    fs.writeFileSync(path.join(dir, filename), asset.body, "utf8");
  }

  return baseDir;
}

/** @deprecated use exportContentToDisk */
async function exportArticlesToDisk(opportunityId) {
  return exportContentToDisk(opportunityId);
}

/**
 * Export approved content assets for the current winner to disk (local dev).
 * @returns {Promise<object>}
 */
async function exportApprovedContent() {
  const opportunity = await prisma.opportunity.findFirst({
    where: { status: "approved" },
    orderBy: { updatedAt: "desc" },
    include: { topic: { select: { title: true } } },
  });

  if (!opportunity) {
    return { success: false, message: "No approved opportunity found" };
  }

  const count = await prisma.contentAsset.count({
    where: { opportunityId: opportunity.id, status: "approved" },
  });

  if (count === 0) {
    return { success: false, message: "No approved content to export — run generate first" };
  }

  const exportPath = await exportContentToDisk(opportunity.id);

  return {
    success: true,
    opportunityId: opportunity.id,
    niche: opportunity.topic.title,
    assetCount: count,
    exportPath,
  };
}

/**
 * @param {string} nicheTitle
 */
function defaultShorts(nicheTitle) {
  return [
    { title: `3 ${nicheTitle} mistakes to avoid`, angle: "quick warning hook" },
    { title: `Best ${nicheTitle} tip nobody tells you`, angle: "contrarian hook" },
    { title: `Is ${nicheTitle} worth it?`, angle: "yes/no debate" },
    { title: `${nicheTitle} in 60 seconds`, angle: "speed explainer" },
    { title: `Stop doing this with ${nicheTitle}`, angle: "pattern interrupt" },
  ];
}

/**
 * @param {string} nicheTitle
 */
function defaultArticles(nicheTitle) {
  return [
    `What is ${nicheTitle}? Complete guide`,
    `Best tools for ${nicheTitle}`,
    `How to get started with ${nicheTitle}`,
    `${nicheTitle}: tips for beginners`,
    `${nicheTitle} FAQ`,
  ];
}

/**
 * @param {string} text
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

/**
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { generateContent, exportContentToDisk, exportArticlesToDisk, exportApprovedContent };
