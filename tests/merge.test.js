import { describe, test, expect } from "@jest/globals";
import { diffText } from "../src/engine/diff.js";
import { findConflicts } from "../src/engine/conflicts.js";
import { buildMergedText, linesForResolution } from "../src/engine/merge.js";

const a = "top\nA1\nA2\nmiddle\nA3\nbottom";
const b = "top\nB1\nmiddle\nB2\nB3\nbottom";
const ops = diffText(a, b);
const conflicts = findConflicts(ops);

describe("buildMergedText", () => {
  test("two conflicts in this fixture", () => {
    expect(conflicts).toHaveLength(2);
  });

  test("open conflicts render standard Git markers; equal lines are copied", () => {
    expect(buildMergedText(ops, conflicts, {})).toBe(
      "top\n<<<<<<< A\nA1\nA2\n=======\nB1\n>>>>>>> B\nmiddle\n<<<<<<< A\nA3\n=======\nB2\nB3\n>>>>>>> B\nbottom"
    );
  });

  test("Accept A inserts exactly the A lines", () => {
    expect(buildMergedText(ops, conflicts, { 1: "A", 2: "A" })).toBe("top\nA1\nA2\nmiddle\nA3\nbottom");
  });

  test("Accept B inserts exactly the B lines", () => {
    expect(buildMergedText(ops, conflicts, { 1: "B", 2: "B" })).toBe("top\nB1\nmiddle\nB2\nB3\nbottom");
  });

  test("Accept Both is the A lines followed by the B lines, with no blank lines", () => {
    const merged = buildMergedText(ops, conflicts, { 1: "both", 2: "both" });
    expect(merged).toBe("top\nA1\nA2\nB1\nmiddle\nA3\nB2\nB3\nbottom");
    expect(merged.split("\n")).not.toContain("");
  });

  test("each conflict is resolved independently", () => {
    expect(buildMergedText(ops, conflicts, { 1: "B", 2: "A" })).toBe("top\nB1\nmiddle\nA3\nbottom");
  });

  test("identical inputs merge to the same text", () => {
    const same = diffText("x\ny", "x\ny");
    expect(buildMergedText(same, findConflicts(same), {})).toBe("x\ny");
  });

  test("a pure addition and a pure deletion behave as expected", () => {
    const addOps = diffText("a\nc", "a\nb\nc");
    const addConflicts = findConflicts(addOps);
    expect(buildMergedText(addOps, addConflicts, { 1: "A" })).toBe("a\nc");
    expect(buildMergedText(addOps, addConflicts, { 1: "B" })).toBe("a\nb\nc");
  });

  test("linesForResolution returns copies, never the conflict's own arrays", () => {
    const lines = linesForResolution(conflicts[0], "A");
    lines.push("junk");
    expect(conflicts[0].aLines).toEqual(["A1", "A2"]);
  });
});
