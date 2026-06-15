/**
 * Build ASS subtitles for burned-in captions.
 */

/**
 * @param {number} seconds
 */
function toAssTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.round((seconds % 1) * 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

/**
 * @param {string} text
 */
function escapeAss(text) {
  return String(text || "")
    .replace(/\\/g, "\\\\")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\n/g, "\\N");
}

/**
 * @param {string} text
 * @param {number} [maxChars]
 */
function splitCaptionLines(text, maxChars = 38) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  if (!words.length) return [];

  /** @type {string[]} */
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines;
}

/**
 * @param {Array<{ start: number, end: number, text: string }>} timeline
 * @param {object} opts
 * @param {"long" | "short"} opts.format
 */
function buildAssFile(timeline, opts) {
  const format = opts.format || "long";
  const fontSize = format === "short" ? 56 : 44;
  const marginV = format === "short" ? 140 : 72;
  const maxChars = format === "short" ? 28 : 38;

  let events = "";

  for (const cue of timeline) {
    const lines = splitCaptionLines(cue.text, maxChars);
    if (!lines.length) continue;

    const window = Math.max(cue.end - cue.start, 0.5);
    const slice = window / lines.length;

    lines.forEach((line, index) => {
      const start = cue.start + index * slice;
      const end = cue.start + (index + 1) * slice;
      events += `Dialogue: 0,${toAssTime(start)},${toAssTime(end)},Default,,0,0,0,,${escapeAss(line)}\n`;
    });
  }

  return `[Script Info]
ScriptType: v4.00+
PlayResX: ${format === "short" ? 1080 : 1920}
PlayResY: ${format === "short" ? 1920 : 1080}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial Bold,${fontSize},&H00FFFFFF,&H000000FF,&H00000000,&H64000000,-1,0,0,0,100,100,0,0,1,3,1,2,40,40,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${events}`;
}

module.exports = { buildAssFile, splitCaptionLines, toAssTime };
