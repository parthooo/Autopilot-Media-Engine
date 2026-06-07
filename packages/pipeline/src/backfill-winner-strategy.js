const { prisma } = require("@ame/database");
const { normalizeWinnerSelection, isVideoStrategyComplete } = require("@ame/ai");

/**
 * Patch approved winners whose analysis is missing pillar video or Shorts cluster.
 * @param {object} [options]
 * @param {string} [options.opportunityId] - Limit to one opportunity
 * @param {boolean} [options.dryRun=false]
 */
async function backfillWinnerStrategy(options = {}) {
  const dryRun = options.dryRun === true;

  const opportunities = await prisma.opportunity.findMany({
    where: {
      status: "approved",
      ...(options.opportunityId ? { id: options.opportunityId } : {}),
    },
    include: {
      topic: { select: { title: true } },
      analysis: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!opportunities.length) {
    return { success: false, message: "No approved opportunities found", patched: [] };
  }

  const patched = [];
  const skipped = [];

  for (const opportunity of opportunities) {
    const strategy = opportunity.analysis?.contentStrategy || {};
    if (isVideoStrategyComplete(strategy)) {
      skipped.push({
        opportunityId: opportunity.id,
        title: opportunity.topic.title,
        reason: "already complete",
      });
      continue;
    }

    const normalized = normalizeWinnerSelection(
      {
        trendExplanation: opportunity.analysis?.trendExplanation,
        reasoning: opportunity.analysis?.aiReasoning,
        seoKeywords: opportunity.analysis?.seoKeywords?.primary,
        revenuePotential: opportunity.analysis?.revenueEstimate?.summary,
        contentStrategy: strategy,
        youtubeIdeas: opportunity.analysis?.youtubeIdeas || {},
      },
      opportunity.topic.title
    );

    if (!dryRun) {
      await prisma.opportunityAnalysis.upsert({
        where: { opportunityId: opportunity.id },
        create: {
          opportunityId: opportunity.id,
          trendExplanation: normalized.trendExplanation || "",
          audienceAnalysis: opportunity.analysis?.audienceAnalysis || {},
          seoKeywords: opportunity.analysis?.seoKeywords || { primary: [], longTail: [] },
          youtubeIdeas: normalized.youtubeIdeas,
          affiliatePotential: opportunity.analysis?.affiliatePotential || {},
          revenueEstimate: opportunity.analysis?.revenueEstimate || {},
          contentStrategy: normalized.contentStrategy,
          aiReasoning: opportunity.analysis?.aiReasoning || "",
          selectionMethod: opportunity.analysis?.selectionMethod || "backfill",
          modelVersion: opportunity.analysis?.modelVersion || "backfill",
          analyzedAt: new Date(),
        },
        update: {
          youtubeIdeas: normalized.youtubeIdeas,
          contentStrategy: normalized.contentStrategy,
          analyzedAt: new Date(),
        },
      });
    }

    patched.push({
      opportunityId: opportunity.id,
      title: opportunity.topic.title,
      pillarVideo: normalized.contentStrategy.pillarVideo.title,
      shortsCount: normalized.contentStrategy.shortsCluster.length,
      dryRun,
    });
  }

  return {
    success: patched.length > 0 || skipped.length > 0,
    dryRun,
    patched,
    skipped,
    message:
      patched.length > 0
        ? `${dryRun ? "Would patch" : "Patched"} ${patched.length} approved winner(s)`
        : "All approved winners already have complete video strategy",
  };
}

module.exports = { backfillWinnerStrategy };
