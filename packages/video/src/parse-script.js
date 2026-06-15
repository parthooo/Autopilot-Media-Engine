/**
 * Parse markdown script body into spoken segments with visual hints.
 */

const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;

/**
 * @param {string} body
 * @returns {{ title: string, segments: Array<{ heading: string, text: string, broll: string | null, onScreen: string | null }> }}
 */
function parseScript(body) {
  const stripped = body.replace(FRONTMATTER_RE, "").trim();
  const lines = stripped.split(/\r?\n/);

  /** @type {Array<{ heading: string, text: string, broll: string | null, onScreen: string | null }>} */
  const segments = [];
  let currentHeading = "Intro";
  let currentLines = [];
  let pendingBroll = null;
  let pendingOnScreen = null;

  function flush() {
    const raw = currentLines.join("\n").trim();
    if (!raw) return;

    const brollMatches = [...raw.matchAll(/\[B-ROLL:\s*([^\]]+)\]/gi)];
    const onScreenMatches = [...raw.matchAll(/\[TEXT ON SCREEN:\s*([^\]]+)\]/gi)];
    const broll = pendingBroll || brollMatches[0]?.[1]?.trim() || null;
    const onScreen = pendingOnScreen || onScreenMatches[0]?.[1]?.trim() || null;

    const text = cleanForSpeech(raw);
    if (text.length < 8) return;

    segments.push({ heading: currentHeading, text, broll, onScreen });
    pendingBroll = null;
    pendingOnScreen = null;
  }

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)/);
    if (headingMatch) {
      flush();
      currentLines = [];
      currentHeading = headingMatch[1]
        .replace(/\(\d+:\d+[^)]*\)/g, "")
        .replace(/\[.*?\]/g, "")
        .trim();
      continue;
    }

    const brollOnly = line.match(/^\[B-ROLL:\s*([^\]]+)\]\s*$/i);
    if (brollOnly) {
      pendingBroll = brollOnly[1].trim();
      continue;
    }

    const onScreenOnly = line.match(/^\[TEXT ON SCREEN:\s*([^\]]+)\]\s*$/i);
    if (onScreenOnly) {
      pendingOnScreen = onScreenOnly[1].trim();
      continue;
    }

    if (line.trim()) currentLines.push(line);
  }

  flush();

  if (segments.length === 0) {
    const fallback = cleanForSpeech(stripped);
    if (fallback) {
      segments.push({ heading: "Script", text: fallback, broll: null, onScreen: null });
    }
  }

  return { title: currentHeading, segments };
}

/**
 * @param {string} text
 */
function cleanForSpeech(text) {
  return text
    .replace(/\[B-ROLL:\s*[^\]]+\]/gi, "")
    .replace(/\[TEXT ON SCREEN:\s*[^\]]+\]/gi, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

module.exports = { parseScript, cleanForSpeech };
