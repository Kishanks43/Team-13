import { describe, test, expect } from "@jest/globals";
import { findConflicts, findConflictsInText } from "../src/engine/conflicts.js";
import { diffText, countChangeRegions } from "../src/engine/diff.js";
import { samples } from "../src/samples.js";

const lines = (...l) => l.join("\n");

describe("findConflicts", () => {
  test("a file with 3 differing regions gives 3 conflicts", () => {
    const a = lines("one", "two", "three", "four", "five", "six", "seven");
    const b = lines("ONE", "two", "three", "FOUR", "five", "six", "SEVEN");
    expect(findConflictsInText(a, b)).toHaveLength(3);
  });

  test("identical versions have no conflicts", () => {
    expect(findConflictsInText("a\nb\nc", "a\nb\nc")).toEqual([]);
  });

  test("two empty versions have no conflicts", () => {
    expect(findConflictsInText("", "")).toEqual([]);
  });

  test("conflicts are numbered 1, 2, 3 in order", () => {
    const conflicts = findConflictsInText(lines("a", "x", "b", "y", "c"), lines("a", "X", "b", "Y", "c"));
    expect(conflicts.map((c) => c.id)).toEqual([1, 2]);
  });

  test("a changed line has both sides, with the right line numbers", () => {
    const [c] = findConflictsInText(lines("a", "old", "c"), lines("a", "new", "c"));
    expect(c).toMatchObject({ id: 1, type: "changed", aStart: 2, bStart: 2, aLines: ["old"], bLines: ["new"] });
  });

  test("an inserted line is an 'added' conflict that records where it would go in A", () => {
    const [c] = findConflictsInText(lines("a", "c"), lines("a", "b", "c"));
    expect(c).toMatchObject({ type: "added", aStart: 2, bStart: 2, aLines: [], bLines: ["b"] });
  });

  test("a deleted line is a 'removed' conflict that records where it would go in B", () => {
    const [c] = findConflictsInText(lines("a", "b", "c"), lines("a", "c"));
    expect(c).toMatchObject({ type: "removed", aStart: 2, bStart: 2, aLines: ["b"], bLines: [] });
  });

  test("a conflict at the very start", () => {
    const [c] = findConflictsInText(lines("x", "b"), lines("y", "b"));
    expect(c).toMatchObject({ aStart: 1, bStart: 1, aLines: ["x"], bLines: ["y"] });
  });

  test("a conflict at the very end", () => {
    const [c] = findConflictsInText(lines("a", "x"), lines("a", "y"));
    expect(c).toMatchObject({ aStart: 2, bStart: 2, aLines: ["x"], bLines: ["y"] });
  });

  test("everything differs when one version is empty", () => {
    const [c] = findConflictsInText("", lines("a", "b"));
    expect(c).toMatchObject({ type: "added", aStart: 1, bStart: 1, aLines: [], bLines: ["a", "b"] });
  });

  test("consecutive changed lines stay together as one conflict", () => {
    const conflicts = findConflictsInText(lines("a", "x1", "x2", "x3", "z"), lines("a", "y1", "y2", "z"));
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].aLines).toEqual(["x1", "x2", "x3"]);
    expect(conflicts[0].bLines).toEqual(["y1", "y2"]);
  });

  test("opStart and opEnd slice out exactly that conflict's ops", () => {
    const ops = diffText(lines("a", "x", "b", "y"), lines("a", "X", "b", "Y"));
    for (const c of findConflicts(ops)) {
      const slice = ops.slice(c.opStart, c.opEnd);
      expect(slice.length).toBeGreaterThan(0);
      expect(slice.every((op) => op.type !== "equal")).toBe(true);
    }
  });

  test("the number of conflicts always equals the number of change regions", () => {
    for (const sample of samples) {
      const ops = diffText(sample.a, sample.b);
      expect(findConflicts(ops)).toHaveLength(countChangeRegions(ops));
    }
  });

  test("each built-in sample gives its expected number of conflicts", () => {
    for (const sample of samples) {
      expect(findConflictsInText(sample.a, sample.b)).toHaveLength(sample.expectedRegions);
    }
  });

  test("Windows line endings give the same conflicts as Unix ones", () => {
    const unix = findConflictsInText("a\nx\nc", "a\ny\nc");
    const windows = findConflictsInText("a\r\nx\r\nc", "a\r\ny\r\nc");
    expect(windows).toEqual(unix);
  });
});
