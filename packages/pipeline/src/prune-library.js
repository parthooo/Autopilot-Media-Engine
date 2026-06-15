const { prisma } = require("@ame/database");
const { LIBRARY_RETENTION_DAYS, LOW_SCORE_BENCHMARK } = require("@ame/core");

function retentionCutoff(days = LIBRARY_RETENTION_DAYS) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function buildPruneCandidateWhere(cutoff, scoreBenchmark = LOW_SCORE_BENCHMARK) {
  return {
    lastSeenAt: { lt: cutoff },
    AND: [
      {
        OR: [
          { opportunity: null },
          {
            opportunity: {
              status: { in: ["rejected", "archived"] },
              contentAssets: { none: {} },
            },
          },
          {
            opportunity: {
              status: "new",
              opportunityScore: { lt: scoreBenchmark },
              contentAssets: { none: {} },
            },
          },
        ],
      },
      {
        NOT: {
          opportunity: {
            OR: [
              { status: { in: ["approved", "reviewing"] } },
              { contentAssets: { some: {} } },
            ],
          },
        },
      },
    ],
  };
}

async function deleteTopicCascade(topicId, opportunityId) {
  if (opportunityId) {
    await prisma.opportunityScoreHistory.deleteMany({ where: { opportunityId } });
    await prisma.opportunityAnalysis.deleteMany({ where: { opportunityId } });
    await prisma.opportunity.delete({ where: { id: opportunityId } });
  }

  await prisma.topicMetric.deleteMany({ where: { topicId } });
  await prisma.rawSignal.deleteMany({ where: { topicId } });
  await prisma.topic.delete({ where: { id: topicId } });
}

/**
 * Remove stale low-quality library rows. Keeps winners, in-review niches,
 * anything with generated content, and topics still seen inside the window.
 */
async function pruneLibrary({
  dryRun = false,
  retentionDays = LIBRARY_RETENTION_DAYS,
  scoreBenchmark = LOW_SCORE_BENCHMARK,
} = {}) {
  const cutoff = retentionCutoff(retentionDays);

  const [candidates, orphanSignals] = await Promise.all([
    prisma.topic.findMany({
      where: buildPruneCandidateWhere(cutoff, scoreBenchmark),
      select: {
        id: true,
        title: true,
        lastSeenAt: true,
        opportunity: {
          select: {
            id: true,
            status: true,
            opportunityScore: true,
          },
        },
      },
      orderBy: { lastSeenAt: "asc" },
    }),
    prisma.rawSignal.count({
      where: {
        topicId: null,
        discoveredAt: { lt: cutoff },
      },
    }),
  ]);

  if (dryRun) {
    return {
      success: true,
      dryRun: true,
      retentionDays,
      scoreBenchmark,
      cutoff: cutoff.toISOString(),
      topicsEligible: candidates.length,
      orphanSignalsEligible: orphanSignals,
      sample: candidates.slice(0, 10).map((topic) => ({
        id: topic.id,
        title: topic.title,
        lastSeenAt: topic.lastSeenAt,
        status: topic.opportunity?.status || "unscored",
        score: topic.opportunity?.opportunityScore ?? null,
      })),
    };
  }

  let topicsDeleted = 0;
  for (const topic of candidates) {
    await deleteTopicCascade(topic.id, topic.opportunity?.id);
    topicsDeleted += 1;
  }

  const orphanSignalsDeleted = await prisma.rawSignal.deleteMany({
    where: {
      topicId: null,
      discoveredAt: { lt: cutoff },
    },
  });

  return {
    success: true,
    dryRun: false,
    retentionDays,
    scoreBenchmark,
    cutoff: cutoff.toISOString(),
    topicsDeleted,
    orphanSignalsDeleted: orphanSignalsDeleted.count,
  };
}

module.exports = { pruneLibrary, buildPruneCandidateWhere, retentionCutoff };
