/**
 * Unit tests for src/ui/conflictNav.js
 *
 * S2-07: Next and previous conflict navigation
 * Tests cover: empty list, single conflict, multi-conflict, wrap-around, null selection.
 */

import { describe, test, expect } from "@jest/globals";
import { nextConflictId, prevConflictId } from "../src/ui/conflictNav.js";

// Helper: build a minimal conflicts array from a list of ids.
function makeConflicts(ids) {
  return ids.map((id) => ({ id }));
}

// ---------------------------------------------------------------------------
// nextConflictId
// ---------------------------------------------------------------------------

describe("nextConflictId", () => {
  test("returns null when conflicts is empty", () => {
    expect(nextConflictId([], null)).toBeNull();
    expect(nextConflictId([], 1)).toBeNull();
  });

  test("returns the only conflict when there is one, regardless of selection", () => {
    const conflicts = makeConflicts([1]);
    expect(nextConflictId(conflicts, null)).toBe(1);
    expect(nextConflictId(conflicts, 1)).toBe(1); // wraps to itself
  });

  test("starts at the first conflict when nothing is selected", () => {
    const conflicts = makeConflicts([1, 2, 3]);
    expect(nextConflictId(conflicts, null)).toBe(1);
  });

  test("advances to the next conflict", () => {
    const conflicts = makeConflicts([1, 2, 3]);
    expect(nextConflictId(conflicts, 1)).toBe(2);
    expect(nextConflictId(conflicts, 2)).toBe(3);
  });

  test("wraps around from the last conflict to the first", () => {
    const conflicts = makeConflicts([1, 2, 3]);
    expect(nextConflictId(conflicts, 3)).toBe(1);
  });

  test("treats an unknown selectedId the same as null (starts at index 0)", () => {
    const conflicts = makeConflicts([1, 2, 3]);
    expect(nextConflictId(conflicts, 99)).toBe(1);
  });

  test("does not mutate the conflicts array", () => {
    const conflicts = makeConflicts([1, 2, 3]);
    const copy = [...conflicts];
    nextConflictId(conflicts, 1);
    expect(conflicts).toEqual(copy);
  });
});

// ---------------------------------------------------------------------------
// prevConflictId
// ---------------------------------------------------------------------------

describe("prevConflictId", () => {
  test("returns null when conflicts is empty", () => {
    expect(prevConflictId([], null)).toBeNull();
    expect(prevConflictId([], 1)).toBeNull();
  });

  test("returns the only conflict when there is one, regardless of selection", () => {
    const conflicts = makeConflicts([1]);
    expect(prevConflictId(conflicts, null)).toBe(1);
    expect(prevConflictId(conflicts, 1)).toBe(1); // wraps to itself
  });

  test("starts at the last conflict when nothing is selected", () => {
    const conflicts = makeConflicts([1, 2, 3]);
    expect(prevConflictId(conflicts, null)).toBe(3);
  });

  test("moves to the previous conflict", () => {
    const conflicts = makeConflicts([1, 2, 3]);
    expect(prevConflictId(conflicts, 3)).toBe(2);
    expect(prevConflictId(conflicts, 2)).toBe(1);
  });

  test("wraps around from the first conflict to the last", () => {
    const conflicts = makeConflicts([1, 2, 3]);
    expect(prevConflictId(conflicts, 1)).toBe(3);
  });

  test("treats an unknown selectedId the same as null (starts at last index)", () => {
    const conflicts = makeConflicts([1, 2, 3]);
    expect(prevConflictId(conflicts, 99)).toBe(3);
  });

  test("does not mutate the conflicts array", () => {
    const conflicts = makeConflicts([1, 2, 3]);
    const copy = [...conflicts];
    prevConflictId(conflicts, 2);
    expect(conflicts).toEqual(copy);
  });
});

// ---------------------------------------------------------------------------
// Round-trip: next then prev should return to the start
// ---------------------------------------------------------------------------

describe("next/prev round-trip", () => {
  test("next then prev returns to the original conflict", () => {
    const conflicts = makeConflicts([1, 2, 3]);
    const id = nextConflictId(conflicts, 2); // → 3
    expect(prevConflictId(conflicts, id)).toBe(2); // → back to 2
  });

  test("wrapping next then wrapping prev returns to the original conflict", () => {
    const conflicts = makeConflicts([1, 2, 3]);
    const id = nextConflictId(conflicts, 3); // → 1 (wrapped)
    expect(prevConflictId(conflicts, id)).toBe(3); // → back to 3
  });
});
