const path = require("path");
const { loadEnvConfig } = require("@next/env");

// Load .env from monorepo root (not just apps/web)
loadEnvConfig(path.resolve(__dirname, "../.."));

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@ame/database",
    "@ame/pipeline",
    "@ame/ai",
    "@ame/ingest",
    "@ame/scoring",
    "@ame/core",
  ],
};

module.exports = nextConfig;
