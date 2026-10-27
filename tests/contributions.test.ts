import { test, expect } from "vitest";
import { parseGitLog, summarize, totals, heatmapWeeks } from "@/lib/contributions";

const RAW = [
  "@@a1\t2026-10-26T23:30:00-04:00\tClaude Opus <noreply@anthropic.com>",
  "3\t1\tapp/page.tsx",
  "-\t-\tlogo.png",
  "",
  "@@b2\t2026-10-20T08:00:00+00:00\t",
  "10\t0\tREADME.md",
].join("\n");

test("parses commits with the author's local day, lines and the claude flag", () => {
  expect(parseGitLog(RAW)).toEqual([
    { date: "2026-10-26", additions: 3, deletions: 1, claude: true },
    { date: "2026-10-20", additions: 10, deletions: 0, claude: false },
  ]);
});

test("claude trailer match is case insensitive", () => {
  expect(parseGitLog("@@c3\t2026-10-01T10:00:00+00:00\tclaude sonnet <x@y>")[0].claude).toBe(true);
});

test("empty log", () => {
  expect(parseGitLog("")).toEqual([]);
});

test("summarize one repo", () => {
  const s = summarize("polyos", parseGitLog(RAW));
  expect(s).toMatchObject({
    slug: "polyos",
    commits: 2,
    additions: 13,
    deletions: 1,
    firstCommit: "2026-10-20",
    lastCommit: "2026-10-26",
    activeDays: 2,
    claudeCommits: 1,
  });
  expect(s.daily["2026-10-26"]).toBe(1);
});

test("totals count shared days once", () => {
  const a = summarize("polyos", parseGitLog(RAW));
  const b = summarize("epri", parseGitLog(RAW));
  const t = totals([a, b]);
  expect(t.activeDays).toBe(2);
  expect(t.commits).toBe(4);
  expect(t.additions).toBe(26);
  expect(t.claudeCommits).toBe(2);
});

test("heatmap is 53 weeks, Sunday first, ending today", () => {
  const w = heatmapWeeks({ "2026-10-27": 4 }, "2026-10-27");
  expect(w).toHaveLength(53);
  expect(w[0]).toHaveLength(7);
  expect(new Date(w[0][0].date + "T00:00:00Z").getUTCDay()).toBe(0);
  expect(w.at(-1)!.at(-1)).toEqual({ date: "2026-10-27", count: 4 });
});

test("heatmap leaves out days after today", () => {
  // 2026-10-27 is a Tuesday, so the last column holds Sunday to Tuesday only
  const w = heatmapWeeks({}, "2026-10-27");
  expect(w.at(-1)!.map((d) => d.date)).toEqual(["2026-10-25", "2026-10-26", "2026-10-27"]);
});

test("lock files, minified files and imported third party templates don't count as lines", () => {
  const raw = [
    "@@d4\t2026-10-02T10:00:00+00:00\t",
    "5\t0\tapp/page.tsx",
    "9000\t10\tpackage-lock.json",
    "300\t0\tweb/package-lock.json",
    "800\t0\tpublic/vendor/jquery.min.js",
    "20000\t0\ttemplates/html5up-story/assets/main.css",
    "12000\t0\ttemplates/bootstrap-personal/index.html",
    "40\t0\ttemplates/helix-ai/page.tsx",
  ].join("\n");
  expect(parseGitLog(raw)).toEqual([{ date: "2026-10-02", additions: 45, deletions: 0, claude: false }]);
});
