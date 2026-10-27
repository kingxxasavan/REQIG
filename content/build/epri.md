# How we built EPRI

2 big commits on September 28, 2026, both written with Claude Code: the whole app in the first, a redesign with sign in, the advisor dock and the guided tour in the second.

## What it is

EPRI is a financial manager and advisor for small local businesses. Every month it reads the business's numbers and says, in plain English, what they made, where the money went and what to fix before a small problem gets expensive.

It has a dashboard with a health score, warnings and a 3 month forecast, monthly reports and a 12 month P&L, budgets, payroll with row level access, suppliers, damages and complaints counted in dollars, a pricing studio, an ad spending planner, an advisor beside every page, and AES-256 encryption with a passphrase only the owner knows. A 3 minute guided tour builds a sample bakery so anyone can try it without an account.

## Timeline

* **September 28, first commit.** The full app: onboarding with a 12 month history import, the dashboard, reports, budgets, payroll, inventory, complaints, the pricing studio and planner, roles and an audit log, encryption, an optional Claude powered advisor, and unit tests for the analytics, parsing, encryption and pricing math.
* **September 28, second commit.** The Helix style redesign (dark glass, violet and cyan, the 3D helix hero), Firebase sign in with email and Google, the advisor as a dock beside every page with history, and the 26 step guided tour with "Do it for me".

## What Claude Code did

* Turned one paragraph about small business owners into the whole product, including the money math and its tests.
* Wrote the encryption: AES-256-GCM with a key made from the passphrase (PBKDF2, 310,000 iterations), held only in memory.
* Built the guided tour so each "Do it for me" goes through the real importer and store, which means the demo exercises the real code.
* Kept spreadsheets exported from EPRI safe from formula injection and checked uploads for type and size.

## What we did by hand

* Decided who it is for, what it must say, and the price plans ($19, $49, $99 a month).
* Turned on Email/Password and Google sign in in Firebase and added the Vercel domain to the authorized domains.
* Chose whether to add an Anthropic API key for Claude powered advisor answers (without it, the built in advisor answers).
* Planned the demo: the tour needs no account and no internet, so it works on a tablet at an event.

## Bugs we hit

* **The advisor matched the wrong topic.** It matched parts of words, so questions landed on the wrong answer. It now matches whole words only.
* **The dock squeezed the page.** Grids did not adapt when the advisor dock opened. They now respond to the space that is left.
* **Unrealistic sample data.** Part time staff in the sample payroll had labels that looked wrong. Fixed so the demo feels real.
* **"This website isn't on the sign in allow list yet."** That is Firebase's way of saying the live domain was never added to Authorized domains. The README now says so in step 2.

## Lessons

* A guided tour that uses the real code is the best demo and a free end to end test.
* Money math needs unit tests before anything else.
* Security you can explain in one sentence ("your books are locked with a passphrase only you know") sells better than a list of algorithms.
