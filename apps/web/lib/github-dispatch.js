/**
 * Trigger a GitHub Actions workflow via workflow_dispatch (for Vercel-hosted dashboard).
 * @param {string} workflowFile - e.g. "pipeline.yml"
 */
export async function dispatchGitHubWorkflow(workflowFile) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;

  if (!token || !repo) {
    return { dispatched: false, reason: "GITHUB_TOKEN or GITHUB_REPOSITORY not configured" };
  }

  const [owner, name] = repo.split("/");
  const url = `https://api.github.com/repos/${owner}/${name}/actions/workflows/${workflowFile}/dispatches`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ref: process.env.GITHUB_REF || "main" }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub dispatch failed: ${response.status} ${text}`);
  }

  return { dispatched: true };
}
