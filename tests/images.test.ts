import { test, expect } from "vitest";
import { existsSync } from "node:fs";
import images from "@/lib/data/images.json";

const manifest = images as Record<string, { width: number; height: number }>;

test("every manifest image exists and is at most 1600px wide", () => {
  for (const [path, size] of Object.entries(manifest)) {
    expect(existsSync(`public${path}`), path).toBe(true);
    expect(size.width).toBeLessThanOrEqual(1600);
    expect(size.height).toBeGreaterThan(0);
  }
});

test("backdrop exists", () => {
  expect(manifest["/backdrop.webp"]).toBeDefined();
});
