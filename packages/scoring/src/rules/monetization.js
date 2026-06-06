const { CATEGORY_KEYWORDS } = require("@ame/core");

const CATEGORY_SCORES = {
  finance: 90,
  saas: 85,
  ecommerce: 80,
  tech: 70,
  health: 65,
  general: 40,
};

/**
 * @param {{ category: string | null, title: string, keywords: string[] }} topic
 * @returns {number}
 */
function calculateMonetizationScore(topic) {
  let score = CATEGORY_SCORES[topic.category || "general"] ?? 40;

  const text = `${topic.title} ${topic.keywords.join(" ")}`.toLowerCase();

  const highValueTerms = [
    "tool",
    "software",
    "review",
    "best",
    "compare",
    "alternative",
    "pricing",
    "calculator",
    "affiliate",
    "buy",
    "deal",
  ];

  const matches = highValueTerms.filter((term) => text.includes(term)).length;
  score += Math.min(20, matches * 5);

  const lowValueTerms = ["meme", "funny", "viral", "drama", "celebrity"];
  if (lowValueTerms.some((term) => text.includes(term))) {
    score -= 30;
  }

  return clamp(score);
}

/**
 * @param {number} value
 * @returns {number}
 */
function clamp(value) {
  return Math.round(Math.min(100, Math.max(0, value)) * 10) / 10;
}

module.exports = { calculateMonetizationScore, CATEGORY_SCORES };
