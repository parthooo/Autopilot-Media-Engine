const { generateJson } = require("./client");

/**
 * Ask Gemini to pick the single best opportunity for a solo SEO/affiliate operator.
 * @param {Array<{ id: string, title: string, category: string | null, opportunityScore: number, growthScore: number, competitionScore: number, monetizationScore: number, usaAudienceScore: number, evergreenScore: number }>} candidates
 * @returns {Promise<{ winnerId: string, reasoning: string, confidence: number, trendExplanation: string, contentStrategy: object, seoKeywords: string[], revenuePotential: string } | null>}
 */
async function selectWinnerWithAI(candidates) {
  if (!candidates.length) return null;

  const prompt = `You are a media business strategist helping a solo developer in Bangladesh build passive income with $0 upfront cost (target: $100/month).

Primary revenue path: YouTube (free hosting). Secondary: SEO articles (only after revenue covers domain).

Pick exactly ONE opportunity from the list below that has the best chance of:
- YouTube-friendly topic (visual explainer, how-to, listicle, tool review — not news that dies in 48h)
- Evergreen search + suggested traffic potential
- Monetization via YouTube AdSense + affiliate links in description
- USA/English audience
- Low competition for a new small channel
- Enough depth for 1 pillar video + 5 Shorts + 5 supporting articles

Reject news headlines, celebrity gossip, memes, and topics that need deep domain expertise or expensive production.

Return JSON only:
{
  "winnerId": "uuid of chosen opportunity",
  "reasoning": "2-3 sentences why this wins",
  "confidence": 0-100,
  "trendExplanation": "why it's trending",
  "contentStrategy": {
    "channelAngle": "YouTube channel positioning",
    "siteAngle": "SEO site angle (for later)",
    "pillarVideo": { "title": "main 8-12 min video title", "angle": "unique hook" },
    "shortsCluster": [
      { "title": "short title", "angle": "hook angle" },
      { "title": "short title", "angle": "hook angle" },
      { "title": "short title", "angle": "hook angle" },
      { "title": "short title", "angle": "hook angle" },
      { "title": "short title", "angle": "hook angle" }
    ],
    "articleCluster": ["title1", "title2", "title3", "title4", "title5"],
    "monetization": "string"
  },
  "youtubeIdeas": {
    "videos": [{ "title": "pillar title", "angle": "string", "format": "long-form" }],
    "shorts": [{ "title": "short title", "angle": "string" }]
  },
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
      channelAngle: `Explain ${winner.title} for beginners on YouTube`,
      siteAngle: `Build an SEO micro-site around: ${winner.title}`,
      pillarVideo: {
        title: `${winner.title}: Complete Beginner's Guide (2026)`,
        angle: "Everything you need to know in under 12 minutes",
      },
      shortsCluster: [
        { title: `3 ${winner.title} mistakes to avoid`, angle: "quick warning hook" },
        { title: `Best ${winner.title} tip nobody tells you`, angle: "contrarian hook" },
        { title: `Is ${winner.title} worth it?`, angle: "yes/no debate" },
        { title: `${winner.title} in 60 seconds`, angle: "speed explainer" },
        { title: `Stop doing this with ${winner.title}`, angle: "pattern interrupt" },
      ],
      articleCluster: [
        `What is ${winner.title}? A complete guide`,
        `Best tools and resources for ${winner.title}`,
        `How to get started with ${winner.title}`,
        `${winner.title}: common mistakes to avoid`,
        `${winner.title} FAQ`,
      ],
      monetization: "YouTube AdSense + affiliate links in description",
    },
    youtubeIdeas: {
      videos: [
        {
          title: `${winner.title}: Complete Beginner's Guide (2026)`,
          angle: "Everything you need to know in under 12 minutes",
          format: "long-form",
        },
      ],
      shorts: [
        { title: `3 ${winner.title} mistakes to avoid`, angle: "quick warning hook" },
        { title: `Best ${winner.title} tip nobody tells you`, angle: "contrarian hook" },
        { title: `Is ${winner.title} worth it?`, angle: "yes/no debate" },
        { title: `${winner.title} in 60 seconds`, angle: "speed explainer" },
        { title: `Stop doing this with ${winner.title}`, angle: "pattern interrupt" },
      ],
    },
    seoKeywords: winner.title.toLowerCase().split(" ").slice(0, 5),
    revenuePotential: "Moderate — validate with YouTube search + Google Trends",
  };
}

module.exports = { selectWinnerWithAI, selectWinnerWithRules };
