import { test, expect } from "vitest";
import { existsSync } from "node:fs";
import { DOCS, getDoc, docsForProject } from "@/lib/data/docs";

test("11 docs, every file exists", () => {
  expect(DOCS).toHaveLength(11);
  for (const d of DOCS) expect(existsSync(`content/${d.file}`), d.file).toBe(true);
});

test("setup guides only for public repos", () => {
  expect(DOCS.filter((d) => d.group === "setup").map((d) => d.project).sort()).toEqual(["epri", "foundry", "marketplace", "polyos"]);
  expect(getDoc("jarvis-setup")).toBeUndefined();
  expect(getDoc("cryptic-hub-setup")).toBeUndefined();
});

test("titles follow the naming rule", () => {
  expect(getDoc("polyos-setup")!.title).toBe("PolyOS 7 for Debian setup");
  expect(getDoc("jarvis-build")!.title).toBe("How we built JARVIS");
  expect(getDoc("playbook")!.title).toBe("The Claude Code playbook");
});

test("setup docs link to the exact code they were snapshotted from, build docs don't", () => {
  expect(getDoc("polyos-setup")!.github).toBe("https://github.com/kingxxasavan/poly-os-7-debain-receration/tree/main");
  expect(getDoc("epri-setup")!.github).toBe("https://github.com/kingxxasavan/REQIG/tree/8bda4a9");
  expect(getDoc("foundry-setup")!.github).toBe("https://github.com/kingxxasavan/Web---templates/tree/main");
  expect(getDoc("marketplace-setup")!.github).toBe("https://github.com/kingxxasavan/Cryptic/tree/claude/intelligent-bohr-y60wy8");
  expect(getDoc("jarvis-build")!.github).toBeUndefined();
});

test("docs for a project", () => {
  expect(docsForProject("polyos").map((d) => d.slug)).toEqual(["polyos-build", "polyos-setup"]);
  expect(docsForProject("jarvis").map((d) => d.slug)).toEqual(["jarvis-build"]);
});
