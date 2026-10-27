// Draws the JARVIS diagrams (its real app needs a private Supabase login, so the
// showcase explains it with diagrams instead). Writes SVGs to scripts/diagrams/jarvis/,
// then convert them with: node scripts/images.mjs --slug jarvis --in scripts/diagrams/jarvis
import { mkdirSync, writeFileSync } from "node:fs";

const W = 1600;
const H = 900;
const CYAN = "#67e8f9";
const BLUE = "#7c8cff";
const VIOLET = "#a78bfa";
const FG = "#e8f6ff";
const MUTED = "#8aa4b8";

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function frame(title, subtitle, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glow" cx="50%" cy="45%" r="70%">
      <stop offset="0" stop-color="#0b2a3f"/><stop offset="1" stop-color="#03070d"/>
    </radialGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" fill="none" stroke="#67e8f9" stroke-opacity="0.05"/>
    </pattern>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M0 0L10 5L0 10z" fill="${CYAN}"/>
    </marker>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <text x="80" y="104" font-family="Inter" font-weight="600" font-size="44" fill="${FG}">${esc(title)}</text>
  <text x="80" y="148" font-family="Inter" font-size="22" fill="${MUTED}">${esc(subtitle)}</text>
  ${body}
</svg>`;
}

function box({ x, y, w, h, title, lines = [], accent = CYAN, tag }) {
  const text = lines
    .map((l, i) => `<text x="${x + 24}" y="${y + 92 + i * 30}" font-family="Inter" font-size="20" fill="${MUTED}">${esc(l)}</text>`)
    .join("");
  const label = tag
    ? `<text x="${x + 24}" y="${y + 34}" font-family="JetBrains Mono" font-size="14" letter-spacing="2" fill="${accent}">${esc(tag)}</text>`
    : "";
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" fill="#0a1824" fill-opacity="0.85" stroke="${accent}" stroke-opacity="0.45"/>
    <rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="2" rx="1" fill="#ffffff" fill-opacity="0.08"/>
    ${label}
    <text x="${x + 24}" y="${y + 62}" font-family="Inter" font-weight="600" font-size="26" fill="${FG}">${esc(title)}</text>
    ${text}
  </g>`;
}

function arrow({ x1, y1, x2, y2, label, lx, ly, both = false, dashed = false }) {
  const tag = label
    ? `<text x="${lx ?? (x1 + x2) / 2}" y="${ly ?? (y1 + y2) / 2 - 12}" text-anchor="middle" font-family="JetBrains Mono" font-size="16" fill="${CYAN}">${esc(label)}</text>`
    : "";
  return `<g>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${CYAN}" stroke-opacity="0.8" stroke-width="2.5" ${dashed ? 'stroke-dasharray="8 8"' : ""} marker-end="url(#arrow)" ${both ? 'marker-start="url(#arrow)"' : ""}/>
    ${tag}
  </g>`;
}

const architecture = frame(
  "How JARVIS fits together",
  "A website you can open anywhere, plus an agent on your own laptop. Nothing on the laptop is exposed to the internet.",
  [
    box({ x: 80, y: 260, w: 340, h: 200, tag: "ANYWHERE", title: "Browser", lines: ["Chromebook, phone, laptop", "chat, voice, apps, files"] }),
    box({ x: 560, y: 230, w: 480, h: 260, tag: "VERCEL", title: "web/ (Next.js)", accent: BLUE, lines: ["login + two-factor", "chat, tools, memory", "arkia.buzz, YouTube"] }),
    box({ x: 1180, y: 200, w: 340, h: 150, tag: "PRIMARY", title: "NVIDIA NIM", accent: VIOLET, lines: ["nemotron 120B"] }),
    box({ x: 1180, y: 390, w: 340, h: 150, tag: "FALLBACK", title: "Ollama Cloud", accent: VIOLET, lines: ["gpt-oss 120B"] }),
    box({ x: 560, y: 600, w: 480, h: 190, tag: "SUPABASE", title: "Postgres + Auth", accent: BLUE, lines: ["conversations, memory", "jobs, devices, files"] }),
    box({ x: 1180, y: 610, w: 340, h: 180, tag: "YOUR LAPTOP", title: "agent/ (Python)", lines: ["apps, media, files", "Claude Code builds"] }),
    arrow({ x1: 420, y1: 360, x2: 556, y2: 360, label: "HTTPS" }),
    arrow({ x1: 1040, y1: 300, x2: 1176, y2: 275 }),
    arrow({ x1: 1040, y1: 420, x2: 1176, y2: 465, dashed: true }),
    arrow({ x1: 800, y1: 490, x2: 800, y2: 596, both: true }),
    arrow({ x1: 1176, y1: 700, x2: 1044, y2: 700, label: "polls for jobs", ly: 686 }),
    `<text x="1350" y="830" text-anchor="middle" font-family="JetBrains Mono" font-size="15" fill="${MUTED}">outbound only + Cloudflare Tunnel for streamed apps</text>`,
  ].join("\n"),
);

