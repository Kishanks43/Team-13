import { describe, test, expect } from "@jest/globals";
import { diffText, countChangeRegions } from "../src/engine/diff.js";
import { findConflicts, findConflictsInText } from "../src/engine/conflicts.js";

describe("findConflicts", () => {
  test("a file with 3 differing regions gives 3 conflicts", () => {
    const a = "one\ntwo\nthree\nfour\nfive\nsix\nseven";
    const b = "ONE\ntwo\nthree\nFOUR\nfive\nsix\nSEVEN";
    const conflicts = findConflictsInText(a, b);
    expect(conflicts).toHaveLength(3);
    expect(conflicts.map((c) => c.id)).toEqual([1, 2, 3]);
  });

  test("identical input gives 0 conflicts", () => {
    expect(findConflictsInText("a\nb", "a\nb")).toEqual([]);
    expect(findConflictsInText("", "")).toEqual([]);
  });

  test("a changed conflict has the exact documented shape", () => {
    const ops = diffText("a\nb\nc", "a\nx\ny\nc");
    expect(findConflicts(ops)).toEqual([
      { id: 1, type: "changed", aStart: 2, bStart: 2, aLines: ["b"], bLines: ["x", "y"], opStart: 1, opEnd: 4 }
    ]);
  });

  test("conflict at the very start and at the very end", () => {
    const start = findConflictsInText("x\nb\nc", "y\nb\nc");
    expect(start[0]).toMatchObject({ aStart: 1, bStart: 1, opStart: 0 });
    const end = findConflictsInText("a\nb\nx", "a\nb\ny");
    expect(end[0]).toMatchObject({ aStart: 3, bStart: 3 });
  });

  test("pure addition: only B has lines, A start is the insertion point", () => {
    const [conflict] = findConflictsInText("a\nc", "a\nb\nc");
    expect(conflict).toMatchObject({ type: "added", aStart: 2, bStart: 2, aLines: [], bLines: ["b"] });
  });

  test("pure deletion: only A has lines, B start is the insertion point", () => {
    const [conflict] = findConflictsInText("a\nb\nc", "a\nc");
    expect(conflict).toMatchObject({ type: "removed", aStart: 2, bStart: 2, aLines: ["b"], bLines: [] });
  });

  test("ops.slice(opStart, opEnd) is exactly the changed ops", () => {
    const ops = diffText("a\nb\nc\nd\ne", "a\nB\nc\nD\nE");
    for (const conflict of findConflicts(ops)) {
      const slice = ops.slice(conflict.opStart, conflict.opEnd);
      expect(slice.every((op) => op.type !== "equal")).toBe(true);
      expect(slice.filter((op) => op.type === "remove").map((op) => op.text)).toEqual(conflict.aLines);
      expect(slice.filter((op) => op.type === "add").map((op) => op.text)).toEqual(conflict.bLines);
    }
  });

  test("conflict count always equals countChangeRegions", () => {
    const pairs = [
      ["a\nb\nc", "a\nb\nc"],
      ["a\nb\nc", "x\ny\nz"],
      ["a\nb\nc\nd", "a\nX\nc\nY"],
      ["", "a\nb"]
    ];
    for (const [a, b] of pairs) {
      const ops = diffText(a, b);
      expect(findConflicts(ops)).toHaveLength(countChangeRegions(ops));
    }
  });
});
