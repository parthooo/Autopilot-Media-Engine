import fs from "fs";
import path from "path";

/**
 * @param {string} [startDir]
 */
export function getRepoRoot(startDir = process.cwd()) {
  let dir = startDir;
  for (let i = 0; i < 6; i++) {
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        if (Array.isArray(pkg.workspaces)) return dir;
      } catch {
        // continue
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return startDir;
}

/**
 * @param {object} videoAsset
 * @returns {string | null}
 */
export function videoPlaybackUrl(videoAsset) {
  if (!videoAsset || videoAsset.status !== "completed" || !videoAsset.filePath) {
    return null;
  }

  const root = getRepoRoot();
  const relative = path.relative(root, videoAsset.filePath);
  let urlPath = null;

  if (relative.startsWith(`renders${path.sep}`)) {
    urlPath = `/api/renders/${relative.slice(`renders${path.sep}`.length).split(path.sep).join("/")}`;
  } else {
    const metaPath = videoAsset.metadata?.relativePath;
    if (typeof metaPath === "string" && metaPath.startsWith("renders/")) {
      urlPath = `/api/renders/${metaPath.slice("renders/".length)}`;
    }
  }

  if (!urlPath) return null;

  const version = videoAsset.renderedAt
    ? new Date(videoAsset.renderedAt).getTime()
    : videoAsset.updatedAt
      ? new Date(videoAsset.updatedAt).getTime()
      : 0;

  return version ? `${urlPath}?v=${version}` : urlPath;
}

/**
 * @param {object} videoAsset
 * @returns {{ relative: string, absolute: string } | null}
 */
export function getVideoFileInfo(videoAsset) {
  if (!videoAsset?.filePath) return null;

  const root = getRepoRoot();
  const relative =
    videoAsset.metadata?.relativePath ||
    path.relative(root, videoAsset.filePath).split(path.sep).join("/");

  const absolute = path.isAbsolute(videoAsset.filePath)
    ? videoAsset.filePath
    : path.join(root, relative);

  return { relative, absolute };
}

/**
 * @param {object} videoAsset
 * @returns {string}
 */
export function renderStatusLabel(videoAsset) {
  if (!videoAsset) return "No video";
  if (videoAsset.status === "completed") return "MP4 ready";
  if (videoAsset.status === "failed") return "Failed";
  if (videoAsset.status === "rendering") return "Rendering…";
  return "Not rendered";
}

/**
 * @param {number | null | undefined} seconds
 */
export function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}
