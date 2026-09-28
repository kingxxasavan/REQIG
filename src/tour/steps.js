// The guided tour script. Each step points at a [data-tour] element on a
// route, explains it in plain words, and (optionally) does the thing an
// owner would do — with sample data — so a visitor can watch the business
// get set up and run, start to finish.
//
// `required` steps change the story (e.g. uploading the books), so pressing
// Next does them automatically if the visitor skipped "Do it for me".

const S = (t) => `[data-tour="${t}"]`;

export const STEPS = [
  // ---- 1. Sign up ---------------------------------------------------------
  {
    chapter: "Sign up",
    route: "/signup",
    target: "signup-form",
    title: "It starts with an account",
    body: "An owner signs up with their email or Google account. Sign-in is handled by Google Firebase, so EPRI never stores passwords.",
    youDo: "Enter your name, email and a password.",
    doLabel: "Fill in sample details",
    required: true,
    do: async ({ typeInto }) => {
      await typeInto(S("signup-name"), "Maya Dubois");
      await typeInto(S("signup-email"), "maya@harborstreetbakery.com");
      await typeInto(S("signup-password"), "sourdough-2026", 30);
    },
  },
  {
    chapter: "Sign up",
    route: "/signup",
    target: "signup-submit",
    title: "Create the account",
    body: "For this tour nothing real is created. The details are sample data, and everything stays in this browser.",
    doLabel: "Create account",
    required: true,
    do: async ({ clickOn, sleep }) => {
      clickOn(S("signup-submit"));
      await sleep(400);
    },
  },

  // ---- 2. Set up the business --------------------------------------------
  {
    chapter: "Set up",
    route: "/start",
    target: "onb-card",
    title: "Tell EPRI about the business",
    body: "Name, number of employees and industry. The industry decides which benchmarks EPRI compares you against, and which materials show up in the pricing tool.",
    youDo: "Type the company name and pick your industry.",
    doLabel: "Fill in Harbor Street Bakery",
    required: true,
    do: ({ run }) => run("onb-fill-company"),
  },
  {
    chapter: "Set up",
    route: "/start",
    target: "onb-card",
    title: "Add the people who help run it",
    body: "You're the owner. Invite a financial manager who can edit the numbers but not the team or security, and set anyone else up as a department head or a read-only viewer.",
    youDo: "Add each person's name, email and role.",
    doLabel: "Add a financial manager",
    required: true,
    onEnter: ({ run }) => run("onb-goto", 1),
    do: ({ run }) => run("onb-fill-team"),
  },
  {
    chapter: "Set up",
    route: "/start",
    target: "onb-card",
    title: "Upload the last 12 months",
    body: "Drop in a spreadsheet or accounting export (CSV, Excel or JSON) with revenue plus spending on production, operations, payroll and marketing. Messy column names are fine: \"Sales\", \"COGS\" and \"Wages\" are all recognised.",
    youDo: "Drag your file into the box, then optionally add a payroll file.",
    doLabel: "Upload sample books",
    required: true,
    onEnter: ({ run }) => run("onb-goto", 2),
    do: ({ run }) => run("onb-fill-data"),
  },
  {
    chapter: "Set up",
    route: "/start",
    target: "onb-card",
    title: "Who are your customers?",
    body: "A rough age mix, whether you sell to people or businesses, and how far away they are. EPRI uses this to suggest how to split your advertising budget.",
    youDo: "Drag the sliders to roughly match your customers.",
    doLabel: "Set the bakery's customers",
    onEnter: ({ run }) => run("onb-goto", 3),
    do: ({ run }) => run("onb-fill-customers"),
  },
  {
    chapter: "Set up",
    route: "/start",
    target: "onb-card",
    title: "Lock it with a passphrase",
    body: "The owner picks a passphrase, and the whole workspace is encrypted with AES-256 on the device. Only someone who knows it can open the books. We'll skip it for the tour so you can click around freely.",
    youDo: "Choose a passphrase you'll remember (a short sentence works well).",
    required: true,
    doLabel: "Skip for the tour",
    onEnter: ({ run }) => run("onb-goto", 4),
    do: ({ run }) => run("onb-skip-security"),
  },
  {
    chapter: "Set up",
    route: "/start",
    target: "onb-card",
    title: "EPRI builds your baseline",
    body: "In a few seconds it works out monthly profit, seasonality, how you compare with your industry, and starting budgets. Every future month is measured against this.",
    doLabel: "Open the dashboard",
    required: true,
    onEnter: ({ run }) => run("onb-goto", 5),
    do: async ({ run, sleep }) => {
      await sleep(2600);
      await run("onb-finish");
      await sleep(500);
      await run("ws-seed");
    },
  },

  // ---- 3. Every month -----------------------------------------------------
  {
    chapter: "Every month",
    route: "/app",
    target: "dash-kpis",
    title: "What you made this month",
    body: "Revenue, spending and profit for the latest month, each compared with the month before. The small lines show the last 12 months.",
  },
  {
    chapter: "Every month",
    route: "/app",
    target: "dash-alerts",
    title: "Warnings before you overspend",
    body: "EPRI checks every category against your budget, your usual month and your industry's normal range, then says what's wrong in plain English.",
  },
  {
    chapter: "Every month",
    route: "/app",
    target: "dash-health",
    title: "One number for how healthy you are",
    body: "The health score combines profit, growth, spending, budget discipline and stability. Each bar shows what's pulling the score up or down.",
  },
  {
    chapter: "Every month",
    route: "/app",
    target: "advisor-button",
    placement: "corner",
    title: "Ask the advisor, from any page",
    body: "The advisor opens beside the page you're on and knows what you're looking at. Describe what you want to know in your own words.",
    youDo: "Click Advisor (or press A) and type a question.",
    doLabel: "Ask \"Where can I cut costs?\"",
    do: async ({ advisor, sleep }) => {
      advisor.ask("Where can I cut costs?", { auto: true });
      await sleep(1200);
    },
  },
  {
    chapter: "Every month",
    route: "/app",
    target: "advisor-dock",
    placement: "corner",
    title: "Nothing you ask gets lost",
    body: "Every question is saved under History with the page it was asked from. If you lose your train of thought, jump straight back to that page or ask a follow-up.",
    onEnter: ({ advisor }) => advisor.setOpen(true),
    onLeave: ({ advisor }) => advisor.setOpen(false),
  },
  {
    chapter: "Every month",
    route: "/app/reports",
    target: "report-summary",
    title: "The monthly report",
    body: "Pick any month to see what happened, what changed from the month before, and which costs went over budget, all in a few sentences.",
  },
  {
    chapter: "Every month",
    route: "/app/data",
    target: "data-upload",
    title: "Add each new month as it closes",
    body: "Upload the new month's export, and EPRI merges it, re-runs every check and updates the alerts. Figures can also be edited here directly.",
    youDo: "Drop in last month's export.",
    doLabel: "Add next month's numbers",
    do: ({ run }) => run("ws-add-month"),
  },
  {
    chapter: "Every month",
    route: "/app/budget",
    target: "budget-table",
    title: "Budget vs what you actually spent",
    body: "Set a yearly budget for each category. The marker shows where spending should be by now, and anything running ahead of it is flagged.",
  },

  // ---- 4. Operations ------------------------------------------------------
  {
    chapter: "Operations",
    route: "/app/inventory",
    target: "inv-main",
    title: "Suppliers, stock, damages & returns",
    body: "Add your suppliers and the stock you buy from them. Log damaged deliveries and customer returns, and each supplier gets a score based on what they actually cost you.",
    youDo: "Add suppliers and items, then log problems as they happen.",
    doLabel: "Log a damaged delivery",
    do: ({ run }) => run("ws-add-damage"),
  },
  {
    chapter: "Operations",
    route: "/app/complaints",
    target: "complaints-log",
    title: "Complaints, in dollars",
    body: "Record each complaint and what it cost to fix: refunds, replacements, staff time. Quality problems stop being anecdotes and show up as money.",
    youDo: "Click \"Log complaint\" and fill in the form.",
    doLabel: "Log a complaint",
    do: ({ run }) => run("ws-add-complaint"),
  },

  // ---- 5. Tools -----------------------------------------------------------
  {
    chapter: "Tools",
    route: "/app/pricing",
    target: "pricing-materials",
    title: "Price a product from its materials",
    body: "Pick ingredients or materials from presets for your industry, enter what you pay, and EPRI works out the unit cost and the price you need to hit your margin.",
    youDo: "Click the presets you use and type in your prices.",
    doLabel: "Cost a sourdough loaf",
    do: ({ run }) => run("pricing-fill"),
  },
  {
    chapter: "Tools",
    route: "/app/pricing",
    target: "pricing-result",
    title: "The price, the margin, the break-even",
    body: "Card fees and delivery-app commissions are taken out of the selling price, and rent is shared across each unit. Below this you'll see how revenue compounds over 12 months and 5 years.",
  },
  {
    chapter: "Tools",
    route: "/app/planner",
    target: "planner-ads",
    title: "Where to spend on advertising",
    body: "Your forecast and customer mix become a suggested ad budget, split across channels. Production and operations are planned month by month underneath.",
  },

  // ---- 6. Team & security -------------------------------------------------
  {
    chapter: "Team & security",
    route: "/app/team",
    target: "team-perms",
    title: "Everyone sees only what they should",
    body: "Four roles, each with its own permissions. For example, a viewer can read the dashboards but can't see anyone else's salary.",
    doLabel: "Preview as a viewer",
    do: ({ run }) => run("ws-view-as", "viewer"),
  },
  {
    chapter: "Team & security",
    route: "/app/payroll",
    target: "payroll-table",
    title: "Row-level access, in practice",
    body: "As a viewer, the payroll page shows only your own record, and every editing button is gone. Switching back to the owner brings everything back.",
    onLeave: ({ run }) => run("ws-view-as", "owner"),
  },

  // ---- 7. Export ----------------------------------------------------------
  {
    chapter: "Export",
    route: "/app/reports",
    search: "?view=pl",
    target: "report-export",
    title: "Export for your accountant or bank",
    body: "One click exports the 12-month profit & loss as a spreadsheet, and every report page prints cleanly. Spreadsheet exports are protected against formula tricks.",
    youDo: "Click Export CSV.",
    doLabel: "Export the P&L",
    do: ({ clickOn, sleep }) => {
      clickOn(S("report-export"));
      return sleep(300);
    },
  },
  {
    chapter: "Export",
    route: "/app/settings",
    target: "settings-backup",
    title: "Encrypted backups",
    body: "Download the whole workspace as an encrypted backup file, and restore it on any device with the passphrase.",
  },
  {
    chapter: "Done",
    route: "/app",
    target: null,
    title: "That's EPRI.",
    body: "Sign up, upload a year of numbers, and every month you'll know what you made, where it went, and what to do next. For less than one hour with an accountant.",
  },
];
