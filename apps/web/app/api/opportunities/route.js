import { prisma } from "../../../lib/db";
import { jsonResponse, errorResponse } from "../../../lib/api-response";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const minScore = parseFloat(searchParams.get("minScore") || "0");
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const skip = (page - 1) * limit;

    const where = {
      opportunityScore: { gte: minScore },
      ...(status ? { status } : { status: { not: "archived" } }),
    };

    const [opportunities, total] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        orderBy: { opportunityScore: "desc" },
        skip,
        take: limit,
        include: {
          topic: {
            select: {
              id: true,
              title: true,
              slug: true,
              category: true,
              signalCount: true,
              lastSeenAt: true,
            },
          },
        },
      }),
      prisma.opportunity.count({ where }),
    ]);

    return jsonResponse(opportunities, { page, limit, total });
  } catch (error) {
    return errorResponse(error.message);
  }
}
