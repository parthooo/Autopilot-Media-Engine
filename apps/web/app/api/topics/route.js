import { prisma } from "../../../lib/db";
import { jsonResponse, errorResponse } from "../../../lib/api-response";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "last_seen_at";
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { category: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const orderBy =
      sort === "signal_count"
        ? { signalCount: "desc" }
        : { lastSeenAt: "desc" };

    const [topics, total] = await Promise.all([
      prisma.topic.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          opportunity: { select: { opportunityScore: true, status: true } },
        },
      }),
      prisma.topic.count({ where }),
    ]);

    return jsonResponse(topics, { page, limit, total });
  } catch (error) {
    return errorResponse(error.message);
  }
}
