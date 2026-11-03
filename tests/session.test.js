import { describe, test, expect, jest } from "@jest/globals";
import { diffText } from "../src/engine/diff.js";
import { createSession } from "../src/engine/session.js";

const ops = diffText("a\nb\nc\nd\ne", "a\nB\nc\nD\ne"); // 2 conflicts

describe("createSession", () => {
  test("starts empty", () => {
    const state = createSession().getState();
    expect(state).toEqual({
      conflicts: [],
      resolutions: {},
      progress: { total: 0, resolved: 0, remaining: 0, byStatus: { open: 0, A: 0, B: 0, both: 0, manual: 0 } },
      selectedId: null
    });
  });

  test("load reopens every conflict and clears the selection", () => {
    const session = createSession();
    session.load(ops);
    session.resolve(1, "A");
    session.select(2);
    session.load(ops);
    const state = session.getState();
    expect(state.resolutions).toEqual({});
    expect(state.selectedId).toBeNull();
    expect(state.progress).toMatchObject({ total: 2, resolved: 0, remaining: 2 });
  });

  test("resolve records a decision and the progress follows", () => {
    const session = createSession();
    session.load(ops);
    session.resolve(1, "both");
    expect(session.getState().resolutions).toEqual({ 1: "both" });
    expect(session.getState().progress).toMatchObject({ total: 2, resolved: 1, remaining: 1 });
  });

  test("an unknown conflict id throws RangeError", () => {
    const session = createSession();
    session.load(ops);
    expect(() => session.resolve(9, "A")).toThrow(RangeError);
    expect(() => session.resolve(9, "A")).toThrow("Unknown conflict id: 9");
    expect(() => session.select(7)).toThrow(RangeError);
    expect(() => session.select(7)).toThrow("Unknown conflict id: 7");
  });

  test("an unknown status throws RangeError", () => {
    const session = createSession();
    session.load(ops);
    expect(() => session.resolve(1, "later")).toThrow(RangeError);
    expect(() => session.resolve(1, "later")).toThrow("Unknown resolution status: later");
  });

  test("a failed resolve changes nothing and notifies nobody", () => {
    const session = createSession();
    session.load(ops);
    const listener = jest.fn();
    session.subscribe(listener);
    expect(() => session.resolve(1, "later")).toThrow();
    expect(session.getState().resolutions).toEqual({});
    expect(listener).not.toHaveBeenCalled();
  });

  test("select accepts null for no selection", () => {
    const session = createSession();
    session.load(ops);
    session.select(1);
    expect(session.getState().selectedId).toBe(1);
    session.select(null);
    expect(session.getState().selectedId).toBeNull();
  });

  test("subscribe is called synchronously after every change, and can be undone", () => {
    const session = createSession();
    const seen = [];
    const unsubscribe = session.subscribe((state) => seen.push(state.progress.resolved));
    session.load(ops);
    session.resolve(1, "A");
    expect(seen).toEqual([0, 1]);
    unsubscribe();
    session.resolve(2, "B");
    expect(seen).toEqual([0, 1]);
  });
});
