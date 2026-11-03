import { describe, test, expect, jest } from "@jest/globals";
import { createComparer, formatSummary, init } from "../src/app.js";
import { diffText } from "../src/engine/diff.js";
import { createFakeDoc, actionClick, selectClick } from "./helpers/fakeDom.js";

describe("createComparer", () => {
  function setup() {
    const timers = new Map();
    let next = 1;
    const render = jest.fn();
    const comparer = createComparer({
      getA: () => "a\nb",
      getB: () => "a\nc",
      render,
      delay: 300,
      setTimer: (fn, ms) => {
        timers.set(next, { fn, ms });
        return next++;
      },
      clearTimer: (id) => timers.delete(id)
    });
    return { comparer, render, timers };
  }

  test("is not live until the first compare", () => {
    const { comparer, render, timers } = setup();
    expect(comparer.isLive()).toBe(false);
    comparer.onEdit();
    expect(timers.size).toBe(0);
    expect(render).not.toHaveBeenCalled();
  });

  test("compare renders the diff ops and goes live", () => {
    const { comparer, render } = setup();
    comparer.compare();
    expect(comparer.isLive()).toBe(true);
    expect(render).toHaveBeenCalledTimes(1);
    expect(render.mock.calls[0][0]).toEqual(diffText("a\nb", "a\nc"));
  });

  test("after the first compare, edits re-run the diff 300 ms later, and only once", () => {
    const { comparer, render, timers } = setup();
    comparer.compare();
    comparer.onEdit();
    comparer.onEdit();
    comparer.onEdit();
    expect(timers.size).toBe(1);
    const [timer] = [...timers.values()];
    expect(timer.ms).toBe(300);
    timer.fn();
    expect(render).toHaveBeenCalledTimes(2);
  });
});

describe("formatSummary", () => {
  test("builds a one-line summary", () => {
    expect(formatSummary(diffText("a\nb\nc", "a\nx\nc"))).toBe("1 added · 1 removed · 2 unchanged");
  });
});

describe("init", () => {
  function setup(a, b) {
    const doc = createFakeDoc();
    const timers = new Map();
    let next = 1;
    const app = init(doc, {
      setTimer: (fn) => {
        timers.set(next, fn);
        return next++;
      },
      clearTimer: (id) => timers.delete(id)
    });
    doc.elements["pane-a"].value = a;
    doc.elements["pane-b"].value = b;
    doc.elements["compare-btn"].dispatch("click");
    return { doc, timers, ...app };
  }

  test("returns the comparer and the session the page uses", () => {
    const { comparer, session } = setup("a", "a");
    expect(typeof comparer.compare).toBe("function");
    expect(typeof session.getState).toBe("function");
  });

  test("Compare finds conflicts and updates the counter and the list", () => {
    const { doc, session } = setup("a\nb\nc", "a\nB\nc");
    expect(session.getState().conflicts).toHaveLength(1);
    expect(doc.elements["conflict-counter"].textContent).toBe("1 total · 0 resolved · 1 remaining");
    expect(doc.elements["conflict-list"].innerHTML).toContain('data-conflict-id="1"');
    expect(doc.elements["merged-result"].value).toBe("a\nc");
  });

  test("identical versions show 'No conflicts.'", () => {
    const { doc } = setup("a\nb", "a\nb");
    expect(doc.elements["conflict-counter"].textContent).toBe("No conflicts.");
    expect(doc.elements["merged-result"].value).toBe("a\nb");
  });

  test("Accept A, B and Both each insert exactly the matching lines", () => {
    const { doc } = setup("top\nA1\nA2\nend", "top\nB1\nend");
    const list = doc.elements["conflict-list"];
    list.dispatch("click", actionClick("A", 1));
    expect(doc.elements["merged-result"].value).toBe("top\nA1\nA2\nend");
    list.dispatch("click", actionClick("B", 1));
    expect(doc.elements["merged-result"].value).toBe("top\nB1\nend");
    list.dispatch("click", actionClick("both", 1));
    expect(doc.elements["merged-result"].value).toBe("top\nA1\nA2\nB1\nend");
    expect(doc.elements["conflict-counter"].textContent).toBe("1 total · 1 resolved · 0 remaining");
  });

  test("clicking a conflict selects it", () => {
    const { doc, session } = setup("a\nb\nc\nd\ne", "a\nB\nc\nD\ne");
    doc.elements["conflict-list"].dispatch("click", selectClick(2));
    expect(session.getState().selectedId).toBe(2);
  });

  test("typing in the merged pane changes only that pane", () => {
    const { doc, session } = setup("a\nb\nc", "a\nB\nc");
    const before = { a: doc.elements["pane-a"].value, b: doc.elements["pane-b"].value };
    const resolutionsBefore = session.getState().resolutions;
    doc.elements["merged-result"].value = "my own text";
    doc.elements["merged-result"].dispatch("input");
    expect(doc.elements["pane-a"].value).toBe(before.a);
    expect(doc.elements["pane-b"].value).toBe(before.b);
    expect(session.getState().resolutions).toBe(resolutionsBefore);
    expect(doc.elements["merged-result"].value).toBe("my own text");
    expect(doc.elements["merge-note"].textContent).toContain("Edited by hand");
  });

  test("editing a pane after Compare re-runs the diff and rebuilds the merged text", () => {
    const { doc, timers } = setup("a\nb", "a\nc");
    doc.elements["pane-b"].value = "a\nb";
    doc.elements["pane-b"].dispatch("input");
    expect(timers.size).toBe(1);
    [...timers.values()][0]();
    expect(doc.elements["conflict-counter"].textContent).toBe("No conflicts.");
    expect(doc.elements["merged-result"].value).toBe("a\nb");
  });

  test("line counts follow the input panes", () => {
    const { doc } = setup("", "");
    doc.elements["pane-a"].value = "x\ny\nz";
    doc.elements["pane-a"].dispatch("input");
    expect(doc.elements["count-a"].textContent).toBe("3 lines");
    expect(doc.elements["count-b"].textContent).toBe("0 lines");
  });
});
