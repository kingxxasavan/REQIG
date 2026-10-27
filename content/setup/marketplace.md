> Snapshot of the README in [kingxxasavan/Cryptic](https://github.com/kingxxasavan/Cryptic/tree/claude/intelligent-bohr-y60wy8) (claude/intelligent-bohr-y60wy8).

# Cryptic

A dark, premium marketplace for AI craft: Claude Skills, GPTs, prompt packs, context engineering guides and AI courses.

Built with Next.js 16, React 19, Tailwind CSS 4 and Firebase. Runs as a working demo: checkout is simulated and no money moves.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests (vitest)
npm run typecheck
npm run lint
npm run build
```

End to end click through against a running server (uses the Chromium at `CHROME_PATH`, defaults to `/opt/pw-browsers/chromium`):

```bash
npm run build && npm start &
node scripts/e2e.mjs http://localhost:3000
```

## How data works

* The seeded catalog (40 products, 10 creators) lives in `lib/data` so pages are static and fast.
* Accounts, purchases, reviews and new listings go to Firebase (project `chat-f6735`) under `/cryptic` in the Realtime Database.
* If Firebase isn't set up or can't be reached, `lib/store/hybrid.ts` falls back to browser storage and the badge in the footer says "Demo mode".

### Turning Firebase on fully

1. Firebase console → Authentication → Sign in method → enable **Email/Password**.
2. Authentication → Settings → Authorized domains → add your Vercel domain.
3. Realtime Database → Rules. **Don't replace the whole thing**, other apps may use this database. Copy only the `"cryptic": { ... }` block from `database.rules.json` and paste it inside your existing `"rules": { ... }` next to the rules already there, then publish. (Or create a separate database instance just for Cryptic.)

The Firebase web config in `lib/firebase.ts` is public by design. Access is controlled by the rules file.

## Demo checkout

* Test card `4242 4242 4242 4242`, any future expiry, any CVC.
* `4000 0000 0000 0002` gets declined.
* Code `CRYPTIC10` takes 10% off.

## Going live later

Swap `app/api/checkout/route.ts` for a Stripe Checkout session and move purchase writes to a webhook so the server, not the browser, records orders.
