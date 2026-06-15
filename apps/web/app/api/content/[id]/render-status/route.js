import { prisma } from "../../../../../lib/db";
import { jsonResponse, errorResponse } from "../../../../../lib/api-response";

export const dynamic = "force-dynamic";

/**
 * @param {import("next/server").NextRequest} _request
 * @param {{ params: Promise<{ id: string }> }} context
 */
export async function GET(_request, context) {
  try {
    const { id } = await context.params;

    const asset = await prisma.contentAsset.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        assetType: true,
        videoAsset: {
          select: {
            status: true,
            renderedAt: true,
            errorMessage: true,
            metadata: true,
          },
        },
      },
    });

    if (!asset) {
      return errorResponse("Content asset not found", 404);
    }

    return jsonResponse({
      assetId: asset.id,
      title: asset.title,
      videoStatus: asset.videoAsset?.status || "none",
      renderedAt: asset.videoAsset?.renderedAt,
      errorMessage: asset.videoAsset?.errorMessage,
      qualityVersion: asset.videoAsset?.metadata?.qualityVersion,
      hasPexels: asset.videoAsset?.metadata?.hasPexels,
    });
  } catch (error) {
    return errorResponse(error.message);
  }
}
