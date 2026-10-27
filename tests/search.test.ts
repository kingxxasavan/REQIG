import { test, expect } from "vitest";
import { buildIndex, searchItems } from "@/lib/search";

const idx = buildIndex();

test.each(["", "   "])("empty query %j gives the pinned items", (q) => {
  expect(searchItems(idx, q).map((i) => i.id)).toEqual(["cryptic-hub", "jarvis", "polyos", "foundry", "epri", "marketplace", "playbook"]);
});

test("case insensitive and every word must match", () => {
  expect(searchItems(idx, "POLY setup")[0].href).toBe("/docs/polyos-setup");
});

test("finds a project by name", () => {
  expect(searchItems(idx, "jarvis")[0].href).toBe("/projects/jarvis");
});

test("finds sections", () => {
  expect(searchItems(idx, "contributions").some((i) => i.href === "/#contributions")).toBe(true);
});

test.each(["c++", "(", ".*", "[", "\\", "?"])("odd input %j does not throw", (q) => {
  expect(() => searchItems(idx, q)).not.toThrow();
});

test("no match gives nothing", () => {
  expect(searchItems(idx, "zzzz")).toEqual([]);
});

test("ids are unique", () => {
  expect(new Set(idx.map((i) => i.id)).size).toBe(idx.length);
});

test("index never links private source", () => {
  expect(idx.some((i) => /github\.com\/kingxxasavan\/(jarvis|cryptichub)/i.test(i.href))).toBe(false);
});
