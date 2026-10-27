// End to end click through of the built site.
//
//   npm run build && npx serve out -l 4321 &
//   node scripts/e2e.mjs http://localhost:4321
//
// Uses the Chromium at CHROME_PATH (default /opt/pw-browsers/chromium).
import { chromium } from "playwright-core";

const BASE = process.argv[2] ?? "http://localhost:4321";
const SECTIONS = ["Projects", "Functions", "Playbook", "Contributions", "Future"];
const results = [];

async function check(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  ok   ${name}`);
  } catch (err) {
    results.push({ name, ok: false, err });
    console.log(`  FAIL ${name}\n       ${err.message.split("\n")[0]}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "/opt/pw-browsers/chromium" });

async function page(options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options });
  const p = await context.newPage();
  p.errors = [];
  p.on("console", (m) => m.type() === "error" && p.errors.push(m.text()));
  p.on("pageerror", (e) => p.errors.push(e.message));
  return p;
}

const inside = (box, vw, vh) => box && box.x >= 0 && box.y >= 0 && box.x + box.width <= vw + 0.5 && box.y + box.height <= vh + 0.5;

try {
  const p = await page();

  await check("home shows six project cards with no console errors", async () => {
    await p.goto(BASE + "/", { waitUntil: "networkidle" });
    const cards = await p.locator("article.tilt-card").count();
    assert(cards === 6, `expected 6 project cards, got ${cards}`);
    assert(p.errors.length === 0, `console errors: ${p.errors.join(" | ")}`);
  });

  await check("each taskbar section button brings its section into view", async () => {
    for (const label of SECTIONS) {
      await p.locator('nav[aria-label="Taskbar"]').getByRole("button", { name: label, exact: true }).click();
      await p.waitForTimeout(1200);
      const top = await p.evaluate((id) => document.getElementById(id).getBoundingClientRect().top, label.toLowerCase());
      assert(top > -5 && top < 450, `${label}: section top at ${Math.round(top)}px`);
    }
  });

  await check("docs menu opens, Escape closes it and returns focus, a guide opens", async () => {
    const docs = p.locator('nav[aria-label="Taskbar"]').getByRole("button", { name: "Docs", exact: true });
    await docs.click();
    assert(await p.locator("#docs-menu").isVisible(), "docs menu did not open");
    await p.keyboard.press("Escape");
    await p.waitForTimeout(150);
    assert((await p.locator("#docs-menu").count()) === 0, "docs menu still open after Escape");
    const focused = await p.evaluate(() => document.activeElement?.getAttribute("aria-label"));
    assert(focused === "Docs", `focus went to ${focused}`);
    await docs.click();
    await p.locator("#docs-menu").getByRole("link", { name: "PolyOS 7 for Debian setup", exact: true }).click();
    await p.waitForURL(/\/docs\/polyos-setup$/);
  });

  await check("downloading a guide gives the markdown file", async () => {
    const res = await p.request.get(BASE + "/downloads/polyos-setup.md");
    assert(res.status() === 200, `status ${res.status()}`);
    const text = await res.text();
    assert(text.includes("# PolyOS for Debian"), "file is not the PolyOS README");
  });

  await check("start menu search opens a project page", async () => {
    await p.goto(BASE + "/", { waitUntil: "networkidle" });
    await p.keyboard.press("Control+k");
    await p.keyboard.type("jarvis");
    await p.keyboard.press("Enter");
    await p.waitForURL(/\/projects\/jarvis$/);
  });

  await check("functions tabs switch the function list", async () => {
    await p.goto(BASE + "/#functions", { waitUntil: "networkidle" });
    await p.getByRole("tab", { name: "JARVIS" }).click();
    const panel = p.getByRole("tabpanel");
    await panel.getByText("Owner only, with two factor").waitFor({ timeout: 3000 });
    assert(!(await panel.getByText("A home that knows your day").count()), "Cryptic Hub functions still showing");
  });

  await check("lightbox opens from the PolyOS gallery and closes with Escape", async () => {
    await p.goto(BASE + "/projects/polyos", { waitUntil: "networkidle" });
    const thumb = p.getByRole("button", { name: /Open screenshot: Vara/ });
    await thumb.scrollIntoViewIfNeeded();
    await thumb.click();
    await p.getByRole("dialog").waitFor({ timeout: 3000 });
    await p.keyboard.press("Escape");
    await p.waitForTimeout(150);
    assert((await p.getByRole("dialog").count()) === 0, "lightbox still open");
  });

  await check("unknown project and doc show the Not responding page", async () => {
    for (const path of ["/projects/nope", "/docs/nope"]) {
      await p.goto(BASE + path, { waitUntil: "networkidle" });
      assert(await p.getByText("Not responding").first().isVisible(), `${path} did not show Not responding`);
    }
  });

  const phone = await page({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });

  await check("no sideways scroll at 375px and menus fit the screen", async () => {
    for (const path of ["/", "/projects/polyos", "/docs", "/docs/polyos-setup"]) {
      await phone.goto(BASE + path, { waitUntil: "networkidle" });
      const width = await phone.evaluate(() => document.documentElement.scrollWidth);
      assert(width <= 375, `${path} is ${width}px wide`);
    }
    await phone.goto(BASE + "/", { waitUntil: "networkidle" });
    await phone.locator('nav[aria-label="Taskbar"]').getByRole("button", { name: "Docs", exact: true }).click();
    assert(inside(await phone.locator("#docs-menu").boundingBox(), 375, 812), "docs menu overflows the screen");
    await phone.keyboard.press("Escape");
    await phone.getByRole("button", { name: "Open the start menu" }).click();
    assert(inside(await phone.locator("#start-menu").boundingBox(), 375, 812), "start menu overflows the screen");
  });

  const still = await page({ reducedMotion: "reduce" });

  await check("with reduced motion the hero reads Cryptic Inc. right away", async () => {
    await still.goto(BASE + "/", { waitUntil: "domcontentloaded" });
    const shown = await still.locator("h1 > span[aria-hidden] > span:last-child").first().textContent();
    assert(shown === "Cryptic Inc.", `hero shows "${shown}"`);
    await still.waitForTimeout(500);
    const later = await still.locator("h1 > span[aria-hidden] > span:last-child").first().textContent();
    assert(later === "Cryptic Inc.", `hero changed to "${later}"`);
  });
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
