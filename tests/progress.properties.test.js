import { describe, test, expect } from "@jest/globals";
import { STATUSES, createResolutions, setStatus, summarizeProgress } from "../src/engine/resolutions.js";
import { createSession } from "../src/engine/session.js";
import { diffText } from "../src/engine/diff.js";
import { formatProgress } from "../src/ui/progress.js";

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

const makeConflicts = (n) => Array.from({ length: n }, (_, i) => ({ id: i + 1 }));

describe("counter on random decisions", () => {
  test("resolved + remaining = total, and nothing is ever negative or above the total", () => {
    const next = rng(11);
    for (let i = 0; i < 300; i++) {
      const conflicts = makeConflicts(Math.floor(next() * 12));
      let res = createResolutions();
      for (let step = 0; step < 20; step++) {
        const id = Math.floor(next() * (conflicts.length + 2)); // sometimes an id that does not exist
        res = setStatus(res, id, STATUSES[Math.floor(next() * STATUSES.length)]);
        const p = summarizeProgress(conflicts, res);
        expect(p.resolved + p.remaining).toBe(p.total);
        expect(p.resolved).toBeGreaterThanOrEqual(0);
        expect(p.remaining).toBeGreaterThanOrEqual(0);
        expect(p.resolved).toBeLessThanOrEqual(p.total);
        expect(Object.values(p.byStatus).reduce((x, y) => x + y, 0)).toBe(p.total);
      }
    }
  });

  test("the counts match a count done by hand", () => {
    const next = rng(12);
    for (let i = 0; i < 200; i++) {
      const conflicts = makeConflicts(10);
      let res = createResolutions();
      const decided = new Map();
      for (let step = 0; step < 15; step++) {
        const id = 1 + Math.floor(next() * 10);
        const status = STATUSES[Math.floor(next() * STATUSES.length)];
        res = setStatus(res, id, status);
        decided.set(id, status);
      }
      const resolvedByHand = [...decided.values()].filter((s) => s !== "open").length;
      expect(summarizeProgress(conflicts, res).resolved).toBe(resolvedByHand);
    }
  });

  test("changing a decision moves the count by exactly one", () => {
    const conflicts = makeConflicts(4);
    let res = setStatus(createResolutions(), 1, "A");
    expect(summarizeProgress(conflicts, res).resolved).toBe(1);
    res = setStatus(res, 1, "B"); // changed their mind: still one resolved
    expect(summarizeProgress(conflicts, res).resolved).toBe(1);
    res = setStatus(res, 1, "open"); // reopened
    expect(summarizeProgress(conflicts, res).resolved).toBe(0);
  });

  test("resolving the same conflict twice with the same status changes nothing", () => {
    const conflicts = makeConflicts(3);
    const once = setStatus(createResolutions(), 2, "both");
    const twice = setStatus(once, 2, "both");
    expect(summarizeProgress(conflicts, twice)).toEqual(summarizeProgress(conflicts, once));
  });
});

describe("session counter end to end", () => {
  const A = "one\ntwo\nthree\nfour\nfive\nsix\nseven";
  const B = "ONE\ntwo\nthree\nFOUR\nfive\nsix\nSEVEN";

  test("resolving every conflict leaves none remaining", () => {
    const session = createSession();
    session.load(diffText(A, B));
    for (const c of session.getState().conflicts) session.resolve(c.id, "A");
    expect(session.getState().progress).toMatchObject({ total: 3, resolved: 3, remaining: 0 });
  });

  test("reopening a conflict brings the count back", () => {
    const session = createSession();
    session.load(diffText(A, B));
    session.resolve(1, "B");
    session.resolve(1, "open");
    expect(session.getState().progress.remaining).toBe(3);
  });

  test("a new comparison resets the counter", () => {
    const session = createSession();
    session.load(diffText(A, B));
    session.resolve(1, "B");
    session.load(diffText(A, B));
    expect(session.getState().progress).toMatchObject({ resolved: 0, remaining: 3 });
  });

  test("comparing identical text shows no conflicts", () => {
    const session = createSession();
    session.load(diffText(A, A));
    expect(formatProgress(session.getState().progress)).toBe("No conflicts.");
  });

  test("a failed resolve leaves the counter untouched and does not notify", () => {
    const session = createSession();
    session.load(diffText(A, B));
    let calls = 0;
    session.subscribe(() => calls++);
    expect(() => session.resolve(42, "A")).toThrow();
    expect(() => session.resolve(1, "nonsense")).toThrow();
    expect(calls).toBe(0);
    expect(session.getState().progress.resolved).toBe(0);
  });

  test("every listener sees every change, in order", () => {
    const session = createSession();
    session.load(diffText(A, B));
    const first = [];
    const second = [];
    session.subscribe((s) => first.push(s.progress.resolved));
    session.subscribe((s) => second.push(s.progress.resolved));
    session.resolve(1, "A");
    session.resolve(2, "B");
    expect(first).toEqual([1, 2]);
    expect(second).toEqual([1, 2]);
  });
});
