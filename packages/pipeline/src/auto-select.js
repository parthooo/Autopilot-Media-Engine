const { prisma } = require("@ame/database");
const {
  selectWinnerWithAI,
  selectWinnerWithRules,
  DEFAULT_MODEL,
} = require("@ame/ai");
const { ingestAll } = require("./ingest");
const { scoreOpportunities } = require("./score");

const CANDIDATE_LIMIT = 15;
const MIN_SCORE = 40;

/**
 * AI picks ONE winner, auto-approves it, archives previous winners, rejects other candidates.
 * @returns {Promise<object>}
 */
async function autoSelectWinner() {
  const candidates = await prisma.opportunity.findMany({
    where: {
      opportunityScore: { gte: MIN_SCORE },
      status: { in: ["new", "reviewing", "approved"] },
    },
    orderBy: { opportunityScore: "desc" },
    take: CANDIDATE_LIMIT,
    include: { topic: { select: { title: true, category: true } } },
  });

  if (!candidates.length) {
    return { success: false, message: "No candidates above minimum score" };
  }

  const payload = candidates.map((o) => ({
    id: o.id,
    title: o.topic.title,
    category: o.topic.category,
    opportunityScore: o.opportunityScore,
    growthScore: o.growthScore,
    competitionScore: o.competitionScore,
    monetizationScore: o.monetizationScore,
    usaAudienceScore: o.usaAudienceScore,
    evergreenScore: o.evergreenScore,
  }));

  let selection = null;
  let usedAI = false;
  let geminiError = null;

  try {
    selection = await selectWinnerWithAI(payload);
    usedAI = !!selection;
  } catch (error) {
    geminiError = error.message;
    console.warn(`Gemini auto-select failed: ${error.message}`);
  }

  if (!selection) {
    selection = selectWinnerWithRules(payload);
    if (process.env.GEMINI_API_KEY && geminiError) {
      selection.reasoning = `Gemini temporarily unavailable (${geminiError.slice(0, 80)}…). Rule-based fallback used.`;
    }
  }

  const winnerId = selection.winnerId;
  const winner = candidates.find((c) => c.id === winnerId);

  if (!winner) {
    return { success: false, message: "AI returned invalid winner ID" };
  }

  const candidateIds = candidates.map((c) => c.id);
  const now = new Date();

  await prisma.$transaction([
    prisma.opportunity.updateMany({
      where: { status: "approved", id: { not: winnerId } },
      data: { status: "archived" },
    }),
    prisma.opportunity.updateMany({
      where: {
        id: { in: candidateIds, not: winnerId },
        status: { in: ["new", "reviewing"] },
      },
      data: { status: "rejected" },
    }),
    prisma.opportunity.update({
      where: { id: winnerId },
      data: { status: "approved" },
    }),
    prisma.opportunityAnalysis.upsert({
      where: { opportunityId: winnerId },
      create: {
        opportunityId: winnerId,
        trendExplanation: selection.trendExplanation || selection.reasoning,
        audienceAnalysis: {
          target: "USA English-speaking searchers",
          intent: "informational + commercial",
          confidence: selection.confidence,
        },
        seoKeywords: { primary: selection.seoKeywords || [], longTail: [] },
        youtubeIdeas: selection.youtubeIdeas || {
          videos: selection.contentStrategy?.pillarVideo
            ? [selection.contentStrategy.pillarVideo]
            : [],
          shorts: selection.contentStrategy?.shortsCluster || [],
        },
        affiliatePotential: {
          strategy: selection.contentStrategy?.monetization || "AdSense + affiliates",
        },
        revenueEstimate: { summary: selection.revenuePotential || "TBD" },
        contentStrategy: selection.contentStrategy || {},
        aiReasoning: selection.reasoning,
        selectionMethod: usedAI ? "gemini" : "rules",
        modelVersion: usedAI ? process.env.GEMINI_MODEL || DEFAULT_MODEL : "rule-based",
        analyzedAt: now,
      },
      update: {
        trendExplanation: selection.trendExplanation || selection.reasoning,
        audienceAnalysis: {
          target: "USA English-speaking searchers",
          intent: "informational + commercial",
          confidence: selection.confidence,
        },
        seoKeywords: { primary: selection.seoKeywords || [], longTail: [] },
        youtubeIdeas: selection.youtubeIdeas || {
          videos: selection.contentStrategy?.pillarVideo
            ? [selection.contentStrategy.pillarVideo]
            : [],
          shorts: selection.contentStrategy?.shortsCluster || [],
        },
        contentStrategy: selection.contentStrategy || {},
        aiReasoning: selection.reasoning,
        selectionMethod: usedAI ? "gemini" : "rules",
        modelVersion: usedAI ? process.env.GEMINI_MODEL || DEFAULT_MODEL : "rule-based",
        analyzedAt: now,
      },
    }),
  ]);

  return {
    success: true,
    winnerId,
    winnerTitle: winner.topic.title,
    winnerScore: winner.opportunityScore,
    reasoning: selection.reasoning,
    selectionMethod: usedAI ? "gemini" : "rules",
    candidatesEvaluated: candidates.length,
  };
}

const { generateContent } = require("./generate-content");

/**
 * Full automated pipeline: ingest → score → auto-select → generate content.
 */
async function runFullPipeline() {
  const ingest = await ingestAll();
  const score = await scoreOpportunities();
  const select = await autoSelectWinner();
  const content = select.success ? await generateContent({ autoApprove: true }) : { skipped: true };

  return { ingest, score, select, content };
}

module.exports = { autoSelectWinner, runFullPipeline };
