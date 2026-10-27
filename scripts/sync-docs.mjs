// Snapshots each public repo's README into content/setup/<slug>.md, with relative
// links sent to GitHub so they still work on this site.
//
//   node scripts/sync-docs.mjs polyos=/path/to/clone foundry=/path@main epri=.@8bda4a9 ...
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { rewriteRelativeLinks } from "../lib/markdown-links.ts";

// slug -> GitHub repo, matching lib/data/projects.ts
const REPOS = {
  polyos: "kingxxasavan/poly-os-7-debain-receration",
  foundry: "kingxxasavan/Web---templates",
  epri: "kingxxasavan/REQIG",
  marketplace: "kingxxasavan/Cryptic",
};

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("usage: sync-docs.mjs slug=path[@ref] ...");
  process.exit(1);
}

mkdirSync("content/setup", { recursive: true });
for (const arg of args) {
  const [slug, rest] = arg.split("=");
  const [path, ref] = rest.split("@");
  const repo = REPOS[slug];
  if (!repo) throw new Error(`no public repo known for ${slug}`);
  const at = ref ?? execFileSync("git", ["-C", path, "rev-parse", "--abbrev-ref", "HEAD"], { encoding: "utf8" }).trim();
  const readme = execFileSync("git", ["-C", path, "show", `${at}:README.md`], { encoding: "utf8" });
  const note = `> Snapshot of the README in [${repo}](https://github.com/${repo}/tree/${at}) (${at}).\n\n`;
  writeFileSync(`content/setup/${slug}.md`, note + rewriteRelativeLinks(readme, { repo, ref: at }));
  console.log(`content/setup/${slug}.md  (${repo}@${at})`);
}
