import GithubSlugger from "github-slugger";

export type TocEntry = { depth: 2 | 3; text: string; id: string };

// Plain text of a heading the way it renders: no code ticks, link targets or emphasis.
function plain(heading: string): string {
  return heading
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/(\*\*|__|\*|_|~~)(.+?)\1/g, "$2")
    .replace(/<[^>]+>/g, "")
    .trim();
}

// Mirrors rehype-slug: one slugger per document, every heading level takes a slug,
// so ids here match the ids on the rendered headings.
export function extractToc(md: string): TocEntry[] {
  const slugger = new GithubSlugger();
  const toc: TocEntry[] = [];
  let inFence = false;
  for (const line of md.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    const text = plain(m[2]);
    const id = slugger.slug(text);
    const depth = m[1].length;
    if (depth === 2 || depth === 3) toc.push({ depth, text, id });
  }
  return toc;
}
