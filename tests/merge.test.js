import { describe, test, expect } from "@jest/globals";
import { diffText } from "../src/engine/diff.js";
import { findConflicts } from "../src/engine/conflicts.js";
import { buildMergedText } from "../src/engine/merge.js";
import { setStatus, createResolutions } from "../src/engine/resolutions.js";
import { samples } from "../src/samples.js";

const setup = (a, b) => {
  const ops = diffText(a, b);
  return { ops, conflicts: findConflicts(ops) };
};
const resolveAll = (conflicts, status) => conflicts.reduce((res, c) => setStatus(res, c.id, status), createResolutions());

describe("merged text for resolved conflicts", () => {
  const { ops, conflicts } = setup("1\nx\n2\ny\n3", "1\nX\n2\nY\n3");

  test("A, B and both", () => {
    expect(buildMergedText(ops, conflicts, resolveAll(conflicts, "A"))).toBe("1\nx\n2\ny\n3");
    expect(buildMergedText(ops, conflicts, resolveAll(conflicts, "B"))).toBe("1\nX\n2\nY\n3");
    expect(buildMergedText(ops, conflicts, resolveAll(conflicts, "both"))).toBe("1\nx\nX\n2\ny\nY\n3");
  });
  test("each conflict can be resolved differently", () => {
    const res = setStatus(setStatus(createResolutions(), 1, "B"), 2, "A");
    expect(buildMergedText(ops, conflicts, res)).toBe("1\nX\n2\ny\n3");
  });
  test("added and removed conflicts", () => {
    const s = setup("a\nb", "a\nb\nc");
    expect(buildMergedText(s.ops, s.conflicts, resolveAll(s.conflicts, "A"))).toBe("a\nb");
    expect(buildMergedText(s.ops, s.conflicts, resolveAll(s.conflicts, "B"))).toBe("a\nb\nc");
  });
  test("manual with stored text uses it", () => {
    const res = setStatus(createResolutions(), 1, "manual");
    expect(buildMergedText(ops, conflicts, setStatus(res, 2, "A"), { 1: ["mine"] })).toBe("1\nmine\n2\ny\n3");
  });
  test("identical inputs merge to the same text", () => {
    const s = setup("a\nb", "a\nb");
    expect(buildMergedText(s.ops, s.conflicts, createResolutions())).toBe("a\nb");
  });
  test.each(samples)("sample $id: resolving everything to B gives version B", (sample) => {
    const s = setup(sample.a, sample.b);
    expect(buildMergedText(s.ops, s.conflicts, resolveAll(s.conflicts, "B"))).toBe(sample.b);
  });
});
