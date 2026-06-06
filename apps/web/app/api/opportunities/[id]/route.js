import { prisma } from "../../../../lib/db";
import { jsonResponse, errorResponse } from "../../../../lib/api-response";

const VALID_STATUSES = ["new", "reviewing", "approved", "rejected", "archived"];

export async function GET(_request, { params }) {
  try {
    const { id } = await params;

    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        topic: {
          include: {
            topicMetrics: {
              include: { source: { select: { slug: true, name: true } } },
              orderBy: { capturedAt: "desc" },
              take: 30,
            },
          },
        },
        scoreHistory: {
          orderBy: { recordedAt: "desc" },
          take: 10,
        },
      },
    });

    if (!opportunity) {
      return errorResponse("Opportunity not found", 404);
    }

    return jsonResponse(opportunity);
  } catch (error) {
    return errorResponse(error.message);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.status || !VALID_STATUSES.includes(body.status)) {
      return errorResponse(`Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`, 400);
    }

    const opportunity = await prisma.opportunity.update({
      where: { id },
      data: { status: body.status },
      include: {
        topic: { select: { title: true, slug: true } },
      },
    });

    return jsonResponse(opportunity);
  } catch (error) {
    return errorResponse(error.message);
  }
}
