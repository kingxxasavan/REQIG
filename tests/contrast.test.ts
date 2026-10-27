import { test, expect } from "vitest";
import { readFileSync } from "node:fs";

// WCAG relative luminance contrast between two #rrggbb colors
function contrast(a: string, b: string) {
  const lum = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const css = readFileSync("app/globals.css", "utf8");
const token = (name: string) => new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})`, "i").exec(css)![1];

// the lightest glass a label sits on: a window over a bright crystal facet
const LIGHTEST_GLASS = "#262138";

test.each(["fg", "muted", "faint"])("%s text passes WCAG AA (4.5:1) on glass", (name) => {
  expect(contrast(token(name), LIGHTEST_GLASS)).toBeGreaterThanOrEqual(4.5);
});
