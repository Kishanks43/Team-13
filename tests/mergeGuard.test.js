import { describe, test, expect } from "@jest/globals";
import { checkMergeGuard, canApplyMerge } from "../src/engine/mergeGuard.js";
import { hasConflictMarkers, countConflictMarkers } from "../src/engine/merge.js";

describe("hasConflictMarkers and countConflictMarkers", () => {
  test("returns false and 0 for clean text", () => {
    expect(hasConflictMarkers("const a = 1;\nconst b = 2;")).toBe(false);
    expect(countConflictMarkers("const a = 1;\nconst b = 2;")).toBe(0);
  });

  test("detects Git-style conflict start and end markers", () => {
    const text = "<<<<<<< A\nline a\n=======\nline b\n>>>>>>> B";
    expect(hasConflictMarkers(text)).toBe(true);
    expect(countConflictMarkers(text)).toBe(1);
  });

  test("detects multiple conflict marker blocks", () => {
    const text = "<<<<<<< A\n1\n=======\n2\n>>>>>>> B\nmiddle\n<<<<<<< A\n3\n=======\n4\n>>>>>>> B";
    expect(hasConflictMarkers(text)).toBe(true);
    expect(countConflictMarkers(text)).toBe(2);
  });

  test("detects orphan start marker", () => {
    expect(hasConflictMarkers("<<<<<<< A\npartial block")).toBe(true);
  });

  test("detects orphan end marker", () => {
    expect(hasConflictMarkers("partial block\n>>>>>>> B")).toBe(true);
  });

  test("lone ======= line is ignored as a conflict marker", () => {
    expect(hasConflictMarkers("Title\n=======\nText")).toBe(false);
    expect(countConflictMarkers("Title\n=======\nText")).toBe(0);
  });

  test("a source line starting with <<<<<<< is not one of the app's markers", () => {
    const text = "<<<<<<< HEAD\nconst marker = 'source';\n>>>>>>> upstream";
    expect(hasConflictMarkers(text)).toBe(false);
    expect(countConflictMarkers(text)).toBe(0);
  });

  test("still detects the app's own start and end markers", () => {
    expect(hasConflictMarkers("line\n<<<<<<< A\nleft\n=======\nright")).toBe(true);
    expect(hasConflictMarkers("line\nleft\n=======\nright\n>>>>>>> B")).toBe(true);
  });

  test("handles empty or null text safely", () => {
    expect(hasConflictMarkers("")).toBe(false);
    expect(hasConflictMarkers(null)).toBe(false);
    expect(countConflictMarkers("")).toBe(0);
  });
});

describe("checkMergeGuard and canApplyMerge", () => {
  test("blocks when compare has not run yet", () => {
    const res = checkMergeGuard({ hasCompared: false });
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe("Compare versions to begin");
    expect(canApplyMerge({ hasCompared: false })).toBe(false);
  });

  test("blocks when multiple conflicts remain", () => {
    const res = checkMergeGuard({
      hasCompared: true,
      progress: { total: 3, resolved: 1, remaining: 2 },
      mergedText: "some code"
    });
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe("2 conflicts left");
  });

  test("blocks when exactly 1 conflict remains (singular wording)", () => {
    const res = checkMergeGuard({
      hasCompared: true,
      progress: { total: 1, resolved: 0, remaining: 1 },
      mergedText: "some code"
    });
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe("1 conflict left");
  });

  test("blocks when all conflicts resolved in session but conflict markers remain in text", () => {
    const res = checkMergeGuard({
      hasCompared: true,
      progress: { total: 1, resolved: 1, remaining: 0 },
      mergedText: "line 1\n<<<<<<< A\nold\n=======\nnew\n>>>>>>> B\nline 2"
    });
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe("Resolve conflict markers in merged result");
    expect(canApplyMerge({
      hasCompared: true,
      progress: { total: 1, resolved: 1, remaining: 0 },
      mergedText: "line 1\n<<<<<<< A\nold\n=======\nnew\n>>>>>>> B\nline 2"
    })).toBe(false);
  });

  test("allows when all conflicts resolved and no markers remain", () => {
    const res = checkMergeGuard({
      hasCompared: true,
      progress: { total: 2, resolved: 2, remaining: 0 },
      mergedText: "const x = 10;\nconst y = 20;"
    });
    expect(res.allowed).toBe(true);
    expect(res.reason).toBe("Ready to apply merge");
    expect(canApplyMerge({
      hasCompared: true,
      progress: { total: 2, resolved: 2, remaining: 0 },
      mergedText: "const x = 10;\nconst y = 20;"
    })).toBe(true);
  });

  test("blocks when both input panes are empty", () => {
    const res = checkMergeGuard({
      hasCompared: true,
      progress: { total: 0, resolved: 0, remaining: 0 },
      mergedText: "",
      bothPanesEmpty: true
    });
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe("Both panes are empty");
  });

  test("allows when only one input pane is empty", () => {
    const res = checkMergeGuard({
      hasCompared: true,
      progress: { total: 0, resolved: 0, remaining: 0 },
      mergedText: "some code",
      bothPanesEmpty: false
    });
    expect(res.allowed).toBe(true);
  });

  test("allows after resolution even when the source has a <<<<<<< line", () => {
    const res = checkMergeGuard({
      hasCompared: true,
      progress: { total: 1, resolved: 1, remaining: 0 },
      mergedText: "<<<<<<< HEAD\nconst kept = true;\n>>>>>>> upstream"
    });
    expect(res.allowed).toBe(true);
    expect(res.reason).toBe("Ready to apply merge");
  });

  test("allows when identical inputs have 0 total conflicts", () => {
    const res = checkMergeGuard({
      hasCompared: true,
      progress: { total: 0, resolved: 0, remaining: 0 },
      mergedText: "identical file content"
    });
    expect(res.allowed).toBe(true);
    expect(res.reason).toBe("Ready to apply merge");
  });

  test("handles missing options gracefully", () => {
    expect(checkMergeGuard().allowed).toBe(false);
  });
});
