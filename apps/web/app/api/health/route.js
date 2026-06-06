import { prisma } from "../../../lib/db";
import { jsonResponse, errorResponse } from "../../../lib/api-response";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    const lastRun = await prisma.ingestionRun.findFirst({
      orderBy: { startedAt: "desc" },
      include: { source: { select: { slug: true, name: true } } },
    });

    return jsonResponse({
      status: "ok",
      database: "connected",
      lastIngestionRun: lastRun
        ? {
            source: lastRun.source.slug,
            status: lastRun.status,
            recordsNew: lastRun.recordsNew,
            completedAt: lastRun.completedAt,
          }
        : null,
    });
  } catch (error) {
    return errorResponse(error.message);
  }
}
