const { generateJson } = require("./client");

/**
 * Ask Gemini to pick the single best opportunity for a solo SEO/affiliate operator.
 * @param {Array<{ id: string, title: string, category: string | null, opportunityScore: number, growthScore: number, competitionScore: number, monetizationScore: number, usaAudienceScore: number, evergreenScore: number }>} candidates
 * @returns {Promise<{ winnerId: string, reasoning: string, confidence: number, trendExplanation: string, contentStrategy: object, seoKeywords: string[], revenuePotential: string } | null>}
 */
async function selectWinnerWithAI(candidates) {
  if (!candidates.length) return null;

  const prompt = `You are a media business strategist helping a solo developer in Bangladesh build passive income via SEO websites and affiliate marketing (target: $100/month).

Pick exactly ONE opportunity from the list below that has the best chance of:
- Evergreen SEO traffic (not breaking news that dies in 48 hours)
- Monetization via AdSense + affiliate links
- USA/English audience
- Low competition for a new small site
- Enough depth for 10+ articles

Reject news headlines, celebrity gossip, memes, and topics that need deep domain expertise.

Return JSON only:
{
  "winnerId": "uuid of chosen opportunity",
  "reasoning": "2-3 sentences why this wins",
  "confidence": 0-100,
  "trendExplanation": "why it's trending",
  "contentStrategy": { "siteAngle": "string", "articleCluster": ["title1", "title2", "title3", "title4", "title5"], "monetization": "string" },
  "seoKeywords": ["keyword1", "keyword2"],
  "revenuePotential": "realistic 6-month estimate"
}

Candidates:
${JSON.stringify(candidates, null, 2)}`;

  return generateJson(prompt);
}

/**
 * Rule-based fallback when Gemini is unavailable.
 * @param {typeof candidates} candidates
 */
function selectWinnerWithRules(candidates) {
  const sorted = [...candidates].sort((a, b) => {
    const scoreA =
      a.evergreenScore * 0.35 +
      a.monetizationScore * 0.35 +
      a.opportunityScore * 0.2 +
      (100 - a.competitionScore) * 0.1;
    const scoreB =
      b.evergreenScore * 0.35 +
      b.monetizationScore * 0.35 +
      b.opportunityScore * 0.2 +
      (100 - b.competitionScore) * 0.1;
    return scoreB - scoreA;
  });

  const winner = sorted[0];
  return {
    winnerId: winner.id,
    reasoning: `Rule-based selection: highest evergreen + monetization composite. No GEMINI_API_KEY configured.`,
    confidence: 50,
    trendExplanation: `Topic "${winner.title}" scored ${winner.opportunityScore} with strong monetization/evergreen signals.`,
    contentStrategy: {
      siteAngle: `Build an SEO micro-site around: ${winner.title}`,
      articleCluster: [
        `What is ${winner.title}? A complete guide`,
        `Best tools and resources for ${winner.title}`,
        `How to get started with ${winner.title}`,
        `${winner.title}: common mistakes to avoid`,
        `${winner.title} FAQ`,
      ],
      monetization: "AdSense + relevant affiliate links",
    },
    seoKeywords: winner.title.toLowerCase().split(" ").slice(0, 5),
    revenuePotential: "Moderate — validate with search volume research",
  };
}

module.exports = { selectWinnerWithAI, selectWinnerWithRules };