const agent = frame(
  "Build me a project on my laptop",
  "One sentence in chat becomes a real project: Claude Code runs on the laptop and the log streams back live.",
  [
    box({ x: 80, y: 230, w: 300, h: 220, tag: "1  YOU", title: "Ask in chat", lines: ["\"build a timer app", "on my laptop\""] }),
    box({ x: 460, y: 230, w: 300, h: 220, tag: "2  JARVIS", title: "Queues a job", accent: BLUE, lines: ["saved in Supabase", "for the paired device"] }),
    box({ x: 840, y: 230, w: 300, h: 220, tag: "3  LAPTOP AGENT", title: "Picks it up", lines: ["polls every few", "seconds, outbound only"] }),
    box({ x: 1220, y: 230, w: 300, h: 220, tag: "4  CLAUDE CODE", title: "Writes the code", accent: VIOLET, lines: ["in a new folder", "on the laptop"] }),
    box({ x: 460, y: 560, w: 680, h: 220, tag: "5  BACK IN THE BROWSER", title: "Live log in Tasks, then a git commit", accent: BLUE, lines: ["optional push to a private GitHub repo", "no Claude Code? JARVIS writes the files itself"] }),
    arrow({ x1: 380, y1: 340, x2: 456, y2: 340 }),
    arrow({ x1: 760, y1: 340, x2: 836, y2: 340 }),
    arrow({ x1: 1140, y1: 340, x2: 1216, y2: 340 }),
    arrow({ x1: 1370, y1: 450, x2: 1144, y2: 640, label: "log + result", lx: 1330, ly: 560 }),
  ].join("\n"),
);

const memory = frame(
  "Memory that keeps up with you",
  "After every reply a background pass decides what is worth remembering, and recall mixes meaning with keywords.",
  [
    box({ x: 80, y: 240, w: 400, h: 230, tag: "AFTER EACH REPLY", title: "Memory pass", lines: ["adds new facts", "updates changed ones", "deletes wrong ones"] }),
    box({ x: 600, y: 240, w: 400, h: 230, tag: "STORED", title: "Long term facts", accent: BLUE, lines: ["importance + last used", "unconfirmed ones flagged", "editable on Memory page"] }),
    box({ x: 1120, y: 240, w: 400, h: 230, tag: "WHEN YOU ASK", title: "Recall", accent: VIOLET, lines: ["meaning (NIM embeddings)", "+ keywords", "+ importance + recency"] }),
    box({ x: 600, y: 580, w: 400, h: 200, tag: "RESULT", title: "Answers that fit you", lines: ["checks old details", "instead of assuming"] }),
    arrow({ x1: 480, y1: 355, x2: 596, y2: 355 }),
    arrow({ x1: 1000, y1: 355, x2: 1116, y2: 355 }),
    arrow({ x1: 1320, y1: 470, x2: 1004, y2: 650 }),
  ].join("\n"),
);

mkdirSync("scripts/diagrams/jarvis", { recursive: true });
writeFileSync("scripts/diagrams/jarvis/architecture.svg", architecture);
writeFileSync("scripts/diagrams/jarvis/agent.svg", agent);
writeFileSync("scripts/diagrams/jarvis/memory.svg", memory);
console.log("wrote scripts/diagrams/jarvis/{architecture,agent,memory}.svg");
