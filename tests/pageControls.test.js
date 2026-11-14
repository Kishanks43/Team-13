/**
 * @jest-environment jsdom
 *
 * B-02: Samples, Load file, diff view, Prev/Next and keyboard shortcuts are on the page and work.
 */
/* global KeyboardEvent, Event, setTimeout, File, TextEncoder */
import { describe, test, expect, beforeEach } from "@jest/globals";
import { readFileSync } from "node:fs";
import { TextDecoder as NodeTextDecoder, TextEncoder as NodeTextEncoder } from "node:util";
import { init } from "../src/app.js";

// jsdom does not provide these; real browsers do.
globalThis.TextDecoder ??= NodeTextDecoder;
globalThis.TextEncoder ??= NodeTextEncoder;

const PAGE_HTML = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const $ = (id) => document.getElementById(id);

function key(target, k, opts = {}) {
  const event = new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...opts });
  target.dispatchEvent(event);
  return event;
}

describe("B-02 page controls", () => {
  let app;
  beforeEach(() => {
    document.body.innerHTML = PAGE_HTML.slice(PAGE_HTML.indexOf("<body>") + 6, PAGE_HTML.indexOf("<script"));
    app = init(document);
  });

  test("all control ids exist on the page", () => {
    for (const id of [
      "sample-select", "load-sample-btn", "diff-output", "diff-summary", "prev-btn", "next-btn",
      "load-a-btn", "load-b-btn", "file-a", "file-b", "note-a", "note-b"
    ]) {
      expect($(id)).not.toBeNull();
    }
  });

  test("sample select lists every sample and Load sample fills both panes and the diff", () => {
    expect($("sample-select").options.length).toBe(3);
    $("sample-select").value = "separate-edits";
    $("load-sample-btn").click();
    expect($("pane-a").value).toContain("formatPrice");
    expect($("pane-b").value).toContain("checkout");
    expect($("diff-output").querySelector("table.diff-table")).not.toBeNull();
    expect($("diff-summary").textContent).toMatch(/added/);
    expect(app.session.getState().conflicts.length).toBe(2);
  });

  test("Prev and Next move the selected conflict and wrap", () => {
    $("sample-select").value = "separate-edits";
    $("load-sample-btn").click();
    $("next-btn").click();
    expect(app.session.getState().selectedId).toBe(1);
    $("next-btn").click();
    expect(app.session.getState().selectedId).toBe(2);
    $("next-btn").click();
    expect(app.session.getState().selectedId).toBe(1);
    $("prev-btn").click();
    expect(app.session.getState().selectedId).toBe(2);
  });

  test("[ and ] shortcuts navigate, but not while typing in a text box", () => {
    $("sample-select").value = "separate-edits";
    $("load-sample-btn").click();
    key(document.body, "]");
    expect(app.session.getState().selectedId).toBe(1);
    key($("pane-a"), "]");
    expect(app.session.getState().selectedId).toBe(1);
    key(document.body, "[");
    expect(app.session.getState().selectedId).toBe(2);
  });

  test("Ctrl+Z undoes and Ctrl+Shift+Z redoes a resolution", () => {
    $("sample-select").value = "separate-edits";
    $("load-sample-btn").click();
    app.session.resolve(1, "A");
    expect(app.session.canUndo()).toBe(true);
    key(document.body, "z", { ctrlKey: true });
    expect(app.session.getState().resolutions[1]).toBeUndefined();
    key(document.body, "z", { ctrlKey: true, shiftKey: true });
    expect(app.session.getState().resolutions[1]).toBe("A");
  });

  test("Load file puts a text file into the pane and rejects a binary one", async () => {
    const load = async (id, file) => {
      Object.defineProperty($(id), "files", { value: [file], configurable: true });
      $(id).dispatchEvent(new Event("change"));
      await new Promise((r) => setTimeout(r, 20));
    };
    const text = new File(["line1\nline2\n"], "a.js", { type: "text/plain" });
    text.arrayBuffer ??= async () => new TextEncoder().encode("line1\nline2\n").buffer;
    await load("file-a", text);
    expect($("pane-a").value).toBe("line1\nline2\n");
    expect($("note-a").textContent).toContain("a.js");
    expect($("count-a").textContent).toBe("2 lines");

    const bin = new File([""], "x.png");
    bin.arrayBuffer = async () => new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0]).buffer;
    await load("file-b", bin);
    expect($("pane-b").value).toBe("");
    expect($("note-b").textContent).toMatch(/PNG/);
  });
});
