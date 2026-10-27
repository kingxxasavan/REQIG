// Pure aggregation of git history. scripts/contributions.mjs feeds it real `git log`
// output and writes lib/data/contributions.json; the site only reads that JSON.
// Only `import type` here: the script loads this file directly with Node's type stripping.
import type { ProjectSlug } from "./types";

export type Commit = { date: string; additions: number; deletions: number; claude: boolean };

export type RepoStats = {
  slug: ProjectSlug;
  commits: number;
  additions: number;
  deletions: number;
  firstCommit: string;
  lastCommit: string;
  activeDays: number;
  claudeCommits: number;
  daily: Record<string, number>;
};

export type Contributions = { generatedAt: string; repos: RepoStats[] };

// Lines in these files aren't our writing: lock files, minified bundles, and the
// open source html5up / Bootstrap templates Foundry imported. Their commits still count.
const NOT_OUR_LINES = /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$|\.min\.(js|css)$|(^|\/)templates\/(html5up|bootstrap)-/;

// Expects: git log --no-merges --numstat
//   --pretty=format:@@%H%x09%aI%x09%(trailers:key=Co-Authored-By,valueonly,separator=%x2C)
export function parseGitLog(raw: string): Commit[] {
  const commits: Commit[] = [];
  let current: Commit | null = null;
  for (const line of raw.split("\n")) {
    if (line.startsWith("@@")) {
      const [, iso = "", trailers = ""] = line.slice(2).split("\t");
      // first 10 chars of %aI is the day where the author was, not the UTC day
      current = { date: iso.slice(0, 10), additions: 0, deletions: 0, claude: /claude/i.test(trailers) };
      commits.push(current);
      continue;
    }
    const m = /^(\d+|-)\t(\d+|-)\t(.*)$/.exec(line);
    if (m && current && !NOT_OUR_LINES.test(m[3])) {
      // binary files show "-" for both counts
      current.additions += m[1] === "-" ? 0 : Number(m[1]);
      current.deletions += m[2] === "-" ? 0 : Number(m[2]);
    }
  }
  return commits;
}

export function summarize(slug: ProjectSlug, commits: Commit[]): RepoStats {
  const daily: Record<string, number> = {};
  let additions = 0;
  let deletions = 0;
  let claudeCommits = 0;
  for (const c of commits) {
    daily[c.date] = (daily[c.date] ?? 0) + 1;
    additions += c.additions;
    deletions += c.deletions;
    if (c.claude) claudeCommits++;
  }
  const days = Object.keys(daily).sort();
  return {
    slug,
    commits: commits.length,
    additions,
    deletions,
    firstCommit: days[0] ?? "",
    lastCommit: days.at(-1) ?? "",
    activeDays: days.length,
    claudeCommits,
    daily: Object.fromEntries(days.map((d) => [d, daily[d]])),
  };
}

export function totals(repos: RepoStats[]) {
  const days = new Set<string>();
  let commits = 0;
  let additions = 0;
  let deletions = 0;
  let claudeCommits = 0;
  for (const r of repos) {
    commits += r.commits;
    additions += r.additions;
    deletions += r.deletions;
    claudeCommits += r.claudeCommits;
    for (const d of Object.keys(r.daily)) days.add(d);
  }
  return { commits, additions, deletions, activeDays: days.size, claudeCommits };
}

const DAY = 86_400_000;
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

// 53 columns of Sunday to Saturday, the last column holding `today` (later days left out).
export function heatmapWeeks(daily: Record<string, number>, today: string): { date: string; count: number }[][] {
  const end = Date.parse(today + "T00:00:00Z");
  const lastSunday = end - new Date(end).getUTCDay() * DAY;
  const start = lastSunday - 52 * 7 * DAY;
  const weeks: { date: string; count: number }[][] = [];
  for (let w = 0; w < 53; w++) {
    const week: { date: string; count: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const t = start + (w * 7 + d) * DAY;
      if (t > end) break;
      const date = iso(t);
      week.push({ date, count: daily[date] ?? 0 });
    }
    weeks.push(week);
  }
  return weeks;
}

// Every repo's commits per day added together, for the all-projects heatmap.
export function mergeDaily(repos: RepoStats[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of repos) for (const [day, n] of Object.entries(r.daily)) out[day] = (out[day] ?? 0) + n;
  return Object.fromEntries(Object.keys(out).sort().map((d) => [d, out[d]]));
}
