# Cryptic Inc showcase site: design

## Goal

Replace everything in this repo (the EPRI app) with the Cryptic Inc showcase website. It presents every project Cryptic Inc has made: what each one is, what is inside it (with real screenshots), a link to the live site, and how it was built with AI. Software that people can run themselves also gets its GitHub link and its setup guide (the README), readable on the site and downloadable as a `.md` file.

The look is the PolyOS design language (crystal backdrop, glass windows, a floating taskbar, a start menu) applied to a showcase site for all the projects. It is not a fake operating system and it is not a PolyOS site.

This supersedes `docs/superpowers/specs/2026-10-26-cryptic-inc-site-design.md` in `kingxxasavan/Cryptic`, which was written but never built. The company site now lives here; the marketplace stays in its own repo.

## What the user decided

* Branding is **Cryptic Inc**. The projects are presented as Cryptic Inc work.
* The repo is wiped. Old code stays in git history.
* **Private repos** (Cryptic Hub, JARVIS) are showcase only: screenshots, features and the AI build story, with a "Source is private" chip. No GitHub link and no setup guide for them.
* The **AI docs** are a practical playbook: the steps, tips and tricks for guiding Claude Code to build websites and software, plus the work a person has to do themselves (setting up their own database and authentication, keys, testing, finding errors and bugs). Each project also gets its own build story.
* **No Firebase and no backend.** No collaboration form. The site is fully static.
* Sections kept from the Cryptic Inc spec: **Contributions**, **Future projects**, **Functions tour**.
* **PolyOS credit:** Perlexity (AndrewInput on Scratch) created the original PolyOS Scratch project. PolyOS for Debian started as a birthday present for him. He is credited as original creator and collaborator, next to the PIXAPoLY Software team.
* The **taskbar** has a button for every section, and a **Docs** button that opens a menu listing every guide so visitors can jump straight to one.

## Assumptions

* The Vercel project `reqig` deploys this repo, so after this reaches `main` its URL shows the showcase site. EPRI therefore has no live link; its source link points to this repo at commit `8bda4a9`, the last EPRI commit.
* Live links that could not be checked from the build machine (its network blocks `vercel.app`) use the Vercel project names and are marked `verified: false` in the data file: `cryptic-marketplace.vercel.app`, `web-templates.vercel.app`. Known links: `https://arkia.buzz` (Cryptic Hub), `https://poly-os-7.vercel.app` (PolyOS).
* JARVIS only lets its owner sign in, so it has no Visit button.
* The PolyOS prism and amethyst wallpapers are third party photos with unclear licenses (see PolyOS `CREDITS.md`), so the site uses its own generated crystal backdrop.
* Contribution stats include the private repos, but only counts (commits, lines, days) are published, never their code.
* No contact email is published. The links block starts with the GitHub profile `https://github.com/kingxxasavan`.

## The projects

| Slug | Name | Repo | Live | Source | Status |
| --- | --- | --- | --- | --- | --- |
| `cryptic-hub` | Cryptic Hub | kingxxasavan/cryptichub | https://arkia.buzz | private | Live |
| `jarvis` | JARVIS | kingxxasavan/jarvis | none (owner only) | private | Live, owner only |
| `polyos` | PolyOS 7 for Debian | kingxxasavan/poly-os-7-debain-receration | https://poly-os-7.vercel.app | public | Live |
| `foundry` | Foundry | kingxxasavan/Web---templates | https://web-templates.vercel.app (unverified) | public | Live |
| `epri` | EPRI | kingxxasavan/REQIG @ `8bda4a9` | none | public | Source only |
| `marketplace` | Cryptic Marketplace | kingxxasavan/Cryptic | https://cryptic-marketplace.vercel.app (unverified) | public | Demo |

Each project has: name, tagline, description, year, category, accent color, stack, status, links, cover image, 3 to 6 functions (title, short explainer, screenshot), a build story doc, and for public repos a setup guide doc. PolyOS also has a credits block.

## Pages

### `/` home

