import { prisma } from "../../../../lib/db";
import { jsonResponse, errorResponse } from "../../../../lib/api-response";

export async function GET(_request, { params }) {
  try {
    const { id } = await params;

    const topic = await prisma.topic.findUnique({
      where: { id },
      include: {
        opportunity: true,
        topicMetrics: {
          include: { source: { select: { slug: true, name: true } } },
          orderBy: { capturedAt: "desc" },
          take: 20,
        },
        rawSignals: {
          include: { source: { select: { slug: true, name: true } } },
          orderBy: { discoveredAt: "desc" },
          take: 10,
        },
      },
    });

    if (!topic) {
      return errorResponse("Topic not found", 404);
    }

    return jsonResponse(topic);
  } catch (error) {
    return errorResponse(error.message);
  }
}
