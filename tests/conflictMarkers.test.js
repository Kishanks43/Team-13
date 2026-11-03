import { describe, test, expect } from "@jest/globals";
import { diffText } from "../src/engine/diff.js";
import { findConflicts } from "../src/engine/conflicts.js";
import { STATUSES } from "../src/engine/resolutions.js";
import {
  CONFLICT_MARKERS,
  buildMergedText,
  countConflictMarkers,
  hasConflictMarkers,
  markerLines
} from "../src/engine/merge.js";
import { seeded, pick } from "./helpers/seeded.js";

const merge = (a, b, resolutions = {}, options) => {
  const ops = diffText(a, b);
  return buildMergedText(ops, findConflicts(ops), resolutions, options);
};

describe("S3-04: Git-style conflict markers", () => {
  test("uses the standard Git markers", () => {
    expect(CONFLICT_MARKERS).toEqual({ start: "<<<<<<< A", middle: "=======", end: ">>>>>>> B" });
  });

  test("an open conflict is shown exactly as the roadmap describes", () => {
    expect(merge("top\nold\nend", "top\nnew\nend")).toBe(
      ["top", "<<<<<<< A", "old", "=======", "new", ">>>>>>> B", "end"].join("\n")
    );
  });

  test("A lines come before the middle marker and B lines after it", () => {
    const lines = merge("a1\na2", "b1\nb2\nb3").split("\n");
    expect(lines).toEqual(["<<<<<<< A", "a1", "a2", "=======", "b1", "b2", "b3", ">>>>>>> B"]);
  });

  test("an added conflict (only B has lines) has an empty A side", () => {
    expect(merge("a\nc", "a\nb\nc")).toBe("a\n<<<<<<< A\n=======\nb\n>>>>>>> B\nc");
  });

  test("a removed conflict (only A has lines) has an empty B side", () => {
    expect(merge("a\nb\nc", "a\nc")).toBe("a\n<<<<<<< A\nb\n=======\n>>>>>>> B\nc");
  });

  test("each conflict gets its own block, in order", () => {
    const text = merge("a\nb\nc\nd\ne", "a\nB\nc\nD\ne");
    expect(countConflictMarkers(text)).toBe(2);
    expect(text.indexOf("<<<<<<< A\nb")).toBeLessThan(text.indexOf("<<<<<<< A\nd"));
  });

  test("resolving a conflict removes all of its markers", () => {
    for (const status of ["A", "B", "both"]) {
      const text = merge("top\nold\nend", "top\nnew\nend", { 1: status });
      expect(hasConflictMarkers(text)).toBe(false);
      expect(text).not.toContain("=======");
    }
  });

  test("a manual conflict shows no markers (the hand-written text lives in the pane)", () => {
    expect(merge("top\nold\nend", "top\nnew\nend", { 1: "manual" })).toBe("top\nend");
  });

  test("identical versions never show markers", () => {
    expect(merge("a\nb", "a\nb")).toBe("a\nb");
  });

  test("markerLines returns a fresh array and never changes the conflict", () => {
    const [conflict] = findConflicts(diffText("a", "b"));
    const lines = markerLines(conflict);
    lines.push("junk");
    lines[1] = "changed";
    expect(conflict.aLines).toEqual(["a"]);
    expect(conflict.bLines).toEqual(["b"]);
  });
});

describe("countConflictMarkers and hasConflictMarkers", () => {
  test("count one per start marker, whatever the line endings", () => {
    const block = "<<<<<<< A\r\nx\r\n=======\r\ny\r\n>>>>>>> B";
    expect(countConflictMarkers(`${block}\r\nmid\r\n${block}`)).toBe(2);
    expect(countConflictMarkers("plain\ntext")).toBe(0);
  });

  test("a leftover start or end marker counts as unresolved", () => {
    expect(hasConflictMarkers("a\n<<<<<<< A\nb")).toBe(true);
    expect(hasConflictMarkers("a\n>>>>>>> B\nb")).toBe(true);
    expect(hasConflictMarkers("a\n>>>>>>> feature-branch\nb")).toBe(true);
    expect(hasConflictMarkers("<<<<<<<")).toBe(true);
  });

  test("ordinary text is not mistaken for markers", () => {
    expect(hasConflictMarkers("Title\n=======\nBody")).toBe(false); // Markdown heading underline
    expect(hasConflictMarkers("a << b\nx >> y\n<<<<<< six only")).toBe(false);
    expect(hasConflictMarkers("  <<<<<<< A")).toBe(false); // markers start at column 0
    expect(hasConflictMarkers("<<<<<<<<A")).toBe(false);
    expect(hasConflictMarkers("")).toBe(false);
  });
});

describe("properties", () => {
  test("markers appear exactly for open conflicts, and resolving all of them removes every marker", () => {
    const rand = seeded(304);
    const words = ["a", "b", "c", "d", "e", ""];
    for (let round = 0; round < 200; round++) {
      const make = () => Array.from({ length: Math.floor(rand() * 10) }, () => pick(rand, words)).join("\n");
      const ops = diffText(make(), make());
      const conflicts = findConflicts(ops);
      const resolutions = {};
      for (const conflict of conflicts) {
        if (rand() < 0.7) resolutions[conflict.id] = pick(rand, STATUSES);
      }
      const open = conflicts.filter((c) => (resolutions[c.id] ?? "open") === "open").length;
      const text = buildMergedText(ops, conflicts, resolutions);
      expect(countConflictMarkers(text)).toBe(open);
      expect(hasConflictMarkers(text)).toBe(open > 0);

      const allResolved = Object.fromEntries(conflicts.map((c) => [c.id, pick(rand, ["A", "B", "both"])]));
      expect(hasConflictMarkers(buildMergedText(ops, conflicts, allResolved))).toBe(false);
    }
  });

  test("turning markers off gives the same text the old builder gave", () => {
    const rand = seeded(7);
    for (let round = 0; round < 100; round++) {
      const make = () => Array.from({ length: Math.floor(rand() * 8) }, () => pick(rand, ["x", "y", "z"])).join("\n");
      const ops = diffText(make(), make());
      const conflicts = findConflicts(ops);
      const text = buildMergedText(ops, conflicts, {}, { markers: false });
      expect(hasConflictMarkers(text)).toBe(false);
      const equalOnly = ops.filter((op) => op.type === "equal").map((op) => op.text).join("\n");
      expect(text).toBe(equalOnly);
    }
  });
});
