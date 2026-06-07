const ASSET_TYPE_LABELS = {
  article: "Article",
  youtube_script: "YouTube",
  shorts_script: "Short",
  social_post: "Social",
  newsletter: "Newsletter",
};

/**
 * @param {string} assetType
 */
export function assetTypeLabel(assetType) {
  return ASSET_TYPE_LABELS[assetType] || assetType;
}

/**
 * @param {{ assetType: string, metadata?: object }} asset
 */
export function assetDurationLabel(asset) {
  if (asset.assetType === "shorts_script") {
    const seconds = asset.metadata?.durationSeconds;
    return seconds ? `${seconds}s` : "—";
  }
  if (asset.assetType === "youtube_script") {
    const minutes = asset.metadata?.durationMinutes;
    return minutes ? `${minutes} min` : "—";
  }
  const words = asset.metadata?.wordCount;
  return words ? `${words.toLocaleString()} words` : "—";
}
