# EPRI: financial manager & advisor for local business

EPRI reads a small business's numbers every month and tells the owner, in plain English, **what they made, where the money went, and what to fix** before a small problem gets expensive.

- **Accounts:** Google Firebase sign-in (email/password or Google).
- **Books:** optionally encrypted with AES-256 using a passphrase only the owner knows.
- **Hosting:** runs on Vercel.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 23 unit tests: analytics, parsing, encryption, pricing, advisor
npm run build      # static site in dist/
```

## Deploy on Vercel

1. Import this repository in Vercel. `vercel.json` already sets the framework (Vite), build command, output folder and security headers.
2. **Firebase sign-in:** in the Firebase console, go to Authentication → Settings → **Authorized domains** and add your Vercel domain (for example `epri.vercel.app`). Without this, sign-in on the live site shows "This website isn't on the sign-in allow-list yet".
3. Make sure **Email/Password** and **Google** are enabled under Authentication → Sign-in method.
4. *(Optional)* To use a different Firebase project, set `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_STORAGE_BUCKET` and `VITE_FIREBASE_MESSAGING_SENDER_ID` in Vercel → Settings → Environment Variables. Otherwise the app uses the same project as Cryptic Hub. The web config isn't secret; who can sign in is controlled by the console settings above.
5. *(Optional)* To turn on Claude-powered answers in the advisor, set `ANTHROPIC_API_KEY`. Without it, the built-in advisor answers instead.

## The guided tour (for demos)

**Take the 3-minute tour** on the landing page walks through the real app in 26 steps, using a sample bakery:

1. **Sign up:** the details are typed in for you, and no real account is created.
2. **Set up:** company and industry, team and roles, upload 12 months of books (a real CSV goes through the real importer), customers, passphrase, then the baseline.
3. **Every month:** the dashboard, warnings, health score, the advisor, the monthly report, adding a new month, and budget vs actual.
4. **Operations:** supplier scorecards, logging a damaged delivery, logging a complaint.
5. **Tools:** costing a sourdough loaf in the Pricing Studio, and the ad-spend planner.
6. **Team & security:** previewing as a viewer (payroll shows only their own row).
7. **Export:** downloading the 12-month P&L as CSV, and encrypted backups.

Each step spotlights one part of the screen, explains it, and says **"What you'd do"**. **Do it for me** fills in the sample data so visitors can watch the business take shape. You can also **Hide** the tour to click around yourself, and resume it later.

The tour needs no account and no internet, so it works on a tablet at an event. It uses its own workspace, which is wiped when the tour ends.

## What's in the app

| Area | What it does |
|---|---|
| **Advisor dock** | Opens beside any page (sidebar button, or press **A**). It knows which page you're on, suggests questions for that page, and saves every question to **History** with a "Go back to…" link and "Ask a follow-up" |
| **Dashboard** | Revenue, spending and profit, a 3-month forecast, warnings, an industry comparison and a health score |
| **Monthly reports** | A plain-English monthly report, a 12-month P&L, CSV export and printing |
| **Budget & spending** | Yearly budgets with pace tracking and a year-end projection |
| **Data & uploads** | CSV / TSV / Excel / JSON import with preview, merge or replace, and inline editing |
| **Payroll** | Salaries by department and labour cost as a share of revenue. What you can see depends on your role, down to individual rows |
| **Suppliers & inventory** | Stock and reorder alerts, damaged products, returns, and supplier scorecards |
| **Complaints** | Every complaint and what it cost to resolve |
| **Pricing studio** | Industry material presets → unit cost, price, margin, break-even, and compound pricing |
| **Spending planner** | Customer demographics → ad budget split by channel, plus a production and operations plan |
| **Team & roles** | 4 roles and 13 permissions, "Preview as" any member, and an audit log |
| **Security & settings** | AES-256 encryption, lock, encrypted backups and restore, company profile |

## Security

- **Sign-in:** Google Firebase Authentication. EPRI never sees or stores passwords, and repeated wrong guesses are blocked automatically.
- **Separate workspaces:** each account has its own workspace, so two people on one device never share books.
- **Encryption:** AES-256-GCM, with the key made from the owner's passphrase (PBKDF2-SHA256, 310,000 iterations). The key is held only in memory, so the workspace locks again on reload.
- **Access control:** every change goes through a permission check, and every change is written to the audit log.
- **Files:** uploads are checked for type and size (5 MB limit), and exported spreadsheets are protected against formula injection.
- **AI privacy:** the advisor only ever receives totals and ratios.
- **Headers:** `vercel.json` sets a strict Content-Security-Policy (allowing only the Firebase and Google Fonts hosts), HSTS, and anti-framing headers.

> **Current limit:** financial data is stored in the browser, per account and per device. Syncing it across devices (for example with Firestore plus security rules) is the next step for a multi-device, multi-user product.

## Design

The look is carried over from the **Helix** template: a near-black background, frosted-glass panels, violet/cyan accents, Inter text with Instrument Serif italic highlights, an aurora glow, film grain, and the 3D particle helix in the hero. Like the Poly OS site, the landing page uses interactive tabbed panels (Product, How it works / Industries, Security) so there's less scrolling. There's also a light mode.

## Pitch notes

**30 seconds:** "Most small businesses find out they're losing money months too late. EPRI reads your numbers every month and tells you in plain English what you made, where it went and what to fix. It warns you before you overspend, shows what bad suppliers and complaints actually cost, and helps you price your products, for less than one hour with an accountant."

- **Compared with QuickBooks:** QuickBooks *records* the numbers. EPRI *interprets* them and *warns* you.
- **Pricing:** $19 / $49 / $99 a month, with 2 months free on yearly plans.
- **Demo:** open the site → **Take the 3-minute tour** → let them press **Do it for me** at each step.
