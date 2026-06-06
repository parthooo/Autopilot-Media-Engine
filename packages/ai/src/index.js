const { getModel, generateJson, DEFAULT_MODEL } = require("./client");
const { selectWinnerWithAI, selectWinnerWithRules } = require("./select-winner");
const { generateArticle } = require("./generate-article");

module.exports = {
  getModel,
  generateJson,
  DEFAULT_MODEL,
  selectWinnerWithAI,
  selectWinnerWithRules,
  generateArticle,
};
