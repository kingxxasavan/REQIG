import Link from "next/link";
import type { Project } from "@/lib/types";
import { AppIcon } from "@/components/ui/AppIcon";
import { BrowserFrame } from "@/components/ui/BrowserFrame";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Decrypt } from "@/components/ui/Decrypt";
import { IconChevron, IconExternal, IconGithub } from "@/components/ui/Icons";
import { Shot } from "@/components/ui/Shot";
import { frameUrl } from "@/lib/frame-url";

export function ProjectHeader({ project: p }: { project: Project }) {
  return (
    <header className="relative pt-8">
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-[520px] w-[min(1100px,100vw)] -translate-x-1/2 rounded-full"
        style={{ background: `radial-gradient(closest-side, color-mix(in oklab, ${p.accent} 30%, transparent), transparent)` }}
        aria-hidden
      />
      <Link href="/#projects" className="press inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm text-muted hover:text-fg">
        <IconChevron size={16} className="rotate-180" /> All projects
      </Link>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <AppIcon name={p.name} accent={p.accent} size={64} />
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
            {p.category} · {p.year}
          </p>
          <Decrypt as="h1" text={p.name} className="font-display text-[clamp(2.2rem,6vw,4rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-fg" />
        </div>
      </div>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{p.tagline}</p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Chip tone={p.status === "Live" ? "live" : p.source.visibility === "private" ? "private" : "neutral"}>{p.status}</Chip>
        {p.live && (
          <Button href={p.live.url} variant="primary">
            Visit {p.live.url.replace(/^https:\/\//, "")} <IconExternal size={15} />
          </Button>
        )}
        {p.source.visibility === "public" ? (
          <Button href={p.source.url}>
            <IconGithub size={16} /> Source on GitHub
          </Button>
        ) : (
          <Chip tone="private">Source is private</Chip>
        )}
      </div>
      <div className="mt-10">
        <BrowserFrame url={frameUrl(p)} className="shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)]">
          <Shot src={p.cover} alt={p.features.find((f) => f.image === p.cover)?.alt ?? `${p.name} screenshot`} sizes="(min-width: 1180px) 1130px, 100vw" priority />
        </BrowserFrame>
      </div>
    </header>
  );
}
