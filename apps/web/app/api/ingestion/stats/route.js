import { prisma } from "../../../../lib/db";
import { jsonResponse, errorResponse } from "../../../../lib/api-response";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalSignals, signalsToday, activeSources, lastRun] = await Promise.all([
      prisma.rawSignal.count(),
      prisma.rawSignal.count({ where: { createdAt: { gte: today } } }),
      prisma.source.count({ where: { isActive: true } }),
      prisma.ingestionRun.findFirst({
        orderBy: { startedAt: "desc" },
        where: { status: "success" },
      }),
    ]);

    const [topicCount, opportunityCount] = await Promise.all([
      prisma.topic.count(),
      prisma.opportunity.count(),
    ]);

    return jsonResponse({
      totalSignals,
      signalsToday,
      activeSources,
      topicCount,
      opportunityCount,
      lastRunAt: lastRun?.completedAt ?? null,
    });
  } catch (error) {
    return errorResponse(error.message);
  }
}
