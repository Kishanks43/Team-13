import { describe, test, expect } from "@jest/globals";
import { diffText } from "../src/engine/diff.js";
import { findConflicts } from "../src/engine/conflicts.js";
import { buildMergedText } from "../src/engine/merge.js";
import { buildMergedWithMarkers } from "../src/engine/manualEdit.js";

const textA = "top\nA1\nmid\nA2\nend";
const textB = "top\nB1\nmid\nB2\nend";
const ops = diffText(textA, textB);
const conflicts = findConflicts(ops);

describe("S3-04 Git-style conflict markers", () => {
  test("shows the standard markers for every open conflict in the merged pane model", () => {
    const merged = buildMergedWithMarkers(ops, conflicts, {});
    expect(merged.lines.join("\n")).toBe(
      "top\n<<<<<<< A\nA1\n=======\nB1\n>>>>>>> B\nmid\n<<<<<<< A\nA2\n=======\nB2\n>>>>>>> B\nend"
    );
  });

  test("removes a conflict's markers as soon as it is resolved", () => {
    const merged = buildMergedWithMarkers(ops, conflicts, { 1: "A" });
    expect(merged.lines.join("\n")).toBe(
      "top\nA1\nmid\n<<<<<<< A\nA2\n=======\nB2\n>>>>>>> B\nend"
    );
  });

  test("keeps the pure engine merge contract marker-free", () => {
    expect(buildMergedText(ops, conflicts, {})).toBe("top\nmid\nend");
  });
});
