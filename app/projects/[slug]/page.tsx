import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PROJECTS, getProject, neighbors } from "@/lib/data/projects";
import { getDoc } from "@/lib/data/docs";
import { readDoc } from "@/lib/docs-fs";
import { firstParagraph } from "@/lib/markdown-section";
import { Window } from "@/components/ui/Window";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { AppIcon } from "@/components/ui/AppIcon";
import { IconArrow, IconChevron, IconDoc, IconDownload, IconGrid, IconHeart, IconLayers, IconPulse, IconSpark } from "@/components/ui/Icons";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import { Gallery } from "@/components/project/Gallery";
import { SetupBlock } from "@/components/project/SetupBlock";
import { Credits } from "@/components/project/Credits";
import { RepoStats } from "@/components/project/RepoStats";

export const dynamicParams = false;

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getProject((await params).slug);
  return p ? { title: p.name, description: p.tagline } : {};
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = getProject((await params).slug);
  if (!p) notFound();
  const { prev, next } = neighbors(p.slug);
  const build = getDoc(`${p.slug}-build`)!;
  const buildSummary = firstParagraph(readDoc(build), "What it is");

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-8 px-3 sm:px-6">
      <ProjectHeader project={p} />

      <Reveal>
        <Window title="Overview" icon={<IconGrid />} accent={p.accent}>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)]">
            <div className="flex flex-col gap-4 text-[15px] leading-relaxed text-muted">
              {p.description.map((d) => (
                <p key={d.slice(0, 32)}>{d}</p>
              ))}
            </div>
            <dl className="flex flex-col gap-4 text-sm">
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Built with</dt>
                <dd className="mt-2 flex flex-wrap gap-1.5">
                  {p.stack.map((s) => (
                    <span key={s} className="rounded-md border border-line px-2 py-0.5 font-mono text-[11px] text-muted">
                      {s}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Status</dt>
                <dd className="mt-1 text-fg">{p.status}</dd>
              </div>
            </dl>
          </div>
        </Window>
      </Reveal>

      <Reveal>
        <Window title="What's inside" icon={<IconLayers />} accent={p.accent}>
          <Gallery features={p.features} accent={p.accent} />
        </Window>
      </Reveal>

      <Reveal>
        <Window title="How it was built with AI" icon={<IconSpark />} accent={p.accent}>
          <p className="max-w-3xl text-[15px] leading-relaxed text-muted">{buildSummary}</p>
          <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-muted">
            The full story covers the timeline, what Claude Code did, what we set up by hand, and the real bugs we hit along the way.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href={`/docs/${build.slug}`} variant="primary">
              Read how we built it <IconArrow size={16} />
            </Button>
            <Button href={`/downloads/${build.slug}.md`} download>
              <IconDownload size={16} /> Download .md
            </Button>
            <Button href="/docs/playbook" variant="ghost">
              <IconDoc size={16} /> The playbook
            </Button>
          </div>
        </Window>
      </Reveal>

      <Reveal>
        <Window title="Set it up yourself" icon={<IconDoc />} accent={p.accent}>
          <SetupBlock project={p} />
        </Window>
      </Reveal>

      {p.credits && (
        <Reveal>
          <Window title="Credits" icon={<IconHeart />} accent={p.accent}>
            <Credits credits={p.credits} accent={p.accent} />
          </Window>
        </Reveal>
      )}

      <Reveal>
        <Window title="Repo stats" icon={<IconPulse />} accent={p.accent}>
          <RepoStats project={p} />
        </Window>
      </Reveal>

      <nav aria-label="More projects" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { p: prev, label: "Previous" },
          { p: next, label: "Next" },
        ].map(({ p: q, label }) => (
          <Link
            key={label}
            href={`/projects/${q.slug}`}
            className={`press flex items-center gap-4 rounded-[18px] border border-line bg-white/[0.03] p-4 hover:border-line-strong ${label === "Next" ? "sm:flex-row-reverse sm:text-right" : ""}`}
          >
            <IconChevron className={`shrink-0 text-muted ${label === "Previous" ? "rotate-180" : ""}`} />
            <AppIcon name={q.name} accent={q.accent} size={40} />
            <span className="min-w-0">
              <span className="block font-mono text-[11px] uppercase tracking-[0.14em] text-faint">{label}</span>
              <span className="block truncate font-display font-semibold text-fg">{q.name}</span>
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
