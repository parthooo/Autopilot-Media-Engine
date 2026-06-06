import { prisma } from "../../../lib/db";
import { jsonResponse, errorResponse } from "../../../lib/api-response";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    const where = status ? { status } : {};

    const assets = await prisma.contentAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        opportunity: {
          include: { topic: { select: { title: true } } },
        },
      },
    });

    return jsonResponse(assets);
  } catch (error) {
    return errorResponse(error.message);
  }
}
