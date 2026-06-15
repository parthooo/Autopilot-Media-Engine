"use client";

const STORAGE_KEY = "ame-pipeline-jobs";

/** @typedef {'running' | 'completed' | 'failed'} JobStatus */

/**
 * @typedef {object} PipelineJob
 * @property {string} id
 * @property {string} step
 * @property {string} label
 * @property {JobStatus} status
 * @property {number} startedAt
 * @property {string} [assetId]
 * @property {string} [href]
 * @property {string} [message]
 */

/** @type {Set<() => void>} */
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn());
}

/**
 * @returns {PipelineJob[]}
 */
export function loadJobs() {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * @param {PipelineJob[]} jobs
 */
function saveJobs(jobs) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

/**
 * @param {Partial<PipelineJob> & Pick<PipelineJob, 'step' | 'label'>} meta
 * @returns {PipelineJob}
 */
export function startJob(meta) {
  const job = {
    id: crypto.randomUUID(),
    status: "running",
    startedAt: Date.now(),
    ...meta,
  };

  const jobs = loadJobs().filter((j) => j.status !== "running");
  jobs.push(job);
  saveJobs(jobs);
  notify();
  return job;
}

/**
 * @param {string} id
 * @param {Partial<PipelineJob>} patch
 */
export function updateJob(id, patch) {
  const jobs = loadJobs();
  const idx = jobs.findIndex((j) => j.id === id);
  if (idx === -1) return;
  jobs[idx] = { ...jobs[idx], ...patch };
  saveJobs(jobs);
  notify();
}

/**
 * @param {string} id
 */
export function removeJob(id) {
  const jobs = loadJobs().filter((j) => j.id !== id);
  saveJobs(jobs);
  notify();
}

/**
 * @param {() => void} fn
 */
export function subscribeJobs(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Run an async pipeline action that survives page navigation.
 * @param {Partial<PipelineJob> & Pick<PipelineJob, 'step' | 'label'>} meta
 * @param {() => Promise<{ message?: string }>} task
 */
export async function runPipelineJob(meta, task) {
  const job = startJob(meta);

  try {
    const result = await task();
    updateJob(job.id, {
      status: "completed",
      message: result?.message || "Completed",
    });
    return result;
  } catch (error) {
    updateJob(job.id, {
      status: "failed",
      message: error instanceof Error ? error.message : "Failed",
    });
    throw error;
  } finally {
    notify();
    window.setTimeout(() => removeJob(job.id), 12000);
  }
}

/**
 * @returns {PipelineJob | null}
 */
export function getRunningJobForAsset(assetId) {
  return (
    loadJobs().find((j) => j.status === "running" && j.assetId === assetId) || null
  );
}

/**
 * @returns {boolean}
 */
export function hasRunningJobs() {
  return loadJobs().some((j) => j.status === "running");
}
