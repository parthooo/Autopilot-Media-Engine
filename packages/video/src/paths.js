const fs = require("fs");
const path = require("path");

/**
 * Resolve monorepo root (directory with npm workspaces).
 * @param {string} [startDir]
 */
function getRepoRoot(startDir = process.cwd()) {
  let dir = startDir;
  for (let i = 0; i < 6; i++) {
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        if (Array.isArray(pkg.workspaces)) return dir;
      } catch {
        // continue walking up
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return startDir;
}

/**
 * @param {string} opportunityId
 */
function rendersDir(opportunityId) {
  return path.join(getRepoRoot(), "renders", opportunityId);
}

module.exports = { getRepoRoot, rendersDir };
