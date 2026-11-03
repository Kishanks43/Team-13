import { describe, test, expect } from "@jest/globals";
import { formatProgress } from "../src/ui/progress.js";

describe("formatProgress", () => {
  test("shows total, resolved and remaining", () => {
    expect(formatProgress({ total: 3, resolved: 1, remaining: 2 })).toBe("3 total · 1 resolved · 2 remaining");
  });

  test("zero conflicts reads exactly 'No conflicts.'", () => {
    expect(formatProgress({ total: 0, resolved: 0, remaining: 0 })).toBe("No conflicts.");
  });

  test("everything resolved", () => {
    expect(formatProgress({ total: 2, resolved: 2, remaining: 0 })).toBe("2 total · 2 resolved · 0 remaining");
  });
});
