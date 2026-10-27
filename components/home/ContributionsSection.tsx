import Link from "next/link";
import { PROJECTS } from "@/lib/data/projects";
import { heatmapWeeks, mergeDaily } from "@/lib/contributions";
import { CONTRIBUTIONS, STATS_DAY, TOTALS, repoStats } from "@/lib/site-stats";
import { Window } from "@/components/ui/Window";
import { Reveal } from "@/components/ui/Reveal";
import { Decrypt } from "@/components/ui/Decrypt";
import { CountUp } from "@/components/ui/CountUp";
import { Heatmap } from "@/components/ui/Heatmap";
import { IconPulse } from "@/components/ui/Icons";

const fmtDate = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export function ContributionsSection() {
  const weeks = heatmapWeeks(mergeDaily(CONTRIBUTIONS.repos), STATS_DAY);
  const max = Math.max(...CONTRIBUTIONS.repos.map((r) => r.commits));
  const milestones = PROJECTS.flatMap((p) => p.milestones.map((m) => ({ ...m, project: p }))).sort((a, b) => a.date.localeCompare(b.date));
  const tiles = [
    { label: "Commits", value: TOTALS.commits },
    { label: "Lines added", value: TOTALS.additions },
    { label: "Lines removed", value: TOTALS.deletions },
    { label: "Days building", value: TOTALS.activeDays },
  ];

  return (
    <Reveal>
      <Window id="contributions" title="Contributions" icon={<IconPulse />}>
        <Decrypt as="p" text="The real git history." className="font-display text-3xl font-semibold tracking-[-0.02em] text-fg sm:text-4xl" />
        <p className="mt-3 max-w-2xl text-muted">Counted straight from the six repos (lock files and imported third party templates left out). Updated {fmtDate(STATS_DAY)}.</p>

        <dl className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tiles.map((t) => (
            <div key={t.label} className="rounded-2xl border border-line bg-white/[0.03] p-4">
              <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">{t.label}</dt>
              <dd className="mt-2 font-display text-3xl font-semibold text-cyan">
                <CountUp value={t.value} />
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 rounded-2xl border border-line bg-white/[0.02] p-4 sm:p-5">
          <p className="mb-3 text-sm text-muted">Commits per day, last 12 months</p>
          <Heatmap weeks={weeks} label={`${TOTALS.commits} commits on ${TOTALS.activeDays} days across all projects`} />
          <div className="mt-2 flex items-center justify-end gap-1.5 text-[11px] text-faint" aria-hidden>
            Less
            {[0.05, 0.32, 0.55, 0.8, 1].map((o) => (
              <i key={o} className="h-[10px] w-[10px] rounded-[3px]" style={{ background: o === 0.05 ? "rgb(255 255 255 / 0.05)" : `color-mix(in oklab, #7c8cff ${o * 100}%, transparent)` }} />
            ))}
            More
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Commits per project</p>
            <ul className="flex flex-col gap-3">
              {PROJECTS.map((p) => {
                const r = repoStats(p.slug);
                const n = r?.commits ?? 0;
                return (
                  <li key={p.slug}>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <Link href={`/projects/${p.slug}`} className="text-fg hover:underline">
                        {p.name}
                      </Link>
                      <span className="font-mono text-muted">{n}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                      <div className="bar h-full origin-left rounded-full" style={{ width: `${(n / max) * 100}%`, background: p.accent }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Milestones</p>
            <ol className="relative flex flex-col gap-4 border-l border-line-strong pl-5">
              {milestones.map((m) => (
                <li key={m.date + m.title} className="relative">
                  <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-[#100e1a]" style={{ background: m.project.accent }} aria-hidden />
                  <p className="font-mono text-[11px] text-faint">
                    {fmtDate(m.date)} · {m.project.name}
                  </p>
                  <p className="text-sm text-fg">{m.title}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Window>
    </Reveal>
  );
}
