import { test, expect } from "vitest";
import { readFileSync } from "node:fs";

const config = JSON.parse(readFileSync("vercel.json", "utf8"));

// The Vercel project was created for the old Vite app and still has "dist" saved as its
// Output Directory. For Next.js, Vercel reads that setting as where Next's build output
// lives, so vercel.json must pin it back to Next's default or every deploy fails with
// NEXT_OUTPUT_DIR_MISSING.
test("vercel.json pins the Next.js preset and its output directory", () => {
  expect(config.framework).toBe("nextjs");
  expect(config.outputDirectory).toBe(".next");
});
