// README snapshots live on this site, so their relative links would point at pages
// that don't exist here. Send them to the repo on GitHub instead: files and folders to
// github.com, images to raw.githubusercontent.com. Code is never touched.

const LINK = /(!?)\[((?:[^[\]]|\[[^\]]*\])*)\]\(([^)\s]+)((?:\s+"[^"]*")?)\)/g;
const FENCE = /^\s*(```|~~~)/;
const CODE_SPAN = /(`+)[^`]*?\1/g;

function isRelative(target: string): boolean {
  return !/^[a-z][a-z0-9+.-]*:/i.test(target) && !target.startsWith("#") && !target.startsWith("//");
}

function absolute(target: string, image: boolean, repo: { repo: string; ref: string }): string {
  const path = target.replace(/^(\.\/)+/, "").replace(/^\/+/, "");
  if (image) return `https://raw.githubusercontent.com/${repo.repo}/${repo.ref}/${path}`;
  const kind = path.split("#")[0].endsWith("/") ? "tree" : "blob";
  return `https://github.com/${repo.repo}/${kind}/${repo.ref}/${path}`;
}

function rewriteLine(line: string, repo: { repo: string; ref: string }): string {
  const spans: string[] = [];
  const masked = line.replace(CODE_SPAN, (span) => `\u0000${spans.push(span) - 1}\u0000`);
  const rewritten = masked.replace(LINK, (whole, bang: string, text: string, target: string, title: string) =>
    isRelative(target) ? `${bang}[${text}](${absolute(target, bang === "!", repo)}${title})` : whole,
  );
  return rewritten.replace(/\u0000(\d+)\u0000/g, (_, i: string) => spans[Number(i)]);
}

export function rewriteRelativeLinks(md: string, repo: { repo: string; ref: string }): string {
  let inFence = false;
  return md
    .split("\n")
    .map((line) => {
      if (FENCE.test(line)) {
        inFence = !inFence;
        return line;
      }
      return inFence ? line : rewriteLine(line, repo);
    })
    .join("\n");
}
