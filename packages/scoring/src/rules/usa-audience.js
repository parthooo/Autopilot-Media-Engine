const { SOURCE_USA_WEIGHTS } = require("@ame/core");

/**
 * @param {Array<{ source: { slug: string } }>} metrics
 * @param {string} title
 * @returns {number}
 */
function calculateUsaAudienceScore(metrics, title) {
  if (!metrics.length) return 50;

  const weights = metrics.map(
    (m) => SOURCE_USA_WEIGHTS[m.source.slug] ?? 0.5
  );
  const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
  const englishBonus = isEnglish(title) ? 10 : -20;

  return clamp(avgWeight * 90 + englishBonus);
}

/**
 * @param {string} text
 * @returns {boolean}
 */
function isEnglish(text) {
  const asciiRatio =
    (text.match(/[a-zA-Z]/g)?.length ?? 0) / Math.max(text.length, 1);
  return asciiRatio > 0.7;
}

/**
 * @param {number} value
 * @returns {number}
 */
function clamp(value) {
  return Math.round(Math.min(100, Math.max(0, value)) * 10) / 10;
}

module.exports = { calculateUsaAudienceScore };
