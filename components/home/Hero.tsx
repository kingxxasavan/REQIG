import { PROJECTS } from "@/lib/data/projects";
import { TOTALS } from "@/lib/site-stats";
import { Decrypt } from "@/components/ui/Decrypt";
import { Button } from "@/components/ui/Button";
import { CountUp } from "@/components/ui/CountUp";
import { IconArrow, IconSpark } from "@/components/ui/Icons";

const STATS = [
  { label: "projects shipped", value: PROJECTS.length },
  { label: "commits", value: TOTALS.commits },
  { label: "lines shipped", value: TOTALS.additions },
  { label: "days building", value: TOTALS.activeDays },
];

export function Hero() {
  const names = [...PROJECTS, ...PROJECTS];
  return (
    <header className="relative flex min-h-[86svh] flex-col items-center justify-center px-4 pb-10 pt-16 text-center">
      <p className="rise inline-flex items-center gap-2 rounded-full border border-line-strong bg-white/[0.04] px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
        <span className="live-dot" aria-hidden />
        Software studio · built with Claude Code
      </p>

      <Decrypt
        as="h1"
        text="Cryptic Inc."
        className="mt-7 font-display text-[clamp(3.2rem,11vw,8.5rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-fg"
      />

      <p className="rise mt-6 max-w-xl text-[clamp(1rem,1.6vw,1.2rem)] leading-relaxed text-muted [animation-delay:120ms]">
        We build real software with AI, then show you exactly how. Every project, what is inside it, how we made it, and how to run it yourself.
      </p>

      <div className="rise mt-9 flex flex-wrap justify-center gap-3 [animation-delay:200ms]">
        <Button href="#projects" variant="primary">
          See projects <IconArrow size={16} />
        </Button>
        <Button href="#playbook" variant="glass">
          <IconSpark size={16} /> AI Playbook
        </Button>
      </div>

      <dl className="rise glass-strong mt-14 grid w-full max-w-3xl grid-cols-2 overflow-hidden rounded-[20px] sm:grid-cols-4 [animation-delay:300ms]">
        {STATS.map((s, i) => (
          <div key={s.label} className={`flex flex-col items-center gap-1 px-4 py-5 ${i % 2 ? "border-l border-line" : ""} ${i > 1 ? "border-t border-line sm:border-t-0" : ""} ${i === 2 ? "sm:border-l" : ""}`}>
            <dd className="font-display text-3xl font-semibold text-fg sm:text-4xl">
              <CountUp value={s.value} />
            </dd>
            <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">{s.label}</dt>
          </div>
        ))}
      </dl>

      <div className="marquee mt-14 w-full max-w-5xl overflow-hidden" aria-hidden>
        <div className="marquee-track flex w-max gap-10">
          {names.map((p, i) => (
            <span key={i} className="flex items-center gap-10 whitespace-nowrap font-display text-2xl text-white/25 sm:text-3xl">
              {p.name}
              <span className="text-violet/50">✦</span>
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
