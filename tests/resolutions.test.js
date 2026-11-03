import { describe, test, expect } from "@jest/globals";
import {
  STATUSES,
  createResolutions,
  getStatus,
  setStatus,
  summarizeProgress
} from "../src/engine/resolutions.js";

const conflicts = [{ id: 1 }, { id: 2 }, { id: 3 }];

describe("resolutions", () => {
  test("lists the five statuses", () => {
    expect([...STATUSES]).toEqual(["open", "A", "B", "both", "manual"]);
  });

  test("a missing id is open", () => {
    expect(getStatus(createResolutions(), 1)).toBe("open");
  });

  test("setStatus returns a new object and leaves the old one alone", () => {
    const before = createResolutions();
    const after = setStatus(before, 1, "A");
    expect(before).toEqual({});
    expect(after).toEqual({ 1: "A" });
    expect(after).not.toBe(before);
  });

  test("an unknown status throws RangeError", () => {
    expect(() => setStatus({}, 1, "later")).toThrow(RangeError);
    expect(() => setStatus({}, 1, "later")).toThrow("Unknown resolution status: later");
  });

  test("summarizeProgress counts totals, resolved, remaining and byStatus", () => {
    let res = createResolutions();
    res = setStatus(res, 1, "A");
    res = setStatus(res, 2, "both");
    expect(summarizeProgress(conflicts, res)).toEqual({
      total: 3,
      resolved: 2,
      remaining: 1,
      byStatus: { open: 1, A: 1, B: 0, both: 1, manual: 0 }
    });
  });

  test("manual counts as resolved", () => {
    const progress = summarizeProgress(conflicts, { 1: "manual" });
    expect(progress.resolved).toBe(1);
    expect(progress.remaining).toBe(2);
  });

  test("ids that are not conflicts never push the counter out of range", () => {
    const progress = summarizeProgress(conflicts, { 99: "A", 100: "B" });
    expect(progress).toMatchObject({ total: 3, resolved: 0, remaining: 3 });
  });
});
