/**
 * @jest-environment jsdom
 *
 * Integration tests for the resolve flow (S2-10). They mount the real index.html markup,
 * start the page with init(document), then drive it through the page controls: load a
 * comparison, resolve every conflict, undo and redo, and re-compare.
 */
import { describe, test, expect } from "@jest/globals";
import { readFileSync } from "node:fs";
import { init } from "../src/app.js";

const PAGE_HTML = readFileSync(new URL("../index.html", import.meta.url), "utf8");

const TWO_A = "top\nA1\nmid\nA2\nend";
const TWO_B = "top\nB1\nmid\nB2\nend";

/** Put a fresh copy of the page markup in the document, then wire it up. */
function mountPage() {
  const parsed = new DOMParser().parseFromString(PAGE_HTML, "text/html");
  document.body.innerHTML = parsed.body.innerHTML;
  return init(document);
}

/** Fill both panes and press Compare. */
function compare(a, b) {
  document.getElementById("pane-a").value = a;
  document.getElementById("pane-b").value = b;
  document.getElementById("compare-btn").click();
}

function counterText() {
  return document.getElementById("conflict-counter").textContent;
}

function statusOf(id) {
  const select = document.querySelector(`#conflict-list [data-conflict-id="${id}"]`);
  return select.closest(".conflict-item").querySelector(".status-badge").textContent;
}

function resolveWith(id, action) {
  document.querySelector(`#conflict-list button[data-action="${action}"][data-id="${id}"]`).click();
}

describe("resolve flow (integration)", () => {
  test("loads two versions, compares them and shows every conflict", () => {
    const { session } = mountPage();

    compare(TWO_A, TWO_B);

    const state = session.getState();
    expect(state.conflicts).toHaveLength(2);
    expect(state.progress).toMatchObject({ total: 2, resolved: 0, remaining: 2 });

    expect(document.getElementById("pane-a").value).toBe(TWO_A);
    expect(document.getElementById("pane-b").value).toBe(TWO_B);
    expect(counterText()).toBe("2 total · 0 resolved · 2 remaining");

    const items = document.querySelectorAll("#conflict-list .conflict-item");
    expect(items).toHaveLength(2);
    expect(statusOf(1)).toBe("Open");
    expect(statusOf(2)).toBe("Open");
    expect(document.getElementById("merged-result").value).toBe(
      "top\n<<<<<<< A\nA1\n=======\nB1\n>>>>>>> B\nmid\n<<<<<<< A\nA2\n=======\nB2\n>>>>>>> B\nend"
    );

    expect(document.getElementById("undo-btn").disabled).toBe(true);
    expect(document.getElementById("redo-btn").disabled).toBe(true);
  });

  test("Accept A, B and Both resolve conflicts and rebuild the merged result", () => {
    const { session } = mountPage();
    compare(TWO_A, TWO_B);

    resolveWith(1, "A");
    expect(counterText()).toBe("2 total · 1 resolved · 1 remaining");
    expect(statusOf(1)).toBe("A");
    expect(statusOf(2)).toBe("Open");
    expect(document.getElementById("merged-result").value).toBe(
      "top\nA1\nmid\n<<<<<<< A\nA2\n=======\nB2\n>>>>>>> B\nend"
    );

    resolveWith(2, "both");
    expect(counterText()).toBe("2 total · 2 resolved · 0 remaining");
    expect(statusOf(2)).toBe("Both");
    expect(document.getElementById("merged-result").value).toBe("top\nA1\nmid\nA2\nB2\nend");

    expect(session.getState().progress).toMatchObject({ total: 2, resolved: 2, remaining: 0 });
    expect(document.getElementById("undo-btn").disabled).toBe(false);
    expect(document.getElementById("redo-btn").disabled).toBe(true);

    expect(document.getElementById("pane-a").value).toBe(TWO_A);
    expect(document.getElementById("pane-b").value).toBe(TWO_B);
  });

  test("undo and redo buttons walk back and forth through the resolve flow", () => {
    mountPage();
    compare(TWO_A, TWO_B);

    const undoBtn = document.getElementById("undo-btn");
    const redoBtn = document.getElementById("redo-btn");
    const merged = document.getElementById("merged-result");

    resolveWith(1, "A");
    resolveWith(2, "B");
    expect(merged.value).toBe("top\nA1\nmid\nB2\nend");
    expect(undoBtn.disabled).toBe(false);

    undoBtn.click();
    expect(counterText()).toBe("2 total · 1 resolved · 1 remaining");
    expect(statusOf(2)).toBe("Open");
    expect(merged.value).toBe("top\nA1\nmid\n<<<<<<< A\nA2\n=======\nB2\n>>>>>>> B\nend");
    expect(redoBtn.disabled).toBe(false);

    undoBtn.click();
    expect(counterText()).toBe("2 total · 0 resolved · 2 remaining");
    expect(statusOf(1)).toBe("Open");
    expect(merged.value).toBe(
      "top\n<<<<<<< A\nA1\n=======\nB1\n>>>>>>> B\nmid\n<<<<<<< A\nA2\n=======\nB2\n>>>>>>> B\nend"
    );
    expect(undoBtn.disabled).toBe(true);

    redoBtn.click();
    redoBtn.click();
    expect(counterText()).toBe("2 total · 2 resolved · 0 remaining");
    expect(statusOf(1)).toBe("A");
    expect(statusOf(2)).toBe("B");
    expect(merged.value).toBe("top\nA1\nmid\nB2\nend");
    expect(redoBtn.disabled).toBe(true);
  });

  test("re-comparing reopens every conflict and clears the history", () => {
    const { session } = mountPage();
    compare(TWO_A, TWO_B);
    resolveWith(1, "A");
    resolveWith(2, "B");
    expect(session.getState().progress.remaining).toBe(0);

    document.getElementById("compare-btn").click();

    expect(session.getState().progress).toMatchObject({ total: 2, resolved: 0, remaining: 2 });
    expect(counterText()).toBe("2 total · 0 resolved · 2 remaining");
    expect(statusOf(1)).toBe("Open");
    expect(statusOf(2)).toBe("Open");
    expect(document.getElementById("undo-btn").disabled).toBe(true);
    expect(document.getElementById("redo-btn").disabled).toBe(true);
  });
});
