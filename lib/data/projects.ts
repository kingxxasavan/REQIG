import type { Project, ProjectSlug } from "@/lib/types";

// Every project Cryptic Inc has shipped. Links marked `verified: false` could not be
// opened from the build machine: check them and flip the flag (or fix the URL).
export const PROJECTS: Project[] = [
  {
    slug: "cryptic-hub",
    name: "Cryptic Hub",
    tagline: "A private hub for messages, plans, class notes and an AI that builds things.",
    description: [
      "Cryptic Hub is a small private space for friends: messaging between people who have connected, a calendar of events, tasks and reminders, notes that keep each class's notes, flashcards, slides and files together, and a shared directory of links.",
      "At its center is ARIA, an assistant that researches the live web, reads any document you give it, builds complete projects in a built in IDE, makes slide decks you can download as PowerPoint, and can copy and debug a website's code.",
    ],
    year: 2026,
    category: "Web app",
    accent: "#8b5cf6",
    stack: ["Vanilla JS", "Vercel Edge Functions", "Firebase Auth", "Realtime Database", "NVIDIA NIM"],
    status: "Live",
    live: { url: "https://arkia.buzz", verified: true },
    source: { visibility: "private" },
    cover: "/projects/cryptic-hub/home.webp",
    features: [
      {
        title: "A home that knows your day",
        body: "Greets you with what is on today, the week ahead, weather, new messages and a picture of the day, with ARIA one question away.",
        image: "/projects/cryptic-hub/home.webp",
        alt: "Cryptic Hub home screen with a greeting, quick actions, weather, picture of the day and this week's events",
      },
      {
        title: "ARIA, the assistant that uses tools",
        body: "ARIA plans, calls tools like weather, currency and a calculator, searches the web without a key, and shows each step it took.",
        image: "/projects/cryptic-hub/aria.webp",
        alt: "ARIA chat answering a question about Tokyo weather and yen conversion after using three tools",
      },
      {
        title: "Calendar, tasks and reminders",
        body: "Month, week, day and agenda views, quick add in plain words, imported calendars and holidays, and push reminders you can switch off.",
        image: "/projects/cryptic-hub/calendar.webp",
        alt: "Cryptic Hub calendar in month view for October 2026 with events, tasks and reminders",
      },
      {
        title: "Notes for every class",
        body: "A folder per class and unit, checklists, flashcards and slides in one place, and Ask ARIA right inside a note.",
        image: "/projects/cryptic-hub/notes.webp",
        alt: "A Biology note on photosynthesis with headings, bullet points and a revision checklist",
      },
      {
        title: "Seasons that change the whole look",
        body: "The interface dresses up for the time of year, like the Hallows theme with a moonlit house, bats and pumpkins for Halloween.",
        image: "/projects/cryptic-hub/hallows.webp",
        alt: "Cryptic Hub home screen in its Halloween theme with a full moon, haunted house and pumpkins",
      },
    ],
    milestones: [
      { date: "2026-09-09", title: "Cryptic Hub goes up with messaging and ARIA" },
      { date: "2026-09-29", title: "Hub rebuilt with a calendar and an ARIA that builds things" },
      { date: "2026-10-21", title: "ARIA plans and uses tools; seasonal themes arrive" },
    ],
  },
  {
    slug: "jarvis",
    name: "JARVIS",
    tagline: "A private AI assistant you open from any browser that can act on your own computers.",
    description: [
      "JARVIS is a personal assistant for one owner. Chat or talk to it from a school Chromebook, a phone or a laptop, and it remembers what matters, plays YouTube, reads your calendar and messages from arkia.buzz, and reads the files on your laptop.",
      "A small agent on the laptop picks up jobs from the website, so JARVIS can open apps, stream the laptop's Chrome and desktop into the browser, and have Claude Code build whole projects on the laptop while the log streams back live.",
    ],
    year: 2026,
    category: "AI assistant",
    accent: "#22d3ee",
    stack: ["Next.js", "Supabase", "NVIDIA NIM", "Ollama Cloud", "Python agent", "Cloudflare Tunnel"],
    status: "Owner only",
    source: { visibility: "private" },
    cover: "/projects/jarvis/architecture.webp",
    features: [
      {
        title: "Owner only, with two factor",
        body: "One account is allowed in. Anyone else is signed out on the spot, and an authenticator code can be required on top of the password.",
        image: "/projects/jarvis/login.webp",
        alt: "The JARVIS sign in screen with its glowing reactor logo and the line Private system, owner access only",
      },
      {
        title: "A website plus an agent on your laptop",
        body: "The web app runs on Vercel and talks to NVIDIA NIM with Ollama Cloud as a fallback. The laptop agent only reaches out, so nothing on it is exposed.",
        image: "/projects/jarvis/architecture.webp",
        alt: "Diagram of JARVIS: browser to the Next.js app on Vercel, AI providers, Supabase, and the laptop agent polling for jobs",
      },
      {
        title: "Build me a project on my laptop",
        body: "Ask in chat and Claude Code builds it on the laptop, with the live log in Tasks, a git commit at the end and an optional push to GitHub.",
        image: "/projects/jarvis/agent.webp",
        alt: "Diagram of a build: you ask, JARVIS queues a job, the laptop agent picks it up, Claude Code writes the code, the log comes back",
      },
      {
        title: "Memory that keeps up",
        body: "After every reply a background pass adds, updates or deletes facts, and recall blends meaning, keywords, importance and how recently something was used.",
        image: "/projects/jarvis/memory.webp",
        alt: "Diagram of JARVIS memory: a memory pass after each reply, stored facts, and recall that mixes meaning with keywords",
      },
    ],
    milestones: [
      { date: "2026-10-08", title: "JARVIS: web HUD, adaptive memory and the device agent" },
      { date: "2026-10-09", title: "Apps stream the laptop's Chrome into JARVIS; one click install" },
    ],
  },
  {
    slug: "polyos",
    name: "PolyOS 7 for Debian",
    tagline: "The PolyOS desktop from Scratch, rebuilt as a real operating system you can install.",
    description: [
      "PolyOS started as an operating system built in Scratch by Perlexity and the PIXAPoLY team. PolyOS 7 for Debian turns it into a real desktop that boots on real hardware: Debian brings the kernel, drivers and apps, and PolyOS brings everything you see.",
      "That means the desktop, taskbar and Start menu, Files, Settings, Task Manager, Driver Manager, the PolyMarket app store, the Vara assistant, the login and lock screens, signed online updates, Poly Account, and a full installer on the live USB with dual boot next to Windows.",
    ],
    year: 2026,
    category: "Operating system",
    accent: "#7c8cff",
    stack: ["Debian 13", "Python", "GTK + WebKit", "HTML/CSS/JS", "Openbox", "Node.js API"],
    status: "Live",
    live: { url: "https://poly-os-7.vercel.app", verified: true },
    source: {
      visibility: "public",
      url: "https://github.com/kingxxasavan/poly-os-7-debain-receration",
      repo: "kingxxasavan/poly-os-7-debain-receration",
      ref: "main",
    },
    cover: "/projects/polyos/desktop.webp",
    features: [
      {
        title: "The PolyOS desktop and taskbar",
        body: "The crystal desktop, app shortcuts and a taskbar with Start, widgets, pinned and running apps, quick settings and the clock.",
        image: "/projects/polyos/desktop.webp",
        alt: "PolyOS desktop with a purple crystal wallpaper, desktop icons and the taskbar at the bottom",
      },
      {
        title: "A Start menu like Windows 11",
        body: "Search apps, settings and recent files, pinned apps, all apps A to Z, recommended files, and power options in one menu.",
        image: "/projects/polyos/start-menu.webp",
        alt: "The PolyOS Start menu with a search bar, pinned apps and recommended files",
      },
      {
        title: "PolyMarket app store",
        body: "Chrome, Discord, Spotify, Steam, VS Code and more from Debian and Flathub. Queue several installs at once.",
        image: "/projects/polyos/polymarket.webp",
        alt: "PolyMarket, the PolyOS app store, listing apps to install",
      },
      {
        title: "Vara, the assistant",
        body: "Vara is the PolyOS agent for code, 3D and robots. It loads skills, works in your Projects folder and shows each step it took.",
        image: "/projects/polyos/vara.webp",
        alt: "Vara on the PolyOS desktop making a 30 mm cube with a hole in OpenSCAD and listing each step it took",
      },
      {
        title: "An installer that feels like Windows Setup",
        body: "Every drive and partition in one list with New and Delete, dual boot next to Windows, editions, Poly Account and Wi-Fi, all asked before installing.",
        image: "/projects/polyos/installer-drives.webp",
        alt: "The PolyOS installer asking where to install PolyOS, with a list of drives and partitions",
      },
      {
        title: "Settings for everything",
        body: "Display, sound, Poly Account, personalization, apps, storage, power and signed updates, laid out in a familiar order.",
        image: "/projects/polyos/settings-appearance.webp",
        alt: "PolyOS Settings open on the appearance page with theme and wallpaper choices",
      },
    ],
    milestones: [
      { date: "2026-09-24", title: "PolyOS 7 for Debian: desktop shell, apps, login screen and ISO" },
      { date: "2026-09-26", title: "PolyOS 1.0.0, the first full release" },
      { date: "2026-09-27", title: "PolyOS 1.2: Vara, the voice and agent assistant" },
      { date: "2026-09-28", title: "PolyOS 1.4.4 ships after tester fixes" },
    ],
    setupSummary: [
      "Install Debian 13 with only the standard system utilities, then copy this project onto the machine.",
      "Run sudo python3 main.py install and reboot into the PolyOS login screen.",
      "Or try the interface in any browser first with python main.py dev, no Linux needed.",
    ],
    credits: [
      {
        name: "Perlexity (AndrewInput on Scratch)",
        role: "Original creator and collaborator",
        body: "PolyOS started as Perlexity's operating system built in Scratch. Cryptic Inc rebuilt it as a real Debian desktop as a birthday present for him, and he has been part of it ever since.",
        url: "https://scratch.mit.edu/users/PolyOS/",
      },
      {
        name: "PIXAPoLY Software",
        role: "The PolyOS team",
        body: "The PolyOS logo, palette and artwork come from the PolyOS 7 Scratch project, shared under CC BY-SA 2.0 and used with the team's blessing.",
      },
    ],
  },
  {
    slug: "foundry",
    name: "Foundry",
    tagline: "A full stack store selling website templates you can try live before you buy.",
    description: [
      "Foundry sells website templates made for specific businesses: online stores, SaaS products, agencies, restaurants, local services and portfolios. Every template can be clicked through live on phone, tablet or desktop before anyone pays.",
      "It is a real store, not a landing page with a payment link: accounts, a cart, Stripe checkout, order history, and downloads that check you own the template. If nothing fits, the Made for you service turns six questions into a brief and builds the site.",
    ],
    year: 2026,
    category: "E-commerce",
    accent: "#f59e0b",
    stack: ["Next.js", "React", "Firebase", "Stripe", "Tailwind CSS", "Vercel Analytics"],
    status: "Live",
    live: { url: "https://web-templates.vercel.app", verified: false },
    source: {
      visibility: "public",
      url: "https://github.com/kingxxasavan/Web---templates",
      repo: "kingxxasavan/Web---templates",
      ref: "main",
    },
    cover: "/projects/foundry/store-home.webp",
    features: [
      {
        title: "A store for real businesses",
        body: "61 templates across 9 kinds of business, from $5 to $15, paid once with no subscription.",
        image: "/projects/foundry/store-home.webp",
        alt: "Foundry home page: A professional website, ready this afternoon, with template previews",
      },
      {
        title: "Search and filter the collection",
        body: "Search by business, filter by price and category, and open any template to click through its pages.",
        image: "/projects/foundry/templates.webp",
        alt: "Foundry template browser with a search bar, price and sort filters and category chips",
      },
      {
        title: "Try a template live",
        body: "A guided tour opens a real template in the page, explains each part and lets you resize it to see the phone layout.",
        image: "/projects/foundry/tour.webp",
        alt: "A live accounting firm template open in Foundry's tour with a guide card explaining the page",
      },
      {
        title: "Every page, and what is in it",
        body: "Each template page shows a live preview, what it was built for, its stack, pages and licence next to the price.",
        image: "/projects/foundry/template-page.webp",
        alt: "The Helix template page with a live preview, price and details",
      },
      {
        title: "Cart and checkout",
        body: "Carts work without an account, prices are always recomputed on the server, and downloads unlock after a verified payment.",
        image: "/projects/foundry/cart.webp",
        alt: "Foundry cart with one template and the order summary",
      },
      {
        title: "Made for you",
        body: "Answer six questions about your business and style, and Foundry turns it into a brief and builds your site in under two weeks.",
        image: "/projects/foundry/made-for-you.webp",
        alt: "Foundry Made for you page: Can't find the right template? We'll build yours",
      },
    ],
    milestones: [
      { date: "2026-09-15", title: "Foundry starts as a $5 template store" },
      { date: "2026-09-16", title: "Full stack store with accounts, checkout and live previews" },
      { date: "2026-10-02", title: "61 templates, an editor everywhere and the brief wizard" },
    ],
    setupSummary: [
      "Clone the repo, run npm install, then npm run dev to open the store at localhost:3000.",
      "Copy .env.example and add your Firebase and Stripe test keys; without them the store explains what is missing.",
      "Deploy on Vercel with the Next.js preset and the same environment variables.",
    ],
  },
  {
    slug: "epri",
    name: "EPRI",
    tagline: "A financial manager that tells a small business what it made and what to fix.",
    description: [
      "EPRI reads a small business's numbers every month and tells the owner, in plain English, what they made, where the money went, and what to fix before a small problem gets expensive.",
      "It has a dashboard with a health score and forecast, monthly reports, budgets, payroll with row level access, suppliers and complaints in dollars, a pricing studio, an advisor beside every page, AES-256 encryption, and a 3 minute guided tour that builds a sample bakery.",
    ],
    year: 2026,
    category: "Finance",
    accent: "#60a5fa",
    stack: ["React", "Vite", "Firebase Auth", "Chart.js", "Web Crypto", "Claude API"],
    status: "Source only",
    source: {
      visibility: "public",
      url: "https://github.com/kingxxasavan/REQIG/tree/8bda4a9",
      repo: "kingxxasavan/REQIG",
      ref: "8bda4a9",
    },
    cover: "/projects/epri/dashboard.webp",
    features: [
      {
        title: "Know what you made",
        body: "The landing page explains EPRI in one line and starts the guided tour, no account needed.",
        image: "/projects/epri/landing.webp",
        alt: "EPRI landing page: Know what you made. Fix what's leaking.",
      },
      {
        title: "A dashboard for the whole business",
        body: "Revenue, expenses, profit and cash runway, a 12 month chart with a 3 month forecast, warnings and a health score out of 100.",
        image: "/projects/epri/dashboard.webp",
        alt: "EPRI dashboard for a sample bakery with revenue, expenses, profit and a financial health score of 82",
      },
      {
        title: "An advisor beside every page",
        body: "Press A on any page and ask in your own words. It knows which page you are on and keeps every question in History.",
        image: "/projects/epri/advisor.webp",
        alt: "The EPRI advisor panel open beside the dashboard with suggested questions",
      },
      {
        title: "Monthly reports",
        body: "A plain English monthly report and a 12 month P&L you can print or export for your accountant or bank.",
        image: "/projects/epri/reports.webp",
        alt: "EPRI monthly report page for the sample bakery",
      },
      {
        title: "Pricing studio",
        body: "Pick materials from industry presets and see unit cost, the right selling price, margin and break even volume.",
        image: "/projects/epri/pricing-studio.webp",
        alt: "EPRI pricing studio with materials, a suggested selling price of $15.60 and monthly projections",
      },
    ],
    milestones: [
      { date: "2026-09-28", title: "EPRI: financial manager, advisor dock and guided tour" },
    ],
    setupSummary: [
      "Clone the repo at commit 8bda4a9, run npm install, then npm run dev to open it at localhost:5173.",
      "Add your Vercel domain to Firebase Authentication's authorized domains and turn on Email/Password and Google sign in.",
      "Optionally set ANTHROPIC_API_KEY on Vercel for Claude powered advisor answers.",
    ],
  },
  {
    slug: "marketplace",
    name: "Cryptic Marketplace",
    tagline: "A dark, premium marketplace for Claude Skills, GPTs, prompt packs and AI courses.",
    description: [
      "Cryptic Marketplace is a store for AI craft: Claude Skills, custom GPTs, prompt packs, context engineering guides and AI courses, with 40 seeded products from 10 creators.",
      "Buyers browse, review and check out with a test card, then find everything in their library with a lesson player for courses. Creators get a studio with sales charts and a two minute listing flow. It runs as a demo, so no money moves.",
    ],
    year: 2026,
    category: "Marketplace",
    accent: "#e6c78f",
    stack: ["Next.js", "React", "Tailwind CSS", "Firebase", "Framer Motion", "Vitest"],
    status: "Demo",
    live: { url: "https://cryptic-marketplace.vercel.app", verified: false },
    source: {
      visibility: "public",
      url: "https://github.com/kingxxasavan/Cryptic",
      repo: "kingxxasavan/Cryptic",
      ref: "claude/intelligent-bohr-y60wy8",
    },
    cover: "/projects/marketplace/home.webp",
    features: [
      {
        title: "The marketplace for AI craft",
        body: "A home page with search, featured drops, categories, top creators and a scrolling marquee of what you can buy.",
        image: "/projects/marketplace/home.webp",
        alt: "Cryptic Marketplace home page: The marketplace for AI craft, with a search bar and floating product cards",
      },
      {
        title: "Explore with filters",
        body: "Browse every listing by category, price and rating, and sort by trending or newest.",
        image: "/projects/marketplace/explore.webp",
        alt: "The explore page of Cryptic Marketplace with filters and product cards",
      },
      {
        title: "Product pages with reviews",
        body: "Each product shows what is inside, the creator, ratings and reviews, and a buy box.",
        image: "/projects/marketplace/product.webp",
        alt: "A Cryptic Marketplace product page for a Claude Skill with its buy box",
      },
      {
        title: "Demo checkout",
        body: "Card validation, promo codes and an order summary, with test cards so the whole flow works without real money.",
        image: "/projects/marketplace/checkout.webp",
        alt: "Cryptic Marketplace checkout with card details and an order summary of $149",
      },
      {
        title: "Creator studio",
        body: "Listings, sales, revenue and views at a glance, a first sale checklist, and a new listing in about two minutes.",
        image: "/projects/marketplace/creator-studio.webp",
        alt: "The creator studio dashboard with listings, sales, revenue and a weekly views chart",
      },
    ],
    milestones: [
      { date: "2026-10-21", title: "Cryptic Marketplace built from spec to e2e tests in a day" },
    ],
    setupSummary: [
      "Clone the repo, run npm install, then npm run dev to open it at localhost:3000.",
      "It works in demo mode with browser storage; add Firebase Email/Password sign in and the database rules to make it live.",
      "Pay with the test card 4242 4242 4242 4242; no money moves.",
    ],
  },
];

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}

export function neighbors(slug: ProjectSlug): { prev: Project; next: Project } {
  const i = PROJECTS.findIndex((p) => p.slug === slug);
  const n = PROJECTS.length;
  return { prev: PROJECTS[(i - 1 + n) % n], next: PROJECTS[(i + 1) % n] };
}
