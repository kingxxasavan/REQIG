import { AD_CHANNELS, AGE_GROUPS } from "./industries.js";

// Channel weights from the customer age mix, B2B/B2C and reach.
export function channelSplit(demo) {
  const total = AGE_GROUPS.reduce((s, g) => s + (demo.ages?.[g] || 0), 0) || 1;
  const b2b = demo.customerType === "B2B" ? 1 : demo.customerType === "Both" ? 0.5 : 0;
  const raw = Object.entries(AD_CHANNELS).map(([key, ch]) => {
    let w = AGE_GROUPS.reduce((s, g) => s + ((demo.ages?.[g] || 0) / total) * ch.ages[g], 0);
    w = w * (1 - b2b) + ch.b2b * b2b;
    if (demo.reach === "Local" && key === "local") w *= 1.8;
    if (demo.reach === "Local" && key === "search") w *= 1.2;
    if (demo.reach === "National / online" && key === "local") w *= 0.3;
    if (demo.reach === "National / online" && (key === "search" || key === "instagram")) w *= 1.25;
    return { key, label: ch.label, w };
  });
  const sum = raw.reduce((s, r) => s + r.w, 0);
  return raw.map((r) => ({ ...r, share: r.w / sum })).sort((a, b) => b.share - a.share);
}
