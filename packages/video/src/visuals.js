const { createSlideImage } = require("./ffmpeg");
const { fetchStockVisual } = require("./pexels");
const path = require("path");

/**
 * @param {object} params
 * @returns {Promise<{ path: string, kind: "video" | "photo" | "slide", query: string }>}
 */
async function resolveVisual(params) {
  const { workDir, index, heading, broll, onScreen, width, height, format } = params;

  const stock = await fetchStockVisual({
    broll,
    heading,
    onScreen,
    workDir,
    index,
    width,
    height,
    format,
  });

  if (stock.path) {
    return stock;
  }

  const slidePath = path.join(workDir, `slide-${String(index).padStart(3, "0")}.png`);
  await createSlideImage({
    outputPath: slidePath,
    width,
    height,
    heading,
    subtitle: onScreen || broll || "",
    format,
  });

  return { path: slidePath, kind: "slide", query: stock.query };
}

module.exports = { resolveVisual };
