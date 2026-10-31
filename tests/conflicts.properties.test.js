import { describe, test, expect } from "@jest/globals";
import { findConflicts } from "../src/engine/conflicts.js";
import { diffLines, countChangeRegions } from "../src/engine/diff.js";

// A small seeded random generator, so a failing case can be reproduced exactly.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomLines(next, alphabet = 4, maxLength = 14) {
  const length = Math.floor(next() * (maxLength + 1));
  return Array.from({ length }, () => `line ${Math.floor(next() * alphabet)}`);
}

const CASES = 300;

describe("conflict grouping on random inputs", () => {
  test("the number of conflicts equals the number of change regions", () => {
    const next = rng(1);
    for (let i = 0; i < CASES; i++) {
      const ops = diffLines(randomLines(next), randomLines(next));
      expect(findConflicts(ops)).toHaveLength(countChangeRegions(ops));
    }
  });

  test("ids are 1..n in order", () => {
    const next = rng(2);
    for (let i = 0; i < CASES; i++) {
      const conflicts = findConflicts(diffLines(randomLines(next), randomLines(next)));
      expect(conflicts.map((c) => c.id)).toEqual(conflicts.map((_, index) => index + 1));
    }
  });

  test("the conflicts together with the unchanged lines rebuild both versions exactly", () => {
    const next = rng(3);
    for (let i = 0; i < CASES; i++) {
      const a = randomLines(next);
      const b = randomLines(next);
      const ops = diffLines(a, b);
      const conflicts = findConflicts(ops);

      const rebuiltA = [];
      const rebuiltB = [];
      let cursor = 0;
      for (const c of conflicts) {
        for (; cursor < c.opStart; cursor++) {
          rebuiltA.push(ops[cursor].text);
          rebuiltB.push(ops[cursor].text);
        }
        rebuiltA.push(...c.aLines);
        rebuiltB.push(...c.bLines);
        cursor = c.opEnd;
      }
      for (; cursor < ops.length; cursor++) {
        rebuiltA.push(ops[cursor].text);
        rebuiltB.push(ops[cursor].text);
      }
      expect(rebuiltA).toEqual(a);
      expect(rebuiltB).toEqual(b);
    }
  });

  test("aStart and bStart point at the right lines", () => {
    const next = rng(4);
    for (let i = 0; i < CASES; i++) {
      const a = randomLines(next);
      const b = randomLines(next);
      for (const c of findConflicts(diffLines(a, b))) {
        expect(a.slice(c.aStart - 1, c.aStart - 1 + c.aLines.length)).toEqual(c.aLines);
        expect(b.slice(c.bStart - 1, c.bStart - 1 + c.bLines.length)).toEqual(c.bLines);
      }
    }
  });

  test("conflicts never touch or overlap, and each has at least one line", () => {
    const next = rng(5);
    for (let i = 0; i < CASES; i++) {
      const conflicts = findConflicts(diffLines(randomLines(next), randomLines(next)));
      conflicts.forEach((c, index) => {
        expect(c.aLines.length + c.bLines.length).toBeGreaterThan(0);
        if (index > 0) expect(c.opStart).toBeGreaterThan(conflicts[index - 1].opEnd);
      });
    }
  });

  test("the type matches which sides have lines", () => {
    const next = rng(6);
    for (let i = 0; i < CASES; i++) {
      for (const c of findConflicts(diffLines(randomLines(next), randomLines(next)))) {
        const expected = c.aLines.length && c.bLines.length ? "changed" : c.bLines.length ? "added" : "removed";
        expect(c.type).toBe(expected);
      }
    }
  });
});

describe("conflict grouping on awkward inputs", () => {
  test("blank lines are lines like any other", () => {
    const conflicts = findConflicts(diffLines(["a", "", "b"], ["a", "x", "b"]));
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({ aLines: [""], bLines: ["x"] });
  });

  test("lines that differ only by spaces are different", () => {
    expect(findConflicts(diffLines(["a "], ["a"]))).toHaveLength(1);
  });

  test("a repeated line moved by one place still groups sensibly", () => {
    const conflicts = findConflicts(diffLines(["x", "x", "y"], ["x", "y"]));
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe("removed");
  });

  test("every line different gives a single conflict", () => {
    const conflicts = findConflicts(diffLines(["a", "b", "c"], ["d", "e", "f"]));
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({ aStart: 1, bStart: 1, type: "changed" });
  });

  test("alternating unchanged and changed lines give one conflict per change", () => {
    const a = [];
    const b = [];
    for (let i = 0; i < 50; i++) {
      a.push(`same ${i}`, `left ${i}`);
      b.push(`same ${i}`, `right ${i}`);
    }
    expect(findConflicts(diffLines(a, b))).toHaveLength(50);
  });
});
