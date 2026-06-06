const { calculateGrowthScore } = require("./rules/growth");
const { calculateCompetitionScore } = require("./rules/competition");
const { calculateMonetizationScore } = require("./rules/monetization");
const { calculateUsaAudienceScore } = require("./rules/usa-audience");
const { calculateEvergreenScore } = require("./rules/evergreen");

const WEIGHTS = {
  growth: 0.3,
  competition: 0.25,
  monetization: 0.2,
  usaAudience: 0.15,
  evergreen: 0.1,
};

/**
 * @param {{ topic: object, metrics: object[] }} input
 * @param {number} totalTopics
 * @returns {object}
 */
function calculateOpportunityScores(input, totalTopics) {
  const { topic, metrics } = input;

  const growthScore = calculateGrowthScore(metrics);
  const competitionScore = calculateCompetitionScore(topic, totalTopics);
  const monetizationScore = calculateMonetizationScore(topic);
  const usaAudienceScore = calculateUsaAudienceScore(metrics, topic.title);
  const evergreenScore = calculateEvergreenScore(topic.title);

  const opportunityScore = clamp(
    growthScore * WEIGHTS.growth +
      (100 - competitionScore) * WEIGHTS.competition +
      monetizationScore * WEIGHTS.monetization +
      usaAudienceScore * WEIGHTS.usaAudience +
      evergreenScore * WEIGHTS.evergreen
  );

  return {
    growthScore,
    competitionScore,
    monetizationScore,
    usaAudienceScore,
    evergreenScore,
    opportunityScore,
    scoresJson: {
      growth: growthScore,
      competition: competitionScore,
      monetization: monetizationScore,
      usaAudience: usaAudienceScore,
      evergreen: evergreenScore,
      opportunity: opportunityScore,
    },
  };
}

/**
 * @param {number} value
 * @returns {number}
 */
function clamp(value) {
  return Math.round(Math.min(100, Math.max(0, value)) * 10) / 10;
}

module.exports = { calculateOpportunityScores, WEIGHTS };
