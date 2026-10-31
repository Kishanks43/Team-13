import { describe, test, expect } from "@jest/globals";
import { createSession } from "../src/engine/session.js";
import { diffText } from "../src/engine/diff.js";

const THREE = diffText("one\ntwo\nthree\nfour\nfive\nsix\nseven", "ONE\ntwo\nthree\nFOUR\nfive\nsix\nSEVEN");

function loaded() {
  const session = createSession();
  session.load(THREE);
  return session;
}

describe("createSession", () => {
  test("starts empty", () => {
    expect(createSession().getState().progress).toMatchObject({ total: 0, resolved: 0, remaining: 0 });
  });

  test("load finds the conflicts and opens them all", () => {
    const { conflicts, progress } = loaded().getState();
    expect(conflicts).toHaveLength(3);
    expect(progress).toMatchObject({ total: 3, resolved: 0, remaining: 3 });
  });

  test("resolve changes the counts", () => {
    const session = loaded();
    session.resolve(2, "B");
    expect(session.getState().progress).toMatchObject({ total: 3, resolved: 1, remaining: 2 });
  });

  test("resolve refuses a conflict that does not exist", () => {
    expect(() => loaded().resolve(9, "A")).toThrow(RangeError);
  });

  test("resolve refuses an unknown status", () => {
    expect(() => loaded().resolve(1, "later")).toThrow(RangeError);
  });

  test("loading a new diff reopens everything and clears the selection", () => {
    const session = loaded();
    session.resolve(1, "A");
    session.select(2);
    session.load(THREE);
    const state = session.getState();
    expect(state.progress.resolved).toBe(0);
    expect(state.selectedId).toBeNull();
  });

  test("listeners are called straight away, with the new state", () => {
    const session = loaded();
    const seen = [];
    session.subscribe((state) => seen.push(state.progress.resolved));
    session.resolve(1, "A");
    expect(seen).toEqual([1]); // already called when resolve() returned
    session.resolve(2, "both");
    expect(seen).toEqual([1, 2]);
  });

  test("an unsubscribed listener is not called again", () => {
    const session = loaded();
    let calls = 0;
    const stop = session.subscribe(() => calls++);
    session.resolve(1, "A");
    stop();
    session.resolve(2, "A");
    expect(calls).toBe(1);
  });

  test("select marks one conflict, and null clears it", () => {
    const session = loaded();
    session.select(3);
    expect(session.getState().selectedId).toBe(3);
    session.select(null);
    expect(session.getState().selectedId).toBeNull();
  });

  test("select refuses a conflict that does not exist", () => {
    expect(() => loaded().select(7)).toThrow(RangeError);
  });

  test("states from earlier are not changed by later decisions", () => {
    const session = loaded();
    const earlier = session.getState().resolutions;
    session.resolve(1, "A");
    expect(earlier).toEqual({});
  });

  test("the counter is current within 200 ms even with 1,000 conflicts", () => {
    const a = Array.from({ length: 1000 }, (_, i) => `same ${i}\nleft ${i}`).join("\n");
    const b = Array.from({ length: 1000 }, (_, i) => `same ${i}\nright ${i}`).join("\n");
    const session = createSession();
    session.load(diffText(a, b));
    let shown = null;
    session.subscribe((state) => (shown = state.progress.resolved));
    const start = performance.now();
    session.resolve(500, "A");
    const elapsed = performance.now() - start;
    expect(shown).toBe(1);
    expect(elapsed).toBeLessThan(200);
  });
});
