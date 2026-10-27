// Reads the git history of every project and writes lib/data/contributions.json.
// Only counts are written, never code, so private repos are safe to include.
//
//   node scripts/contributions.mjs cryptic-hub=/path/to/cryptichub epri=.@8bda4a9 ...
//
// Each argument is slug=path, optionally @ref (default HEAD). Clones need full history:
//   git -C <clone> fetch --depth=1000 origin <branch>
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { parseGitLog, summarize } from "../lib/contributions.ts";

const FORMAT = "--pretty=format:@@%H%x09%aI%x09%(trailers:key=Co-Authored-By,valueonly,separator=%x2C)";

const repos = process.argv.slice(2).map((arg) => {
  const [slug, rest] = arg.split("=");
  const [path, ref = "HEAD"] = rest.split("@");
  const raw = execFileSync("git", ["-C", path, "log", "--no-merges", "--numstat", FORMAT, ref], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const stats = summarize(slug, parseGitLog(raw));
  console.log(`${slug.padEnd(12)} ${String(stats.commits).padStart(4)} commits  +${stats.additions} -${stats.deletions}  ${stats.firstCommit} .. ${stats.lastCommit}`);
  return stats;
});

if (repos.length === 0) {
  console.error("usage: contributions.mjs slug=path[@ref] ...");
  process.exit(1);
}

const out = { generatedAt: new Date().toISOString().slice(0, 10), repos };
writeFileSync("lib/data/contributions.json", JSON.stringify(out, null, 2) + "\n");
console.log("wrote lib/data/contributions.json");
