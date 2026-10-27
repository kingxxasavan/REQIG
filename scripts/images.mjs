// Converts screenshots into public/projects/<slug>/<name>.webp (max 1600px wide)
// and records each output's size in lib/data/images.json.
//
//   node scripts/images.mjs --slug polyos --in ../shots [--map old=new ...] [--only a,b]
//   node scripts/images.mjs --file path/to/x.svg --out /backdrop.webp
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

const MANIFEST = "lib/data/images.json";
const MAX_WIDTH = 1600;
const EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".svg"]);

function parseArgs(argv) {
  const args = { map: {} };
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key === "--map") {
      const [from, to] = value.split("=");
      args.map[from] = to;
      i++;
    } else if (key.startsWith("--")) {
      args[key.slice(2)] = value;
      i++;
    }
  }
  return args;
}

export async function convert(input, publicPath, quality = 82) {
  const out = path.join("public", publicPath);
  mkdirSync(path.dirname(out), { recursive: true });
  const info = await sharp(input, { density: 144 })
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality })
    .toFile(out);
  return { width: info.width, height: info.height };
}

export function writeManifest(entries) {
  const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : {};
  Object.assign(manifest, entries);
  const sorted = Object.fromEntries(Object.keys(manifest).sort().map((k) => [k, manifest[k]]));
  writeFileSync(MANIFEST, JSON.stringify(sorted, null, 2) + "\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const entries = {};

  if (args.file) {
    entries[args.out] = await convert(args.file, args.out, Number(args.quality ?? 82));
  } else {
    if (!args.slug || !args.in) throw new Error("usage: --slug <slug> --in <dir> [--map old=new] [--only a,b]");
    const only = args.only ? new Set(args.only.split(",")) : null;
    for (const file of readdirSync(args.in).sort()) {
      const ext = path.extname(file).toLowerCase();
      if (!EXTENSIONS.has(ext)) continue;
      const base = path.basename(file, ext);
      if (only && !only.has(base)) continue;
      const name = args.map[base] ?? base;
      const publicPath = `/projects/${args.slug}/${name}.webp`;
      entries[publicPath] = await convert(path.join(args.in, file), publicPath);
      console.log(`${publicPath}  ${entries[publicPath].width}x${entries[publicPath].height}`);
    }
  }

  writeManifest(entries);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
