const { generateJson } = require("./client");

/**
 * @param {object} input
 * @param {string} input.videoTitle
 * @param {string} input.nicheTitle
 * @param {string} input.channelAngle
 * @param {string} input.angle
 * @param {string[]} input.keywords
 * @returns {Promise<object | null>}
 */
async function generateYouTubeScript(input) {
  const prompt = `You are a YouTube scriptwriter for a USA English-language educational channel.

Write a complete, record-ready long-form video script (8–12 minutes spoken).

Niche: ${input.nicheTitle}
Channel angle: ${input.channelAngle}
Video title: ${input.videoTitle}
Video angle: ${input.angle || input.videoTitle}
Target keywords: ${(input.keywords || []).join(", ")}

Requirements:
- Strong hook in first 15 seconds (pattern interrupt or bold claim)
- Clear sections with timestamps in headings, e.g. "## Hook (0:00–0:30)"
- Conversational spoken English — not blog prose
- Include [B-ROLL: description] cues where visuals help
- End with subscribe CTA and one comment question
- Practical, evergreen — not breaking news
- Natural spots for mid-roll ad break (~50% mark)
- No fluff, no fake statistics

Return JSON only:
{
  "title": "video title",
  "hook": "first 15 seconds verbatim",
  "durationMinutes": 10,
  "thumbnailConcept": "short visual description for thumbnail",
  "tags": ["tag1", "tag2"],
  "body": "full markdown script with timestamped sections"
}`;

  return generateJson(prompt);
}

/**
 * @param {object} input
 * @param {string} input.shortTitle
 * @param {string} input.nicheTitle
 * @param {string} input.channelAngle
 * @param {string} input.angle
 * @returns {Promise<object | null>}
 */
async function generateShortsScript(input) {
  const prompt = `You are a YouTube Shorts scriptwriter for a USA English-language channel.

Write a complete 30–60 second vertical video script.

Niche: ${input.nicheTitle}
Channel angle: ${input.channelAngle}
Short title: ${input.shortTitle}
Angle: ${input.angle || input.shortTitle}

Requirements:
- Hook in first 3 seconds — no intro waste
- One clear idea, fast payoff
- Spoken English, punchy sentences
- Include [TEXT ON SCREEN: ...] for key words
- End with loop-friendly CTA or cliffhanger
- 75–150 words total when spoken

Return JSON only:
{
  "title": "short title",
  "hook": "first 3 seconds verbatim",
  "durationSeconds": 45,
  "tags": ["tag1", "tag2"],
  "body": "full markdown script"
}`;

  return generateJson(prompt);
}

module.exports = { generateYouTubeScript, generateShortsScript };
