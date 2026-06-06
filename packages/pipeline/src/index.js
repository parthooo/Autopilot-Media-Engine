const { ingestSource, ingestAll } = require("./ingest");
const { scoreOpportunities } = require("./score");
const { autoSelectWinner, runFullPipeline } = require("./auto-select");

module.exports = {
  ingestSource,
  ingestAll,
  scoreOpportunities,
  autoSelectWinner,
  runFullPipeline,
};
