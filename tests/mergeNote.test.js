import { describe, test, expect } from "@jest/globals";
import { init } from "../src/app.js";
import { createFakeDoc, actionClick, selectClick } from "./helpers/fakeDom.js";

// The note under the Merged Result must never describe a hand edit that is no longer there.

const A = "top\nA1\nA2\nmid\nA3\nend";
const B = "top\nB1\nmid\nB2\nB3\nend";

function setup() {
  const doc = createFakeDoc();
  const app = init(doc, { setTimer: () => 1, clearTimer: () => {} });
  doc.elements["pane-a"].value = A;
  doc.elements["pane-b"].value = B;
  doc.elements["compare-btn"].dispatch("click");
  const merged = doc.elements["merged-result"];
  const note = () => doc.elements["merge-note"].textContent;
  const editConflict1 = () => {
    merged.value = merged.value.replace("A1", "A1 edited");
    merged.dispatch("input");
  };
  return { doc, app, merged, note, editConflict1 };
}

describe("merge note after a hand edit", () => {
  test("says the conflict is Manual right after the edit", () => {
    const { doc, note, editConflict1 } = setup();
    doc.elements["conflict-list"].dispatch("click", actionClick("A", 1));
    editConflict1();
    expect(note()).toContain("Conflict 1 is now Manual");
  });

  test("no longer says Manual after Undo takes the edit away", () => {
    const { doc, app, merged, note, editConflict1 } = setup();
    doc.elements["conflict-list"].dispatch("click", actionClick("A", 1));
    editConflict1();
    app.session.undo();
    expect(merged.value).not.toContain("A1 edited");
    expect(note()).not.toContain("Manual");
    expect(note()).toBe("Merged result updated from your resolutions. Inputs are untouched.");
  });

  test("no longer says Manual after Accept replaces the edit", () => {
    const { doc, note, editConflict1 } = setup();
    doc.elements["conflict-list"].dispatch("click", actionClick("A", 1));
    editConflict1();
    doc.elements["conflict-list"].dispatch("click", actionClick("B", 1));
    expect(note()).not.toContain("Manual");
  });

  test("selecting a conflict keeps the note, because the edit is still there", () => {
    const { doc, merged, note, editConflict1 } = setup();
    doc.elements["conflict-list"].dispatch("click", actionClick("A", 1));
    editConflict1();
    doc.elements["conflict-list"].dispatch("click", selectClick(2));
    expect(merged.value).toContain("A1 edited");
    expect(note()).toContain("Conflict 1 is now Manual");
  });

  test("Redo brings the edit back, and editing again says Manual again", () => {
    const { doc, app, merged, note, editConflict1 } = setup();
    doc.elements["conflict-list"].dispatch("click", actionClick("A", 1));
    editConflict1();
    app.session.undo();
    app.session.redo();
    expect(merged.value).toContain("A1 edited");
    merged.value = merged.value.replace("A2", "A2 again");
    merged.dispatch("input");
    expect(note()).toContain("Conflict 1 is now Manual");
  });

  test("Compare again resets the note", () => {
    const { doc, note, editConflict1 } = setup();
    doc.elements["conflict-list"].dispatch("click", actionClick("A", 1));
    editConflict1();
    doc.elements["compare-btn"].dispatch("click");
    expect(note()).toBe("Comparison complete. Resolve conflicts or edit the merged result.");
  });
});
