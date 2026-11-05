import { describe, test, expect } from "@jest/globals";
import { init } from "../src/app.js";
import { createFakeDoc, actionClick, selectClick } from "./helpers/fakeDom.js";

// S3-01: conflicts edited by hand are marked Manual, show a Manual badge and count as resolved.

const A = "top\nA1\nA2\nmid\nA3\nend";
const B = "top\nB1\nmid\nB2\nB3\nend";

function setup(a = A, b = B) {
  const doc = createFakeDoc();
  const app = init(doc, { setTimer: () => 1, clearTimer: () => {} });
  doc.elements["pane-a"].value = a;
  doc.elements["pane-b"].value = b;
  doc.elements["compare-btn"].dispatch("click");
  const merged = doc.elements["merged-result"];
  const list = doc.elements["conflict-list"];
  const typeInMerged = (text) => {
    merged.value = text;
    merged.dispatch("input");
  };
  const status = (id) => app.session.getState().resolutions[id] ?? "open";
  return { doc, app, merged, list, typeInMerged, status };
}

describe("S3-01: manual status", () => {
  test("editing a resolved conflict by hand marks it Manual and keeps the text", () => {
    const { doc, merged, list, typeInMerged, status } = setup();
    list.dispatch("click", actionClick("A", 1));
    typeInMerged(merged.value.replace("A1", "A1 edited"));
    expect(status(1)).toBe("manual");
    expect(status(2)).toBe("open");
    expect(merged.value).toBe("top\nA1 edited\nA2\nmid\nend");
    expect(doc.elements["conflict-list"].innerHTML).toContain("Manual");
    expect(doc.elements["merge-note"].textContent).toContain("Conflict 1 is now Manual");
  });

  test("the counter treats a Manual conflict as resolved", () => {
    const { doc, list, merged, typeInMerged } = setup();
    expect(doc.elements["conflict-counter"].textContent).toBe("2 total · 0 resolved · 2 remaining");
    list.dispatch("click", actionClick("B", 1));
    typeInMerged(`${merged.value}`.replace("B1", "B1 mine"));
    expect(doc.elements["conflict-counter"].textContent).toBe("2 total · 1 resolved · 1 remaining");
  });

  test("typing into a conflict that was still open drops the remaining count", () => {
    const { doc, merged, typeInMerged, status } = setup();
    // Conflict 1 is open and holds no lines. Add a line where it sits.
    typeInMerged(merged.value.replace("top\n", "top\nmy own line\n"));
    expect(status(1)).toBe("manual");
    expect(merged.value).toContain("my own line");
    expect(doc.elements["conflict-counter"].textContent).toBe("2 total · 1 resolved · 1 remaining");
  });

  test("a hand edit survives resolving a different conflict", () => {
    const { merged, list, typeInMerged } = setup();
    list.dispatch("click", actionClick("A", 1));
    typeInMerged(merged.value.replace("A1", "A1 edited"));
    list.dispatch("click", actionClick("B", 2));
    expect(merged.value).toBe("top\nA1 edited\nA2\nmid\nB2\nB3\nend");
  });

  test("choosing Accept on a Manual conflict replaces the hand edit", () => {
    const { merged, list, typeInMerged, status } = setup();
    list.dispatch("click", actionClick("A", 1));
    typeInMerged(merged.value.replace("A1", "A1 edited"));
    list.dispatch("click", actionClick("B", 1));
    expect(status(1)).toBe("B");
    expect(merged.value).toBe("top\nB1\nmid\nend");
  });

  test("selecting a conflict does not wipe a hand edit", () => {
    const { merged, list, typeInMerged } = setup();
    list.dispatch("click", actionClick("A", 1));
    typeInMerged(merged.value.replace("A1", "A1 edited").replace("end", "end of file"));
    list.dispatch("click", selectClick(2));
    expect(merged.value).toBe("top\nA1 edited\nA2\nmid\nend of file");
  });

  test("an edit in unchanged lines marks nothing", () => {
    const { merged, list, typeInMerged, status } = setup();
    list.dispatch("click", actionClick("A", 1));
    typeInMerged(merged.value.replace("top", "TOP"));
    expect(status(1)).toBe("A");
    expect(status(2)).toBe("open");
  });

  test("undo takes a conflict back to its earlier status", () => {
    const { app, merged, list, typeInMerged, status } = setup();
    list.dispatch("click", actionClick("A", 1));
    typeInMerged(merged.value.replace("A1", "A1 edited"));
    expect(app.session.undo()).toBe(true);
    expect(status(1)).toBe("A");
    expect(merged.value).toBe("top\nA1\nA2\nmid\nend");
    expect(app.session.redo()).toBe(true);
    expect(status(1)).toBe("manual");
    expect(merged.value).toBe("top\nA1 edited\nA2\nmid\nend");
  });

  test("an edit across two conflicts marks both Manual", () => {
    const { merged, list, typeInMerged, status } = setup();
    list.dispatch("click", actionClick("A", 1));
    list.dispatch("click", actionClick("A", 2));
    const lines = merged.value.split("\n");
    typeInMerged([lines[0], "one big edit", lines[lines.length - 1]].join("\n"));
    expect(status(1)).toBe("manual");
    expect(status(2)).toBe("manual");
  });

  test("re-comparing starts again: no Manual conflicts and a rebuilt merged text", () => {
    const { merged, list, typeInMerged, status, doc } = setup();
    list.dispatch("click", actionClick("A", 1));
    typeInMerged(merged.value.replace("A1", "A1 edited"));
    doc.elements["compare-btn"].dispatch("click");
    expect(status(1)).toBe("open");
    expect(merged.value).toBe("top\nmid\nend");
  });

  test("the input panes are never touched", () => {
    const { doc, list, merged, typeInMerged } = setup();
    list.dispatch("click", actionClick("A", 1));
    typeInMerged(merged.value.replace("A1", "A1 edited"));
    expect(doc.elements["pane-a"].value).toBe(A);
    expect(doc.elements["pane-b"].value).toBe(B);
  });

  test("a hand edit that makes the text identical to Accept A is still Manual", () => {
    const { merged, list, typeInMerged, status } = setup();
    list.dispatch("click", actionClick("B", 1));
    typeInMerged(merged.value.replace("B1", "A1\nA2"));
    expect(status(1)).toBe("manual");
    expect(merged.value).toBe("top\nA1\nA2\nmid\nend");
  });
});
