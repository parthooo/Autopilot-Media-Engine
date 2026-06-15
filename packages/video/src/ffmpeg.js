const { execFile } = require("child_process");
const { promisify } = require("util");
const fs = require("fs");

const execFileAsync = promisify(execFile);

/**
 * @returns {Promise<boolean>}
 */
async function isFfmpegAvailable() {
  try {
    await execFileAsync("ffmpeg", ["-version"]);
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string} filePath
 * @returns {Promise<number>}
 */
async function getMediaDurationSeconds(filePath) {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    filePath,
  ]);
  const value = parseFloat(stdout.trim());
  return Number.isFinite(value) ? value : 0;
}

/**
 * @param {number} width
 * @param {number} height
 */
function scaleCropFilter(width, height) {
  return `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1`;
}

/**
 * @param {string} text
 */
function sanitizeLabel(text) {
  return String(text || "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

/**
 * @param {string} filePath
 */
function escapeFilterValue(filePath) {
  return filePath.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'");
}

/**
 * @param {string} basePath
 * @param {string} suffix
 * @param {string} text
 */
function writeLabelFile(basePath, suffix, text) {
  const filePath = `${basePath}.${suffix}.txt`;
  fs.writeFileSync(filePath, sanitizeLabel(text), "utf8");
  return filePath;
}

/**
 * @param {string} textFilePath
 * @param {object} opts
 */
function buildDrawtextFilter(textFilePath, opts) {
  const font = resolveFontFile();
  const parts = [
    `drawtext=textfile=${escapeFilterValue(textFilePath)}`,
    font ? `fontfile=${escapeFilterValue(font)}` : null,
    `fontsize=${opts.fontsize}`,
    `fontcolor=${opts.fontcolor || "white"}`,
    "x=(w-text_w)/2",
    `y=${opts.y}`,
  ].filter(Boolean);

  if (opts.box) {
    parts.push("box=1", "boxcolor=black@0.55", "boxborderw=14");
  }

  return parts.join(":");
}

/**
 * @param {object} params
 */
async function imageToKenBurnsClip(params) {
  const { imagePath, outputPath, width, height, duration } = params;
  const frames = Math.max(Math.ceil(duration * 25), 25);

  await execFileAsync(
    "ffmpeg",
    [
      "-y",
      "-loop",
      "1",
      "-i",
      imagePath,
      "-vf",
      `scale=8000:-1,zoompan=z='min(zoom+0.0009,1.14)':d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${width}x${height}:fps=25`,
      "-t",
      String(duration),
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "21",
      "-pix_fmt",
      "yuv420p",
      "-an",
      outputPath,
    ],
    { maxBuffer: 10 * 1024 * 1024 }
  );
}

/**
 * @param {object} params
 */
async function buildSegmentClip(params) {
  const { visualPath, visualKind, audioPath, outputPath, width, height, duration } = params;
  const scaleCrop = scaleCropFilter(width, height);
  const kenBurnsPath = `${outputPath}.kb.mp4`;

  try {
    if (visualKind === "video") {
      await execFileAsync(
        "ffmpeg",
        [
          "-y",
          "-stream_loop",
          "-1",
          "-i",
          visualPath,
          "-i",
          audioPath,
          "-t",
          String(duration),
          "-vf",
          `${scaleCrop},eq=brightness=0.03:contrast=1.08`,
          "-map",
          "0:v:0",
          "-map",
          "1:a:0",
          "-c:v",
          "libx264",
          "-preset",
          "fast",
          "-crf",
          "20",
          "-c:a",
          "aac",
          "-b:a",
          "160k",
          "-pix_fmt",
          "yuv420p",
          "-shortest",
          outputPath,
        ],
        { maxBuffer: 15 * 1024 * 1024 }
      );
      return;
    }

    if (visualKind === "photo" || visualKind === "slide") {
      await imageToKenBurnsClip({
        imagePath: visualPath,
        outputPath: kenBurnsPath,
        width,
        height,
        duration,
      });

      await execFileAsync(
        "ffmpeg",
        [
          "-y",
          "-i",
          kenBurnsPath,
          "-i",
          audioPath,
          "-map",
          "0:v:0",
          "-map",
          "1:a:0",
          "-c:v",
          "copy",
          "-c:a",
          "aac",
          "-b:a",
          "160k",
          "-shortest",
          outputPath,
        ],
        { maxBuffer: 10 * 1024 * 1024 }
      );
    }
  } finally {
    if (fs.existsSync(kenBurnsPath)) fs.unlinkSync(kenBurnsPath);
  }
}

/**
 * @param {string[]} inputPaths
 * @param {string} outputPath
 */
async function concatVideos(inputPaths, outputPath) {
  const listPath = `${outputPath}.concat.txt`;
  const listContent = inputPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n");
  fs.writeFileSync(listPath, listContent, "utf8");

  try {
    await execFileAsync(
      "ffmpeg",
      ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", outputPath],
      { maxBuffer: 10 * 1024 * 1024 }
    );
  } finally {
    if (fs.existsSync(listPath)) fs.unlinkSync(listPath);
  }
}

/**
 * @param {object} params
 */
async function burnCaptionsAndPolish(params) {
  const { inputPath, assPath, outputPath } = params;
  const escapedAss = escapeFilterValue(assPath);

  await execFileAsync(
    "ffmpeg",
    [
      "-y",
      "-i",
      inputPath,
      "-vf",
      `ass='${escapedAss}',format=yuv420p`,
      "-af",
      "loudnorm=I=-16:TP=-1.5:LRA=11",
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "20",
      "-c:a",
      "aac",
      "-b:a",
      "160k",
      "-movflags",
      "+faststart",
      outputPath,
    ],
    { maxBuffer: 20 * 1024 * 1024 }
  );
}

/**
 * @param {string} videoPath
 * @param {string} thumbPath
 */
async function createThumbnail(videoPath, thumbPath) {
  await execFileAsync(
    "ffmpeg",
    ["-y", "-ss", "00:00:04", "-i", videoPath, "-vframes", "1", "-q:v", "2", thumbPath],
    { maxBuffer: 5 * 1024 * 1024 }
  );
}

/**
 * Cross-platform font path for drawtext.
 */
function resolveFontFile() {
  const candidates = [
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
  ];
  return candidates.find((p) => fs.existsSync(p)) || null;
}

/**
 * @param {object} params
 */
async function createSlideImage(params) {
  const { outputPath, width, height, heading, subtitle, format } = params;
  const bgTop = format === "short" ? "0x1a1a2e" : "0x0a1628";
  const bgBottom = format === "short" ? "0x16213e" : "0x1a3a52";
  const accent = format === "short" ? "0xe94560" : "0x53a8b6";

  const basePath = outputPath.replace(/\.png$/i, "");
  const headingFile = writeLabelFile(basePath, "heading", heading || "Section");
  const subtitleFile = subtitle ? writeLabelFile(basePath, "subtitle", subtitle) : null;

  const vf = [
    `drawbox=x=0:y=0:w=iw:h=ih:color=${bgBottom}:t=fill`,
    `drawbox=x=0:y=0:w=iw:h=120:color=${bgTop}@0.55:t=fill`,
    `drawbox=x=0:y=0:w=iw:h=16:color=${accent}:t=fill`,
    buildDrawtextFilter(headingFile, {
      fontsize: format === "short" ? 58 : 48,
      y: "(h/2)-90",
    }),
    subtitleFile
      ? buildDrawtextFilter(subtitleFile, {
          fontsize: format === "short" ? 30 : 26,
          fontcolor: "white@0.88",
          y: "(h/2)+30",
        })
      : null,
  ]
    .filter(Boolean)
    .join(",");

  try {
    await execFileAsync(
      "ffmpeg",
      [
        "-y",
        "-f",
        "lavfi",
        "-i",
        `color=c=black:s=${width}x${height}:d=1`,
        "-vf",
        vf,
        "-frames:v",
        "1",
        outputPath,
      ],
      { maxBuffer: 5 * 1024 * 1024 }
    );
  } finally {
    for (const file of [headingFile, subtitleFile]) {
      if (file && fs.existsSync(file)) fs.unlinkSync(file);
    }
  }
}

module.exports = {
  isFfmpegAvailable,
  getMediaDurationSeconds,
  concatVideos,
  buildSegmentClip,
  burnCaptionsAndPolish,
  createThumbnail,
  createSlideImage,
  resolveFontFile,
};
