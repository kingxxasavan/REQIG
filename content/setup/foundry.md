> Snapshot of the README in [kingxxasavan/Web---templates](https://github.com/kingxxasavan/Web---templates/tree/main) (main).

# Foundry — a full-stack template store

A working storefront that sells original designs and adapted open-source website templates as
downloadable source. Accounts, cart, checkout, order history and
ownership-gated downloads — not a landing page with a Gumroad link.

**One-time pricing: $5 · $10 · $15 per template, $35 for everything.** No subscriptions.

---

## Pricing

| Tier | Price | What's in it |
|---|---|---|
| **Starter** | **$5** | Focused one-to-three page sites, no build step |
| **Pro** | **$10** | Multi-page sites, with the online editor included |
| **Premium** | **$15** | Complete business sites and app-grade builds |
| **All-access** | **$35** | Every template, including future releases |

Templates are grouped into nine business categories (e-commerce, SaaS & apps,
agencies, restaurants, local services, portfolios, blogs, personal sites,
events). A done-for-you "Made for you" setup is $15 and is paid through the
same Stripe checkout.

Prices live in `lib/catalog.js` and are re-synced into the database on every
boot. The client never sends an amount: totals are always recomputed
server-side from the catalogue at checkout.

## The stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16, App Router | Route handlers give a real API beside the pages |
| Database | Firebase Realtime Database **or** libSQL | Two backends behind one interface, chosen by environment variables — see below |
| Auth | Firebase Authentication + httpOnly cookies | Firebase manages credentials and password resets |
| Payments | Stripe Checkout with verified payment confirmation | The whole flow is exercisable before a Stripe account exists |
| Email | Resend over `fetch`, with a logged fallback | No SDK, and both mail flows work before a provider exists |
| Analytics | Vercel Analytics + a first-party sales dashboard | Traffic from Vercel, revenue from your own database |
| Tests | `node --test` | No test framework to install |

## How a purchase works

1. **Register** — `POST /api/auth/register`. Firebase manages credentials and supplies the verified identity.
   Existing purchases are linked only after proof of account ownership.
2. **Add to cart** — `POST /api/cart`. The slug is validated against the
   catalogue before it touches anything.
3. **Checkout** — `POST /api/checkout` prices the cart server-side and writes a
   pending order.
4. **Fulfilment** — grants one `entitlements` row per template. A bundle fans
   out to all catalog templates, so the download check stays a single indexed lookup.
5. **Download** — `GET /api/download/[slug]` verifies ownership, then streams
   the zip.

The zips live in `private/downloads/`, **outside `public/`**, so there is no
URL that serves them directly — every download passes the ownership check.
`next.config.mjs` uses `outputFileTracingIncludes` to ship them with the
download function, since nothing imports them.

### Cart rules worth knowing

- Anything already in your library is dropped from the cart.
- If the bundle is present, individual items fold into it — nobody is charged
  twice for the same file.
- `fulfillOrder` is idempotent, so a replayed Stripe webhook cannot
  double-grant or corrupt the order.

## The tour

A first-time visitor lands *inside* a real template — picked at random from
the eight that run in a frame — and can genuinely use it. Every link, filter,
cart drawer and form in there is live; nothing is overlaid or faked. A guide
panel sits in the corner naming the page, what's built into it, and one thing
worth trying, and it **follows** the visitor: navigate inside the template and
the guide catches up rather than fighting you.

"Show me another" swaps to a different template, so the tour is as long as
they want it. When they're done it shrinks away and reveals that everything
they just used is a product, followed by a rotating showcase of the rest.

- **Opt-in.** It is launched from "Try a template live" in the hero and
  nowhere else. It used to open itself on a first visit, which interrupted
  every arrival before they had seen anything — and interrupted them again
  whenever site data was cleared.
- Mounts *over* the storefront rather than redirecting, so crawlers and
  visitors who never press it still just get the store. Escape closes it.
- Steps come from the catalogue's per-page metadata, so adding a template adds
  it to the tour pool automatically.

## Live previews instead of screenshots

Product pages run the real template in a frame with its pages as tabs, a
device-width switcher and a per-page description, so a buyer can walk every
page and function before paying. `scripts/build-previews.mjs` copies the static
templates into `public/preview/<slug>/` at build time.

**The trade-off:** a served template's markup is viewable, the same as on any
template marketplace. That is the price of a demo people trust, and the paid
artefact is still the packaged source, README and licence, which only come
through the authorised download route. Previews carry `X-Robots-Tag: noindex`
so they never compete with the store in search.

Helix needs a build step, so it keeps a still and lists its sections instead.

## Carts without an account

Browsing, adding to the cart and seeing a full total need no account and no
database — a signed-out cart lives in a cookie. Only checkout requires signing
up, and the cookie cart is merged into the account on registration, sign in and
at checkout, so nothing picked out beforehand is lost.

Only slugs are stored. Prices are always recomputed server-side from the
catalogue, so editing the cookie changes which items are in the cart and
nothing else; an injected value is dropped on read.

## Password reset

`/forgot` issues a single-use token, stored only as a SHA-256 hash and valid
for one hour. Requesting a new link invalidates the previous one, and
completing a reset **destroys every existing session** for that account — if
the reset happened because someone else had access, that access ends there.

The response to a reset request is identical whether or not the address is
registered, so the endpoint cannot be used to discover who has an account.

## Receipts and email

`lib/email.js` sends through Resend when `RESEND_API_KEY` is set and otherwise
logs the message. Either way **every send is recorded in the `emails` table**,
so there is a delivery record and the admin mail log shows failures.

Receipts go out after fulfilment from the Stripe webhook — and only on first fulfilment, so a replayed webhook cannot re-send.
A mail failure never fails a purchase: the entitlement is already granted by
that point, so errors are swallowed and recorded rather than surfaced.

## Reviews

Reviews are restricted to **verified buyers**: writing one requires an
entitlement row, which only exists after a fulfilled order. Buying the bundle
entitles you to review any template. The unique key on `(user_id, slug)` means
one review per buyer per template — editable, not repeatable.

Author emails are masked (`jo***@example.com`) and ratings are constrained to
1–5 integers in both the application and a `CHECK` constraint. Averages appear
on the listing cards and in the buy rail.

## Analytics

Three sources, deliberately:

- **Traffic** — `@vercel/analytics` and `@vercel/speed-insights` are mounted in
  the root layout. Cookie-less, and they no-op outside a Vercel deployment.
  Enable Analytics in your Vercel project to see visitors, referrers and pages.
- **Money** — `/admin` reads your own database: all-time and 30-day revenue,
  average order value, signup→purchase conversion, a daily revenue chart, best
  sellers by revenue, recent orders, review average and the mail log.
- **Behaviour** — Firebase Analytics, when `NEXT_PUBLIC_FIREBASE_*` is set.
  Beyond page views it records `tour_start`, `tour_next_template`,
  `tour_reveal` (with pages and templates seen), `add_to_cart`,
  `begin_checkout`, `checkout_needs_account` and `purchase` — enough to tell
  whether the tour actually sells anything. Tracking never throws: an ad
  blocker costs you a data point, not a working page.

A Firebase web config is public by design — it ships in the bundle of every
Firebase web app and identifies the project rather than authenticating it.
Your **security rules** are what protect the data. Moving accounts and orders
onto Firestore is separate and needs a service account key, which is a real
secret; see `.env.example`.

Admin access is an allowlist in `ADMIN_EMAILS`, not a database flag, so a
compromised account cannot promote itself. A non-admin gets a 404 rather than
a 403 — the page should not announce that it exists.

## Security

- Passwords: scrypt, 64-byte key, per-user salt, `timingSafeEqual` comparison.
- Sessions: httpOnly + SameSite=Lax + Secure in production; 30-day expiry
  checked server-side.
- CSRF: SameSite=Lax blocks cross-site form POSTs, and every mutating route
  additionally checks `Origin` against `Host`.
- Login: identical response whether the email is unknown or the password is
  wrong, so the endpoint cannot be used to enumerate accounts. Rate-limited to
  8 attempts per 15 minutes.
- Path traversal: slugs are checked against the catalogue before being used in
  a path.
- Reset tokens: 32 random bytes, stored hashed, single use, one-hour expiry,
  and superseded by any newer request.
- Reviews: write access requires a purchase; ratings are bounded in code and by
  a database `CHECK`.

## Template sources and licenses

The store includes nine original designs and 50 adapted open-source designs: 36 from HTML5 UP (CC BY 3.0) and 14 from Start Bootstrap (MIT). Each imported folder includes LICENSE.txt, README.md and SOURCE.json. A source index is in templates/SOURCES.json. Product pages link the source and identify attribution requirements.

Each open-source design is reworked into an edition for one kind of business: a brand name, real copy in place of lorem ipsum, a re-tuned colour palette, new typography and illustrations drawn for that niche. Brand colour and fonts live in each template's `foundry-theme.css`, which the online editor reads. `source.design` in `lib/imported-templates.js` names the original template, and each folder's SOURCE.json lists the changes.

Original versions are available free from their authors. Preserve upstream credits and license terms: every HTML5 UP page keeps its visible "Design: HTML5 UP" footer credit. The Foundry commercial license applies only to the original Foundry designs. Imported designs do not include working business backends, email delivery or payment processing.

Individual templates cost $5, $10 or $15. The existing $35 complete bundle remains available and includes the expanded catalog.

## Choosing a database

The app runs on either **Firebase Realtime Database** or **libSQL**, picked at
startup from the environment. Nothing else in the codebase changes.

| Set this | Backend used |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` + `FIREBASE_DATABASE_URL` | Firebase Realtime Database |
| `DATABASE_URL` (+ `DATABASE_AUTH_TOKEN`) | libSQL / Turso |
| neither | local file — development only, and read-only on a serverless host |

`lib/backend.js` picks one; `lib/backends/rtdb/ops.js` and
`lib/backends/sql/ops.js` implement the same interface. Every module above
them — accounts, cart, orders, reviews, mail, metrics — is backend-agnostic.

### Connecting Firebase

1. Firebase console → Project settings → **Service accounts** → *Generate new
   private key*. This file is a real secret; never commit it.
2. In Vercel → Settings → Environment Variables:
   - `FIREBASE_SERVICE_ACCOUNT` — the **entire** JSON file, pasted as one value
   - `FIREBASE_DATABASE_URL` — `https://your-project-default-rtdb.firebaseio.com`
3. Lock the database down. Server access goes through the service account,
   which bypasses rules, so no client needs direct access:
   ```json
   { "rules": { ".read": false, ".write": false } }
   ```
4. Redeploy and check `/api/health` — it names the active backend.

### How the data is shaped

RTDB has no joins and no unique constraints, so two indexes do that work:
`emailToUid` gives the unique-email lookup SQL provided for free, and
`userOrders` gives the per-user order index. Writes that must not half-apply —
creating a user, granting a purchase, consuming a reset — use a single
multi-location update on the root, which RTDB applies atomically.

```
users/{uid}                 email, password, createdAt
emailToUid/{base64url}      uid
sessions/{tokenHash}        userId, createdAt, expiresAt
carts/{uid}/{slug}          addedAt
entitlements/{uid}/{slug}   orderId, createdAt
orders/{orderId}            userId, totalCents, status, provider, items{}
userOrders/{uid}/{orderId}  createdAt
reviews/{slug}/{uid}        rating, title, body, email, createdAt
resets/{tokenHash}          userId, expiresAt, usedAt
attempts/{base64url}        count, firstAt
mail/{id}                   toEmail, subject, kind, provider, status
```

Email addresses can't be RTDB keys — `. # $ [ ] /` are all illegal — so they're
base64url encoded, which round-trips any address.

### What's verified, and what isn't

Both backends run **the same behaviour suite**: 62 tests, 36 against libSQL and
26 against Realtime Database. A difference between them fails a test rather
than surprising you in production.

The RTDB emulator can't start in the environment this was built in, so those 26
run against a faithful in-memory double (`tests/helpers/fake-rtdb.js`) that
matches the semantics the backend relies on — null removes a node, empty
parents vanish, multi-location updates apply together. **That proves the
backend's own logic, not the Firebase SDK's behaviour.** The first real
round-trip happens on your project, which is what `/api/health` is for.

## Diagnosing a deployment

`GET /api/health` answers "why can't anyone sign up?" in one call. It reports
whether the database, payments, email, analytics and the admin allowlist are
configured and reachable, and **never returns a credential, host or token**, so
it is safe to leave reachable and safe to paste into a bug report.

The common failure on a fresh deploy is that `DATABASE_URL` was never set.
Browsing still works — the storefront is served from the static catalogue — but
every *write* fails, so account creation is the first thing anyone notices.
Health says so in as many words, and the sign-up form now shows the real cause
instead of "Something went wrong".

`NEXT_PUBLIC_FIREBASE_*` is **analytics only** and does not configure the
database. The database needs either `FIREBASE_SERVICE_ACCOUNT` +
`FIREBASE_DATABASE_URL`, or `DATABASE_URL` + `DATABASE_AUTH_TOKEN`.

Health names the failure precisely. Its `env` block reports, by **name only
and never by value**, which variables the running deployment can actually see:

```json
"env": { "firebase": {
  "ready": false,
  "missing": ["FIREBASE_SERVICE_ACCOUNT"],
  "serviceAccount": { "set": true, "validJson": true,
                      "privateKeyLooksValid": false,
                      "problem": "private_key doesn't look like a PEM key..." },
  "databaseUrl": { "set": true, "from": "NEXT_PUBLIC_FIREBASE_DATABASE_URL" },
  "projectMismatch": null } }
```

That distinguishes the setup mistakes that actually happen: a variable never
added, added to the wrong Vercel environment, added without redeploying, JSON
mangled on paste, `\n` escapes stripped from `private_key`, or a service
account belonging to a different Firebase project.

`serverExternalPackages: ["firebase-admin"]` is set in `next.config.mjs`.
firebase-admin resolves parts of itself with dynamic requires that Next's
server bundler cannot follow, so it has to stay external to load at runtime.

## When the database is down

The storefront is built entirely from the static catalogue, so a browsing
visitor never sees an error because the data layer is unreachable or not yet
configured. Reads behind the storefront degrade through `readOrFallback` —
ratings, ownership and the session lookup fall back to empty. **Writes never
do**: a purchase that silently does nothing is worse than an error.

This is what fixes the blank-page deploy. With `DATABASE_URL` unset on Vercel,
the `file:` fallback lands on a read-only filesystem; previously that took the
whole site down, and now it costs only accounts and orders.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # 62 tests across both backends, no framework needed
npm run previews # rebuild the live template previews only
npm run build    # zips the templates, then builds
```

Enable Firebase Email/Password authentication to sign in locally. The database is created at
`./data/store.db` on first boot and checkout requires configured Stripe keys, so you
can register, buy and download immediately.

## Deploying

1. **Database.** Vercel's filesystem is ephemeral, so create a hosted database
   — Turso has a free tier and needs no code change:
   ```bash
   npx turso db create foundry
   npx turso db show foundry --url      # → DATABASE_URL
   npx turso db tokens create foundry   # → DATABASE_AUTH_TOKEN
   ```
2. **Import** the repo at [vercel.com/new](https://vercel.com/new).
   `vercel.json` pins the framework and build command.
3. **Set env vars** from `.env.example`.
4. **Stripe**, when you're ready to take real money: set `STRIPE_SECRET_KEY`,
   add a webhook to `https://yourdomain/api/webhook/stripe` for
   `checkout.session.completed`, and set `STRIPE_WEBHOOK_SECRET`.

Checkout is unavailable until both Stripe keys are configured.

## Adding a template

1. Drop the folder into `templates/<slug>/`.
2. Add an entry to `TEMPLATES` in `lib/catalog.js` with a `tier`.
3. Save a preview to `public/thumbs/<slug>.webp` (1100×825).
4. Copy a `LICENSE.txt` in from any existing template.

The zip, the listing, `/t/<slug>`, the footer and the bundle all pick it up.

## Structure

```
app/
  page.js                    storefront
  t/[slug]/page.js           template detail
  cart/, account/            cart and library
  login/, register/, forgot/, reset/
  admin/                     sales dashboard
  api/
    auth/{register,login,logout,forgot,reset}/
    cart/                    server-priced cart
    checkout/                verified Stripe payment
    download/[slug]/         ownership-gated zip delivery
    reviews/                 verified-buyer reviews
    webhook/stripe/          signature-verified fulfilment
lib/
  catalog.js                 products, tiers, prices
  accounts.js                user records and reset tokens (unit tested)
  email.js                   Resend or logged, always recorded
  reviews.js                 verified-purchase reviews
  metrics.js                 sales figures for the dashboard
  admin.js                   ADMIN_EMAILS allowlist
  guest-cart.js              signed-out cart, cookie only
  tour.js                    the first-visit walkthrough
  backend.js                 picks the backend from the environment
  backends/rtdb/             Firebase Realtime Database implementation
  backends/sql/              libSQL implementation
  db.js                      libSQL client, schema, seeding
  password.js                scrypt helpers (no Next import — unit tested)
  auth.js                    sessions, rate limiting, origin checks
  store.js                   cart, orders, entitlements
scripts/
  build-zips.mjs             templates/ → private/downloads/ (paid, gated)
  build-previews.mjs         templates/ → public/preview/ (live demos)
templates/                   the products
tests/{store,accounts}.test.js
```

## Honest notes

- **The store works; the business still needs traffic.** Template sales are a
  distribution problem. Nine templates on a URL nobody visits earns nothing —
  budget for SEO, a launch, or an existing audience.
- **Turn on Analytics in the Vercel dashboard** — the code is wired up, but
  the project setting still has to be enabled.
- **Email needs a real provider before launch.** Without `RESEND_API_KEY`,
  receipts and reset links are only logged — buyers never receive them.
- **Reviews are published immediately.** There is no moderation queue. Fine at
  low volume; add one if it gets abused.
- **Set `ADMIN_EMAILS`** or `/admin` is unreachable, by design.
- Prices are a starting point, not a researched position. Test them.

## Firebase authentication and verified checkout

Sign-in and password reset now use Firebase Authentication. Enable Email/Password in the Firebase console. FIREBASE_API_KEY or NEXT_PUBLIC_FIREBASE_API_KEY selects the web key; the supplied megan-74585 key is the fallback. Firebase sends reset emails directly. Its hosted reset page works, or configure the email action URL to /reset for the custom page.

The Realtime Database and libSQL backends are both retained. Firebase RTDB still needs FIREBASE_SERVICE_ACCOUNT plus FIREBASE_DATABASE_URL. Firebase Auth alone does not need a service-account key. Existing buyers can link their Firebase account using their old store password or a verified Firebase email, preserving purchases.

Checkout requires STRIPE_SECRET_KEY (including restricted rk_ keys with Checkout Sessions Write access) and STRIPE_WEBHOOK_SECRET. Add /api/webhook/stripe for checkout.session.completed and checkout.session.async_payment_succeeded. Unpaid sessions never grant downloads. The total, currency, and order reference must match. Fulfilment is transactional in both data backends and preserves items added during checkout. The return page checks actual order status. Missing credentials retain the cart and return an unavailable message.
