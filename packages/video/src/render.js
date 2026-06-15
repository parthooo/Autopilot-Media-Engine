const fs = require("fs");
const path = require("path");
const { slugify } = require("@ame/core");
const { getRepoRoot } = require("./paths");
const { parseScript } = require("./parse-script");
const { synthesizeSpeech } = require("./tts");
const { resolveVisual } = require("./visuals");
const { buildAssFile } = require("./captions");
const {
  isFfmpegAvailable,
  getMediaDurationSeconds,
  concatVideos,
  buildSegmentClip,
  burnCaptionsAndPolish,
  createThumbnail,
} = require("./ffmpeg");

const QUALITY_VERSION = "v2";

const FORMATS = {
  youtube_script: { format: "long", width: 1920, height: 1080 },
  shorts_script: { format: "short", width: 1080, height: 1920 },
};

/**
 * @param {object} asset - content asset row
 * @param {object} [options]
 * @param {boolean} [options.force=false]
 * @param {string} [options.outputRoot]
 * @returns {Promise<object>}
 */
async function renderContentAsset(asset, options = {}) {
  const spec = FORMATS[asset.assetType];
  if (!spec) {
    return { success: false, error: `Unsupported asset type: ${asset.assetType}` };
  }

  if (!(await isFfmpegAvailable())) {
    return {
      success: false,
      error: "ffmpeg not found — install ffmpeg and ensure it is on PATH",
    };
  }

  const { segments } = parseScript(asset.body);
  if (!segments.length) {
    return { success: false, error: "No speakable segments found in script" };
  }

  const outputRoot =
    options.outputRoot || path.join(getRepoRoot(), "renders", asset.opportunityId);
  const workDir = path.join(
    outputRoot,
    ".work",
    `${slugify(asset.title)}-${asset.id.slice(0, 8)}`
  );
  fs.mkdirSync(workDir, { recursive: true });

  const segmentPaths = [];
  /** @type {Array<{ start: number, end: number, text: string }>} */
  const captionTimeline = [];
  let timelineOffset = 0;

  try {
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const audioPath = path.join(workDir, `audio-${String(i).padStart(3, "0")}.mp3`);
      const segmentOut = path.join(workDir, `segment-${String(i).padStart(3, "0")}.mp4`);

      await synthesizeSpeech(segment.text, audioPath, { format: spec.format });
      const duration = Math.max(await getMediaDurationSeconds(audioPath), 1.8);

      captionTimeline.push({
        start: timelineOffset,
        end: timelineOffset + duration,
        text: segment.text,
      });
      timelineOffset += duration;

      const visual = await resolveVisual({
        workDir,
        index: i,
        heading: segment.heading,
        broll: segment.broll,
        onScreen: segment.onScreen,
        width: spec.width,
        height: spec.height,
        format: spec.format,
      });

      await buildSegmentClip({
        visualPath: visual.path,
        visualKind: visual.kind,
        audioPath,
        outputPath: segmentOut,
        width: spec.width,
        height: spec.height,
        duration,
      });

      segmentPaths.push(segmentOut);
    }

    const filename = `${slugify(asset.title)}.mp4`;
    const thumbFilename = `${slugify(asset.title)}.jpg`;
    const outputPath = path.join(outputRoot, filename);
    const thumbPath = path.join(outputRoot, thumbFilename);
    const rawPath = path.join(workDir, "concat-raw.mp4");
    const assPath = path.join(workDir, "captions.ass");

    await concatVideos(segmentPaths, rawPath);

    fs.writeFileSync(
      assPath,
      buildAssFile(captionTimeline, { format: spec.format }),
      "utf8"
    );

    await burnCaptionsAndPolish({
      inputPath: rawPath,
      assPath,
      outputPath,
    });

    try {
      await createThumbnail(outputPath, thumbPath);
    } catch {
      // thumbnail is optional
    }

    const durationSeconds = await getMediaDurationSeconds(outputPath);
    const fileSizeBytes = fs.statSync(outputPath).size;

    return {
      success: true,
      filePath: outputPath,
      relativePath: path.relative(getRepoRoot(), outputPath),
      thumbnailPath: fs.existsSync(thumbPath) ? thumbPath : null,
      thumbnailRelative: fs.existsSync(thumbPath)
        ? path.relative(getRepoRoot(), thumbPath)
        : null,
      format: spec.format,
      width: spec.width,
      height: spec.height,
      durationSeconds,
      fileSizeBytes,
      segmentCount: segments.length,
      qualityVersion: QUALITY_VERSION,
      hasPexels: Boolean(process.env.PEXELS_API_KEY),
    };
  } finally {
    if (!options.keepWorkDir && fs.existsSync(workDir)) {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  }
}

module.exports = { renderContentAsset, FORMATS, QUALITY_VERSION };
