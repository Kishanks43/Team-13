import { describe, test, expect } from "@jest/globals";
import { findConflictsInText } from "../src/engine/conflicts.js";
import { samples } from "../src/samples.js";

describe("findConflicts", () => {
  test("no differences, no conflicts", () => expect(findConflictsInText("a\nb", "a\nb")).toEqual([]));
  test("types and line positions", () => {
    const [c1, c2, c3] = findConflictsInText("a\nb\nc\nd\ne", "a\nB\nc\ne\nf");
    expect(c1).toMatchObject({ id: 1, type: "changed", aStart: 2, bStart: 2, aLines: ["b"], bLines: ["B"] });
    expect(c2).toMatchObject({ id: 2, type: "removed", aStart: 4, aLines: ["d"], bLines: [] });
    expect(c3).toMatchObject({ id: 3, type: "added", aLines: [], bLines: ["f"] });
  });
  test("an addition at the very start points before line 1", () => {
    expect(findConflictsInText("a", "x\na")[0]).toMatchObject({ type: "added", aStart: 1, bStart: 1 });
  });
  test.each(samples)("sample $id has $expectedRegions conflict(s)", (sample) => {
    expect(findConflictsInText(sample.a, sample.b)).toHaveLength(sample.expectedRegions);
  });
});
