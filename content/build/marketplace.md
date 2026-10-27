# How we built Cryptic Marketplace

11 commits, all written with Claude Code. The whole marketplace went from spec to a reviewed, tested build on October 21, 2026.

## What it is

Cryptic Marketplace is a dark, premium store for AI craft: Claude Skills, custom GPTs, prompt packs, context engineering guides and AI courses, with 40 seeded products from 10 creators. Buyers browse, review and check out, then find everything in a library with a lesson player for courses. Creators get a studio with sales charts and can publish a listing in about two minutes. It runs as a demo, so checkout uses test cards and no money moves.

## Timeline

* **October 21, morning.** Brainstorm, then the design spec and the implementation plan are written and committed before any code.
* **October 21, build.** Seven tasks from the plan, each committed with its tests: the Next.js scaffold with the seeded catalog and cart logic, the Firebase data store with a local fallback, the site shell and home page, explore and product pages, cart and demo checkout, auth and the creator studio, and an end to end click through.
* **October 21, review.** A review pass found real issues and one commit fixed them all.
* **October 26.** The spec for the Cryptic Inc company site was added, which became this site.

## What Claude Code did

* Ran the superpowers flow end to end: brainstorm, spec, plan, then test first development task by task.
* Wrote the store, the catalog, the checkout with card validation and promo codes, and the creator studio.
* Wrote unit tests with Vitest and a Playwright script that clicks through the whole site.
* Reviewed its own work as a fresh reviewer and fixed what it found.

## What we did by hand

* Answered the brainstorm questions: who buys, what they buy, and what "premium" should look like.
* Read and approved the spec and the plan before any code was written.
* Turned on Email/Password sign in in Firebase and pasted only the new app's block into the shared database rules, so the other apps using that database kept working.

## Bugs we hit

* **Sign in broke when the database said no.** Firebase sign in failed whenever a database read was denied. Auth and data now fall back separately.
* **Shared data needed guarding.** Listings and reviews from the shared database are now checked by the rules and cleaned when read.
* **Redirect tricks.** The login redirect now rejects control characters, so a crafted link can't send people somewhere else.
* **Demo logins collided.** Every browser now gets its own demo account.

## Lessons

* A written spec and plan make a one day build possible: every task was small, tested and committed.
* A review pass by a fresh pair of eyes (even an AI one) finds the security issues that the builder missed.
* When several apps share one database, add rules, never replace them.
