/**
 * Trigger a GitHub Actions workflow via workflow_dispatch (for Vercel-hosted dashboard).
 * @param {string} workflowFile - e.g. "pipeline.yml"
 * @param {Record<string, string>} [inputs]
 */
export async function dispatchGitHubWorkflow(workflowFile, inputs) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;

  if (!token || !repo) {
    return { dispatched: false, reason: "GITHUB_TOKEN or GITHUB_REPOSITORY not configured" };
  }

  const [owner, name] = repo.split("/");
  const url = `https://api.github.com/repos/${owner}/${name}/actions/workflows/${workflowFile}/dispatches`;

  const payload = { ref: process.env.GITHUB_REF || "main" };
  if (inputs && Object.keys(inputs).length > 0) {
    payload.inputs = inputs;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub dispatch failed: ${response.status} ${text}`);
  }

  return { dispatched: true };
}
