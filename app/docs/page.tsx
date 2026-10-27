import type { Metadata } from "next";
import Link from "next/link";
import { DOCS, type DocGroup } from "@/lib/data/docs";
import { getProject } from "@/lib/data/projects";
import { Window } from "@/components/ui/Window";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { AppIcon } from "@/components/ui/AppIcon";
import { Decrypt } from "@/components/ui/Decrypt";
import { CrypticMark, IconArrow, IconDoc, IconDownload, IconSpark } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Docs",
  description: "Setup guides for our open source projects and the story of how we built each one with Claude Code.",
};

const GROUPS: { id: DocGroup; title: string; blurb: string; icon: React.ReactNode }[] = [
  {
    id: "setup",
    title: "Setup guides",
    blurb: "The READMEs of our public repos: everything you need to run them yourself.",
    icon: <IconDoc />,
  },
  {
    id: "ai",
    title: "Built with AI",
    blurb: "The Claude Code playbook, and the real story of how each project was built.",
    icon: <IconSpark />,
  },
];

export default function DocsPage() {
  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-8 px-3 pt-12 sm:px-6">
      <header className="max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">Docs</p>
        <Decrypt as="h1" text="Read it here, or take it with you." className="mt-3 font-display text-[clamp(2.2rem,5vw,3.4rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-fg" />
        <p className="mt-4 text-muted">Every guide opens on this site and downloads as a markdown file with one click.</p>
      </header>

      {GROUPS.map((g) => (
        <Reveal key={g.id}>
          <Window title={g.title} icon={g.icon} bodyClassName="p-3 sm:p-5">
            <p className="px-2 pb-4 pt-1 text-sm text-muted">{g.blurb}</p>
            <ul className="flex flex-col">
              {DOCS.filter((d) => d.group === g.id).map((d) => {
                const p = d.project ? getProject(d.project) : undefined;
                return (
                  <li key={d.slug} className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl px-3 py-4 hover:bg-white/[0.03] sm:flex-nowrap">
                    {p ? <AppIcon name={p.name} accent={p.accent} size={40} /> : <CrypticMark size={40} />}
                    <div className="min-w-0 flex-1 basis-56">
                      <Link href={`/docs/${d.slug}`} className="font-medium text-fg hover:underline">
                        {d.title}
                      </Link>
                      <p className="mt-0.5 text-sm text-muted">{d.summary}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button href={`/docs/${d.slug}`} size="sm" variant="primary" aria-label={`Read ${d.title}`}>
                        Read <IconArrow size={14} />
                      </Button>
                      <Button href={`/downloads/${d.slug}.md`} size="sm" download aria-label={`Download ${d.title} as markdown`}>
                        <IconDownload size={14} /> .md
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Window>
        </Reveal>
      ))}
    </div>
  );
}
