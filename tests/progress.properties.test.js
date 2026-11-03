import { describe, test, expect } from "@jest/globals";
import { diffText } from "../src/engine/diff.js";
import { findConflicts } from "../src/engine/conflicts.js";
import { STATUSES, setStatus, summarizeProgress } from "../src/engine/resolutions.js";
import { formatProgress } from "../src/ui/progress.js";

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe("counter properties", () => {
  test("resolved + remaining always equals total, and never goes negative or past the total", () => {
    const rand = seeded(7);
    const words = ["a", "b", "c", "d"];
    for (let round = 0; round < 200; round++) {
      const make = () => Array.from({ length: Math.floor(rand() * 10) }, () => words[Math.floor(rand() * 4)]).join("\n");
      const conflicts = findConflicts(diffText(make(), make()));
      let res = {};
      for (let step = 0; step < 8 && conflicts.length > 0; step++) {
        const id = conflicts[Math.floor(rand() * conflicts.length)].id;
        res = setStatus(res, id, STATUSES[Math.floor(rand() * STATUSES.length)]);
        const p = summarizeProgress(conflicts, res);
        expect(p.resolved + p.remaining).toBe(p.total);
        expect(p.resolved).toBeGreaterThanOrEqual(0);
        expect(p.remaining).toBeGreaterThanOrEqual(0);
        expect(p.resolved).toBeLessThanOrEqual(p.total);
      }
    }
  });

  test("the formatted text always carries the three numbers, or 'No conflicts.' for zero", () => {
    for (let total = 0; total <= 6; total++) {
      for (let resolved = 0; resolved <= total; resolved++) {
        const text = formatProgress({ total, resolved, remaining: total - resolved });
        if (total === 0) {
          expect(text).toBe("No conflicts.");
        } else {
          expect(text).toBe(`${total} total · ${resolved} resolved · ${total - resolved} remaining`);
        }
      }
    }
  });
});
