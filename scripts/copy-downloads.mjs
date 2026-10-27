// Copies every doc in content/ to public/downloads/<doc slug>.md so the
// Download buttons serve real files. Runs before dev and build.
import { cpSync, mkdirSync, readdirSync, rmSync } from "node:fs";

const OUT = "public/downloads";
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

cpSync("content/playbook.md", `${OUT}/playbook.md`);
for (const [dir, suffix] of [["build", "build"], ["setup", "setup"]]) {
  for (const file of readdirSync(`content/${dir}`)) {
    if (file.endsWith(".md")) cpSync(`content/${dir}/${file}`, `${OUT}/${file.replace(/\.md$/, "")}-${suffix}.md`);
  }
}
console.log(`copied ${readdirSync(OUT).length} docs to ${OUT}`);
