/**
 * Competition score — higher means MORE competition (0–100).
 * @param {{ signalCount: number, category: string | null, keywords: string[] }} topic
 * @param {number} totalTopics
 * @returns {number}
 */
function calculateCompetitionScore(topic, totalTopics) {
  const frequencyPenalty = Math.min(50, topic.signalCount * 3);
  const genericPenalty = hasGenericKeywords(topic.title ?? "", topic.keywords ?? []) ? 25 : 0;
  const categoryPenalty =
    topic.category === "tech" ? 15 : topic.category === "general" ? 10 : 5;
  const densityPenalty = totalTopics > 0 ? Math.min(20, (topic.signalCount / totalTopics) * 100) : 0;

  return clamp(frequencyPenalty + genericPenalty + categoryPenalty + densityPenalty);
}

/**
 * @param {string} title
 * @param {string[]} keywords
 * @returns {boolean}
 */
function hasGenericKeywords(title, keywords) {
  const generic = ["news", "update", "breaking", "today", "latest", "new"];
  const text = `${title} ${keywords.join(" ")}`.toLowerCase();
  return generic.some((word) => text.includes(word));
}

/**
 * @param {number} value
 * @returns {number}
 */
function clamp(value) {
  return Math.round(Math.min(100, Math.max(0, value)) * 10) / 10;
}

module.exports = { calculateCompetitionScore };
