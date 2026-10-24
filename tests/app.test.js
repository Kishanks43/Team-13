import { describe, test, expect } from "@jest/globals";
import { createComparer, formatSummary } from "../src/app.js";
import { diffText } from "../src/engine/diff.js";

// A hand-driven timer, so tests can decide exactly when "time passes".
function fakeTimers() {
  const pending = new Map();
  let nextId = 1;
  return {
    setTimer: (fn) => {
      const id = nextId++;
      pending.set(id, fn);
      return id;
    },
    clearTimer: (id) => pending.delete(id),
    pendingCount: () => pending.size,
    fireAll: () => {
      const fns = [...pending.values()];
      pending.clear();
      fns.forEach((fn) => fn());
    },
  };
}

function setup(a, b) {
  const state = { a, b };
  const renders = [];
  const timers = fakeTimers();
  const comparer = createComparer({
    getA: () => state.a,
    getB: () => state.b,
    render: (ops) => renders.push(ops),
    setTimer: timers.setTimer,
    clearTimer: timers.clearTimer,
  });
  return { state, renders, timers, comparer };
}

describe("createComparer", () => {
  test("compare() runs the diff on the current text and renders it", () => {
    const { renders, comparer } = setup("a\nb", "a\nB");
    comparer.compare();
    expect(renders).toHaveLength(1);
    expect(renders[0]).toEqual(diffText("a\nb", "a\nB"));
  });

  test("editing before the first Compare does nothing", () => {
    const { renders, timers, comparer } = setup("a", "b");
    comparer.onEdit();
    expect(timers.pendingCount()).toBe(0);
    expect(renders).toHaveLength(0);
    expect(comparer.isLive()).toBe(false);
  });

  test("after Compare, an edit updates the diff once the user pauses", () => {
    const { state, renders, timers, comparer } = setup("a\nb", "a\nb");
    comparer.compare();
    expect(renders[0].every((op) => op.type === "equal")).toBe(true);

    state.b = "a\nCHANGED";
    comparer.onEdit();
    expect(renders).toHaveLength(1); // not yet: still waiting for a pause
    timers.fireAll();
    expect(renders).toHaveLength(2);
    expect(renders[1]).toEqual(diffText("a\nb", "a\nCHANGED"));
  });

  test("a burst of edits triggers a single re-run", () => {
    const { state, renders, timers, comparer } = setup("a", "a");
    comparer.compare();
    for (const text of ["ab", "abc", "abcd"]) {
      state.b = text;
      comparer.onEdit();
    }
    expect(timers.pendingCount()).toBe(1);
    timers.fireAll();
    expect(renders).toHaveLength(2);
    expect(renders[1]).toEqual(diffText("a", "abcd"));
  });

  test("clicking Compare cancels a waiting re-run", () => {
    const { state, renders, timers, comparer } = setup("a", "a");
    comparer.compare();
    state.b = "x";
    comparer.onEdit();
    comparer.compare();
    expect(timers.pendingCount()).toBe(0);
    expect(renders).toHaveLength(2);
  });

  test("every later edit keeps updating the diff", () => {
    const { state, renders, timers, comparer } = setup("a", "a");
    comparer.compare();
    state.b = "one";
    comparer.onEdit();
    timers.fireAll();
    state.a = "two";
    comparer.onEdit();
    timers.fireAll();
    expect(renders).toHaveLength(3);
    expect(renders[2]).toEqual(diffText("two", "one"));
  });
});

describe("formatSummary", () => {
  test("says so when the versions are identical", () => {
    expect(formatSummary(diffText("a\nb", "a\nb"))).toBe("The two versions are identical.");
    expect(formatSummary(diffText("", ""))).toBe("The two versions are identical.");
  });

  test("counts added, removed and unchanged lines", () => {
    expect(formatSummary(diffText("a\nb\nc", "a\nB\nc\nd"))).toBe("2 lines added, 1 line removed, 2 unchanged");
  });

  test("uses the singular for one line", () => {
    expect(formatSummary(diffText("a", "a\nb"))).toBe("1 line added, 0 lines removed, 1 unchanged");
  });
});