1. **Hero.** "Cryptic Inc." decrypting in, one line about what Cryptic Inc builds, buttons (See projects, AI Playbook), real stats (projects, commits, lines shipped, active days), and a marquee of project names.
2. **Projects** (`#projects`). Six window cards: screenshot in a browser frame, status chip, name, tagline, stack chips, and Visit, Source and Details buttons. Visit is hidden without a live link; Source is hidden for private repos.
3. **Functions tour** (`#functions`). A tab per project. Sticky scroll: the left side lists that project's functions, the right side crossfades to the matching screenshot.
4. **Built with AI** (`#playbook`). The playbook steps as a short timeline with a few headline stats (for example how many commits were paired with Claude Code), linking to the full playbook doc and the per project build stories.
5. **Contributions** (`#contributions`). Totals row, a 53 week heatmap across all repos, commits per project bars in each project's accent, and a milestone timeline.
6. **Future** (`#future`). Roadmap cards with a status (Exploring, Designing, Next up), a short pitch and the project each one grows from.
7. **Footer.** Mark, short line, links block, "Presented by Cryptic Inc." and the year.

### `/projects/[slug]`

Statically generated for all six.

1. Header in the project accent: name (decrypting), tagline, status, Visit and Source buttons, large screenshot.
2. Overview: what it is and who it is for.
3. **What's inside:** a gallery of every function (screenshot plus explainer). Clicking a screenshot opens it full size in a lightbox.
4. **How it was built with AI:** a summary of the build story with a button to read the full doc.
5. **Set it up yourself** (public repos only): a short summary of what you need, buttons to read the full setup guide, download it as `.md`, and open the repo on GitHub. Private repos show "Source is private" instead.
6. **Credits** (PolyOS only): Perlexity (AndrewInput on Scratch) as original creator and collaborator, the birthday story, the PIXAPoLY Software team, and a link to `https://scratch.mit.edu/users/PolyOS/`.
7. Repo stats (commits, lines, active days, first and last commit) and a mini heatmap.
8. Previous and next project.

### `/docs`

The docs hub. Two groups: **Setup guides** (PolyOS, Foundry, EPRI, Marketplace) and **Built with AI** (the playbook plus the six build stories). Each row has Read and Download `.md` buttons.

### `/docs/[slug]`

The reader. Slugs: `playbook`, `<project>-build` for all six, `<project>-setup` for the four public ones. Layout: a sticky table of contents built from the headings, the rendered markdown, and a top bar with Download `.md`, Open on GitHub (setup guides only) and Back to project.

### Not found

A PolyOS style "app not responding" window with a button home.

## Taskbar and start menu

**Taskbar.** Floating at the bottom like the PolyOS taskbar. Left: the Cryptic mark, which opens the start menu. Middle: Projects, Functions, Playbook, Docs, Contributions, Future. Right: a live clock and date. Section buttons scroll to that section on the home page, or go to `/#section` from other pages. A dot slides to the section in view. Icons grow slightly on hover. On phones it shows icons only.

**Docs menu.** The Docs button opens a popup above the taskbar, styled like the PolyOS tray popups: every guide grouped as on `/docs`, each with Read and Download, plus "All docs". Escape or a click outside closes it.

**Start menu.** Opened by the mark, `/` or `Ctrl K`. A search field plus pinned tiles for the six projects, the docs and the sections. Typing filters across all of them. Arrow keys move, Enter opens, Escape closes. Focus is trapped while open and returns to the opener.

## Visual system

**Backdrop.** A near black violet base (`#07060c`) with a generated low poly crystal image (violet, indigo and cyan facets, darkened) fixed behind everything, slow drifting aurora glows on top, and film grain. Generated once by `scripts/backdrop.mjs` into `public/backdrop.webp`.

**Windows.** Every section sits in a glass window: 20px radius, surface `rgb(17 15 27 / 0.66)`, 1px hairline `rgb(255 255 255 / 0.08)`, an inner top highlight, and a title bar with an app icon, title and decorative minimize and close dots. Real `backdrop-filter` blur is only used on the taskbar, the menus and sticky title bars so it stays smooth on a school Chromebook.

