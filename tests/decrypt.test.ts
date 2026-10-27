import { test, expect } from "vitest";
import { scrambleFrame, GLYPHS } from "@/lib/decrypt";

test("progress 0 keeps length and spaces, shows no final letters", () => {
  const f = scrambleFrame("Cryptic Inc.", 0, () => 0);
  expect(f).toHaveLength(12);
  expect(f[7]).toBe(" ");
  expect(f.startsWith("C")).toBe(false);
  expect([...f.replace(" ", "")].every((c) => GLYPHS.includes(c))).toBe(true);
});

test("progress 1 is the final text", () => {
  expect(scrambleFrame("Cryptic Inc.", 1, Math.random)).toBe("Cryptic Inc.");
});

test("progress 0.5 reveals the first half", () => {
  expect(scrambleFrame("abcdef", 0.5, () => 0).slice(0, 3)).toBe("abc");
});

test("progress outside 0..1 is clamped", () => {
  expect(scrambleFrame("abc", 2, () => 0)).toBe("abc");
  expect(scrambleFrame("abc", -1, () => 0)).toHaveLength(3);
});
