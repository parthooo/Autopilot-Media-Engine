const fs = require("fs");
const path = require("path");

/**
 * @param {object} params
 */
function stockQuery(params) {
  const { broll, heading, onScreen } = params;
  const raw = (broll || onScreen || heading || "technology").trim();

  return raw
    .replace(/\[.*?\]/g, "")
    .replace(/\b(screen capture|showing|highlighting|close-up|montage|b-roll)\b/gi, "")
    .split(/[,.;]/)[0]
    .trim()
    .slice(0, 80) || heading || "technology";
}

/**
 * @param {object} params
 * @param {string} params.query
 * @param {string} params.apiKey
 * @param {string} params.workDir
 * @param {number} params.index
 * @param {number} params.width
 * @param {number} params.height
 * @param {"long" | "short"} params.format
 * @returns {Promise<string | null>}
 */
async function fetchPexelsVideo(params) {
  const { query, apiKey, workDir, index, width, height, format } = params;

  try {
    const orientation = format === "short" ? "portrait" : "landscape";
    const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=5&orientation=${orientation}`;
    const res = await fetch(url, { headers: { Authorization: apiKey } });
    if (!res.ok) return null;

    const data = await res.json();
    const videos = data.videos || [];
    if (!videos.length) return null;

    const pick = videos[index % videos.length] || videos[0];
    if (!pick?.video_files?.length) return null;

    const file =
      pick.video_files.find((f) => f.width >= width * 0.8 && f.height >= height * 0.8) ||
      pick.video_files.sort((a, b) => b.width * b.height - a.width * a.height)[0];

    const clipRes = await fetch(file.link);
    if (!clipRes.ok) return null;

    const clipPath = path.join(workDir, `stock-${String(index).padStart(3, "0")}.mp4`);
    fs.writeFileSync(clipPath, Buffer.from(await clipRes.arrayBuffer()));
    return clipPath;
  } catch {
    return null;
  }
}

/**
 * @param {object} params
 * @returns {Promise<string | null>}
 */
async function fetchPexelsPhoto(params) {
  const { query, apiKey, workDir, index, format } = params;

  try {
    const orientation = format === "short" ? "portrait" : "landscape";
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=${orientation}`;
    const res = await fetch(url, { headers: { Authorization: apiKey } });
    if (!res.ok) return null;

    const data = await res.json();
    const photos = data.photos || [];
    if (!photos.length) return null;

    const pick = photos[index % photos.length] || photos[0];
    const src = pick.src?.large2x || pick.src?.large || pick.src?.original;
    if (!src) return null;

    const photoRes = await fetch(src);
    if (!photoRes.ok) return null;

    const photoPath = path.join(workDir, `photo-${String(index).padStart(3, "0")}.jpg`);
    fs.writeFileSync(photoPath, Buffer.from(await photoRes.arrayBuffer()));
    return photoPath;
  } catch {
    return null;
  }
}

/**
 * @param {object} params
 * @returns {Promise<{ path: string, kind: "video" | "photo" | "slide" }>}
 */
async function fetchStockVisual(params) {
  const { broll, heading, onScreen, workDir, index, width, height, format } = params;
  const apiKey = process.env.PEXELS_API_KEY;
  const query = stockQuery({ broll, heading, onScreen });

  if (apiKey) {
    const video = await fetchPexelsVideo({ query, apiKey, workDir, index, width, height, format });
    if (video) return { path: video, kind: "video", query };

    const photo = await fetchPexelsPhoto({ query, apiKey, workDir, index, format });
    if (photo) return { path: photo, kind: "photo", query };
  }

  return { path: null, kind: "slide", query };
}

module.exports = { stockQuery, fetchStockVisual, fetchPexelsVideo, fetchPexelsPhoto };
