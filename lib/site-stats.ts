import data from "@/lib/data/contributions.json";
import { totals, type Contributions, type RepoStats } from "@/lib/contributions";
import type { ProjectSlug } from "@/lib/types";

// the JSON types slug as plain string; scripts/contributions.mjs only writes known slugs
export const CONTRIBUTIONS = data as unknown as Contributions;
export const TOTALS = totals(CONTRIBUTIONS.repos);
// The day the stats were generated; heatmaps end here so builds are reproducible.
export const STATS_DAY = CONTRIBUTIONS.generatedAt;

export function repoStats(slug: ProjectSlug): RepoStats | undefined {
  return CONTRIBUTIONS.repos.find((r) => r.slug === slug);
}
