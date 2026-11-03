/**
 * @jest-environment jsdom
 *
 * Integration tests for the resolve flow (S2-10). They mount the real index.html markup,
 * start the page with init(document), then drive it through the controls and the session
 * that init() returns: load a sample, resolve every conflict, undo, redo, and re-compare.
 */
import { describe, test, expect } from "@jest/globals";
import { readFileSync } from "node:fs";
import { init } from "../src/app.js";
import { getSample } from "../src/samples.js";

const PAGE_HTML = readFileSync(new URL("../index.html", import.meta.url), "utf8");

/** Put a fresh copy of the page markup in the document, then wire it up. */
function mountPage() {
  const parsed = new DOMParser().parseFromString(PAGE_HTML, "text/html");
  document.body.innerHTML = parsed.body.innerHTML;
  return init(document);
}

/** Pick a built-in sample and press Load sample. */
function loadSample(id) {
  document.getElementById("sample-select").value = id;
  document.getElementById("load-sample-btn").click();
}

function counterText() {
  return document.getElementById("conflict-counter").textContent;
}

function statusOf(id) {
  const item = document.querySelector(`#conflict-list [data-conflict-id="${id}"]`);
  return item.querySelector(".conflict-status").textContent;
}

function press(target, key, options = {}) {
  target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...options }));
}

describe("resolve flow (integration)", () => {
  test("loads a sample, compares it and shows every conflict", () => {
    const { session } = mountPage();

    loadSample("separate-edits");

    const state = session.getState();
    expect(state.conflicts).toHaveLength(2);
    expect(state.progress).toMatchObject({ total: 2, resolved: 0, remaining: 2 });

    const sample = getSample("separate-edits");
    expect(document.getElementById("pane-a").value).toBe(sample.a);
    expect(document.getElementById("pane-b").value).toBe(sample.b);
    expect(document.getElementById("diff-summary").textContent).not.toBe("");

    expect(counterText()).toBe("Conflicts: 2 total, 0 resolved, 2 remaining");

    const listItems = document.querySelectorAll("#conflict-list [data-conflict-id]");
    expect(listItems).toHaveLength(2);
    expect([...listItems].map((item) => item.querySelector(".conflict-status").textContent)).toEqual([
      "Open",
      "Open",
    ]);

    const diffRows = document.querySelectorAll("#diff-output [data-conflict-id]");
    expect(diffRows).toHaveLength(2);
  });

  test("resolving conflicts updates the counter, the list and the history", () => {
    const { session } = mountPage();
    loadSample("separate-edits");

    session.resolve(1, "A");
    expect(counterText()).toBe("Conflicts: 2 total, 1 resolved, 1 remaining");
    expect(statusOf(1)).toBe("A");
    expect(statusOf(2)).toBe("Open");

    session.resolve(2, "both");
    expect(counterText()).toBe("Conflicts: 2 total, 2 resolved, 0 remaining");
    expect(statusOf(2)).toBe("Both");

    expect(session.getState().progress).toMatchObject({ total: 2, resolved: 2, remaining: 0 });
    expect(session.canUndo()).toBe(true);
  });

  test("resolving every conflict and then re-comparing reopens the flow", () => {
    const { session } = mountPage();
    loadSample("separate-edits");

    for (const conflict of session.getState().conflicts) session.resolve(conflict.id, "A");
    expect(session.getState().progress).toMatchObject({ resolved: 2, remaining: 0 });
    expect(counterText()).toBe("Conflicts: 2 total, 2 resolved, 0 remaining");

    loadSample("separate-edits");
    expect(session.getState().progress).toMatchObject({ resolved: 0, remaining: 2 });
    expect(counterText()).toBe("Conflicts: 2 total, 0 resolved, 2 remaining");
    expect(session.canUndo()).toBe(false);
    expect(statusOf(1)).toBe("Open");
  });

  test("the undo and redo buttons walk back and forth through the whole flow", () => {
    const { session } = mountPage();
    loadSample("separate-edits");

    const undoBtn = document.getElementById("undo-btn");
    const redoBtn = document.getElementById("redo-btn");
    expect(undoBtn.disabled).toBe(true);
    expect(redoBtn.disabled).toBe(true);

    session.resolve(1, "A");
    session.resolve(2, "B");
    expect(session.getState().progress).toMatchObject({ resolved: 2, remaining: 0 });

    undoBtn.click();
    expect(session.getState().progress).toMatchObject({ resolved: 1, remaining: 1 });
    expect(statusOf(2)).toBe("Open");
    expect(redoBtn.disabled).toBe(false);

    redoBtn.click();
    expect(session.getState().progress).toMatchObject({ resolved: 2, remaining: 0 });
    expect(statusOf(2)).toBe("B");

    undoBtn.click();
    undoBtn.click();
    expect(session.getState().progress).toMatchObject({ resolved: 0, remaining: 2 });
    expect(statusOf(1)).toBe("Open");
    expect(statusOf(2)).toBe("Open");
    expect(undoBtn.disabled).toBe(true);
  });

  test("Ctrl+Z and Ctrl+Y undo and redo outside a text field", () => {
    const { session } = mountPage();
    loadSample("same-line-conflict");
    session.resolve(1, "A");

    press(document.body, "z", { ctrlKey: true });
    expect(session.getState().progress).toMatchObject({ resolved: 0, remaining: 1 });
    expect(statusOf(1)).toBe("Open");

    press(document.body, "y", { ctrlKey: true });
    expect(session.getState().progress).toMatchObject({ resolved: 1, remaining: 0 });
    expect(statusOf(1)).toBe("A");
  });

  test("keyboard undo is left alone while the focus is in an input pane", () => {
    const { session } = mountPage();
    loadSample("same-line-conflict");
    session.resolve(1, "A");

    press(document.getElementById("pane-a"), "z", { ctrlKey: true });

    expect(session.getState().progress).toMatchObject({ resolved: 1, remaining: 0 });
    expect(statusOf(1)).toBe("A");
  });
});
