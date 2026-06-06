#!/usr/bin/env node

const path = require("path");
const fs = require("fs");

const envPath = path.resolve(__dirname, "../../../.env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const {
  ingestSource,
  ingestAll,
  scoreOpportunities,
  autoSelectWinner,
  generateContent,
  runFullPipeline,
} = require("@ame/pipeline");
const { prisma, ensureDatabaseReady } = require("@ame/database");

const [command, ...args] = process.argv.slice(2);

function getFlag(name) {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split("=").slice(1).join("=") : null;
}

async function main() {
  if (command && command !== "help") {
    await ensureDatabaseReady();
  }

  switch (command) {
    case "ingest": {
      const source = getFlag("source");
      if (!source) {
        console.error("Usage: npm run worker -- ingest --source=hacker-news");
        process.exit(1);
      }
      const result = await ingestSource(source);
      console.log(`Ingested ${result.recordsNew} new signals (${result.recordsFetched} fetched)`);
      break;
    }

    case "ingest-all": {
      const results = await ingestAll();
      const failed = results.filter((r) => !r.success);
      results.forEach((r) => {
        if (r.success) {
          console.log(`✓ ${r.slug}: ${r.recordsNew} new / ${r.recordsFetched} fetched`);
        } else {
          console.error(`✗ ${r.slug}: ${r.error}`);
        }
      });
      if (failed.length) process.exit(1);
      break;
    }

    case "score": {
      const result = await scoreOpportunities();
      console.log(`Scored ${result.scored} opportunities`);
      break;
    }

    case "auto-select": {
      const result = await autoSelectWinner();
      console.log(JSON.stringify(result, null, 2));
      if (!result.success) process.exit(1);
      break;
    }

    case "generate-content": {
      const exportMd = args.includes("--export");
      const result = await generateContent({ autoApprove: true, exportMarkdown: exportMd });
      console.log(JSON.stringify(result, null, 2));
      if (!result.success) process.exit(1);
      break;
    }

    case "pipeline": {
      const result = await runFullPipeline();
      console.log(JSON.stringify(result, null, 2));
      if (result.select && !result.select.success) process.exit(1);
      break;
    }

    default:
      console.log(`
Autopilot Media Engine — Worker

Commands:
  ingest --source=<slug>   Ingest one source
  ingest-all               Ingest all active sources
  score                    Calculate opportunity scores
  auto-select              AI picks ONE winner and auto-approves
  generate-content         Generate 5 SEO articles for approved winner
  generate-content --export  Also write Markdown files to content/
  pipeline                 Full automation: ingest → score → select → generate
`);
      process.exit(command ? 1 : 0);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
