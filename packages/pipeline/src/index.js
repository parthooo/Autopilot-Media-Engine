const { ingestSource, ingestAll } = require("./ingest");
const { scoreOpportunities } = require("./score");
const { autoSelectWinner, runFullPipeline } = require("./auto-select");
const { generateContent } = require("./generate-content");

module.exports = {
  ingestSource,
  ingestAll,
  scoreOpportunities,
  autoSelectWinner,
  generateContent,
  runFullPipeline,
};