**Color tokens.**

| Token | Value | Use |
| --- | --- | --- |
| `ink` | `#07060c` | page base |
| `glass` | `rgb(17 15 27 / 0.66)` | windows |
| `glass-strong` | `rgb(22 20 34 / 0.86)` | taskbar, menus |
| `line` / `line-strong` | white at 8% / 14% | hairlines |
| `fg` | `#f4f3fb` | text |
| `muted` | `#a9a7bd` | secondary text |
| `faint` | `#6f6d85` | labels |
| `accent` | `#7c8cff` | links, focus, active |
| `violet` | `#a78bfa` | highlights |
| `cyan` | `#67e8f9` | stats, live dots |
| `pink` | `#f0abfc` | gradient end |
| `ok` | `#86efac` | success |

Signature gradient: `linear-gradient(120deg, #5b7cfa, #8b5cf6 45%, #d946ef)`. Each project has its own accent for its card glow and page header.

**Fonts.** Sora for display, Geist for UI and body, Geist Mono for labels, stats and the decrypt effect. Self hosted from npm packages (`geist`, `@fontsource-variable/sora`) so the build does not depend on Google Fonts.

## Motion

* **Decrypt text.** The hero title, section headings and project names scramble through glyphs and resolve left to right when they first come into view; project names scramble again on hover. Width is reserved so nothing shifts.
* **Window open.** Windows enter with scale 0.96 to 1, a fade and a 12px rise, 420ms ease out, staggered within a group, once only.
* **Hero.** Cursor spotlight on the backdrop, aurora drift, count up stats, endless marquee.
* **Project cards.** Up to 6 degree tilt toward the pointer, the screenshot moves the other way for depth, accent glow follows the pointer. Off on touch and with reduced motion.
* **Functions tour.** Screenshot crossfades and scales in as the matching function scrolls into place.
* **Contributions.** Heatmap cells fade in on a diagonal, bars grow, counters count up.
* **Taskbar.** Hover magnify, the active dot slides between icons.
* **Reduced motion.** Everything above becomes a plain fade or nothing. Decrypt shows the final text immediately.
* Only `transform` and `opacity` animate. Animation uses the `motion` package.

## Content

### Data files

* `lib/data/projects.ts`: the six projects (typed `Project`), including links with a `verified` flag.
* `lib/data/future.ts`: drafted future projects.
* `lib/data/links.ts`: links block, starting with the GitHub profile.
* `lib/data/docs.ts`: the docs registry (slug, title, group, project, markdown file, GitHub URL).
* `lib/data/contributions.json`: generated by `scripts/contributions.mjs`.

Drafted future projects (the user edits them later):

1. **Cryptic ID**: one account across Hub, JARVIS, EPRI and Foundry. Grows from Hub and JARVIS sign in.
2. **PolyOS Web**: try the full PolyOS desktop in the browser, no install. Grows from `main.py dev`.
3. **ARIA Studio**: ARIA's IDE as its own app with one click deploys. Grows from Cryptic Hub.
4. **JARVIS Mobile**: a phone app with voice, push reminders and device control. Grows from JARVIS.
5. **Foundry Builder**: mix sections from the templates into your own site and download it. Grows from Foundry.
6. **EPRI Teams**: one view for accountants handling many local businesses. Grows from EPRI.

### Docs (`content/`)

* `content/playbook.md`: **How we build with Claude Code.**
  1. The flow: idea, brainstorm, spec, plan, build, test, ship, and how each step looks in practice.
  2. Tips and tricks for guiding Claude Code: give screenshots, state constraints ("runs on a school Chromebook"), ask for tests and a browser click through, keep one branch per feature, review the diff, ask it to explain before it changes.
  3. **What you have to do yourself:** create the Firebase or Supabase project, turn on the sign in providers, add authorized domains, write database rules or schema, create API keys (NVIDIA NIM, Ollama, Stripe test mode), set environment variables in Vercel, connect domains and DNS. Each with the exact console path.
  4. **Testing, errors and bugs:** run the tests, try it on the real device, open the console, copy the exact error and a screenshot back to Claude Code, ask for the root cause, confirm the fix, add a test so it stays fixed.
  5. Real examples from the six projects for each step.
