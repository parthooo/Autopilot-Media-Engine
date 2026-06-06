/**
 * @param {string} title
 * @returns {number}
 */
function calculateEvergreenScore(title) {
  const text = title.toLowerCase();
  let score = 50;

  const evergreenSignals = [
    "how to",
    "guide",
    "tutorial",
    "best way",
    "what is",
    "why",
    "tips",
    "learn",
    "beginner",
    "explained",
  ];

  const newsSignals = [
    "breaking",
    "today",
    "just announced",
    "launches",
    "releases",
    "update:",
    "hours ago",
    "this week",
  ];

  evergreenSignals.forEach((signal) => {
    if (text.includes(signal)) score += 10;
  });

  newsSignals.forEach((signal) => {
    if (text.includes(signal)) score -= 12;
  });

  if (text.includes("?")) score += 8;

  return clamp(score);
}

/**
 * @param {number} value
 * @returns {number}
 */
function clamp(value) {
  return Math.round(Math.min(100, Math.max(0, value)) * 10) / 10;
}

module.exports = { calculateEvergreenScore };
