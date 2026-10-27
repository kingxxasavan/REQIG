# Cryptic Inc.

The showcase site for everything Cryptic Inc. has shipped: what each project is, what's inside it (real screenshots), how we built it with Claude Code, and how to run the open source ones yourself.

It's a fully static Next.js site (no backend, no database, no keys) styled after PolyOS: a crystal backdrop, glass windows, a floating taskbar with a Docs menu, and a start menu (press `Ctrl K` or `/`).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests (vitest)
npm run typecheck
npm run lint
npm run build      # static site in out/
```

End to end check of the built site (uses the Chromium at `CHROME_PATH`, default `/opt/pw-browsers/chromium`):

```bash
npm run build && npx serve out -l 4321 &
npm run e2e -- http://localhost:4321
```

## Where things live

| What | File |
| --- | --- |
| The six projects (links, status, features, screenshots, credits) | `lib/data/projects.ts` |
| Roadmap cards | `lib/data/future.ts` |
| Footer links (add your socials here) | `lib/data/links.ts` |
| Docs list | `lib/data/docs.ts` |
| The Claude Code playbook | `content/playbook.md` |
| How we built each project | `content/build/<project>.md` |
| Setup guides (README snapshots) | `content/setup/<project>.md` |
| Contribution stats | `lib/data/contributions.json` (generated) |
| Screenshots | `public/projects/<project>/*.webp` + `lib/data/images.json` (generated) |

Every doc is copied to `public/downloads/` before `dev` and `build`, so the Download buttons serve real `.md` files.

### Links to check

These couldn't be opened from the build machine, so they're marked `verified: false` in `lib/data/projects.ts`. Open them, fix the URL if needed, and flip the flag:

* Foundry: `https://web-templates.vercel.app`
* Cryptic Marketplace: `https://cryptic-marketplace.vercel.app`

## Refreshing content

All scripts take local clones of the project repos. Clones need history: `git -C <clone> fetch --depth=1000 origin <branch>`.

```bash
# contribution stats (counts only, so private repos are fine)
node scripts/contributions.mjs cryptic-hub=../cryptichub jarvis=../jarvis \
  polyos=../poly-os-7-debain-receration foundry=../Web---templates@main \
  epri=.@8bda4a9 marketplace=../Cryptic

# README snapshots for the setup guides (public repos only)
node scripts/sync-docs.mjs polyos=../poly-os-7-debain-receration \
  foundry=../Web---templates@main epri=.@8bda4a9 marketplace=../Cryptic

# screenshots: capture a running app, then convert to WebP and update the manifest
node scripts/capture.mjs foundry http://localhost:3000 /tmp/shots/foundry
node scripts/images.mjs --slug foundry --in /tmp/shots/foundry

# JARVIS diagrams and the crystal backdrop
node scripts/diagrams.mjs && node scripts/images.mjs --slug jarvis --in scripts/diagrams/jarvis
node scripts/backdrop.mjs
```

EPRI used to live in this repo; its code is at commit `8bda4a9`.

## Deploy

Import the repo on Vercel. `vercel.json` sets the framework to Next.js (overriding the old Vite preset) and adds security headers. No environment variables are needed.

## Credits

PolyOS started as a Scratch operating system by Perlexity (AndrewInput on Scratch) and the PIXAPoLY Software team. Its logo and artwork are CC BY-SA 2.0. The crystal backdrop here is our own generated art.
