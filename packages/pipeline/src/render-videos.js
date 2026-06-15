const { prisma } = require("@ame/database");
const { renderContentAsset, isFfmpegAvailable } = require("@ame/video");

/**
 * Render approved video scripts for the current winner into MP4 files.
 * @param {object} [options]
 * @param {boolean} [options.force=false] - Re-render even if completed
 * @param {boolean} [options.youtubeOnly=false]
 * @param {boolean} [options.shortsOnly=false]
 * @param {string} [options.assetId] - Render one asset by ID
 * @returns {Promise<object>}
 */
async function renderVideos(options = {}) {
  const force = options.force === true;
  const youtubeOnly = options.youtubeOnly === true;
  const shortsOnly = options.shortsOnly === true;
  const assetId = options.assetId || null;

  if (!(await isFfmpegAvailable())) {
    return {
      success: false,
      message: "ffmpeg not found — install ffmpeg and ensure it is on PATH",
    };
  }

  let opportunityId = null;

  if (assetId) {
    const asset = await prisma.contentAsset.findUnique({
      where: { id: assetId },
      select: { opportunityId: true, assetType: true },
    });
    if (!asset) {
      return { success: false, message: `Content asset not found: ${assetId}` };
    }
    if (!["youtube_script", "shorts_script"].includes(asset.assetType)) {
      return { success: false, message: "Asset is not a video script" };
    }
    opportunityId = asset.opportunityId;
  } else {
    const opportunity = await prisma.opportunity.findFirst({
      where: { status: "approved" },
      orderBy: { updatedAt: "desc" },
      include: { topic: { select: { title: true } } },
    });

    if (!opportunity) {
      return { success: false, message: "No approved opportunity found" };
    }
    opportunityId = opportunity.id;
  }

  const typeFilter = [];
  if (youtubeOnly) typeFilter.push("youtube_script");
  else if (shortsOnly) typeFilter.push("shorts_script");
  else typeFilter.push("youtube_script", "shorts_script");

  const assets = await prisma.contentAsset.findMany({
    where: {
      opportunityId,
      status: "approved",
      assetType: { in: typeFilter },
      ...(assetId ? { id: assetId } : {}),
    },
    include: { videoAsset: true },
    orderBy: [{ assetType: "asc" }, { createdAt: "asc" }],
  });

  if (!assets.length) {
    return {
      success: false,
      message: "No approved video scripts to render — run generate-content first",
    };
  }

  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: { topic: { select: { title: true } } },
  });

  const rendered = [];
  const skipped = [];
  const errors = [];

  for (const asset of assets) {
    if (asset.videoAsset?.status === "completed" && !force) {
      skipped.push({ id: asset.id, title: asset.title, reason: "already rendered" });
      continue;
    }

    await prisma.videoAsset.upsert({
      where: { contentAssetId: asset.id },
      create: {
        contentAssetId: asset.id,
        format: asset.assetType === "shorts_script" ? "short" : "long",
        filePath: "",
        width: asset.assetType === "shorts_script" ? 1080 : 1920,
        height: asset.assetType === "shorts_script" ? 1920 : 1080,
        status: "rendering",
      },
      update: {
        status: "rendering",
        errorMessage: null,
      },
    });

    try {
      const result = await renderContentAsset(asset, { force });

      if (!result.success) {
        await prisma.videoAsset.update({
          where: { contentAssetId: asset.id },
          data: {
            status: "failed",
            errorMessage: result.error,
          },
        });
        errors.push({ id: asset.id, title: asset.title, error: result.error });
        continue;
      }

      const videoAsset = await prisma.videoAsset.update({
        where: { contentAssetId: asset.id },
        data: {
          format: result.format,
          filePath: result.filePath,
          durationSeconds: result.durationSeconds,
          width: result.width,
          height: result.height,
          fileSizeBytes: result.fileSizeBytes,
          status: "completed",
          errorMessage: null,
          renderedAt: new Date(),
          metadata: {
            segmentCount: result.segmentCount,
            relativePath: result.relativePath,
            thumbnailRelative: result.thumbnailRelative,
            qualityVersion: result.qualityVersion,
            hasPexels: result.hasPexels,
          },
        },
      });

      rendered.push({
        id: asset.id,
        title: asset.title,
        type: asset.assetType,
        videoAssetId: videoAsset.id,
        filePath: result.relativePath,
        durationSeconds: result.durationSeconds,
      });
    } catch (error) {
      await prisma.videoAsset.update({
        where: { contentAssetId: asset.id },
        data: {
          status: "failed",
          errorMessage: error.message,
        },
      });
      errors.push({ id: asset.id, title: asset.title, error: error.message });
    }
  }

  return {
    success: rendered.length > 0 || skipped.length > 0,
    opportunityId,
    niche: opportunity?.topic?.title,
    rendered: rendered.length,
    items: rendered,
    skipped: skipped.length,
    skippedItems: skipped,
    errors,
  };
}

module.exports = { renderVideos };
