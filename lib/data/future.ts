import type { FutureProject } from "@/lib/types";

// Drafted from where each project is heading. Edit freely.
export const FUTURE: FutureProject[] = [
  {
    name: "Cryptic ID",
    pitch: "One account across Cryptic Hub, JARVIS, EPRI and Foundry, so signing in once gets you everywhere.",
    status: "Designing",
    growsFrom: ["cryptic-hub", "jarvis"],
  },
  {
    name: "PolyOS Web",
    pitch: "Try the full PolyOS desktop in the browser, no USB drive and no install.",
    status: "Next up",
    growsFrom: ["polyos"],
  },
  {
    name: "ARIA Studio",
    pitch: "ARIA's IDE as its own app, with one click deploys for whatever it builds.",
    status: "Exploring",
    growsFrom: ["cryptic-hub"],
  },
  {
    name: "JARVIS Mobile",
    pitch: "A phone app with voice, push reminders and control of your devices from anywhere.",
    status: "Exploring",
    growsFrom: ["jarvis"],
  },
  {
    name: "Foundry Builder",
    pitch: "Mix sections from any Foundry template into your own site and download it.",
    status: "Designing",
    growsFrom: ["foundry"],
  },
  {
    name: "EPRI Teams",
    pitch: "One view for accountants who look after many local businesses at once.",
    status: "Exploring",
    growsFrom: ["epri"],
  },
];
