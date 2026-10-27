# Cryptic Inc Showcase Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the EPRI app in this repo with a static Cryptic Inc showcase site (six projects, functions tour, AI playbook, readable and downloadable docs, contributions, future roadmap) in the PolyOS design language.

**Architecture:** Next.js App Router with `output: "export"`, so the whole site is static HTML on Vercel with no backend. All content lives in typed data files under `lib/data/` and markdown under `content/`; build time scripts produce screenshots, the backdrop, contribution stats and README snapshots. Pure logic (stats, link rewriting, table of contents, search, decrypt frames) sits in small `lib/` modules with unit tests; a Playwright script checks the built site.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.9, Tailwind CSS 4, `motion`, `react-markdown` + `remark-gfm` + `rehype-slug`, `github-slugger`, `geist` and `@fontsource-variable/sora` fonts, `sharp` (scripts), Vitest, `playwright-core`, `serve`.

**Spec:** `docs/superpowers/specs/2026-10-27-cryptic-inc-showcase-design.md`

## Global Constraints

* Node 22. Versions: `next ^16.4.3`, `react ^19.3.1`, `react-dom ^19.3.1`, `motion ^14.6.0`, `react-markdown ^10.1.0`, `remark-gfm ^4.0.1`, `rehype-slug ^6.0.0`, `github-slugger ^2.0.0`, `geist ^1.8.2`, `@fontsource-variable/sora ^5.3.0`; dev: `typescript ^5.9.3` (not 7), `tailwindcss ^4.3.3`, `@tailwindcss/postcss ^4.3.3`, `eslint ^9.39.5`, `eslint-config-next ^16.4.3`, `vitest ^3.2.7`, `sharp ^0.35.5`, `playwright-core ^1.64.1`, `serve ^14.2.4`, `@types/node ^22`, `@types/react ^19.3.0`, `@types/react-dom ^19.3.0`.
* No backend, no Firebase, no environment variables, no runtime fetches. The only external requests the site makes are README images from `raw.githubusercontent.com` inside setup docs.
* Fonts are self hosted from npm (`geist`, `@fontsource-variable/sora`). Never `next/font/google`.
* Color tokens, exactly: `ink #07060c`, `glass rgb(17 15 27 / 0.66)`, `glass-strong rgb(22 20 34 / 0.86)`, `line rgb(255 255 255 / 0.08)`, `line-strong rgb(255 255 255 / 0.14)`, `fg #f4f3fb`, `muted #a9a7bd`, `faint #6f6d85`, `accent #7c8cff`, `violet #a78bfa`, `cyan #67e8f9`, `pink #f0abfc`, `ok #86efac`. Signature gradient `linear-gradient(120deg, #5b7cfa, #8b5cf6 45%, #d946ef)`.
* Windows: radius 20px, 1px `line` border, inner top highlight. `backdrop-filter` only on the taskbar, docs menu, start menu and sticky title bars.
* Only `transform` and `opacity` animate. Under `prefers-reduced-motion: reduce` every animation becomes a plain fade or nothing and decrypt text renders final immediately.
* Private repos (`cryptic-hub`, `jarvis`) never get a source link, a setup doc or a GitHub button anywhere on the site.
* No em dashes in site copy.
* Everything must work at 375px wide with no horizontal scroll.
* Repo clones used by scripts (pass as arguments, never hardcode): `/home/user/cryptichub`, `/home/user/jarvis`, `/home/user/kingxxasavan/poly-os-7-debain-receration`, `/home/user/kingxxasavan/web---templates`, `/home/user/kingxxasavan/cryptic`, and this repo for EPRI history. They are shallow; Task 4 deepens them.

## Review Focus

1. **README links in setup docs:** relative links, `./` links, folder links, images, `#anchors`, `mailto:` and absolute URLs must each land somewhere real. Test in Task 5 (`rewriteRelativeLinks` cases).
2. **Start menu search with odd input:** empty, whitespace only, uppercase, `c++`, `(`, `.*` must not throw and must show matches or "No results". Test in Task 7 (`searchItems` cases).
3. **Commit day bucketing across time zones:** a commit at `2026-10-26T23:30:00-04:00` belongs to 2026-10-26, not 2026-10-27; binary files (`-\t-\tpath`) count 0 lines. Test in Task 4.
4. **Phone width:** at 375px the taskbar fits (icons only), the docs menu and start menu fit inside the viewport, and nothing scrolls sideways on any route. Checked in Task 11 e2e.
5. **Reduced motion and keyboard:** with reduced motion the hero reads "Cryptic Inc." on first paint; Escape closes the docs menu, start menu and lightbox and focus returns to the opener. Test in Task 7 (`scrambleFrame`) and Task 11 e2e.

---

### Task 1: Wipe the repo and scaffold the Next.js app

