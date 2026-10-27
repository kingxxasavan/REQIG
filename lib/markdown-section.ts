// The first paragraph under a "## heading" in a markdown doc, as one line of plain text.
// Used for short summaries of the build stories on project pages.
export function firstParagraph(md: string, heading: string): string | undefined {
  const lines = md.split("\n");
  const start = lines.findIndex((l) => l.trim() === `## ${heading}`);
  if (start === -1) return undefined;
  const para: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("#")) break;
    if (line.trim() === "") {
      if (para.length) break;
      continue;
    }
    para.push(line.trim());
  }
  if (!para.length) return undefined;
  return para
    .join(" ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__|\*|_|`)(.+?)\1/g, "$2");
}
