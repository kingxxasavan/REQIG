import { test, expect } from "vitest";
import images from "@/lib/data/images.json";
import { PROJECTS, getProject, neighbors } from "@/lib/data/projects";
import { FUTURE } from "@/lib/data/future";
import { LINKS } from "@/lib/data/links";
import { SECTIONS } from "@/lib/data/sections";

test("six projects with unique slugs", () => {
  expect(PROJECTS).toHaveLength(6);
  expect(new Set(PROJECTS.map((p) => p.slug)).size).toBe(6);
});

test("links are https and sources point at github", () => {
  for (const p of PROJECTS) {
    if (p.live) expect(p.live.url).toMatch(/^https:\/\//);
    if (p.source.visibility === "public") expect(p.source.url).toMatch(/^https:\/\/github\.com\//);
  }
});

test("private repos have no source url or setup", () => {
  for (const slug of ["cryptic-hub", "jarvis"]) {
    const p = getProject(slug)!;
    expect(p.source.visibility).toBe("private");
    expect(p.setupSummary).toBeUndefined();
    expect(JSON.stringify(p)).not.toMatch(/github\.com\/kingxxasavan\/(cryptichub|jarvis)/i);
  }
});

test("public repos have a setup summary", () => {
  for (const slug of ["polyos", "foundry", "epri", "marketplace"]) {
    expect(getProject(slug)!.setupSummary?.length).toBeGreaterThan(0);
  }
});

test("every image is in the manifest", () => {
  for (const p of PROJECTS) {
    for (const src of [p.cover, ...p.features.map((f) => f.image)]) {
      expect(images, `${p.slug}: ${src}`).toHaveProperty([src]);
    }
  }
});

test("3 to 6 features, each with alt text", () => {
  for (const p of PROJECTS) {
    expect(p.features.length).toBeGreaterThanOrEqual(3);
    expect(p.features.length).toBeLessThanOrEqual(6);
    for (const f of p.features) expect(f.alt.length).toBeGreaterThan(0);
  }
});

test("EPRI points at the last EPRI commit", () => {
  const s = getProject("epri")!.source;
  expect(s.visibility === "public" && s.ref).toBe("8bda4a9");
});

test("PolyOS credits Perlexity first", () => {
  const credits = getProject("polyos")!.credits!;
  expect(credits[0].name).toBe("Perlexity (AndrewInput on Scratch)");
  expect(credits[0].url).toBe("https://scratch.mit.edu/users/PolyOS/");
  expect(credits.some((c) => c.name === "PIXAPoLY Software")).toBe(true);
});

test("neighbors wrap around", () => {
  expect(neighbors("cryptic-hub").prev.slug).toBe("marketplace");
  expect(neighbors("marketplace").next.slug).toBe("cryptic-hub");
});

test("unknown slug is undefined", () => {
  expect(getProject("nope")).toBeUndefined();
});

test("roadmap grows from real projects", () => {
  expect(FUTURE).toHaveLength(6);
  for (const f of FUTURE) for (const s of f.growsFrom) expect(getProject(s)).toBeDefined();
});

test("links start with the GitHub profile", () => {
  expect(LINKS[0]).toEqual({ label: "GitHub", url: "https://github.com/kingxxasavan" });
});

test("taskbar sections in order", () => {
  expect(SECTIONS.map((s) => s.id)).toEqual(["projects", "functions", "playbook", "contributions", "future"]);
});

test("no em dashes in copy", () => {
  expect(JSON.stringify([PROJECTS, FUTURE])).not.toContain("—");
});
