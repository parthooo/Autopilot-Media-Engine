import { prisma } from "../../../../lib/db";
import { jsonResponse, errorResponse } from "../../../../lib/api-response";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const skip = (page - 1) * limit;

    const where = source
      ? { source: { slug: source } }
      : {};

    const [runs, total] = await Promise.all([
      prisma.ingestionRun.findMany({
        where,
        include: { source: { select: { slug: true, name: true } } },
        orderBy: { startedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.ingestionRun.count({ where }),
    ]);

    return jsonResponse(runs, { page, limit, total });
  } catch (error) {
    return errorResponse(error.message);
  }
}
