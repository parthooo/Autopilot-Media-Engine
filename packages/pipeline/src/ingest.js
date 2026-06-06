const { prisma } = require("@ame/database");
const { normalizeTopic } = require("@ame/core");
const { getAdapter } = require("@ame/ingest");

async function ingestSource(sourceSlug) {
  const source = await prisma.source.findUnique({ where: { slug: sourceSlug } });
  if (!source) throw new Error(`Source not found: ${sourceSlug}`);

  const adapter = getAdapter(sourceSlug);
  if (!adapter) throw new Error(`No adapter registered for: ${sourceSlug}`);

  const run = await prisma.ingestionRun.create({
    data: { sourceId: source.id, status: "running", startedAt: new Date() },
  });

  try {
    const signals = await adapter.fetch(source.config);
    let recordsNew = 0;

    for (const signal of signals) {
      const existing = await prisma.rawSignal.findUnique({
        where: {
          sourceId_externalId: { sourceId: source.id, externalId: signal.externalId },
        },
      });
      if (existing) continue;

      const { normalizedKey, slug, keywords, category } = normalizeTopic(signal.title);
      const now = new Date();

      let topic = await prisma.topic.findUnique({ where: { normalizedKey } });

      if (topic) {
        topic = await prisma.topic.update({
          where: { id: topic.id },
          data: {
            lastSeenAt: now,
            signalCount: { increment: 1 },
            title: signal.title.length > topic.title.length ? signal.title : topic.title,
            category: topic.category || category,
            keywords: mergeKeywords(topic.keywords, keywords),
          },
        });
      } else {
        topic = await prisma.topic.create({
          data: {
            slug: await uniqueSlug(slug),
            title: signal.title,
            normalizedKey,
            category,
            keywords,
            firstSeenAt: signal.discoveredAt,
            lastSeenAt: now,
          },
        });
      }

      await prisma.rawSignal.create({
        data: {
          sourceId: source.id,
          externalId: signal.externalId,
          title: signal.title,
          url: signal.url,
          description: signal.description,
          rawPayload: signal.rawPayload,
          discoveredAt: signal.discoveredAt,
          topicId: topic.id,
        },
      });

      await prisma.topicMetric.create({
        data: {
          topicId: topic.id,
          sourceId: source.id,
          rankPosition: signal.rankPosition ?? null,
          volumeEstimate: signal.volumeEstimate ?? null,
          velocityScore: null,
          engagementScore: signal.engagementScore ?? null,
          capturedAt: now,
        },
      });

      recordsNew += 1;
    }

    await prisma.ingestionRun.update({
      where: { id: run.id },
      data: {
        status: "success",
        recordsFetched: signals.length,
        recordsNew,
        completedAt: new Date(),
      },
    });

    return { recordsFetched: signals.length, recordsNew };
  } catch (error) {
    await prisma.ingestionRun.update({
      where: { id: run.id },
      data: { status: "failed", errorMessage: error.message, completedAt: new Date() },
    });
    throw error;
  }
}

async function ingestAll() {
  const sources = await prisma.source.findMany({ where: { isActive: true } });
  const results = [];

  for (const source of sources) {
    try {
      const result = await ingestSource(source.slug);
      results.push({ slug: source.slug, success: true, ...result });
    } catch (error) {
      results.push({ slug: source.slug, success: false, error: error.message });
    }
  }

  return results;
}

async function uniqueSlug(baseSlug) {
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.topic.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
  return slug;
}

function mergeKeywords(existing, incoming) {
  return [...new Set([...existing, ...incoming])].slice(0, 20);
}

module.exports = { ingestSource, ingestAll };
