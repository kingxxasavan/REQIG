import Link from "next/link";
import { FUTURE } from "@/lib/data/future";
import { getProject } from "@/lib/data/projects";
import type { FutureStatus } from "@/lib/types";
import { Window } from "@/components/ui/Window";
import { Reveal } from "@/components/ui/Reveal";
import { Decrypt } from "@/components/ui/Decrypt";
import { AppIcon } from "@/components/ui/AppIcon";
import { IconRocket } from "@/components/ui/Icons";

const STATUS: Record<FutureStatus, string> = {
  "Next up": "border-ok/30 bg-ok/10 text-ok",
  Designing: "border-accent/30 bg-accent/10 text-accent",
  Exploring: "border-line-strong bg-white/[0.04] text-muted",
};

export function FutureSection() {
  return (
    <Reveal>
      <Window id="future" title="Future" icon={<IconRocket />}>
        <Decrypt as="p" text="What we're building next." className="font-display text-3xl font-semibold tracking-[-0.02em] text-fg sm:text-4xl" />
        <p className="mt-3 max-w-2xl text-muted">Each idea grows out of something we already shipped.</p>
        <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {FUTURE.map((f, i) => (
            <li key={f.name}>
              <Reveal delay={i * 0.05} className="h-full">
                <div className="flex h-full flex-col rounded-[18px] border border-line bg-white/[0.03] p-5">
                  <span className={`self-start rounded-full border px-2.5 py-1 font-mono text-[11px] ${STATUS[f.status]}`}>{f.status}</span>
                  <h3 className="mt-4 font-display text-xl font-semibold text-fg">{f.name}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{f.pitch}</p>
                  <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-faint">
                    Grows from
                    {f.growsFrom.map((slug) => {
                      const p = getProject(slug)!;
                      return (
                        <Link key={slug} href={`/projects/${slug}`} className="press inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-1 text-muted hover:text-fg">
                          <AppIcon name={p.name} accent={p.accent} size={16} />
                          {p.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </Window>
    </Reveal>
  );
}
