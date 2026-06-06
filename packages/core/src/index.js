const { normalizeTopic, detectCategory } = require("./utils/normalize-topic");
const { slugify } = require("./utils/slugify");
const { STOP_WORDS } = require("./constants/stop-words");
const { SOURCE_USA_WEIGHTS, CATEGORY_KEYWORDS } = require("./constants/source-weights");

module.exports = {
  normalizeTopic,
  detectCategory,
  slugify,
  STOP_WORDS,
  SOURCE_USA_WEIGHTS,
  CATEGORY_KEYWORDS,
};
