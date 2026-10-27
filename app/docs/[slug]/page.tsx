import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DOCS, getDoc } from "@/lib/data/docs";
import { getProject } from "@/lib/data/projects";
import { readDoc } from "@/lib/docs-fs";
import { extractToc } from "@/lib/toc";
import { Window } from "@/components/ui/Window";
import { Button } from "@/components/ui/Button";
import { AppIcon } from "@/components/ui/AppIcon";
import { IconChevron, IconDoc, IconDownload, IconGithub, IconSpark } from "@/components/ui/Icons";
import { DocMarkdown } from "@/components/docs/Markdown";
import { Toc } from "@/components/docs/Toc";

export const dynamicParams = false;

export function generateStaticParams() {
  return DOCS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const doc = getDoc((await params).slug);
  return doc ? { title: doc.title, description: doc.summary } : {};
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const doc = getDoc((await params).slug);
  if (!doc) notFound();
  const source = readDoc(doc);
  const toc = extractToc(source);
  const project = doc.project ? getProject(doc.project) : undefined;

  return (
    <div className="mx-auto max-w-[1180px] px-3 pt-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {project ? (
          <Button href={`/projects/${project.slug}`} variant="ghost" size="sm">
            <IconChevron size={15} className="rotate-180" />
            <AppIcon name={project.name} accent={project.accent} size={20} /> {project.name}
          </Button>
        ) : (
          <Button href="/docs" variant="ghost" size="sm">
            <IconChevron size={15} className="rotate-180" /> All docs
          </Button>
        )}
        <span className="ml-auto flex flex-wrap gap-2">
          <Button href={`/downloads/${doc.slug}.md`} download size="sm">
            <IconDownload size={15} /> Download .md
          </Button>
          {doc.github && (
            <Button href={doc.github} size="sm">
              <IconGithub size={15} /> Open on GitHub
            </Button>
          )}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="min-w-0">
          <Toc toc={toc} />
        </aside>
        <Window title={doc.title} icon={doc.group === "setup" ? <IconDoc /> : <IconSpark />} accent={project?.accent} bodyClassName="px-5 py-8 sm:px-10 sm:py-10">
          <DocMarkdown source={source} />
        </Window>
      </div>
    </div>
  );
}
