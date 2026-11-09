import { describe, test, expect } from "@jest/globals";
import { createSession, HISTORY_LIMIT } from "../src/engine/session.js";
import { diffText } from "../src/engine/diff.js";

const loaded = (a = "1\nx\n2\ny\n3", b = "1\nX\n2\nY\n3") => {
  const s = createSession();
  s.load(diffText(a, b));
  return s;
};

describe("session", () => {
  test("load opens every conflict", () => {
    const s = loaded();
    expect(s.getState().progress).toMatchObject({ total: 2, resolved: 0, remaining: 2 });
    expect(s.canUndo()).toBe(false);
  });
  test("resolve updates progress, selection and notifies once", () => {
    const s = loaded();
    const seen = [];
    s.subscribe((st) => seen.push(st.progress.remaining));
    s.resolve(1, "A");
    expect(seen).toEqual([1]);
    expect(s.getState().selectedId).toBe(1);
  });
  test("unknown id or status throws", () => {
    const s = loaded();
    expect(() => s.resolve(99, "A")).toThrow();
    expect(() => s.resolve(1, "nope")).toThrow();
  });
  test("undo and redo walk the history", () => {
    const s = loaded();
    s.resolve(1, "A");
    s.resolve(2, "B");
    expect(s.undo()).toBe(true);
    expect(s.getState().progress.resolved).toBe(1);
    expect(s.canRedo()).toBe(true);
    expect(s.redo()).toBe(true);
    expect(s.getState().progress.resolved).toBe(2);
    expect(s.redo()).toBe(false);
  });
  test("a new resolve clears redo; same status is a no-op", () => {
    const s = loaded();
    s.resolve(1, "A");
    s.undo();
    s.resolve(2, "B");
    expect(s.canRedo()).toBe(false);
    s.resolve(2, "B");
    s.undo();
    expect(s.getState().progress.resolved).toBe(0);
  });
  test("load clears history", () => {
    const s = loaded();
    s.resolve(1, "A");
    s.load(diffText("a", "b"));
    expect(s.canUndo()).toBe(false);
  });
  test("history is capped", () => {
    const s = loaded();
    for (let i = 0; i < HISTORY_LIMIT + 20; i++) s.resolve(1, i % 2 ? "A" : "B");
    let steps = 0;
    while (s.undo()) steps++;
    expect(steps).toBe(HISTORY_LIMIT);
  });
  test("restore sets resolutions; unsubscribe stops calls", () => {
    const s = loaded();
    let calls = 0;
    const off = s.subscribe(() => calls++);
    s.restore({ 1: "both" });
    expect(s.getState().resolutions).toEqual({ 1: "both" });
    off();
    s.select(2);
    expect(calls).toBe(1);
  });
});
