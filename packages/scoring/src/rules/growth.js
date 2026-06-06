/**
 * Growth score from recent metrics (0–100).
 * @param {Array<{ rankPosition: number | null, volumeEstimate: number | null, velocityScore: number | null, capturedAt: Date, source: { slug: string } }>} metrics
 * @returns {number}
 */
function calculateGrowthScore(metrics) {
  if (!metrics.length) return 0;

  const now = Date.now();
  const recent = metrics.filter(
    (m) => now - new Date(m.capturedAt).getTime() < 48 * 60 * 60 * 1000
  );

  if (!recent.length) return 10;

  const sourceCount = new Set(recent.map((m) => m.source.slug)).size;
  const avgVolume =
    recent.reduce((sum, m) => sum + (m.volumeEstimate ?? 0), 0) / recent.length;
  const avgRank =
    recent.reduce((sum, m) => sum + (m.rankPosition ?? 50), 0) / recent.length;
  const rankScore = Math.max(0, 100 - avgRank * 2);
  const volumeScore = Math.min(100, Math.log10(avgVolume + 1) * 20);
  const crossSourceBonus = Math.min(30, (sourceCount - 1) * 15);

  return clamp(rankScore * 0.4 + volumeScore * 0.4 + crossSourceBonus);
}

/**
 * @param {number} value
 * @returns {number}
 */
function clamp(value) {
  return Math.round(Math.min(100, Math.max(0, value)) * 10) / 10;
}

module.exports = { calculateGrowthScore };
