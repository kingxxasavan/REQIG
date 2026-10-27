import { test, expect } from "vitest";
import { readFileSync } from "node:fs";
import { firstParagraph } from "@/lib/markdown-section";

const MD = "# Title\n\nIntro line.\n\n## What it is\n\nFirst **bold** paragraph\nwraps here with a [link](https://x.dev).\n\nSecond paragraph.\n\n## Timeline\n\n* item";

test("first paragraph under a heading, as plain text on one line", () => {
  expect(firstParagraph(MD, "What it is")).toBe("First bold paragraph wraps here with a link.");
});

test("missing heading gives undefined", () => {
  expect(firstParagraph(MD, "Nope")).toBeUndefined();
});

test("works on every real build story", () => {
  for (const s of ["cryptic-hub", "jarvis", "polyos", "foundry", "epri", "marketplace"]) {
    const p = firstParagraph(readFileSync(`content/build/${s}.md`, "utf8"), "What it is");
    expect(p && p.length, s).toBeGreaterThan(40);
  }
});