**Files:**
- Delete: `src/`, `api/`, `public/`, `tests/`, `index.html`, `vite.config.js`, `.env.example`, `package.json`, `package-lock.json`, `vercel.json`, `README.md` (keep `docs/` and `.git`)
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs`, `vitest.config.ts`, `.gitignore`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `tests/smoke.test.ts`

**Interfaces:**
- Produces: path alias `@/*` → repo root; npm scripts `dev`, `build` (`next build`, output in `out/`), `prebuild` and `predev` (both `node scripts/copy-downloads.mjs`, added in Task 5; until then omit), `lint` (`eslint .`), `typecheck` (`tsc --noEmit`), `test` (`vitest run`), `e2e` (`node scripts/e2e.mjs`); Tailwind theme colors named exactly as the token names above (`bg-ink`, `text-muted`, `border-line`, ...), font vars `--font-geist-sans`, `--font-geist-mono`, and `--font-display: "Sora Variable"`.

- [ ] **Step 1: Remove the EPRI app**

Run: `git rm -r -q src api public tests index.html vite.config.js .env.example package.json package-lock.json vercel.json README.md`
Expected: `git status` shows only deletions; `docs/` untouched.

- [ ] **Step 2: Write the configs**

`next.config.ts`: `{ output: "export", poweredByHeader: false, images: { unoptimized: true } }`. `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `vitest.config.ts` mirror `kingxxasavan/Cryptic` (vitest includes `tests/**/*.test.ts`, node environment, `@` alias). `.gitignore`: `node_modules`, `.next`, `out`, `next-env.d.ts`, `public/downloads`, `*.tsbuildinfo`.

- [ ] **Step 3: Write `app/globals.css`**

`@import "tailwindcss";` then `@theme` with the color tokens, `--font-sans: var(--font-geist-sans)`, `--font-mono: var(--font-geist-mono)`, `--font-display: "Sora Variable", var(--font-geist-sans)`, `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`. `html, body` background `ink`, color `fg`, `overflow-x: clip`. Film grain `body::before` (same SVG noise as Cryptic, opacity 0.035). `:focus-visible` outline 2px `accent`.

- [ ] **Step 4: Minimal layout and page**

`app/layout.tsx` loads `GeistSans` and `GeistMono` from `geist/font/sans` and `geist/font/mono`, imports `@fontsource-variable/sora` and `./globals.css`, metadata title `{ default: "Cryptic Inc.", template: "%s · Cryptic Inc." }`, description "Every project Cryptic Inc. has shipped, how we built it with AI, and how to run it yourself.", viewport themeColor `#07060c`. `app/page.tsx` renders an `h1` "Cryptic Inc.".

- [ ] **Step 5: Smoke test**

```ts
// tests/smoke.test.ts
import { test, expect } from "vitest";
test("vitest runs", () => { expect(1 + 1).toBe(2); });
```

- [ ] **Step 6: Install and verify**

Run: `npm install && npm test && npm run typecheck && npm run lint && npm run build && test -f out/index.html && echo OK`
Expected: all pass, prints `OK`.

- [ ] **Step 7: Commit**

`git add -A && git commit -m "Replace EPRI with a Next.js static site scaffold"`

---

### Task 2: Screenshots, image manifest and crystal backdrop

**Files:**
- Create: `scripts/images.mjs`, `scripts/capture.mjs`, `scripts/backdrop.mjs`, `scripts/jarvis-architecture.svg`, `lib/data/images.json` (generated), `public/backdrop.webp` (generated), `public/projects/<slug>/*.webp` (generated), `tests/images.test.ts`

**Interfaces:**
- Produces: every image at `/projects/<slug>/<name>.webp`; `lib/data/images.json` shaped `Record<string, { width: number; height: number }>` keyed by public path (for example `"/projects/polyos/desktop.webp"`), including `"/backdrop.webp"`.

Image names, exactly:

| Slug | Names | Source |
| --- | --- | --- |
| `cryptic-hub` | `home`, `aria`, `calendar`, `notes`, `hallows` | `cryptichub/assets/shots/*.jpg` |
| `polyos` | `desktop`, `start-menu`, `polymarket`, `files`, `settings-appearance`, `vara`, `widgets`, `task-manager`, `driver-manager`, `installer-welcome`, `installer-drives`, `login` | `poly-os-7-debain-receration/docs/screenshots/*.jpg` |
| `foundry` | `store-home`, `template-page`, `cart` (captured); `helix-ai`, `quill-journal`, `pulse-fitness`, `atelier-lookbook`, `sable-studio`, `ember-table`, `aurora-commerce`, `monolith-portfolio`, `vertex-launch` | captures; `web---templates/public/thumbs/*.webp` |
| `marketplace` | `home`, `explore`, `product`, `checkout`, `creator-studio` | captured from a local production build of `kingxxasavan/cryptic` |
| `epri` | `landing`, `dashboard`, `advisor`, `pricing-studio`, `reports` | captured from a `git worktree` of this repo at `8bda4a9` (`npm ci && npm run build && npx vite preview`), dashboard and later shots via the landing page's guided tour sample bakery |
| `jarvis` | `login` (or whatever renders without Supabase), `architecture` | captured from `jarvis/web` (`npm ci && npm run dev` with placeholder env from `web/.env.example`); `architecture` rendered from `scripts/jarvis-architecture.svg` |

- [ ] **Step 1: Write the failing test**

```ts
// tests/images.test.ts
import images from "@/lib/data/images.json";
import { existsSync } from "node:fs";
test("every manifest image exists and is at most 1600px wide", () => {
  for (const [path, size] of Object.entries(images)) {
    expect(existsSync(`public${path}`)).toBe(true);
    expect(size.width).toBeLessThanOrEqual(1600);
    expect(size.height).toBeGreaterThan(0);
  }
});
test("backdrop exists", () => { expect(images["/backdrop.webp"]).toBeDefined(); });
```

- [ ] **Step 2: Run it**

Run: `npx vitest run tests/images.test.ts`
Expected: FAIL, cannot resolve `lib/data/images.json`.

- [ ] **Step 3: `scripts/images.mjs --slug <slug> --in <dir> [--map old=new ...]`**

