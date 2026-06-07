const { ingestSource, ingestAll } = require("./ingest");
const { scoreOpportunities } = require("./score");
const { autoSelectWinner, runFullPipeline } = require("./auto-select");
const { generateContent, exportApprovedContent } = require("./generate-content");
const { backfillWinnerStrategy } = require("./backfill-winner-strategy");

module.exports = {
  ingestSource,
  ingestAll,
  scoreOpportunities,
  autoSelectWinner,
  generateContent,
  exportApprovedContent,
  backfillWinnerStrategy,
  runFullPipeline,
};
