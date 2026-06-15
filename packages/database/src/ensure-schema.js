const { execFile } = require("child_process");
const { promisify } = require("util");
const path = require("path");

const execFileAsync = promisify(execFile);

/**
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {string} tableName
 */
async function tableExists(prisma, tableName) {
  const rows = await prisma.$queryRaw`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ${tableName}
    ) AS "exists"
  `;
  return rows[0]?.exists === true;
}

/**
 * Apply schema drift (e.g. new video_assets table) without manual db:push.
 * @param {import('@prisma/client').PrismaClient} prisma
 */
async function ensureSchemaReady(prisma) {
  const videoAssetsExists = await tableExists(prisma, "video_assets");
  if (videoAssetsExists) {
    return { synced: false };
  }

  const repoRoot = path.resolve(__dirname, "../../..");
  console.warn("Database schema behind code (missing video_assets) — running db:push…");

  await execFileAsync("npm", ["run", "db:push"], {
    cwd: repoRoot,
    env: process.env,
    maxBuffer: 10 * 1024 * 1024,
  });

  return { synced: true, tables: ["video_assets"] };
}

module.exports = { ensureSchemaReady, tableExists };
