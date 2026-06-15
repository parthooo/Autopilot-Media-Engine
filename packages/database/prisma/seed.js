const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const sources = [
  {
    name: "YouTube",
    slug: "youtube",
    isActive: true,
    scrapeIntervalHours: 12,
    config: { region: "US", maxResults: 25 },
  },
  {
    name: "Hacker News",
    slug: "hacker-news",
    isActive: true,
    scrapeIntervalHours: 6,
    config: { limit: 50 },
  },
  {
    name: "Dev.to",
    slug: "dev-to",
    isActive: true,
    scrapeIntervalHours: 6,
    config: {
      perPage: 30,
      topDays: 7,
      tags: ["startup", "ai", "javascript", "webdev"],
    },
  },
  {
    name: "Google Trends",
    slug: "google-trends",
    isActive: true,
    scrapeIntervalHours: 6,
    config: { geo: "US" },
  },
  {
    name: "GitHub Trending",
    slug: "github-trending",
    isActive: true,
    scrapeIntervalHours: 12,
    config: { since: "daily" },
  },
  {
    name: "Product Hunt",
    slug: "product-hunt",
    isActive: true,
    scrapeIntervalHours: 12,
    config: {},
  },
  {
    name: "Reddit",
    slug: "reddit",
    isActive: false,
    scrapeIntervalHours: 6,
    config: {
      subreddits: ["technology", "programming", "entrepreneur", "SideProject"],
      limit: 25,
    },
  },
];

async function main() {
  for (const source of sources) {
    await prisma.source.upsert({
      where: { slug: source.slug },
      update: {
        name: source.name,
        isActive: source.isActive,
        scrapeIntervalHours: source.scrapeIntervalHours,
        config: source.config,
      },
      create: source,
    });
  }

  console.log(`Seeded ${sources.length} sources`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
