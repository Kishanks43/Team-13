import { diffText } from "../src/engine/diff.js";
import { findConflicts } from "../src/engine/conflicts.js";
import { buildMergedText } from "../src/engine/merge.js";

describe("merged result resolutions", () => {
  const a = "start\nA version\nend";
  const b = "start\nB version\nend";
  const ops = diffText(a, b);
  const conflicts = findConflicts(ops);

  test("Accept A inserts exactly the Version A lines", () => {
    expect(buildMergedText(ops, conflicts, { 1: "A" })).toBe("start\nA version\nend");
  });

  test("Accept B inserts exactly the Version B lines", () => {
    expect(buildMergedText(ops, conflicts, { 1: "B" })).toBe("start\nB version\nend");
  });

  test("Accept Both inserts A lines followed by B lines", () => {
    expect(buildMergedText(ops, conflicts, { 1: "both" })).toBe("start\nA version\nB version\nend");
  });

  test("an open conflict contributes no lines", () => {
    expect(buildMergedText(ops, conflicts, {})).toBe("start\nend");
  });
});