Converts every `.jpg`, `.png`, `.webp`, `.svg` in `--in` with sharp: resize to max width 1600 (no enlargement), WebP quality 82, written to `public/projects/<slug>/<name>.webp` (name from `--map` or the file's base name). Merges `{ width, height }` of each output into `lib/data/images.json` (sorted keys, 2 space indent).

- [ ] **Step 4: `scripts/capture.mjs <slug> <baseUrl> <outDir>`**

`playwright-core` Chromium at `process.env.CHROME_PATH ?? "/opt/pw-browsers/chromium"`, viewport 1440×900, `colorScheme: "dark"`. A `SHOTS` table per slug lists `{ name, path, before? }` where `before` is an async function for clicks (EPRI tour steps, Marketplace add to cart). Waits for network idle plus 600ms, saves `<outDir>/<name>.png`. Raw captures go to the scratchpad, never the repo.

- [ ] **Step 5: `scripts/backdrop.mjs`**

Seeded (seed 7) low poly crystal: jittered grid of points on 2560×1600, triangles filled from a palette of violet, indigo and cyan (`#2a1b5e`, `#3b2a8f`, `#5b3fd1`, `#1e3a8a`, `#0e7490`, `#6d28d9`) with brightness from a diagonal light, darkened 55% toward `#07060c` at the edges. Rendered as SVG, rasterized with sharp to `public/backdrop.webp` at quality 70, and added to the manifest.

- [ ] **Step 6: Produce all images** per the table, then draw `scripts/jarvis-architecture.svg` (1600×900, dark glass boxes for Browser, `web/` on Vercel, NVIDIA NIM and Ollama Cloud, Supabase, Laptop agent, Cloudflare Tunnel, with arrows labeled as in the JARVIS README diagram) and convert it. If JARVIS only shows its sign in screen, note it for the final report.

- [ ] **Step 7: Run the test**

Run: `npx vitest run tests/images.test.ts`
Expected: PASS. `ls public/projects/*/ | wc -l` covers all names in the table.

- [ ] **Step 8: Commit**

`git add scripts lib/data/images.json public tests/images.test.ts && git commit -m "Add project screenshots, image manifest and crystal backdrop"`

---

### Task 3: Project, future and links data

**Files:**
- Create: `lib/types.ts`, `lib/data/projects.ts`, `lib/data/future.ts`, `lib/data/links.ts`, `lib/data/sections.ts`, `tests/projects.test.ts`

**Interfaces:**
- Consumes: `lib/data/images.json` (Task 2).
- Produces (in `lib/types.ts`):

```ts
export type ProjectSlug = "cryptic-hub" | "jarvis" | "polyos" | "foundry" | "epri" | "marketplace";
export type Status = "Live" | "Owner only" | "Source only" | "Demo";
export type Feature = { title: string; body: string; image: string; alt: string };
export type Credit = { name: string; role: string; body: string; url?: string };
export type Project = {
  slug: ProjectSlug; name: string; tagline: string; description: string[]; year: number;
  category: string; accent: string; stack: string[]; status: Status;
  live?: { url: string; verified: boolean };
  source: { visibility: "public"; url: string; repo: string; ref: string } | { visibility: "private" };
  cover: string; features: Feature[]; milestones: { date: string; title: string }[];
  setupSummary?: string[]; credits?: Credit[];
};
export type FutureStatus = "Exploring" | "Designing" | "Next up";
export type FutureProject = { name: string; pitch: string; status: FutureStatus; growsFrom: ProjectSlug[] };
export type Section = { id: "projects" | "functions" | "playbook" | "contributions" | "future"; label: string };
```

- `lib/data/projects.ts`: `export const PROJECTS: Project[]` (order: cryptic-hub, jarvis, polyos, foundry, epri, marketplace), `getProject(slug: string): Project | undefined`, `neighbors(slug: ProjectSlug): { prev: Project; next: Project }` (wraps around).
- `lib/data/future.ts`: `export const FUTURE: FutureProject[]` (the six from the spec).
- `lib/data/links.ts`: `export const LINKS: { label: string; url: string }[]` starting with `{ label: "GitHub", url: "https://github.com/kingxxasavan" }`.
- `lib/data/sections.ts`: `export const SECTIONS: Section[]` in taskbar order: projects, functions, playbook, contributions, future (the Docs button is separate and sits between playbook and contributions).

Values the spec pins: links and statuses from the spec's project table; `source.ref` is `main` except EPRI (`8bda4a9`, repo `kingxxasavan/REQIG`); `live.verified` false for Foundry and Marketplace; accents `cryptic-hub #8b5cf6`, `jarvis #22d3ee`, `polyos #7c8cff`, `foundry #f59e0b`, `epri #60a5fa`, `marketplace #e6c78f`. PolyOS `credits`: `{ name: "Perlexity (AndrewInput on Scratch)", role: "Original creator and collaborator", body: <PolyOS started as Perlexity's Scratch operating system; Cryptic Inc rebuilt it as a real Debian desktop as a birthday present for him>, url: "https://scratch.mit.edu/users/PolyOS/" }` and `{ name: "PIXAPoLY Software", role: "The PolyOS team", body: <logo, palette and artwork from the PolyOS 7 Scratch project, CC BY-SA 2.0> }`. Descriptions, taglines and 3 to 6 features per project come from each repo's README; feature images use the Task 2 names. `cover` is the first name in that project's Task 2 row, except JARVIS uses `architecture`.

- [ ] **Step 1: Write the failing tests**

```ts
// tests/projects.test.ts
test("six projects with unique slugs", () => { expect(new Set(PROJECTS.map(p => p.slug)).size).toBe(6); });
test("links are https", () => { for (const p of PROJECTS) { if (p.live) expect(p.live.url).toMatch(/^https:\/\//); if (p.source.visibility === "public") expect(p.source.url).toMatch(/^https:\/\/github\.com\//); } });
test("private repos have no source url or setup", () => { for (const slug of ["cryptic-hub", "jarvis"]) { const p = getProject(slug)!; expect(p.source.visibility).toBe("private"); expect(p.setupSummary).toBeUndefined(); } });
test("public repos have a setup summary", () => { for (const slug of ["polyos", "foundry", "epri", "marketplace"]) expect(getProject(slug)!.setupSummary?.length).toBeGreaterThan(0); });
test("every image is in the manifest", () => { for (const p of PROJECTS) for (const src of [p.cover, ...p.features.map(f => f.image)]) expect(images).toHaveProperty([src]); });
test("3 to 6 features with alt text", () => { for (const p of PROJECTS) { expect(p.features.length).toBeGreaterThanOrEqual(3); expect(p.features.length).toBeLessThanOrEqual(6); for (const f of p.features) expect(f.alt.length).toBeGreaterThan(0); } });
test("EPRI points at the last EPRI commit", () => { const s = getProject("epri")!.source; expect(s.visibility === "public" && s.ref).toBe("8bda4a9"); });
test("PolyOS credits Perlexity", () => { expect(getProject("polyos")!.credits?.[0].name).toBe("Perlexity (AndrewInput on Scratch)"); });
test("neighbors wrap", () => { expect(neighbors("cryptic-hub").prev.slug).toBe("marketplace"); expect(neighbors("marketplace").next.slug).toBe("cryptic-hub"); });
test("no em dashes in copy", () => { expect(JSON.stringify([PROJECTS, FUTURE])).not.toContain("—"); });
```

- [ ] **Step 2: Run them**

Run: `npx vitest run tests/projects.test.ts`
Expected: FAIL, modules missing.

- [ ] **Step 3: Write `lib/types.ts` and the four data files** with the values above.

- [ ] **Step 4: Run them**

Run: `npx vitest run tests/projects.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

`git add lib tests && git commit -m "Add project, roadmap, links and section data"`

---

### Task 4: Contribution stats

**Files:**
- Create: `lib/contributions.ts`, `scripts/contributions.mjs`, `lib/data/contributions.json` (generated), `tests/contributions.test.ts`

**Interfaces:**
- Produces:

```ts
export type Commit = { date: string; additions: number; deletions: number; claude: boolean };
export type RepoStats = { slug: ProjectSlug; commits: number; additions: number; deletions: number; firstCommit: string; lastCommit: string; activeDays: number; claudeCommits: number; daily: Record<string, number> };
export type Contributions = { generatedAt: string; repos: RepoStats[] };
export function parseGitLog(raw: string): Commit[];
export function summarize(slug: ProjectSlug, commits: Commit[]): RepoStats;
export function totals(repos: RepoStats[]): { commits: number; additions: number; deletions: number; activeDays: number; claudeCommits: number };
export function heatmapWeeks(daily: Record<string, number>, today: string): { date: string; count: number }[][];
```

`parseGitLog` reads the output of `git log --no-merges --pretty=format:@@%H%x09%aI%x09%(trailers:key=Co-Authored-By,valueonly,separator=%x2C) --numstat`. `date` is the first 10 characters of `%aI` (the author's local day). `claude` is true when the trailer value contains `Claude` (case insensitive). `totals.activeDays` counts unique dates across all repos. `heatmapWeeks` returns 53 columns of 7 days, Sunday first, the last column containing `today`; days after `today` are omitted.

- [ ] **Step 1: Write the failing tests**

```ts
const RAW = "@@a1\t2026-10-26T23:30:00-04:00\tClaude Opus <noreply@anthropic.com>\n3\t1\tapp/page.tsx\n-\t-\tlogo.png\n\n@@b2\t2026-10-20T08:00:00+00:00\t\n10\t0\tREADME.md";
test("parses commits with local day, lines and claude flag", () => {
  expect(parseGitLog(RAW)).toEqual([
    { date: "2026-10-26", additions: 3, deletions: 1, claude: true },
    { date: "2026-10-20", additions: 10, deletions: 0, claude: false },
  ]);
});
test("summarize", () => { const s = summarize("polyos", parseGitLog(RAW)); expect(s).toMatchObject({ commits: 2, additions: 13, deletions: 1, firstCommit: "2026-10-20", lastCommit: "2026-10-26", activeDays: 2, claudeCommits: 1 }); expect(s.daily["2026-10-26"]).toBe(1); });
test("totals counts shared days once", () => { const a = summarize("polyos", parseGitLog(RAW)); const b = summarize("epri", parseGitLog(RAW)); expect(totals([a, b]).activeDays).toBe(2); expect(totals([a, b]).commits).toBe(4); });
test("heatmap is 53 weeks, Sunday first, ends today", () => { const w = heatmapWeeks({ "2026-10-27": 4 }, "2026-10-27"); expect(w).toHaveLength(53); expect(w[0]).toHaveLength(7); expect(new Date(w[0][0].date + "T00:00:00Z").getUTCDay()).toBe(0); expect(w.at(-1)!.at(-1)).toEqual({ date: "2026-10-27", count: 4 }); });
test("empty log", () => { expect(parseGitLog("")).toEqual([]); });
```

- [ ] **Step 2: Run them**

Run: `npx vitest run tests/contributions.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `lib/contributions.ts`** (pure, no `fs`).

- [ ] **Step 4: Run them**

Expected: PASS.

- [ ] **Step 5: `scripts/contributions.mjs slug=path ...`**

For each `slug=path[@ref]` runs the git log above in that clone on `HEAD`, or on `ref` when given, aggregates by importing `lib/contributions.ts` directly (Node 22 strips types; the file must only use `import type` for `ProjectSlug`), writes `lib/data/contributions.json` with `generatedAt` as today's date.

- [ ] **Step 6: Deepen clones and generate**

Run for each clone: `git -C <clone> fetch --depth=1000 origin <default branch>`; then
`node scripts/contributions.mjs cryptic-hub=/home/user/cryptichub jarvis=/home/user/jarvis polyos=/home/user/kingxxasavan/poly-os-7-debain-receration foundry=/home/user/kingxxasavan/web---templates epri=.@8bda4a9 marketplace=/home/user/kingxxasavan/cryptic`
Expected: JSON with six repos, each `commits > 0`.

- [ ] **Step 7: Commit**

`git add lib scripts tests && git commit -m "Add contribution stats from all six repos"`

---

### Task 5: Docs pipeline

**Files:**
- Create: `lib/markdown-links.ts`, `lib/toc.ts`, `lib/data/docs.ts`, `lib/docs-fs.ts`, `scripts/sync-docs.mjs`, `scripts/copy-downloads.mjs`, `content/setup/{polyos,foundry,epri,marketplace}.md` (generated), `tests/markdown-links.test.ts`, `tests/toc.test.ts`, `tests/docs.test.ts`
- Modify: `package.json` (add `prebuild` and `predev`)

**Interfaces:**
- Produces:

```ts
// lib/markdown-links.ts
export function rewriteRelativeLinks(md: string, repo: { repo: string; ref: string }): string;
// lib/toc.ts
export type TocEntry = { depth: 2 | 3; text: string; id: string };
export function extractToc(md: string): TocEntry[];
// lib/data/docs.ts
export type DocGroup = "setup" | "ai";
export type Doc = { slug: string; title: string; group: DocGroup; project?: ProjectSlug; file: string; github?: string; summary: string };
export const DOCS: Doc[];
export function getDoc(slug: string): Doc | undefined;
export function docsForProject(slug: ProjectSlug): Doc[];
// lib/docs-fs.ts (server only)
export function readDoc(doc: Doc): string; // reads content/<doc.file>
```

Doc slugs and titles: `playbook` "The Claude Code playbook" (file `playbook.md`, project undefined), `<slug>-build` "How we built <name>" for all six (`build/<slug>.md`), `<slug>-setup` "<name> setup" for the four public ones (`setup/<slug>.md`, `github` = the project's source url). `copy-downloads.mjs` copies each `content/<file>` to `public/downloads/<doc slug>.md`.

Link rules: `[t](https…)`, `mailto:`, `#x` untouched; `[t](docs/install.md)` and `./docs/install.md` and `/docs/install.md` → `https://github.com/<repo>/blob/<ref>/docs/install.md`; a path ending in `/` → `/tree/<ref>/…`; `![a](docs/x.png)` → `https://raw.githubusercontent.com/<repo>/<ref>/docs/x.png`. Code fences are left untouched.

- [ ] **Step 1: Write the failing tests**

```ts
const R = { repo: "kingxxasavan/poly-os-7-debain-receration", ref: "main" };
test.each([
  ["[a](https://x.dev)", "[a](https://x.dev)"],
  ["[a](mailto:hi@x.dev)", "[a](mailto:hi@x.dev)"],
  ["[a](#install)", "[a](#install)"],
  ["[a](docs/README.md)", "[a](https://github.com/kingxxasavan/poly-os-7-debain-receration/blob/main/docs/README.md)"],
  ["[a](./docs/README.md)", "[a](https://github.com/kingxxasavan/poly-os-7-debain-receration/blob/main/docs/README.md)"],
  ["[a](/docs/README.md)", "[a](https://github.com/kingxxasavan/poly-os-7-debain-receration/blob/main/docs/README.md)"],
  ["[a](docs/)", "[a](https://github.com/kingxxasavan/poly-os-7-debain-receration/tree/main/docs/)"],
  ["![s](docs/x.png)", "![s](https://raw.githubusercontent.com/kingxxasavan/poly-os-7-debain-receration/main/docs/x.png)"],
  ["```\n[a](docs/x)\n```", "```\n[a](docs/x)\n```"],
])("rewrites %s", (input, out) => { expect(rewriteRelativeLinks(input, R)).toBe(out); });

test("toc: h2 and h3, slugged like rehype-slug, duplicates numbered, code fences skipped", () => {
  expect(extractToc("# Title\n## Install `it`\n### Step\n```\n## not\n```\n## Step\n## Step")).toEqual([
    { depth: 2, text: "Install it", id: "install-it" },
    { depth: 3, text: "Step", id: "step" },
    { depth: 2, text: "Step", id: "step-1" },
    { depth: 2, text: "Step", id: "step-2" },
  ]);
});

test("registry: 11 docs, files exist, setup only for public", () => {
  expect(DOCS).toHaveLength(11);
  for (const d of DOCS) expect(existsSync(`content/${d.file}`)).toBe(true);
  expect(DOCS.filter(d => d.group === "setup").map(d => d.project).sort()).toEqual(["epri", "foundry", "marketplace", "polyos"]);
  expect(getDoc("jarvis-setup")).toBeUndefined();
});
```

- [ ] **Step 2: Run them**

Run: `npx vitest run tests/markdown-links.test.ts tests/toc.test.ts tests/docs.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `lib/markdown-links.ts`, `lib/toc.ts` (with `github-slugger`), `lib/data/docs.ts`, `lib/docs-fs.ts`.**

- [ ] **Step 4: `scripts/sync-docs.mjs slug=path[@ref] ...`** reads each clone's `README.md` (EPRI via `git show 8bda4a9:README.md`), applies `rewriteRelativeLinks`, prepends a one line note "Snapshot of the README in <repo> (<ref>).", writes `content/setup/<slug>.md`. Run it for the four public repos. Create placeholder `content/playbook.md` and `content/build/*.md` with an H1 only (Task 6 fills them).

- [ ] **Step 5: `scripts/copy-downloads.mjs`** and add `"prebuild"` and `"predev"` scripts.

- [ ] **Step 6: Run the tests**

Run: `npm test && node scripts/copy-downloads.mjs && ls public/downloads | wc -l`
Expected: PASS and `11`.

- [ ] **Step 7: Commit**

`git add lib scripts content tests package.json && git commit -m "Add docs registry, README snapshots and download copies"`

---

### Task 6: Write the playbook and the six build stories

**Files:**
- Modify: `content/playbook.md`, `content/build/{cryptic-hub,jarvis,polyos,foundry,epri,marketplace}.md`
- Create: `tests/content.test.ts`

Sources: each clone's `git log` (subjects, bodies, dates, `Claude-Session` and `Co-Authored-By` trailers, `claude/` and `codex/` branch names), its README, and `docs/superpowers/` in `kingxxasavan/cryptic`. Write in plain, friendly English, first person plural ("we"), no em dashes. Never quote secrets, keys or session URLs.

Required H2 headings, exactly:
* `playbook.md`: `The flow`, `Guiding Claude Code`, `What you have to do yourself`, `Testing, errors and bugs`, `Examples from our projects`. "What you have to do yourself" covers, with console paths: Firebase project and Authentication providers and authorized domains, Realtime Database rules, Supabase project and `schema.sql` and turning off public sign ups, API keys (NVIDIA NIM, Ollama, Stripe test mode), Vercel environment variables and root directory, domains and DNS.
* each build story: `What it is`, `Timeline`, `What Claude Code did`, `What we did by hand`, `Bugs we hit`, `Lessons`.

- [ ] **Step 1: Write the failing test**

```ts
const BUILD = ["What it is", "Timeline", "What Claude Code did", "What we did by hand", "Bugs we hit", "Lessons"];
const PLAY = ["The flow", "Guiding Claude Code", "What you have to do yourself", "Testing, errors and bugs", "Examples from our projects"];
const h2 = (md: string) => [...md.matchAll(/^## (.+)$/gm)].map(m => m[1]);
test("playbook sections", () => { expect(h2(readFileSync("content/playbook.md", "utf8"))).toEqual(PLAY); });
test.each(["cryptic-hub", "jarvis", "polyos", "foundry", "epri", "marketplace"])("%s build story sections", (s) => { expect(h2(readFileSync(`content/build/${s}.md`, "utf8"))).toEqual(BUILD); });
test("no em dashes, no session links", () => { for (const f of globSync("content/{playbook,build/*}.md")) { const t = readFileSync(f, "utf8"); expect(t).not.toContain("—"); expect(t).not.toMatch(/claude\.ai\/code\/session/); } });
```

- [ ] **Step 2: Run it**

Expected: FAIL (placeholders have no H2s).

- [ ] **Step 3: Write the seven docs.**

- [ ] **Step 4: Run it**

Run: `npx vitest run tests/content.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

`git add content tests && git commit -m "Write the Claude Code playbook and each project's build story"`

---

### Task 7: Shell: backdrop, windows, decrypt, taskbar, docs menu, start menu

**Files:**
- Create: `lib/decrypt.ts`, `lib/search.ts`, `components/shell/Backdrop.tsx`, `components/shell/Taskbar.tsx`, `components/shell/DocsMenu.tsx`, `components/shell/StartMenu.tsx`, `components/shell/Clock.tsx`, `components/shell/useActiveSection.ts`, `components/ui/Window.tsx`, `components/ui/Decrypt.tsx`, `components/ui/Icons.tsx`, `components/ui/Button.tsx`, `components/ui/Chip.tsx`, `tests/decrypt.test.ts`, `tests/search.test.ts`
- Modify: `app/layout.tsx`, `app/globals.css`

**Interfaces:**
- Consumes: `PROJECTS`, `DOCS`, `SECTIONS`.
- Produces:

```ts
// lib/decrypt.ts
export const GLYPHS: string; // "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+<>/"
export function scrambleFrame(text: string, progress: number, rand: () => number): string;
// lib/search.ts
export type SearchItem = { id: string; title: string; subtitle: string; href: string; kind: "project" | "doc" | "section"; keywords: string[] };
export function buildIndex(): SearchItem[];
export function searchItems(items: SearchItem[], query: string): SearchItem[];
```

```tsx
<Window title="Projects" icon={<IconGrid />} id="projects" accent?: string className?: string>{children}</Window>
<Decrypt text="Cryptic Inc." as="h1" className="…" hoverReplay? />
<Button href variant="primary" | "glass" | "ghost" download?>…</Button>
<Chip tone="live" | "private" | "neutral">…</Chip>
```

`scrambleFrame`: characters at index `< floor(progress * length)` are final, spaces always stay spaces, the rest are drawn from `GLYPHS` via `rand`. `Decrypt` runs it on `requestAnimationFrame` over 900ms when first in view, renders the final text invisibly to reserve width with the scramble overlaid, sets `aria-label` to the final text, and skips animation under reduced motion. Item ids: project slug, doc slug, or `section:<id>`. `searchItems`: lowercase, split on whitespace, every token must be a substring of `title + subtitle + keywords` (plain `includes`, no regex); empty or whitespace query returns the six projects plus `playbook`.

Taskbar: fixed bottom center, `glass-strong` with blur, mark button (opens start menu) on the left, `SECTIONS` buttons plus the Docs button in the middle, `Clock` (time and short date, updates every 15s, renders after mount to avoid hydration mismatch) on the right. On `/` a section button smooth scrolls to `#id` (instant under reduced motion); elsewhere it links to `/#id`. `useActiveSection(ids)` uses one `IntersectionObserver` and the active dot is a `motion` element with a shared `layoutId`. Below 640px labels hide and the clock shows time only. DocsMenu: popover above the Docs button listing `DOCS` grouped "Setup guides" and "Built with AI", each row Read (`/docs/<slug>`) and Download (`/downloads/<slug>.md`, `download` attribute), footer link "All docs"; closes on Escape, outside click and route change, returns focus to the button. StartMenu: dialog opened by the mark, `/` (when focus is not in a text field) or `Ctrl K`/`Cmd K`; search field, results list with arrow key navigation and Enter, pinned grid when the query is empty, "No results" otherwise; focus trapped, Escape closes and restores focus. Backdrop: fixed `backdrop.webp` (`object-cover`), two drifting aurora blobs, a cursor spotlight radial gradient driven by a CSS variable on pointer move (fine pointers only).

- [ ] **Step 1: Write the failing tests**

```ts
test("progress 0 keeps length and spaces, no final letters", () => { const f = scrambleFrame("Cryptic Inc.", 0, () => 0); expect(f).toHaveLength(12); expect(f[7]).toBe(" "); expect(f.startsWith("C")).toBe(false); });
test("progress 1 is the text", () => { expect(scrambleFrame("Cryptic Inc.", 1, Math.random)).toBe("Cryptic Inc."); });
test("progress 0.5 reveals the first half", () => { expect(scrambleFrame("abcdef", 0.5, () => 0).slice(0, 3)).toBe("abc"); });

const idx = buildIndex();
test.each(["", "   "])("empty query %j gives pinned", (q) => { expect(searchItems(idx, q).map(i => i.id)).toEqual(["cryptic-hub", "jarvis", "polyos", "foundry", "epri", "marketplace", "playbook"]); });
test("case insensitive, multi token", () => { expect(searchItems(idx, "POLY setup")[0].href).toBe("/docs/polyos-setup"); });
test.each(["c++", "(", ".*", "[", "\\"])("odd input %j does not throw", (q) => { expect(() => searchItems(idx, q)).not.toThrow(); });
test("no match", () => { expect(searchItems(idx, "zzzz")).toEqual([]); });
test("index never links private source", () => { expect(idx.some(i => i.href.includes("github.com/kingxxasavan/jarvis") || i.href.includes("github.com/kingxxasavan/cryptichub"))).toBe(false); });
```

- [ ] **Step 2: Run them**

Run: `npx vitest run tests/decrypt.test.ts tests/search.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `lib/decrypt.ts` and `lib/search.ts`.** Run the tests. Expected: PASS.

- [ ] **Step 4: Build the components and wire `app/layout.tsx`** (skip link to `#main`, `Backdrop`, `<main id="main">`, `Taskbar`, `StartMenu`, page bottom padding so the taskbar never covers content). Add glass, window and aurora classes to `globals.css`.

- [ ] **Step 5: Verify**

Run: `npm test && npm run typecheck && npm run lint && npm run build`
Expected: all pass.

- [ ] **Step 6: Commit**

`git add -A && git commit -m "Add the PolyOS style shell: backdrop, windows, taskbar, docs menu, start menu"`

---

### Task 8: Home page sections

**Files:**
- Create: `components/home/Hero.tsx`, `components/home/ProjectCard.tsx`, `components/home/ProjectsSection.tsx`, `components/home/FunctionsTour.tsx`, `components/home/PlaybookSection.tsx`, `components/home/ContributionsSection.tsx`, `components/home/FutureSection.tsx`, `components/home/Footer.tsx`, `components/ui/Shot.tsx`, `components/ui/BrowserFrame.tsx`, `components/ui/Heatmap.tsx`, `components/ui/CountUp.tsx`, `components/ui/Reveal.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `PROJECTS`, `FUTURE`, `LINKS`, `DOCS`, `contributions.json`, `totals`, `heatmapWeeks`, `Window`, `Decrypt`, `Button`, `Chip`.
- Produces: `<Shot src alt sizes? priority? className? />` (looks up width and height in `images.json`, renders `next/image`), `<BrowserFrame url>`, `<Heatmap weeks accent? />`, `<CountUp value />`, `<Reveal delay?>` (window open animation: scale 0.96 to 1, opacity, 12px rise, 420ms ease out, once), all reused by Task 9.

Section ids and window titles: `projects` "Projects", `functions` "Functions", `playbook` "Built with AI", `contributions` "Contributions", `future` "Future". Hero: decrypting "Cryptic Inc.", the line "We build real software with AI, then show you exactly how.", buttons See projects (`#projects`) and AI Playbook (`#playbook`), count up stats (projects count, total commits, lines shipped from additions, active days, all from `totals`), and an endless marquee of the six project names. Project cards: Visit only when `live`, Source only when public, Details always (`/projects/<slug>`); tilt and glow only for fine pointers without reduced motion. FunctionsTour: tab per project (`role="tablist"`, arrow keys), sticky screenshot on desktop, stacked image under each function below 768px. PlaybookSection: the five playbook H2s as a numbered timeline with a one line summary each, a stat "N of M commits paired with Claude Code" from `totals`, buttons "Read the playbook" (`/docs/playbook`) and "Build stories" (`/docs`). Contributions: totals row, all repo heatmap (cells fade in on a diagonal), commits per project bars in each accent (grow in), counters count up, milestones timeline merged from all projects sorted by date. Future: a card per `FUTURE` entry with its status chip, pitch and "Grows from" chips linking to those projects. Footer: mark, line "We build software with AI and show exactly how.", `LINKS`, "Presented by Cryptic Inc." and the current year.

- [ ] **Step 1: Build the components and compose `app/page.tsx`.**
- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run lint && npm run build && grep -c 'id="projects"' out/index.html`
Expected: passes, prints `1`; `out/index.html` contains all six project names.

- [ ] **Step 3: Look at it** at 1440px and 375px with Playwright screenshots of `out/` served by `npx serve out -l 4321`; fix overflow or overlap before committing.
- [ ] **Step 4: Commit**

`git add -A && git commit -m "Build the home page sections"`

---

### Task 9: Project pages and lightbox

**Files:**
- Create: `app/projects/[slug]/page.tsx`, `components/project/ProjectHeader.tsx`, `components/project/Gallery.tsx`, `components/project/SetupBlock.tsx`, `components/project/Credits.tsx`, `components/project/RepoStats.tsx`, `components/ui/Lightbox.tsx`

**Interfaces:**
- Consumes: `getProject`, `neighbors`, `PROJECTS`, `docsForProject`, `contributions.json`, `heatmapWeeks`, `Shot`, `BrowserFrame`, `Heatmap`, `Window`, `Decrypt`.
- Produces: `<Lightbox images={{src, alt}[]} index onClose onIndex />` (dialog, Escape closes, arrow keys move, focus restored).

`generateStaticParams` returns all six slugs, `dynamicParams = false`, `generateMetadata` uses the name and tagline. Sections in spec order: header, overview, What's inside (gallery), How it was built with AI (first paragraph of the build doc's "What it is" plus Read and Download buttons), Set it up yourself (public: `setupSummary` list plus Read guide, Download `.md`, Open on GitHub; private: a "Source is private" note), Credits (only when `credits`), repo stats with mini heatmap, previous and next.

- [ ] **Step 1: Build the page and components.**
- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run lint && npm run build && ls out/projects/*.html | wc -l && grep -c "github.com/kingxxasavan" out/projects/jarvis.html out/projects/cryptic-hub.html`
Expected: `6`, and `0` matches in both private pages. `out/projects/polyos.html` contains "Perlexity".

- [ ] **Step 3: Commit**

`git add -A && git commit -m "Add project pages with gallery, lightbox, setup and credits"`

---

### Task 10: Docs hub and reader

**Files:**
- Create: `app/docs/page.tsx`, `app/docs/[slug]/page.tsx`, `components/docs/Markdown.tsx`, `components/docs/Toc.tsx`

**Interfaces:**
- Consumes: `DOCS`, `getDoc`, `readDoc`, `extractToc`, `getProject`.

`/docs`: two windows, "Setup guides" and "Built with AI", each row title, project, summary, Read and Download. `/docs/[slug]`: `generateStaticParams` from `DOCS`, `dynamicParams = false`; top bar with Back to project (when `project`), Download `.md`, Open on GitHub (setup docs only); sticky `Toc` on desktop (collapsible above content below 1024px) highlighting the heading in view; `Markdown` renders with `react-markdown`, `remarkGfm`, `rehypeSlug`, no `rehype-raw`; styled headings, lists, tables (horizontally scrollable inside their own box), code blocks (scrollable, mono), blockquotes; links open external URLs in a new tab with `rel="noreferrer"`.

- [ ] **Step 1: Build the pages and components.**
- [ ] **Step 2: Verify**

Run: `npm run build && ls out/docs/*.html | wc -l && grep -c 'id="install-on-a-pc-or-vm"' out/docs/polyos-setup.html`
Expected: `11` and `1`.

- [ ] **Step 3: Commit**

`git add -A && git commit -m "Add the docs hub and markdown reader"`

---

### Task 11: Not found, README, Vercel config and end to end check

**Files:**
- Create: `app/not-found.tsx`, `README.md`, `vercel.json`, `scripts/e2e.mjs`

**Interfaces:**
- Consumes: the built `out/` folder.

`not-found.tsx`: a centered window titled "Not responding", text "This page stopped responding or never existed.", button "Back to the desktop" to `/`. `vercel.json`: `{ "framework": "nextjs", "headers": [...] }` with `Content-Security-Policy: default-src 'self'; img-src 'self' data: https://raw.githubusercontent.com; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'`, `Strict-Transport-Security: max-age=63072000; includeSubDomains`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, plus `Content-Disposition: attachment` for `/downloads/(.*)`. README: what the site is, `npm` scripts, where to edit projects, roadmap, links and docs, how to rerun `images.mjs`, `capture.mjs`, `contributions.mjs`, `sync-docs.mjs`, the unverified links to check, and deploying (Vercel Framework Preset Next.js).

`scripts/e2e.mjs <baseUrl>` checks, failing with a non zero exit and a list of failures:
1. `/` shows six project cards and no console errors.
2. Each taskbar section button brings its section into view.
3. Docs button opens the menu; Escape closes it and focus is back on the button; clicking "PolyOS 7 for Debian setup" opens `/docs/polyos-setup`.
4. `GET /downloads/polyos-setup.md` returns 200 with markdown text.
5. `Ctrl K`, typing "jarvis", Enter lands on `/projects/jarvis`.
6. Functions tabs switch the visible function list.
7. Lightbox opens from the PolyOS gallery and closes with Escape.
8. `/projects/nope` and `/docs/nope` show the Not responding page.
9. At 375×812, for `/`, `/projects/polyos`, `/docs`, `/docs/polyos-setup`: `document.documentElement.scrollWidth <= 375`; the open docs menu and start menu bounding boxes sit inside the viewport.
10. With `reducedMotion: "reduce"`, the hero `h1` text is "Cryptic Inc." immediately after load.

- [ ] **Step 1: Write `scripts/e2e.mjs`** and run it against the current build before writing the rest. Expected: fails on item 8 (no custom not found page yet).
- [ ] **Step 2: Add `not-found.tsx`, `vercel.json`, `README.md`.**
- [ ] **Step 3: Full verification**

Run: `npm test && npm run typecheck && npm run lint && npm run build && (npx serve out -l 4321 & sleep 3; node scripts/e2e.mjs http://localhost:4321; kill %1)`
Expected: every command passes and e2e prints all 10 checks passing.

- [ ] **Step 4: Commit and push**

`git add -A && git commit -m "Add not found page, README, Vercel config and end to end checks" && git push -u origin claude/sharp-goodall-u904p0`
