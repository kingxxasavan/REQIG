// Generates the site's low poly crystal backdrop (our own art, so no wallpaper
// licensing questions) into public/backdrop.webp and records it in the manifest.
//
//   node scripts/backdrop.mjs
import { mkdirSync } from "node:fs";
import sharp from "sharp";
import { writeManifest } from "./images.mjs";

const W = 2560;
const H = 1600;
const COLS = 18;
const ROWS = 12;
const PALETTE = ["#2a1b5e", "#3b2a8f", "#5b3fd1", "#1e3a8a", "#0e7490", "#6d28d9"];
const INK = [7, 6, 12];

// mulberry32: small seeded PRNG so the backdrop is the same every run
function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

const rand = rng(7);
const points = [];
for (let r = 0; r <= ROWS; r++) {
  const row = [];
  for (let c = 0; c <= COLS; c++) {
    const edge = r === 0 || c === 0 || r === ROWS || c === COLS;
    const jx = edge ? 0 : (rand() - 0.5) * (W / COLS) * 0.8;
    const jy = edge ? 0 : (rand() - 0.5) * (H / ROWS) * 0.8;
    row.push([(c * W) / COLS + jx, (r * H) / ROWS + jy]);
  }
  points.push(row);
}

function shade(tri) {
  const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3;
  const cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
  const base = hex(PALETTE[Math.floor(rand() * PALETTE.length)]);
  // light from the upper middle, facets darken toward the edges of the screen
  const light = 1 - Math.min(1, Math.hypot((cx - W * 0.55) / W, (cy - H * 0.3) / H) * 1.25);
  const facet = 0.75 + rand() * 0.5;
  const lit = base.map((v) => Math.min(255, v * facet * (0.6 + light * 0.9)));
  const edge = Math.max(Math.abs(cx / W - 0.5) * 2, Math.abs(cy / H - 0.5) * 2);
  return mix(lit, INK, Math.min(1, 0.25 + edge * 0.55));
}

let polys = "";
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const a = points[r][c];
    const b = points[r][c + 1];
    const d = points[r + 1][c];
    const e = points[r + 1][c + 1];
    const tris = rand() > 0.5 ? [[a, b, e], [a, e, d]] : [[a, b, d], [b, e, d]];
    for (const tri of tris) {
      const [R, G, B] = shade(tri);
      const pts = tri.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
      polys += `<polygon points="${pts}" fill="rgb(${R},${G},${B})" stroke="rgb(${R},${G},${B})" stroke-width="1"/>`;
    }
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${polys}</svg>`;
mkdirSync("public", { recursive: true });
const info = await sharp(Buffer.from(svg)).resize({ width: 1600 }).blur(1.2).webp({ quality: 70 }).toFile("public/backdrop.webp");
writeManifest({ "/backdrop.webp": { width: info.width, height: info.height } });
console.log(`public/backdrop.webp ${info.width}x${info.height}`);
