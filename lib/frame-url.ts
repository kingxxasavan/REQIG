import type { Project } from "@/lib/types";

// What the fake browser bar shows for a project's screenshots.
export function frameUrl(p: Project): string {
  if (p.live) return p.live.url.replace(/^https:\/\//, "");
  if (p.source.visibility === "public") return `github.com/${p.source.repo}`;
  return "private";
}
