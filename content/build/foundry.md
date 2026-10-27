# How we built Foundry

44 commits over 6 active days, from September 15 to October 2, 2026, 38 of them written with Claude Code.

## What it is

Foundry is a full stack store for website templates made for specific businesses: online stores, SaaS products, agencies, restaurants, local services, portfolios and more. It has 61 templates in 9 categories from $5 to $15, each one clickable live on phone, tablet or desktop before you pay.

It is a real store, not a landing page with a payment link: accounts, a cart that works without signing in, Stripe checkout, order history, and downloads that check you own the template. If nothing fits, Made for you turns six questions into a brief and builds the site.

## Timeline

* **September 15.** The "$5 Store": a marketplace app and the first six original templates.
* **September 16.** Contrast fixes and tests across every template, then the repo becomes Foundry with nine original templates, full stack checkout, password reset, receipts, reviews and analytics. Still images become live previews with a tour.
* **September 17.** The store moves to Firebase Realtime Database, and the health check learns to name exactly which setting is missing.
* **October 1.** Firebase sign in fixed, downloads require a verified Stripe payment, and 50 licensed open source templates are added as editions.
* **October 2.** A multi page redesign with the Helix hero, every imported template given its own business identity, the online editor everywhere, the brief wizard, and fifteen new original templates in one day.

## What Claude Code did

* Built the store: Next.js route handlers for auth, cart, checkout, webhooks and gated downloads, with prices always recomputed on the server.
* Wrote each original template from a short description, then reviewed the rendered pages (not just status codes) and wrote a contrast audit that loads every page.
* Put two databases behind one interface (libSQL and Firebase Realtime Database) and ran the same tests against both.
* Wrote the diagnostics: `/api/health` reports by name which environment variables are visible, so a broken deploy says what to fix.

## What we did by hand

* Created the Firebase project and service account, and a Stripe account in test mode.
* Added every environment variable in Vercel, and learned to redeploy after adding them.
* Clicked through the store on the live site and reported what failed, including a sign up that only said "Something went wrong".
* Chose which templates to keep, retiring 13 weaker editions.

## Bugs we hit

* **"No entrypoint found" on deploy.** The build passed, then Vercel packaged the project as a plain Node server, left over from an earlier Express app in the same repo. Pinning the framework to Next.js in `vercel.json` fixed it for good.
* **A 500 error on every page.** On Vercel the database variable was not set, so the app fell back to a local file on a read only disk and the storefront crashed. Browsing now works without a database, while purchases still fail loudly.
* **"Something went wrong" on sign up.** The register route had no error handling, so any database problem became a bare 500. It now says what actually happened: not configured, unreachable, or credentials rejected.
* **A malformed service account looked fine.** A present but broken Firebase key took the "configured" path and the real diagnosis was dropped. It now reports the exact reason, like a private key with its line breaks stripped.
* **The tour interrupted everyone.** It opened itself on the first visit. It now starts from a button.

## Lessons

* Every deploy problem we hit was configuration, not code. Make the app tell you which setting is wrong.
* Let reads degrade and writes fail loudly: a visitor should never see an error because the database is down, but a purchase must never silently fail.
* Check the rendered page, not just the status code. Contrast and layout bugs return 200.
