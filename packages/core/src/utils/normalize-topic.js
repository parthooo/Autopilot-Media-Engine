const { STOP_WORDS } = require("../constants/stop-words");
const { CATEGORY_KEYWORDS } = require("../constants/source-weights");
const { slugify } = require("./slugify");

/**
 * Normalize a raw signal title into deduplication key + display fields.
 * @param {string} title
 * @returns {{ normalizedKey: string, slug: string, keywords: string[], category: string | null }}
 */
function normalizeTopic(title) {
  const cleaned = title
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = cleaned
    .split(" ")
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));

  const sortedTokens = [...tokens].sort();
  const normalizedKey = sortedTokens.join("-").slice(0, 255) || slugify(title);
  const slug = slugify(title) || normalizedKey;
  const keywords = [...new Set(tokens)].slice(0, 20);
  const category = detectCategory(cleaned);

  return { normalizedKey, slug, keywords, category };
}

/**
 * @param {string} text
 * @returns {string | null}
 */
function detectCategory(text) {
  for (const [category, hints] of Object.entries(CATEGORY_KEYWORDS)) {
    if (hints.some((hint) => text.includes(hint))) {
      return category;
    }
  }
  return "general";
}

module.exports = { normalizeTopic, detectCategory };
