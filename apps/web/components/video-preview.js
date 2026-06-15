"use client";

/**
 * @param {object} props
 * @param {string} props.src
 * @param {string} [props.versionKey]
 * @param {"short" | "long"} [props.format]
 */
export function VideoPreview({ src, versionKey = "0", format = "long" }) {
  if (!src) return null;

  const frameClass =
    format === "short" ? "video-preview-frame--short" : "video-preview-frame--long";

  return (
    <div className={`video-preview-frame ${frameClass}`}>
      <video
        key={`${src}-${versionKey}`}
        controls
        playsInline
        preload="metadata"
        className="rendered-video"
      >
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
}
