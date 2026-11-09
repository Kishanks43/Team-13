import { describe, test, expect } from "@jest/globals";
import { STATUSES, createResolutions, getStatus, setStatus, summarizeProgress } from "../src/engine/resolutions.js";
import { createSession } from "../src/engine/session.js";
import { diffText } from "../src/engine/diff.js";
import { findConflicts } from "../src/engine/conflicts.js";

describe("resolutions", () => {
  test("statuses and the open default", () => {
    expect(STATUSES).toEqual(["open", "A", "B", "both", "manual"]);
    expect(getStatus(createResolutions(), 7)).toBe("open");
  });
  test("setStatus returns a new object and never changes the old one", () => {
    const before = createResolutions();
    const after = setStatus(before, 1, "A");
    expect(before).toEqual({});
    expect(after).toEqual({ 1: "A" });
  });
  test("an unknown status throws a RangeError", () => {
    expect(() => setStatus({}, 1, "nope")).toThrow(RangeError);
  });
  test("session.resolve and select throw a RangeError for an unknown id or status", () => {
    const s = createSession();
    s.load(diffText("a", "b"));
    expect(() => s.resolve(99, "A")).toThrow(RangeError);
    expect(() => s.resolve(1, "nope")).toThrow(RangeError);
    expect(() => s.select(99)).toThrow(RangeError);
  });
  test("progress never goes negative or past the total; manual counts as resolved", () => {
    const conflicts = findConflicts(diffText("a\nb\nc", "x\nb\ny"));
    const p = summarizeProgress(conflicts, { 1: "manual", 2: "both", 99: "A" });
    expect(p).toMatchObject({ total: 2, resolved: 2, remaining: 0 });
    expect(p.byStatus).toEqual({ open: 0, A: 0, B: 0, both: 1, manual: 1 });
  });
});
