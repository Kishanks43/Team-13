import { describe, test, expect } from "@jest/globals";
import { createHistory, DEFAULT_HISTORY_LIMIT } from "../src/engine/history.js";

describe("createHistory", () => {
  test("starts on the initial snapshot with nothing to undo or redo", () => {
    const history = createHistory({});
    expect(history.current()).toEqual({});
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
    expect(history.undo()).toBe(false);
    expect(history.redo()).toBe(false);
  });

  test("records snapshots and undo moves back through them", () => {
    const history = createHistory(0);
    history.record(1);
    history.record(2);
    history.record(3);

    expect(history.undo()).toBe(true);
    expect(history.current()).toBe(2);
    expect(history.undo()).toBe(true);
    expect(history.current()).toBe(1);
    expect(history.undo()).toBe(true);
    expect(history.current()).toBe(0);
    expect(history.canUndo()).toBe(false);
    expect(history.undo()).toBe(false);
  });

  test("redo moves forward again", () => {
    const history = createHistory(0);
    history.record(1);
    history.record(2);
    history.undo();
    history.undo();

    expect(history.redo()).toBe(true);
    expect(history.current()).toBe(1);
    expect(history.redo()).toBe(true);
    expect(history.current()).toBe(2);
    expect(history.canRedo()).toBe(false);
    expect(history.redo()).toBe(false);
  });

  test("a new action after undo clears the redo stack", () => {
    const history = createHistory("start");
    history.record("one");
    history.record("two");
    history.undo();
    expect(history.canRedo()).toBe(true);

    history.record("other");
    expect(history.canRedo()).toBe(false);
    expect(history.current()).toBe("other");
    expect(history.undo()).toBe(true);
    expect(history.current()).toBe("one");
  });

  test("keeps at least 50 steps in the history", () => {
    const history = createHistory(0, { limit: 50 });
    for (let i = 1; i <= 60; i++) history.record(i);

    for (let i = 0; i < 50; i++) expect(history.undo()).toBe(true);
    expect(history.current()).toBe(10);
    expect(history.canUndo()).toBe(false);

    for (let i = 0; i < 50; i++) expect(history.redo()).toBe(true);
    expect(history.current()).toBe(60);
    expect(history.canRedo()).toBe(false);
  });

  test("the default limit is at least 50", () => {
    expect(DEFAULT_HISTORY_LIMIT).toBeGreaterThanOrEqual(50);
  });

  test("clear forgets both stacks and the current snapshot", () => {
    const history = createHistory(0);
    history.record(1);
    history.record(2);
    history.undo();

    history.clear(7);
    expect(history.current()).toBe(7);
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
  });

  test("refuses a limit that is not a positive integer", () => {
    expect(() => createHistory({}, { limit: 0 })).toThrow(RangeError);
    expect(() => createHistory({}, { limit: -1 })).toThrow(RangeError);
    expect(() => createHistory({}, { limit: 1.5 })).toThrow(RangeError);
  });
});
