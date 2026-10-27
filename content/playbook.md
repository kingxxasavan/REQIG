# The Claude Code playbook

Every project on this site was built by pairing with Claude Code. Across the six repos, 177 of 215 commits were written together with Claude. This is how we work, step by step, including the parts no AI can do for you.

Think of Claude Code as a very fast engineer who has never seen your project and cannot click around your accounts. It writes code, runs tests, reads errors and fixes them. You bring the idea, the accounts, the keys, the real devices and the final call on whether something is good.

## The flow

We run almost every project through the same six steps. Skipping one is how projects go sideways.

1. **Idea.** Write one paragraph: what it is, who it is for, and what "done" looks like. "A financial manager for small businesses that says in plain English what they made and what to fix" is a good idea. "A finance app" is not.
2. **Brainstorm.** Ask Claude Code to brainstorm with you before writing any code. It asks one question at a time (who uses it, on what device, what can be cut) and you answer. With the superpowers skills installed this happens automatically.
3. **Spec.** Claude writes the agreed design into `docs/superpowers/specs/<date>-<name>-design.md`: pages, data, look, what is out of scope. Read it properly. This is the cheapest moment to change your mind.
4. **Plan.** Claude turns the spec into small tasks, each with the exact files, the test that proves it, and a commit. You can see one in `docs/superpowers/plans/` in the Cryptic repo.
5. **Build.** Claude works through the plan task by task: write a failing test, make it pass, commit. You watch, answer questions and look at screenshots.
6. **Test and ship.** Run the tests, click through it yourself on a real device, deploy to Vercel, and fix what real use finds.

## Guiding Claude Code

Most of the difference between a messy result and a great one is how you steer.

**Say your constraints out loud.** "It has to run smoothly on a school Chromebook", "no backend", "free tier only", "my users are on phones". Claude cannot guess these, and they change every decision.

**Show, don't describe.** Paste a screenshot of the design you like, the bug you see, or the site you want to match. For PolyOS we described the original Scratch screens and sent pictures, and Claude measured the palette from them.

**Ask for the plan before the code.** "Brainstorm this with me first" or "write a spec, don't code yet" stops it from building the wrong thing quickly.

**Make it prove things.** Ask for tests with every feature and a browser click through at the end. "Show me the test failing first" catches tests that pass for no reason.

**One branch per feature.** Keep each change small enough to review. Claude Code works on its own branch and opens a pull request when you ask, so `main` only gets finished work.

**Read the diff.** You do not need to understand every line, but skim what changed. If a "small fix" touched twenty files, ask why.

**Ask it to explain.** "Why did that break?" and "what are the trade-offs?" are free. The answers make you a better builder and catch bad ideas early.

**Correct it plainly.** "That's not what I meant: the dock should go to each section, especially the docs" is perfect feedback. Specific beats polite.

**Keep a memory of rules.** Things you always want ("no dashes in copy", "dark theme only") go in a `CLAUDE.md` file in the repo so every session follows them.

## What you have to do yourself

Claude Code cannot sign into your accounts, so every project has a list of jobs only you can do. Expect each of these, and do them before you test the live site.

**Firebase (Cryptic Hub, EPRI, Foundry, Marketplace)**

1. Create a project at console.firebase.google.com and add a Web app to get the config.
2. Authentication > Sign-in method: turn on **Email/Password** and **Google** if you use them.
3. Authentication > Settings > **Authorized domains**: add your Vercel domain. Forgetting this is the number one reason "sign in works locally but not live".
4. Realtime Database > Rules: paste the rules Claude wrote. If several apps share one database, paste only the new app's block next to the existing rules instead of replacing everything.

**Supabase (JARVIS)**

1. Create a project at supabase.com.
2. SQL Editor: paste and run the whole `schema.sql`. It is safe to run again after updates.
3. Authentication > Providers > Email: turn **off** "Allow new users to sign up" for a private app, then add your own user by hand.
4. Project Settings > API: copy the Project URL (just the origin, not the `/rest/v1/` endpoint) and the publishable key.

**API keys**

* NVIDIA NIM keys from build.nvidia.com, Ollama keys from ollama.com/settings/keys, Stripe test keys from the Stripe dashboard in test mode.
* Keys go in environment variables, never in the code. Claude writes `.env.example` listing the names; you fill in the values.

**Vercel**

1. Import the GitHub repo at vercel.com/new.
2. Set the **Root Directory** if the app lives in a folder (JARVIS uses `web`).
3. Settings > Environment Variables: add every name from `.env.example`, then **redeploy**. A variable added without a redeploy does nothing.
4. If the deploy fails after a successful build, check the Framework Preset matches the project (Next.js, Vite).

**Domains and DNS**

Buy the domain, add it in Vercel > Domains, and copy the DNS records Vercel shows into your registrar. Then add the domain to Firebase's authorized domains too.

## Testing, errors and bugs

AI written code has bugs like any code. The trick is a fast loop from "something is wrong" to "fixed and it stays fixed".

1. **Run the tests.** Every project has `npm test` (or `python main.py test` for PolyOS). Run them before and after every change.
2. **Use it like a real person, on the real device.** Most of our best bug reports came from using the live site on a Chromebook or phone, or installing the PolyOS ISO in a virtual machine.
3. **Open the console.** In Chrome press F12 and look at Console and Network. Red text is gold.
4. **Copy the exact error.** Paste the whole message and a screenshot into Claude Code, with what you did right before it. "Sign up says Something went wrong" plus the console line beats any description.
5. **Ask for the root cause, not a patch.** "Find why this happens before changing anything." A fix that hides the symptom comes back later.
6. **Confirm the fix yourself** on the same device where it broke.
7. **Lock it in with a test** that failed before the fix and passes after, so it can never quietly return.

When a deploy breaks, look at Vercel > Deployments > the failed build log, and Vercel > Logs for runtime errors. Paste those into Claude Code the same way.

## Examples from our projects

* **Permission denied on the first message (Cryptic Hub).** The first direct message between two people always failed. Claude traced it to the app reading a conversation before creating it, which the database rules forbid. The fix wrote membership first. Lesson: paste the real error, let it find the cause. [How we built Cryptic Hub](/docs/cryptic-hub-build)
* **Blank replies from a reasoning model (Cryptic Hub).** ARIA sometimes answered nothing. The model spent its whole budget "thinking" inside tags that the app hides. Now the app salvages any real text and says what happened instead of going blank.
* **The 500 error homepage (Foundry).** The live store crashed because the database variable was never set on Vercel. The fix let browsing work without a database, and a health check now names exactly which variable is missing. [How we built Foundry](/docs/foundry-build)
* **"Invalid path" from Supabase (JARVIS).** A pasted URL included `/rest/v1/`. The app now uses only the origin. Lesson: copy the exact value the docs ask for. [How we built JARVIS](/docs/jarvis-build)
* **The black screen after sleep (PolyOS).** The computer fell asleep before the lock screen finished drawing. Found by testing on real hardware, fixed in PolyOS 1.1.1. [How we built PolyOS](/docs/polyos-build)
* **Spec to tested marketplace in a day (Cryptic Marketplace).** Brainstorm, spec, plan, then seven tested build tasks and a review pass, all on October 21. [How we built Cryptic Marketplace](/docs/marketplace-build)
