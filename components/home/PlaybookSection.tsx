import Link from "next/link";
import { PROJECTS } from "@/lib/data/projects";
import { TOTALS } from "@/lib/site-stats";
import { Window } from "@/components/ui/Window";
import { Reveal } from "@/components/ui/Reveal";
import { Decrypt } from "@/components/ui/Decrypt";
import { Button } from "@/components/ui/Button";
import { IconArrow, IconDoc, IconSpark } from "@/components/ui/Icons";

// One line per section of content/playbook.md, in the same order.
const STEPS = [
  { title: "The flow", body: "Idea, brainstorm, spec, plan, build, test, ship. Every project runs through the same steps." },
  { title: "Guiding Claude Code", body: "Say your constraints, show screenshots, ask for the plan before the code, and make it prove things with tests." },
  { title: "What you have to do yourself", body: "Firebase or Supabase projects, sign in providers, authorized domains, API keys, Vercel variables and DNS." },
  { title: "Testing, errors and bugs", body: "Use it on the real device, copy the exact error, ask for the root cause, then lock the fix in with a test." },
  { title: "Examples from our projects", body: "Real bugs from our repos, and how each one got found and fixed." },
];

export function PlaybookSection() {
  const pct = Math.round((TOTALS.claudeCommits / TOTALS.commits) * 100);
  return (
    <Reveal>
      <Window id="playbook" title="Built with AI" icon={<IconSpark />}>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div>
            <Decrypt as="p" text="How we build with Claude Code." className="font-display text-3xl font-semibold tracking-[-0.02em] text-fg sm:text-4xl" />
            <p className="mt-4 leading-relaxed text-muted">
              Not a prompt and a prayer. A repeatable process: plan with the AI, build in small tested steps, and do the account and testing work it can&apos;t do for you. Here is exactly how.
            </p>
            <div className="mt-8 rounded-2xl border border-line bg-white/[0.03] p-5">
              <p className="font-display text-5xl font-semibold text-signature">{pct}%</p>
              <p className="mt-2 text-sm text-muted">
                of our {TOTALS.commits.toLocaleString("en-US")} commits were written together with Claude Code ({TOTALS.claudeCommits.toLocaleString("en-US")} commits).
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button href="/docs/playbook" variant="primary">
                Read the playbook <IconArrow size={16} />
              </Button>
              <Button href="/docs">
                <IconDoc size={16} /> Build stories
              </Button>
            </div>
          </div>

          <div>
            <ol className="relative flex flex-col gap-3 before:absolute before:bottom-4 before:left-[19px] before:top-4 before:w-px before:bg-line-strong">
              {STEPS.map((s, i) => (
                <li key={s.title} className="relative flex gap-4">
                  <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line-strong bg-[#14111f] font-mono text-sm text-accent">
                    {i + 1}
                  </span>
                  <div className="pb-2 pt-1.5">
                    <p className="font-medium text-fg">{s.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">How we built</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {PROJECTS.map((p) => (
                <li key={p.slug}>
                  <Link href={`/docs/${p.slug}-build`} className="press inline-flex rounded-full border border-line px-3 py-1.5 text-sm text-muted hover:border-line-strong hover:text-fg">
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Window>
    </Reveal>
  );
}
