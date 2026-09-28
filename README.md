# EPRI: automated financial manager for small businesses

EPRI works like a part-time financial advisor for local businesses. The owner uploads their production, operations and payroll numbers once. After that, EPRI reports every month on what the business made, warns when spending drifts, and explains the numbers in plain English.

It runs entirely in the browser, so it works offline on a laptop or tablet, which is handy for a live demo at a Chamber of Commerce event. There's also an optional Claude-powered advisor.

## Try it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 22 unit tests: analytics, parsing, encryption, pricing
npm run build      # static site in dist/
```

Click **Live demo** and pick an industry. EPRI generates a realistic sample business with 12 months of books, a team, suppliers and complaints. None of it is real data, and nothing is sent to a server.

## What's in it

| Area | What it does |
|---|---|
| **Landing page** | The pitch: how it works, features, industries, security, AI, pricing and FAQ |
| **Onboarding** | Six steps: company, team and roles, 12-month history upload, customer demographics, encryption passphrase, then the baseline |
| **Dashboard** | Revenue vs expenses with a 3-month forecast, profit by month, spending by category, industry benchmarks, a 0–100 health score and alerts |
| **Monthly reports** | Month-by-month report (vs last month, average and budget), a 12-month P&L, CSV export and print |
| **AI Advisor** | Plain-English Q&A about your numbers. Uses a built-in rules engine, or Claude when an API key is set |
| **Budget & spending** | Annual budgets per category with pace tracking, a year-end projection and overspend warnings |
| **Data & uploads** | CSV / TSV / Excel / JSON import with preview, merge or replace, inline editing and export |
| **Payroll** | Salaries by person and department, and labour cost as a share of revenue. Access is limited per row by role |
| **Suppliers & inventory** | Stock levels and reorder alerts, a damaged-products log, a returns log, and supplier scorecards (defect rate, on-time delivery, money lost) |
| **Complaints** | Complaint log with category, severity, status and **cost to resolve**, plus charts by category |
| **Pricing studio** | Pick materials from **industry presets**, enter your prices and get unit cost, suggested price, margin and break-even. Includes a 12-month compounding projection and 5-year compound pricing |
| **Spending planner** | Customer demographics produce a suggested ad budget and channel split. Also plans production and operations spending from forecast revenue |
| **Team & roles** | 4 roles and 13 permissions, a permission matrix, "view as" any member, and an audit log |
| **Security & settings** | Turn AES-256 encryption on or off, lock, encrypted backups and restore, company profile, reset |

### Industries

Technology/SaaS, E-commerce, Restaurant/Food, Retail, Manufacturing, Construction/Trades and Professional services. Each industry comes with its own benchmark ranges, material presets and fee presets (card processing, marketplace fees, delivery-app commission and so on). Everything is in `src/lib/industries.js`.

### File formats

Column names are matched loosely ("Sales", "COGS", "Wages", "Rent", "Ad spend"…). Two layouts are supported:

- **Monthly totals:** one row per month, e.g. `month, revenue, production, operations, payroll, marketing, other`
- **Transactions:** one row per entry, `date, category, amount`, totalled per month automatically

Dates can be written as `2025-03`, `03/2025`, `3/14/2025`, `Mar 2025`, or as Excel date serials. Templates are in `public/templates/`.

## Security

- **AES-256-GCM** encrypts the whole workspace at rest. It's authenticated encryption, so tampering is detected.
- The key comes from the owner's passphrase via **PBKDF2-SHA256 with 310,000 iterations** and a random salt. The key is kept **in memory only**, so reloading the page locks the workspace again.
- **RBAC:** every write goes through `update(permission, …)` in `src/lib/store.jsx`, so a hidden button isn't the only guard.
- **Audit log:** every change records who made it and when.
- Imports are checked for file type and a 5 MB size limit. **CSV exports are protected against formula injection.**
- `vercel.json` sets a strict Content-Security-Policy, HSTS and anti-framing headers.
- The AI advisor only receives **aggregates**, never names, salaries, customers or supplier details (`advisorSummary()` in `src/lib/analytics.js`).

> Note: this is a single-device demo build, and data lives in the browser. A production multi-user version needs a backend with real authentication. The RBAC model and permission checks here are designed to move across to it.

## How the numbers are calculated

All numbers are calculated with transparent, unit-tested math (`src/lib/analytics.js`, `src/lib/pricing.js`). A language model never generates them.

- **Anomalies:** the latest month is flagged when a category is more than 20% above its trailing 6-month average *and* more than 1.5σ above it.
- **Forecast:** a least-squares trend multiplied by a seasonal index. The index is pulled halfway toward 1 because one year of history is noisy.
- **Budget pace:** year-to-date actual vs the budget prorated to the same point in the fiscal year.
- **Health score:** a weighted blend of profitability (30%), growth (20%), spending vs industry (20%), budget discipline (15%) and stability (15%).
- **Pricing:** percentage fees are taken from the selling price, so the price is solved for them rather than having them added on top.

## Optional: Claude-powered advisor

Deploy to Vercel and set `ANTHROPIC_API_KEY`. The `api/advisor.js` function then answers questions with Claude. Without the key, the app uses its built-in advisor automatically.

## Deploy

The site is static, so any static host works (`npm run build` produces `dist/`). On Vercel, `vercel.json` is already configured, and the `api/` folder becomes the advisor function.

## Pitch notes (Chamber of Commerce)

**30 seconds:** "Most small businesses find out they're losing money months too late. EPRI reads your numbers every month and tells you in plain English what's wrong and what to do about it. It warns you before you overspend, tracks suppliers and complaints in dollars, and helps you price your products, for less than one hour with an accountant."

- **Compared with QuickBooks:** QuickBooks *records* the numbers. EPRI *interprets* them and *warns* you.
- **Security:** AES-256 encryption with a key only the owner holds, role-based access and an audit trail.
- **Pricing:** $19 / $49 / $99 per month, 20% off for Chamber members.
- **Demo flow:** Live demo → Restaurant → dashboard alerts → Pricing studio → Team → "View as" a Viewer (payroll is hidden) → Settings → encrypt → reload (locked).
