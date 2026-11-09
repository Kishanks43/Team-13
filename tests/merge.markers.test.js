import { describe, test, expect } from "@jest/globals";
import { diffText } from "../src/engine/diff.js";
import { findConflicts } from "../src/engine/conflicts.js";
import { buildMergedText } from "../src/engine/merge.js";
import { hasConflictMarkers, countConflictMarkers } from "../src/engine/markers.js";
import { setStatus, createResolutions } from "../src/engine/resolutions.js";
import { samples } from "../src/samples.js";

const setup = (a, b) => {
  const ops = diffText(a, b);
  return { ops, conflicts: findConflicts(ops) };
};

describe("S3-04 merged text with open conflicts", () => {
  const { ops, conflicts } = setup("1\nx\n2\ny\n3", "1\nX\n2\nY\n3");

  test("open conflicts appear with Git-style markers", () => {
    expect(buildMergedText(ops, conflicts, createResolutions())).toBe(
      ["1", "<<<<<<< A", "x", "=======", "X", ">>>>>>> B", "2", "<<<<<<< A", "y", "=======", "Y", ">>>>>>> B", "3"].join("\n")
    );
  });
  test("resolving one conflict removes only its markers", () => {
    const text = buildMergedText(ops, conflicts, setStatus(createResolutions(), 1, "A"));
    expect(text.startsWith("1\nx\n2\n<<<<<<< A")).toBe(true);
    expect(countConflictMarkers(text)).toBe(1);
  });
  test("once everything is resolved no markers remain", () => {
    const res = setStatus(setStatus(createResolutions(), 1, "B"), 2, "both");
    expect(hasConflictMarkers(buildMergedText(ops, conflicts, res))).toBe(false);
  });
  test("added conflict: the empty A side still shows all three markers", () => {
    const s = setup("a\nb", "a\nb\nc");
    expect(buildMergedText(s.ops, s.conflicts, createResolutions())).toBe("a\nb\n<<<<<<< A\n=======\nc\n>>>>>>> B");
  });
  test("manual with no stored text keeps the markers", () => {
    const res = setStatus(createResolutions(), 1, "manual");
    expect(hasConflictMarkers(buildMergedText(ops, conflicts, res))).toBe(true);
  });
  test.each(samples)("sample $id shows one marker block per conflict", (sample) => {
    const s = setup(sample.a, sample.b);
    expect(countConflictMarkers(buildMergedText(s.ops, s.conflicts, createResolutions()))).toBe(sample.expectedRegions);
  });
});
