const fs = require("fs");
const path = require("path");
const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

const VOICES = {
  long: process.env.EDGE_TTS_VOICE_LONG || process.env.EDGE_TTS_VOICE || "en-US-AndrewNeural",
  short: process.env.EDGE_TTS_VOICE_SHORT || "en-US-AvaNeural",
};

/**
 * @param {string} text
 */
function splitSentences(text) {
  const parts = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  if (!parts) return [text];
  return parts.map((p) => p.trim()).filter((p) => p.length > 2);
}

/**
 * @param {string} text
 * @param {string} voice
 * @param {string} partPath
 */
async function synthesizeChunkToFile(text, voice, partPath) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
  const { audioStream } = await tts.toStream(text);

  await new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(partPath);
    audioStream.pipe(writeStream);
    audioStream.on("error", reject);
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });
}

/**
 * @param {string} workDir
 */
async function getSilenceFile(workDir) {
  const silencePath = path.join(workDir, ".silence-250ms.mp3");
  if (fs.existsSync(silencePath)) return silencePath;

  await execFileAsync(
    "ffmpeg",
    [
      "-y",
      "-f",
      "lavfi",
      "-i",
      "anullsrc=r=24000:cl=mono",
      "-t",
      "0.28",
      "-c:a",
      "libmp3lame",
      silencePath,
    ],
    { maxBuffer: 2 * 1024 * 1024 }
  );

  return silencePath;
}

/**
 * @param {string[]} partPaths
 * @param {string} outputPath
 */
async function concatAudioParts(partPaths, outputPath) {
  const listPath = `${outputPath}.audio-list.txt`;
  const listContent = partPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n");
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
 * @param {string} text
 * @param {string} outputPath
 * @param {object} [opts]
 * @param {"long" | "short"} [opts.format]
 */
async function synthesizeSpeech(text, outputPath, opts = {}) {
  const format = opts.format || "long";
  const voice = VOICES[format] || VOICES.long;
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const sentences = splitSentences(text);
  const workDir = path.dirname(outputPath);

  if (sentences.length <= 1) {
    await synthesizeChunkToFile(text, voice, outputPath);
    return;
  }

  const silence = await getSilenceFile(workDir);
  const partPaths = [];

  for (let i = 0; i < sentences.length; i++) {
    const partPath = `${outputPath}.part-${String(i).padStart(3, "0")}.mp3`;
    await synthesizeChunkToFile(sentences[i], voice, partPath);
    partPaths.push(partPath);
    if (i < sentences.length - 1) partPaths.push(silence);
  }

  await concatAudioParts(partPaths, outputPath);

  for (const part of partPaths) {
    if (part !== silence && fs.existsSync(part)) fs.unlinkSync(part);
  }
}

module.exports = { synthesizeSpeech, VOICES, splitSentences };
