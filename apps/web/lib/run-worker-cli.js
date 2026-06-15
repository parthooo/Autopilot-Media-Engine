import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { getRepoRoot } from "./video-asset";

const execFileAsync = promisify(execFile);

/**
 * Run a worker CLI command in a fresh Node process (fresh Prisma client + schema sync).
 * @param {string} command
 * @param {string[]} [args]
 */
export async function runWorkerCommand(command, args = []) {
  const repoRoot = getRepoRoot();
  const workerPath = path.join(repoRoot, "apps/worker/src/index.js");

  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, [workerPath, command, ...args], {
      cwd: repoRoot,
      env: process.env,
      maxBuffer: 50 * 1024 * 1024,
    });
    return parseWorkerJson(stdout, stderr);
  } catch (error) {
    if (error.stdout) {
      return parseWorkerJson(error.stdout, error.stderr || "");
    }
    throw error;
  }
}

/**
 * @param {string} stdout
 * @param {string} stderr
 */
function parseWorkerJson(stdout, stderr) {
  const trimmed = stdout.trim();
  if (!trimmed) {
    throw new Error(stderr.trim() || "Worker produced no output");
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const jsonStart = trimmed.lastIndexOf("{");
    const jsonEnd = trimmed.lastIndexOf("}");
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      return JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1));
    }
    throw new Error(stderr.trim() || trimmed.slice(0, 500));
  }
}

/**
 * @param {object} body
 * @returns {string[]}
 */
export function renderWorkerArgs(body) {
  const args = [];
  const variant = body.variant || "all";
  if (variant === "youtube-only") args.push("--youtube-only");
  if (variant === "shorts-only") args.push("--shorts-only");
  if (body.force === true || body.force === "true") args.push("--force");
  if (body.assetId) args.push(`--asset=${body.assetId}`);
  return args;
}

/**
 * @param {object} result
 */
export function formatWorkerError(result) {
  if (result.message) return result.message;
  const first = result.errors?.[0];
  if (!first) return "Worker failed";
  const raw = first.error || first.title || "Render failed";
  if (raw.includes("No such filter")) {
    return `Render failed for "${first.title}": slide text broke FFmpeg (retry after update)`;
  }
  if (raw.includes("Command failed: ffmpeg")) {
    const line =
      raw.split("\n").find((l) => /Error|filter not found/i.test(l)) || raw;
    return `Render failed for "${first.title}": ${line.slice(0, 200)}`;
  }
  return `Render failed for "${first.title}": ${raw.slice(0, 300)}`;
}
