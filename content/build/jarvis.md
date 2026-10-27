# How we built JARVIS

15 commits over 2 days, October 8 and 9, 2026, every one of them written with Claude Code. The code is private, so this page tells the story without it.

## What it is

JARVIS is a private AI assistant for one owner. You open it from any browser (a school Chromebook, a phone, a laptop) and chat or talk to it. It remembers what matters, plays YouTube, reads your calendar, tasks and messages from arkia.buzz, and searches the web.

It also reaches your own computers. A small Python agent on the laptop polls for jobs, so JARVIS can open apps, stream the laptop's Chrome and desktop into the browser, browse and move files, and have Claude Code build whole projects on the laptop while the log streams back live. Nothing on the laptop is exposed to the internet: the agent only ever reaches out.

## Timeline

* **October 8.** The first commit lands the whole system: the Next.js web HUD with owner only login and two factor, NVIDIA NIM with Ollama Cloud as a fallback, a streaming tool loop, adaptive memory, arkia.buzz, YouTube, and the device agent.
* **October 9, morning.** Deploying it for real: a `vercel.json` that ships only the web app, then fixes for the login page, the Supabase URL and table permissions.
* **October 9, afternoon.** Apps: the laptop's real Chrome streamed into JARVIS with sound and downloads, through a Cloudflare Tunnel with short lived passes.
* **October 9, evening.** A one click Windows installer, the Files and Code tabs, cloud files, crash protection, and fixes for streaming lag and audio.

## What Claude Code did

* Designed the split: a website on Vercel, Supabase for data and login, and an outbound only agent on the laptop.
* Wrote the web app, the memory system (a background pass after every reply that adds, updates or deletes facts, and recall that blends meaning with keywords), and the tool loop.
* Wrote the Python agent, the app streaming server (JPEG frames from Chrome's DevTools screencast and sound from Windows loopback over one WebSocket), and the installer.
* Read each deploy error we pasted and fixed the cause, explaining it in the commit.

## What we did by hand

* Created the Supabase project, ran `schema.sql` in the SQL Editor, turned off public sign ups and added the one owner account.
* Got the NVIDIA NIM and Ollama keys and generated the encryption key, then put every variable from `.env.example` into Vercel with `web` as the root directory.
* Ran `install.cmd` on the laptop, signed in to GitHub and Claude when it asked, and pasted the pair code from JARVIS.
* Tried it from the Chromebook and phone, and reported lag, crashes and sound problems.

## Bugs we hit

* **The build failed on the login page.** The Supabase client was created while rendering, so building the page failed whenever the keys were not available at build time. It is now created only in the browser.
* **"Invalid path specified in request URL".** The Supabase URL we pasted was the REST endpoint ending in `/rest/v1/`. JARVIS now keeps only the origin, so either form works.
* **"Permission denied for table conversations".** Newer Supabase projects no longer give the API roles access to tables by default. The schema now grants it explicitly.
* **Laggy streaming and broken sound.** Frames queued up behind each other, and the page decoded audio from an odd byte offset, which failed on every packet. Now each viewer only gets the newest frame, and audio is read past the header.
* **Crashes and blank pages.** Next's "This page couldn't load" replaced the app. Each view now has its own error boundary, and browser errors are sent to the Vercel logs with the real message.
* **Tasks that looped.** Some models write tool calls as text. Those are now parsed and run, and a repeated call in the same turn returns the first result instead of running again.

## Lessons

* Deploying is its own project. Half of day two was making the same code work on a real Vercel and Supabase.
* Copy the exact value the setup asks for (the origin, not the endpoint), or make the code forgiving.
* Report how it feels, not only errors. "The stream is laggy" led to a real fix.
* Owner only and outbound only are good defaults for anything that controls your computer.
