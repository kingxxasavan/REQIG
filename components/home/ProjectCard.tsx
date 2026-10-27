"use client";

import Link from "next/link";
import { useRef } from "react";
import type { Project } from "@/lib/types";
import { AppIcon } from "@/components/ui/AppIcon";
import { BrowserFrame } from "@/components/ui/BrowserFrame";
import { Chip } from "@/components/ui/Chip";
import { Decrypt } from "@/components/ui/Decrypt";
import { Button } from "@/components/ui/Button";
import { IconExternal, IconGithub } from "@/components/ui/Icons";
import { Shot } from "@/components/ui/Shot";

export function frameUrl(p: Project) {
  if (p.live) return p.live.url.replace(/^https:\/\//, "");
  if (p.source.visibility === "public") return `github.com/${p.source.repo}`;
  return "private";
}

// A project card that tilts toward the pointer (up to 6 degrees) while the screenshot
// drifts the other way and the accent glow follows. Fine pointers only.
export function ProjectCard({ project: p }: { project: Project }) {
  const card = useRef<HTMLElement>(null);

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = card.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-y * 6).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(x * 6).toFixed(2)}deg`);
    el.style.setProperty("--gx", `${(x + 0.5) * 100}%`);
    el.style.setProperty("--gy", `${(y + 0.5) * 100}%`);
  };
  const onLeave = () => {
    const el = card.current;
    el?.style.setProperty("--rx", "0deg");
    el?.style.setProperty("--ry", "0deg");
  };

  return (
    <article
      ref={card}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="tilt-card group relative flex h-full flex-col rounded-[20px] border border-line bg-white/[0.03] p-3"
      style={{ "--card-accent": p.accent } as React.CSSProperties}
    >
      <div className="tilt-glow pointer-events-none absolute inset-0 rounded-[20px]" aria-hidden />
      <Link href={`/projects/${p.slug}`} className="tilt-shot relative block" tabIndex={-1} aria-hidden>
        <BrowserFrame url={frameUrl(p)}>
          <Shot src={p.cover} alt="" sizes="(min-width: 1280px) 380px, (min-width: 768px) 45vw, 100vw" />
        </BrowserFrame>
      </Link>
      <div className="relative flex flex-1 flex-col px-2 pb-2 pt-5">
        <div className="flex items-center gap-3">
          <AppIcon name={p.name} accent={p.accent} size={38} />
          <div className="min-w-0">
            <h3 className="font-display text-lg font-semibold leading-tight text-fg">
              <Link href={`/projects/${p.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
                <Decrypt text={p.name} hoverReplay />
              </Link>
            </h3>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
              {p.category} · {p.year}
            </p>
          </div>
          <Chip tone={p.status === "Live" ? "live" : p.source.visibility === "private" ? "private" : "neutral"} className="ml-auto shrink-0">
            {p.status}
          </Chip>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted">{p.tagline}</p>
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Built with">
          {p.stack.slice(0, 4).map((s) => (
            <li key={s} className="rounded-md border border-line px-2 py-0.5 font-mono text-[11px] text-muted">
              {s}
            </li>
          ))}
        </ul>
        <div className="relative z-10 mt-auto flex flex-wrap gap-2 pt-5">
          {p.live && (
            <Button href={p.live.url} size="sm" variant="primary" aria-label={`Visit ${p.name}`}>
              Visit <IconExternal size={14} />
            </Button>
          )}
          {p.source.visibility === "public" ? (
            <Button href={p.source.url} size="sm" aria-label={`${p.name} source on GitHub`}>
              <IconGithub size={14} /> Source
            </Button>
          ) : (
            <Chip tone="private">Source is private</Chip>
          )}
          <Button href={`/projects/${p.slug}`} size="sm" variant="ghost" className="ml-auto" aria-label={`${p.name} details`}>
            Details
          </Button>
        </div>
      </div>
    </article>
  );
}
