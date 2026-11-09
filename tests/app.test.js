/** @jest-environment jsdom */
import { describe, test, expect, beforeEach } from "@jest/globals";
import { init, createComparer, formatSummary } from "../src/app.js";
import { diffText } from "../src/engine/diff.js";
import { loadPage, click, type } from "./helpers.js";

const $ = (id) => document.getElementById(id);

describe("createComparer", () => {
  test("does nothing on edit before the first Compare, then debounces", () => {
    const timers = [];
    let renders = 0;
    const c = createComparer({
      getA: () => "a", getB: () => "b", render: () => renders++,
      setTimer: (fn) => timers.push(fn) && timers.length, clearTimer: () => {}
    });
    c.onEdit();
    expect(timers).toHaveLength(0);
    c.compare();
    c.onEdit();
    expect(timers).toHaveLength(1);
    timers[0]();
    expect(renders).toBe(2);
    expect(c.isLive()).toBe(true);
  });
});

test("formatSummary", () => expect(formatSummary(diffText("a\nb", "a\nc"))).toBe("1 added · 1 removed · 1 unchanged"));

describe("page integration", () => {
  let app;
  beforeEach(() => {
    loadPage();
    app = init(document);
    type($("pane-a"), "1\nx\n2\ny\n3");
    type($("pane-b"), "1\nX\n2\nY\n3");
  });

  test("Compare shows the diff, the summary and the conflict counter", () => {
    click($("compare-btn"));
    expect($("diff-output").querySelector("table")).not.toBeNull();
    expect($("diff-summary").textContent).toBe("2 added · 2 removed · 3 unchanged");
    expect($("conflict-counter").textContent).toBe("2 total · 0 resolved · 2 remaining");
  });

  test("resolving, undo and redo update the counter, the buttons and the merged text", () => {
    click($("compare-btn"));
    click(document.querySelector('button[data-action="A"][data-id="1"]'));
    expect($("conflict-counter").textContent).toBe("2 total · 1 resolved · 1 remaining");
    expect($("undo-btn").disabled).toBe(false);
    click($("undo-btn"));
    expect($("conflict-counter").textContent).toBe("2 total · 0 resolved · 2 remaining");
    expect($("undo-btn").disabled).toBe(true);
    expect($("redo-btn").disabled).toBe(false);
    click($("redo-btn"));
    expect($("conflict-counter").textContent).toBe("2 total · 1 resolved · 1 remaining");
    click(document.querySelector('button[data-action="B"][data-id="2"]'));
    expect($("conflict-counter").textContent).toBe("2 total · 2 resolved · 0 remaining");
    expect($("merged-result").value).toBe("1\nx\n2\nY\n3");
  });

  test("hand edits touch only the merged pane and the note", () => {
    click($("compare-btn"));
    type($("merged-result"), "my own text");
    expect($("pane-a").value).toBe("1\nx\n2\ny\n3");
    expect($("pane-b").value).toBe("1\nX\n2\nY\n3");
    expect($("merge-note").textContent).toMatch(/Edited by hand/);
    expect(app.session.getState().progress.resolved).toBe(0);
    click(document.querySelector('button[data-action="A"][data-id="1"]'));
    expect($("merged-result").value).not.toBe("my own text");
  });

  test("samples are listed and load into both panes with a compare", () => {
    expect($("sample-select").options).toHaveLength(3);
    $("sample-select").value = "same-line-conflict";
    click($("load-sample-btn"));
    expect($("pane-a").value).toContain("RETRIES = 3");
    expect($("pane-b").value).toContain("RETRIES = 5");
    expect(app.session.getState().conflicts).toHaveLength(1);
    expect($("count-a").textContent).toBe("3 lines");
  });

  test("editing after the first Compare schedules a re-compare that resets resolutions", () => {
    loadPage();
    const timers = [];
    const a2 = init(document, { setTimer: (fn) => timers.push(fn) && timers.length, clearTimer: () => {} });
    type($("pane-a"), "a\nb");
    type($("pane-b"), "a\nc");
    click($("compare-btn"));
    click(document.querySelector('button[data-action="A"][data-id="1"]'));
    type($("pane-b"), "a\nd");
    expect(timers).toHaveLength(1);
    expect($("conflict-counter").textContent).toBe("1 total · 1 resolved · 0 remaining");
    timers[0]();
    expect($("conflict-counter").textContent).toBe("1 total · 0 resolved · 1 remaining");
    expect(a2.getOps().some((o) => o.text === "d")).toBe(true);
  });

  test("loading a file fills the pane and shows the file name as text, not HTML", async () => {
    const file = new File(["from file"], "<img src=x onerror=alert(1)>.txt", { type: "text/plain" });
    Object.defineProperty($("file-a"), "files", { value: [file], configurable: true });
    $("file-a").dispatchEvent(new Event("change"));
    await new Promise((r) => setTimeout(r, 50));
    expect($("pane-a").value).toBe("from file");
    expect($("note-a").querySelector("img")).toBeNull();
    expect($("note-a").textContent).toContain("Loaded <img");
    expect($("count-a").textContent).toBe("1 lines");
  });

  test("a bad file leaves the pane alone and explains why", async () => {
    const file = new File([new Uint8Array([0, 1, 2])], "pic.png");
    Object.defineProperty($("file-b"), "files", { value: [file], configurable: true });
    $("file-b").dispatchEvent(new Event("change"));
    await new Promise((r) => setTimeout(r, 50));
    expect($("pane-b").value).toBe("1\nX\n2\nY\n3");
    expect($("note-b").textContent).toMatch(/Could not load pic.png/);
  });
});
