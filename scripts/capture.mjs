// Takes screenshots of a project running locally, for scripts/images.mjs.
//
//   node scripts/capture.mjs <slug> <baseUrl> <outDir>
//
// Uses the Chromium at CHROME_PATH (default /opt/pw-browsers/chromium).
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const wait = (page, ms = 600) => page.waitForTimeout(ms);

// EPRI's guided tour builds a sample bakery step by step. We walk it to the end with the
// tour's own "Next" / "Do it & continue" button, keep the sample, then shoot the real pages.
async function runEpri(page, baseUrl, shoot) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await shoot("landing");
  await page.getByRole("button", { name: /take the 3-minute tour/i }).first().click();
  const keep = page.getByRole("button", { name: /keep exploring the sample/i });
  for (let i = 0; i < 40 && !(await keep.isVisible().catch(() => false)); i++) {
    await page.locator(".tour-card .tour-go .btn.primary").first().click({ timeout: 20000 });
    await wait(page, 1200);
  }
  await keep.click();
  await wait(page, 1200);
  await shoot("dashboard");
  await page.keyboard.press("a");
  await wait(page, 900);
  await shoot("advisor");
  await page.keyboard.press("Escape");
  for (const [name, label] of [["reports", "Monthly reports"], ["pricing-studio", "Pricing studio"]]) {
    await page.getByRole("link", { name: label }).first().click();
    await wait(page, 1200);
    await shoot(name);
  }
}

async function marketplaceDemoLogin(page) {
  await page.goto(new URL("/login", page.url()).toString(), { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /try the demo account/i }).click();
  await wait(page, 1500);
}

const SETUP = {
  // the store opens its template tour once per visitor; mark it seen so the shots show the store
  foundry: (page) => page.addInitScript(() => localStorage.setItem("foundry_tour_seen", "1")),
  marketplace: async (page, baseUrl) => {
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await marketplaceDemoLogin(page);
  },
};

const SHOTS = {
  marketplace: [
    { name: "home", path: "/" },
    { name: "explore", path: "/explore" },
    { name: "product", path: "/product/contract-redliner-skill" },
    {
      name: "checkout",
      path: "/product/prompt-engineering-masterclass",
      before: async (page) => {
        await page.getByRole("button", { name: /add to cart|buy now/i }).first().click();
        await wait(page, 800);
        await page.goto(new URL("/checkout", page.url()).toString(), { waitUntil: "networkidle" });
      },
    },
    { name: "creator-studio", path: "/dashboard/creator" },
  ],
  foundry: [
    {
      name: "store-home",
      path: "/",
      before: (page) => wait(page, 1500),
    },
    { name: "templates", path: "/templates" },
    { name: "made-for-you", path: "/made-for-you" },
    {
      name: "tour",
      path: "/",
      before: async (page) => {
        await page.getByRole("button", { name: /try a template live/i }).first().click();
        await wait(page, 3000);
      },
    },
    { name: "template-page", path: "/t/helix-ai" },
    {
      name: "cart",
      path: "/t/aurora-commerce",
      before: async (page) => {
        await page.getByRole("button", { name: /add to cart/i }).first().click();
        await wait(page, 800);
        await page.goto(new URL("/cart", page.url()).toString(), { waitUntil: "networkidle" });
      },
    },
  ],
  epri: runEpri,
  jarvis: [{ name: "login", path: "/login" }],
};

async function main() {
  const [slug, baseUrl, outDir] = process.argv.slice(2);
  const shots = SHOTS[slug];
  if (!shots || !baseUrl || !outDir) throw new Error(`usage: capture.mjs <${Object.keys(SHOTS).join("|")}> <baseUrl> <outDir>`);
  mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "/opt/pw-browsers/chromium" });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" });
  const page = await context.newPage();
  try {
    const shoot = async (name) => {
      await wait(page);
      const file = path.join(outDir, `${name}.png`);
      await page.screenshot({ path: file });
      console.log(file);
    };
    if (SETUP[slug]) await SETUP[slug](page, baseUrl);
    if (typeof shots === "function") {
      await shots(page, baseUrl, shoot);
    } else {
      for (const shot of shots) {
        await page.goto(new URL(shot.path, baseUrl).toString(), { waitUntil: "networkidle" });
        if (shot.before) await shot.before(page);
        await shoot(shot.name);
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
