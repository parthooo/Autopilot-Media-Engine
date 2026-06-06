import { prisma } from "../../../../lib/db";
import { jsonResponse, errorResponse } from "../../../../lib/api-response";

export async function GET(_request, { params }) {
  try {
    const { id } = await params;

    const asset = await prisma.contentAsset.findUnique({
      where: { id },
      include: {
        opportunity: {
          include: { topic: { select: { title: true, category: true } } },
        },
      },
    });

    if (!asset) return errorResponse("Content not found", 404);
    return jsonResponse(asset);
  } catch (error) {
    return errorResponse(error.message);
  }
}
