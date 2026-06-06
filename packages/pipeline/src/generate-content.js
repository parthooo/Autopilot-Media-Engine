const fs = require("fs");
const path = require("path");
const { prisma } = require("@ame/database");
const { generateArticle, DEFAULT_MODEL } = require("@ame/ai");

const MAX_ARTICLES = 5;
const ARTICLE_DELAY_MS = 3000;

/**
 * Generate SEO articles for the current approved opportunity.
 * @param {object} [options]
 * @param {boolean} [options.autoApprove=true]
 * @param {boolean} [options.exportMarkdown=false]
 * @returns {Promise<object>}
 */
async function generateContent(options = {}) {
  const autoApprove = options.autoApprove !== false;
  const exportMarkdown = options.exportMarkdown === true;

  const opportunity = await prisma.opportunity.findFirst({
    where: { status: "approved" },
    orderBy: { updatedAt: "desc" },
    include: {
      topic: true,
      analysis: true,
      contentAssets: { where: { assetType: "article" } },
    },
  });

  if (!opportunity) {
    return { success: false, message: "No approved opportunity found" };
  }

  const strategy = opportunity.analysis?.contentStrategy || {};
  const articleTitles =
    strategy.articleCluster?.length > 0
      ? strategy.articleCluster.slice(0, MAX_ARTICLES)
      : [
          `What is ${opportunity.topic.title}? Complete guide`,
          `Best tools for ${opportunity.topic.title}`,
          `How to get started with ${opportunity.topic.title}`,
          `${opportunity.topic.title}: tips for beginners`,
          `${opportunity.topic.title} FAQ`,
        ].slice(0, MAX_ARTICLES);

  const keywords =
    opportunity.analysis?.seoKeywords?.primary ||
    opportunity.topic.keywords ||
    [];

  const existingTitles = new Set(
    opportunity.contentAssets.map((a) => a.title.toLowerCase())
  );

  const generated = [];
  const skipped = [];
  const errors = [];

  for (const articleTitle of articleTitles) {
    if (existingTitles.has(articleTitle.toLowerCase())) {
      skipped.push(articleTitle);
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
        errors.push({ title: articleTitle, error: "Empty Gemini response" });
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

      generated.push({ id: asset.id, title: asset.title });
      await sleep(ARTICLE_DELAY_MS);
    } catch (error) {
      errors.push({ title: articleTitle, error: error.message });
    }
  }

  let exportPath = null;
  if (exportMarkdown && generated.length) {
    exportPath = await exportArticlesToDisk(opportunity.id);
  }

  return {
    success: generated.length > 0 || skipped.length > 0,
    opportunityId: opportunity.id,
    niche: opportunity.topic.title,
    generated: generated.length,
    articles: generated,
    skipped: skipped.length,
    errors,
    exportPath,
  };
}

/**
 * @param {string} opportunityId
 * @returns {Promise<string>}
 */
async function exportArticlesToDisk(opportunityId) {
  const assets = await prisma.contentAsset.findMany({
    where: { opportunityId, assetType: "article", status: "approved" },
    orderBy: { createdAt: "asc" },
  });

  const dir = path.resolve(process.cwd(), "content", opportunityId);
  fs.mkdirSync(dir, { recursive: true });

  for (const asset of assets) {
    const slug = asset.metadata?.slug || slugify(asset.title);
    fs.writeFileSync(path.join(dir, `${slug}.md`), asset.body, "utf8");
  }

  return dir;
}

/**
 * @param {string} text
 * @returns {string}
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

module.exports = { generateContent, exportArticlesToDisk };