* `content/build/<slug>.md` for all six: the build story drafted from the repo's real git history, commit messages, and the specs and plans in the repo. Covers the timeline, what Claude Code did, what was done by hand (database, auth, keys, domains), real bugs found and fixed, and lessons.
* `content/setup/<slug>.md` for the four public repos: a snapshot of the repo's README. Relative links are rewritten to the repo on GitHub and relative images to `raw.githubusercontent.com`. `scripts/sync-docs.mjs` refreshes the snapshots from local clones.
* Every doc is also copied to `public/downloads/<doc-slug>.md` at build time so the Download button serves a real file.
* Markdown renders with `react-markdown`, `remark-gfm` and `rehype-slug`. Raw HTML in markdown is not rendered.

### Images

* Cryptic Hub: `assets/shots/*.jpg` from its repo (home, ARIA, calendar, notes, hallows).
* PolyOS: `docs/screenshots/*.jpg` from its repo (desktop, start menu, PolyMarket, files, settings, Vara, installer, and more).
* Foundry: `public/thumbs/*.webp` from its repo, plus captures of the store pages.
* Marketplace: captured with Playwright from a local build of `kingxxasavan/Cryptic`.
* EPRI: captured with Playwright from a local build of this repo at `8bda4a9`, using its guided tour sample bakery.
* JARVIS: captured with Playwright from a local run of `web/`. It needs Supabase to get past sign in, so if only the sign in screen renders, the project uses that plus a designed architecture diagram, and the user is told.
* All images are converted to WebP (max 1600px wide) by `scripts/images.mjs` into `public/projects/<slug>/`. Static export serves them with `next/image` set to unoptimized, with width, height and lazy loading.

### Contributions

`scripts/contributions.mjs <repo paths...>` reads `git log --numstat` from local clones and writes, per repo: commits, additions, deletions, first and last commit, active days, commits co-authored with Claude, and daily counts for the last 53 weeks. Pure aggregation lives in `lib/contributions.ts` so it can be unit tested. Milestones (first commit and biggest releases per project) are in the projects data. Rerun any time to refresh.

## Build

* Next.js (App Router) with `output: "export"`, Tailwind CSS 4, TypeScript, `motion`.
* `vercel.json` sets `framework: "nextjs"` and security headers (CSP allowing self plus `raw.githubusercontent.com` images, HSTS, no framing).
* New `README.md`: what the site is, how to edit projects, docs and links, how to refresh contributions, images and docs, and how to deploy.
* Removed: the whole EPRI app (`src/`, `api/`, `public/`, `tests/`, `index.html`, `vite.config.js`, `.env.example`, `package.json` and lock file). It stays in git history at `8bda4a9`.

## Accessibility and performance

* Keyboard reachable taskbar, docs menu, start menu and lightbox; visible focus; alt text on every screenshot; AA contrast on glass; `prefers-reduced-motion` respected.
* Images pre sized WebP and lazy loaded, self hosted fonts, no 3D library, blur only on small surfaces.

## Testing

* Vitest: every project has a unique slug, valid `https` links, image files that exist in `public/`; public projects have a setup doc and private ones have no source link or setup doc; every doc in the registry has its markdown file; table of contents extraction; contribution aggregation math.
* `npm run typecheck`, `npm run lint`, `npm run build`.
* Playwright click through on the built site: home renders all six projects; each taskbar button reaches its section; the Docs menu opens a guide; the Download link returns the `.md` file; the start menu search opens a project page; functions tabs switch; the lightbox opens and closes with Escape; no console errors; no horizontal scroll at 375px.

## Out of scope

A contact or collaboration form, any backend or database, a blog, a light theme, i18n, a CMS.
