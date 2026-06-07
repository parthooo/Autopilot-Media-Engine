const { getModel, generateJson, DEFAULT_MODEL } = require("./client");
const { selectWinnerWithAI, selectWinnerWithRules } = require("./select-winner");
const {
  isVideoStrategyComplete,
  normalizeWinnerSelection,
} = require("./normalize-winner-strategy");
const { generateArticle } = require("./generate-article");
const {
  generateYouTubeScript,
  generateShortsScript,
} = require("./generate-youtube-script");

module.exports = {
  getModel,
  generateJson,
  DEFAULT_MODEL,
  selectWinnerWithAI,
  selectWinnerWithRules,
  isVideoStrategyComplete,
  normalizeWinnerSelection,
  generateArticle,
  generateYouTubeScript,
  generateShortsScript,
};
