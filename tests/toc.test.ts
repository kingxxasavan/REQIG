import { test, expect } from "vitest";
import { extractToc } from "@/lib/toc";

test("h2 and h3, slugged like rehype-slug, duplicates numbered, code fences skipped", () => {
  expect(extractToc("# Title\n## Install `it`\n### Step\n```\n## not\n```\n## Step\n## Step")).toEqual([
    { depth: 2, text: "Install it", id: "install-it" },
    { depth: 3, text: "Step", id: "step" },
    { depth: 2, text: "Step", id: "step-1" },
    { depth: 2, text: "Step", id: "step-2" },
  ]);
});

test("links and emphasis are stripped from heading text", () => {
  expect(extractToc("## Read the [docs](https://x.dev) **now**")).toEqual([
    { depth: 2, text: "Read the docs now", id: "read-the-docs-now" },
  ]);
});

test("the h1 counts toward duplicate ids", () => {
  // rehype-slug numbers every heading, so an h2 that repeats the h1 gets -1
  expect(extractToc("# Setup\n## Setup")[0].id).toBe("setup-1");
});
