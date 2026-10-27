export type ProjectSlug = "cryptic-hub" | "jarvis" | "polyos" | "foundry" | "epri" | "marketplace";

export type Status = "Live" | "Owner only" | "Source only" | "Demo";

export type Feature = { title: string; body: string; image: string; alt: string };

export type Credit = { name: string; role: string; body: string; url?: string };

export type Project = {
  slug: ProjectSlug;
  name: string;
  tagline: string;
  description: string[];
  year: number;
  category: string;
  accent: string;
  stack: string[];
  status: Status;
  live?: { url: string; verified: boolean };
  source: { visibility: "public"; url: string; repo: string; ref: string } | { visibility: "private" };
  cover: string;
  features: Feature[];
  milestones: { date: string; title: string }[];
  setupSummary?: string[];
  credits?: Credit[];
};

export type FutureStatus = "Exploring" | "Designing" | "Next up";

export type FutureProject = { name: string; pitch: string; status: FutureStatus; growsFrom: ProjectSlug[] };

export type Section = { id: "projects" | "functions" | "playbook" | "contributions" | "future"; label: string };
