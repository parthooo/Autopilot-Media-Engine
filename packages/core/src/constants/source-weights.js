/** USA audience weight by source slug (0–1) */
const SOURCE_USA_WEIGHTS = {
  youtube: 0.85,
  "hacker-news": 0.85,
  "dev-to": 0.75,
  "google-trends": 0.95,
  "github-trending": 0.8,
  "product-hunt": 0.9,
  reddit: 0.7,
};

/** Monetization category keyword hints */
const CATEGORY_KEYWORDS = {
  finance: ["finance", "money", "invest", "stock", "crypto", "budget", "loan", "mortgage"],
  saas: ["saas", "startup", "software", "api", "tool", "platform", "app"],
  tech: ["ai", "machine learning", "programming", "developer", "code", "cloud", "data"],
  health: ["health", "fitness", "diet", "wellness", "medical"],
  ecommerce: ["shop", "ecommerce", "amazon", "product", "buy", "review"],
};

module.exports = { SOURCE_USA_WEIGHTS, CATEGORY_KEYWORDS };
