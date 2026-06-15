const { normalizeTopic, detectCategory } = require("./utils/normalize-topic");
const { slugify } = require("./utils/slugify");
const { STOP_WORDS } = require("./constants/stop-words");
const { SOURCE_USA_WEIGHTS, CATEGORY_KEYWORDS } = require("./constants/source-weights");
const { SOURCE_SLUG_ORDER, sortBySourceSlugOrder } = require("./constants/source-order");
const {
  LIBRARY_RETENTION_DAYS,
  LOW_SCORE_BENCHMARK,
} = require("./constants/library-retention");

module.exports = {
  normalizeTopic,
  detectCategory,
  slugify,
  STOP_WORDS,
  SOURCE_USA_WEIGHTS,
  CATEGORY_KEYWORDS,
  SOURCE_SLUG_ORDER,
  sortBySourceSlugOrder,
  LIBRARY_RETENTION_DAYS,
  LOW_SCORE_BENCHMARK,
};
