require("./load-root-env");

const { PrismaClient } = require("@prisma/client");

const globalForPrisma = globalThis;

function getDatabaseUrl() {
  const pooled = process.env.DATABASE_URL;
  const direct = process.env.DIRECT_URL;

  // Local dev: direct URL avoids pooler idle drops in long-lived `next dev`
  if (process.env.NODE_ENV !== "production" && direct) {
    return direct;
  }

  return pooled;
}

function createPrismaClient() {
  const url = getDatabaseUrl();
  const log =
    process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

  if (!url) {
    return new PrismaClient({ log });
  }

  return new PrismaClient({
    log,
    datasources: { db: { url } },
  });
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

const { ensureDatabaseReady: connectWithRetry } = require("./ensure-ready");
const { ensureSchemaReady } = require("./ensure-schema");

/** @param {object} [options] */
async function ensureDatabaseReady(options) {
  return connectWithRetry(prisma, options);
}

/** Connection + schema sync before pipeline jobs. */
async function ensurePlatformReady(options) {
  await ensureDatabaseReady(options);
  return ensureSchemaReady(prisma);
}

module.exports = { prisma, ensureDatabaseReady, ensureSchemaReady, ensurePlatformReady };
