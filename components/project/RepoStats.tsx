import type { Project } from "@/lib/types";
import { heatmapWeeks } from "@/lib/contributions";
import { STATS_DAY, repoStats } from "@/lib/site-stats";
import { CountUp } from "@/components/ui/CountUp";
import { Heatmap } from "@/components/ui/Heatmap";

const fmtDate = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export function RepoStats({ project: p }: { project: Project }) {
  const r = repoStats(p.slug);
  if (!r) return null;
  const tiles = [
    { label: "Commits", value: r.commits },
    { label: "Lines added", value: r.additions },
    { label: "Days building", value: r.activeDays },
    { label: "With Claude Code", value: r.claudeCommits },
  ];
  return (
    <div>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-line bg-white/[0.03] p-4">
            <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">{t.label}</dt>
            <dd className="mt-2 font-display text-2xl font-semibold" style={{ color: p.accent }}>
              <CountUp value={t.value} />
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm text-muted">
        First commit {fmtDate(r.firstCommit)}, latest {fmtDate(r.lastCommit)}.
      </p>
      <div className="mt-4 rounded-2xl border border-line bg-white/[0.02] p-4">
        <Heatmap weeks={heatmapWeeks(r.daily, STATS_DAY)} accent={p.accent} label={`${r.commits} commits on ${r.activeDays} days`} />
      </div>
    </div>
  );
}
