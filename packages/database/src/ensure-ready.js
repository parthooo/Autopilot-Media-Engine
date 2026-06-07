/**
 * Neon free tier suspends after inactivity. GitHub Actions often hits a cold start.
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {object} [options]
 * @param {number} [options.maxAttempts=6]
 * @param {number} [options.delayMs=5000]
 */
async function ensureDatabaseReady(prisma, options = {}) {
  const maxAttempts = options.maxAttempts ?? 6;
  const delayMs = options.delayMs ?? 5000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      if (attempt > 1) {
        console.log(`Database ready after ${attempt} attempts`);
      }
      return;
    } catch (error) {
      const message = error.message || String(error);
      const retryable =
        message.includes("Can't reach database server") ||
        message.includes("Connection timed out") ||
        message.includes("ECONNREFUSED") ||
        message.includes("connection terminated") ||
        message.includes("kind: Closed") ||
        message.includes("Connection closed");

      if (!retryable || attempt === maxAttempts) {
        throw error;
      }

      console.warn(
        `Database not ready (attempt ${attempt}/${maxAttempts}). Retrying in ${delayMs / 1000}s…`
      );
      await sleep(delayMs);
    }
  }
}

/**
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { ensureDatabaseReady };
