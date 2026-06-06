const { prisma } = require("@ame/database");
const { calculateOpportunityScores } = require("@ame/scoring");

async function scoreOpportunities() {
  const totalTopics = await prisma.topic.count();
  const topics = await prisma.topic.findMany({
    include: {
      topicMetrics: {
        include: { source: true },
        orderBy: { capturedAt: "desc" },
        take: 50,
      },
    },
  });

  let scored = 0;
  const now = new Date();

  for (const topic of topics) {
    if (!topic.topicMetrics.length) continue;

    const scores = calculateOpportunityScores(
      { topic, metrics: topic.topicMetrics },
      totalTopics
    );

    const { scoresJson, ...scoreFields } = scores;

    const opportunity = await prisma.opportunity.upsert({
      where: { topicId: topic.id },
      create: { topicId: topic.id, ...scoreFields, scoredAt: now },
      update: { ...scoreFields, scoredAt: now },
    });

    await prisma.opportunityScoreHistory.create({
      data: {
        opportunityId: opportunity.id,
        opportunityScore: scores.opportunityScore,
        scoresJson,
      },
    });

    scored += 1;
  }

  return { scored };
}

module.exports = { scoreOpportunities };
