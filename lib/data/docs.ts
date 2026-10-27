import type { ProjectSlug } from "@/lib/types";
import { PROJECTS } from "./projects";

export type DocGroup = "setup" | "ai";

export type Doc = {
  slug: string;
  title: string;
  group: DocGroup;
  project?: ProjectSlug;
  file: string; // relative to content/
  github?: string;
  summary: string;
};

const PLAYBOOK: Doc = {
  slug: "playbook",
  title: "The Claude Code playbook",
  group: "ai",
  file: "playbook.md",
  summary: "How we guide Claude Code from idea to shipped site, what you still do by hand, and how we hunt bugs.",
};

const BUILD: Doc[] = PROJECTS.map((p) => ({
  slug: `${p.slug}-build`,
  title: `How we built ${p.name}`,
  group: "ai",
  project: p.slug,
  file: `build/${p.slug}.md`,
  summary: `The real story of ${p.name}: timeline, what Claude Code did, what we did by hand, and the bugs we hit.`,
}));

const SETUP: Doc[] = PROJECTS.flatMap((p) =>
  p.source.visibility === "public"
    ? [
        {
          slug: `${p.slug}-setup`,
          title: `${p.name} setup`,
          group: "setup" as const,
          project: p.slug,
          file: `setup/${p.slug}.md`,
          github: p.source.url.replace(/\/tree\/[^/]+$/, ""),
          summary: `The ${p.name} README: everything you need to run it yourself.`,
        },
      ]
    : [],
);

export const DOCS: Doc[] = [PLAYBOOK, ...BUILD, ...SETUP];

export function getDoc(slug: string): Doc | undefined {
  return DOCS.find((d) => d.slug === slug);
}

export function docsForProject(slug: ProjectSlug): Doc[] {
  return DOCS.filter((d) => d.project === slug);
}
