import type { Section } from "@/lib/types";

// Home page sections in taskbar order. The Docs button sits between playbook and contributions.
export const SECTIONS: Section[] = [
  { id: "projects", label: "Projects" },
  { id: "functions", label: "Functions" },
  { id: "playbook", label: "Playbook" },
  { id: "contributions", label: "Contributions" },
  { id: "future", label: "Future" },
];
