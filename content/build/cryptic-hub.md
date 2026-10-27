# How we built Cryptic Hub

73 commits over 14 active days, from September 9 to October 23, 2026. 45 of them were written with Claude Code; the rest were quick edits we made by hand on GitHub.

## What it is

Cryptic Hub is a private hub for a group of friends, live at [arkia.buzz](https://arkia.buzz). It has messaging between people who have connected, a calendar of events, tasks and reminders, notes that keep each class's notes, flashcards, slides and files together, a shared directory of links, and ARIA: an assistant that researches the live web, reads documents, builds complete projects in a built in IDE, and makes slide decks you can download as PowerPoint.

It is a static site plus a few edge functions on Vercel. Accounts and data live in Firebase, and ARIA runs on NVIDIA NIM behind a server side proxy so the key never reaches a browser.

## Timeline

* **September 9.** The first version goes up: messaging, ARIA, and the serverless functions moved into `api/`. The same day we hit the first real bug (see below).
* **September 10.** ARIA learns to read PDFs and Office files, search without a key and look things up on its own.
* **September 14 to 15.** Games are replaced by Notes. Messaging gets files, GIFs, unsend, groups, profile pictures, friend requests, blocking and an admin console.
* **September 29.** The big rebuild: connection only messaging, a calendar, and an ARIA that builds things. Answers keep running when you leave a chat.
* **October 5 to 6.** Notes for classes, with a folder for each unit.
* **October 21.** ARIA plans and uses tools (search, calculator, weather, currency, your calendar). Glass interface, seasonal themes starting with Halloween.
* **October 22 to 23.** Several skills at once, real downloadable Word, PDF and Excel files, copying a website's code, debugging with ARIA, and a code playground.

## What Claude Code did

* Wrote almost all of the app: the views, the Firebase data layer, the edge functions and ARIA's planner and tools.
* Designed the security rules for the Realtime Database so you can only read conversations you belong to.
* Built ARIA's model routing: racing several free NVIDIA models and answering with whichever speaks first, so "hello" no longer waits on a queued model.
* Made files that really download: real .docx, .pdf and .xlsx built in the browser.
* Diagnosed each bug from the exact error we pasted, then wrote the fix and explained the cause in the commit message.

## What we did by hand

* Created the Firebase project, turned on Authentication, Realtime Database and Storage, and pasted the rules.
* Got an NVIDIA NIM key and put it in Vercel's environment variables, plus the Firebase config.
* Connected the arkia.buzz domain in Vercel and added it to Firebase's authorized domains.
* Edited `bookmarks.json` (the shared directory) and a few model settings straight on GitHub, which is where most of the non Claude commits come from.
* Used each release on Chromebooks and phones and reported what broke, with the exact error.

## Bugs we hit

* **The first message always failed.** Opening a direct message read the conversation before creating it, but the rules only let you read conversations you are already in, so the very first DM between two people was "Permission denied". The fix writes membership first, which the rules allow.
* **A key that did not work.** Pasting the NVIDIA key into Vercel added a trailing newline. The server now trims it.
* **Blank replies.** ARIA runs on a reasoning model that thinks inside hidden tags. When it spent the whole answer thinking, nothing was left to show. Now any real text is kept, and if there is none ARIA says what happened.
* **The wrong model id.** The DeepSeek model we asked for was not on our key. We checked NVIDIA's own snippet for the account and used the id it named, with a bigger reply budget so a thinking model can finish.
* **Phones.** The main area was not height limited, so headers vanished and lists could not scroll on phones. Fixed in the September 29 rebuild.
* **Short answers shown as empty.** A reply that arrived in one network chunk was never parsed. Fixed with ARIA's tool planner on October 21.

## Lessons

* Paste the real error. "Permission denied" plus the code path told Claude exactly where to look.
* Free AI endpoints are slow and flaky; design for it (race models, show what happened) instead of hoping.
* Test with real people on real devices. Most of the phone and messaging bugs only showed up there.
* Small hand edits on GitHub are fine for content like bookmarks; keep code changes in Claude Code sessions with tests.
