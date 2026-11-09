import { test, expect } from "@jest/globals";
import { diffText, summarize } from "../src/engine/diff.js";
import { findConflicts } from "../src/engine/conflicts.js";

const lines = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join("\n");

test("two completely different 2,000-line files diff quickly", () => {
  const a = lines(2000, (i) => `alpha ${i}`);
  const b = lines(2000, (i) => `beta ${i}`);
  const t = Date.now();
  const ops = diffText(a, b);
  expect(Date.now() - t).toBeLessThan(1000);
  expect(summarize(ops)).toEqual({ added: 2000, removed: 2000, unchanged: 0 });
  expect(findConflicts(ops)).toHaveLength(1);
});

test("2,000 lines with scattered edits stay correct and fast", () => {
  const a = lines(2000, (i) => `line ${i}`);
  const b = lines(2000, (i) => (i % 100 === 50 ? `changed ${i}` : `line ${i}`));
  const t = Date.now();
  const ops = diffText(a, b);
  expect(Date.now() - t).toBeLessThan(1000);
  expect(findConflicts(ops)).toHaveLength(20);
  expect(summarize(ops)).toEqual({ added: 20, removed: 20, unchanged: 1980 });
});

test("heavy overlap with many shuffled lines still finishes", () => {
  const a = lines(2000, (i) => `row ${i % 50}`);
  const b = lines(2000, (i) => `row ${(i * 7) % 50}`);
  const t = Date.now();
  diffText(a, b);
  expect(Date.now() - t).toBeLessThan(5000);
});
