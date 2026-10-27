import { PROJECTS } from "@/lib/data/projects";
import { DOCS } from "@/lib/data/docs";
import { SECTIONS } from "@/lib/data/sections";

export type SearchItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  kind: "project" | "doc" | "section";
  keywords: string[];
};

export function buildIndex(): SearchItem[] {
  const projects: SearchItem[] = PROJECTS.map((p) => ({
    id: p.slug,
    title: p.name,
    subtitle: p.tagline,
    href: `/projects/${p.slug}`,
    kind: "project",
    keywords: [p.category, ...p.stack],
  }));
  const docs: SearchItem[] = DOCS.map((d) => ({
    id: d.slug,
    title: d.title,
    subtitle: d.summary,
    href: `/docs/${d.slug}`,
    kind: "doc",
    keywords: [d.group === "setup" ? "setup install readme guide" : "ai claude build story", d.project ?? ""],
  }));
  const sections: SearchItem[] = [
    ...SECTIONS.map((s) => ({ id: `section:${s.id}`, title: s.label, subtitle: "Section on the home page", href: `/#${s.id}`, kind: "section" as const, keywords: [] })),
    { id: "section:docs", title: "All docs", subtitle: "Setup guides and build stories", href: "/docs", kind: "section", keywords: ["readme", "download"] },
  ];
  return [...projects, ...docs, ...sections];
}

const PINNED = ["cryptic-hub", "jarvis", "polyos", "foundry", "epri", "marketplace", "playbook"];

// Every word of the query must appear somewhere in the item. Plain substring matching,
// so characters like "+" or "(" are just characters.
export function searchItems(items: SearchItem[], query: string): SearchItem[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return PINNED.map((id) => items.find((i) => i.id === id)).filter((i): i is SearchItem => !!i);
  return items.filter((item) => {
    const hay = [item.title, item.subtitle, ...item.keywords].join(" ").toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}
