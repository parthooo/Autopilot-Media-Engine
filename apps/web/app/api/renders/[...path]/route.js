import fs from "fs";
import path from "path";
import { getRepoRoot } from "../../../../lib/video-asset";

const RENDERS_ROOT = path.join(getRepoRoot(), "renders");

/**
 * @param {import("next/server").NextRequest} request
 * @param {{ params: Promise<{ path: string[] }> }} context
 */
export async function GET(request, context) {
  const { path: segments } = await context.params;
  if (!segments?.length) {
    return new Response("Not found", { status: 404 });
  }

  const safeSegments = segments.filter((s) => s && s !== ".." && s !== ".");
  const filePath = path.join(RENDERS_ROOT, ...safeSegments);

  if (!filePath.startsWith(RENDERS_ROOT)) {
    return new Response("Forbidden", { status: 403 });
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return new Response("Not found", { status: 404 });
  }

  if (!filePath.endsWith(".mp4") && !filePath.endsWith(".jpg") && !filePath.endsWith(".jpeg")) {
    return new Response("Forbidden", { status: 403 });
  }

  const data = fs.readFileSync(filePath);
  const contentType = filePath.endsWith(".mp4")
    ? "video/mp4"
    : "image/jpeg";

  return new Response(data, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(data.length),
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
