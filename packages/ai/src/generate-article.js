const { generateJson } = require("./client");

/**
 * @param {object} input
 * @param {string} input.articleTitle
 * @param {string} input.nicheTitle
 * @param {string} input.siteAngle
 * @param {string[]} input.keywords
 * @returns {Promise<object | null>}
 */
async function generateArticle(input) {
  const prompt = `You are an SEO content writer for a USA English-language website.

Write a complete, publish-ready blog article.

Niche: ${input.nicheTitle}
Site angle: ${input.siteAngle}
Article title: ${input.articleTitle}
Target keywords: ${(input.keywords || []).join(", ")}

Requirements:
- 800-1200 words
- Markdown body only (no frontmatter in body)
- Include H2 and H3 headings
- Practical, evergreen, not newsy
- USA audience
- Natural places for AdSense and affiliate mentions (don't invent fake products)
- No fluff intro

Return JSON only:
{
  "title": "article title",
  "seoTitle": "max 60 chars",
  "seoDescription": "max 155 chars",
  "slug": "url-slug",
  "tags": ["tag1", "tag2"],
  "body": "full markdown article"
}`;

  return generateJson(prompt);
}

module.exports = { generateArticle };
