import { test, expect } from "vitest";
import { readFileSync, globSync } from "node:fs";

const BUILD = ["What it is", "Timeline", "What Claude Code did", "What we did by hand", "Bugs we hit", "Lessons"];
const PLAY = ["The flow", "Guiding Claude Code", "What you have to do yourself", "Testing, errors and bugs", "Examples from our projects"];
const h2 = (md: string) => [...md.matchAll(/^## (.+)$/gm)].map((m) => m[1]);

test("playbook sections", () => {
  expect(h2(readFileSync("content/playbook.md", "utf8"))).toEqual(PLAY);
});

test.each(["cryptic-hub", "jarvis", "polyos", "foundry", "epri", "marketplace"])("%s build story sections", (s) => {
  expect(h2(readFileSync(`content/build/${s}.md`, "utf8"))).toEqual(BUILD);
});

test("no em dashes, no session links, no keys", () => {
  for (const f of globSync("content/{playbook,build/*}.md")) {
    const t = readFileSync(f, "utf8");
    expect(t, f).not.toContain("—");
    expect(t, f).not.toMatch(/claude\.ai\/code\/session/);
    expect(t, f).not.toMatch(/AIza[0-9A-Za-z_-]{20,}|sk-[A-Za-z0-9]{20,}|nvapi-[A-Za-z0-9_-]{20,}/);
  }
});
