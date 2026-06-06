const { getModel, generateJson, DEFAULT_MODEL } = require("./client");
const { selectWinnerWithAI, selectWinnerWithRules } = require("./select-winner");

module.exports = {
  getModel,
  generateJson,
  DEFAULT_MODEL,
  selectWinnerWithAI,
  selectWinnerWithRules,
};
