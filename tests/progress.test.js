import { describe, test, expect } from "@jest/globals";
import { formatProgress } from "../src/ui/progress.js";

describe("formatProgress", () => {
  test("shows total, resolved and remaining", () => {
    expect(formatProgress({ total: 3, resolved: 1, remaining: 2 })).toBe("Conflicts: 3 total, 1 resolved, 2 remaining");
  });

  test("shows everything resolved", () => {
    expect(formatProgress({ total: 2, resolved: 2, remaining: 0 })).toBe("Conflicts: 2 total, 2 resolved, 0 remaining");
  });

  test("says so when there are no conflicts", () => {
    expect(formatProgress({ total: 0, resolved: 0, remaining: 0 })).toBe("No conflicts.");
  });
});
