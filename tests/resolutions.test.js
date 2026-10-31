import { describe, test, expect } from "@jest/globals";
import { STATUSES, createResolutions, getStatus, setStatus, summarizeProgress } from "../src/engine/resolutions.js";

const conflicts = [{ id: 1 }, { id: 2 }, { id: 3 }];

describe("resolutions", () => {
  test("every conflict starts open", () => {
    const res = createResolutions();
    expect(conflicts.map((c) => getStatus(res, c.id))).toEqual(["open", "open", "open"]);
  });

  test("setStatus records a decision without changing the old state", () => {
    const before = createResolutions();
    const after = setStatus(before, 2, "A");
    expect(getStatus(after, 2)).toBe("A");
    expect(getStatus(before, 2)).toBe("open");
  });

  test("setting a conflict back to open removes it", () => {
    const res = setStatus(setStatus(createResolutions(), 1, "B"), 1, "open");
    expect(res).toEqual({});
  });

  test("an unknown status is refused", () => {
    expect(() => setStatus(createResolutions(), 1, "maybe")).toThrow(RangeError);
  });

  test("all five statuses are accepted", () => {
    for (const status of STATUSES) expect(() => setStatus({}, 1, status)).not.toThrow();
  });
});

describe("summarizeProgress", () => {
  test("nothing resolved at the start", () => {
    expect(summarizeProgress(conflicts, createResolutions())).toEqual({
      total: 3,
      resolved: 0,
      remaining: 3,
      byStatus: { open: 3, A: 0, B: 0, both: 0, manual: 0 },
    });
  });

  test("resolved plus remaining always equals total", () => {
    let res = createResolutions();
    res = setStatus(res, 1, "A");
    res = setStatus(res, 3, "both");
    const p = summarizeProgress(conflicts, res);
    expect(p).toMatchObject({ total: 3, resolved: 2, remaining: 1 });
    expect(p.byStatus).toEqual({ open: 1, A: 1, B: 0, both: 1, manual: 0 });
  });

  test("a manual edit counts as resolved", () => {
    const p = summarizeProgress(conflicts, setStatus({}, 2, "manual"));
    expect(p).toMatchObject({ resolved: 1, remaining: 2 });
  });

  test("entries for conflicts that no longer exist are ignored", () => {
    const p = summarizeProgress(conflicts, { 99: "A" });
    expect(p).toMatchObject({ total: 3, resolved: 0, remaining: 3 });
  });

  test("no conflicts gives all zeros", () => {
    expect(summarizeProgress([], {})).toMatchObject({ total: 0, resolved: 0, remaining: 0 });
  });
});
