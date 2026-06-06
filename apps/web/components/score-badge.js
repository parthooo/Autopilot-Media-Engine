export function ScoreBadge({ score }) {
  const cls =
    score >= 70 ? "score-high" : score >= 40 ? "score-mid" : "score-low";

  return <span className={`score ${cls}`}>{score.toFixed(1)}</span>;
}
